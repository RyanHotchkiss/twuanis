"""New S7 edit races: only the named disposable Unix-socket database."""
import subprocess,json,uuid
from concurrent.futures import ThreadPoolExecutor
cmd=['/opt/homebrew/opt/postgresql@17/bin/psql','-X','-qAt','-h','/private/tmp/cg-s2a-lab/socket','-p','55441','-U','postgres','-d','cg_s7_customer_edit','-v','ON_ERROR_STOP=1']
def sql(q):
 p=subprocess.run(cmd,input=q,text=True,capture_output=True)
 if p.returncode:raise RuntimeError(p.stderr)
 return (p.stdout.strip().splitlines() or [''])[-1]
assert sql("select current_database()='cg_s7_customer_edit' and inet_server_addr() is null;")=='t'
owner=str(uuid.uuid4());sql(f"insert into auth.users(id) values('{owner}');")
def auth(q):return sql(f"\\set VERBOSITY verbose\nBEGIN;SET LOCAL lock_timeout='5s';SET LOCAL statement_timeout='10s';SELECT set_config('request.jwt.claim.sub','{owner}',true);{q};COMMIT;")
source=json.loads(auth("SELECT public.create_customer_canonical_listing(gen_random_uuid(),'{\"transaction\":\"sale\",\"geography\":{\"province\":\"3\",\"canton\":\"304\"},\"semantics\":{\"property_type\":[\"1\"]},\"measurements\":{\"property_area\":{\"value\":\"850\"}}}')"))['listing_id']
auth(f"SELECT twuanis_canonical_private.s3_command('{source}',1,'owner','{owner}',gen_random_uuid(),'{{\"measurements\":{{\"property_area\":{{\"value\":\"850\",\"rule_set\":\"80000000-0000-0000-0000-000000000001\"}}}}}}',NULL)")
request=str(uuid.uuid4())
def edit(args):
 rev,req,value=args
 try:return json.loads(auth(f"SELECT public.mutate_customer_canonical_listing('{source}',{rev},'{req}','{{\"measurements\":{{\"property_area\":{{\"value\":\"{value}\"}}}}}}')"))
 except RuntimeError as e:return str(e)
with ThreadPoolExecutor(2) as pool:results=list(pool.map(edit,[(2,request,50)]*2))
assert all(isinstance(r,dict) for r in results)
assert sql(f"select count(*) from canonical_operation_receipts where request_id='{request}'")=='1'
print('PASS simultaneous identical classified edit: one receipt/revision')
with ThreadPoolExecutor(2) as pool:results=list(pool.map(edit,[(3,str(uuid.uuid4()),70),(3,str(uuid.uuid4()),80)]))
assert sum(isinstance(r,dict) for r in results)==1
assert any(isinstance(r,str) and '40001' in r for r in results)
print('PASS concurrent stale revisions: one winner and one rejection')
with ThreadPoolExecutor(2) as pool:results=list(pool.map(edit,[(2,request,50),(4,str(uuid.uuid4()),120)]))
assert all(isinstance(r,dict) for r in results)
assert sql(f"select property_area=120 and canonical_revision=5 from listings where id='{source}'")=='t'
assert sql(f"select exists(select 1 from listing_membership_origins where listing_id='{source}' and origin_domain='property_area' and ontology_term_id=8 and classification_rule_id is not null)")=='t'
print('PASS old receipt replay concurrent with new edit: new exact value and new band retained')
print('CUSTOMER EDIT CONCURRENCY CASES 3')
