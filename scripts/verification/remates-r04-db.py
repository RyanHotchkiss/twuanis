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
 sql("CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT jsonb_build_object('sub',auth.uid(),'aal','aal2','role','authenticated') $$; GRANT USAGE ON SCHEMA auth TO authenticated,service_role; GRANT EXECUTE ON FUNCTION auth.uid(),auth.jwt() TO authenticated,service_role;")
 sql("INSERT INTO auth.users VALUES('d81064bc-1b4a-478f-8f6a-b263c4779bc1');");migration('025');sql("CREATE FUNCTION public.reject_sinpe_payment(uuid,text) RETURNS void LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'out-of-scope fixture';END$$;");migration('026');migration('027')
 sql(f"INSERT INTO twuanis_canonical_private.owner_access_grants(user_id) VALUES('{user}');")
 bank_fixture=ident()
 sql(f"INSERT INTO public.listings(id,listing_origin,listing_source_type) VALUES('{bank_fixture}','imported','bank_remate');")
 sql(read('supabase/migrations/062_remates_foundation_and_ordinary_admission.sql'),'existing ordinary bank_remate records require explicit disposition')
 check('existing bank record installation fails without namespace/row mutation',f"SELECT to_regnamespace('twuanis_remates_private') IS NULL AND EXISTS(SELECT 1 FROM public.listings WHERE id='{bank_fixture}' AND listing_source_type='bank_remate')")
 sql(f"DELETE FROM public.listings WHERE id='{bank_fixture}';") # disposable test fixture only
 migration('062');results.append('exact migration 062 installs against affected real ordinary authority')

 # Reconstruct only the exact retained-history/live-account prerequisites; do not replay unrelated 060 tests.
 sql("CREATE TABLE twuanis_canonical_private.account_principals(id uuid PRIMARY KEY,deleted_at timestamptz);INSERT INTO twuanis_canonical_private.account_principals(id) SELECT id FROM auth.users;ALTER TABLE twuanis_canonical_private.account_principals ENABLE ROW LEVEL SECURITY;REVOKE ALL ON twuanis_canonical_private.account_principals FROM PUBLIC,anon,authenticated,service_role;")
 import re
 live=re.search(r'CREATE FUNCTION public.is_live_account\(\).*?\$\$;',read('supabase/migrations/060_account_deletion_historical_identity.sql'),re.S).group(0);sql(live)
 migration('063');results.append('exact 063 installs after 062')
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
 # R-02 scenarios run after the affected R-01 regression checks above.
 base_count=len(results)
 def owned(q,who=user):return role(f"SELECT set_config('request.jwt.claim.sub','{who}',true);"+q,'authenticated')
 def cmd(c,request=None,who=user):return json.loads(sql(owned(f"SELECT public.remate_registry_command('{request or ident()}',{js(c)});",who)).splitlines()[-1])
 def request(c,request=None,who=user):return owned(f"SELECT public.remate_registry_command('{request or ident()}',{js(c)});",who)
 def rd(q):return json.loads(sql(owned('SELECT public.remate_registry_read('+js(q)+');')).splitlines()[-1])
 common={'reason':'local test evidence; no real institution'}
 reg=dict(common,operation='institution.register',name='Institution A fixture')
 r_id=ident();a=cmd(reg,r_id)['id'];results.append('Owner creates unattributed UNAPPROVED institution')
 check('registered institution gives no partnership',f"SELECT approval_status='UNAPPROVED' AND legal_identifier IS NULL FROM twuanis_remates_private.institutions WHERE id='{a}'")
 assert cmd(reg,r_id)['replayed'];results.append('identical retry returns same receipt/id')
 reject('changed receipt replay rejected',request(dict(reg,name='changed'),r_id),'22023')
 b=cmd(dict(reg,name='Institution B fixture'))['id']
 verify=dict(common,operation='institution.verify',target=a,expected='1',legal_identifier='TEST-LEGAL-A',identity_evidence='fixture registry verification reference')
 cmd(verify);results.append('Owner verification immutable legal identity and evidence')
 reject('stale institution expected revision denied',request(verify),'40001')
 reject('verified identity cannot be rebound',request(dict(verify,expected='2',legal_identifier='CHANGED')))
 reject('duplicate verified legal identity denied',request(dict(verify,target=b)),'23505')
 approval=dict(common,operation='institution.approve',target=b,expected='1',mandate_evidence='fixture representative mandate reviewed',initial_representative_reference='fixture representative legal identity reference')
 reject('unverified institution cannot be approved',request(approval))
 c=cmd(dict(reg,name='Institution C fixture'))['id']
 cmd(dict(verify,target=c,legal_identifier='TEST-LEGAL-C'))
 approval=dict(approval,target=c,expected='2');approval_request=ident()
 reject('missing representative reference denied',request({k:v for k,v in approval.items() if k!='initial_representative_reference'}),'22023')
 reject('wrong evidence type denied',request(dict(approval,mandate_evidence=True)),'22023')
 reject('empty representative reference denied',request(dict(approval,initial_representative_reference=' ')))
 reject('stale approval revision denied',request(dict(approval,expected='1')),'40001')
 first_approval=cmd(approval,approval_request)
 check('explicit approval preserves verified identity and representative authority',f"SELECT approval_status='APPROVED' AND revision=3 AND legal_identifier='TEST-LEGAL-C' AND initial_representative_reference={lit(approval['initial_representative_reference'])} AND mandate_evidence={lit(approval['mandate_evidence'])} FROM twuanis_remates_private.institutions WHERE id='{c}'")
 assert cmd(approval,approval_request)['replayed'];results.append('approval receipt idempotent')
 reject('changed approval receipt cannot rewrite mandate',request(dict(approval,mandate_evidence='changed reference'),approval_request),'22023')
 reject('approval cannot be silently rewritten',request(dict(approval,expected='3')))
 check('approval audit preserves before and after authority',f"SELECT EXISTS(SELECT 1 FROM twuanis_remates_private.institution_events WHERE institution_id='{c}' AND operation='institution.approve' AND before_state->>'approval_status'='UNAPPROVED' AND after_state->>'approval_status'='APPROVED')")
 assert rd({'mode':'institutions'})['approvalAvailable'];results.append('Owner read exposes approval availability')
 sreg=dict(common,operation='source.register',institution=a,expected='2',namespace='Bank.Fixture',channel='BANK_WEB',origin='https://bank.fixture.example',adapter_version='unimplemented-v1')
 sid=cmd(sreg)['id'];results.append('Owner registers source independent of approval')
 check('registered source disabled and not a partnership',f"SELECT NOT s.enabled AND i.approval_status='UNAPPROVED' FROM twuanis_remates_private.sources s JOIN twuanis_remates_private.institutions i ON i.id=s.institution_id WHERE s.id='{sid}'")
 for ns in ['bank.fixture','BANK.FIXTURE',' bank.fixture ']:
  for kind in ['unknown','realtor']:
   reject('registered namespace normalized disguise '+ns+'/'+kind,role(trusted(src(kind,ns))))
 alias=dict(common,operation='source.alias',target=sid,expected='1',namespace='Bank.Alias')
 alias_req=ident();cmd(alias,alias_req);assert cmd(alias,alias_req)['replayed'];results.append('alias receipt retry stable')
 reject('stale alias revision denied',request(dict(alias,namespace='another.alias')),'40001')
 reject('alias collision cannot rebind source',request(dict(sreg,institution=b,expected='1',namespace='bank.alias',origin='https://another.fixture.example')),'23505')
 reject('forged institution rejected',request(dict(sreg,institution=ident(),namespace='another.valid')),'22023')
 reject('origin cannot bind another institution',request(dict(sreg,institution=b,expected='1',namespace='different.valid')))
 reject('known source origin cannot enter direct ordinary storage',f"INSERT INTO public.listings(listing_origin,listing_source_type,source_url) VALUES('imported','unknown','https://bank.fixture.example/property/1');")
 raw2=dict(raw,source_name='disguised-unregistered',source_listing_id='origin-case',source_type='unknown',source_url='https://bank.fixture.example/property/1')
 raw2_ev=sql("SELECT public.retain_csv_source_evidence("+js(raw2)+","+js({'status':'unresolved','canonical_authority':False,'values':{}})+");")
 reject('registered bank origin in retained evidence rejects namespace relabel',role(trusted(src('unknown','disguised-unregistered','origin-case'))))
 reject('automatic CSV unknown namespace / registered origin denied',role(f"SELECT public.ingest_canonical_source_observation('{raw2_ev}',{js(payload)});"))
 for origin in ['http://invalid.example','https://127.0.0.1','https://user@invalid.example','https://invalid.example/path','https://invalid.example:443']:
  reject('noncanonical origin denied '+origin,request(dict(sreg,namespace='invalid-'+ident(),origin=origin)), '22023' if origin!='https://127.0.0.1' else '23514')
 source_names=json.loads(sql("SELECT jsonb_agg(source_name) FROM public.listings WHERE source_name IS NOT NULL"));ordinary_ns=next(n for n in source_names if n.startswith('test-'))
 reject('ordinary namespace collision prevents registration',request(dict(sreg,namespace=ordinary_ns)))
 check('failed collision left ordinary inventory intact',f"SELECT EXISTS(SELECT 1 FROM public.listings WHERE source_name={lit(ordinary_ns)}) AND NOT EXISTS(SELECT 1 FROM twuanis_remates_private.source_aliases WHERE namespace={lit(ordinary_ns)})")
 customer_user=ident();sql(f"INSERT INTO auth.users VALUES('{customer_user}');INSERT INTO twuanis_canonical_private.account_principals(id) VALUES('{customer_user}');INSERT INTO twuanis_canonical_private.administrators(user_id) VALUES('{customer_user}');INSERT INTO twuanis_canonical_private.administrative_permission_grants VALUES('{customer_user}','configuration.manage');")
 reject('ordinary Administrator cannot register institution',request(reg,who=customer_user),'42501')
 reject('ordinary Administrator cannot approve institution',request(dict(approval,target=a),who=customer_user),'42501')
 reject('ordinary Administrator cannot read registry',owned("SELECT public.remate_registry_read('{}');",customer_user),'42501')
 for c in [dict(reg,actor=user),dict(reg,owner=True),dict(reg,institution=user)]:reject('caller cannot supply actor/authority',request(c),'22023')
 for r in ['anon','service_role']:
  reject(r+' cannot execute registry command',role(f"SELECT public.remate_registry_command('{ident()}',{js(reg)});",r),'42501')
  reject(r+' cannot execute registry read',role("SELECT public.remate_registry_read();",r),'42501')
 for t in ['institutions','sources','source_origin_hosts','source_aliases','institution_events','command_receipts']:
  check(t+' RLS / postgres owner',f"SELECT relrowsecurity AND relowner='postgres'::regrole FROM pg_class WHERE oid='twuanis_remates_private.{t}'::regclass")
  for r in ['anon','authenticated','service_role']:
   check(t+'/'+r+' no direct grants',f"SELECT NOT has_table_privilege('{r}','twuanis_remates_private.{t}','SELECT,INSERT,UPDATE,DELETE,TRUNCATE')")
 for t in ['source_aliases','source_origin_hosts','institution_events','command_receipts']:
  reject(t+' immutable history delete',f'DELETE FROM twuanis_remates_private.{t};','55000')
  reject(t+' no truncate',f'TRUNCATE twuanis_remates_private.{t} CASCADE;','55000')
 check('source enablement impossible in R-02',f"SELECT NOT enabled FROM twuanis_remates_private.sources WHERE id='{sid}'")
 reject('no source enable bypass',f"UPDATE twuanis_remates_private.sources SET enabled=true WHERE id='{sid}';")
 before2=snap();foundation=dict(common,operation='foundation.create',target=sid,expected='2');fr=ident();draft=cmd(foundation,fr)
 assert cmd(foundation,fr)['id']==draft['id'];results.append('R-01 runtime draft identity batch idempotent')
 assert snap()==before2;results.append('R-01 runtime creation changes no ordinary/cache snapshot')
 check('runtime offering source / institution FK correct',f"SELECT o.source_id='{sid}' AND o.institution_id='{a}' FROM twuanis_remates_private.listings l JOIN twuanis_remates_private.offerings o ON o.id=l.offering_id WHERE l.id='{draft['id']}'")
 reject('stale R-01 source revision denied',request(dict(foundation,expected='1')),'40001')
 reject('no premature foundation publication',request(dict(common,operation='foundation.publish',target=draft['id'],expected='1')),'22023')
 assert len(rd({'mode':'foundation'})['items'])>=1;results.append('R-01 bounded Owner draft read operational')
 assert len(rd({'mode':'sources','target':a})['items'])==1;results.append('bounded source projection has exact string revision')
 assert rd({'mode':'sources','target':a})['items'][0]['revision']=='2'
 assert len(rd({'mode':'aliases','target':sid})['items'])==2;results.append('bounded aliases include canonical namespace and new alias')
 reject('unsupported read fields denied',owned("SELECT public.remate_registry_read('{\"mode\":\"institutions\",\"actor\":\"x\"}');"),'22023')
 for n in range(27):cmd(dict(reg,name='pagination fixture '+str(n)))
 page=rd({'mode':'institutions'})['items'];assert len(page)==26;next_page=rd({'mode':'institutions','after':page[24]['id']})['items'];assert not set(x['id'] for x in page[:25]) & set(x['id'] for x in next_page);results.append('institution keyset pagination bounded with no duplicate page IDs')
 sql(f"UPDATE twuanis_canonical_private.account_principals SET deleted_at=now() WHERE id='{user}';")
 reject('tombstoned actor denied before cached receipt replay',request(reg,r_id),'42501')
 check('audit history retained against nonauthenticating principal',f"SELECT EXISTS(SELECT 1 FROM twuanis_remates_private.command_receipts WHERE actor_id='{user}')")
 sql(f"UPDATE twuanis_canonical_private.account_principals SET deleted_at=NULL WHERE id='{user}';") # disposable fixture reset only
 # Same-request Owner race: existing global administrative transaction lock orders receipt lookup.
 race_req=ident();q=request(dict(reg,name='same-request race'),race_req)
 ps=[subprocess.Popen(base,input=None,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env) for _ in []]
 ps=[subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env) for _ in range(2)]
 for proc in ps:proc.stdin.write(q);proc.stdin.close();proc.stdin=None
 outs=[proc.communicate(timeout=15) for proc in ps];assert all(proc.returncode==0 for proc in ps),outs
 check('two sessions same request exactly one receipt',f"SELECT count(*)=1 FROM twuanis_remates_private.command_receipts WHERE request_id='{race_req}'")
 results.append('two-session Owner retry race both return success')
 # Register vs ordinary admission race, with an observed real table-lock blocker.
 race_ns='bank-race-'+ident();rq=dict(sreg,namespace=race_ns,origin='https://race.fixture.example')
 first=subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env)
 first.stdin.write('BEGIN;'+owned("SELECT public.remate_registry_command('"+ident()+"',"+js(rq)+");").replace('BEGIN;','').replace('COMMIT;','')+"SELECT 'READY:'||pg_backend_pid();\n");first.stdin.flush();assert select.select([first.stdout],[],[],10)[0]
 line=first.stdout.readline().strip()
 while not line.startswith('READY:'):line=first.stdout.readline().strip()
 pid=int(line.split(':')[1]);second=subprocess.Popen(base+['-c',"SET application_name='remates_source_race';SET statement_timeout='10s';"+role(trusted(src('unknown',race_ns)))],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env)
 try:
  blocked=False
  for _ in range(100):
   blocked=sql(f"SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name='remates_source_race' AND {pid}=ANY(pg_blocking_pids(pid)))")=='t'
   if blocked:break
   time.sleep(.02)
  assert blocked;first.stdin.write('COMMIT;\n\\q\n');first.stdin.flush();first.communicate(timeout=10)
  out,err=second.communicate(timeout=12);assert second.returncode and 'registered Remates namespace' in err,(out,err);results.append('real source registration/admission race blocked ordinary creation')
 finally:
  for proc in [first,second]:
   if proc.poll() is None:proc.kill();proc.communicate()
 check('every command has immutable audit in same transaction',"SELECT count(*)=(SELECT count(*) FROM twuanis_remates_private.institution_events) FROM twuanis_remates_private.command_receipts")
 check('no institutional authority/financial records introduced',"SELECT to_regclass('twuanis_remates_private.memberships') IS NULL AND to_regclass('twuanis_remates_private.permission_grants') IS NULL")
 print('R-02 PASS',len(results)-base_count,'focused checks',flush=True)

 r03_start=len(results);r03_ordinary=snap();r03_global=sql("SELECT (SELECT count(*) FROM twuanis_canonical_private.administrators)::text||':'||(SELECT count(*) FROM twuanis_canonical_private.administrative_permission_grants)::text")
 sql("ALTER TABLE auth.users ADD COLUMN email_confirmed_at timestamptz,ADD COLUMN banned_until timestamptz;UPDATE auth.users SET email_confirmed_at=now();CREATE TABLE auth.sessions(id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE);CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$SELECT jsonb_build_object('role','authenticated')||coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;")
 sessions={}
 def account(confirmed=True):
  who=ident();sql(f"INSERT INTO auth.users(id,email_confirmed_at) VALUES('{who}',{'now()' if confirmed else 'NULL'});INSERT INTO twuanis_canonical_private.account_principals(id) VALUES('{who}');");return who
 def setsession(who):
  session=ident();sql(f"INSERT INTO auth.sessions VALUES('{session}','{who}');");sessions[who]=session;return session
 for who in [user,customer_user]:setsession(who)
 def scoped(q,who=user):return role(f"SELECT set_config('request.jwt.claim.sub','{who}',true);SELECT set_config('request.jwt.claims',{lit(json.dumps({'session_id':sessions.get(who,ident())}))},true);"+q,'authenticated')
 def ac(c,req=None,who=user):return scoped(f"SELECT public.remate_authority_command('{req or ident()}',{js(c)});",who)
 def execute(c,req=None,who=user):return json.loads(sql(ac(c,req,who)).splitlines()[-1])
 def ar(q,who=user):return json.loads(sql(scoped('SELECT public.remate_authority_read('+js(q)+');',who)).splitlines()[-1])
 migration('064');results.append('064 installation PASS with representative Auth session schema')
 admin1,admin2,rep,admin_b,unconfirmed=[account() for _ in range(4)]+[account(False)]
 for who in [admin1,admin2,rep,admin_b,unconfirmed]:setsession(who)
 def approved(name,legal):
  inst=cmd(dict(reg,name=name))['id'];cmd(dict(verify,target=inst,legal_identifier=legal));cmd(dict(approval,target=inst,expected='2'));return inst
 ia=approved('Institution R03 A fixture','R03-LEGAL-A');ib=approved('Institution R03 B fixture','R03-LEGAL-B')
 base_command={'institution':ia,'reason':'local R03 authority evidence'}
 def app(target,institution=ia,kind='administrator.appoint'):return dict(base_command,institution=institution,operation=kind,target=target,expected='0',mandate_evidence='Owner-reviewed initial identity and mandate reference')
 def change(target,op,revision,permission=None,institution=ia):
  c=dict(base_command,institution=institution,operation=op,target=target,expected=str(revision))
  if permission:c['permission']=permission
  return c
 ra=execute(app(admin1));results.append('Owner appoints initial administrator with mandate evidence')
 check('appointment grants no automatic permissions',f"SELECT NOT EXISTS(SELECT 1 FROM twuanis_remates_private.permission_grants WHERE membership_id='{ra['id']}')")
 reject('unconfirmed target cannot be appointed',ac(app(unconfirmed)),'42501')
 sql(f"UPDATE auth.users SET banned_until=now()+interval '1 day' WHERE id='{unconfirmed}';")
 reject('banned account cannot exercise existing session',ac(app(admin2),who=unconfirmed),'42501')
 sql(f"UPDATE auth.users SET banned_until=now()+interval '1 day' WHERE id='{user}';")
 reject('confirmed banned Owner denied by live session reader',scoped("SELECT public.remate_authority_read('{\"mode\":\"institutions\"}');"),'42501')
 sql(f"UPDATE auth.users SET banned_until=NULL WHERE id='{user}';")
 reject('global Administrator does not inherit institutional authority',ac(app(admin2),who=customer_user),'42501')
 reject('unpermissioned institution Administrator cannot delegate',ac(app(admin2),who=admin1),'42501')
 rev=1
 for permission in ['administrators.appoint','administrators.manage','representatives.manage','permissions.manage','audit.read','drafts.create']:
  execute(change(admin1,'permission.grant',rev,permission));rev+=1
 rb=execute(app(admin_b,institution=ib));execute(change(admin_b,'permission.grant',1,'administrators.appoint',ib))
 req=ident();r2=execute(app(admin2),req,admin1);results.append('D03 authorized institution administrator appoints another administrator')
 assert execute(app(admin2),req,admin1)['replayed'];results.append('appointment receipt replay stable')
 reject('appointment receipt changed payload denied',ac(dict(app(admin2),reason='changed'),req,admin1),'22023')
 reject('cross institution administrator appointment denied',ac(app(account(),institution=ib),who=admin1),'42501')
 reject('forged institution denied',ac(app(admin2,institution=ident()),who=admin1),'42501')
 reject('self escalation denied',ac(change(admin1,'permission.grant',rev,'inventory.publish'),who=admin1),'42501')
 execute(change(admin2,'permission.grant',1,'administrators.appoint'),who=admin1);results.append('delegated permission grant limited to held subset')
 reject('cannot delegate permission not held',ac(change(admin2,'permission.grant',2,'inventory.publish'),who=admin1),'42501')
 promoted=account();execute(app(promoted,kind='representative.activate'),who=admin1)
 promotion=execute(dict(app(promoted),expected='1'),who=admin1)
 check('explicit scoped representative promotion retains membership and grants no permissions',f"SELECT class='ADMINISTRATOR' AND revision=2 AND NOT EXISTS(SELECT 1 FROM twuanis_remates_private.permission_grants WHERE membership_id=m.id) FROM twuanis_remates_private.memberships m WHERE id='{promotion['id']}'")
 check('representative promotion preserves before/after class audit',f"SELECT EXISTS(SELECT 1 FROM twuanis_remates_private.authority_events WHERE subject_id='{promoted}' AND before_state->>'class'='REPRESENTATIVE' AND after_state->>'class'='ADMINISTRATOR')")
 execute(change(promoted,'administrator.revoke',2));results.append('Owner can revoke a non-last institution administrator')
 check('Owner administrator revocation preserves membership history',f"SELECT NOT active AND revision=3 FROM twuanis_remates_private.memberships WHERE principal_id='{promoted}' AND institution_id='{ia}'")
 reject('stale membership permission revision rejected',ac(change(admin2,'permission.grant',1,'audit.read')),'40001')
 rr=execute(app(rep,kind='representative.activate'),who=admin1);results.append('authorized representative activation')
 execute(change(rep,'permission.grant',1,'drafts.create'),who=admin1)
 reject('representative cannot acquire administrator management permission',ac(change(rep,'permission.grant',2,'administrators.appoint'),who=admin1),'42501')
 reject('representative cannot appoint administrators',ac(app(account()),who=rep),'42501')
 reject('administrator without management authority cannot remove admin',ac(change(admin1,'administrator.revoke',rev),who=admin2),'42501')
 reject('last institution administrator cannot be revoked by Owner',ac(change(admin_b,'administrator.revoke',2,institution=ib)))
 reject('last appointment permission cannot be revoked',ac(change(admin_b,'permission.revoke',2,'administrators.appoint',ib)))
 reject('last administrator account deletion denied',f"DELETE FROM auth.users WHERE id='{admin_b}';")
 sources=cmd(dict(sreg,institution=ia,expected='3',namespace='r03.fixture.a',origin='https://r03-a.fixture.example'))['id']
 source_b=cmd(dict(sreg,institution=ib,expected='3',namespace='r03.fixture.b',origin='https://r03-b.fixture.example'))['id']
 draft=dict(base_command,operation='foundation.create',target=sources,expected='1')
 dreq=ident();draft_result=execute(draft,dreq,rep);results.append('new R01 contract representative creates source-bound provisional draft')
 assert execute(draft,dreq,rep)['id']==draft_result['id'];results.append('scoped draft idempotency')
 reject('cross institutional source rejected',ac(dict(draft,target=source_b),who=rep),'42501')
 reject('stale draft source revision rejected',ac(dict(draft,expected='2'),who=rep),'40001')
 assert [x['id'] for x in ar({'mode':'foundation','institution':ia},rep)['items']]==[draft_result['id']];results.append('scoped draft read no cross institution leakage')
 assert {x['id'] for x in ar({'mode':'institutions'},admin1)['items']}=={ia};results.append('institution discovery scoped to active membership')
 reject('cross institution read denied',scoped('SELECT public.remate_authority_read('+js({'mode':'members','institution':ib})+');',admin1),'42501')
 reject('representative management read denied',scoped('SELECT public.remate_authority_read('+js({'mode':'members','institution':ia})+');',rep),'42501')
 reject('audit permission required',scoped('SELECT public.remate_authority_read('+js({'mode':'events','institution':ia})+');',admin2),'42501')
 assert ar({'mode':'events','institution':ia},admin1)['items'];results.append('authorized scoped audit visibility')
 execute(change(rep,'permission.revoke',2,'drafts.create'),who=admin1)
 reject('revoked draft permission immediately denies old receipt',ac(draft,dreq,rep),'42501')
 execute(change(rep,'representative.revoke',3),who=admin1)
 reject('revoked membership cannot read',scoped('SELECT public.remate_authority_read('+js({'mode':'sources','institution':ia})+');',rep),'42501')
 sql(f"DELETE FROM auth.sessions WHERE id='{sessions[admin2]}';")
 reject('revoked session denies authority',ac(app(account()),who=admin2),'42501');setsession(admin2)
 sql(f"UPDATE twuanis_canonical_private.account_principals SET deleted_at=now() WHERE id='{admin2}';")
 reject('deleted principal denies stale session',ac(app(account()),who=admin2),'42501');sql(f"UPDATE twuanis_canonical_private.account_principals SET deleted_at=NULL WHERE id='{admin2}';")
 for table in ['memberships','permissions','permission_grants','permission_revocations','authority_events']:
  check(table+' RLS/postgres owner',f"SELECT relrowsecurity AND relowner='postgres'::regrole FROM pg_class WHERE oid='twuanis_remates_private.{table}'::regclass")
  for role_name in ['anon','authenticated','service_role']:check(table+'/'+role_name+' no direct access',f"SELECT NOT has_table_privilege('{role_name}','twuanis_remates_private.{table}','SELECT,INSERT,UPDATE,DELETE,TRUNCATE')")
 for role_name in ['anon','service_role']:
  reject(role_name+' cannot execute authority RPC',role(f"SELECT public.remate_authority_command('{ident()}',{js(app(admin2))});",role_name),'42501')
 for t in ['permission_grants','permission_revocations','authority_events']:
  reject(t+' audit immutable',f'DELETE FROM twuanis_remates_private.{t};','55000')
 # Real competing stale revisions serialize on the same canonical lock.
 competing=account();cmd_payload=app(competing);request_id=ident();q=ac(cmd_payload,request_id,admin1)
 ps=[]
 for _ in range(2):ps.append(subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env))
 for proc in ps:proc.stdin.write(q+'\n');proc.stdin.close();proc.stdin=None
 outs=[proc.communicate(timeout=15) for proc in ps];assert all(proc.returncode==0 for proc in ps),outs
 check('concurrent exact authority retries create one receipt',f"SELECT count(*)=1 FROM twuanis_remates_private.command_receipts WHERE actor_id='{admin1}' AND request_id='{request_id}'")
 check('authority audit records applied outcomes only',"SELECT bool_and(outcome='APPLIED') FROM twuanis_remates_private.authority_events")
 check('each R03 receipt has one authority event',"SELECT NOT EXISTS(SELECT 1 FROM twuanis_remates_private.authority_events e LEFT JOIN twuanis_remates_private.command_receipts r ON r.id=e.receipt_id WHERE r.id IS NULL)")
 # Revocation holds the canonical authority lock; the competing actor is blocked then denied.
 revoke=change(admin2,'permission.revoke',2,'administrators.appoint')
 first=subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env)
 first.stdin.write("BEGIN;SET application_name='r03_revoke';"+ac(revoke).replace('BEGIN;','').replace(' COMMIT;','')+"SELECT pg_backend_pid();\n");first.stdin.flush()
 pid=None
 for _ in range(8):
  line=first.stdout.readline().strip()
  if line.isdigit():pid=int(line);break
 assert pid
 second=subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env)
 second.stdin.write("SET application_name='r03_after_revoke';"+ac(app(account()),who=admin2)+"\n");second.stdin.close();second.stdin=None
 blocked=False
 for _ in range(100):
  blocked=sql(f"SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name='r03_after_revoke' AND {pid}=ANY(pg_blocking_pids(pid)))")=='t'
  if blocked:break
  time.sleep(.02)
 assert blocked
 first.stdin.write("COMMIT;\n\\q\n");first.stdin.flush();first.communicate(timeout=10)
 out,err=second.communicate(timeout=12);assert second.returncode and '42501' in err,(out,err);results.append('revocation/appointment race observed lock then authority denial')
 # Simulate the existing deletion workflow marking the principal before auth-row removal.
 sql(f"UPDATE twuanis_canonical_private.account_principals SET deleted_at=now() WHERE id='{admin2}';DELETE FROM auth.users WHERE id='{admin2}';")
 check('non-last Auth deletion preserves historical membership',f"SELECT live_user_id IS NULL AND principal_id='{admin2}' FROM twuanis_remates_private.memberships WHERE id='{r2['id']}'")
 reject('historical membership cannot receive new permissions',ac(change(admin2,'permission.grant',3,'audit.read')))
 check('deleted identity retains attributable grant evidence',f"SELECT EXISTS(SELECT 1 FROM twuanis_remates_private.permission_grants WHERE membership_id='{r2['id']}')")
 for role_name in ['anon','authenticated','service_role']:
  check('no private function execution '+role_name,f"SELECT bool_and(NOT has_function_privilege('{role_name}',p.oid,'EXECUTE')) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='twuanis_remates_private'")
 check('public authority RPC definitions fixed SECURITY DEFINER',"SELECT bool_and(prosecdef AND proowner='postgres'::regrole AND proconfig @> ARRAY['search_path=pg_catalog']) FROM pg_proc WHERE oid IN('public.remate_authority_command(uuid,jsonb)'::regprocedure,'public.remate_authority_read(jsonb)'::regprocedure)")
 suspend=dict(base_command,operation='institution.suspend',expected='3')
 execute(suspend);results.append('Owner suspends institutional participation without inventory mutation')
 reject('suspended institution denies actor before receipt replay',ac(cmd_payload,request_id,admin1),'42501')
 reject('suspended institution denies scoped reads',scoped('SELECT public.remate_authority_read('+js({'mode':'sources','institution':ia})+');',admin1),'42501')
 assert ar({'mode':'events','institution':ia},user)['items'];results.append('Owner retains oversight of suspended institution')
 assert snap()==r03_ordinary;results.append('R03 ordinary population/reference/warm cache snapshots unchanged')
 assert sql("SELECT (SELECT count(*) FROM twuanis_canonical_private.administrators)::text||':'||(SELECT count(*) FROM twuanis_canonical_private.administrative_permission_grants)::text")==r03_global;results.append('global admin roles and permission population unchanged')
 print('R03',len(results)-r03_start,'focused checks PASS',flush=True)


 r04_start=len(results);r04_ordinary=snap();migration('065');results.append('065 exact local installation')
 ic=approved('R04 local institution','R04-LEGAL');sc=cmd(dict(sreg,institution=ic,expected='3',namespace='r04.fixture',origin='https://r04.fixture.example'))['id']
 member=account();setsession(member);execute(app(member,institution=ic,kind='representative.activate'))
 for index,permission in enumerate(['inventory.import','audit.read','drafts.edit']):execute(change(member,'permission.grant',index+1,permission,institution=ic))
 def ec(c,req=None,who=user):return scoped(f"SELECT public.remate_evidence_command('{req or ident()}',{js(c)});",who)
 def evidence(op,body,**kw):return dict(operation=op,institution=ic,source=sc,expected='1',reason='Authorized local fixture only',evidence=body,**kw)
 def retain(c,req=None,who=user):return json.loads(sql(ec(c,req,who)).splitlines()[-1])
 def er(q,who=user):return json.loads(sql(scoped('SELECT public.remate_evidence_read('+js(dict(institution=ic,source=sc,**q))+');',who)).splitlines()[-1])
 run_body=dict(key='local-run',started_at='2026-10-08T00:00:00Z',ended_at='2026-10-08T00:05:00Z',outcome='PARTIAL',scope='one local fixture page; not entire bank inventory',pages=[dict(key='page-1',status='RETAINED'),dict(key='page-2',status='FAILED')])
 run_command=evidence('run.retain',run_body);req=ident();run_result=retain(run_command,req,member);runid=run_result['id'];results.append('scoped permission retains immutable partial run')
 assert retain(run_command,req,member)['replayed'];results.append('exact receipt retry returns retained run')
 assert retain(run_command,who=member)['receiptId']==run_result['receiptId'];results.append('same source run key returns original receipt')
 reject('changed run bytes conflict',ec(evidence('run.retain',dict(run_body,scope='changed'))),'22023')
 reject('partial pages cannot claim COMPLETE',ec(evidence('run.retain',dict(run_body,key='false-complete',outcome='COMPLETE'))))
 reject('complete requires page evidence',ec(evidence('run.retain',dict(run_body,key='empty-complete',outcome='COMPLETE',pages=[]))))
 reject('missing page outcome invalid',ec(evidence('run.retain',dict(run_body,key='null-page',pages=[dict(key='page',status=None)]))),'22023')
 for value in ['2026-10-08T00:00:00','infinity',None,1]:reject('timezone/finite/typed run start '+str(value),ec(evidence('run.retain',dict(run_body,key=ident(),started_at=value))),'22023')
 reject('end before start',ec(evidence('run.retain',dict(run_body,key=ident(),ended_at='2026-10-07T00:00:00Z'))))
 obs_body=dict(key='obs-1',record_key='record-1',run=runid,retrieved_at='2026-10-08T00:02:00Z',published_at=None,updated_at=None,url='https://r04.fixture.example/item-1',parser_version='fixture-parser-v1',parse_status='FAILED',raw='  raw evidence \n USD ??? — retained exactly',fields=[dict(path='price',ordinal=0,label='Original label',raw='???',unit=None,currency=None,page=1,selector='local selector',validation='INVALID'),dict(path='published',ordinal=0,label='Missing date',raw=None,validation='MISSING')])
 obs_command=evidence('observation.retain',obs_body);obs_req=ident();obs_result=retain(obs_command,obs_req,member);obsid=obs_result['id'];results.append('failed parse retains authorized raw and lossless assertions')
 check('missing source times remain NULL',f"SELECT published_at IS NULL AND updated_at IS NULL FROM twuanis_remates_private.observations WHERE id='{obsid}'")
 check('raw SHA256 computed from exact UTF8 bytes',f"SELECT content_sha256={lit(hashlib.sha256(obs_body['raw'].encode()).hexdigest())} AND raw_text={lit(obs_body['raw'])} AND recorded_at<>retrieved_at FROM twuanis_remates_private.observations WHERE id='{obsid}'")
 check('lossless missing and invalid field assertions',f"SELECT count(*)=2 AND count(*) FILTER(WHERE raw_value IS NULL AND validation='MISSING')=1 FROM twuanis_remates_private.observation_fields WHERE observation_id='{obsid}'")
 assert retain(obs_command,obs_req,member)['id']==obsid;results.append('identical observation request retry returns same UUID')
 assert retain(obs_command,who=member)['receiptId']==obs_result['receiptId'];results.append('identical observation key returns original receipt')
 reject('different raw bytes same observation key conflict',ec(evidence('observation.retain',dict(obs_body,raw='different'))),'22023')
 reject('different field provenance same key conflict',ec(evidence('observation.retain',dict(obs_body,fields=[]))),'22023')
 reject('changed payload same request fails',ec(evidence('observation.retain',dict(obs_body,raw='changed')),obs_req,member),'22023')
 for url in ['http://r04.fixture.example/x','https://other.example/x','https://secret@r04.fixture.example/x','https://r04.fixture.example/x?token=secret','https://r04.fixture.example/x#secret']:
  reject('unsafe/outside source URL '+url,ec(evidence('observation.retain',dict(obs_body,key=ident(),url=url))),'22023')
 reject('foreign run denied',ec(evidence('observation.retain',dict(obs_body,key=ident(),run=ident()))),'42501')
 reject('reported retrieval outside run',ec(evidence('observation.retain',dict(obs_body,key=ident(),retrieved_at='2026-10-09T00:00:00Z'))))
 reject('raw bound exceeded',ec(evidence('observation.retain',dict(obs_body,key=ident(),raw='x'*8193))))
 reject('malformed field typed raw denied',ec(evidence('observation.retain',dict(obs_body,key=ident(),fields=[dict(path='x',ordinal=0,label='x',raw=False,validation='VALID')]))),'22023')
 reject('duplicate field path ordinal rolls back whole observation',ec(evidence('observation.retain',dict(obs_body,key='duplicate-field',fields=obs_body['fields'][:1]*2))),'23505')
 check('invalid field insert leaves no observation',"SELECT NOT EXISTS(SELECT 1 FROM twuanis_remates_private.observations WHERE observation_key='duplicate-field')")
 data=er({'mode':'observations'},member);assert len(data['items'])==1 and 'raw_text' not in data['items'][0] and 'payload' not in data['items'][0];results.append('metadata read never returns raw/evidence payload/actor')
 assert er({'mode':'runs'},member)['items'][0]['outcome']=='PARTIAL';results.append('run coverage truth remains partial')
 reject('raw reader mode denied',scoped('SELECT public.remate_evidence_read('+js(dict(institution=ic,source=sc,mode='raw'))+');',member),'22023')
 reject('cross institution read denied',scoped('SELECT public.remate_evidence_read('+js(dict(institution=ib,source=sc,mode='observations'))+');',member),'42501')
 reject('customer has no evidence authority',ec(obs_command,who=customer_user),'42501')
 reject('stale source revision',ec(dict(obs_command,expected='2')),'40001')
 reject('browser actor forgery',ec(dict(obs_command,actor=user)),'22023')
 draft=execute(dict(operation='foundation.create',institution=ic,target=sc,expected='1',reason='local provisional bundle'),who=user)
 off=sql(f"SELECT offering_id FROM twuanis_remates_private.listings WHERE id='{draft['id']}'");prop=sql(f"SELECT property_id FROM twuanis_remates_private.offering_properties WHERE offering_id='{off}'")
 link_body=dict(observation=obsid,offering=off,property=prop,expected_link='0');link_command=evidence('observation.link',link_body);link_req=ident();link=retain(link_command,link_req,member);results.append('scoped audited R01 provisional observation linkage')
 assert link['revision']=='1' and retain(link_command,link_req,member)['id']==link['id'];results.append('link expected revision and receipt retry')
 reject('stale link stream revision',ec(link_command),'40001')
 reject('foreign property cannot link',ec(evidence('observation.link',dict(link_body,expected_link='1',property=ident()))),'42501')
 reject('ordinary listing cannot masquerade as offering',ec(evidence('observation.link',dict(link_body,offering=sale))),'42501')
 check('link does not confirm normalize or publish',f"SELECT p.identity_status='PROVISIONAL' AND o.mechanism='UNKNOWN' AND l.state='DRAFT' AND p.revision=1 AND o.revision=1 AND l.revision=1 FROM twuanis_remates_private.properties p JOIN twuanis_remates_private.offering_properties op ON op.property_id=p.id JOIN twuanis_remates_private.offerings o ON o.id=op.offering_id JOIN twuanis_remates_private.listings l ON l.offering_id=o.id WHERE p.id='{prop}'")
 assert er({'mode':'links'},member)['items'][0]['revision']=='1';results.append('bounded attributable link history read')
 for table in ['source_runs','observations','observation_fields','observation_links']:
  check(table+' owner RLS',f"SELECT relowner='postgres'::regrole AND relrowsecurity FROM pg_class WHERE oid='twuanis_remates_private.{table}'::regclass")
  for runtime in ['anon','authenticated','service_role']:check(table+' direct API access denied '+runtime,f"SELECT NOT has_table_privilege('{runtime}','twuanis_remates_private.{table}','SELECT,INSERT,UPDATE,DELETE,TRUNCATE')")
  reject(table+' UPDATE immutable',f"UPDATE twuanis_remates_private.{table} SET {'label=label' if table=='observation_fields' else 'id=id'};",'55000')
  reject(table+' DELETE immutable',f"DELETE FROM twuanis_remates_private.{table};",'55000')
  reject(table+' TRUNCATE immutable',f"TRUNCATE twuanis_remates_private.{table} CASCADE;",'55000')
 for runtime in ['anon','service_role']:
  for fn in ['public.remate_evidence_command(uuid,jsonb)','public.remate_evidence_read(jsonb)']:check('no RPC execution '+runtime+fn,f"SELECT NOT has_function_privilege('{runtime}','{fn}','EXECUTE')")
 check('exact public RPC ownership security path grants',"SELECT bool_and(proowner='postgres'::regrole AND prosecdef AND proconfig @> ARRAY['search_path=pg_catalog'] AND has_function_privilege('authenticated',oid,'EXECUTE') AND NOT EXISTS(SELECT 1 FROM aclexplode(proacl) a WHERE a.grantee=0)) FROM pg_proc WHERE oid IN('public.remate_evidence_command(uuid,jsonb)'::regprocedure,'public.remate_evidence_read(jsonb)'::regprocedure)")
 for runtime in ['anon','authenticated','service_role']:check('private functions no runtime execution '+runtime,f"SELECT bool_and(NOT has_function_privilege('{runtime}',p.oid,'EXECUTE')) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='twuanis_remates_private'")
 # Two independent sessions compete for identical observation key, with different request UUIDs.
 parallel_body=dict(obs_body,key='parallel-obs');parallel_command=evidence('observation.retain',parallel_body)
 ps=[subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env) for _ in range(2)]
 for p in ps:p.stdin.write(ec(parallel_command,who=member));p.stdin.close();p.stdin=None
 outputs=[p.communicate(timeout=15) for p in ps];assert all(p.returncode==0 for p in ps),outputs
 matches=[json.loads(out.splitlines()[-1]) for out,err in outputs];assert matches[0]['id']==matches[1]['id'] and sum(x['replayed'] for x in matches)==1;results.append('independent sessions identical observation key retain exactly once')
 check('race creates one source-key observation',"SELECT count(*)=1 FROM twuanis_remates_private.observations WHERE observation_key='parallel-obs'")
 # Different raw bytes under one key cannot both succeed.
 conflict_cmds=[evidence('observation.retain',dict(obs_body,key='conflict-race',raw=value)) for value in ['one','two']]
 ps=[subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env) for _ in range(2)]
 for p,c in zip(ps,conflict_cmds):p.stdin.write(ec(c,who=member));p.stdin.close();p.stdin=None
 outs=[p.communicate(timeout=15) for p in ps];assert sum(p.returncode==0 for p in ps)==1 and any('22023' in err for out,err in outs);results.append('independent sessions conflicting observation key fail closed')

 dedupe_req=ident();assert retain(obs_command,dedupe_req,member)['receiptId']==obs_result['receiptId'];results.append('new retry request remains bound to original retained evidence receipt')
 reject('deduplicated request UUID cannot be reused for different evidence',ec(evidence('observation.retain',dict(obs_body,key='reused-request')),dedupe_req,member),'22023')
 complete=retain(evidence('run.retain',dict(run_body,key='complete-local',outcome='COMPLETE',pages=[dict(key='one-local-page',status='RETAINED')])));results.append('complete accepted only for explicit reported local page scope')
 failed=retain(evidence('run.retain',dict(run_body,key='failed-local',outcome='FAILED',pages=[dict(key='one-local-page',status='FAILED')])));results.append('failed run retained without disappearance/publication inference')
 for index in range(27):retain(evidence('observation.retain',dict(obs_body,key='page-'+str(index))),who=member)
 page1=er({'mode':'observations'},member)['items'];assert len(page1)==26 and len({x['id'] for x in page1})==26
 page2=er({'mode':'observations','after':page1[24]['id']},member)['items'];assert {x['id'] for x in page1[:25]}.isdisjoint(x['id'] for x in page2);results.append('26-row bounded keyset read with nonduplicating continuation')
 obs2=retain(evidence('observation.retain',dict(obs_body,key='link-race-1')),who=member)['id'];obs3=retain(evidence('observation.retain',dict(obs_body,key='link-race-2')),who=member)['id']
 ps=[subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env) for _ in range(2)]
 for p,oid in zip(ps,[obs2,obs3]):p.stdin.write(ec(evidence('observation.link',dict(link_body,observation=oid,expected_link='1')),who=member));p.stdin.close();p.stdin=None
 outs=[p.communicate(timeout=15) for p in ps];assert sum(p.returncode==0 for p in ps)==1 and any('40001' in err for out,err in outs);results.append('independent linkage streams competing for expected revision yield one link')
 # Hold the same authority locks as scoped commands, then verify R04 waits and denies after revocation commits.
 revoke=change(member,'permission.revoke',4,'inventory.import',institution=ic)
 first=subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env)
 first.stdin.write("BEGIN;"+ac(revoke).replace('BEGIN;','').replace(' COMMIT;','')+"SELECT pg_backend_pid();\n");first.stdin.flush();lockpid=None
 while True:
  line=first.stdout.readline().strip()
  if line.isdigit():lockpid=int(line);break
 assert lockpid
 second=subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env)
 second.stdin.write("SET application_name='r04_after_revoke';"+ec(evidence('observation.retain',dict(obs_body,key='denied-after-revoke')),who=member)+"\n");second.stdin.close();second.stdin=None
 blocked=False
 for _ in range(100):
  blocked=sql(f"SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name='r04_after_revoke' AND {lockpid}=ANY(pg_blocking_pids(pid)))")=='t'
  if blocked:break
  time.sleep(.02)
 assert blocked
 first.stdin.write("COMMIT;\n\q\n");first.stdin.flush();first.communicate(timeout=10)
 out,err=second.communicate(timeout=12);assert second.returncode and '42501' in err,(out,err);results.append('observed authority lock blocks evidence retention until permission revocation, then denies')
 check('denied retention race leaves no evidence',"SELECT NOT EXISTS(SELECT 1 FROM twuanis_remates_private.observations WHERE observation_key='denied-after-revoke')")
 # Fresh live permission check before successful receipt replay.
 reject('revoked evidence permission denies prior receipt replay',ec(obs_command,obs_req,member),'42501')
 assert snap()==r04_ordinary;results.append('ten ordinary population reference and warm-cache snapshots invariant across R04')
 check('registered source remains disabled',f"SELECT NOT enabled FROM twuanis_remates_private.sources WHERE id='{sc}'")
 print('R04',len(results)-r04_start,'focused checks PASS',flush=True)

 report={'status':'PASS','assertions':len(results),'results':results,'fixture':'Disposable PostgreSQL 17; exact affected migrations 003–011/018/019/023/025–027 and 062/063/064/065; exact 060 live-account function on representative principal fixture; representative existing table fixture, not production clone','full17EngineRegression':'NOT RUN / R-15','production':'UNCHANGED'}
 (root/'outputs/remates/R-04-db-results.json').write_text(json.dumps(report,indent=2));print('PASS',len(results),'database checks')
finally:
 if started:run('pg_ctl',['-D',str(data),'stop','-m','fast'])
 import shutil;shutil.rmtree(dir)
