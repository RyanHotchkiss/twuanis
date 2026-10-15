import json,pathlib,subprocess,re,time,importlib.util,os
P=pathlib.Path('/private/tmp/twuanis-orch-final-01');db='twuanis_orch_final_01_2000'
for kind,port in [('auth',55202),('rest',55203)]:
 name='twuanis_orch_final_capacity_'+kind;v=json.loads(subprocess.check_output(['docker','inspect',name]))[0];subprocess.run(['docker','rm','-f',name],check=True,stdout=subprocess.DEVNULL);args=['docker','run','-d','--name',name,'--network',v['HostConfig']['NetworkMode'],'-p','127.0.0.1:'+str(port)+':'+('9999'if kind=='auth'else'3000')]
 for e in v['Config']['Env']:args+=['-e',re.sub(r'twuanis_orch_final_01_\d+',db,e)]
 args+=[v['Config']['Image']]+(v['Config'].get('Cmd')or[]);subprocess.run(args,check=True,stdout=subprocess.DEVNULL)
time.sleep(2)
(P/'local_capacity.py').write_text((P/'local.py').read_text().replace('55101','55201'));import local_capacity
spec=importlib.util.spec_from_file_location('fixture','/private/tmp/twuanis-phase53je/commercial/fixture.py');f=importlib.util.module_from_spec(spec);spec.loader.exec_module(f);f.actual=local_capacity;f.DB='postgresql://postgres:postgres@127.0.0.1:54322/'+db;original=f.sql;f.sql=lambda s,db=None:original(s,db or f.DB);w=f.account('final01-paid-2000');term=f.paid_term(w,'pkg-pricing-position-relationships',True);actor={'id':w['id'],'email':f.sql('select email from auth.users where id='+f.lit(w['id'])),'term':term};(P/'capacity-paid.private.json').write_text(json.dumps(actor));(P/'capacity-paid-metadata.json').write_text(json.dumps({k:v for k,v in actor.items()if k!='email'},indent=2));subprocess.run(['/private/tmp/twuanis-phase53h/venv/bin/python',str(P/'run-monitored.py'),'capacity-2000-paid'],env={**os.environ,'CAPACITY_DB':db,'ACTOR_FILE':str(P/'capacity-paid.private.json')},check=True)
