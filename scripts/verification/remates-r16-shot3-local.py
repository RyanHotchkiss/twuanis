# Disposable genuine local Supabase ONLY. Private existing synthetic fixture credentials never printed.
import subprocess,os,json,pathlib
D='/Applications/Docker.app/Contents/Resources/bin/docker';N='supabase_db_twuanis-disposable-rehearsal';E={k:v for k,v in os.environ.items() if not k.startswith('PG') and k not in ('DATABASE_URL','SUPABASE_ACCESS_TOKEN','SUPABASE_DB_PASSWORD')};E['DOCKER_HOST']='unix:///Users/cassidydaddy/.docker/run/docker.sock'
def sql(q):
 j=json.loads(subprocess.check_output([D,'inspect',N],env=E))[0];assert j['Name']=='/'+N and j['State']['Running'];assert j['NetworkSettings']['Ports']['5432/tcp']==[{'HostIp':'127.0.0.1','HostPort':'54322'}]
 p=subprocess.run([D,'exec','-i',N,'psql','-X','-At','-v','ON_ERROR_STOP=1','-U','postgres','-d','postgres'],input=q,text=True,capture_output=True,env=E)
 if p.returncode:raise RuntimeError(p.stderr[-1800:])
 return p.stdout.strip()
import runpy,json,pathlib,urllib.request,urllib.error,uuid
J=json.load(open('/private/tmp/shot1-local-status.json'));assert J['API_URL']=='http://127.0.0.1:54321';F=json.load(open('/private/tmp/shot1-local-fixtures.private.json'));tokens={};checks=[]
def call(path,data,role='owner'):
 req=urllib.request.Request(J['API_URL']+path,data=json.dumps(data).encode(),headers={'apikey':J['ANON_KEY'],'Authorization':'Bearer '+tokens.get(role,J['ANON_KEY']),'Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=12) as r:return r.status,json.load(r)
 except urllib.error.HTTPError as e:return e.code,json.load(e)
def login(role):
 a=F['accounts'][role];st,v=call('/auth/v1/token?grant_type=password',{'email':a['email'],'password':a['password']},role);assert st==200;tokens[role]=v['access_token']
def rpc(fn,c,role='owner',req=None):return call('/rest/v1/rpc/'+fn,{'p_request':req or str(uuid.uuid4()),'p_command':c},role)
def ok(name,res):
 st,v=res;assert st==200 and v.get('ok'),(name,st,v);checks.append(name);return v
I=F['institutions']['A'];S=F['source'];reason='Synthetic disposable LOCAL binding-ingestion repair'
def env(op,key,body):return {'operation':op,'institution':I,'source':S,'expected':'1','reason':reason,key:body}
def classify(d,rev):return env('classification.record','classification',{'property':d['propertyId'],'expected_property':'2','expected':str(rev),'observation':d['observationId'],'geography':{'province':{'term':'10','path':'province','ordinal':0},'canton':{'term':'17','path':'canton','ordinal':0},'district':None},'semantics':{k:([{'term':'1115','path':'property_type','ordinal':0}] if k=='property_type' else []) for k in ['property_type','utility','environment','terrain','accessibility','legal_status']},'facts':{},'reviewed':True})
def financial(d,rev):
 c=env('financial.retain','financial',{'offering':d['offeringId'],'observation':d['observationId'],'path':'amount','ordinal':0,'kind':'SELLING_PRICE','status':'VALID','amount':'123456.78','currency':'USD','round':None});v=ok('retain immutable finance',rpc('remate_financial_command',c));ok('review finance',rpc('remate_financial_command',env('financial.select','financial',{'offering':d['offeringId'],'expected':str(rev),'mechanism':'DIRECT_SALE','value':v['id'],'reviewed':True})))

h=globals().copy();s=h['sql'];rpc=h['rpc'];env=h['env'];ok=h['ok'];h['login']('owner');checks=[];fixtures=[]
def check(n,b):
 assert b,n
 checks.append(n)
def read(q):return h['call']('/rest/v1/rpc/remate_public_read',{'p_query':q})
# Canonical synthetic fixture creation through genuine local Auth and REST, no direct row writes.
for mech,kind,curr,amount in [('AUCTION','AUCTION_BASE','CRC','12345678.90'),('DIRECT_SALE','SELLING_PRICE','USD','123456.78')]:
 key='r16-shot3-local-'+str(uuid.uuid4());row={k:None for k in ['key','expected','title','parcel','jurisdiction','province','canton','district','property_type','mechanism','amount','currency','round']};row.update(key=key,expected='0',title='SYNTHETIC LOCAL SHOT3 '+mech,parcel=key,jurisdiction='SYNTHETIC',province='10',canton='17',property_type='1115',mechanism=mech,amount=amount,currency=curr,round='1' if mech=='AUCTION' else None)
 d=ok('draft',rpc('remate_publication_command',env('draft.save','data',row)))
 p=ok('identity proposal',rpc('remate_identity_command',env('identity.propose','identity',{'observation':d['observationId'],'expected_binding':'0','offering':d['offeringId'],'expected_offering':'1','parcels':[{'property':d['propertyId'],'expected':'1','identifiers':[{'kind':'PARCEL','jurisdiction':'SYNTHETIC','value':key,'path':'parcel','ordinal':0}]}]})))
 ok('confirm',rpc('remate_identity_command',env('identity.decide','identity',{'case':p['id'],'expected_case':'1','decision':'CONFIRM_PROPOSAL'})))
 ok('classify',rpc('remate_classification_command',h['classify'](d,0)))
 v=ok('retain',rpc('remate_financial_command',env('financial.retain','financial',{'offering':d['offeringId'],'observation':d['observationId'],'path':'amount','ordinal':0,'kind':kind,'status':'VALID','amount':amount,'currency':curr,'round':{'path':'round','ordinal':0} if mech=='AUCTION' else None})))
 ok('select',rpc('remate_financial_command',env('financial.select','financial',{'offering':d['offeringId'],'expected':'0','mechanism':mech,'value':v['id'],'reviewed':True})))
 ok('ingest',rpc('remate_ingestion_command',env('ingestion.record','lifecycle',{'offering':d['offeringId'],'observation':d['observationId'],'binding_revision':'1'})))
 pub=ok('publish',rpc('remate_ingestion_command',env('publication.publish','lifecycle',{'offering':d['offeringId'],'expected':'1','reviewed':True})))
 d['listingId']=s("SELECT id FROM twuanis_remates_private.listings WHERE offering_id='"+d['offeringId']+"';");d.update(mechanism=mech,kind=kind,currency=curr,amount=amount,publication=pub);fixtures.append(d)
# Enable delivery only on disposable local through canonical Owner command.
rev=s('SELECT coalesce(max(revision),0) FROM twuanis_remates_private.delivery_versions;')
ok('local delivery',rpc('remate_delivery_command',{'expected':rev,'enabled':True,'reason':'Synthetic LOCAL ONLY disposition regression'}))
preinstalled=s("SELECT md5(pg_get_viewdef('twuanis_remates_private.public_projection'::regclass,true));")=='462d8ee75baebafcf5b49dff1585bb2d'
for d in fixtures:
 lid=d['listingId'];st,v=read({'mode':'detail','id':lid});check('canonical fixture visible '+d['mechanism'],st==200 and len(v['items'])==1)
 if preinstalled:check('reproduce '+d['mechanism']+' UNKNOWN',v['items'][0]['mechanism']=='UNKNOWN')
private_before=s("SELECT md5(coalesce(jsonb_agg(to_jsonb(f) ORDER BY f.id)::text,'')) FROM twuanis_remates_private.financial_values f;")
acl_before=s("SELECT jsonb_build_object('owner',relowner,'acl',relacl::text,'options',reloptions,'columns',(SELECT jsonb_agg(jsonb_build_array(attname,atttypid) ORDER BY attnum) FROM pg_attribute WHERE attrelid=c.oid AND attnum>0 AND NOT attisdropped)) FROM pg_class c WHERE c.oid='twuanis_remates_private.public_projection'::regclass;")
m=pathlib.Path('/Users/cassidydaddy/twuanis/supabase/migrations/084_remates_public_disposition.sql');
if preinstalled:s(m.read_text())
check('migration installed and guarded',True)
check('financial evidence unchanged',private_before==s("SELECT md5(coalesce(jsonb_agg(to_jsonb(f) ORDER BY f.id)::text,'')) FROM twuanis_remates_private.financial_values f;"))
check('owner ACL barrier column identities preserved',acl_before==s("SELECT jsonb_build_object('owner',relowner,'acl',relacl::text,'options',reloptions,'columns',(SELECT jsonb_agg(jsonb_build_array(attname,atttypid) ORDER BY attnum) FROM pg_attribute WHERE attrelid=c.oid AND attnum>0 AND NOT attisdropped)) FROM pg_class c WHERE c.oid='twuanis_remates_private.public_projection'::regclass;"))
for d in fixtures:
 lid=d['listingId'];st,v=read({'mode':'detail','id':lid});item=v['items'][0];check(d['mechanism']+' detail classification',st==200 and item['mechanism']==d['mechanism']);check(d['mechanism']+' money unchanged',item['currency']==d['currency'] and float(item['amount'])==float(d['amount']) and item['financial_kind']==d['kind'])
 st,v=read({'mode':'list','mechanism':d['mechanism']});check(d['mechanism']+' exact eligible UUID',st==200 and lid in [x['id'] for x in v['items']] and all(x['mechanism']==d['mechanism'] for x in v['items']))
 opposite='AUCTION' if d['mechanism']=='DIRECT_SALE' else 'DIRECT_SALE';st,v=read({'mode':'list','mechanism':opposite});check(d['mechanism']+' opposite filter exclusion',lid not in [x['id'] for x in v['items']])
 st,v=read({'mode':'list','mechanism':'UNKNOWN'});check(d['mechanism']+' not misclassified UNKNOWN',lid not in [x['id'] for x in v['items']])
 ok('withdraw',rpc('remate_ingestion_command',env('publication.withdraw','lifecycle',{'offering':d['offeringId'],'expected':'2','basis':'ADMINISTRATIVE','reviewed':True})))
 st,v=read({'mode':'detail','id':lid});check(d['mechanism']+' withdrawal exclusion',st==200 and v['items']==[])
 # Restoration requires genuine new reviewed evidence after withdrawal; never weaken it.
 row.update(key=s("SELECT record_key FROM twuanis_remates_private.observations WHERE id='"+d['observationId']+"';"),expected='1',title='SYNTHETIC LOCAL SHOT3 REAPPEARED '+d['mechanism'],parcel=s("SELECT record_key FROM twuanis_remates_private.observations WHERE id='"+d['observationId']+"';"),mechanism=d['mechanism'],amount=d['amount'],currency=d['currency'],round='1' if d['mechanism']=='AUCTION' else None)
 nd=ok('fresh observation',rpc('remate_publication_command',env('draft.save','data',row)));nd.update(propertyId=d['propertyId'],offeringId=d['offeringId'])
 p=ok('fresh identity',rpc('remate_identity_command',env('identity.propose','identity',{'observation':nd['observationId'],'expected_binding':'1','parcels':[{'property':d['propertyId'],'expected':'2','identifiers':[{'kind':'PARCEL','jurisdiction':'SYNTHETIC','value':row['key'],'path':'parcel','ordinal':0}]}]})))
 ok('keep identity',rpc('remate_identity_command',env('identity.decide','identity',{'case':p['id'],'expected_case':'1','decision':'KEEP_CURRENT'})))
 ok('fresh classification',rpc('remate_classification_command',h['classify'](nd,1)))
 f=ok('fresh finance',rpc('remate_financial_command',env('financial.retain','financial',{'offering':d['offeringId'],'observation':nd['observationId'],'path':'amount','ordinal':0,'kind':d['kind'],'status':'VALID','amount':d['amount'],'currency':d['currency'],'round':{'path':'round','ordinal':0} if d['mechanism']=='AUCTION' else None})))
 ok('fresh select',rpc('remate_financial_command',env('financial.select','financial',{'offering':d['offeringId'],'expected':'1','mechanism':d['mechanism'],'value':f['id'],'reviewed':True})))
 ok('fresh ingest',rpc('remate_ingestion_command',env('ingestion.record','lifecycle',{'offering':d['offeringId'],'observation':nd['observationId'],'binding_revision':'2'})))
 ok('restore',rpc('remate_ingestion_command',env('publication.restore','lifecycle',{'offering':d['offeringId'],'expected':'3','reviewed':True})))
 st,v=read({'mode':'detail','id':lid});check(d['mechanism']+' restored classification',st==200 and v['items'][0]['mechanism']==d['mechanism'])
st,v=read({'mode':'list','mechanism':'UNSUPPORTED'});check('unsupported filter rejected',st==400 and v['code']=='22023')
# Public reader uses actual anonymous API credential, private view remains inaccessible.
st,v=h['call']('/rest/v1/rpc/remate_public_read',{'p_query':{'mode':'list','mechanism':'AUCTION'}},role='anonymous');check('anonymous authorized safe projection',st==200)
try:s(m.read_text());raise AssertionError('reexecution accepted')
except RuntimeError as e:check('predecessor guard refuses replay','predecessor drift' in str(e))
rev=s('SELECT max(revision) FROM twuanis_remates_private.delivery_versions;');ok('local delivery OFF',rpc('remate_delivery_command',{'expected':rev,'enabled':False,'reason':'End LOCAL disposition regression'}))
pathlib.Path('/private/tmp/r16-shot3-local-results.json').write_text(json.dumps({'checks':checks,'fixtures':fixtures,'migrationHash':hashlib.sha256(m.read_bytes()).hexdigest(),'correctedViewMD5':s("SELECT md5(pg_get_viewdef('twuanis_remates_private.public_projection'::regclass,true));"),'localDeliveryOff':True},indent=2));print('PASS',len(checks),'genuine local checks; local delivery OFF')

h=globals().copy();h['login']('owner');rpc=h['rpc'];env=h['env'];s=h['sql'];p=pathlib.Path('/private/tmp/r16-shot3-local-results.json');r=json.load(open(p));d=r['fixtures'][0];checks=r['checks'];before=s("SELECT md5(coalesce(jsonb_agg(to_jsonb(f) ORDER BY f.id)::text,'')) FROM twuanis_remates_private.financial_values f;")
# Current auction selection revision 2 after restoration. Never relabel a value as unsupported.
st,v=rpc('remate_financial_command',env('financial.select','financial',{'offering':d['offeringId'],'expected':'2','mechanism':'UNSUPPORTED','value':None,'reviewed':True}));assert st==400 and v['code']=='23514';checks.append('unsupported financial mechanism rejected by canonical constraint')
h['login']('customer');st,v=rpc('remate_financial_command',env('financial.select','financial',{'offering':d['offeringId'],'expected':'2','mechanism':'UNKNOWN','value':None,'reviewed':True}),role='customer');assert st==403 and v['code']=='42501';checks.append('customer cannot reclassify institution offering')
h['login']('owner');st,v=rpc('remate_financial_command',env('financial.select','financial',{'offering':d['offeringId'],'expected':'2','mechanism':'UNKNOWN','value':None,'reviewed':True}));assert st==200;checks.append('canonical unknown selection remains explicit without monetary substitution')
visible=json.loads(s("SELECT twuanis_remates_private.publication_visibility('"+d['listingId']+"');"));assert not visible['visible'];checks.append('changed financial review fails closed without automatic republication')
assert before==s("SELECT md5(coalesce(jsonb_agg(to_jsonb(f) ORDER BY f.id)::text,'')) FROM twuanis_remates_private.financial_values f;");checks.append('unknown/unsupported cases preserve all immutable financial records')
assert s("SELECT NOT has_table_privilege('anon','twuanis_remates_private.public_projection','SELECT') AND NOT has_table_privilege('authenticated','twuanis_remates_private.public_projection','SELECT') AND NOT has_table_privilege('service_role','twuanis_remates_private.public_projection','SELECT');")=='t';checks.append('direct private view access denied to API roles')
r['checks']=checks;r['scope']='Verified disposable Docker Supabase only; no cloud access';p.write_text(json.dumps(r,indent=2));print('PASS',len(checks),'genuine local checks')
