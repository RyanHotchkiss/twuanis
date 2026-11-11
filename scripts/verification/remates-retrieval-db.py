"""Explicitly disposable LOCAL Auth/RPC acceptance; never targets cloud projects."""
import json,uuid,datetime,pathlib,concurrent.futures,argparse,urllib.request,urllib.error
parser=argparse.ArgumentParser();parser.add_argument('--fixtures',required=True,type=pathlib.Path);parser.add_argument('--status',required=True,type=pathlib.Path);args=parser.parse_args()
assert args.fixtures.stat().st_mode&0o777==0o600,'private local fixture credentials required'
J=json.loads(args.status.read_text());F=json.loads(args.fixtures.read_text());assert J['API_URL']=='http://127.0.0.1:54321';tokens={}
def call(path,data,role='owner'):
 req=urllib.request.Request(J['API_URL']+path,data=json.dumps(data).encode(),headers={'apikey':J['ANON_KEY'],'Authorization':'Bearer '+tokens.get(role,J['ANON_KEY']),'Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=12) as response:return response.status,json.load(response)
 except urllib.error.HTTPError as error:return error.code,json.load(error)
def login(role):
 account=F['accounts'][role];assert account['email'].endswith('@example.invalid');status,result=call('/auth/v1/token?grant_type=password',{'email':account['email'],'password':account['password']},role);assert status==200;assert result['user']['id']==account['id'];tokens[role]=result['access_token']
def rpc(fn,command,role='owner',req=None):return call('/rest/v1/rpc/'+fn,{'p_request':req or str(uuid.uuid4()),'p_command':command},role)
import subprocess,os,json,pathlib
D='/Applications/Docker.app/Contents/Resources/bin/docker';N='supabase_db_twuanis-disposable-rehearsal';E={k:v for k,v in os.environ.items() if not k.startswith('PG') and k not in ('DATABASE_URL','SUPABASE_ACCESS_TOKEN','SUPABASE_DB_PASSWORD')};E['DOCKER_HOST']='unix:///Users/cassidydaddy/.docker/run/docker.sock'
def sql(q):
 j=json.loads(subprocess.check_output([D,'inspect',N],env=E))[0];assert j['Name']=='/'+N and j['State']['Running'];assert j['NetworkSettings']['Ports']['5432/tcp']==[{'HostIp':'127.0.0.1','HostPort':'54322'}]
 p=subprocess.run([D,'exec','-i',N,'psql','-X','-At','-v','ON_ERROR_STOP=1','-U','postgres','-d','postgres'],input=q,text=True,capture_output=True,env=E)
 if p.returncode:raise RuntimeError(p.stderr[-1800:])
 return p.stdout.strip()

h={'sql':sql,'call':call,'rpc':rpc,'F':F,'I':F['institutions']['A']};s=sql;login('owner');login('customer');login('representative');login('admin');checks=[];evidence={};I=h['I'];worker=h['F']['accounts']['customer']['id'];source_ids=[]
def check(name,value):
 assert value,name
 checks.append(name)
def rpc(name,body,role='owner'):return call('/rest/v1/rpc/'+name,body,role)
def ok(name,result):
 st,v=result;assert st==200 and v.get('ok'),(name,st,v);checks.append(name);return v
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def configure(source,configuration,expected=0,request=None,role='owner'):
 return rpc('remate_retrieval_configure',{'p_request':request or str(uuid.uuid4()),'p_source':source,'p_expected':expected,'p_configuration':configuration,'p_reason':'Approved SYNTHETIC LOCAL transport only; NEVER bank contact'},role)
def cmd(source,op,data={},request=None,role='customer'):return rpc('remate_retrieval_worker',{'p_request':request or str(uuid.uuid4()),'p_source':source,'p_operation':op,'p_data':data},role)
# Capture untouched financial/publication/ordinary populations, canonical evidence function and permissions.
snapshot="SELECT jsonb_build_object('ordinary',(SELECT md5(coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.id)::text,'')) FROM public.listings x),'finance',(SELECT md5(coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.id)::text,'')) FROM twuanis_remates_private.financial_values x),'publication',(SELECT md5(coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.id)::text,'')) FROM twuanis_remates_private.publication_events x),'evidenceFn',md5(pg_get_functiondef('public.remate_evidence_command(uuid,jsonb)'::regprocedure)));"
before=s(snapshot)
for host,adapter,path in [('ventadebienes.bncr.fi.cr','bn','/synthetic-local-only'),('ventadebienes.bancobcr.com','bcr','/wps/portal/bcrb/bcrbienes/bienes/propiedades/detalle?codigo=123'),('srv.bancopopular.fi.cr','bp-inventory','/Wb_BA_SharepointU/Propiedad/DetallePropiedad?codBien=123')]:
 rev=s("SELECT revision FROM twuanis_remates_private.institutions WHERE id='"+I+"';")
 src=ok('canonical source '+adapter,h['rpc']('remate_registry_command',{'operation':'source.register','institution':I,'expected':rev,'namespace':'retrieval-local-'+str(uuid.uuid4()),'channel':'BANK_WEB','origin':'https://'+host,'adapter_version':'remates-'+adapter+'-fixture-v1','reason':'SYNTHETIC LOCAL adapter regression, never bank authorization'}))['id'];source_ids.append(src)
 ok('source review '+adapter,h['rpc']('remate_operations_command',{'operation':'source.configure','institution':I,'source':src,'expected':'0','reason':'SYNTHETIC LOCAL review','data':{'state':'REVIEW_READY'}}))
 ok('source lifecycle policy '+adapter,h['rpc']('remate_ingestion_command',{'operation':'policy.record','institution':I,'source':src,'expected':'1','reason':'SYNTHETIC LOCAL ONLY reviewed test policy','lifecycle':{'expected':'0','fresh_seconds':'86400','archive_seconds':'604800','absent_runs':'2','coverage_key':'SYNTHETIC LOCAL ONLY','unconfirmed_visibility':'HIDE','suspended_visibility':'HIDE','reviewed':True}}))
 cfg={'worker':worker,'adapter':adapter,'urls':['https://'+host+path],'cadence':300,'authorization':'SYNTHETIC MOCK TRANSPORT ONLY; no real bank requests','expires':(datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(hours=1)).isoformat(),'enabled':True};request=str(uuid.uuid4())
 if not evidence:
  check('ordinary customer configure denied',configure(src,cfg,role='customer')[0]==403)
  check('institution representative configure denied',configure(src,cfg,role='representative')[0]==403)
  check('ordinary Administrator configure denied',configure(src,cfg,role='admin')[0]==403)
  check('unknown source configure denied',configure(str(uuid.uuid4()),cfg)[0]==403)
  check('unsafe URL configure denied',configure(src,{**cfg,'urls':['https://127.0.0.1/']})[0]==400)
  check('adapter mismatch denied',configure(src,{**cfg,'adapter':'bac'})[0]==400)
 c=ok('Owner config '+adapter,configure(src,cfg,request=request));ok('identical config replay '+adapter,configure(src,cfg,request=request));check('changed config replay denied '+adapter,configure(src,{**cfg,'cadence':600},request=request)[0]==409);check('stale config denied '+adapter,configure(src,cfg)[0]==409)
 evidence[src]={'configuration':cfg,'receipt':c}
# Two simultaneous claims: exactly one winner for a single source.
a=source_ids[0]
with concurrent.futures.ThreadPoolExecutor(2) as pool:res=list(pool.map(lambda _:cmd(a,'claim'),range(2)))
check('concurrent source claim one winner one conflict',sorted(x[0] for x in res)==[200,409]);claim=next(x[1] for x in res if x[0]==200);lease=claim['lease'];evidence[a]['lease']=lease
ok('claim exact replay',cmd(a,'claim',request=lease));ok('fresh worker check',cmd(a,'check',{'lease':lease}));check('different worker denied',cmd(a,'check',{'lease':lease},role='representative')[0]==403)
bclaim=ok('second lease within global budget',cmd(source_ids[1],'claim'));check('third concurrent lease denied',cmd(source_ids[2],'claim')[0]==409)
# Canonical retained run and observation; this is synthetic fixture evidence, never provenance for bank data.
time=now();run={'key':lease,'started_at':time,'ended_at':time,'outcome':'PARTIAL','scope':'SAMPLE','pages':[{'key':'synthetic-sha256-abc','status':'RETAINED'}]};obs={'key':str(uuid.uuid4()),'record_key':'code:SYNTHETIC-LOCAL-1','run':lease,'retrieved_at':time,'published_at':None,'updated_at':None,'url':evidence[a]['configuration']['urls'][0],'parser_version':'remates-bn-fixture-v1','parse_status':'PARSED','raw':'SYNTHETIC LOCAL ONLY Banco Nacional fixture, never retrieved','fields':[{'path':'bank.code','ordinal':0,'label':'Código','raw':'SYNTHETIC-LOCAL-1','validation':'VALID'}]};data={'lease':lease,'run':run,'observations':[obs],'diagnostics':[]};req=str(uuid.uuid4())
check('complete-run escalation denied',cmd(a,'retain',{**data,'run':{**run,'outcome':'COMPLETE','scope':'FULL'}})[0]==400)
check('unapproved observation URL denied',cmd(a,'retain',{**data,'observations':[{**obs,'url':'https://ventadebienes.bncr.fi.cr/not-approved'}]})[0]==400)
check('invalid parser version denied',cmd(a,'retain',{**data,'observations':[{**obs,'parser_version':'unapproved'}]})[0]==400)
ret=ok('canonical SAMPLE run and observation retained',cmd(a,'retain',data,req));replay=ok('exact retention replay',cmd(a,'retain',data,req));check('same receipt on replay',ret['receiptId']==replay['receiptId']);check('changed retention replay denied',cmd(a,'retain',{**data,'diagnostics':['CHANGED']},req)[0]==409)
check('one run and one observation',s("SELECT count(*) FROM twuanis_remates_private.observations WHERE run_id='"+ret['runId']+"';")=='1');check('worker recorded as actual actor',s("SELECT actor_id FROM twuanis_remates_private.source_runs WHERE id='"+ret['runId']+"';")==worker)
check('completed lease cannot recheck',cmd(a,'check',{'lease':lease})[0]==403);check('cadence cannot be bypassed',cmd(a,'claim')[0]==409)
check('private worker core cannot be called',rpc('retrieval_retain_evidence',{},role='customer')[0]!=200)
check('worker lacks ordinary institutional ingestion authority',h['rpc']('remate_evidence_command',{'operation':'run.retain','institution':I,'source':a,'expected':'1','reason':'Escalation attempt','evidence':run},role='customer')[0]==403)
# Operational stop: canonical command invalidates existing worker lease and review cannot silently restart it.
b=source_ids[1];bl=bclaim['lease'];ok('canonical emergency source stop',h['rpc']('remate_operations_command',{'operation':'source.stop','institution':I,'source':b,'expected':'1','reason':'SYNTHETIC LOCAL emergency stop','data':{}}));check('stopped worker immediately denied',cmd(b,'check',{'lease':bl})[0]==403)
ok('review ready after stop',h['rpc']('remate_operations_command',{'operation':'source.configure','institution':I,'source':b,'expected':'2','reason':'SYNTHETIC LOCAL return to review, no automatic retrieval','data':{'state':'REVIEW_READY'}}));check('review does not reactivate old configuration',cmd(b,'check',{'lease':bl})[0]==403)
# Canonical suspension/restoration invalidates config generation; no automatic source restart.
irev=s("SELECT revision FROM twuanis_remates_private.institutions WHERE id='"+I+"';")
def authority(op,rev):return h['rpc']('remate_authority_command',{'operation':op,'institution':I,'expected':rev,'reason':'SYNTHETIC disposable LOCAL retrieval authority boundary'})
ok('canonical institution suspend',authority('institution.suspend',irev));check('suspended institution denies worker',cmd(a,'claim')[0]==403);ok('canonical institution restoration',authority('institution.restore',str(int(irev)+1)));check('restoration does not reactivate worker',cmd(a,'claim')[0]==403)
check('ordinary populations financial publication and public evidence unchanged',before==s(snapshot))
check('new private tables deny authenticated grants',s("SELECT count(*) FROM information_schema.role_table_grants WHERE table_schema='twuanis_remates_private' AND table_name LIKE 'retrieval_%' AND grantee IN('authenticated','anon','service_role');")=='0')
check('no PUBLIC execution on private helper',s("SELECT coalesce(has_function_privilege('authenticated','twuanis_remates_private.retrieval_retain_evidence(uuid,jsonb,uuid)','EXECUTE'),false);")=='f')
# Rollback-only effective operator immutability probe, no historical alteration.
for mutation in ['UPDATE twuanis_remates_private.retrieval_events SET revision=revision','DELETE FROM twuanis_remates_private.retrieval_events','TRUNCATE twuanis_remates_private.retrieval_events']:
 try:s('BEGIN;'+mutation+';ROLLBACK;');raise AssertionError('immutable audit bypass')
 except RuntimeError as e:check('immutable audit '+mutation.split()[0],'immutable' in str(e))
(pathlib.Path(__file__).resolve().parents[2]/'outputs/remates/release-readiness/database-results.json').write_text(json.dumps({'checks':checks,'sources':evidence,'retention':ret,'localOnly':True,'noBankRequests':True},indent=2));print('PASS',len(checks),'genuine local Auth/REST security checks')
