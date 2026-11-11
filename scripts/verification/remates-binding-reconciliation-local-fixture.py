"""Disposable loopback-only fixture; genuine Auth/REST, no cloud credentials. Private status/fixture paths may be supplied through TWUANIS_LOCAL_STATUS_FILE and TWUANIS_LOCAL_AUTH_FIXTURES."""
import runpy,json,pathlib,urllib.request,urllib.error,uuid
import subprocess,os,json,pathlib
D='/Applications/Docker.app/Contents/Resources/bin/docker';N='supabase_db_twuanis-disposable-rehearsal';E={k:v for k,v in os.environ.items() if not k.startswith('PG') and k not in ('DATABASE_URL','SUPABASE_ACCESS_TOKEN','SUPABASE_DB_PASSWORD')};E['DOCKER_HOST']='unix:///Users/cassidydaddy/.docker/run/docker.sock'
def sql(q):
 j=json.loads(subprocess.check_output([D,'inspect',N],env=E))[0];assert j['Name']=='/'+N and j['State']['Running'];assert j['NetworkSettings']['Ports']['5432/tcp']==[{'HostIp':'127.0.0.1','HostPort':'54322'}]
 p=subprocess.run([D,'exec','-i',N,'psql','-X','-At','-v','ON_ERROR_STOP=1','-U','postgres','-d','postgres'],input=q,text=True,capture_output=True,env=E)
 if p.returncode:raise RuntimeError(p.stderr[-1800:])
 return p.stdout.strip()

J=json.load(open(os.environ.get('TWUANIS_LOCAL_STATUS_FILE','/private/tmp/shot1-local-status.json')));assert J['API_URL']=='http://127.0.0.1:54321';F=json.load(open(os.environ.get('TWUANIS_LOCAL_AUTH_FIXTURES','/private/tmp/shot1-local-fixtures.private.json')));tokens={};checks=[]
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
if __name__=='__main__':
 login('owner');key='local-binding-repair-'+str(uuid.uuid4());row={k:None for k in ['key','expected','title','parcel','jurisdiction','province','canton','district','property_type','mechanism','amount','currency','round']};row.update(key=key,expected='0',title='SYNTHETIC LOCAL ONLY',parcel=key,jurisdiction='SYNTHETIC',province='10',canton='17',property_type='1115',mechanism='DIRECT_SALE',amount='123456.78',currency='USD')
 d=ok('draft',rpc('remate_publication_command',env('draft.save','data',row)))
 p=ok('identity propose',rpc('remate_identity_command',env('identity.propose','identity',{'observation':d['observationId'],'expected_binding':'0','offering':d['offeringId'],'expected_offering':'1','parcels':[{'property':d['propertyId'],'expected':'1','identifiers':[{'kind':'PARCEL','jurisdiction':'SYNTHETIC','value':key,'path':'parcel','ordinal':0}]}]})))
 ok('confirm identity',rpc('remate_identity_command',env('identity.decide','identity',{'case':p['id'],'expected_case':'1','decision':'CONFIRM_PROPOSAL'})))
 ok('classification',rpc('remate_classification_command',classify(d,0)));financial(d,0)
 oldpol=sql("SELECT coalesce(max(revision),0) FROM twuanis_remates_private.source_lifecycle_policies WHERE source_id='"+S+"';")
 pol=env('policy.record','lifecycle',{'expected':oldpol,'fresh_seconds':'86400','archive_seconds':'604800','absent_runs':'2','coverage_key':'SYNTHETIC LOCAL ONLY','unconfirmed_visibility':'HIDE','suspended_visibility':'HIDE','reviewed':True});ok('policy',rpc('remate_ingestion_command',pol))
 ing=env('ingestion.record','lifecycle',{'offering':d['offeringId'],'observation':d['observationId'],'binding_revision':'1'});ir=ok('ingestion',rpc('remate_ingestion_command',ing));ok('publish',rpc('remate_ingestion_command',env('publication.publish','lifecycle',{'offering':d['offeringId'],'expected':'1','reviewed':True})));ok('withdraw',rpc('remate_ingestion_command',env('publication.withdraw','lifecycle',{'offering':d['offeringId'],'expected':'2','basis':'ADMINISTRATIVE','reviewed':True})))
 row.update(expected='1',title='SYNTHETIC LOCAL ONLY REVISED');new=ok('revised draft',rpc('remate_publication_command',env('draft.save','data',row)));new.update(propertyId=d['propertyId'],offeringId=d['offeringId'])
 newing=env('ingestion.record','lifecycle',{'offering':d['offeringId'],'observation':new['observationId'],'binding_revision':'1'});req=str(uuid.uuid4());newir=ok('revised ingestion before identity decision',rpc('remate_ingestion_command',newing,req=req))
 p=ok('revised identity propose',rpc('remate_identity_command',env('identity.propose','identity',{'observation':new['observationId'],'expected_binding':'1','parcels':[{'property':d['propertyId'],'expected':'2','identifiers':[{'kind':'PARCEL','jurisdiction':'SYNTHETIC','value':key,'path':'parcel','ordinal':0}]}]})))
 decision=ok('KEEP_CURRENT',rpc('remate_identity_command',env('identity.decide','identity',{'case':p['id'],'expected_case':'1','decision':'KEEP_CURRENT'})))
 ok('revised classification',rpc('remate_classification_command',classify(new,1)));financial(new,1)
 st,v=rpc('remate_ingestion_command',{**newing,'lifecycle':{**newing['lifecycle'],'binding_revision':'2'}});assert st==409 and v['code']=='23505';checks.append('exact hosted conflict reproduced HTTP409/23505')
 st2,v2=rpc('remate_ingestion_command',env('publication.restore','lifecycle',{'offering':d['offeringId'],'expected':'3','reviewed':True}));assert st2==400;checks.append('restoration blocked before repair')
 state={'draft':d,'new':new,'ingestion':newir,'original_ingestion':ir,'ingestion_command':newing,'ingestion_request':req,'decision':decision,'conflict':v,'checks':checks};pathlib.Path('/private/tmp/080-local-fixture.json').write_text(json.dumps(state,indent=2));print('Reproduced exact failure; genuine local Auth/REST workflow',len(checks),'checks')
