#!/usr/bin/env python3
"""Disposable S3 fixture only. Independent sessions; actual blocking PID evidence."""
import argparse,json,os,pathlib,select,subprocess,time,uuid
ap=argparse.ArgumentParser();ap.add_argument('--socket',required=True);ap.add_argument('--port',required=True);ap.add_argument('--pg-bin',default='/opt/homebrew/opt/postgresql@17/bin');a=ap.parse_args()
socket=pathlib.Path(a.socket).resolve()
if not socket.is_dir() or not str(socket).startswith('/private/tmp/'):raise SystemExit('disposable Unix socket required')
env={k:v for k,v in os.environ.items() if not k.startswith('PG')}
base=[str(pathlib.Path(a.pg_bin)/'psql'),'-X','-qAt','-h',str(socket),'-p',a.port,'-U','postgres','-d','cg_s3_verification','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose']
def sql(q):
 r=subprocess.run(base+['-c',q],env=env,text=True,capture_output=True,timeout=15)
 assert r.returncode==0,(q,r.stderr)
 return r.stdout.strip()
assert sql("SELECT current_database()='cg_s3_verification' AND inet_server_addr() IS NULL AND session_user='postgres'")=='t'
ns='twuanis_canonical_private.'
def literal(v):return "'"+str(v).replace("'","''")+"'"
def lid(n):return f'70000000-0000-0000-0000-{n:012d}'
def rev(n):return int(sql(f"SELECT canonical_revision FROM listings WHERE id='{lid(n)}'"))
def cmd(n,d,expected=None,request=None,src=None):
 owner=sql(f"SELECT coalesce(owner_id::text,'') FROM listings WHERE id='{lid(n)}'")
 kind='trusted' if src or not owner else 'owner';actor='fixture-source' if kind=='trusted' else owner
 return ns+'s3_command('+','.join([literal(lid(n)),str(rev(n) if expected is None else expected),literal(kind),literal(actor),literal(request or str(uuid.uuid4())),literal(json.dumps(d))+'::jsonb','NULL' if src is None else literal(json.dumps(src))+'::jsonb'])+')'
def money(n,v,**kw):return cmd(n,{'money':{'amount':str(v),'currency':'USD'}},**kw)
results=[]
def race(label,firstsql,secondsql,wait=True,error=None):
 name='s3a_'+str(len(results));workers=[];firstpid=None;evidence=None
 try:
  first=subprocess.Popen(base,env=env,text=True,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,bufsize=1);workers.append(first)
  first.stdin.write("SET statement_timeout='12s';SET deadlock_timeout='100ms';BEGIN;DO $s3$ BEGIN "+firstsql+"; END $s3$;SELECT 'READY:'||pg_backend_pid();\n");first.stdin.flush()
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
assert rev(1)==0 and rev(3)==0,'fresh S3 fixture required'
race('same-listing stale writers','PERFORM '+money(1,20,expected=0),'SELECT '+money(1,30,expected=0),error='40001')
assert rev(1)==1
race('different-publisher commands','PERFORM '+money(1,21),'SELECT '+money(2,40),wait=False)
sql("UPDATE package_limits SET listing_limit=1 WHERE package_id='90000000-0000-0000-0000-000000000001'")
pub={'lifecycle':{'event':'publish','duration_seconds':'3600'}}
race('same-publisher last-slot race','PERFORM '+cmd(5,pub),'SELECT '+cmd(6,pub),error='23514')
assert sql(f"SELECT count(*) FROM listings WHERE id IN ('{lid(5)}','{lid(6)}') AND listing_status='active'")=='1'
request=str(uuid.uuid4());c=money(7,22,expected=0,request=request)
out=race('same-request replay race','PERFORM '+c,'SELECT '+c)
assert json.loads(out)['replayed'] and rev(7)==1
race('different-request same old revision','PERFORM '+money(8,24,expected=0),'SELECT '+money(8,25,expected=0),error='40001')
src={'source_name':' s/fixture ','source_listing_id':'  ABC-123_X/9  ','observation_id':'race-observation','observed_at':'2026-09-16T00:00:00Z','transaction':'sale','geography':{'province':'3','canton':'304','district':'30403'}}
out=race('duplicate source observation race','PERFORM '+money(3,30,expected=0,src=src),'SELECT '+money(3,30,expected=0,src=src))
assert json.loads(out)['replayed'] and rev(3)==1
assert sql(f"SELECT times_scraped FROM listings WHERE id='{lid(3)}'")=='1'
assert sql(f"SELECT count(*) FROM listing_monetary_events WHERE listing_id='{lid(3)}'")=='1'
race('ownerless listing lock stale writer','PERFORM '+money(3,31,expected=1),'SELECT '+money(3,32,expected=1),error='40001')
request=str(uuid.uuid4())
race('same-request different payload conflict','PERFORM '+money(9,50,expected=0,request=request),'SELECT '+money(9,51,expected=0,request=request),error='22023')
# An ownerless command holds the shared guard; a policy writer demonstrably waits.
race('S3 command blocks exclusive policy change','PERFORM '+money(3,33),'SELECT '+ns+'lock_capacity_policy(true)')
# Prove receipt waiting directly, without a publisher lock hiding the resource.
request=str(uuid.uuid4());c=money(3,34,request=request)
out=race('ownerless same-request receipt lock','PERFORM '+c,'SELECT '+c)
assert json.loads(out)['replayed'] and results[-1]['actual_block']['wait']=='advisory'
sql("UPDATE package_limits SET listing_limit=5 WHERE package_id='90000000-0000-0000-0000-000000000001'")
race('different-publisher capacity-sensitive publication','PERFORM '+cmd(10,pub),'SELECT '+cmd(2,pub),wait=False)
print(json.dumps(results,indent=2));print('S3 CONCURRENCY PASSED:',len(results),'cases')
