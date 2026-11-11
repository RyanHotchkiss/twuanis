"""LOCAL ONLY: reuse established disposable fixture; never connects to production."""
from pathlib import Path
root=Path('/Users/cassidydaddy/twuanis')
source=(root/'scripts/verification/remates-r08-db.py').read_text()
addition=r'''
 r09_start=len(results);r09_before=snap();r09_property_count=sql('SELECT count(*) FROM twuanis_remates_private.properties');r09_offering_count=sql('SELECT count(*) FROM twuanis_remates_private.offerings');migration('070');results.append('070 exact additive source reader installs')
 sc9=cmd(dict(sreg,institution=ic,expected=sql("SELECT revision FROM twuanis_remates_private.institutions WHERE id='"+ic+"'"),namespace='r09.bcr.fixture',origin='https://ventadebienes.bancobcr.com',adapter_version='remates-bcr-fixture-v1'))['id']
 def ar9(who=user,source=sc9,institution=ic):return scoped("SELECT public.remate_adapter_source_read('"+institution+"','"+source+"');",who)
 meta=json.loads(sql(ar9()).splitlines()[-1]);assert meta==dict(id=sc9,revision='1',origin_host='ventadebienes.bancobcr.com',adapter_version='remates-bcr-fixture-v1',enabled=False);results.append('canonical registered adapter identity/revision/origin; source remains disabled')
 reject('ordinary customer cannot read source configuration',ar9(customer_user),'42501')
 reject('cross-institution source reader denied',ar9(member,source=sc9,institution=ib),'42501')
 for runtime in ['anon','service_role']:reject('adapter reader RPC denial '+runtime,role("SELECT public.remate_adapter_source_read('"+ic+"','"+sc9+"');",runtime),'42501')
 check('070 fixed postgres security definer/search path/execution',"SELECT proowner='postgres'::regrole AND prosecdef AND proconfig @> ARRAY['search_path=pg_catalog'] AND has_function_privilege('authenticated',oid,'EXECUTE') AND NOT EXISTS(SELECT 1 FROM aclexplode(proacl) WHERE grantee=0) FROM pg_proc WHERE oid='public.remate_adapter_source_read(uuid,uuid)'::regprocedure")
 # Actual parser output only, projected through existing R04 immutable evidence authority.
 parsed=json.loads(Path('/private/tmp/remates-r09-observation.json').read_text())
 rc=dict(operation='run.retain',institution=ic,source=sc9,expected='1',reason='Reconstructed authorized local adapter fixture; no bank retrieval',evidence=dict(run_body,key='r09-run',started_at='2026-10-09T11:59:00Z',ended_at='2026-10-09T12:01:00Z',outcome='PARTIAL',scope='SAMPLE reconstructed fixture only',pages=[dict(key='r09-page-1',status='RETAINED')]))
 rr=json.loads(sql(ec(rc)).splitlines()[-1]);parsed['run']=rr['id']
 pc=dict(operation='observation.retain',institution=ic,source=sc9,expected='1',reason='Reconstructed fixture evidence only',evidence=parsed)
 r9=json.loads(sql(ec(pc)).splitlines()[-1]);results.append('actual adapter draft accepted by canonical R04 evidence contract')
 check('R09 raw hash exact after retention',"SELECT content_sha256="+lit(hashlib.sha256(parsed['raw'].encode()).hexdigest())+" AND raw_text="+lit(parsed['raw'])+" FROM twuanis_remates_private.observations WHERE id='"+r9['id']+"'")
 check('original monetary labels and raw amounts preserved',"SELECT count(*)=1 FROM twuanis_remates_private.observation_fields WHERE observation_id='"+r9['id']+"' AND label='Precio de venta final' AND raw_value='CRC 47,141,250'")
 check('source timestamps remain null',"SELECT published_at IS NULL AND updated_at IS NULL FROM twuanis_remates_private.observations WHERE id='"+r9['id']+"'")
 assert json.loads(sql(ec(pc)).splitlines()[-1])['id']==r9['id'];results.append('exact duplicate parser evidence reuses immutable observation')
 changed=dict(pc,evidence=dict(parsed,raw=parsed['raw']+' changed'));reject('changed parser evidence under same key conflicts',ec(changed),'22023')
 reject('different source cannot reuse original URL',ec(dict(pc,source=sc,evidence=dict(parsed,key='r09-foreign'))),'42501')
 # Concurrent adapter retries cannot create duplicate observations or canonical identities.
 concurrent=dict(pc,evidence=dict(parsed,key='r09-concurrent'))
 ps=[subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env) for _ in range(2)]
 for p in ps:p.stdin.write(ec(concurrent));p.stdin.close();p.stdin=None
 outs=[p.communicate(timeout=15) for p in ps];assert all(p.returncode==0 for p in ps),outs
 ids=[json.loads(out.splitlines()[-1])['id'] for out,err in outs];assert ids[0]==ids[1];results.append('two independent adapter retries preserve one observation')
 contested=[dict(pc,evidence=dict(parsed,key='r09-conflicting-concurrent',raw=parsed['raw']+suffix)) for suffix in [' one',' two']]
 ps=[subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env) for _ in range(2)]
 for proc,c in zip(ps,contested):proc.stdin.write(ec(c));proc.stdin.close();proc.stdin=None
 outs=[proc.communicate(timeout=15) for proc in ps];assert sum(proc.returncode==0 for proc in ps)==1 and any('22023' in err for out,err in outs);results.append('independent conflicting adapter observation race has one winner; history not overwritten')
 check('no duplicate adapter observations',"SELECT count(*)=1 FROM twuanis_remates_private.observations WHERE source_id='"+sc9+"' AND observation_key='r09-concurrent'")
 assert sql('SELECT count(*) FROM twuanis_remates_private.properties')==r09_property_count and sql('SELECT count(*) FROM twuanis_remates_private.offerings')==r09_offering_count;results.append('no canonical property/offering identities created by adapter retention')
 check('no source enabled by parser/configuration reader',"SELECT NOT enabled FROM twuanis_remates_private.sources WHERE id='"+sc9+"'")
 assert snap()==r09_before;results.append('ten ordinary population/reference/warm-cache snapshots unchanged across R09')
 print('R09',len(results)-r09_start,'focused DB checks PASS',flush=True)
'''
# Preserve prior reports. This wrapper executes their fixture construction plus the new focused integration.
source=source.replace(" report={'status':'PASS'",addition+" report={'status':'PASS'",1)
source=source.replace("R-08-db-results.json","R-09-db-results.json").replace("report={'status':'PASS','assertions':len(results)","report={'status':'PASS','r09Assertions':len(results)-r09_start,'priorRegressionAssertions':r09_start,'assertions':len(results)")
exec(compile(source,str(root/'scripts/verification/remates-r08-db.py'),'exec'))
