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

 report={'status':'PASS','assertions':len(results),'results':results,'fixture':'Disposable PostgreSQL 17; exact affected migrations 003–011/018/019/023/025–027 and 062/063; exact 060 live-account function on representative principal fixture; representative existing table fixture, not production clone','full17EngineRegression':'NOT RUN / R-15','production':'UNCHANGED'}
 (root/'outputs/remates/R-02-db-results.json').write_text(json.dumps(report,indent=2));print('PASS',len(results),'database checks')
finally:
 if started:run('pg_ctl',['-D',str(data),'stop','-m','fast'])
 import shutil;shutil.rmtree(dir)
