from pathlib import Path
import json
P=Path('/private/tmp/twuanis-orch-final-01');s=(P/'faults.py').read_text().split("run('worker-killed'")[0].replace('out=[]',"out=json.load(open(P/'fault-results.json'))");exec(compile(s,'retained-fault-harness','exec'))
q.execute('select lease_until<=clock_timestamp() from twuanis_canonical_private.orchestrator_execution_claims where execution_id=%s',('37274297-be80-4f53-8129-63523f509cd8',));assert q.fetchone()[0]
run('retry-after-worker-lease',P/'interruption-request.json');run('duplicate-after-completion',P/'interruption-request.json')
import local
old=json.load(open(P/'faults/worker-killed/finalize-request.json'));st,v=local.rpc('orchestrator_witness_finalize',old);(P/'superseded-worker-result.json').write_text(json.dumps({'http':st,'response':v,'pass':st!=200},indent=2));print('superseded worker',st,v);c.close()
