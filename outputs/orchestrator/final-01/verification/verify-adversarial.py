from pathlib import Path
import json,psycopg2
P=Path('/private/tmp/twuanis-orch-final-01');c=psycopg2.connect('postgresql://postgres:postgres@127.0.0.1:54322/twuanis_orch_final_01');q=c.cursor();out=[]
for case in json.load(open(P/'adversarial-bodies.private.json')):
 r=case['body'];q.execute('SAVEPOINT probe')
 try:q.execute('select twuanis_canonical_private.evidence_v2_validate(%s::jsonb,%s::uuid,%s::uuid,%s::uuid)',(json.dumps(r),r['executionId'],r['reportId'],r['accountId']));actual='ACCEPTED';error=None
 except psycopg2.Error as e:actual='REJECTED';error={'code':e.pgcode,'message':e.diag.message_primary}
 q.execute('ROLLBACK TO SAVEPOINT probe');expected='ACCEPTED'if case['name']=='valid'else'REJECTED';out.append({'case':case['name'],'expected':expected,'actual':actual,'error':error,'pass':expected==actual});(P/'adversarial-results.json').write_text(json.dumps(out,indent=2));print(out[-1],flush=True)
c.rollback();c.close();assert all(x['pass']for x in out)
