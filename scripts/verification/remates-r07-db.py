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


 r05_start=len(results);r05_ordinary=snap();migration('066');results.append('066 exact local migration installs')
 # Existing evidence authority stays separate; Owner creates local fixture assertions only.
 def observation(key,record='record-identity',values=['PARCEL-1']):
  fields=[dict(path='parcel.'+str(i),ordinal=0,label='Registry parcel',raw=v,validation='VALID') for i,v in enumerate(values)]
  return retain(evidence('observation.retain',dict(obs_body,key=key,record_key=record,fields=fields)))['id']
 def identity(op,body):return dict(operation=op,institution=ic,source=sc,expected='1',reason='Explicit local identity review',identity=body)
 def iq(c,req=None,who=user):return scoped(f"SELECT public.remate_identity_command('{req or ident()}',{js(c)});",who)
 def icmd(c,req=None,who=user):return json.loads(sql(iq(c,req,who)).splitlines()[-1])
 def ir(mode,who=user,**kw):return json.loads(sql(scoped('SELECT public.remate_identity_read('+js(dict(institution=ic,mode=mode,**kw))+');',who)).splitlines()[-1])
 def parcel(value,path='parcel.0',pid=None,expected='0'):
  p=dict(expected=expected,identifiers=[dict(kind='PARCEL',jurisdiction='CR-test',value=value,path=path,ordinal=0)])
  if pid:p['property']=pid
  return p
 def proposal(oid,parcels,binding='0',**kw):return identity('identity.propose',dict(observation=oid,expected_binding=binding,parcels=parcels,**kw))
 def decide(case,choice='CONFIRM_PROPOSAL',**kw):return identity('identity.decide',dict(case=case,expected_case='1',decision=choice,**kw))
 oid=observation('identity-1',values=['PARCEL-1','PARCEL-2']);cmd1=proposal(oid,[parcel('PARCEL-1'),parcel('PARCEL-2','parcel.1')]);req1=ident();case1=icmd(cmd1,req1);results.append('supported multi-parcel evidence proposal quarantined before decision')
 check('pending proposal creates no new binding',f"SELECT NOT EXISTS(SELECT 1 FROM twuanis_remates_private.source_bindings WHERE source_id='{sc}' AND record_key='record-identity')")
 assert icmd(cmd1,req1)['id']==case1['id'] and icmd(cmd1)['replayed'];results.append('source-observation proposal retry returns one case and receipt')
 reject('changed proposal under same observation conflicts',iq(proposal(oid,[parcel('CHANGED')])),'22023')
 chosen=icmd(decide(case1['id']));off1=chosen['offeringId'];results.append('explicit audited decision creates one independent multi-parcel offering')
 check('two independently attributable confirmed parcels',f"SELECT count(*)=2 AND bool_and(p.identity_status='CONFIRMED' AND p.revision=2) FROM twuanis_remates_private.properties p JOIN twuanis_remates_private.offering_properties op ON op.property_id=p.id WHERE op.offering_id='{off1}'")
 check('two identifiers reference exact original raw and observations',f"SELECT count(*)=2 AND bool_and(raw_value=value AND evidence_id='{oid}') FROM twuanis_remates_private.property_identifiers WHERE evidence_id='{oid}'")
 check('new offering remains UNKNOWN and unpublished DRAFT',f"SELECT o.mechanism='UNKNOWN' AND l.state='DRAFT' FROM twuanis_remates_private.offerings o JOIN twuanis_remates_private.listings l ON l.offering_id=o.id WHERE o.id='{off1}'")
 req_dec=ident();reject('different request cannot re-decide resolved case',iq(decide(case1['id']),req_dec),'40001')
 # Exact command retry returns existing approved result, not another identity.
 exact_oid=observation('exact-idempotent','retry-record');exact_case=icmd(proposal(exact_oid,[parcel('PARCEL-1')]));exact_req=ident();exact_cmd=decide(exact_case['id'],'MATCH_EXISTING',offering=off1,expected_offering='1');exact_result=icmd(exact_cmd,exact_req);assert icmd(exact_cmd,exact_req)['offeringId']==off1;results.append('explicit cross-record exact retry does not duplicate offering')
 # Same record key and incompatible new parcel is quarantined; previous binding untouched until review.
 conflict_oid=observation('reused-key',values=['PARCEL-X']);conflict_case=icmd(proposal(conflict_oid,[parcel('PARCEL-X')],binding='1'));assert conflict_case['conflict']=='BOUND_SOURCE_REVIEW';results.append('reused source key incompatible parcel retained in review case')
 check('quarantine retains original current binding',f"SELECT offering_id='{off1}' AND revision=1 FROM twuanis_remates_private.source_bindings WHERE source_id='{sc}' AND record_key='record-identity'")
 keep_req=ident();kept=icmd(decide(conflict_case['id'],'KEEP_CURRENT'),keep_req);assert kept['offeringId']==off1;results.append('explicit keep-current reconciliation rejects reassignment without destroying contradictory evidence')
 check('two binding intervals preserve predecessor and original evidence',f"SELECT count(*)=2 AND count(*) FILTER(WHERE revision=1 AND observation_id='{oid}')=1 AND count(*) FILTER(WHERE revision=2 AND prior_binding_id IS NOT NULL)=1 FROM twuanis_remates_private.source_bindings WHERE source_id='{sc}' AND record_key='record-identity'")
 # Similarity is never an identifier authority.
 bad=observation('similarity-only','similarity-record',values=['similar address']);badprop=proposal(bad,[parcel('similar address')]);badprop['identity']['parcels'][0]['identifiers'][0]['kind']='ADDRESS';reject('address similarity cannot confirm identity',iq(badprop),'22023')
 for kind in ['TITLE','PHOTO','GEOGRAPHY']:
  badprop['identity']['parcels'][0]['identifiers'][0]['kind']=kind;reject(kind+' similarity cannot confirm identity',iq(badprop),'22023')
 reject('unsupported or absent field evidence',iq(proposal(bad,[parcel('v',path='not-present')])),'23514')
 reject('duplicate parcel identifiers in bundle',iq(proposal(bad,[parcel('v'),parcel('v')])),'22023')
 reject('source observation outside scope',iq(proposal(ident(),[parcel('v')])),'42501')
 reject('customer cannot propose identities',iq(proposal(bad,[parcel('v')]),who=customer_user),'42501')
 reject('ordinary source identity cannot be used as property',iq(proposal(bad,[parcel('v',pid=sale,expected='1')])),'40001')
 reject('browser cannot forge acting identity',iq(dict(proposal(bad,[parcel('v')]),actor=user)),'22023')
 # Pre-existing R01 foundation becomes confirmed through evidence-backed expected revisions.
 initial=execute(dict(operation='foundation.create',institution=ic,target=sc,expected='1',reason='provisional identity fixture'))
 initialoff=sql(f"SELECT offering_id FROM twuanis_remates_private.listings WHERE id='{initial['id']}'");initialprop=sql(f"SELECT property_id FROM twuanis_remates_private.offering_properties WHERE offering_id='{initialoff}'")
 initobs=observation('confirm-provisional','provisional-record',values=['PRE-1']);initcase=icmd(proposal(initobs,[parcel('PRE-1',pid=initialprop,expected='1')],offering=initialoff,expected_offering='1'))
 assert icmd(decide(initcase['id']))['offeringId']==initialoff;results.append('R01 provisional UUID preserved through audited confirmation revision')
 check('audited property event has truthful before/after revision',f"SELECT before_state->>'identity_status'='PROVISIONAL' AND after_state->>'identity_status'='CONFIRMED' AND before_state->>'revision'='1' AND after_state->>'revision'='2' FROM twuanis_remates_private.identity_events WHERE property_id='{initialprop}'")
 reject('direct root update without audit forbidden',f"UPDATE twuanis_remates_private.properties SET revision=revision+1 WHERE id='{initialprop}';",'55000')
 # Cross-channel matching requires explicit selected existing same-institution offering.
 source2=cmd(dict(sreg,institution=ic,expected='3',namespace='r05.second',channel='INSTITUTION',origin='https://r05.second.example'))['id']
 run2=evidence('run.retain',dict(run_body,key='r05-channel-run'));run2['source']=source2;run2id=retain(run2)['id']
 obs2cmd=evidence('observation.retain',dict(obs_body,key='channel-observation',record_key='channel-key',run=run2id,url='https://r05.second.example/item',fields=[dict(path='parcel.0',ordinal=0,label='Parcel',raw='PARCEL-1',validation='VALID')]));obs2cmd['source']=source2;channelobs=retain(obs2cmd)['id']
 cross=proposal(channelobs,[parcel('PARCEL-1')]);cross['source']=source2;crosscase=icmd(cross);assert crosscase['conflict']=='IDENTIFIER_CONFLICT';results.append('cross-channel exact identifier conflict never auto-merges')
 crossresolve=decide(crosscase['id'],'MATCH_EXISTING',offering=off1,expected_offering='1');crossresolve['source']=source2;assert icmd(crossresolve)['offeringId']==off1;results.append('explicit audited cross-channel match shares existing offering without rewriting observations')
 foreign=execute(dict(operation='foundation.create',institution=ib,target=source_b,expected='1',reason='foreign identity fixture'))
 foreignoff=sql(f"SELECT offering_id FROM twuanis_remates_private.listings WHERE id='{foreign['id']}'")
 foreignobs=observation('foreign-match','foreign-record');foreigncase=icmd(proposal(foreignobs,[parcel('PARCEL-1')]));reject('cross-institution offering match denied even for Owner',iq(decide(foreigncase['id'],'MATCH_EXISTING',offering=foreignoff,expected_offering='1')),'42501')
 rejected=icmd(decide(foreigncase['id'],'REJECT'));assert rejected['status']=='REJECTED';results.append('rejection preserves immutable case/evidence without binding')
 # Scope actor and live checks remain ahead of replay; use a fresh representative.
 reviewer=account();setsession(reviewer);execute(app(reviewer,institution=ic,kind='representative.activate'));execute(change(reviewer,'permission.grant',1,'drafts.edit',institution=ic))
 localobs=observation('reviewer','reviewer-record');reviewercmd=proposal(localobs,[parcel('PARCEL-1')]);reviewreq=ident();reviewcase=icmd(reviewercmd,reviewreq,reviewer);results.append('explicit institution reviewer may propose scoped identity')
 reject('reviewer cannot read another institution',scoped('SELECT public.remate_identity_read('+js(dict(institution=ib,mode='cases'))+');',reviewer),'42501')
 execute(change(reviewer,'permission.revoke',2,'drafts.edit',institution=ic));reject('revoked reviewer cannot replay receipt',iq(reviewercmd,reviewreq,reviewer),'42501')

 dupobs=observation('duplicate-clone','duplicate-clone-record');dupcase=icmd(proposal(dupobs,[parcel('PARCEL-1')]));reject('confirmation cannot clone an existing parcel identity',iq(decide(dupcase['id'])))
 check('failed clone creates no decision or binding',f"SELECT NOT EXISTS(SELECT 1 FROM twuanis_remates_private.identity_decisions WHERE case_id='{dupcase['id']}') AND NOT EXISTS(SELECT 1 FROM twuanis_remates_private.source_bindings WHERE record_key='duplicate-clone-record')")
 reject('stale expected case revision denied',iq(identity('identity.decide',dict(case=dupcase['id'],expected_case='2',decision='REJECT'))),'40001')
 reject('stale source expected revision denied',iq(dict(proposal(dupobs,[parcel('PARCEL-1')]),expected='2')),'40001')
 # Physical identity reused for another opportunity requires explicit UUID/revision and evidence; no clone.
 existing_pid=sql(f"SELECT property_id FROM twuanis_remates_private.property_identifiers WHERE value='PARCEL-1' LIMIT 1")
 sharedobs=observation('shared-physical','new-opportunity');sharedcase=icmd(proposal(sharedobs,[parcel('PARCEL-1',pid=existing_pid,expected='2')]));sharedresult=icmd(decide(sharedcase['id']));assert sharedresult['offeringId']!=off1;results.append('explicit new opportunity can share the existing physical property UUID without merging offerings')
 check('canonical parcel UUID not duplicated',"SELECT count(DISTINCT property_id)=1 FROM twuanis_remates_private.property_identifiers WHERE value='PARCEL-1'")
 # Independently proposed cases cannot bypass source-key revision authority.
 raceobs=[observation('binding-race-'+str(i),'binding-race-record',values=['RACE-'+str(i)]) for i in range(2)]
 racecases=[icmd(proposal(oid,[parcel('RACE-'+str(i))])) for i,oid in enumerate(raceobs)]
 ps=[subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env) for _ in range(2)]
 for p,c in zip(ps,racecases):p.stdin.write(iq(decide(c['id'])));p.stdin.close();p.stdin=None
 outs=[p.communicate(timeout=15) for p in ps];assert sum(p.returncode==0 for p in ps)==1 and any('40001' in err for out,err in outs);results.append('independent cases racing for one source-key binding yield one offering and one stale denial')
 check('one current binding and no second successful decision in race',"SELECT count(*)=1 FROM twuanis_remates_private.source_bindings WHERE record_key='binding-race-record'")
 retryobs=observation('parallel-proposal','parallel-proposal-record',values=['RETRY-P']);retrycmd=proposal(retryobs,[parcel('RETRY-P')])
 ps=[subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env) for _ in range(2)]
 for p in ps:p.stdin.write(iq(retrycmd));p.stdin.close();p.stdin=None
 outs=[p.communicate(timeout=15) for p in ps];assert all(p.returncode==0 for p in ps),outs
 rs=[json.loads(out.splitlines()[-1]) for out,err in outs];assert rs[0]['id']==rs[1]['id'] and sum(x['replayed'] for x in rs)==1;results.append('independent proposal retries create one immutable case')
 retrydecision=decide(rs[0]['id']);sharedreq=ident()
 ps=[subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env) for _ in range(2)]
 for p in ps:p.stdin.write(iq(retrydecision,sharedreq));p.stdin.close();p.stdin=None
 outs=[p.communicate(timeout=15) for p in ps];assert all(p.returncode==0 for p in ps),outs
 rs2=[json.loads(out.splitlines()[-1]) for out,err in outs];assert rs2[0]['offeringId']==rs2[1]['offeringId'] and sum(x['replayed'] for x in rs2)==1;results.append('independent exact decision retry creates one canonical offering')
 # Reviewer revocation versus decision: verify actual lock, then deny after committed revocation.
 execute(change(reviewer,'permission.grant',3,'drafts.edit',institution=ic))
 first=subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env)
 first.stdin.write("BEGIN;"+ac(change(reviewer,'permission.revoke',4,'drafts.edit',institution=ic)).replace('BEGIN;','').replace(' COMMIT;','')+"SELECT pg_backend_pid();\n");first.stdin.flush();lockpid=None
 while True:
  line=first.stdout.readline().strip()
  if line.isdigit():lockpid=int(line);break
 second=subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env)
 second.stdin.write("SET application_name='r05_after_revoke';"+iq(decide(reviewcase['id'],'REJECT'),who=reviewer)+"\n");second.stdin.close();second.stdin=None
 blocked=False
 for _ in range(100):
  blocked=sql(f"SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name='r05_after_revoke' AND {lockpid}=ANY(pg_blocking_pids(pid)))")=='t'
  if blocked:break
  time.sleep(.02)
 assert blocked
 first.stdin.write("COMMIT;\n\q\n");first.stdin.flush();first.communicate(timeout=10)
 out,err=second.communicate(timeout=12);assert second.returncode and '42501' in err,(out,err);results.append('observed reviewer revocation lock prevents stale identity decision')
 check('blocked revoked reviewer leaves case undecided',f"SELECT NOT EXISTS(SELECT 1 FROM twuanis_remates_private.identity_decisions WHERE case_id='{reviewcase['id']}')")
 for role_name in ['anon','authenticated','service_role']:check('private identity functions remain unexecutable '+role_name,f"SELECT bool_and(NOT has_function_privilege('{role_name}',p.oid,'EXECUTE')) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='twuanis_remates_private'")
 for table in ['identity_cases','identity_decisions','property_identifiers','source_bindings','identity_events']:
  check(table+' owner/RLS',f"SELECT relowner='postgres'::regrole AND relrowsecurity FROM pg_class WHERE oid='twuanis_remates_private.{table}'::regclass")
  for role_name in ['anon','authenticated','service_role']:check(table+' no direct API access '+role_name,f"SELECT NOT has_table_privilege('{role_name}','twuanis_remates_private.{table}','SELECT,INSERT,UPDATE,DELETE,TRUNCATE')")
  reject(table+' update immutable',f"UPDATE twuanis_remates_private.{table} SET {'value=value' if table=='property_identifiers' else 'id=id'};",'55000')
  reject(table+' delete immutable',f"DELETE FROM twuanis_remates_private.{table};",'55000')
  reject(table+' truncate immutable',f"TRUNCATE twuanis_remates_private.{table} CASCADE;",'55000')
 check('exact RPC ownership/security/search path',"SELECT bool_and(proowner='postgres'::regrole AND prosecdef AND proconfig @> ARRAY['search_path=pg_catalog'] AND has_function_privilege('authenticated',oid,'EXECUTE') AND NOT has_function_privilege('anon',oid,'EXECUTE') AND NOT has_function_privilege('service_role',oid,'EXECUTE') AND NOT EXISTS(SELECT 1 FROM aclexplode(proacl) a WHERE grantee=0)) FROM pg_proc WHERE oid IN('public.remate_identity_command(uuid,jsonb)'::regprocedure,'public.remate_identity_read(jsonb)'::regprocedure)")
 for mode in ['cases','bindings','properties']:assert len(ir(mode)['items'])<=26;results.append('bounded '+mode+' read')
 assert snap()==r05_ordinary;results.append('all ten ordinary population/reference/warm-canary snapshots unchanged across R05')
 print('R05',len(results)-r05_start,'focused checks PASS',flush=True)

 r06_start=len(results);migration('067');results.append('067 exact local migration installs')
 # Extend only disposable reference fixtures, before the R06 invariance baseline.
 sql("INSERT INTO public.ontology_terms(id,term_type,level,parent_id,term_name,official_code) VALUES(1991,'province',1,9,'Other province','7'),(1992,'canton',2,1991,'Other canton','701'),(1993,'district',3,1002,'Local district','30401'),(1994,'bedrooms',1,NULL,'Bedroom band',NULL) ON CONFLICT DO NOTHING;")
 ruleset=ident();sql(f"INSERT INTO public.listing_classification_rule_sets(id,domain,version) VALUES('{ruleset}','bedrooms',9001);INSERT INTO public.listing_classification_rules(rule_set_id,ontology_term_id,bounds) VALUES('{ruleset}',1994,'[0,)');SELECT twuanis_canonical_private.s3_seal_classification('{ruleset}');")
 r06_before=snap()
 gfields=[dict(path=k,ordinal=0,label=k,raw=v,validation='VALID') for k,v in dict(parcel='R06-PARCEL',province='Cartago',canton='Jiménez',district='District',type='House',terrain='Flat',bedrooms='3',area='123.45',range='1 to 4').items()]
 gobs=retain(evidence('observation.retain',dict(obs_body,key='r06-evidence',record_key='r06-record',fields=gfields)))['id'];gcase=icmd(proposal(gobs,[parcel('R06-PARCEL','parcel')]))['id'];goff=icmd(decide(gcase))['offeringId'];gpid=sql(f"SELECT property_id FROM twuanis_remates_private.offering_properties WHERE offering_id='{goff}'")
 def assignment(term,path):return dict(term=str(term),path=path,ordinal=0)
 body=dict(property=gpid,expected_property='2',expected='0',observation=gobs,reviewed=True,geography=dict(province=assignment(1001,'province'),canton=assignment(1002,'canton'),district=None),semantics=dict(property_type=[assignment(1,'type')],terrain=[assignment(9007199254740993,'terrain')]),facts=dict(bedrooms=dict(kind='exact',value='3',unit='count',path='bedrooms',ordinal=0,rule_set=ruleset),property_area=dict(kind='exact',value='123.45',unit='m2',path='area',ordinal=0)))
 def gc(b,**kw):return dict(operation='classification.record',institution=ic,source=sc,expected='1',reason='Explicit evidence-backed classification review',classification=b,**kw)
 def gq(c,req=None,who=user):return scoped(f"SELECT public.remate_classification_command('{req or ident()}',{js(c)});",who)
 def gr(q,who=user):return json.loads(sql(scoped('SELECT public.remate_classification_read('+js(dict(institution=ic,**q))+');',who)).splitlines()[-1])
 request=ident();gres=json.loads(sql(gq(gc(body),request)).splitlines()[-1]);assert gres['minimumReady'] and gres['revision']=='1';results.append('verified province/canton/type plus confirmed source identity ready with district NULL')
 check('independent exact geography edges and absent district',f"SELECT count(*)=3 AND bool_and(term_id IN(9,1001,1002)) FROM twuanis_remates_private.property_terms WHERE classification_id='{gres['id']}' AND dimension='geography'")
 check('lossless bigint terrain membership independent of ordinary listings',f"SELECT EXISTS(SELECT 1 FROM twuanis_remates_private.property_terms WHERE classification_id='{gres['id']}' AND term_id=9007199254740993)")
 check('exact physical fact precision and sealed rule attribution',f"SELECT count(*)=2 AND count(*) FILTER(WHERE exact_value=123.45 AND dimension='property_area')=1 AND count(*) FILTER(WHERE rule_set_id='{ruleset}' AND rule_fingerprint IS NOT NULL)=1 FROM twuanis_remates_private.property_facts WHERE classification_id='{gres['id']}'")
 check('rules emit only Remates ontology memberships',f"SELECT EXISTS(SELECT 1 FROM twuanis_remates_private.property_terms WHERE classification_id='{gres['id']}' AND term_id=1994)")
 assert json.loads(sql(gq(gc(body),request)).splitlines()[-1])['id']==gres['id'];results.append('exact request replay returns same classification version')
 import copy
 def altered():b=copy.deepcopy(body);b['expected']='1';return b
 b=altered();b['geography']['canton']=assignment(1992,'canton');reject('wrong canonical canton parent',gq(gc(b)),'23514')
 b=altered();b['geography']['province']=None;reject('canton cannot manufacture missing province',gq(gc(b)),'23514')
 b=altered();b['geography']['district']=assignment(1992,'district');reject('canton cannot masquerade as district',gq(gc(b)),'23514')
 b=altered();b['geography']['province']=assignment(1,'province');reject('property type not geographic identity',gq(gc(b)),'23514')
 b=altered();b['semantics']['property_type']=[assignment(9007199254740993,'terrain')];reject('wrong property type vocabulary',gq(gc(b)),'23514')
 b=altered();b['semantics']['terrain'][0]['term']=9007199254740993;reject('numeric lossy bigint transport rejected',gq(gc(b)),'22023')
 b=altered();b['geography']['province']['path']='no-evidence';reject('unsupported geographic evidence rejected',gq(gc(b)),'23514')
 b=altered();b['semantics']['property_type']*=2;reject('property type singleton',gq(gc(b)),'23514')
 b=altered();b['reviewed']=False;reject('explicit review required',gq(gc(b)),'22023')
 b=altered();b['expected_property']='1';reject('stale identity revision rejected',gq(gc(b)),'40001')
 reject('stale classification revision rejected',gq(gc(body)),'40001')
 b=altered();b['property']=sale;reject('ordinary listing UUID cannot become Remates property',gq(gc(b)),'23514')
 b=altered();b['observation']=foreignobs;reject('foreign observation cannot classify own property',gq(gc(b)),'42501')
 b=altered();b['facts']['bedrooms']['value']='3.5';reject('count facts stay integer',gq(gc(b)),'23514')
 b=altered();b['facts']['property_area']['unit']='hectare';reject('unsupported unit cannot become square meters',gq(gc(b)),'22023')
 b=altered();b['facts']['bedrooms']['rule_set']=ident();reject('unsealed/unknown rule rejected',gq(gc(b)),'23514')
 b=altered();b['facts']['bedrooms']=dict(kind='range',lower='4',upper='1',lower_inclusive=True,upper_inclusive=True,unit='count',path='range',ordinal=0);reject('inverted range rejected',gq(gc(b)),'22000')
 b=altered();b['facts']['bedrooms']=dict(kind='category',term='1994',unit='count',path='bedrooms',ordinal=0);b['facts']['property_area']=None;b['geography']['district']=assignment(1993,'district');nextres=json.loads(sql(gq(gc(b))).splitlines()[-1]);assert nextres['revision']=='2';results.append('explicit supported district/category version appends without rewriting old exact fact')
 check('old snapshot/facts retained',f"SELECT EXISTS(SELECT 1 FROM twuanis_remates_private.property_facts WHERE classification_id='{gres['id']}' AND exact_value=123.45) AND EXISTS(SELECT 1 FROM twuanis_remates_private.property_facts WHERE classification_id='{nextres['id']}' AND category_term_id=1994)")
 b=altered();b['expected']='2';b['geography']={k:None for k in ['province','canton','district']};b['semantics']['property_type']=[];b['facts']={};missing=json.loads(sql(gq(gc(b))).splitlines()[-1]);assert not missing['minimumReady'];results.append('missing required facts retained as unready, never inferred or published')
 history=gr(dict(mode='history'))['items'];assert len(history)<=26 and sum(x['current'] for x in history)==1 and not any(x['current_minimum_ready'] for x in history);results.append('historical readiness cannot masquerade as current ready state')
 refs=gr(dict(mode='references',dimension='terrain'))['items'];assert any(x['id']=='9007199254740993' for x in refs);results.append('reference reader preserves bigint decimal strings')
 assert all(x['parent_id']=='1002' for x in gr(dict(mode='references',dimension='district',parent='1002'))['items']);results.append('canonical parent-scoped district reader')
 reject('numeric reference cursor denied',scoped('SELECT public.remate_classification_read('+js(dict(institution=ic,mode='references',dimension='terrain',after=9007199254740993))+');'),'22023')
 reject('foreign institution reader denied',scoped('SELECT public.remate_classification_read('+js(dict(institution=ib,mode='history'))+');',reviewer),'42501')
 reject('forged actor denied',gq(dict(gc(body),actor=user)),'22023')
 # Four independent-session races, all local and no network listener.
 b=altered();b['expected']='3';racecmd=gc(b)
 ps=[subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env) for _ in range(2)]
 for p in ps:p.stdin.write(gq(racecmd));p.stdin.close();p.stdin=None
 outs=[p.communicate(timeout=15) for p in ps];assert sum(p.returncode==0 for p in ps)==1 and any('40001' in err for out,err in outs);results.append('concurrent classification revision competition yields one commit and one stale rejection')
 b=altered();b['expected']='4';racecmd=gc(b);sharedreq=ident();ps=[subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env) for _ in range(2)]
 for p in ps:p.stdin.write(gq(racecmd,sharedreq));p.stdin.close();p.stdin=None
 outs=[p.communicate(timeout=15) for p in ps];assert all(p.returncode==0 for p in ps),outs;rr=[json.loads(out.splitlines()[-1]) for out,err in outs];assert rr[0]['id']==rr[1]['id'] and sum(x['replayed'] for x in rr)==1;results.append('independent same-request retries create one version and one replay')
 # Existing scope lock serializes classification against identity revocation and source binding changes.
 execute(change(reviewer,'permission.grant',5,'drafts.edit',institution=ic));b=altered();b['expected']='5';reviewreq=ident();json.loads(sql(gq(gc(b),reviewreq,reviewer)).splitlines()[-1]);execute(change(reviewer,'permission.revoke',6,'drafts.edit',institution=ic));reject('revoked actor cannot replay classification',gq(gc(b),reviewreq,reviewer),'42501')
 # Observe permission revocation competing with a classification write.
 execute(change(reviewer,'permission.grant',7,'drafts.edit',institution=ic));b=altered();b['expected']='6';blockedcmd=gc(b)
 first=subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env)
 first.stdin.write("BEGIN;"+ac(change(reviewer,'permission.revoke',8,'drafts.edit',institution=ic)).replace('BEGIN;','').replace(' COMMIT;','')+"SELECT pg_backend_pid();\n");first.stdin.flush();lockpid=None
 while True:
  line=first.stdout.readline().strip()
  if line.isdigit():lockpid=int(line);break
 second=subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env)
 second.stdin.write("SET application_name='r06_after_revoke';"+gq(blockedcmd,who=reviewer)+"\n");second.stdin.close();second.stdin=None
 blocked=False
 for _ in range(100):
  blocked=sql(f"SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name='r06_after_revoke' AND {lockpid}=ANY(pg_blocking_pids(pid)))")=='t'
  if blocked:break
  time.sleep(.02)
 assert blocked;first.stdin.write("COMMIT;\n\\q\n");first.stdin.flush();first.communicate(timeout=10);out,err=second.communicate(timeout=12);assert second.returncode and '42501' in err,(out,err);results.append('observed reviewer revocation blocks classification then denies without commit')
 check('revocation race creates no new classification',f"SELECT max(revision)=6 FROM twuanis_remates_private.classification_versions WHERE property_id='{gpid}'")
 # Canonical reference write versus classifier: the reference row lock must be observed.
 first=subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env)
 first.stdin.write("BEGIN;UPDATE public.ontology_terms SET parent_id=1991 WHERE id=1002;SELECT pg_backend_pid();\n");first.stdin.flush()
 while True:
  line=first.stdout.readline().strip()
  if line.isdigit():lockpid=int(line);break
 second=subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env)
 second.stdin.write("SET application_name='r06_reference_lock';"+gq(blockedcmd)+"\n");second.stdin.close();second.stdin=None
 blocked=False
 for _ in range(100):
  blocked=sql(f"SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name='r06_reference_lock' AND {lockpid}=ANY(pg_blocking_pids(pid)))")=='t'
  if blocked:break
  time.sleep(.02)
 assert blocked;first.stdin.write("ROLLBACK;\n\\q\n");first.stdin.flush();first.communicate(timeout=10);out,err=second.communicate(timeout=12);assert second.returncode==0,(out,err);results.append('canonical reference row lock observed; rolled-back conflicting change never becomes assigned geography')
 # Conflict is never committed to the dictionary; regression snapshot remains identical.
 # Current readiness revalidates canonical references, without modifying their authority.
 changed=sql("BEGIN;UPDATE public.ontology_terms SET term_type='utility' WHERE id=1;"+scoped('SELECT public.remate_classification_read('+js(dict(institution=ic,mode='history'))+');').replace('BEGIN;','').replace(' COMMIT;','')+"ROLLBACK;")
 rows=json.loads([line for line in changed.splitlines() if line.startswith('{')][-1])['items'];assert not any(x['current_minimum_ready'] for x in rows);results.append('changed canonical type cannot remain current ready')
 changed=sql("BEGIN;UPDATE public.ontology_terms SET parent_id=1991 WHERE id=1002;"+scoped('SELECT public.remate_classification_read('+js(dict(institution=ic,mode='history'))+');').replace('BEGIN;','').replace(' COMMIT;','')+"ROLLBACK;")
 rows=json.loads([line for line in changed.splitlines() if line.startswith('{')][-1])['items'];assert not any(x['current_minimum_ready'] for x in rows);results.append('changed canonical parent cannot remain current ready')
 b=altered();b['expected']='7';b['geography']['canton']=None;pr=json.loads(sql(gq(gc(b))).splitlines()[-1]);assert not pr['minimumReady'];results.append('province-only evidence retained unready; canton never inferred')
 b=altered();b['expected']='8';b['geography']['province']['term']='9223372036854775808';reject('out-of-range bigint identity denied',gq(gc(b)),'22003')
 b=altered();b['expected']='8';b['semantics']['terrain'][0]['path']='published';reject('MISSING source field cannot become classification evidence',gq(gc(b)),'23514')
 b=altered();b['expected']='8';b['facts']['property_area']['value']='0';reject('zero is not a positive exact area measurement',gq(gc(b)),'23514')
 b=altered();b['expected']='8';b['facts']['bathrooms']=dict(kind='range',lower=None,upper='4',lower_inclusive=True,upper_inclusive=True,unit='count',path='range',ordinal=0);reject('unbounded range endpoint cannot be inclusive',gq(gc(b)),'23514')
 check('classification never mutates property identity revision',f"SELECT revision=2 FROM twuanis_remates_private.properties WHERE id='{gpid}'")
 for table in ['classification_versions','property_terms','property_facts']:
  check(table+' postgres/RLS',f"SELECT relowner='postgres'::regrole AND relrowsecurity FROM pg_class WHERE oid='twuanis_remates_private.{table}'::regclass")
  for role_name in ['anon','authenticated','service_role']:check(table+' no direct API authority '+role_name,f"SELECT NOT has_table_privilege('{role_name}','twuanis_remates_private.{table}','SELECT,INSERT,UPDATE,DELETE,TRUNCATE')")
  reject(table+' immutable UPDATE',f"UPDATE twuanis_remates_private.{table} SET {'id=id' if table=='classification_versions' else 'property_id=property_id'};",'55000');reject(table+' immutable DELETE',f"DELETE FROM twuanis_remates_private.{table};",'55000');reject(table+' immutable TRUNCATE',f"TRUNCATE twuanis_remates_private.{table} CASCADE;",'55000')
 check('exact classification RPC security/owner/path/ACL',"SELECT bool_and(proowner='postgres'::regrole AND prosecdef AND proconfig @> ARRAY['search_path=pg_catalog'] AND has_function_privilege('authenticated',oid,'EXECUTE') AND NOT has_function_privilege('anon',oid,'EXECUTE') AND NOT has_function_privilege('service_role',oid,'EXECUTE') AND NOT EXISTS(SELECT 1 FROM aclexplode(proacl) a WHERE grantee=0)) FROM pg_proc WHERE oid IN('public.remate_classification_command(uuid,jsonb)'::regprocedure,'public.remate_classification_read(jsonb)'::regprocedure)")
 for role_name in ['anon','authenticated','service_role']:check('private helper EXECUTE denied '+role_name,f"SELECT bool_and(NOT has_function_privilege('{role_name}',p.oid,'EXECUTE')) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='twuanis_remates_private'")
 check('nothing published or commercial triggered',"SELECT bool_and(state='DRAFT') FROM twuanis_remates_private.listings")
 assert snap()==r06_before;results.append('ten ordinary population/reference/warm-cache snapshots unchanged across R06')
 print('R06',len(results)-r06_start,'focused checks PASS',flush=True)


 r07_start=len(results);r07_before=snap();migration('068');results.append('068 exact local migration installs')
 fields=[dict(path='parcel',ordinal=0,label='Registry parcel',raw='R07-PARCEL',validation='VALID')]
 specs=[('sale','150000.123456789012345678','USD'),('crc','75000000.25','CRC'),('appraisal','190000','USD'),('reference','210000','USD'),('base','120000','USD'),('discount','15','%'),('financing','100000','USD'),('missing',None,None),('bad','???',None),('zero','0','USD'),('installment','500.50','CRC'),('fee','100','USD'),('ambiguous','1,234',None),('competition','50','USD'),('discountmoney','1000','CRC'),('unknownround','90000','USD')]
 for path,raw,cur in specs:fields.append(dict(path=path,ordinal=0,label='Original '+path,raw=raw,unit='%' if cur=='%' else None,currency=cur if cur in ['CRC','USD'] else None,validation='MISSING' if raw is None else 'INVALID' if raw=='???' else 'VALID'))
 fields.append(dict(path='round',ordinal=0,label='Bank auction round',raw='Round 2',validation='VALID'))
 fo=retain(evidence('observation.retain',dict(obs_body,key='r07-finance',record_key='r07-record',fields=fields)))['id'];case=icmd(proposal(fo,[parcel('R07-PARCEL','parcel')]))['id'];off=icmd(decide(case))['offeringId']
 def fc(body,op='financial.retain',req=None,who=user,**kw):return scoped("SELECT public.remate_financial_command("+lit(req or ident())+","+js(dict(operation=op,institution=ic,source=sc,expected='1',reason='Explicit financial evidence review',financial=body)|kw)+");",who)
 def save(body,op='financial.retain',req=None):return json.loads(sql(fc(body,op,req)).splitlines()[-1])
 def fb(path,kind,amount=None,currency=None,status='VALID',**kw):return dict(offering=off,observation=fo,path=path,ordinal=0,kind=kind,status=status,amount=amount,currency=currency,round=None,**kw)
 sale_body=fb('sale','SELLING_PRICE',specs[0][1],'USD');freq=ident();fv=save(sale_body,req=freq)['id'];assert save(sale_body,req=freq)['id']==fv;results.append('exact request retry returns same immutable value')
 reject('changed financial request conflicts',fc(dict(sale_body,amount='1'),req=freq),'23505')
 reject('same original field cannot acquire conflicting classification',fc(dict(sale_body,kind='APPRAISAL')),'23505')
 check('lossless 18 fractional decimal places',f"SELECT amount::text='{specs[0][1]}' AND currency='USD' AND raw_amount='{specs[0][1]}' AND original_label='Original sale' FROM twuanis_remates_private.financial_values WHERE id='{fv}'")
 values={}
 for path,k,a,c,st in [('crc','SELLING_PRICE','75000000.25','CRC','VALID'),('appraisal','APPRAISAL','190000','USD','VALID'),('reference','REFERENCE','210000','USD','VALID'),('base','AUCTION_BASE','120000','USD','VALID'),('discount','DISCOUNT_PERCENT','15',None,'VALID'),('financing','FINANCING_AMOUNT','100000','USD','VALID'),('missing','SELLING_PRICE',None,None,'MISSING'),('bad','REFERENCE',None,None,'AMBIGUOUS'),('zero','SELLING_PRICE','0','USD','VALID'),('installment','INSTALLMENT','500.50','CRC','VALID'),('fee','CONDOMINIUM_FEE','100','USD','VALID'),('ambiguous','SELLING_PRICE',None,None,'AMBIGUOUS'),('discountmoney','DISCOUNT_AMOUNT','1000','CRC','VALID'),('unknownround','AUCTION_BASE',None,None,'AMBIGUOUS')]:
  b=fb(path,k,a,c,st);b['round']=dict(path='round',ordinal=0) if k=='AUCTION_BASE' and st=='VALID' else None;values[path]=save(b)['id'];results.append('retain exact typed '+path)
 for b in [fb('sale','SELLING_PRICE','1','USD'),fb('sale','SELLING_PRICE',specs[0][1],'CRC'),fb('bad','REFERENCE','0','USD'),fb('sale','SELLING_PRICE',specs[0][1],None),fb('sale','DISCOUNT_PERCENT',specs[0][1],None),fb('sale','SELLING_PRICE',0,'USD')]:reject('invalid inferred/mistyped financial evidence fails',fc(b))
 reject('missing auction round fails closed',fc(fb('base','AUCTION_BASE','120000','USD')),'22023')
 check('missing stays NULL not zero',f"SELECT amount IS NULL AND currency IS NULL FROM twuanis_remates_private.financial_values WHERE id='{values['missing']}'")
 check('explicit source zero retained as zero',f"SELECT amount=0 AND status='VALID' FROM twuanis_remates_private.financial_values WHERE id='{values['zero']}'")
 def sel(v=None,mechanism='DIRECT_SALE',rev='0'):return dict(offering=off,expected=rev,mechanism=mechanism,value=v,reviewed=True)
 for v in [values['appraisal'],values['reference'],values['base'],values['missing'],values['zero']]:reject('non-sale cannot masquerade as selling price',fc(sel(v),'financial.select'))
 reject('selling price cannot masquerade as auction base',fc(sel(fv,'AUCTION'),'financial.select'))
 ereq=ident();ev=save(sel(fv),'financial.select',ereq);assert save(sel(fv),'financial.select',ereq)['id']==ev['id'];results.append('selection request replay idempotent')
 reject('stale selection fails',fc(sel(values['crc']),'financial.select'),'40001')
 save(sel(values['base'],'AUCTION','1'),'financial.select');save(sel(None,'DIRECT_SALE','2'),'financial.select');results.append('explicit selection/clear retains all conflicting historical evidence')
 check('auction round separate and original',f"SELECT round_key='Round 2' AND kind='AUCTION_BASE' FROM twuanis_remates_private.financial_values WHERE id='{values['base']}'")
 check('selection history append-only revisions 1/2/3',f"SELECT count(*)=3 AND max(revision)=3 FROM twuanis_remates_private.offering_events WHERE offering_id='{off}'")
 def fr(**kw):return json.loads(sql(scoped('SELECT public.remate_financial_read('+js(dict(institution=ic,mode='values',**kw))+');')).splitlines()[-1])
 rows=fr(currency='CRC',kind='SELLING_PRICE')['items'];assert len(rows)==1 and rows[0]['amount']=='75000000.25';results.append('currency/type filter preserves exact CRC string without FX')
 assert [x['amount'] for x in fr(currency='USD',kind='SELLING_PRICE',sort='amount')['items']]==['0',specs[0][1]];results.append('amount ordering single currency/kind exact numeric not lexical');reject('mixed-currency amount sorting denied',scoped('SELECT public.remate_financial_read('+js(dict(institution=ic,mode='values',sort='amount'))+');'),'22023')
 assert len(fr()['items'])==15;results.append('all independent financial classifications remain visible')
 reject('unsupported currency fails closed',scoped('SELECT public.remate_financial_read('+js(dict(institution=ic,mode='values',currency='EUR'))+');'),'22023')
 reject('cross-institution offering denied',fc(dict(sale_body,offering=foreignoff)),'42501')
 reject('cross-institution source denied',fc(sale_body,source=source2,institution=ib),'42501')
 reject('customer financial write denied',fc(sale_body,who=customer_user),'42501')
 for table in ['financial_values','offering_events']:
  check(table+' postgres/RLS',f"SELECT relowner='postgres'::regrole AND relrowsecurity FROM pg_class WHERE oid='twuanis_remates_private.{table}'::regclass")
  for role_name in ['anon','authenticated','service_role']:check(table+' no direct API role authority '+role_name,f"SELECT NOT has_table_privilege('{role_name}','twuanis_remates_private.{table}','SELECT,INSERT,UPDATE,DELETE,TRUNCATE')")
  reject(table+' immutable update',f'UPDATE twuanis_remates_private.{table} SET id=id;','55000');reject(table+' immutable delete',f'DELETE FROM twuanis_remates_private.{table};','55000');reject(table+' immutable truncate',f'TRUNCATE twuanis_remates_private.{table} CASCADE;','55000')
 check('financial RPC ownership/security/path/ACL',"SELECT bool_and(proowner='postgres'::regrole AND prosecdef AND proconfig @> ARRAY['search_path=pg_catalog'] AND has_function_privilege('authenticated',oid,'EXECUTE') AND NOT has_function_privilege('anon',oid,'EXECUTE') AND NOT has_function_privilege('service_role',oid,'EXECUTE') AND NOT EXISTS(SELECT 1 FROM aclexplode(proacl) a WHERE grantee=0)) FROM pg_proc WHERE oid IN('public.remate_financial_command(uuid,jsonb)'::regprocedure,'public.remate_financial_read(jsonb)'::regprocedure)")
 # Independent sessions: same expected selection revision permits exactly one winner.
 cmds=[sel(fv,'DIRECT_SALE','3'),sel(values['crc'],'DIRECT_SALE','3')];procs=[subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env) for _ in cmds]
 for pr,c in zip(procs,cmds):pr.stdin.write(fc(c,'financial.select'));pr.stdin.close();pr.stdin=None
 outs=[pr.communicate(timeout=15) for pr in procs];assert sum(pr.returncode==0 for pr in procs)==1 and any('40001' in err for out,err in outs);results.append('independent-session expected-revision selection race one winner')
 # Same actor/request race must produce one event and two equivalent responses.
 revision=sql(f"SELECT max(revision) FROM twuanis_remates_private.offering_events WHERE offering_id='{off}'");rq=ident();c=sel(fv,'DIRECT_SALE',revision);procs=[subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env) for _ in range(2)]
 for pr in procs:pr.stdin.write(fc(c,'financial.select',rq));pr.stdin.close();pr.stdin=None
 outs=[pr.communicate(timeout=15) for pr in procs];assert all(pr.returncode==0 for pr in procs),outs;assert len({json.loads(out.splitlines()[-1])['id'] for out,err in outs})==1;results.append('independent-session identical request race one immutable event')

 reject('ambiguous comma format cannot be silently converted',fc(fb('ambiguous','SELLING_PRICE','1234','USD')))
 reject('forged actor denied',fc(sale_body,actor=user),'22023')
 check('current financial selection readiness helper true',f"SELECT twuanis_remates_private.financial_selection_valid(id) FROM twuanis_remates_private.offering_events WHERE offering_id='{off}' ORDER BY revision DESC LIMIT 1")
 # Independent sessions cannot classify the same source assertion twice.
 cmds=[fb('competition',k,'50','USD') for k in ['SELLING_PRICE','APPRAISAL']];procs=[subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env) for _ in cmds]
 for pr,c in zip(procs,cmds):pr.stdin.write(fc(c));pr.stdin.close();pr.stdin=None
 outs=[pr.communicate(timeout=15) for pr in procs];assert sum(pr.returncode==0 for pr in procs)==1 and any('23505' in err for out,err in outs);results.append('independent source-assertion classification competition one immutable winner')
 reject('revoked reviewer cannot read financial history',scoped('SELECT public.remate_financial_read('+js(dict(institution=ic,mode='history'))+');',reviewer),'42501')
 # Fresh permission checks happen before receipt replay.
 execute(change(reviewer,'permission.grant',9,'drafts.edit',institution=ic));rev=sql(f"SELECT max(revision) FROM twuanis_remates_private.offering_events WHERE offering_id='{off}'");rc=sel(fv,'DIRECT_SALE',rev);req=ident();sql(fc(rc,'financial.select',req,reviewer));execute(change(reviewer,'permission.revoke',10,'drafts.edit',institution=ic));reject('revoked financial actor cannot replay receipt',fc(rc,'financial.select',req,reviewer),'42501')
 execute(change(reviewer,'permission.grant',11,'drafts.edit',institution=ic));rev=sql(f"SELECT max(revision) FROM twuanis_remates_private.offering_events WHERE offering_id='{off}'");rc=sel(fv,'DIRECT_SALE',rev)
 first=subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env)
 first.stdin.write("BEGIN;"+ac(change(reviewer,'permission.revoke',12,'drafts.edit',institution=ic)).replace('BEGIN;','').replace(' COMMIT;','')+"SELECT pg_backend_pid();\n");first.stdin.flush()
 while True:
  line=first.stdout.readline().strip()
  if line.isdigit():lockpid=int(line);break
 second=subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env);second.stdin.write("SET application_name='r07_after_revoke';"+fc(rc,'financial.select',who=reviewer)+"\n");second.stdin.close();second.stdin=None
 blocked=False
 for _ in range(100):
  blocked=sql(f"SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name='r07_after_revoke' AND {lockpid}=ANY(pg_blocking_pids(pid)))")=='t'
  if blocked:break
  time.sleep(.02)
 assert blocked;first.stdin.write("COMMIT;\n\\q\n");first.stdin.flush();first.communicate(timeout=10);out,err=second.communicate(timeout=12);assert second.returncode and '42501' in err;results.append('observed independent-session revocation blocks then denies financial write')
 check('permission race creates no financial selection',f"SELECT max(revision)={rev} FROM twuanis_remates_private.offering_events WHERE offering_id='{off}'")
 # Bounded keyset evidence pages preserve every retained financial identity exactly once.
 for index in range(27):
  ob=retain(evidence('observation.retain',dict(obs_body,key='r07-page-'+str(index),record_key='r07-page-'+str(index),fields=[dict(path='parcel',ordinal=0,label='Parcel',raw='R07-PAGE-'+str(index),validation='VALID'),dict(path='price',ordinal=0,label='Bank price',raw=str(index+1),currency='USD',validation='VALID')])))['id'];ca=icmd(proposal(ob,[parcel('R07-PAGE-'+str(index),'parcel')]))['id'];of=icmd(decide(ca))['offeringId'];save(dict(fb('price','SELLING_PRICE',str(index+1),'USD'),offering=of,observation=ob))
 firstpage=fr()['items'];nextpage=fr(after=firstpage[24]['id'])['items'];assert len(firstpage)==26 and not({x['id'] for x in firstpage[:25]} & {x['id'] for x in nextpage});results.append('26-row lookahead keyset history bounded no duplicate page boundary')
 sortedrows=fr(currency='USD',kind='SELLING_PRICE',sort='amount')['items'];nxt=fr(currency='USD',kind='SELLING_PRICE',sort='amount',after=sortedrows[24]['id'])['items'];assert not({x['id'] for x in sortedrows[:25]} & {x['id'] for x in nxt});results.append('numeric currency-specific amount cursor excludes preceding rows')
 assert snap()==r07_before;results.append('ten ordinary population/reference/warm-cache snapshots unchanged across R07')
 check('R07 does not publish or alter opportunity lifecycle',"SELECT bool_and(state='DRAFT') FROM twuanis_remates_private.listings")
 print('R07',len(results)-r07_start,'focused checks PASS',flush=True)

 report={'status':'PASS','assertions':len(results),'results':results,'fixture':'Disposable PostgreSQL 17; exact affected migrations 003–011/018/019/023/025–027 and 062/063/064/065/066/067/068; exact 060 live-account function on representative principal fixture; representative existing table fixture, not production clone','full17EngineRegression':'NOT RUN / R-15','production':'UNCHANGED'}
 (root/'outputs/remates/R-07-db-results.json').write_text(json.dumps(report,indent=2));print('PASS',len(results),'database checks')
finally:
 if started:run('pg_ctl',['-D',str(data),'stop','-m','fast'])
 import shutil;shutil.rmtree(dir)
