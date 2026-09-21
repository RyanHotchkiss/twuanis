#!/usr/bin/env python3
"""Disposable S5 fixture only. Independent sessions; actual blocking PID evidence."""
import argparse,json,os,pathlib,select,subprocess,time,uuid
ap=argparse.ArgumentParser();ap.add_argument('--socket',required=True);ap.add_argument('--port',required=True);ap.add_argument('--pg-bin',default='/opt/homebrew/opt/postgresql@17/bin');a=ap.parse_args()
socket=pathlib.Path(a.socket).resolve()
if not socket.is_dir() or not str(socket).startswith('/private/tmp/'):raise SystemExit('disposable Unix socket required')
env={k:v for k,v in os.environ.items() if not k.startswith('PG')}
base=[str(pathlib.Path(a.pg_bin)/'psql'),'-X','-qAt','-h',str(socket),'-p',a.port,'-U','postgres','-d','cg_s5_verification','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose']
def sql(q):
 r=subprocess.run(base+['-c',q],env=env,text=True,capture_output=True,timeout=15)
 assert r.returncode==0,(q,r.stderr)
 return r.stdout.strip()
assert sql("SELECT current_database()='cg_s5_verification' AND inet_server_addr() IS NULL AND session_user='postgres'")=='t'
def literal(v):return "'"+str(v).replace("'","''")+"'"
def uid(n):return f'00000000-0000-0000-0000-{n:012d}'
def pkg(n):return f'96000000-0000-0000-0000-{n:012d}'
def purchase(owner,package):return sql("INSERT INTO purchase_requests(owner_id,product_type,status,package_id) VALUES ("+literal(uid(owner))+",'package','approved',"+literal(pkg(package))+") RETURNING id")
def activate(p):return "public.activate_purchase("+literal(p)+")"
def draft(owner):
 d={'transaction':'sale','geography':{'province':'3','canton':'304'},'semantics':{'property_type':['1']},'money':{'amount':'1','currency':'USD'}}
 return json.loads(sql("BEGIN;SELECT set_config('request.jwt.claim.sub',"+literal(uid(owner))+",true);SELECT public.create_customer_canonical_listing("+literal(str(uuid.uuid4()))+","+literal(json.dumps(d))+"::jsonb);COMMIT").splitlines()[-1])['listing_id']
def life(l,ev='publish'):
 r=sql("SELECT canonical_revision FROM listings WHERE id="+literal(l));d={'lifecycle':{'event':ev,'duration_seconds':'3600'}}
 return 'public.mutate_trusted_canonical_listing('+literal(l)+','+r+','+literal(str(uuid.uuid4()))+','+literal(json.dumps(d))+"::jsonb)"
def pay(owner,package):return sql("BEGIN;SELECT set_config('request.jwt.claim.sub',"+literal(uid(owner))+",true);SELECT payment_id FROM public.create_subscription_upgrade_request("+literal(pkg(package))+",'CRC','REF','Sender');COMMIT").splitlines()[-1]
def reviewer(first=False):return ("PERFORM" if first else "SELECT")+" set_config('request.jwt.claim.sub',"+literal(uid(599))+",true);"
def approval(payment):return 'public.approve_sinpe_payment('+literal(payment)+')'
def active(owner):return sql("SELECT count(*) FROM user_subscriptions WHERE user_id="+literal(uid(owner))+" AND status='active'")
results=[]
def race(label,firstsql,secondsql,wait=True,error=None):
 name='s5_' +str(len(results));workers=[];firstpid=None;evidence=None
 try:
  first=subprocess.Popen(base,env=env,text=True,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,bufsize=1);workers.append(first)
  first.stdin.write("SET statement_timeout='12s';SET deadlock_timeout='100ms';BEGIN;DO $s4$ BEGIN "+firstsql+"; END $s4$;SELECT 'READY:'||pg_backend_pid();\n");first.stdin.flush()
  assert select.select([first.stdout],[],[],12)[0],label+' first timeout'
  barrier=first.stdout.readline().strip();assert barrier.startswith('READY:'),(label,barrier,first.stderr.read() if first.poll() is not None else '')
  firstpid=int(barrier.split(':')[1])
  second=subprocess.Popen(base+['-c',f"SET application_name='{name}';SET statement_timeout='12s';SET deadlock_timeout='100ms';BEGIN;{secondsql};COMMIT"],env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);workers.append(second)
  if wait:
   for _ in range(150):
    evidence=sql(f"SELECT json_build_object('pid',pid,'wait',wait_event,'blockers',pg_blocking_pids(pid)) FROM pg_stat_activity WHERE application_name='{name}' AND wait_event_type='Lock' AND {firstpid}=ANY(pg_blocking_pids(pid))")
    if evidence:break
    if second.poll() is not None:break
    time.sleep(.02)
   assert evidence,(label,'actual blocker not observed')
  else:
   out,err=second.communicate(timeout=5);assert second.returncode==0,(label,err)
  first.stdin.write('COMMIT;\n\\q\n');first.stdin.flush();first.wait(timeout=10);assert first.returncode==0,(label,first.stderr.read())
  if wait:out,err=second.communicate(timeout=12)
  if error:assert second.returncode!=0 and error in err,(label,err,out)
  else:assert second.returncode==0,(label,err)
  results.append({'case':label,'actual_block':json.loads(evidence) if evidence else None,'second_before_first_commit':not wait,'expected_error':error});print('PASS '+label,flush=True)
  return out.strip()
 finally:
  for w in workers:
   if w.poll() is None:w.terminate();w.wait(timeout=10)
assert sql("SELECT count(*) FROM auth.users WHERE id="+literal(uid(601)))=='0','fresh concurrency fixture required'
sql("INSERT INTO auth.users(id) SELECT ('00000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid FROM generate_series(599,620)n")
a=draft(601);sql('SELECT '+life(a));b=draft(601);p=purchase(601,2)
race('replacement increase then publication sees new allowance','PERFORM '+activate(p),'SELECT '+life(b))
assert sql("SELECT count(*) FROM listings WHERE owner_id="+literal(uid(601))+" AND listing_status='active'")=='2'
a=draft(602);sql('SELECT '+life(a));b=draft(602);p=purchase(602,6)
race('replacement decrease then publication rejects','PERFORM '+activate(p),'SELECT '+life(b),error='23514')
assert sql("SELECT listing_status FROM listings WHERE id="+literal(a))=='active'
a=draft(603);p=purchase(603,6)
race('publication then replacement waits safely','PERFORM '+life(a),'SELECT * FROM '+activate(p))
assert sql("SELECT listing_status FROM listings WHERE id="+literal(a))=='active'
p=purchase(604,3);l=draft(605)
race('different publisher commercial and publication independent','PERFORM '+activate(p),'SELECT '+life(l),wait=False)
p=purchase(606,3);q=purchase(607,2)
race('different publisher commercial changes independent','PERFORM '+activate(p),'SELECT * FROM '+activate(q),wait=False)
p=purchase(608,2)
race('same purchase concurrent activation once','PERFORM '+activate(p),'SELECT * FROM '+activate(p),error='P0001')
assert sql("SELECT count(*) FROM user_subscriptions WHERE purchase_request_id="+literal(p))=='1'
p=purchase(609,3);q=purchase(609,2);publisher=sql("SELECT id FROM publisher_accounts WHERE owner_user_id="+literal(uid(609)))
race('same publisher distinct purchases serialize','PERFORM '+activate(p),'SELECT * FROM '+activate(q))
assert active(609)=='1' and sql("SELECT id FROM publisher_accounts WHERE owner_user_id="+literal(uid(609)))==publisher
a=draft(610);sql('SELECT '+life(a));b=draft(610);p=pay(610,2)
race('SINPE approval then publication sees entitlement',reviewer(True)+'PERFORM '+approval(p),'SELECT '+life(b))
assert sql("SELECT count(*) FROM listings WHERE owner_id="+literal(uid(610))+" AND listing_status='active'")=='2'
a=draft(611);p=pay(611,6)
race('publication then SINPE approval waits','PERFORM '+life(a),reviewer()+'SELECT * FROM '+approval(p))
assert sql("SELECT listing_status FROM listings WHERE id="+literal(a))=='active'
p=pay(612,3);l=draft(612)
race('pending SINPE rejection does not lock publisher',reviewer(True)+'PERFORM public.reject_sinpe_payment('+literal(p)+",'reason')",'SELECT '+life(l),wait=False)
p=purchase(613,2)
race('exclusive policy guard blocks commercial shared entry','PERFORM twuanis_canonical_private.lock_capacity_policy(true)','SELECT * FROM '+activate(p))
p=purchase(614,2)
race('commercial shared entry blocks exclusive policy guard','PERFORM '+activate(p),'SELECT twuanis_canonical_private.lock_capacity_policy(true)')
# Existing source identity is read before a publisher wait and must be revalidated.
p=purchase(615,2)
race('purchase owner change while waiting fails closed',"PERFORM twuanis_canonical_private.resolve_publisher("+literal(uid(615))+");UPDATE public.purchase_requests SET owner_id="+literal(uid(616))+" WHERE id="+literal(p),'SELECT * FROM '+activate(p),error='40001')
assert sql("SELECT count(*) FROM user_subscriptions WHERE purchase_request_id="+literal(p))=='0'
# Duplicate auth identity insertion cannot leave a duplicate default subscription/publisher.
race('concurrent same signup identity creates one publisher',"INSERT INTO auth.users(id) VALUES("+literal(uid(630))+")","INSERT INTO auth.users(id) VALUES("+literal(uid(630))+")",error='23505')
assert sql("SELECT count(*) FROM publisher_accounts WHERE owner_user_id="+literal(uid(630)))=='1'
assert active(630)=='1'
print(json.dumps(results,indent=2));print('S5 CONCURRENCY PASSED:',len(results),'cases')
