#!/usr/bin/env python3
"""Run after publisher-coordination.sql, fresh local fixture only. No application calls."""
import argparse,os,subprocess,select,time,json
from pathlib import Path
ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--socket',required=True);ap.add_argument('--port',required=True);ap.add_argument('--pg-bin',default='/opt/homebrew/opt/postgresql@17/bin');a=ap.parse_args()
socket=Path(a.socket).resolve()
if not socket.is_dir() or not str(socket).startswith('/private/tmp/'):raise SystemExit('requires disposable /private/tmp Unix socket')
env={k:v for k,v in os.environ.items() if not k.startswith('PG')}
base=[str(Path(a.pg_bin)/'psql'),'-X','-qAt','-h',str(socket),'-p',a.port,'-U','postgres','-d','cg_s1_verification','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose']
def sql(s,error=None):
 r=subprocess.run(base+['-c',s],env=env,text=True,capture_output=True,timeout=15)
 if error:assert r.returncode and error in r.stderr,(s,r.stderr)
 else:assert r.returncode==0,(s,r.stderr)
 return r.stdout.strip()
assert sql("SELECT current_database()='cg_s1_verification' AND inet_server_addr() IS NULL AND session_user='postgres'")=='t'
ns='twuanis_canonical_private.'
u=lambda n:f'00000000-0000-0000-0000-{n:012}'
p=lambda n:sql(f"SELECT id FROM publisher_accounts WHERE owner_user_id='{u(n)}'")
p1,p2=p(101),p(102);assert p1 and p2
results=[]
def do(body):return 'DO $w$ BEGIN '+body+' END $w$'
def race(label,first_sql,second_sql,wait=True):
 workers=[];name='s2_'+str(len(results))
 try:
  first=subprocess.Popen(base,env=env,text=True,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,bufsize=1);workers.append(first)
  first.stdin.write('BEGIN;'+first_sql+";SELECT 'READY';\n");first.stdin.flush()
  assert select.select([first.stdout],[],[],10)[0] and first.stdout.readline().strip()=='READY',label+' first barrier'
  second=subprocess.Popen(base+['-c',f"SET application_name='{name}';BEGIN;{second_sql};COMMIT"],env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);workers.append(second)
  if wait:
   blocked=False
   for _ in range(100):
    if sql(f"SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name='{name}' AND wait_event_type='Lock')")=='t':blocked=True;break
    if second.poll() is not None:break
    time.sleep(.02)
   assert blocked,label+' must have a real waiter'
  else:
   out,err=second.communicate(timeout=5);assert second.returncode==0,(label,err)
  first.stdin.write('COMMIT;\n\\q\n');first.stdin.flush();first.wait(timeout=10);assert first.returncode==0,first.stderr.read()
  if wait:out,err=second.communicate(timeout=10);assert second.returncode==0,(label,err)
  results.append({'case':label,'waiter_proven':wait,'second_completed_before_first_commit':not wait});print('PASS '+label,flush=True)
  return out.strip()
 finally:
  for w in workers:
   if w.poll() is None:w.terminate();w.wait(timeout=10)
lock=lambda pub:ns+f"lock_publisher('{pub}')"
assert sql(f"SELECT count(*) FROM publisher_accounts WHERE owner_user_id IN ('{u(103)}','{u(104)}','{u(105)}','{u(106)}')")=='0','fresh fixture required'
out=race('same-customer provisioning',do(f"PERFORM {ns}ensure_publisher_account('{u(103)}');"),f"SELECT {ns}ensure_publisher_account('{u(103)}')")
assert out==p(103) and sql(f"SELECT count(*) FROM publisher_accounts WHERE owner_user_id='{u(103)}'")=='1'
race('different-customer provisioning',do(f"PERFORM {ns}ensure_publisher_account('{u(104)}');"),f"SELECT {ns}ensure_publisher_account('{u(105)}')",False)
assert p(104)!=p(105)
race('same-publisher lock',do('PERFORM '+lock(p1)+';'),'SELECT '+lock(p1))
race('different-publisher locks share policy guard',do('PERFORM '+lock(p1)+';'),'SELECT '+lock(p2),False)
race('exclusive policy guard blocks dependent reader',do(f'PERFORM {ns}lock_capacity_policy(true);'),'SELECT '+lock(p1))
race('shared reader blocks exclusive policy change',do('PERFORM '+lock(p1)+';'),f'SELECT {ns}lock_capacity_policy(true)')
# Empty-guard condition is local fixture setup, not a production deletion API.
sql('DELETE FROM capacity_policy_guard')
race('concurrent guard initialization',do(f'PERFORM {ns}initialize_capacity_guard();'),f'SELECT {ns}initialize_capacity_guard()')
assert sql('SELECT count(*) FROM capacity_policy_guard')=='1'
def replace(owner,pub,package):
 return f"PERFORM {lock(pub)}; UPDATE public.user_subscriptions SET status='expired' WHERE user_id='{owner}' AND status='active';INSERT INTO public.user_subscriptions(user_id,package_id,status,billing_cycle) VALUES('{owner}','90000000-0000-0000-0000-{package:012}','active','monthly');"
def allowance(pub,owner):return f"SELECT allowance FROM {ns}publisher_allowance('{pub}','{owner}')"
before_sub=sql(f"SELECT id FROM user_subscriptions WHERE user_id='{u(101)}' AND status='active'")
assert sql(allowance(p1,u(101)))=='3'
out=race('capacity-first then same-publisher replacement',do(f"PERFORM * FROM {ns}publisher_allowance('{p1}','{u(101)}');"),do(replace(u(101),p1,1))+';'+allowance(p1,u(101)))
assert out=='5'
after_sub=sql(f"SELECT id FROM user_subscriptions WHERE user_id='{u(101)}' AND status='active'")
assert before_sub!=after_sub and p(101)==p1
out=race('replacement-first then capacity reads committed replacement',do(replace(u(101),p1,2)),allowance(p1,u(101)))
assert out=='3' and p(101)==p1
out=race('different-publisher replacement',do('PERFORM '+lock(p1)+';'),do(replace(u(102),p2,2))+';'+allowance(p2,u(102)),False)
assert out=='3' and p(102)==p2
# Scoped rollback proof; no claim about future wrapper error handling.
sql(f"BEGIN;SELECT {ns}ensure_publisher_account('{u(106)}');SELECT 1/0;COMMIT",'22012')
assert sql(f"SELECT count(*) FROM publisher_accounts WHERE owner_user_id='{u(106)}'")=='0'
sql(f'BEGIN;DELETE FROM capacity_policy_guard;SELECT {ns}initialize_capacity_guard();SELECT 1/0;COMMIT','22012')
assert sql('SELECT count(*) FROM capacity_policy_guard')=='1'
print('PASS provisioning/guard transaction rollback',flush=True)
for isolation in ['REPEATABLE READ','SERIALIZABLE']:
 sql(f'BEGIN ISOLATION LEVEL {isolation};SELECT '+lock(p1)+';COMMIT','0A000')
calls=['initialize_capacity_guard()', 'lock_capacity_policy(false)', f"ensure_publisher_account('{u(101)}')",f"resolve_publisher('{u(101)}')",f"lock_publisher('{p1}')",f"publisher_allowance('{p1}','{u(101)}')",f"publisher_consumption('{p1}','{u(101)}')",'capacity_state(5,3)']
for role in ['anon','authenticated','service_role']:
 for call in calls:sql(f'SET ROLE {role};SELECT * FROM '+ns+call,'42501')
print('PASS 24 actual S2 role denials; two unsupported isolation levels rejected',flush=True)
print(json.dumps(results));print('S2 CONCURRENCY VERIFICATION PASSED: '+str(len(results))+' independent-session cases')
