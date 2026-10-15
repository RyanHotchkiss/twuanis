import json,pathlib,subprocess,os,uuid
P=pathlib.Path('/private/tmp/twuanis-orch-final-01');cases=json.load(open('/private/tmp/twuanis-orch-acq-02/scenario-requests.json'));print('available cases',list(cases))
for key in cases:
 if key not in cases:continue
 d=P/'paired'/key/'after';d.mkdir(parents=True,exist_ok=True);req=cases[key]['request'];req['requestId']=str(uuid.uuid4());(d/'request.json').write_text(json.dumps(req));env={**os.environ,'NODE_PATH':'/Users/cassidydaddy/twuanis/node_modules','RUN_DIR':str(d),'REQUEST_FILE':str(d/'request.json'),'CANDIDATE_ROOT':str(P/'candidate')};
 if cases[key].get('actor'):env['ACTOR_FILE']=cases[key]['actor']
 r=subprocess.run(['node','--conditions=react-server','--expose-gc',str(P/'run-audit.cjs')],cwd=P/'candidate',env=env,capture_output=True,text=True);(d/'run.log').write_text(r.stdout+r.stderr);print(key,json.load(open(d/'capture-run-result.json'))['result'],flush=True)
