import json,pathlib,psycopg2
P=pathlib.Path('/private/tmp/twuanis-orch-final-01');out=[]
for db,files in [('twuanis_orch_final_01',list(P.glob('runs/*/*/capture-run-result.json'))+list(P.glob('faults/*/capture-run-result.json'))),('twuanis_orch_final_01_2000',[P/'runs/capacity-2000-60s/capture-run-result.json']),('twuanis_orch_final_01_5000',[P/'runs/capacity-5000-indexed/capture-run-result.json'])]:
 c=psycopg2.connect('postgresql://postgres:postgres@127.0.0.1:54322/'+db);q=c.cursor()
 for f in files:
  r=json.load(open(f))['result'];eid=r.get('execution')
  if not eid:
   p=f.parent/'finalize-request.json'
   if p.exists():eid=json.load(open(p))['p_execution']
  if not eid:continue
  q.execute("select kind,quantity::text from twuanis_canonical_private.execution_credit_events where execution_id=%s order by id",(eid,));events=q.fetchall();q.execute('select count(*) from twuanis_canonical_private.execution_credit_reports where execution_id=%s',(eid,));reports=q.fetchone()[0];q.execute('select count(*) from twuanis_canonical_private.orchestrator_execution_witnesses where execution_id=%s',(eid,));witnesses=q.fetchone()[0];q.execute('select authority->>\'kind\',twuanis_canonical_private.execution_credit_execution_state(id)from twuanis_canonical_private.execution_credit_executions where id=%s',(eid,));authority,state=q.fetchone();charged=sum(int(n)for k,n in events if k=='EXECUTION_CONSUMED');expected=1 if state=='COMPLETED'and authority!='OWNER_UNMETERED'else 0;ok=charged==expected and reports==(1 if state=='COMPLETED'else 0)and witnesses==(1 if state=='COMPLETED'else 0);out.append({'case':str(f.parent.relative_to(P)),'database':db,'execution':eid,'authority':authority,'state':state,'events':events,'reports':reports,'witnesses':witnesses,'pass':ok})
 c.close()
(P/'all-accounting-verification.json').write_text(json.dumps(out,indent=2));print('accounting',sum(x['pass']for x in out),'/',len(out))
