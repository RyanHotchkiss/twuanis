"""Genuine disposable local PostgreSQL/Supabase contract checks; never production."""
from pathlib import Path
import subprocess,os,json,uuid
ROOT=Path('/Users/cassidydaddy/twuanis');D='/Applications/Docker.app/Contents/Resources/bin/docker';N='supabase_db_twuanis-disposable-rehearsal';DB='bp_independent_086_'+uuid.uuid4().hex[:8];env=dict(os.environ);env['DOCKER_HOST']='unix:///Users/cassidydaddy/.docker/run/docker.sock';checks=[]
def sql(q,db=DB):return subprocess.run([D,'exec','-i',N,'psql','-X','-q','-At','-v','ON_ERROR_STOP=1','-U','postgres','-d',db],env=env,input=q,text=True,capture_output=True)
def run(q):
 r=sql(q)
 if r.returncode:raise RuntimeError(r.stderr)
 return r.stdout.strip()
def check(name,condition):
 checks.append({'name':name,'pass':bool(condition)})
 if not condition:raise RuntimeError(name)
a=json.loads(subprocess.check_output([D,'inspect',N],env=env))[0];assert a['State']['Running'] and all(p['HostIp']=='127.0.0.1' for group in a['NetworkSettings']['Ports'].values() if group for p in group)
r=sql('CREATE DATABASE '+DB+' TEMPLATE r17_compatibility_20261011_d;',db='postgres');assert r.returncode==0,r.stderr
migration=(ROOT/'supabase/migrations/086_remates_owner_independent_sources.sql').read_text();run(migration);check('migration installed atomically in isolated local Supabase',True)
ownerSession=str(uuid.uuid4());customerSession=str(uuid.uuid4());owner=str(uuid.uuid4());customer=str(uuid.uuid4());iid=str(uuid.uuid4());sid=str(uuid.uuid4());isid=str(uuid.uuid4())
run(f"INSERT INTO auth.users(id,email,email_confirmed_at,created_at,raw_user_meta_data) VALUES('{owner}','owner-independent@local.invalid',now(),now(),jsonb_build_object('registration_language','en')),('{customer}','customer-independent@local.invalid',now(),now(),jsonb_build_object('registration_language','en')); INSERT INTO auth.sessions(id,user_id) VALUES('{ownerSession}','{owner}'),('{customerSession}','{customer}'); INSERT INTO twuanis_canonical_private.account_principals(id) VALUES('{owner}'),('{customer}') ON CONFLICT DO NOTHING; INSERT INTO twuanis_canonical_private.owner_access_grants(user_id) VALUES('{owner}'); INSERT INTO twuanis_remates_private.institutions(id,legal_name,legal_identifier,identity_evidence) VALUES('{iid}','Synthetic independent source','4-000-042152','Local verified identity'); INSERT INTO twuanis_remates_private.source_origin_hosts(host,institution_id) VALUES('srv.bancopopular.fi.cr','{iid}'); INSERT INTO twuanis_remates_private.sources(id,institution_id,namespace,channel,origin_host,adapter_version) VALUES('{sid}','{iid}','bp-inventory','BANK_WEB','srv.bancopopular.fi.cr','remates-bp-inventory-fixture-v1'),('{isid}','{iid}','local-institution-086','INSTITUTION',NULL,'institution-v1');")
def auth(q,user=owner):
 claims=json.dumps({'sub':user,'session_id':ownerSession if user==owner else customerSession,'role':'authenticated'})
 return sql("BEGIN;SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='"+user+"';SET LOCAL request.jwt.claims='"+claims+"';"+q+";COMMIT;")
request=str(uuid.uuid4());command={'source':sid,'expected':'0','expected_source':'1','enabled':True,'access_evidence':'Synthetic local access review','publication_evidence':'Synthetic local publication review','reason':'Synthetic Owner-independent review, no partnership','reviewed':True}
def call(cmd=command,req=request,user=owner):return auth("SELECT public.remate_independent_source_command('"+req+"','"+json.dumps(cmd).replace("'","''")+"'::jsonb)",user)
r=call(user=customer);check('non-Owner cannot authorize independent source',r.returncode!=0)
r=call();
if r.returncode:print(r.stderr)
check('canonical Owner authorizes unapproved bank source',r.returncode==0);check('independent-source decision does not approve institution',run(f"SELECT approval_status FROM twuanis_remates_private.institutions WHERE id='{iid}'")=='UNAPPROVED');check('no representatives or permission grants created',run(f"SELECT count(*) FROM twuanis_remates_private.memberships WHERE institution_id='{iid}'")=='0')
r=call();
if r.returncode:print(r.stderr)
check('same request replays idempotently',r.returncode==0 and '"replayed": true' in r.stdout);check('one immutable authorization decision',run(f"SELECT count(*) FROM twuanis_remates_private.independent_source_decisions WHERE source_id='{sid}'")=='1')
check('changed replay is rejected',call({**command,'reason':'Changed reason'}).returncode!=0);check('institutional channel cannot obtain independent exception',call({**command,'source':isid},str(uuid.uuid4())).returncode!=0);check('missing explicit review rejected',call({**command,'expected':'1','reviewed':False},str(uuid.uuid4())).returncode!=0);check('stale source revision denied',call({**command,'expected':'1','expected_source':'2'},str(uuid.uuid4())).returncode!=0)
check('Owner can read decision',auth(f"SELECT public.remate_independent_source_read('{sid}')").returncode==0);check('non-Owner cannot read protected decision',auth(f"SELECT public.remate_independent_source_read('{sid}')",customer).returncode!=0)
for role in ['anon','authenticated','service_role']:
 for op in ['SELECT','UPDATE','DELETE','TRUNCATE']:
  q={'SELECT':'SELECT * FROM','UPDATE':'UPDATE','DELETE':'DELETE FROM','TRUNCATE':'TRUNCATE'}[op]+' twuanis_remates_private.independent_source_decisions'+(' SET enabled=false' if op=='UPDATE' else '')
  check(role+' direct '+op+' denied',sql('BEGIN;SET LOCAL ROLE '+role+';'+q+';ROLLBACK;').returncode!=0)
check('operator cannot rewrite immutable decisions',sql('BEGIN;UPDATE twuanis_remates_private.independent_source_decisions SET enabled=false;ROLLBACK;').returncode!=0)
check('independent authorization active',run(f"SELECT twuanis_remates_private.independent_source_allowed('{sid}')")=='t')
# Full existing-command pipeline, using one acquired record in local-only synthetic source scope.
plan=json.loads((ROOT/'outputs/scrapers/banco-popular/batch-preparation/evidence-command-plan.REVIEW-ONLY.json').read_text())
candidates=json.loads((ROOT/'outputs/scrapers/banco-popular/batch-preparation/canonical-readiness-records.json').read_text());candidate=next(x for x in candidates if x['canonical_reference_ready'] and x['selling_price']);rowid=candidate['codBien'];step=next(s for s in plan if s['command']['operation']=='observation.retain' and s['command']['evidence']['record_key']=='codBien:'+rowid);runkey=step['command']['evidence']['run'][9:-3];runstep=next(s for s in plan if s['key']==runkey)
base={'institution':iid,'source':sid,'expected':'1','reason':'Synthetic local Owner review; independently attributed source; no publication until selected'}
def rpc(function,command,req=None):
 r=auth("SELECT public."+function+"('"+(req or str(uuid.uuid4()))+"','"+json.dumps(command).replace("'","''")+"'::jsonb)")
 if r.returncode:raise RuntimeError(r.stderr)
 return json.loads(next(x for x in r.stdout.splitlines() if x.startswith('{')))
policy=rpc('remate_ingestion_command',{**base,'operation':'policy.record','lifecycle':{'expected':'0','fresh_seconds':'86400','archive_seconds':'604800','absent_runs':'3','coverage_key':'local-acquired-record-only','unconfirmed_visibility':'HIDE','suspended_visibility':'HIDE','reviewed':True}})
rr=rpc('remate_evidence_command',{**base,'operation':'run.retain','evidence':runstep['command']['evidence']});ob=rpc('remate_evidence_command',{**base,'operation':'observation.retain','evidence':{**step['command']['evidence'],'run':rr['id']}})
check('real CSV source evidence retained locally without source/time/price changes',run(f"SELECT raw_text FROM twuanis_remates_private.observations WHERE id='{ob['id']}'")==step['command']['evidence']['raw'])
proposal=rpc('remate_identity_command',{**base,'operation':'identity.propose','identity':{'observation':ob['id'],'expected_binding':'0','parcels':[{'expected':'0','identifiers':[{'kind':'REGISTRY','jurisdiction':'Costa Rica','value':json.loads(step['command']['evidence']['raw'])['folio'],'path':'csv.folio','ordinal':0}]}]}})
decision=rpc('remate_identity_command',{**base,'operation':'identity.decide','identity':{'case':proposal['id'],'expected_case':'1','decision':'CONFIRM_PROPOSAL'}});off=decision['offeringId'];prop=run(f"SELECT property_id FROM twuanis_remates_private.offering_properties WHERE offering_id='{off}'")
geo={k:{'term':str(candidate['geography'][k]),'path':'csv.'+k,'ordinal':0} if candidate['geography'][k] else None for k in ['province','canton','district']};semantics={'property_type':[{'term':str(candidate['property_type']['canonical_term']),'path':'csv.property_type','ordinal':0}],'utility':[],'environment':[],'terrain':[],'accessibility':[],'legal_status':[]}
cls=rpc('remate_classification_command',{**base,'operation':'classification.record','classification':{'property':prop,'expected_property':'2','expected':'0','observation':ob['id'],'geography':geo,'semantics':semantics,'facts':{},'reviewed':True}});check('canonical geography/type check succeeds',cls['minimumReady'])
check('import has not published',run(f"SELECT state FROM twuanis_remates_private.listings WHERE offering_id='{off}'")=='DRAFT')
check('publication without reviewed ingestion/financial evidence denied',auth("SELECT public.remate_ingestion_command('"+str(uuid.uuid4())+"','"+json.dumps({**base,'operation':'publication.publish','lifecycle':{'offering':off,'expected':'1','reviewed':True}})+"')").returncode!=0)
amount=candidate['normalized_selling_assertion'];fv=rpc('remate_financial_command',{**base,'operation':'financial.retain','financial':{'offering':off,'observation':ob['id'],'path':'csv.normalized_selling_price','ordinal':0,'kind':'SELLING_PRICE','status':'VALID','amount':amount['amount'],'currency':amount['currency'],'round':None}})
selected=rpc('remate_financial_command',{**base,'operation':'financial.select','financial':{'offering':off,'expected':'0','mechanism':'DIRECT_SALE','value':fv['id'],'reviewed':True}})
retained=rpc('remate_ingestion_command',{**base,'operation':'ingestion.record','lifecycle':{'observation':ob['id'],'offering':off,'binding_revision':'1'}})
check('independent source meets all canonical eligibility without bank approval',json.loads(run(f"SELECT twuanis_remates_private.lifecycle_eligibility('{off}')"))['eligible'])
check('ingestion still does not publish',run(f"SELECT state FROM twuanis_remates_private.listings WHERE offering_id='{off}'")=='DRAFT')
publication=rpc('remate_ingestion_command',{**base,'operation':'publication.publish','lifecycle':{'offering':off,'expected':'1','reviewed':True}})
check('explicit Owner publication succeeds for unapproved independently attributed source',run(f"SELECT state FROM twuanis_remates_private.listings WHERE offering_id='{off}'")=='PUBLISHED')
lid=run(f"SELECT id FROM twuanis_remates_private.listings WHERE offering_id='{off}'");check('independent publication visibility eligible',json.loads(run(f"SELECT twuanis_remates_private.publication_visibility('{lid}')"))['visible'])
check('discovery remains OFF and projection empty',run('SELECT count(*) FROM twuanis_remates_private.public_projection')=='0')
check('price remains exact selling price',run(f"SELECT amount::text FROM twuanis_remates_private.financial_values WHERE id='{fv['id']}'")==amount['amount'])
check('one immutable publication event',run(f"SELECT count(*) FROM twuanis_remates_private.publication_events WHERE offering_id='{off}'")=='1')

# Nonexistent/unsupported offerings never become eligible by source authorization.
check('missing offering remains ineligible',run("SELECT (twuanis_remates_private.lifecycle_eligibility('"+str(uuid.uuid4())+"')->>'eligible')")=='false')
oid=run(f"INSERT INTO twuanis_remates_private.offerings(institution_id,source_id) VALUES('{iid}','{sid}') RETURNING id")
check('canonical checks remain required for incomplete draft',bool(oid))
reasons=json.loads(run(f"SELECT twuanis_remates_private.lifecycle_eligibility('{oid}')"))
check('only institutional participation reason removed', 'INSTITUTION_INACTIVE' not in reasons['reasons'] and not reasons['eligible'] and 'NO_REVIEWED_INGESTION' in reasons['reasons'] and 'IDENTITY_OR_CLASSIFICATION_UNREADY' in reasons['reasons'] and 'FINANCIAL_REVIEW_REQUIRED' in reasons['reasons'])
# Explicit revocation uses the same canonical administrative contract.
r=call({**command,'expected':'1','enabled':False},str(uuid.uuid4()));check('Owner revocation succeeds',r.returncode==0);check('revocation immediately blocks exception',run(f"SELECT twuanis_remates_private.independent_source_allowed('{sid}')")=='f');check('revocation preserves both receipts',run(f"SELECT count(*) FROM twuanis_remates_private.independent_source_decisions WHERE source_id='{sid}'")=='2')
check('migration refuses repeat installation',sql(migration).returncode!=0)
out=ROOT/'outputs/remates/independent-source-import';out.mkdir(exist_ok=True);(out/'local-database-security.json').write_text(json.dumps({'status':'PASS','database':DB,'scope':'Genuine local Supabase PostgreSQL with disposable synthetic auth.users and authenticated-role claim fixtures; no production sessions or records','checks':checks},indent=2));private=Path('/private/tmp/remates-independent-local-fixtures.json');private.write_text(json.dumps({'database':DB,'owner':owner,'ownerSession':ownerSession,'customer':customer,'customerSession':customerSession,'institution':iid,'source':sid}));private.chmod(0o600);print('LOCAL DATABASE PASS',len(checks))
