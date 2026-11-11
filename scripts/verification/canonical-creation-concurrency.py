#!/usr/bin/env python3
"""Disposable S4 fixture only. Independent sessions; actual blocking PID evidence."""
import argparse,json,os,pathlib,select,subprocess,time,uuid
ap=argparse.ArgumentParser();ap.add_argument('--socket',required=True);ap.add_argument('--port',required=True);ap.add_argument('--pg-bin',default='/opt/homebrew/opt/postgresql@17/bin');a=ap.parse_args()
socket=pathlib.Path(a.socket).resolve()
if not socket.is_dir() or not str(socket).startswith('/private/tmp/'):raise SystemExit('disposable Unix socket required')
env={k:v for k,v in os.environ.items() if not k.startswith('PG')}
base=[str(pathlib.Path(a.pg_bin)/'psql'),'-X','-qAt','-h',str(socket),'-p',a.port,'-U','postgres','-d','cg_s4_verification','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose']
def sql(q):
 r=subprocess.run(base+['-c',q],env=env,text=True,capture_output=True,timeout=15)
 assert r.returncode==0,(q,r.stderr)
 return r.stdout.strip()
assert sql("SELECT current_database()='cg_s4_verification' AND inet_server_addr() IS NULL AND session_user='postgres'")=='t'
def literal(v):return "'"+str(v).replace("'","''")+"'"
def uid(n):return f'00000000-0000-0000-0000-{n:012d}'
def customer(owner,request=None,payload=None):
 d=payload or {'transaction':'sale','geography':{'province':'3','canton':'304'},'semantics':{'property_type':['1']}}
 return "public.create_customer_canonical_listing("+literal(request or str(uuid.uuid4()))+","+literal(json.dumps(d))+"::jsonb)"
def context(owner):return "SELECT set_config('request.jwt.claim.sub',"+literal(uid(owner))+",true);"
def first(owner,c):return "PERFORM set_config('request.jwt.claim.sub',"+literal(uid(owner))+",true);PERFORM "+c
payload={'transaction':'sale','geography':{'province':'3','canton':'304'},'semantics':{'property_type':['1']}}
def trusted(request=None,source=None,p=None):return 'public.create_trusted_canonical_listing('+literal(request or str(uuid.uuid4()))+','+literal(json.dumps(p or payload))+"::jsonb,"+('NULL' if source is None else literal(json.dumps(source))+"::jsonb")+')'
def mutate(listing,amount,expected=1,request=None,owner=False):
 return ('public.mutate_customer_canonical_listing' if owner else 'public.mutate_trusted_canonical_listing')+'('+literal(listing)+','+str(expected)+','+literal(request or str(uuid.uuid4()))+','+literal(json.dumps({'money':{'amount':str(amount),'currency':'USD'}}))+"::jsonb)"
def created(owner):return json.loads(sql('BEGIN;'+context(owner)+'SELECT '+customer(owner,payload={**payload,'money':{'amount':'1','currency':'USD'}})+';COMMIT').splitlines()[-1])['listing_id']
def published(listing):return 'public.mutate_trusted_canonical_listing('+literal(listing)+',1,'+literal(str(uuid.uuid4()))+",'{\"lifecycle\":{\"event\":\"publish\",\"duration_seconds\":\"3600\"}}'::jsonb)"
results=[]
def race(label,firstsql,secondsql,wait=True,error=None):
 name='s4_' +str(len(results));workers=[];firstpid=None;evidence=None
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
# Fresh test identities make the script fail closed rather than reusing mutated cases.
assert sql("SELECT count(*) FROM auth.users WHERE id::text BETWEEN '00000000-0000-0000-0000-000000000401' AND '00000000-0000-0000-0000-000000000410'")=='0','fresh S4 concurrency fixture required'
sql("INSERT INTO auth.users(id) SELECT ('00000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid FROM generate_series(401,410)n")
race('same customer provisioning distinct drafts',first(401,customer(401)),context(401)+'SELECT '+customer(401))
assert sql("SELECT count(DISTINCT publisher_account_id)||':'||count(*) FROM listings WHERE owner_id='"+uid(401)+"'")=='1:2'
assert sql("SELECT count(*) FROM publisher_accounts WHERE owner_user_id='"+uid(401)+"'")=='1'
r=str(uuid.uuid4());c=customer(402,r)
out=race('same customer same request one listing',first(402,c),context(402)+'SELECT '+c)
assert json.loads(out.splitlines()[-1])['replayed']
assert sql("SELECT count(*) FROM listings WHERE owner_id='"+uid(402)+"'")=='1'
r=str(uuid.uuid4())
race('same creation key changed payload conflict',first(403,customer(403,r)),context(403)+'SELECT '+customer(403,r,{**payload,'transaction':'rent'}),error='22023')
assert sql("SELECT count(*) FROM listings WHERE owner_id='"+uid(403)+"'")=='1'
race('different customers independent',first(404,customer(404)),context(405)+'SELECT '+customer(405),wait=False)
src={'source_name':'s4-concurrency','source_listing_id':'raw/001','observation_id':'obs1','observed_at':'2026-09-16T00:00:00Z','source_type':'realtor'}
out=race('same source appearance same observation one listing','PERFORM '+trusted(source=src),'SELECT '+trusted(source=src))
assert json.loads(out)['replayed']
assert sql("SELECT count(*) FROM listings WHERE source_name='s4-concurrency' AND source_listing_id='raw/001'")=='1'
assert sql("SELECT count(*) FROM listing_source_observations WHERE source_name='s4-concurrency' AND source_listing_id='raw/001'")=='1'
src2={**src,'source_listing_id':'raw/002'}
race('same source new observation routes without duplicate','PERFORM '+trusted(source=src2),'SELECT '+trusted(source={**src2,'observation_id':'obs2'}),error='55000')
assert sql("SELECT count(*) FROM listings WHERE source_name='s4-concurrency' AND source_listing_id='raw/002'")=='1'
src3={**src,'source_listing_id':'raw/003'}
race('same observation changed payload fails','PERFORM '+trusted(source=src3),'SELECT '+trusted(source=src3,p={**payload,'transaction':'rent'}),error='22023')
l=created(406)
race('owner versus trusted stale mutation',first(406,mutate(l,10,owner=True)),'SELECT '+mutate(l,20),error='40001')
assert sql("SELECT canonical_revision||':'||current_price FROM listings WHERE id="+literal(l))=='2:10'
# Last-slot capacity race through the actual trusted controlled boundary.
sql("INSERT INTO user_subscriptions(user_id,package_id,status,billing_cycle) VALUES ('"+uid(407)+"','90000000-0000-0000-0000-000000000001','active','monthly'),('"+uid(408)+"','90000000-0000-0000-0000-000000000001','active','monthly'),('"+uid(409)+"','90000000-0000-0000-0000-000000000001','active','monthly')")
sql("UPDATE package_limits SET listing_limit=1 WHERE package_id='90000000-0000-0000-0000-000000000001'")
l1=created(407);l2=created(407)
race('same publisher last slot serialized','PERFORM '+published(l1),'SELECT '+published(l2),error='23514')
assert sql("SELECT count(*) FROM listings WHERE owner_id='"+uid(407)+"' AND listing_status='active'")=='1'
l3=created(408);l4=created(409)
race('different publisher publications independent','PERFORM '+published(l3),'SELECT '+published(l4),wait=False)
# Ownerless receipt coordination is directly observable without publisher locking.
r=str(uuid.uuid4());c=trusted(r)
out=race('ownerless same-request receipt coordination','PERFORM '+c,'SELECT '+c)
assert json.loads(out)['replayed'] and results[-1]['actual_block']['wait']=='advisory'
race('creation holds shared policy guard','PERFORM '+trusted(),'SELECT twuanis_canonical_private.lock_capacity_policy(true)')
# Visibility: a coherent but uncommitted creation is invisible to other sessions.
r=str(uuid.uuid4())
race('uncommitted creation remains invisible',first(410,customer(410,r)),"DO $$ BEGIN IF EXISTS(SELECT 1 FROM public.listings WHERE owner_id='"+uid(410)+"') OR EXISTS(SELECT 1 FROM public.canonical_operation_receipts WHERE request_id='"+r+"') THEN RAISE EXCEPTION 'partial visibility'; END IF; END $$",wait=False)
assert sql("SELECT count(*) FROM listings WHERE owner_id='"+uid(410)+"' AND canonical_domain_version=1 AND listing_status='draft'")=='1'
print(json.dumps(results,indent=2));print('S4 CONCURRENCY PASSED:',len(results),'cases')
