from pathlib import Path
import subprocess,json,psycopg2,os,time,re
P=Path('/private/tmp/twuanis-orch-final-01');python='/private/tmp/twuanis-phase53h/venv/bin/python'
for size in [128,500,1000]:
 db='twuanis_orch_final_01_'+str(size)
 subprocess.run([python,str(P/'setup-capacity.py'),str(size)],check=True)
 c=psycopg2.connect('postgresql://supabase_admin:postgres@127.0.0.1:54322/'+db);c.autocommit=True;c.cursor().execute((P/'candidate/supabase/migrations/111_orchestrator_indexed_graph_traversal.sql').read_text());c.close()
 for kind,port in [('auth',55202),('rest',55203)]:
  name='twuanis_orch_final_capacity_'+kind;v=json.loads(subprocess.check_output(['docker','inspect',name]))[0];subprocess.run(['docker','rm','-f',name],check=True,stdout=subprocess.DEVNULL);args=['docker','run','-d','--name',name,'--network',v['HostConfig']['NetworkMode'],'-p','127.0.0.1:'+str(port)+':'+('9999'if kind=='auth'else'3000')]
  for e in v['Config']['Env']:args+=['-e',re.sub(r'twuanis_orch_final_01_\d+',db,e)]
  args+=[v['Config']['Image']]+(v['Config'].get('Cmd')or[]);subprocess.run(args,check=True,stdout=subprocess.DEVNULL)
 time.sleep(2)
 subprocess.run([python,str(P/'run-monitored.py'),'capacity-'+str(size)],env={**os.environ,'CAPACITY_DB':db},check=True)
 print('size',size,'done',flush=True)
