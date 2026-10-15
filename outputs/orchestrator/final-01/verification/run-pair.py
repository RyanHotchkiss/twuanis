import pathlib,json,os,time,subprocess,psycopg2,uuid,sys
P=pathlib.Path('/private/tmp/twuanis-orch-final-01');name=sys.argv[1];C=P/'candidate';D=P/'runs'/name;D.mkdir(parents=True,exist_ok=True);base=json.load(open('/private/tmp/twuanis-orch-acq-02/scenario-requests.json'))[{'PRIVATE':'01-PRIVATE','BANK':'02-BANK','COMBINED':'03-COMBINED'}[os.environ.get('TEST_POPULATION','COMBINED')]]['request'];base['population']=os.environ.get('TEST_POPULATION','COMBINED');actor=sys.argv[2]if len(sys.argv)>2 else'baseline';children=[]
c=psycopg2.connect('postgresql://supabase_admin:postgres@127.0.0.1:54322/twuanis_orch_final_01');c.autocommit=True;q=c.cursor();q.execute('select temp_bytes,temp_files,deadlocks from pg_stat_database where datname=current_database()');before=q.fetchone();t=time.monotonic()
for i in range(2):
 d=D/str(i);d.mkdir(exist_ok=True);req={**base,'requestId':str(uuid.uuid4())};(d/'request.json').write_text(json.dumps(req));f=(d/'run.log').open('w');env={**os.environ,'NODE_PATH':'/Users/cassidydaddy/twuanis/node_modules','RUN_DIR':str(d),'REQUEST_FILE':str(d/'request.json'),'ACTOR_FILE':str(P/(('peer'if '--different' in sys.argv and i else actor)+'-paid.private.json')),'CANDIDATE_ROOT':str(C),'KEEP_REQUEST_ID':'1'};proc=subprocess.Popen(['node','--conditions=react-server','--expose-gc',str(P/'run-audit.cjs')],cwd=C,env=env,stdout=f,stderr=f);children.append((proc,f,d))
samples=[]
while any(p.poll()is None for p,f,d in children):
 q.execute("select pid,usename,state,wait_event_type,wait_event,extract(epoch from clock_timestamp()-query_start)::float,left(query,200),pg_blocking_pids(pid) from pg_stat_activity where datname=current_database() and pid<>pg_backend_pid()")
 rows=q.fetchall();pids=[str(x[0])for x in rows];procdata=''
 if pids:
  shell='for p in '+ ' '.join(pids)+'; do echo PID:$p; cat /proc/$p/stat /proc/$p/smaps_rollup /proc/$p/io 2>/dev/null; done'
  procdata=subprocess.run(['docker','exec','-u','postgres','supabase_db_twuanis-disposable-rehearsal','sh','-c',shell],capture_output=True,text=True).stdout
 samples.append({'at':time.monotonic()-t,'activity':rows,'proc':procdata});time.sleep(.25)
for p,f,d in children:f.close()
q.execute('select temp_bytes,temp_files,deadlocks from pg_stat_database where datname=current_database()');after=q.fetchone();out={'elapsed':time.monotonic()-t,'delta':dict(zip(['temp_bytes','temp_files','deadlocks'],[a-b for a,b in zip(after,before)])),'runs':[]}
for proc,f,d in children:
 x=json.load(open(d/'capture-run-result.json'));out['runs'].append({'result':x['result'],'wallMs':x['wallMs'],'cpu':x['cpu'],'peakRss':x['peakRss'],'queries':x['queries'],'responseBytes':x['responseBytes'],'timings':[v for v in x['timings']if any(n in v['path']for n in ['witness_finalize','execution_commit'])]})
(D/'resources.json').write_text(json.dumps(out,indent=2));(D/'database-samples.json').write_text(json.dumps(samples,default=str));print(json.dumps(out,indent=2))
