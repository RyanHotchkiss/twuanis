import subprocess,pathlib,json,time
R=pathlib.Path('/Users/cassidydaddy/twuanis');P=['/opt/homebrew/opt/postgresql@17/bin/psql','-X','-h','/private/tmp/s11b-prep/socket','-p','55439','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-Atq'];n=0
def sql(s,ok=True):
 r=subprocess.run(P,input=s,text=True,capture_output=True)
 assert (r.returncode==0)==ok,r.stdout+r.stderr
 return r.stdout.strip()
def check(s,label):
 global n
 assert sql(s)=='t',label
 n+=1;print('PASS',n,label)
owner='11111111-1111-4111-8111-111111111111';lid='22222222-2222-4222-8222-222222222222'
q=lambda v:"'"+v.replace("'","''")+"'"
def call(images,prior='["a", "b", "a"]',who=owner):
 return f"SELECT public.reorder_listing_images('{who}','{lid}',{q(prior)},ARRAY[{','.join(q(x) for x in images)}]::text[]);"
sql('''CREATE TABLE ontology_terms(id bigint PRIMARY KEY,term_type text,level int,term_name text);
CREATE TABLE twuanis_canonical_private.accessibility_identity(term_id bigint PRIMARY KEY REFERENCES ontology_terms,code text UNIQUE CHECK(code IN('paved','2wd','4x4','walkable','boat')));
INSERT INTO ontology_terms VALUES(1172,'accessibility',1,'2WD Accessible'),(1173,'accessibility',1,'Paved Road'),(1174,'accessibility',1,'4x4 Required'),(1175,'accessibility',1,'Walkable'),(1176,'accessibility',1,'Boat Access Only');
CREATE TABLE listings(id uuid PRIMARY KEY,owner_id uuid,images text,listing_status text,canonical_domain_version smallint,updated_at timestamptz,canonical_revision bigint,title text);
''')
seed=(R/'outputs/CG-S11-B/accessibility-seed.sql').read_text();sql(seed);sql(seed)
check('SELECT count(*)=5 FROM twuanis_canonical_private.accessibility_identity','seed and replay exact five identities')
sql("UPDATE ontology_terms SET term_type='wrong' WHERE id=1172");sql(seed,False);sql("UPDATE ontology_terms SET term_type='accessibility' WHERE id=1172")
check('SELECT count(*)=5 FROM twuanis_canonical_private.accessibility_identity','seed drift fails closed')
sql((R/'supabase/migrations/024_image_reorder_boundary.sql').read_text())
for num in ['020','021']:sql(next((R/'supabase/migrations').glob(num+'*.sql')).read_text())
sql(f"INSERT INTO listings VALUES('{lid}','{owner}','[\"a\", \"b\", \"a\"]','draft',1,now(),4,'untouched'); CREATE TABLE listing_snapshot AS TABLE listings;")
for label,stmt in [('wrong owner',call(['b','a','a'],who='33333333-3333-4333-8333-333333333333')),('over 25',call(['a']*26)),('missing',call(['a','b'])),('added',call(['a','b','a','x'])),('multiplicity',call(['b','b','a'])),('stale',call(['a','a','b'],'[]'))]:
 sql(stmt,False);check("SELECT images='[\"a\", \"b\", \"a\"]' FROM listings",label+' denied unchanged')
for status in ["'deleted'",'NULL']:
 sql(f'UPDATE listings SET listing_status={status}');sql(call(['b','a','a']),False);check('SELECT canonical_revision=4 FROM listings','noneligible denied')
sql("UPDATE listings SET listing_status='draft'");sql('SET ROLE service_role;'+call(['b','a','a']))
check("SELECT images::jsonb='[\"b\",\"a\",\"a\"]'::jsonb FROM listings",'service owner reorder succeeds')
check("SELECT (to_jsonb(l)-ARRAY['images','updated_at'])=(to_jsonb(s)-ARRAY['images','updated_at']) FROM listings l CROSS JOIN listing_snapshot s",'only images and updated_at change')
for role in ['anon','authenticated']:
 sql('SET ROLE '+role+';'+call(['a','a','b'],'["b", "a", "a"]'),False)
 check(f"SELECT NOT has_function_privilege('{role}','public.reorder_listing_images(uuid,uuid,text,text[])','EXECUTE')",role+' denied')
# Three actual row-lock interleavings, using established upload/detach functions.
def race(writer,stale):
 a=subprocess.Popen(P,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
 a.stdin.write('BEGIN;'+writer+"SELECT 'writer_locked'; SELECT pg_sleep(0.5); COMMIT;\n");a.stdin.close()
 while a.stdout.readline().strip()!='writer_locked':
  assert a.poll() is None,'writer failed: '+a.stderr.read()
 sql('SET ROLE service_role;'+stale,False)
 a.wait(timeout=10);assert a.returncode==0,a.stderr.read()
sql("UPDATE listings SET images='[\"a\", \"b\", \"a\"]'")
race('SET ROLE service_role;'+call(['a','a','b']),call(['b','a','a']))
check("SELECT images::jsonb='[\"a\",\"a\",\"b\"]'::jsonb FROM listings",'concurrent reorder rejects stale')
sql("UPDATE listings SET images='[\"a\", \"b\", \"a\"]'")
op=json.loads(sql(f"SET ROLE service_role;SELECT public.prepare_ordinary_upload('{owner}','{lid}',100);"))
race(f"SET ROLE service_role;SELECT public.attach_ordinary_upload('{owner}','{op['id']}');",call(['a','a','b']))
check('SELECT jsonb_array_length(images::jsonb)=4 FROM listings','upload conflict preserves new attachment')
sql("UPDATE listings SET images='[\"https://example.invalid/a\", \"https://example.invalid/b\"]'")
race(f"SET ROLE service_role;SELECT public.detach_listing_image('{owner}','{lid}','https://example.invalid/a');",call(['https://example.invalid/b','https://example.invalid/a'],'["https://example.invalid/a", "https://example.invalid/b"]'))
check("SELECT images::jsonb='[\"https://example.invalid/b\"]'::jsonb FROM listings",'detach conflict cannot resurrect removed reference')
print('TOTAL',n,'including 3 concurrent interleavings')
