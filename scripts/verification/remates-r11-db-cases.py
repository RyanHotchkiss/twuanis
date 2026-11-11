
 r11_start=len(results);migration('073');results.append('073 installs with exact R10 function guards')
 before11=snap();bank11=sc
 manual=dict(sreg,institution=ic,expected=sql("SELECT revision FROM twuanis_remates_private.institutions WHERE id='"+ic+"'"),namespace='r11.manual',channel='INSTITUTION',adapter_version='institution-manual-v1');manual.pop('origin');sc=cmd(manual)['id']
 def pc11(op,b,req=None,who=user,source=None,institution=None):return scoped('SELECT public.remate_publication_command('+lit(req or ident())+','+js(dict(operation=op,institution=institution or ic,source=source or sc,expected='1',reason='Explicit local institutional review',data=b))+');',who)
 def p11(op,b,req=None,who=user):return json.loads(sql(pc11(op,b,req,who)).splitlines()[-1])
 def pr11(mode='inventory',who=user,**kw):return json.loads(sql(scoped('SELECT public.remate_publication_read('+js(dict(institution=ic,source=sc,mode=mode,**kw))+');',who)).splitlines()[-1])
 row11=dict(key='manual-one',expected='0',title='Original institutional title',parcel='R11-PARCEL',jurisdiction='CR-test',province='1001',canton='1002',district=None,property_type='1',mechanism='DIRECT_SALE',amount='100.123456',currency='CRC',round=None)
 req11=ident();d11=p11('draft.save',row11,req11);assert p11('draft.save',row11,req11)['id']==d11['id'];results.append('manual identical retry preserves immutable submission')
 reject('changed manual request denied',pc11('draft.save',dict(row11,title='Changed'),req11),'23505')
 reject('stale manual creation denied',pc11('draft.save',row11),'40001')
 reject('ordinary customer cannot create institutional draft',pc11('draft.save',dict(row11,key='customer'),who=customer_user),'42501')
 reject('revoked member cannot create institutional draft',pc11('draft.save',dict(row11,key='revoked'),who=member),'42501')
 reject('bank evidence cannot be relabelled institutional',pc11('draft.save',dict(row11,key='bank'),source=bank11),'42501')
 reject('foreign source denied',pc11('draft.save',dict(row11,key='foreign'),institution=sql("SELECT institution_id FROM twuanis_remates_private.offerings WHERE id='"+foreignoff+"'")),'42501')
 off11=d11['offeringId'];pid11=d11['propertyId'];obs11=d11['observationId']
 check('manual source has no invented bank origin',"SELECT origin_host IS NULL AND NOT enabled FROM twuanis_remates_private.sources WHERE id='"+sc+"'")
 check('submission retains exact original money and no fabricated bank timestamps',"SELECT raw_text::jsonb->>'amount'='100.123456' AND published_at IS NULL AND updated_at IS NULL AND source_url LIKE 'urn:twuanis:remates:institution:%' FROM twuanis_remates_private.observations WHERE id='"+obs11+"'")
 check('draft neither canonical identity nor automatic publication',"SELECT p.identity_status='PROVISIONAL' AND l.state='DRAFT' FROM twuanis_remates_private.properties p JOIN twuanis_remates_private.offering_properties op ON op.property_id=p.id JOIN twuanis_remates_private.listings l ON l.offering_id=op.offering_id WHERE p.id='"+pid11+"'")
 assert len(pr11()['items'])==1;results.append('scoped current inventory and immutable history readers connected')
 for bad in [dict(row11,amount=100),dict(row11,amount='0'),dict(row11,amount=None),dict(row11,province='0'),dict(row11,round='illegal'),dict(row11,mechanism='AUCTION'),dict(row11,actor=user)]:reject('typed invalid row denied',pc11('draft.save',bad))
 case11=icmd(proposal(obs11,[parcel('R11-PARCEL','parcel',pid11,'1')],offering=off11,expected_offering='1'))['id'];confirmed11=icmd(decide(case11));assert confirmed11['offeringId']==off11;results.append('manual foundation reconciled through existing R05 authority')
 cbody11=dict(property=pid11,expected_property='2',expected='0',observation=obs11,reviewed=True,geography=dict(province=assignment(1001,'province'),canton=assignment(1002,'canton'),district=None),semantics=dict(property_type=[assignment(1,'property_type')]),facts={})
 sql(gq(gc(cbody11)))
 fv11=save(dict(offering=off11,observation=obs11,path='amount',ordinal=0,kind='SELLING_PRICE',status='VALID',amount='100.123456',currency='CRC',round=None))['id'];save(dict(offering=off11,expected='0',mechanism='DIRECT_SALE',value=fv11,reviewed=True),'financial.select')
 la('policy.record',dict(policy,expected='0'));la('ingestion.record',dict(observation=obs11,offering=off11,binding_revision='1'))
 pub11=la('publication.publish',dict(offering=off11,expected='1',reviewed=True));results.append('institutional publication uses canonical R10 eligibility and event authority')
 edit11=dict(row11,expected='1',title='Audited second title',amount='200');d12=p11('draft.save',edit11);assert d12['originalOfferingId']==off11;results.append('edit appends evidence and preserves canonical identity')
 check('unreviewed published edit hidden without changing financial history',"SELECT twuanis_remates_private.publication_visibility(id)->'visible'='false'::jsonb FROM twuanis_remates_private.listings WHERE offering_id='"+off11+"'")
 reject('unreviewed edit cannot revise publication',lc('publication.revise',dict(offering=off11,expected='2',reviewed=True)))
 check('original exact monetary evidence immutable',"SELECT amount=100.123456 AND currency='CRC' FROM twuanis_remates_private.financial_values WHERE id='"+fv11+"'")
 # CSV staged only, explicit atomic apply; repeated same file and exact rows retain original job.
 csv11='local reviewed fixture csv';r2=dict(row11,key='csv-two',parcel='CSV-PARCEL');job11=p11('import.prepare',dict(csv=csv11,rows=[r2,r2]))['id'];assert [x['status'] for x in sorted(pr11('rows',job=job11)['items'],key=lambda x:x['ordinal'])]==['READY','DUPLICATE'];results.append('identical CSV duplicate explicitly skipped')
 check('staging does not create inventory',"SELECT NOT EXISTS(SELECT 1 FROM twuanis_remates_private.institutional_submissions WHERE record_key='csv-two')")
 assert p11('import.prepare',dict(csv=csv11,rows=[r2,r2]))['id']==job11;results.append('same file stages idempotently')
 reject('same file cannot change reviewed projection',pc11('import.prepare',dict(csv=csv11,rows=[row11])),'23505')
 reject('CSV explicit review mandatory',pc11('import.apply',dict(job=job11,reviewed=False)),'22023')
 apply11=dict(job=job11,reviewed=True);first11=p11('import.apply',apply11);assert p11('import.apply',apply11)['id']==first11['id'];results.append('CSV apply retry creates one application and no duplicate draft')
 check('CSV duplicate consumes one draft identity',"SELECT count(*)=1 FROM twuanis_remates_private.institutional_submissions WHERE record_key='csv-two'")
 for bad_value in ['not-a-number','1e3','9223372036854775808']:
  bad_row=dict(r2,key='bad-value',**({'expected':bad_value} if bad_value=='9223372036854775808' else {'amount':bad_value}))
  invalid_job=p11('import.prepare',dict(csv='bad numeric fixture '+bad_value,rows=[bad_row]))['id'];assert pr11('rows',job=invalid_job)['items'][0]['status']=='INVALID';results.append('malformed/out-of-range numeric CSV row classified INVALID')
 invalidjob=p11('import.prepare',dict(csv='invalid fixture',rows=[dict(r2,key='invalid',amount='0')]))['id'];reject('invalid CSV cannot apply',pc11('import.apply',dict(job=invalidjob,reviewed=True)))
 conflictjob=p11('import.prepare',dict(csv='conflict fixture',rows=[dict(r2,key='conflict'),dict(r2,key='conflict',title='Different')]))['id'];reject('conflicting duplicate CSV cannot apply',pc11('import.apply',dict(job=conflictjob,reviewed=True)))
 rollbackjob=p11('import.prepare',dict(csv='atomic fixture',rows=[dict(r2,key='must-rollback'),row11]))['id'];reject('stale row causes atomic batch rollback',pc11('import.apply',dict(job=rollbackjob,reviewed=True)),'40001');check('failed batch leaves no earlier row',"SELECT NOT EXISTS(SELECT 1 FROM twuanis_remates_private.institutional_submissions WHERE record_key='must-rollback')")
 # Independent sessions compete for same revision: at most one succeeds.
 race11=dict(edit11,expected='2',title='Concurrent edit');procs=[subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env) for _ in range(2)]
 for proc in procs:proc.stdin.write(pc11('draft.save',race11));proc.stdin.close();proc.stdin=None
 outputs=[proc.communicate(timeout=15) for proc in procs];assert sum(proc.returncode==0 for proc in procs)==1;results.append('independent-session draft revision race has one winner')
 racejob=p11('import.prepare',dict(csv='concurrent apply',rows=[dict(r2,key='race-csv',parcel='RACE-PARCEL')]))['id'];procs=[subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env) for _ in range(2)]
 for proc in procs:proc.stdin.write(pc11('import.apply',dict(job=racejob,reviewed=True)));proc.stdin.close();proc.stdin=None
 outputs=[proc.communicate(timeout=15) for proc in procs];assert all(proc.returncode==0 for proc in procs) and len({json.loads(out.splitlines()[-1])['id'] for out,err in outputs})==1;results.append('independent-session CSV apply has one immutable result')
 sql("UPDATE twuanis_remates_private.institutions SET participation_state='SUSPENDED' WHERE id='"+ic+"'");reject('suspended institution cannot replay successful draft',pc11('draft.save',row11,req11),'42501');sql("UPDATE twuanis_remates_private.institutions SET participation_state='ACTIVE' WHERE id='"+ic+"'")

 # A real local representative receives only explicit draft permissions, never publish implicitly.
 rep11=account();setsession(rep11);execute(app(rep11,institution=ic,kind='representative.activate'))
 for permission in ['drafts.create','drafts.edit']:
  execute(change(rep11,'permission.grant',sql("SELECT revision FROM twuanis_remates_private.memberships WHERE institution_id='"+ic+"' AND principal_id='"+rep11+"'"),permission,institution=ic))
 rep_req=ident();rep_data=dict(row11,key='representative',parcel='REP-PARCEL');p11('draft.save',rep_data,rep_req,rep11)
 reject('draft-only representative cannot publish',lc('publication.publish',dict(offering=off11,expected='2',reviewed=True),who=rep11),'42501')
 reject('draft-only representative cannot edit published evidence',pc11('draft.save',dict(race11,expected='3'),who=rep11),'42501')
 reject('draft-only representative cannot import',pc11('import.prepare',dict(csv='denied',rows=[r2]),who=rep11),'42501')
 reject('draft-only representative cannot read audit history',scoped('SELECT public.remate_publication_read('+js(dict(institution=ic,source=sc,mode='history'))+');',rep11),'42501')
 execute(change(rep11,'representative.revoke',sql("SELECT revision FROM twuanis_remates_private.memberships WHERE institution_id='"+ic+"' AND principal_id='"+rep11+"'"),institution=ic));reject('revoked representative cannot replay prior draft',pc11('draft.save',rep_data,rep_req,rep11),'42501')
 # Explicit cross-channel conflict enters R05 quarantine; primary source and original price remain unchanged.
 collision=p11('draft.save',dict(row11,key='source-collision',parcel='R10-PARCEL'));assert collision['identityConflict'];results.append('source/institution identifier collision visible without silent merge')
 cc=icmd(proposal(collision['observationId'],[parcel('R10-PARCEL','parcel',collision['propertyId'],'1')],offering=collision['originalOfferingId'],expected_offering='1'));assert cc['conflict']=='IDENTIFIER_CONFLICT';results.append('cross-channel evidence enters existing audited identity case')
 matched=icmd(decide(cc['id'],'MATCH_EXISTING',offering=off10,expected_offering=sql("SELECT revision FROM twuanis_remates_private.offerings WHERE id='"+off10+"'")));assert matched['offeringId']==off10;results.append('explicit audited match preserves bank offering identity')
 check('cross-channel match never relabels original bank source',"SELECT source_id='"+bank11+"' FROM twuanis_remates_private.offerings WHERE id='"+off10+"'")
 reject('cross-channel match cannot bypass new financial/classification review',lc('publication.restore',dict(offering=off10,expected='6',reviewed=True),source=bank11))
 assert sql(scoped("SELECT jsonb_array_length(public.remate_publication_read("+js(dict(institution=ic,source=bank11,mode='inventory'))+")->'items')>0")).splitlines()[-1]=='t';results.append('bank channel inventory remains readable without institutional rewrite')
 # Reviewed second evidence revision can publish only through existing R10 canonical projection.
 latest11=sql("SELECT observation_id FROM twuanis_remates_private.institutional_submissions WHERE source_id='"+sc+"' AND record_key='manual-one' ORDER BY revision DESC LIMIT 1")
 case12=icmd(proposal(latest11,[parcel('R11-PARCEL','parcel',pid11,'2')],binding='1'))['id'];icmd(decide(case12,'KEEP_CURRENT'))
 sql(gq(gc(dict(cbody11,expected='1',observation=latest11))))
 f12=save(dict(offering=off11,observation=latest11,path='amount',ordinal=0,kind='SELLING_PRICE',status='VALID',amount='200',currency='CRC',round=None))['id'];save(dict(offering=off11,expected='1',mechanism='DIRECT_SALE',value=f12,reviewed=True),'financial.select');la('ingestion.record',dict(observation=latest11,offering=off11,binding_revision='2'))
 la('publication.revise',dict(offering=off11,expected='2',reviewed=True));check('reviewed publication revision restores visibility',"SELECT twuanis_remates_private.publication_visibility(id)->'visible'='true'::jsonb AND revision=3 FROM twuanis_remates_private.listings WHERE offering_id='"+off11+"'")
 for table in ['institutional_submissions','import_jobs','import_rows','import_applications']:
  check('R11 '+table+' RLS owner',"SELECT relrowsecurity AND relowner='postgres'::regrole FROM pg_class WHERE oid='twuanis_remates_private."+table+"'::regclass")
  for role_name in ['anon','authenticated','service_role']:check('R11 '+table+' API access denied '+role_name,"SELECT NOT has_table_privilege('"+role_name+"','twuanis_remates_private."+table+"','SELECT,INSERT,UPDATE,DELETE,TRUNCATE')")
  for verb in ['UPDATE','DELETE','TRUNCATE']:reject('R11 '+table+' immutable '+verb,(f'UPDATE twuanis_remates_private.{table} SET id=id' if verb=='UPDATE' else f'{verb} '+('FROM ' if verb=='DELETE' else '')+f'twuanis_remates_private.{table}'+(' CASCADE' if verb=='TRUNCATE' else '')),'55000')
 for fn in ['public.remate_publication_command(uuid,jsonb)','public.remate_publication_read(jsonb)']:
  check('R11 RPC owner fixedpath authenticated only '+fn,"SELECT proowner='postgres'::regrole AND prosecdef AND proconfig @> ARRAY['search_path=pg_catalog'] AND has_function_privilege('authenticated',oid,'EXECUTE') AND NOT has_function_privilege('anon',oid,'EXECUTE') AND NOT has_function_privilege('service_role',oid,'EXECUTE') AND NOT EXISTS(SELECT 1 FROM aclexplode(proacl) WHERE grantee=0) FROM pg_proc WHERE oid='"+fn+"'::regprocedure")
 assert snap()==before11;results.append('R11 ten ordinary populations/references/warm caches unchanged')
 print('R11',len(results)-r11_start,'focused DB checks PASS',flush=True)
