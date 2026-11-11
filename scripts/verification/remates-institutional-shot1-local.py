import json,pathlib,urllib.request,urllib.error,uuid,secrets,subprocess,time,concurrent.futures,os
ROOT=pathlib.Path('/Users/cassidydaddy/twuanis');D='/Applications/Docker.app/Contents/Resources/bin/docker';N='supabase_db_twuanis-disposable-rehearsal';J=json.loads(pathlib.Path('/private/tmp/shot1-local-status.json').read_text());BASE=J['API_URL'];assert BASE=='http://127.0.0.1:54321';assert '54322' in J['DB_URL'];results=[];creds={};tokens={};run=str(uuid.uuid4())
def sql(q):
 info=json.loads(subprocess.check_output([D,'inspect',N]))[0];assert info['NetworkSettings']['Ports']['5432/tcp']==[{'HostIp':'127.0.0.1','HostPort':'54322'}]
 v=subprocess.run([D,'exec','-i',N,'psql','-X','-At','-v','ON_ERROR_STOP=1','-U','postgres','-d','postgres'],input=q.encode(),capture_output=True);assert v.returncode==0,v.stderr.decode();return v.stdout.decode().strip()
def call(path,body=None,token=None,admin=False,method=None):
 headers={'apikey':J['SERVICE_ROLE_KEY'] if admin else J['ANON_KEY'],'Authorization':'Bearer '+(token or (J['SERVICE_ROLE_KEY'] if admin else J['ANON_KEY'])),'Content-Type':'application/json'}
 t=time.monotonic();req=urllib.request.Request(BASE+path,data=json.dumps(body).encode() if body is not None else None,headers=headers,method=method)
 try:
  with urllib.request.urlopen(req,timeout=8) as r:return r.status,json.loads(r.read() or '{}'),time.monotonic()-t
 except urllib.error.HTTPError as e:return e.code,json.loads(e.read()),time.monotonic()-t
def check(n,ok,detail=None):
 results.append({'name':n,'status':'PASS' if ok else 'FAIL',**({'detail':detail} if detail is not None else {})});assert ok,n
for role in ['admin','representative','revoked','customer','unconfirmed']:
 pw=secrets.token_urlsafe(32);email='local-shot1-'+role+'-'+run+'@example.invalid';st,v,_=call('/auth/v1/admin/users',{'email':email,'password':pw,'email_confirm':role!='unconfirmed'},admin=True);check('genuine local Auth creation '+role,st==200);creds[role]={'id':v['id'],'email':email,'password':pw}
 if role!='unconfirmed':
  st,v,_=call('/auth/v1/token?grant_type=password',{'email':email,'password':pw});check('genuine local session '+role,st==200);tokens[role]=v['access_token']
# Reuse prior genuine disposable-local Owner fixture; no new grant/bootstrap.
local_owner=sql("SELECT user_id FROM twuanis_canonical_private.owner_access_grants WHERE revoked_at IS NULL;");check('exactly one existing local Owner',len(local_owner.splitlines())==1)
pw=secrets.token_urlsafe(32);st,v,_=call('/auth/v1/admin/users/'+local_owner,{'password':pw},admin=True,method='PUT');check('local-only Owner fixture credential prepared',st==200)
email=v['email'];st,v,_=call('/auth/v1/token?grant_type=password',{'email':email,'password':pw});check('genuine existing local Owner session',st==200 and v['user']['id']==local_owner);tokens['owner']=v['access_token'];creds['owner']={'id':local_owner,'email':email,'password':pw};owner=local_owner
def rpc(fn,cmd,role='owner',request=None):return call('/rest/v1/rpc/'+fn,{'p_request':request or str(uuid.uuid4()),'p_command':cmd},tokens[role])
def registry(cmd):
 st,v,t=rpc('remate_registry_command',cmd);check(cmd['operation']+' real Owner RPC',st==200 and v.get('ok'),{'seconds':round(t,3)});return v
reason='SYNTHETIC LOCAL ONLY reviewed evidence '+run
A=registry({'operation':'institution.register','name':'SYNTHETIC LOCAL SHOT1 A '+run,'reason':reason})['id']
B=registry({'operation':'institution.register','name':'SYNTHETIC LOCAL SHOT1 initial rejection '+run,'reason':reason})['id']
registry({'operation':'institution.verify','target':A,'expected':'1','legal_identifier':'LOCAL-'+run,'identity_evidence':reason,'reason':reason})
registry({'operation':'institution.approve','target':A,'expected':'2','initial_representative_reference':reason,'mandate_evidence':reason,'reason':reason})
source=registry({'operation':'source.register','institution':A,'expected':'3','namespace':'local-shot1-'+run,'channel':'INSTITUTION','adapter_version':'fixture-v1','reason':reason})['id']
def command(op,i=A,expected='0',**extra):return {'operation':op,'institution':i,'expected':str(expected),'reason':reason,**extra}
def authcmd(c,role='owner',request=None):return rpc('remate_authority_command',c,role,request)
for who,op in [('admin','administrator.appoint'),('representative','representative.activate'),('revoked','representative.activate')]:
 st,v,_=authcmd(command(op,target=creds[who]['id'],mandate_evidence=reason));check('Owner appoint '+who,st==200 and v.get('ok'))
for who in ['representative','revoked']:
 st,v,_=authcmd(command('permission.grant',expected='1',target=creds[who]['id'],permission='drafts.create'));check('explicit draft permission '+who,st==200)
st,v,_=authcmd(command('representative.revoke',expected='2',target=creds['revoked']['id']));check('representative revoked',st==200)
# Stale expected revision reaches REST immediately and creates no receipt.
staleid=str(uuid.uuid4());st,v,t=authcmd(command('permission.revoke',expected='1',target=creds['representative']['id'],permission='drafts.create'),request=staleid);check('PT409 stale revision returns HTTP409 without retry',st==409 and v.get('code')=='PT409' and t<3,{'seconds':round(t,3)});check('stale command has no receipt',sql("SELECT count(*) FROM twuanis_remates_private.command_receipts WHERE request_id='"+staleid+"';")=='0')
# Two real requests share expected revision. Lock then revision means exactly one winner.
cs=[command('permission.grant',expected='2',target=creds['representative']['id'],permission=p) for p in ['drafts.edit','audit.read']];ids=[str(uuid.uuid4()),str(uuid.uuid4())]
with concurrent.futures.ThreadPoolExecutor(2) as pool:
 out=list(pool.map(lambda x:authcmd(cs[x],request=ids[x]),[0,1]))
check('concurrent winner/loser HTTP200/409',sorted(o[0] for o in out)==[200,409],{'statuses':[o[0] for o in out],'seconds':[round(o[2],3) for o in out]});winner=next(i for i,x in enumerate(out) if x[0]==200);loser=1-winner
st,v,t=authcmd(cs[winner],request=ids[winner]);check('identical replay preserves original event',st==200 and v['replayed'] and v['eventId']==out[winner][1]['eventId'])
st,v,_=authcmd({**cs[winner],'reason':reason+' conflict'},request=ids[winner]);check('conflicting receipt payload denied',st==400 and v.get('code')=='22023')
check('only concurrent winner receipt exists',sql("SELECT count(*) FROM twuanis_remates_private.command_receipts WHERE request_id IN('"+"','".join(ids)+"');")=='1')
# Restore/suspend/reject real Owner commands and denial boundaries.
suspend=command('institution.suspend',expected='3');st,v,_=authcmd(suspend);check('Owner suspends institution',st==200 and v['revision']=='4')
for role in ['admin','representative','customer']:
 st,v,_=authcmd(command('institution.restore',expected='4'),role);check(role+' cannot restore',st==403)
restore=command('institution.restore',expected='4');rid=str(uuid.uuid4());st,v,_=authcmd(restore,request=rid);check('Owner restores institution',st==200 and v['revision']=='5');event=v['eventId']
st,v,_=authcmd(restore,request=rid);check('restore idempotent',st==200 and v['replayed'] and v['eventId']==event)
st,v,_=authcmd({**restore,'reason':reason+' changed'},request=rid);check('restore conflicting replay denied',st==400)
st,v,t=authcmd(restore);check('restore stale fails promptly',st==409 and v['code']=='PT409' and t<3)
check('restoration does not revive revoked representative',sql("SELECT active FROM twuanis_remates_private.memberships WHERE institution_id='"+A+"' AND principal_id='"+creds['revoked']['id']+"';")=='f')
st,v,_=call('/rest/v1/rpc/remate_authority_read',{'p_query':{'mode':'sources','institution':A}},tokens['revoked']);check('revoked signed session still denied after restore',st==403)
check('restoration does not enable sources or create published listings',sql("SELECT NOT EXISTS(SELECT 1 FROM twuanis_remates_private.sources WHERE enabled) AND NOT EXISTS(SELECT 1 FROM twuanis_remates_private.listings WHERE state='PUBLISHED');")=='t')
reject=command('institution.reject',i=B,expected='1',review_evidence=reason);rejid=str(uuid.uuid4())
for role in ['admin','customer']:
 st,v,_=authcmd(reject,role);check(role+' cannot reject initial application',st==403)
st,v,_=authcmd({k:x for k,x in reject.items() if k!='review_evidence'});check('rejection requires explicit reviewed evidence',st==400)
st,v,_=authcmd(reject,request=rejid);check('initial rejection Owner succeeds',st==200 and v['revision']=='2');rejevent=v['eventId']
st,v,_=authcmd(reject,request=rejid);check('initial rejection identical replay',st==200 and v['replayed'] and v['eventId']==rejevent)
st,v,_=authcmd(command('institution.restore',i=B,expected='2'));check('rejected unapproved institution cannot restore',st>=400)
st,v,_=authcmd(command('institution.reject',expected='5',review_evidence=reason));check('approved institution cannot use initial rejection',st>=400)
check('rejection immutable review evidence',sql("SELECT after_state->>'review_evidence'="+"'"+reason+"' FROM twuanis_remates_private.authority_events WHERE id='"+rejevent+"';")=='t')
# Independent saved/registry/operations conflict mappings use installed actual functions.
st,v,_=rpc('remate_saved_command',{'operation':'search.create','expected':'0','data':{'name':'LOCAL SHOT1','language':'es','definition':{}}},role='customer');check('independent saved search creation',st==200);sid=v['id']
st,v,t=rpc('remate_saved_command',{'operation':'search.remove','expected':'99','data':{'id':sid}},role='customer');check('saved conflict promptly409',st==409 and v['code']=='PT409' and t<3)
st,v,t=rpc('remate_registry_command',{'operation':'source.register','institution':A,'expected':'1','namespace':'unused-'+run,'channel':'INSTITUTION','adapter_version':'fixture','reason':reason});check('registry conflict promptly409',st==409 and v['code']=='PT409' and t<3)
st,v,t=rpc('remate_operations_command',command('source.configure',expected='99',source=source,data={'state':'REVIEW_READY'}));check('operational conflict promptly409',st==409 and v['code']=='PT409' and t<3)
# Schema, permissions, immutable guards and genuine serialization semantics.
check('all explicit Remates40001 raises removed',sql("SELECT NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname LIKE 'remate%command' AND pg_get_functiondef(p.oid) LIKE '%''40001''%');")=='t')
check('canonical function ACL security preserved',sql("SELECT bool_and(p.prosecdef AND pg_get_userbyid(p.proowner)='postgres' AND p.proconfig @> ARRAY['search_path=pg_catalog'] AND NOT has_function_privilege('anon',p.oid,'EXECUTE')) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname LIKE 'remate%command';")=='t')
check('audit receipt actor/institution linkage intact',sql("SELECT NOT EXISTS(SELECT 1 FROM twuanis_remates_private.authority_events e JOIN twuanis_remates_private.command_receipts c ON c.id=e.receipt_id WHERE e.actor_id<>c.actor_id OR e.institution_id::text<>c.command->>'institution');")=='t')
check('ordinary population untouched',sql('SELECT count(*) FROM public.listings;')=='0')
check('Owner count exactly one local synthetic',sql('SELECT count(*) FROM twuanis_canonical_private.owner_access_grants WHERE revoked_at IS NULL;')=='1')
check('private runtime mutation grants denied',sql("SELECT NOT EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='twuanis_remates_private' AND c.relkind='r' AND (has_table_privilege('authenticated',c.oid,'INSERT,UPDATE,DELETE,TRUNCATE') OR has_table_privilege('anon',c.oid,'INSERT,UPDATE,DELETE,TRUNCATE')));")=='t')
# Local actual SERIALIZABLE conflict, independent of manually-raised application codes.
sql('CREATE TABLE public.shot1_serialization_fixture(id int PRIMARY KEY,value int); INSERT INTO public.shot1_serialization_fixture VALUES(1,0);')
def serialization(_):
 q='BEGIN ISOLATION LEVEL SERIALIZABLE; SELECT value FROM public.shot1_serialization_fixture WHERE id=1; SELECT pg_sleep(0.4); UPDATE public.shot1_serialization_fixture SET value=value+1 WHERE id=1; COMMIT;'
 p=subprocess.run([D,'exec','-i',N,'psql','-X','-At','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose','-U','postgres','-d','postgres'],input=q.encode(),capture_output=True);return p.returncode,p.stderr.decode()
with concurrent.futures.ThreadPoolExecutor(2) as pool:out=list(pool.map(serialization,[0,1]))
check('genuine serialization40001 remains unchanged',sum(c==0 for c,_ in out)==1 and any('40001' in e for _,e in out));sql('DROP TABLE public.shot1_serialization_fixture;')
# Local-only review aftermath for browser workflow and session revocation test.
path=pathlib.Path('/private/tmp/shot1-local-fixtures.private.json');path.write_text(json.dumps({'accounts':creds,'institutions':{'A':A,'B':B},'source':source,'run':run}));path.chmod(0o600)
(ROOT/'outputs/remates/staging/shot1-local-integration-results.json').write_text(json.dumps({'status':'PASS','target':'disposable-local 127.0.0.1:54321 / 54322','checks':len(results),'results':results},indent=2));print('REAL LOCAL SUPABASE PASS',len(results))
