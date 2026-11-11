import json,pathlib,subprocess,urllib.request,urllib.error,time,uuid,concurrent.futures
R=pathlib.Path('/Users/cassidydaddy/twuanis');D='/Applications/Docker.app/Contents/Resources/bin/docker';N='supabase_db_twuanis-disposable-rehearsal';F=json.loads(pathlib.Path('/private/tmp/shot1-local-fixtures.private.json').read_text());J=json.loads(pathlib.Path('/private/tmp/shot1-local-status.json').read_text());assert J['API_URL']=='http://127.0.0.1:54321';out=[]
def sql(q):
 a=json.loads(subprocess.check_output([D,'inspect',N]))[0];assert a['NetworkSettings']['Ports']['5432/tcp']==[{'HostIp':'127.0.0.1','HostPort':'54322'}];r=subprocess.run([D,'exec','-i',N,'psql','-X','-At','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose','-U','postgres','-d','postgres'],input=q.encode(),capture_output=True);return r.returncode,r.stdout.decode(),r.stderr.decode()
def call(path,b=None,token=None):
 h={'apikey':J['ANON_KEY'],'Authorization':'Bearer '+(token or J['ANON_KEY']),'Content-Type':'application/json'};r=urllib.request.Request(J['API_URL']+path,headers=h,data=json.dumps(b).encode() if b is not None else None)
 try:
  with urllib.request.urlopen(r,timeout=8) as p:return p.status,json.loads(p.read() or '{}')
 except urllib.error.HTTPError as p:return p.code,json.loads(p.read() or '{}')
def ck(n,v):out.append({'name':n,'status':'PASS' if v else 'FAIL'});assert v,n
# Migration rejects replay/definition drift atomically. No reinstallation, no state changes.
content=(R/'supabase/migrations/078_remates_revision_conflicts_and_institution_review.sql').read_text();rc,a,e=sql(content);ck('forward migration refuses already-installed/drifted definition',rc!=0 and 'reviewed definition drift' in e)
manifest=json.loads(pathlib.Path('/private/tmp/shot1-function-manifest.json').read_text());rc,a,e=sql("SELECT json_build_object('name',p.proname,'acl',p.proacl::text,'owner',pg_get_userbyid(p.proowner),'definition',pg_get_functiondef(p.oid)) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname LIKE 'remate%';");rows=[json.loads(x) for x in a.splitlines() if x.startswith('{')];d={r['name']:r for r in rows}
for m in manifest:ck('preserved owner/ACL '+m['function'],d[m['function']]['owner']==m['owner'] and d[m['function']]['acl']==m['acl'])
# Immutable history cannot be changed or removed by operator attempts either.
for table in ['command_receipts','authority_events']:
 for op in ['UPDATE','DELETE']:
  q="BEGIN; "+("UPDATE twuanis_remates_private."+table+" SET "+('result=result' if table=='command_receipts' else 'reason=reason') if op=='UPDATE' else 'DELETE FROM twuanis_remates_private.'+table)+" WHERE id=(SELECT id FROM twuanis_remates_private."+table+" LIMIT 1); ROLLBACK;"
  rc,a,e=sql(q);ck('immutable '+table+' '+op+' denied',rc!=0)
# Existing signed Auth session is required for Owner restoration as well.
rep=F['accounts']['customer'];st,v=call('/auth/v1/token?grant_type=password',{'email':rep['email'],'password':rep['password']});ck('real customer session for live-account denial',st==200);token=v['access_token'];st,v=call('/auth/v1/logout',{},token);ck('real customer logout',st in [200,204]);st,v=call('/rest/v1/rpc/remate_authority_command',{'p_request':str(uuid.uuid4()),'p_command':{'operation':'institution.restore','institution':F['institutions']['A'],'expected':'5','reason':'Synthetic local negative'}},token);ck('logged-out token cannot mutate authority',st==403)
(R/'outputs/remates/staging/shot1-local-security-results.json').write_text(json.dumps({'status':'PASS','checks':len(out),'results':out},indent=2));print('LOCAL SECURITY PASS',len(out))
