import runpy,json,pathlib,uuid,concurrent.futures,copy
x=runpy.run_path(str(pathlib.Path(__file__).with_name('remates-binding-reconciliation-local-fixture.py')));sql=x['sql'];rpc=x['rpc'];login=x['login'];env=x['env'];F=x['F'];I=x['I'];S=x['S'];d=json.load(open('/private/tmp/080-local-fixture.json'));new=d['new'];results=[]
for role in ['owner','customer','representative','revoked','admin']:login(role)
def check(n,ok,detail=None):results.append({'test':n,'status':'PASS' if ok else 'FAIL','detail':detail});assert ok,(n,detail)
def snap():return sql("SELECT jsonb_build_object('ingestions',(SELECT jsonb_agg(to_jsonb(i) ORDER BY id) FROM twuanis_remates_private.ingestion_results i WHERE offering_id='"+new['offeringId']+"'),'bindings',(SELECT jsonb_agg(to_jsonb(b) ORDER BY id) FROM twuanis_remates_private.source_bindings b WHERE offering_id='"+new['offeringId']+"'),'observations',(SELECT jsonb_agg(to_jsonb(o) ORDER BY id) FROM twuanis_remates_private.observations o WHERE id IN ('"+new['observationId']+"','"+d['draft']['observationId']+"')),'receipts',(SELECT jsonb_agg(to_jsonb(r) ORDER BY id) FROM twuanis_remates_private.command_receipts r WHERE id IN ('"+d['ingestion']['receiptId']+"','"+d['original_ingestion']['receiptId']+"')));")
before=snap();binding=json.loads(sql("SELECT to_jsonb(b) FROM twuanis_remates_private.source_bindings b WHERE offering_id='"+new['offeringId']+"' ORDER BY revision DESC LIMIT 1;"))
c=env('ingestion.reconcile','lifecycle',{'ingestion':d['ingestion']['id'],'observation':new['observationId'],'offering':new['offeringId'],'expected_offering':'1','binding':binding['id'],'binding_revision':'2','decision':binding['decision_id'],'expected':'0','properties':[{'property':new['propertyId'],'expected':'2'}],'reviewed':True})
# Ingestion remains separate; exact old request replays even after binding revision.
st,r=rpc('remate_ingestion_command',d['ingestion_command'],req=d['ingestion_request']);check('original ingestion exact replay remains original',st==200 and r['id']==d['ingestion']['id'] and r['replayed'],(st,r))
st,r=rpc('remate_ingestion_command',{**d['ingestion_command'],'reason':'changed'},req=d['ingestion_request']);check('ingestion altered replay denied',st==409)
for name,body,status in [('missing explicit review',{**c['lifecycle'],'reviewed':False},400),('stale binding',{**c['lifecycle'],'binding_revision':'1'},409),('wrong property',{**c['lifecycle'],'properties':[{'property':str(uuid.uuid4()),'expected':'2'}]},409),('missing property',{**c['lifecycle'],'properties':[]},400),('wrong decision',{**c['lifecycle'],'decision':str(uuid.uuid4())},400),('wrong observation',{**c['lifecycle'],'observation':d['draft']['observationId']},400),('wrong offering',{**c['lifecycle'],'offering':str(uuid.uuid4())},409),('wrong ingestion',{**c['lifecycle'],'ingestion':str(uuid.uuid4())},400),('wrong offering revision',{**c['lifecycle'],'expected_offering':'2'},409),('wrong property revision',{**c['lifecycle'],'properties':[{'property':new['propertyId'],'expected':'1'}]},409)]:
 st,r=rpc('remate_ingestion_command',{**c,'lifecycle':body});check(name+' denied',st==status,(st,r))
for role in ['customer','revoked','representative','admin']:
 st,r=rpc('remate_ingestion_command',c,role);check(role+' without combined reconciliation permissions denied',st==403,(st,r))
st,r=rpc('remate_ingestion_command',{**c,'institution':F['institutions']['B']});check('cross-institution source denial',st==403)
# Two genuine independent REST requests produce one explicit event and one stale rejection.
reqs=[str(uuid.uuid4()),str(uuid.uuid4())]
with concurrent.futures.ThreadPoolExecutor(2) as pool:out=list(pool.map(lambda i:rpc('remate_ingestion_command',c,req=reqs[i]),[0,1]))
check('concurrent reconciliation exactly one winner',sorted(v[0] for v in out)==[200,409],out);win=next(i for i,v in enumerate(out) if v[0]==200);r=out[win][1]
st,replay=rpc('remate_ingestion_command',c,req=reqs[win]);check('reconciliation exact replay original event/receipt',st==200 and replay['replayed'] and replay['id']==r['id'] and replay['receiptId']==r['receiptId'])
st,bad=rpc('remate_ingestion_command',{**c,'reason':'altered'},req=reqs[win]);check('reconciliation conflicting replay denied',st==409)
st,bad=rpc('remate_ingestion_command',c);check('stale reconciliation denied',st==409 and bad['code']=='PT409')
st,bad=rpc('remate_ingestion_command',{**c,'lifecycle':{**c['lifecycle'],'expected':'1'}});check('new request cannot duplicate same binding event',st==409 and bad['code']=='23505')
check('historical observation/binding/ingestion/receipts byte-equivalent',before==snap())
check('one immutable reconciliation event',sql("SELECT count(*) FROM twuanis_remates_private.ingestion_reconciliations WHERE ingestion_id='"+d['ingestion']['id']+"';")=='1')
check('one winner receipt and no loser receipt',sql("SELECT count(*) FROM twuanis_remates_private.command_receipts WHERE request_id IN('"+"','".join(reqs)+"');")=='1')
check('current ingestion resolves original immutable event',sql("SELECT twuanis_remates_private.current_ingestion('"+new['offeringId']+"');")==d['ingestion']['id'])
ready=json.loads(sql("SELECT twuanis_remates_private.lifecycle_eligibility('"+new['offeringId']+"');"));check('full eligibility after explicit reconciliation',ready['eligible'],ready)
st,restored=rpc('remate_ingestion_command',env('publication.restore','lifecycle',{'offering':new['offeringId'],'expected':'3','reviewed':True}));check('restore genuine REST after complete review',st==200,(st,restored));check('restored listing revision4',sql("SELECT state||':'||revision FROM twuanis_remates_private.listings WHERE offering_id='"+new['offeringId']+"';")=='PUBLISHED:4')
check('publication audit identifies reconciliation',sql("SELECT evidence->>'binding_reconciliation' FROM twuanis_remates_private.publication_events WHERE id='"+restored['id']+"';")==r['id'])
check('source stays disabled',sql("SELECT enabled FROM twuanis_remates_private.sources WHERE id='"+S+"';")=='f');check('public delivery remains OFF',sql("SELECT count(*) FROM twuanis_remates_private.public_projection;")=='0')
st,reader=x['call']('/rest/v1/rpc/remate_ingestion_read',{'p_query':{'institution':I,'source':S,'mode':'reconciliations'}});check('scoped reconciliation reader connected',st==200 and any(a['id']==r['id'] for a in reader['items']))
# Canonical suspend/restore through approved local authority: replay itself denied while suspended.
rev=sql("SELECT revision FROM twuanis_remates_private.institutions WHERE id='"+I+"';")
base={'institution':I,'expected':rev,'reason':'Synthetic local suspension reconciliation denial'};st,a=rpc('remate_authority_command',{**base,'operation':'institution.suspend'});check('local canonical institution suspension',st==200,(st,a))
st,bad=rpc('remate_ingestion_command',c,req=reqs[win]);check('suspended institution cannot replay reconciliation',st==403,(st,bad))
st,a=rpc('remate_authority_command',{**base,'expected':a['revision'],'operation':'institution.restore'});check('local canonical institution restored without publication side effect',st==200)
# Immutable table denial and RLS/ACL checks (operator uses rollback-only transaction).
for verb in ["UPDATE twuanis_remates_private.ingestion_reconciliations SET reason='tamper' WHERE id='"+r['id']+"'","DELETE FROM twuanis_remates_private.ingestion_reconciliations WHERE id='"+r['id']+"'","TRUNCATE twuanis_remates_private.ingestion_reconciliations"]:
 try:sql('BEGIN;'+verb+';ROLLBACK;');ok=False
 except RuntimeError as e:ok='immutable' in str(e)
 check('immutable reconciliation '+verb.split()[0],ok)
pre=json.load(open('/private/tmp/080-predefinitions.json'));meta=json.loads(sql("SELECT json_agg(json_build_object('name',p.oid::regprocedure::text,'owner',pg_get_userbyid(p.proowner),'acl',p.proacl)) FROM pg_proc p WHERE p.oid IN ('public.remate_ingestion_command(uuid,jsonb)'::regprocedure,'public.remate_ingestion_read(jsonb)'::regprocedure,'twuanis_remates_private.current_ingestion(uuid)'::regprocedure);"))
check('existing owners and ACLs preserved',sorted([{k:v for k,v in a.items() if k!='md5'} for a in pre['fingerprints']],key=lambda a:a['name'])==sorted(meta,key=lambda a:a['name']))
check('new table RLS with no direct mutation/read grant',sql("SELECT relrowsecurity AND relowner=(SELECT oid FROM pg_roles WHERE rolname='postgres') AND NOT has_table_privilege('authenticated',oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE') AND NOT has_table_privilege('service_role',oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE') FROM pg_class WHERE oid='twuanis_remates_private.ingestion_reconciliations'::regclass;")=='t')
pathlib.Path('/private/tmp/080-local-results.json').write_text(json.dumps({'status':'PASS','checks':results,'reconciliation':r,'restoration':restored,'command':c,'eligibility':ready},indent=2));print('PASS',len(results),'genuine local integration/security checks')
