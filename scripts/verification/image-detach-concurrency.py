import subprocess,json,uuid
from concurrent.futures import ThreadPoolExecutor
cmd=['/opt/homebrew/opt/postgresql@17/bin/psql','-X','-qAt','-h','/private/tmp/s7-csv-lab/socket','-p','55442','-U','postgres','-d','s7_upload','-v','ON_ERROR_STOP=1']
def sql(q):
 p=subprocess.run(cmd,input=q,text=True,capture_output=True)
 if p.returncode:raise RuntimeError(p.stderr)
 return (p.stdout.strip().splitlines()or[''])[-1]
assert sql("select inet_server_addr() is null and current_database()='s7_upload'")=='t'
o,l=str(uuid.uuid4()),str(uuid.uuid4());image=f'{o}/{l}/image.jpg';old=json.dumps([image])
sql(f"insert into listings(id,owner_id,listing_status,canonical_domain_version,images)values('{l}','{o}','active',1,'{old}')")
def detach(_):return json.loads(sql(f"begin;set local statement_timeout='10s';select detach_listing_image('{o}','{l}','{image}');commit;"))
with ThreadPoolExecutor(3)as pool:r=list(pool.map(detach,range(3)))
assert len({v['id']for v in r})==1
op=r[0]['id'];assert sql(f"select images='[]' from listings where id='{l}'")=='t'
print('PASS repeated concurrent detach: one receipt, no resurrection')
upload=json.loads(sql(f"select prepare_ordinary_upload('{o}','{l}',4)"))['id']
def mixed(i):return sql(f"begin;set local statement_timeout='10s';select "+(f"confirm_image_cleanup('{o}','{op}')"if i==0 else f"attach_ordinary_upload('{o}','{upload}')")+";commit;")
with ThreadPoolExecutor(2)as pool:list(pool.map(mixed,[0,1]))
assert sql(f"select jsonb_array_length(images::jsonb)=1 and listing_status='active' and canonical_revision=5 and publication_expires_at='2030-01-01'::timestamptz from listings where id='{l}'")=='t'
print('PASS cleanup confirmation concurrent with new attachment: newer state preserved')
sql(f"update listings set images='{old}' where id='{l}' and images='{old}'")
assert sql(f"select not(images::jsonb @> '[\"{image}\"]') from listings where id='{l}'")=='t'
print('PASS stale reorder snapshot cannot resurrect detached path')
print('IMAGE DETACH CONCURRENCY/INTERLEAVING CASES 3')
