from pathlib import Path
import json,hashlib,psycopg2
P=Path('/private/tmp/twuanis-orch-final-01');base=json.load(open(P/'baseline-functions.json'));c=psycopg2.connect('postgresql://supabase_admin:postgres@127.0.0.1:54322/twuanis_orch_final_01');q=c.cursor();diffs=[]
for sig,definition,owner,acl in base:
 q.execute('select pg_get_functiondef(p.oid),pg_get_userbyid(p.proowner),p.proacl::text from pg_proc p where p.oid=%s::regprocedure',(sig,));new,o,a=q.fetchone()
 if (new,o,a)!=(definition,owner,acl):diffs.append({'signature':sig,'bodyChanged':new!=definition,'ownerChanged':o!=owner,'aclChanged':a!=acl,'beforeHash':hashlib.sha256(definition.encode()).hexdigest(),'afterHash':hashlib.sha256(new.encode()).hexdigest()})
c.close();expected={'orchestrator_execution_claim(jsonb,uuid,uuid,text,text,jsonb,uuid)','twuanis_remates_private.classification_minimum_valid(uuid)','twuanis_canonical_private.evidence_v2_validate(jsonb,uuid,uuid,uuid)'};print(json.dumps(diffs,indent=2));assert {x['signature']for x in diffs}==expected;assert all(not x['ownerChanged']and not x['aclChanged']for x in diffs);(P/'database-function-preservation.json').write_text(json.dumps({'checked':len(base),'changed':diffs,'allOtherDefinitionsOwnersPermissionsUnchanged':True},indent=2))
def mathematical(e):
 return {k:({j:w for j,w in v.items()if j!='cacheIdentity'}if k=='result'and isinstance(v,dict)else v)for k,v in e.items()if k!='durationMs'}
checks=[]
for d in (P/'paired').iterdir():
 before=Path('/private/tmp/twuanis-orch-acq-02/paired')/d.name/'after/live-report.json';after=d/'after/live-report.json'
 if not(before.exists()and after.exists()):continue
 b=json.load(open(before));a=json.load(open(after))
 for e in b['engines']:
  now=next(x for x in a['engines']if x['id']==e['id']);lhs=mathematical(e);rhs=mathematical(now);checks.append({'scenario':d.name,'engine':e['id'],'sameMathAndState':lhs==rhs,'sameCacheIdentity':e.get('result',{}).get('cacheIdentity')==now.get('result',{}).get('cacheIdentity')})
(P/'engine-equality.json').write_text(json.dumps(checks,indent=2));print('Definitions',len(base),'only reviewed three changed; exact engine outputs',sum(x['sameMathAndState']for x in checks),'/',len(checks),'cache identities',sum(x['sameCacheIdentity']for x in checks))
