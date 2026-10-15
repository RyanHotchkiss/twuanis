from pathlib import Path
import json,os,subprocess,psycopg2,time,uuid
P=Path('/private/tmp/twuanis-orch-final-01');C=P/'candidate';c=psycopg2.connect('postgresql://supabase_admin:postgres@127.0.0.1:54322/twuanis_orch_final_01');c.autocommit=True;q=c.cursor();out=[]
def run(name,req,fault=None,terminate=False):
 D=P/'faults'/name;D.mkdir(parents=True,exist_ok=True);f=(D/'run.log').open('w');env={**os.environ,'NODE_PATH':'/Users/cassidydaddy/twuanis/node_modules','RUN_DIR':str(D),'REQUEST_FILE':str(req),'ACTOR_FILE':str(P/'peer-paid.private.json'),'CANDIDATE_ROOT':str(C),'KEEP_REQUEST_ID':'1'}
 if fault:env['FAULT']=fault
 p=subprocess.Popen(['node','--conditions=react-server','--expose-gc',str(P/'run-faults.cjs')],cwd=C,env=env,stdout=f,stderr=f);killed=[]
 while p.poll()is None:
  if terminate and not killed and (D/'finalize-request.json').exists():
   q.execute("select pid,pg_terminate_backend(pid)from pg_stat_activity where datname=current_database()and usename='authenticator'and state='active'and query like '%orchestrator_witness_finalize%'");killed=q.fetchall()
  time.sleep(.1)
 f.close();row={'case':name,'exit':p.returncode,'terminatedBackends':killed}
 if(D/'capture-run-result.json').exists():row['result']=json.load(open(D/'capture-run-result.json'))['result']
 if(D/'finalize-request.json').exists():
  row['execution']=json.load(open(D/'finalize-request.json'))['p_execution'];q.execute("select kind,quantity::text from twuanis_canonical_private.execution_credit_events where execution_id=%s order by id",(row['execution'],));row['events']=q.fetchall();q.execute('select lease_until from twuanis_canonical_private.orchestrator_execution_claims where execution_id=%s',(row['execution'],));row['workerLeaseUntil']=str(q.fetchone()[0])
 out.append(row);(P/'fault-results.json').write_text(json.dumps(out,indent=2));print(row,flush=True)
run('worker-killed',P/'interruption-request.json','KILL_WORKER');run('retry-with-live-worker-lease',P/'interruption-request.json')
base=json.load(open(P/'interruption-request.json'))
for name in ['database-timeout','database-connection-loss']:
 req=P/(name+'-request.json');req.write_text(json.dumps({**base,'requestId':str(uuid.uuid4())}));q.execute("select pg_get_functiondef('public.orchestrator_witness_finalize(jsonb,uuid,uuid,uuid,text,jsonb)'::regprocedure)");original=q.fetchone()[0]
 try:
  if name=='database-timeout':q.execute("ALTER FUNCTION public.orchestrator_witness_finalize(jsonb,uuid,uuid,uuid,text,jsonb) SET statement_timeout='1ms'");q.execute("NOTIFY pgrst,'reload schema'");time.sleep(1)
  run(name,req,terminate=name=='database-connection-loss')
 finally:q.execute(original);q.execute("NOTIFY pgrst,'reload schema'")
c.close()
