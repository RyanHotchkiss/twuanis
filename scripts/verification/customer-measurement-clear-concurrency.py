import subprocess,json,uuid
from concurrent.futures import ThreadPoolExecutor
cmd=['/opt/homebrew/opt/postgresql@17/bin/psql','-X','-qAt','-h','/private/tmp/cg-s2a-lab/socket','-p','55441','-U','postgres','-d','cg_s7_measurement_clear','-v','ON_ERROR_STOP=1']
def sql(q):
 p=subprocess.run(cmd,input=q,text=True,capture_output=True)
 if p.returncode: raise RuntimeError(p.stderr)
 return (p.stdout.strip().splitlines() or [''])[-1]
assert sql("select current_database()='cg_s7_measurement_clear' and inet_server_addr() is null")=='t'
owner=str(uuid.uuid4());sql(f"insert into auth.users(id) values('{owner}')")
def auth(q):return sql(f"\\set VERBOSITY verbose\nBEGIN; SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='10s'; SELECT set_config('request.jwt.claim.sub','{owner}',true);{q};COMMIT;")
def create():return json.loads(auth("SELECT public.create_customer_canonical_listing(gen_random_uuid(),'{\"transaction\":\"sale\",\"geography\":{\"province\":\"3\",\"canton\":\"304\"},\"semantics\":{\"property_type\":[\"1\"]},\"measurements\":{\"property_area\":{\"value\":\"850\"}}}')"))['listing_id']
def edit(x):
 listing,rev,req,value=x
 payload=json.dumps({'measurements':{'property_area':value}})
 try:return json.loads(auth(f"SELECT public.mutate_customer_canonical_listing('{listing}',{rev},'{req}','{payload}')"))
 except RuntimeError as e:return str(e)
lid=create();req=str(uuid.uuid4());clear={'kind':'clear'}
with ThreadPoolExecutor(2) as pool:r=list(pool.map(edit,[(lid,1,req,clear)]*2))
assert all(isinstance(x,dict) for x in r)
assert sql(f"select count(*) from canonical_operation_receipts where request_id='{req}'")=='1'
assert sql(f"select property_area is null and canonical_revision=2 from listings where id='{lid}'")=='t'
print('PASS identical concurrent CLEAR: one receipt/revision')
with ThreadPoolExecutor(2) as pool:r=list(pool.map(edit,[(lid,1,req,clear),(lid,2,str(uuid.uuid4()),{'value':'70'})]))
assert all(isinstance(x,dict) for x in r)
assert sql(f"select property_area=70 and canonical_revision=3 from listings where id='{lid}'")=='t'
print('PASS old CLEAR replay concurrent with SET preserves new measurement')
lid=create()
with ThreadPoolExecutor(2) as pool:r=list(pool.map(edit,[(lid,1,str(uuid.uuid4()),clear),(lid,1,str(uuid.uuid4()),{'value':'90'})]))
assert sum(isinstance(x,dict) for x in r)==1
assert any(isinstance(x,str) and '40001' in x for x in r)
assert sql(f"select canonical_revision=2 and (property_area is null or property_area=90) from listings where id='{lid}'")=='t'
print('PASS competing CLEAR/SET: one winner, one stale-revision rejection')
print('MEASUREMENT CLEAR CONCURRENCY CASES 3')
