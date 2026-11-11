import pathlib, subprocess, tempfile, os, json, uuid, hashlib
root=pathlib.Path(os.environ.get('REMATES_REPO','/Users/cassidydaddy/twuanis')); pg=pathlib.Path('/opt/homebrew/opt/postgresql@17/bin')
dir=pathlib.Path(tempfile.mkdtemp(prefix='remates-r01-',dir='/private/tmp')); data=dir/'data'; sock=dir/'sock';sock.mkdir()
env={'PATH':'/usr/bin:/bin','LC_ALL':'C'}; results=[]; started=False
base=[str(pg/'psql'),'-X','-qAt','-h',str(sock),'-p','55494','-U','postgres','-d','cg_s1_verification','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose']
def run(b,args,inp=None):return subprocess.run([str(pg/b)]+args,input=inp,text=True,capture_output=True,env=env,timeout=60)
def sql(q, error=None):
 r=subprocess.run(base,input=q,text=True,capture_output=True,env=env,timeout=60)
 if error: assert r.returncode and error in r.stderr,(q,r.stderr,r.stdout)
 else: assert r.returncode==0,(q[:250],r.stderr)
 return r.stdout.strip()
def read(p):return (root/p).read_text()
def migration(n):sql(read(next((root/'supabase/migrations').glob(n+'_*')).relative_to(root)))
def check(label,q,expected='t'):assert sql(q)==expected,(label,sql(q));results.append(label)
def reject(label,q,error='23514'):sql(q,error);results.append(label)
def lit(v):return "'"+str(v).replace("'","''")+"'"
def js(v):return lit(json.dumps(v))+'::jsonb'
def ident():return str(uuid.uuid4())
user='00000000-0000-0000-0000-000000000001'
payload={'transaction':'sale','geography':{'province':'3','canton':'304'},'semantics':{'property_type':['1']},'money':{'amount':'50','currency':'USD'}}
def src(kind='realtor',name=None,key='1'):return {'source_name':name or 'test-'+ident(),'source_listing_id':key,'observation_id':'obs1','observed_at':'2026-10-01T00:00:00Z','source_type':kind}
def trusted(source,p=None):return 'SELECT public.create_trusted_canonical_listing('+lit(ident())+','+js(p or payload)+','+('NULL' if source is None else js(source))+');'
def role(q,r='service_role'):return 'BEGIN; SET LOCAL ROLE '+r+';'+q+' COMMIT;'
try:
 r=run('initdb',['-D',str(data),'-U','postgres','--auth=trust','--no-locale','--encoding=UTF8']);assert r.returncode==0,r.stderr
 r=run('pg_ctl',['-D',str(data),'-l',str(dir/'log'),'-o',f'-k {sock} -p 55494 -c listen_addresses=','start']);assert r.returncode==0,r.stderr;started=True
 assert run('createdb',['-h',str(sock),'-p','55494','-U','postgres','cg_s1_verification']).returncode==0
 s=read('scripts/verification/canonical-foundation.sql');sql(s.split('-- Simulate broad')[0].replace('\\set ON_ERROR_STOP on',''))
 # Deliberately hostile platform defaults test explicit revocations.
 sql('ALTER DEFAULT PRIVILEGES GRANT ALL ON TABLES TO anon,authenticated,service_role; ALTER DEFAULT PRIVILEGES GRANT EXECUTE ON FUNCTIONS TO PUBLIC,anon,authenticated,service_role;')
 sql(s[s.index('INSERT INTO auth.users'):s.index('CREATE TEMP TABLE original_columns')]);migration('004')
 s=read('scripts/verification/publisher-coordination.sql');sql(s[s.index('CREATE TABLE public.packages'):s.index('\\ir ../../supabase/migrations/005')]);migration('005')
 s=read('scripts/verification/canonical-domain-machinery.sql');sql(s[s.index('CREATE EXTENSION'):s.index('\\ir ../../supabase/migrations/003')]);migration('003');migration('006')
 sql('ALTER TABLE public.listings ADD COLUMN description text, ADD COLUMN whatsapp text, ADD COLUMN source_url text;');migration('007')
 s=read('scripts/verification/commercial-capacity-coordination.sql');sql(s[s.index('ALTER TABLE public.packages'):s.index('-- Cached existing control writer')]);migration('008');migration('009');migration('010');migration('011');migration('018');migration('019');migration('023')
 sql("CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT jsonb_build_object('sub',auth.uid(),'aal','aal2','role','authenticated') $$; GRANT USAGE ON SCHEMA auth TO authenticated,service_role; GRANT EXECUTE ON FUNCTION auth.uid(),auth.jwt() TO authenticated,service_role;")
 sql("INSERT INTO auth.users VALUES('d81064bc-1b4a-478f-8f6a-b263c4779bc1');");migration('025');sql("CREATE FUNCTION public.reject_sinpe_payment(uuid,text) RETURNS void LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'out-of-scope fixture';END$$;");migration('026');migration('027')
 sql(f"INSERT INTO twuanis_canonical_private.owner_access_grants(user_id) VALUES('{user}');")
 bank_fixture=ident()
 sql(f"INSERT INTO public.listings(id,listing_origin,listing_source_type) VALUES('{bank_fixture}','imported','bank_remate');")
 sql(read('supabase/migrations/062_remates_foundation_and_ordinary_admission.sql'),'existing ordinary bank_remate records require explicit disposition')
 check('existing bank record installation fails without namespace/row mutation',f"SELECT to_regnamespace('twuanis_remates_private') IS NULL AND EXISTS(SELECT 1 FROM public.listings WHERE id='{bank_fixture}' AND listing_source_type='bank_remate')")
 sql(f"DELETE FROM public.listings WHERE id='{bank_fixture}';") # disposable test fixture only
 migration('062');results.append('exact migration 062 installs against affected real ordinary authority')
 print('SETUP PASS',flush=True)
 # Everything below is a disposable local fixture; no network or production clients.
 for table in ['properties','offerings','offering_properties','listings','property_reference_terms','foundation_events']:
  check(table+' postgres ownership / RLS',f"SELECT relowner='postgres'::regrole AND relrowsecurity FROM pg_class WHERE oid='twuanis_remates_private.{table}'::regclass")
  for r in ['anon','authenticated','service_role']:
   reject(r+' direct read '+table,role('SELECT * FROM twuanis_remates_private.'+table+';',r),'permission denied')
   check(r+' no direct mutation '+table,f"SELECT NOT has_table_privilege('{r}','twuanis_remates_private.{table}','INSERT,UPDATE,DELETE,TRUNCATE')")
 for r in ['anon','authenticated','service_role']:
  check(r+' no schema usage',f"SELECT NOT has_schema_privilege('{r}','twuanis_remates_private','USAGE')")
  check(r+' no private function execution',f"SELECT bool_and(NOT has_function_privilege('{r}',p.oid,'EXECUTE')) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='twuanis_remates_private'")
 check('all private functions fixed path',"SELECT bool_and(proconfig @> ARRAY['search_path=pg_catalog']) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='twuanis_remates_private'")
 reject('authenticated direct write denied',role("INSERT INTO twuanis_remates_private.properties DEFAULT VALUES;",'authenticated'),'permission denied')
 reject('trusted RPC bank type denied',role(trusted(src('bank_remate'))))
 reject('ordinary customer forged source denied',f"SELECT set_config('request.jwt.claim.sub','{user}',false); SELECT public.create_customer_canonical_listing('{ident()}',{js(dict(payload,source_type='bank_remate'))});",'22023')
 admin=dict(operation='create',origin='imported',input=payload,source=src('bank_remate'))
 reject('Owner forged Admin bank creation denied',f"SELECT set_config('request.jwt.claim.sub','{user}',false);SELECT public.admin_listing_command('{ident()}',{js(admin)});")
 reject('CSV creation bank type denied',role(f"SELECT public.create_csv_canonical_listing('{ident()}',{js(payload)},{js(src('bank_remate'))});"))
 # Retained source classification catches the automatic ingester's hardcoded realtor.
 name='known-bank';raw={'source_type':'bank_remate','source_name':name,'source_listing_id':'1','observation_id':'obs1','observed_at':'2026-10-01T00:00:00Z'}
 evidence=sql("SELECT public.retain_csv_source_evidence("+js(raw)+","+js({'status':'unresolved','canonical_authority':False,'values':{}})+");")
 print('EVIDENCE',evidence,flush=True)
 for kind in ['unknown','realtor','developer']:
  reject('known exact bank identity disguised '+kind,role(trusted(src(kind,name))))
 reject('known bank automatic observation ingestion denied',role(f"SELECT public.ingest_canonical_source_observation('{evidence}'::uuid,{js(payload)});"))
 # Positive ordinary workflows using the unchanged exact commands.
 sale=json.loads(sql(role(trusted(None))))['listing_id'];results.append('ordinary trusted Sale creation')
 rent=json.loads(sql(role(trusted(None,dict(payload,transaction='rent')))))['listing_id'];results.append('ordinary trusted Rent creation')
 customer=json.loads(sql(f"SELECT set_config('request.jwt.claim.sub','{user}',false);SELECT public.create_customer_canonical_listing('{ident()}',{js(payload)});").splitlines()[-1])['listing_id'];results.append('ordinary customer creation')
 admin['source']=src();aid=json.loads(sql(f"SELECT set_config('request.jwt.claim.sub','{user}',false);SELECT public.admin_listing_command('{ident()}',{js(admin)});").splitlines()[-1])['listing_id'];results.append('ordinary Admin imported creation')
 for listing in [sale,rent]:
  sql(role(f"SELECT public.mutate_trusted_canonical_listing('{listing}',1,'{ident()}','{{\"money\":{{\"amount\":\"100\",\"currency\":\"USD\"}}}}'::jsonb);"));results.append('ordinary '+listing+' edit preserved')
  sql(role(f"SELECT public.mutate_trusted_canonical_listing('{listing}',2,'{ident()}','{{\"lifecycle\":{{\"event\":\"publish\",\"duration_seconds\":\"3600\"}}}}'::jsonb);"));results.append('ordinary '+listing+' publication preserved')
  sql(role(f"SELECT public.mutate_trusted_canonical_listing('{listing}',3,'{ident()}','{{\"lifecycle\":{{\"event\":\"archive\",\"reason\":\"fixture\"}}}}'::jsonb);"));results.append('ordinary '+listing+' archive preserved')
  sql(role(f"SELECT public.mutate_trusted_canonical_listing('{listing}',4,'{ident()}','{{\"lifecycle\":{{\"event\":\"restore\",\"reason\":\"fixture\"}}}}'::jsonb);"));results.append('ordinary '+listing+' restoration preserved')
 reject('ordinary reclassification to bank denied',f"UPDATE public.listings SET listing_source_type='bank_remate' WHERE id='{sale}';")
 reject('ordinary edit to known bank source denied',f"UPDATE public.listings SET source_name='known-bank',source_listing_id='1',listing_source_type='unknown' WHERE id='{sale}';")
 # Positive retained CSV path including its existing initial-publication authority.
 normal=dict(raw,source_name='ordinary-csv',source_type='realtor')
 ev=sql("SELECT public.retain_csv_source_evidence("+js(normal)+","+js({'status':'unresolved','canonical_authority':False,'values':{}})+");")
 csv=json.loads(sql(role(f"SELECT public.ingest_canonical_source_observation('{ev}',{js(payload)});")))
 check('ordinary retained CSV ingestion and publication',f"SELECT listing_status='active' AND listing_source_type='realtor' FROM public.listings WHERE id='{csv['listing_id']}'")
 replay=json.loads(sql(role(f"SELECT public.ingest_canonical_source_observation('{ev}',{js(payload)});")))
 assert replay['listing_id']==csv['listing_id'] and replay['replayed'];results.append('ordinary CSV replay idempotent')
 # Snapshot all ordinary population/relationship structures around Remates fixture operations.
 # Representative warm derived/cache canaries, not production cache definitions or R-15.
 sql("CREATE TABLE public.market_statistics(fixture_key text PRIMARY KEY,payload jsonb);INSERT INTO public.market_statistics VALUES('warm','{\"n\":1}');CREATE TABLE public.market_cache_rebuild_logs(fixture_key text PRIMARY KEY,payload jsonb);INSERT INTO public.market_cache_rebuild_logs VALUES('unchanged','{}');CREATE MATERIALIZED VIEW public.ontology_graph_cache AS SELECT * FROM public.ontology_relationships;")
 ordinary=['market_statistics','market_cache_rebuild_logs','ontology_graph_cache','listings' ,'listings_ontology_terms','listing_membership_origins','listing_semantic_selections','listing_fact_evidence','ontology_terms','ontology_relationships']
 def snap():return {t:sql(f"SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY to_jsonb(x)::text),'[]') FROM public.{t} x") for t in ordinary}
 before=snap();p,o,l=ident(),ident(),ident()
 sql(f"INSERT INTO twuanis_remates_private.properties(id) VALUES('{p}');INSERT INTO twuanis_remates_private.offerings(id) VALUES('{o}');INSERT INTO twuanis_remates_private.offering_properties VALUES('{o}','{p}');INSERT INTO twuanis_remates_private.listings(id,offering_id) VALUES('{l}','{o}');INSERT INTO twuanis_remates_private.property_reference_terms VALUES('{p}','province',1001),('{p}','property_type',1);")
 assert snap()==before;results.append('all ten ordinary population/reference and representative warm-cache snapshots unchanged by foundation operations')
 check('three attributable foundation identity events',"SELECT count(*)=3 FROM twuanis_remates_private.foundation_events")
 reject('Remate UUID ordinary membership denied',f"INSERT INTO public.listings_ontology_terms VALUES('{l}',1);",'23503')
 reject('Remate UUID ordinary fact denied',f"INSERT INTO public.listing_fact_evidence(listing_id,dimension,kind,exact_value,evidence_source) VALUES('{l}','bedrooms','exact',2,'manual');",'23503')
 check('ordinary evidence reader excludes Remate',role(f"SELECT public.read_canonical_listing_evidence(ARRAY['{l}'::uuid],ARRAY[]::text[],ARRAY[]::text[])='[]'::jsonb;"))
 check('shared references create no ordinary membership',f"SELECT NOT EXISTS(SELECT 1 FROM public.listings_ontology_terms WHERE listing_id='{l}')")
 reject('Remate UUID ordinary storage admission denied',f"INSERT INTO public.listings(id,transaction_type,listing_origin,listing_source_type) VALUES('{l}','sale','system','unknown');")
 reject('ordinary UUID Remates storage admission denied',f"INSERT INTO twuanis_remates_private.listings(id,offering_id) VALUES('{sale}','{o}');")
 reject('Remates ordinary offering FK denied',f"INSERT INTO twuanis_remates_private.offering_properties VALUES('{o}','{sale}');",'23503')
 reject('typed reference mismatch denied',f"INSERT INTO twuanis_remates_private.property_reference_terms VALUES('{p}','district',1);")
 reject('foundation premature publication denied',f"UPDATE twuanis_remates_private.listings SET state='ACTIVE' WHERE id='{l}';",'55000')
 for t in ['properties','offerings','offering_properties','listings','property_reference_terms','foundation_events']:
  reject(t+' immutable update',f"UPDATE twuanis_remates_private.{t} SET "+('operation=operation' if t=='foundation_events' else 'property_id=property_id' if t in ['offering_properties','property_reference_terms'] else 'id=id')+';','55000')
  reject(t+' immutable delete',f'DELETE FROM twuanis_remates_private.{t};','55000')
  reject(t+' immutable truncate',f'TRUNCATE twuanis_remates_private.{t} CASCADE;','55000')
 # Independent sessions compete for the same UUID across both storage domains.
 race_id,race_offering=ident(),ident();sql(f"INSERT INTO twuanis_remates_private.offerings(id) VALUES('{race_offering}');")
 first=subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env)
 first.stdin.write(f"BEGIN;INSERT INTO twuanis_remates_private.listings(id,offering_id) VALUES('{race_id}','{race_offering}');SELECT 'READY:'||pg_backend_pid();\n");first.stdin.flush()
 import select,time
 assert select.select([first.stdout],[],[],10)[0];ready=first.stdout.readline().strip();assert ready.startswith('READY:'),ready;pid=int(ready.split(':')[1])
 second=subprocess.Popen(base+['-c',f"SET application_name='remates_r01_collision';SET statement_timeout='10s';INSERT INTO public.listings(id,listing_origin,listing_source_type) VALUES('{race_id}','system','unknown');"],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env)
 try:
  blocked=False
  for _ in range(100):
   blocked=sql(f"SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name='remates_r01_collision' AND {pid}=ANY(pg_blocking_pids(pid)))")=='t'
   if blocked:break
   time.sleep(.02)
  assert blocked,'real blocking dependency required';first.stdin.write('COMMIT;\n\\q\n');first.stdin.flush();first.communicate(timeout=10)
  out,err=second.communicate(timeout=12);assert second.returncode and '23514' in err,(out,err)
  check('independent-session shared UUID race has one Remates winner',f"SELECT EXISTS(SELECT 1 FROM twuanis_remates_private.listings WHERE id='{race_id}') AND NOT EXISTS(SELECT 1 FROM public.listings WHERE id='{race_id}')")
  results.append('actual cross-domain identity advisory blocking observed')
 finally:
  for proc in [first,second]:
   if proc.poll() is None:proc.kill();proc.communicate()
 check('no private ordinary-listing FK',"SELECT NOT EXISTS(SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace WHERE n.nspname='twuanis_remates_private' AND c.confrelid='public.listings'::regclass)")
 report={'status':'PASS','assertions':len(results),'results':results,'fixture':'Disposable PostgreSQL 17; exact affected migrations 003–011/018/019/023/025–027 and 062; representative existing table fixture, not production clone','full17EngineRegression':'NOT RUN / R-15','production':'UNCHANGED'}
 pathlib.Path('/private/tmp/remates-test-results.json').write_text(json.dumps(report,indent=2));print('PASS',len(results),'database checks')
finally:
 if started:run('pg_ctl',['-D',str(data),'stop','-m','fast'])
 import shutil;shutil.rmtree(dir)
