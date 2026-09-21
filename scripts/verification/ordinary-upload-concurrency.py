"""Focused new-operation races against the disposable s7_upload fixture."""
import subprocess,json,uuid
from concurrent.futures import ThreadPoolExecutor
cmd=['/opt/homebrew/opt/postgresql@17/bin/psql','-X','-qAt','-h','/private/tmp/s7-csv-lab/socket','-p','55442','-U','postgres','-d','s7_upload','-v','ON_ERROR_STOP=1']
def sql(q):
 p=subprocess.run(cmd,input=q,text=True,capture_output=True)
 if p.returncode:raise RuntimeError(p.stderr)
 return (p.stdout.strip().splitlines()or[''])[-1]
assert sql("select inet_server_addr() is null and current_database()='s7_upload'")=='t'
owner=str(uuid.uuid4());listing=str(uuid.uuid4())
sql(f"insert into listings(id,owner_id,listing_status,canonical_domain_version)values('{listing}','{owner}','active',1)")
def prepare():return json.loads(sql(f"select prepare_ordinary_upload('{owner}','{listing}',4)"))['id']
def attach(op):return json.loads(sql(f"begin;set local statement_timeout='10s';select attach_ordinary_upload('{owner}','{op}');commit;"))
op=prepare()
with ThreadPoolExecutor(4)as pool:r=list(pool.map(attach,[op]*4))
assert all(x['success']and x['imageCount']==1 for x in r)
print('PASS four concurrent retries: one attachment')
ops=[prepare(),prepare()]
with ThreadPoolExecutor(2)as pool:list(pool.map(attach,ops))
assert sql(f"select jsonb_array_length(images::jsonb) from listings where id='{listing}'")=='3'
print('PASS two distinct operations: no lost image update')
sql(f"update listings set images=(select jsonb_agg('existing-'||n)::text from generate_series(1,24)n)where id='{listing}'")
ops=[prepare(),prepare()]
def limited(op):
 try:return attach(op)['success']
 except RuntimeError as e:
  assert 'image limit reached'in str(e);return False
with ThreadPoolExecutor(2)as pool:r=list(pool.map(limited,ops))
assert sum(r)==1
assert sql(f"select jsonb_array_length(images::jsonb)=25 and listing_status='active' and canonical_revision=5 and publication_expires_at='2030-01-01'::timestamptz from listings where id='{listing}'")=='t'
print('PASS last image slot: one winner, lifecycle/deadline/revision unchanged')
print('ORDINARY UPLOAD CONCURRENCY CASES 3')
