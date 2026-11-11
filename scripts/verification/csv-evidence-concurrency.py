"""New S7 evidence races only, on the disposable Unix-socket fixture."""
import subprocess,json,uuid
from concurrent.futures import ThreadPoolExecutor
cmd=['/opt/homebrew/opt/postgresql@17/bin/psql','-X','-qAt','-h','/private/tmp/s7-csv-lab/socket','-p','55442','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1']
def sql(q):
 p=subprocess.run(cmd,input=q,text=True,capture_output=True)
 if p.returncode:raise RuntimeError(p.stderr)
 return (p.stdout.strip().splitlines()or[''])[-1]
assert sql("select inet_server_addr() is null and current_setting('port')='55442'")=='t'
source=str(uuid.uuid4());review={'status':'unresolved','canonical_authority':False,'values':{}}
raw={'source_name':'encuentra24','source_listing_id':source,'observation_id':'observed-1','observed_at':'2026-09-18T01:02:03Z','raw_bathrooms':'2.5','images':'https://photos.encuentra24.com/a.jpg'}
def retain(r):
 try:return sql("\\set VERBOSITY verbose\nBEGIN;SET LOCAL lock_timeout='5s';SET LOCAL statement_timeout='10s';SELECT public.retain_csv_source_evidence('%s','%s');COMMIT;"%(json.dumps(r),json.dumps(review)))
 except RuntimeError as e:return str(e)
with ThreadPoolExecutor(2)as pool:results=list(pool.map(retain,[raw,raw]))
eid=str(uuid.UUID(results[0]));assert results[0]==results[1]
print('PASS simultaneous identical evidence: same immutable identity')
conflict={**raw,'observation_id':'observed-2'}
with ThreadPoolExecutor(2)as pool:results=list(pool.map(retain,[conflict,{**conflict,'raw_bathrooms':'3'}]))
assert sum('immutable source observation evidence conflict'in r for r in results)==1
assert sql(f"select count(*) from twuanis_canonical_private.csv_source_evidence where source_listing_id='{source}' and source_observation_id='observed-2'")=='1'
print('PASS conflicting simultaneous evidence: one winner, no overwrite')
lid=str(uuid.uuid4());receipt=str(uuid.uuid4())
sql(f"insert into listings values('{lid}',1,NULL,'draft',1,'encuentra24','{source}',NULL,NULL);insert into canonical_operation_receipts values('{receipt}','{eid}','{lid}','create_trusted',1);insert into twuanis_canonical_private.csv_initial_publication(creation_receipt,listing_id)values('{receipt}','{lid}');")
def attach(_):return sql(f"BEGIN;SET LOCAL lock_timeout='5s';SET LOCAL statement_timeout='10s';SELECT public.complete_csv_source_references('{receipt}','{eid}');COMMIT;")
with ThreadPoolExecutor(2)as pool:list(pool.map(attach,[1,2]))
assert sql(f"select images='https://photos.encuentra24.com/a.jpg' and canonical_revision=1 from listings where id='{lid}'")=='t'
assert sql(f"select source_references_evidence='{eid}'::uuid from twuanis_canonical_private.csv_initial_publication where creation_receipt='{receipt}'")=='t'
print('PASS simultaneous reference completion: one stable result, no revision change')
print('CSV CONCURRENCY CASES 3')
