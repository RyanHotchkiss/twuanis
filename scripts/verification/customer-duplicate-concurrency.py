"""S7 duplicate races. Disposable Unix-socket fixture only; no network."""
import subprocess, json, uuid
from concurrent.futures import ThreadPoolExecutor
PSQL=['/opt/homebrew/opt/postgresql@17/bin/psql','-X','-qAt','-h','/private/tmp/cg-s2a-lab/socket','-p','55441','-U','postgres','-d','cg_s7_duplicate_final','-v','ON_ERROR_STOP=1']
def sql(text):
    p=subprocess.run(PSQL,input=text,text=True,capture_output=True,check=True)
    return [line for line in p.stdout.splitlines() if line.strip()]
assert sql("SELECT current_database()='cg_s7_duplicate_final' AND inet_server_addr() IS NULL;")==['t']
owner=str(uuid.uuid4());request=str(uuid.uuid4())
sql(f"INSERT INTO auth.users(id) VALUES('{owner}');")
def auth(q):
    return sql(f"BEGIN; SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='10s'; SELECT set_config('request.jwt.claim.sub','{owner}',true); {q}; COMMIT;")[-1]
source=json.loads(auth("SELECT public.create_customer_canonical_listing(gen_random_uuid(),'{\"transaction\":\"sale\",\"geography\":{\"province\":\"3\",\"canton\":\"304\"},\"semantics\":{\"property_type\":[\"1\"]},\"money\":{\"amount\":\"0.5\",\"currency\":\"USD\"}}')"))['listing_id']
def prepare(r):return json.loads(auth(f"SELECT public.prepare_customer_duplicate('{source}','{r}')"))
with ThreadPoolExecutor(2) as pool:results=list(pool.map(prepare,[request,request]))
assert results[0]['listing_id']==results[1]['listing_id'];dup=results[0]['listing_id']
assert sql(f"SELECT count(*) FROM twuanis_canonical_private.duplicate_commands WHERE owner_id='{owner}' AND request_id='{request}'")==['1']
print('PASS simultaneous same request: one new identity')
with ThreadPoolExecutor(2) as pool:results=list(pool.map(prepare,[str(uuid.uuid4()),str(uuid.uuid4())]))
assert results[0]['listing_id']!=results[1]['listing_id']
print('PASS independent explicit requests: independent drafts')
def attach(_):return json.loads(sql(f"BEGIN; SET LOCAL lock_timeout='5s'; SELECT public.attach_customer_duplicate_media('{dup}'); COMMIT;")[-1])
with ThreadPoolExecutor(2) as pool:results=list(pool.map(attach,[1,2]))
assert all(r['completed'] and r['listing_id']==dup for r in results)
assert sql(f"SELECT count(*) FROM canonical_operation_receipts WHERE listing_id='{dup}'")==['1']
print('PASS simultaneous attachment: replay with unchanged canonical receipts')
# Source mutation and duplication both use publisher then listing locking.
def mutate():return auth(f"SELECT public.mutate_customer_canonical_listing('{source}',1,gen_random_uuid(),'{{\"money\":{{\"amount\":\"1\",\"currency\":\"USD\"}}}}')")
with ThreadPoolExecutor(2) as pool:
    mutation=pool.submit(mutate);copy=pool.submit(prepare,str(uuid.uuid4()));mutation.result();new=copy.result()['listing_id']
assert sql(f"SELECT current_price IN (0.5,1) AND currency='USD' FROM listings WHERE id='{new}'")==['t']
print('PASS source mutation versus duplication: coherent serialized monetary snapshot')
print('DUPLICATE CONCURRENCY CASES 4')
