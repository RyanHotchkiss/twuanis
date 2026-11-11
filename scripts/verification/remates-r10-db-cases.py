 # Authorized disposable R10 cases only; no production/source network.
 r10_start=len(results);r10_before=snap();migration('071');results.append('071 exact forward locator installs with R04 definition guard');migration('072');results.append('072 exact lifecycle installs')
 def lc(op,body,req=None,who=user,source=None,institution=None):return scoped('SELECT public.remate_ingestion_command('+lit(req or ident())+','+js(dict(operation=op,institution=institution or ic,source=source or sc,expected='1',reason='Explicit disposable R10 evidence review',lifecycle=body))+');',who)
 def la(op,body,req=None,who=user,source=None,institution=None):return json.loads(sql(lc(op,body,req,who,source,institution)).splitlines()[-1])
 def lr(mode='readiness',who=user):return json.loads(sql(scoped('SELECT public.remate_ingestion_read('+js(dict(institution=ic,source=sc,mode=mode))+');',who)).splitlines()[-1])
 # Locator contract: exact supported parameters retained. No source origin inferred.
 bcrurl='https://ventadebienes.bancobcr.com/wps/portal/bcrb/bcrbienes/bienes/Casas/detalle/?codigo=2-480182-000&descuento=1&tipo_propiedad=1'
 def loc(sid,url):return "SELECT twuanis_remates_private.valid_evidence_locator('"+sid+"',"+lit(url)+")"
 check('BCR query locator preserves permitted identity',loc(sc9,bcrurl));
 for url in [bcrurl+'&token=secret',bcrurl+'&codigo=2',bcrurl.replace('codigo=2-480182-000','codigo=https%3A%2F%2F127.0.0.1'),bcrurl+'#x',bcrurl.replace('https://','http://'),bcrurl.replace('ventadebienes.bancobcr.com','127.0.0.1'),bcrurl.replace('Casas/detalle/','inicio/'),bcrurl+'\\x']:
  check('unsafe/unknown/duplicate/query locator denied '+url,loc(sc9,url),'f')
 # Retain original query URL without rewriting it.
 qr=dict(parsed,key='r10-query-original',url=bcrurl);qres=json.loads(sql(ec(dict(pc,evidence=qr))).splitlines()[-1]);check('query identity retained byte-exact',"SELECT source_url="+lit(bcrurl)+" FROM twuanis_remates_private.observations WHERE id='"+qres['id']+"'")
 # New disabled local source with exact parser version; existing offering fixtures remain untouched.
 sc=cmd(dict(sreg,institution=ic,expected=sql("SELECT revision FROM twuanis_remates_private.institutions WHERE id='"+ic+"'"),namespace='r10.fixture',origin='https://r10.fixture.example',adapter_version='fixture-parser-v1'))['id']
 execute(change(member,'permission.grant',sql("SELECT revision FROM twuanis_remates_private.memberships WHERE institution_id='"+ic+"' AND principal_id='"+member+"'"),'inventory.import',institution=ic))
 def ts(q):return sql("SELECT to_char(("+q+") AT TIME ZONE 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.US\"Z\"')")
 now=ts('clock_timestamp()');earlier=ts("clock_timestamp()-interval '20 seconds'");later=ts("clock_timestamp()-interval '1 second'")
 run10=retain(evidence('run.retain',dict(run_body,key='r10-sample',started_at=earlier,ended_at=later,outcome='PARTIAL',scope='SAMPLE',pages=[dict(key='sample',status='RETAINED')])) )['id']
 base10=dict(obs_body,key='r10-record-first',record_key='r10-record',run=run10,retrieved_at=earlier,url='https://r10.fixture.example/property',parse_status='PARSED',raw='R10 raw property and price',fields=gfields+[dict(path='sale',ordinal=0,label='Published selling price',raw='USD 100',currency='USD',validation='VALID')])
 ob10=retain(evidence('observation.retain',base10))['id'];case10=icmd(proposal(ob10,[parcel('R06-PARCEL','parcel')]))['id']
 # Separate R10 property: use new parcel evidence instead of merging similar content.
 # Initial proposal above carries original R06 parcel and may require explicit MATCH_EXISTING review.
 # REJECT case when it conflicts, then use a new exact parcel assertion.
 if sql("SELECT conflict FROM twuanis_remates_private.identity_cases WHERE id='"+case10+"'")=='IDENTIFIER_CONFLICT':
  icmd(decide(case10,'REJECT'));base10['key']='r10-unique';base10['fields']=[dict(f,raw='R10-PARCEL') if f['path']=='parcel' else f for f in base10['fields']];ob10=retain(evidence('observation.retain',base10))['id'];case10=icmd(proposal(ob10,[parcel('R10-PARCEL','parcel')]))['id']
 off10=icmd(decide(case10))['offeringId'];pid10=sql("SELECT property_id FROM twuanis_remates_private.offering_properties WHERE offering_id='"+off10+"'");listing10=sql("SELECT id FROM twuanis_remates_private.listings WHERE offering_id='"+off10+"'")
 classification10=json.loads(sql(gq(gc(dict(body,property=pid10,expected_property='2',expected='0',observation=ob10)))).splitlines()[-1]);assert classification10['minimumReady'];results.append('R10 property uses current canonical geography and exact independent identity')
 ingest=dict(observation=ob10,offering=off10,binding_revision='1');ireq=ident();ir10=la('ingestion.record',ingest,ireq);assert la('ingestion.record',ingest,ireq)['id']==ir10['id'];assert la('ingestion.record',ingest)['id']==ir10['id'];results.append('ingestion exact/new-request retries retain one result')
 ps10=[subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env) for _ in range(2)]
 for proc in ps10:proc.stdin.write(lc('ingestion.record',ingest));proc.stdin.close();proc.stdin=None
 out10=[proc.communicate(timeout=15) for proc in ps10];assert all(proc.returncode==0 for proc in ps10);assert len({json.loads(out.splitlines()[-1])['id'] for out,err in out10})==1;results.append('independent-session ingestion retries have one immutable result')
 assert lr()['items'];results.append('bounded scoped lifecycle readiness reader connected')
 reject('no default source policy can publish',lc('publication.publish',dict(offering=off10,expected='1',reviewed=True)))
 policy=dict(expected='0',fresh_seconds='3600',archive_seconds='7200',absent_runs='2',coverage_key='COMPLETE LOCAL FIXTURE SOURCE',unconfirmed_visibility='HIDE',suspended_visibility='HIDE',reviewed=True)
 reject('representative cannot set source policy',lc('policy.record',policy,who=member),'42501')
 preq=ident();pol10=la('policy.record',policy,preq);assert la('policy.record',policy,preq)['id']==pol10['id'];results.append('explicit source policy immutable retry')
 reject('stale source policy revision',lc('policy.record',policy),'40001')
 reject('archive age cannot precede freshness',lc('policy.record',dict(policy,expected='1',archive_seconds='1')))
 reject('unknown generic thresholds/options denied',lc('policy.record',dict(policy,expected='1',unconfirmed_visibility='DEFAULT')))
 reject('unreviewed policy denied',lc('policy.record',dict(policy,expected='1',reviewed=False)),'22023')
 reject('no implicit finance approval at publication',lc('publication.publish',dict(offering=off10,expected='1',reviewed=True)))
 finbody=dict(offering=off10,observation=ob10,path='sale',ordinal=0,kind='SELLING_PRICE',status='VALID',amount='100',currency='USD',round=None)
 financial10=save(finbody)['id'];selected10=save(dict(offering=off10,expected='0',mechanism='DIRECT_SALE',value=financial10,reviewed=True),'financial.select')['id']
 publish=dict(offering=off10,expected='1',reviewed=True);pubreq=ident();pub10=la('publication.publish',publish,pubreq);assert la('publication.publish',publish,pubreq)['id']==pub10['id'];results.append('explicit eligible publication exactly once')
 check('one independent publication projection',"SELECT state='PUBLISHED' AND revision=2 FROM twuanis_remates_private.listings WHERE id='"+listing10+"'")
 check('private visibility readiness, no public activation',"SELECT twuanis_remates_private.publication_visibility('"+listing10+"')->'visible'='true'::jsonb AND twuanis_remates_private.publication_visibility('"+listing10+"')->'publicActivation'='false'::jsonb")
 # Explicit visibility policies are separate from authority, exercised only in disposable fixtures.
 la('policy.record',dict(policy,expected='1',fresh_seconds='1',archive_seconds='2',unconfirmed_visibility='LABELLED',suspended_visibility='LAST_VERIFIED'))
 check('stale source visibility explicitly labelled',"SELECT twuanis_remates_private.publication_visibility('"+listing10+"')->>'label'='SOURCE_UNCONFIRMED' AND twuanis_remates_private.publication_visibility('"+listing10+"')->'visible'='true'::jsonb")
 sql("UPDATE twuanis_remates_private.institutions SET participation_state='SUSPENDED' WHERE id='"+ic+"'")
 check('suspension last-verified visibility explicitly labelled, never active authority',"SELECT twuanis_remates_private.publication_visibility('"+listing10+"')->>'label'='INSTITUTION_SUSPENDED' AND twuanis_remates_private.publication_visibility('"+listing10+"')->'visible'='true'::jsonb AND twuanis_remates_private.lifecycle_eligibility('"+off10+"')->'eligible'='false'::jsonb")
 reject('suspended importer denied even with explicit retained visibility',lc('ingestion.record',ingest,who=member),'42501')
 sql("UPDATE twuanis_remates_private.institutions SET participation_state='ACTIVE' WHERE id='"+ic+"'")
 pol10=la('policy.record',dict(policy,expected='2'))
 reject('stale second publication denied',lc('publication.publish',publish),'40001')
 reject('unbound/ordinary identity cannot ingest',lc('ingestion.record',dict(ingest,offering=sale)))
 reject('stale binding ingestion denied',lc('ingestion.record',dict(ingest,binding_revision='2')),'40001')
 reject('ordinary customer denied',lc('ingestion.record',ingest,who=customer_user),'42501')
 reject('cross-institution offering denied',lc('publication.publish',dict(publish,offering=foreignoff)),'42501')
 reject('manual projection edit denied',"UPDATE twuanis_remates_private.listings SET state='ARCHIVED' WHERE id='"+listing10+"'",'55000')
 partial_verify=dict(run=run10,policy=pol10['id'],page_keys=['sample'],observation_count=1,review_evidence='local coverage assertion',reviewed=True)
 reject('partial/sample run never independently verified',lc('run.verify',partial_verify))
 failedrun=retain(evidence('run.retain',dict(run_body,key='r10-failed',started_at=earlier,ended_at=later,outcome='FAILED',scope=policy['coverage_key'],pages=[dict(key='failed',status='FAILED')])))['id']
 reject('actual failed run cannot certify completeness',lc('run.verify',dict(partial_verify,run=failedrun,policy=pol10['id'],page_keys=['failed'],observation_count=0)))
 reject('representative cannot certify complete inventory',lc('run.verify',partial_verify,who=member),'42501')
 reject('failed run cannot imply absence',lc('lifecycle.unconfirm',dict(offering=off10,expected='2',reviewed=True,basis='ABSENCE',verification=run10)))
 reject('fresh listing cannot be marked stale',lc('lifecycle.unconfirm',dict(offering=off10,expected='2',reviewed=True,basis='STALE')))
 sameobs=retain(evidence('observation.retain',dict(base10,key='r10-unchanged-original')))['id'];sameir=la('ingestion.record',dict(ingest,observation=sameobs));check('unchanged new observation retains provenance without duplicate canonical identity',"SELECT outcome='UNCHANGED' AND offering_id='"+off10+"' FROM twuanis_remates_private.ingestion_results WHERE id='"+sameir['id']+"'")
 # Two complete coverage runs after the property was seen, verified by the Owner against exact manifests.
 verification_ids=[]
 for index in range(2):
  start=ts("clock_timestamp()-interval '0.5 seconds'");end=ts("clock_timestamp()-interval '0.1 seconds'")
  rbody=dict(run_body,key='r10-complete-'+str(index),started_at=start,ended_at=end,outcome='COMPLETE',scope=policy['coverage_key'],pages=[dict(key='complete-page',status='RETAINED')])
  rr10=retain(evidence('run.retain',rbody))['id'];vb=dict(run=rr10,policy=pol10['id'],page_keys=['complete-page'],observation_count=0,review_evidence='Reviewed disposable full-scope manifest, empty source record set',reviewed=True)
  reject('wrong page completeness denied',lc('run.verify',dict(vb,page_keys=['other'])))
  reject('incorrect observation count denied',lc('run.verify',dict(vb,observation_count=1)))
  vreq=ident();v10=la('run.verify',vb,vreq);assert la('run.verify',vb,vreq)['id']==v10['id'] and la('run.verify',vb)['id']==v10['id'];verification_ids.append(v10['id']);results.append('exact complete coverage verification retry is idempotent')
 reject('verified run sealed against late observations',ec(evidence('observation.retain',dict(base10,key='r10-sealed-late',run=rr10,retrieved_at=end))),'55000')
 unconfirmed=la('lifecycle.unconfirm',dict(offering=off10,expected='2',reviewed=True,basis='ABSENCE',verification=verification_ids[0]));check('verified absence is unconfirmed, not sold/withdrawn',"SELECT state='UNCONFIRMED' FROM twuanis_remates_private.listings WHERE id='"+listing10+"'")
 reject('archival does not precede explicit source age',lc('lifecycle.archive',dict(offering=off10,expected='3',reviewed=True)))
 check('source-unconfirmed HIDE visibility enforced',"SELECT twuanis_remates_private.publication_visibility('"+listing10+"')->'visible'='false'::jsonb")
 # Source-specific policy version uses local illustrative seconds, not production-approved bank thresholds.
 polshort=la('policy.record',dict(policy,expected='3',fresh_seconds='1',archive_seconds='2',absent_runs='2'));results.append('new policy versions retain original windows and visibility settings')
 reject('old-policy completeness cannot archive under new policy',lc('lifecycle.archive',dict(offering=off10,expected='3',reviewed=True)))
 for index in range(2):
  st=ts("clock_timestamp()-interval '0.5 seconds'");en=ts("clock_timestamp()-interval '0.1 seconds'")
  rr10=retain(evidence('run.retain',dict(run_body,key='r10-short-complete-'+str(index),started_at=st,ended_at=en,outcome='COMPLETE',scope=policy['coverage_key'],pages=[dict(key='whole-page',status='RETAINED')])) )['id']
  v10=la('run.verify',dict(run=rr10,policy=polshort['id'],page_keys=['whole-page'],observation_count=0,review_evidence='Exact reviewed local full-source snapshot',reviewed=True))
 archived=la('lifecycle.archive',dict(offering=off10,expected='3',reviewed=True));check('archive follows exact source policy and verified absence',"SELECT state='ARCHIVED' AND revision=4 FROM twuanis_remates_private.listings WHERE id='"+listing10+"'")
 check('historical price unchanged through archive',"SELECT amount=100 AND currency='USD' FROM twuanis_remates_private.financial_values WHERE id='"+financial10+"'")
 # Reappearance keeps the existing property/offering identity, and needs renewed review.
 la('policy.record',dict(policy,expected='4'))
 st=ts("clock_timestamp()-interval '0.5 seconds'");en=ts("clock_timestamp()-interval '0.1 seconds'")
 reappear_run=retain(evidence('run.retain',dict(run_body,key='r10-reappearance',started_at=st,ended_at=en,outcome='PARTIAL',scope='SAMPLE',pages=[dict(key='one',status='RETAINED')])) )['id']
 base_new=dict(base10,key='r10-reappearance',run=reappear_run,retrieved_at=en,raw='R10 changed published price 120',fields=[dict(f,raw='USD 120') if f['path']=='sale' else f for f in base10['fields']]);newobs=retain(evidence('observation.retain',base_new))['id'];la('ingestion.record',dict(ingest,observation=newobs));
 reject('changed price cannot restore with old financial review',lc('publication.restore',dict(offering=off10,expected='4',reviewed=True)))
 retain(evidence('observation.link',dict(observation=newobs,offering=off10,property=pid10,expected_link=sql("SELECT coalesce(max(link_revision),0) FROM twuanis_remates_private.observation_links WHERE offering_id='"+off10+"' AND property_id='"+pid10+"'"))))
 newfv=save(dict(finbody,observation=newobs,amount='120'))['id'];save(dict(offering=off10,expected='1',mechanism='DIRECT_SALE',value=newfv,reviewed=True),'financial.select');restored=la('publication.restore',dict(offering=off10,expected='4',reviewed=True));check('restoration preserves offering UUID and price history',"SELECT state='PUBLISHED' AND revision=5 FROM twuanis_remates_private.listings WHERE id='"+listing10+"'");check('both original monetary assertions preserved',"SELECT count(*)=2 FROM twuanis_remates_private.financial_values WHERE id IN('"+financial10+"','"+newfv+"')")
 # Competing publication revisions have one winner, and changed request reuse is rejected.
 withdraw=dict(offering=off10,expected='5',basis='ADMINISTRATIVE',reviewed=True);req10=ident()
 ps=[subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env) for _ in range(2)]
 for proc in ps:proc.stdin.write(lc('publication.withdraw',withdraw));proc.stdin.close();proc.stdin=None
 outs=[proc.communicate(timeout=15) for proc in ps];assert sum(p.returncode==0 for p in ps)==1 and any('40001' in err for out,err in outs);results.append('independent publication revision competitors have one winner')
 check('administrative withdrawal is distinct from absence',"SELECT state='WITHDRAWN' AND revision=6 FROM twuanis_remates_private.listings WHERE id='"+listing10+"'")
 # Suspended/revoked institution actors never obtain mutation authority or replay receipts.
 sql("UPDATE twuanis_remates_private.institutions SET participation_state='SUSPENDED' WHERE id='"+ic+"'")
 reject('suspended representative cannot ingest',lc('ingestion.record',ingest,ireq,who=member),'42501');reject('Owner cannot publish an inactive institution',lc('publication.restore',dict(offering=off10,expected='6',reviewed=True)))
 sql("UPDATE twuanis_remates_private.institutions SET participation_state='ACTIVE' WHERE id='"+ic+"'")
 reject('representative without inventory.publish cannot publish',lc('publication.publish',publish,who=member),'42501')
 execute(change(member,'permission.grant',sql("SELECT revision FROM twuanis_remates_private.memberships WHERE institution_id='"+ic+"' AND principal_id='"+member+"'"),'inventory.publish',institution=ic))
 member_req=ident();la('ingestion.record',ingest,member_req,who=member);execute(change(member,'representative.revoke',sql("SELECT revision FROM twuanis_remates_private.memberships WHERE institution_id='"+ic+"' AND principal_id='"+member+"'"),institution=ic))
 reject('revoked representative cannot replay ingestion',lc('ingestion.record',ingest,member_req,who=member),'42501');reject('revoked representative cannot restore publication',lc('publication.restore',dict(offering=off10,expected='6',reviewed=True),who=member),'42501')
 for table in ['source_lifecycle_policies','source_run_verifications','ingestion_results','publication_events']:
  check('R10 '+table+' owner/RLS',"SELECT relrowsecurity AND relowner='postgres'::regrole FROM pg_class WHERE oid='twuanis_remates_private."+table+"'::regclass")
  for role_name in ['anon','authenticated','service_role']:check('R10 '+table+' direct access denial '+role_name,"SELECT NOT has_table_privilege('"+role_name+"','twuanis_remates_private."+table+"','SELECT,INSERT,UPDATE,DELETE,TRUNCATE')")
  for verb in ['UPDATE','DELETE','TRUNCATE']:
   reject('R10 '+table+' '+verb+' immutable',(f'UPDATE twuanis_remates_private.{table} SET id=id' if verb=='UPDATE' else f'{verb} '+('FROM ' if verb=='DELETE' else '')+f'twuanis_remates_private.{table}'+(' CASCADE' if verb=='TRUNCATE' else '')),'55000')
 for role_name in ['anon','service_role']:
  for fn in ['public.remate_ingestion_command(uuid,jsonb)','public.remate_ingestion_read(jsonb)']:check('R10 RPC denied '+role_name+fn,"SELECT NOT has_function_privilege('"+role_name+"','"+fn+"','EXECUTE')")
 check('R10 exact function owner/security/search path',"SELECT bool_and(proowner='postgres'::regrole AND prosecdef AND proconfig @> ARRAY['search_path=pg_catalog'] AND has_function_privilege('authenticated',oid,'EXECUTE') AND NOT EXISTS(SELECT 1 FROM aclexplode(proacl) WHERE grantee=0)) FROM pg_proc WHERE oid IN('public.remate_ingestion_command(uuid,jsonb)'::regprocedure,'public.remate_ingestion_read(jsonb)'::regprocedure)")
 check('R10 source remains disabled',"SELECT NOT enabled FROM twuanis_remates_private.sources WHERE id='"+sc+"'")
 assert snap()==r10_before;results.append('ten ordinary population/reference/warm-cache snapshots unchanged across R10')
 print('R10',len(results)-r10_start,'focused DB checks PASS',flush=True)
