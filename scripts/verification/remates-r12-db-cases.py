
 r12_start=len(results);migration('074');results.append('074 installs on exact local R11 authority')
 def read12(q):return json.loads(sql("SET ROLE anon;SELECT public.remate_public_read("+js(q)+");RESET ROLE;").splitlines()[-1])
 def dq12(body,req=None,who=user):return scoped('SELECT public.remate_delivery_command('+lit(req or ident())+','+js(body)+');',who)
 assert read12(dict(mode='list'))==dict(enabled=False,count=0,page=0,items=[]);results.append('anonymous default OFF returns no inventory')
 body12=dict(expected='0',enabled=True,reason='LOCAL fixture only');request12=ident();d12=json.loads(sql(dq12(body12,request12)).splitlines()[-1]);assert json.loads(sql(dq12(body12,request12)).splitlines()[-1])['id']==d12['id'];results.append('Owner delivery configuration receipt idempotent')
 reject('customer cannot configure delivery',dq12(dict(body12,expected='1'),who=customer_user),'42501')
 reject('changed delivery retry denied',dq12(dict(body12,enabled=False),request12),'23505')
 reject('stale delivery revision denied',dq12(body12),'40001')
 listing12=sql("SELECT id FROM twuanis_remates_private.listings WHERE offering_id='"+off11+"'")
 a12=read12(dict(mode='list'));assert a12['enabled'] and any(x['id']==listing12 for x in a12['items']);results.append('anonymous explicitly published institutional discovery')
 item12=read12(dict(mode='detail',id=listing12))['items'][0];assert item12['amount']=='200' and item12['currency']=='CRC' and item12['source_url'] is None;results.append('exact reviewed selling value and safe institutional attribution')
 assert not {'actor_id','receipt_id','raw_text','evidence','storage_key','private_key'}.intersection(item12);results.append('safe projection excludes private evidence and authority')
 assert read12(dict(mode='list',currency='USD'))['count']==0;results.append('currency isolation no inferred conversion')
 assert read12(dict(mode='list',currency='CRC',price_min='201'))['count']==0;results.append('exact price filter')
 assert read12(dict(mode='list',province='1001',canton='1002',property_type='1'))['count']>=1;results.append('canonical geographic and ontology filters')
 assert read12(dict(mode='list',province='999'))['count']==0;results.append('unknown canonical geography returns empty')
 assert read12(dict(mode='list',area_min='1'))['count']==0;results.append('missing parcel area remains missing')
 facets12=read12(dict(mode='facets'));assert any(t['id']=='1001' for t in facets12['facets']['terms']);results.append('safe canonical bilingual facets')
 assert read12(dict(mode='detail',id=ident()))['items']==[];results.append('nonexistent/private identity returns no evidence')
 assert read12(dict(mode='list',page='1'))['items']==[];results.append('bounded page no repeated records')
 for q in [dict(mode='list',sort='price_asc'),dict(mode='list',price_min='1'),dict(mode='list',currency='EUR'),dict(mode='list',price_min='2',price_max='1',currency='CRC'),dict(mode='list',area_min='2',area_max='1'),dict(mode='list',page='10000'),dict(mode='list',actor=user),dict(mode='list',area_min=1)]:reject('invalid public query denied','SET ROLE anon;SELECT public.remate_public_read('+js(q)+');','22023')
 # Populate only disposable local inventory through canonical command contracts.
 for j12 in range(21):
  row12=dict(row11,key='r12-page-'+str(j12),parcel='R12-PARCEL-'+str(j12),currency='USD',amount=str(500+j12));draft12=p11('draft.save',row12);of12=draft12['offeringId'];pp12=draft12['propertyId'];oo12=draft12['observationId']
  case12=icmd(proposal(oo12,[parcel(row12['parcel'],'parcel',pp12,'1')],offering=of12,expected_offering='1'))['id'];icmd(decide(case12))
  sql(gq(gc(dict(cbody11,property=pp12,observation=oo12))))
  value12=save(dict(offering=of12,observation=oo12,path='amount',ordinal=0,kind='SELLING_PRICE',status='VALID',amount=row12['amount'],currency='USD',round=None))['id'];save(dict(offering=of12,expected='0',mechanism='DIRECT_SALE',value=value12,reviewed=True),'financial.select');la('ingestion.record',dict(observation=oo12,offering=of12,binding_revision='1'));la('publication.publish',dict(offering=of12,expected='1',reviewed=True))
 pages12=[read12(dict(mode='list',currency='USD',sort='price_asc',page=str(x))) for x in range(2)];assert pages12[0]['count']==21 and len(pages12[0]['items'])==20 and len(pages12[1]['items'])==1;assert len({x['id'] for p in pages12 for x in p['items']})==21;results.append('21 published local offerings paginate with no omissions or duplicates')
 assert [x['amount'] for p in pages12 for x in p['items']]==[str(500+x) for x in range(21)];results.append('currency-specific exact price sorting stable across pages')
 assert read12(dict(mode='list',currency='CRC'))['count']==1;results.append('mixed currencies never share compared population')
 sql("UPDATE twuanis_remates_private.institutions SET participation_state='SUSPENDED' WHERE id='"+ic+"'");assert read12(dict(mode='list'))['count']==0;sql("UPDATE twuanis_remates_private.institutions SET participation_state='ACTIVE' WHERE id='"+ic+"'");results.append('source-specific suspended HIDE policy enforced at read time')
 for kind12 in ['missing','auction']:
  rr12=dict(row11,key='r12-'+kind12,parcel='R12-'+kind12,amount=None if kind12=='missing' else '900.123456',currency=None if kind12=='missing' else 'USD',mechanism='DIRECT_SALE' if kind12=='missing' else 'AUCTION',round=None if kind12=='missing' else '2');dd12=p11('draft.save',rr12);of12=dd12['offeringId'];pp12=dd12['propertyId'];oo12=dd12['observationId'];cc12=icmd(proposal(oo12,[parcel(rr12['parcel'],'parcel',pp12,'1')],offering=of12,expected_offering='1'))['id'];icmd(decide(cc12));sql(gq(gc(dict(cbody11,property=pp12,observation=oo12))))
  vv12=None if kind12=='missing' else save(dict(offering=of12,observation=oo12,path='amount',ordinal=0,kind='AUCTION_BASE',status='VALID',amount=rr12['amount'],currency='USD',round=dict(path='round',ordinal=0)))['id'];la('ingestion.record',dict(observation=oo12,offering=of12,binding_revision='1'));save(dict(offering=of12,expected='0',mechanism=rr12['mechanism'],value=vv12,reviewed=True),'financial.select');la('publication.publish',dict(offering=of12,expected='1',reviewed=True))
  lid12=sql("SELECT id FROM twuanis_remates_private.listings WHERE offering_id='"+of12+"'");xx12=read12(dict(mode='detail',id=lid12))['items'][0]
  if kind12=='missing':assert xx12['amount'] is None and xx12['currency'] is None and read12(dict(mode='list',financial_kind='MISSING'))['count']==1
  else:assert xx12['amount']=='900.123456' and xx12['currency']=='USD' and xx12['financial_kind']=='AUCTION_BASE' and xx12['auction_round']=='2'
  results.append('public '+kind12+' preserves financial value meaning exactly')
 for fn in ['public.remate_public_read(jsonb)','public.remate_delivery_command(uuid,jsonb)']:
  check('public RPC fixed path owner security '+fn,"SELECT proowner='postgres'::regrole AND prosecdef AND proconfig @> ARRAY['search_path=pg_catalog'] AND NOT has_function_privilege('service_role',oid,'EXECUTE') FROM pg_proc WHERE oid='"+fn+"'::regprocedure")
 for obj in ['delivery_versions','public_projection']:
  for role_name in ['anon','authenticated','service_role']:check('no direct private access '+obj+role_name,"SELECT NOT has_table_privilege('"+role_name+"','twuanis_remates_private."+obj+"','SELECT,INSERT,UPDATE,DELETE')")
 reject('delivery history immutable','DELETE FROM twuanis_remates_private.delivery_versions','55000')
 procs=[subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env) for _ in range(2)]
 for proc in procs:proc.stdin.write(dq12(dict(body12,expected='1',enabled=False)));proc.stdin.close();proc.stdin=None
 outputs=[proc.communicate(timeout=15) for proc in procs];assert sum(proc.returncode==0 for proc in procs)==1;results.append('independent-session delivery revision one winner')
 assert not read12(dict(mode='list'))['enabled'];results.append('delivery disable removes public visibility immediately')
 assert snap()==before11;results.append('all ten ordinary populations/references/caches unchanged')
 print('R12',len(results)-r12_start,'focused DB checks PASS',flush=True)
