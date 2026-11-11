
 r13_start=len(results);migration('075');results.append('075 independent saved contracts install after R12')
 before13=snap();sql(dq12(dict(expected='2',enabled=True,reason='LOCAL R13 disposable fixture')))
 def sc13(op,data,expected='0',req=None,who=customer_user):return scoped('SELECT public.remate_saved_command('+lit(req or ident())+','+js(dict(operation=op,expected=expected,data=data))+');',who)
 def save13(*a,**k):return json.loads(sql(sc13(*a,**k)).splitlines()[-1])
 def read13(mode='properties',who=customer_user,**kw):return json.loads(sql(scoped('SELECT public.remate_saved_read('+js(dict(mode=mode,**kw))+');',who)).splitlines()[-1])
 req13=ident();sp13=save13('property.save',dict(listing=listing12),req=req13);assert save13('property.save',dict(listing=listing12),req=req13)['id']==sp13['id'];results.append('same account request idempotent saved identity')
 reject('changed saved retry denied',sc13('property.save',dict(listing=lid12),req=req13),'23505');reject('stale saved revision denied',sc13('property.remove',dict(listing=listing12)),'40001')
 other13=account();setsession(other13);assert read13(who=other13)['items']==[];results.append('own saved reader excludes other account')
 reject('other account cannot remove saved property',sc13('property.remove',dict(listing=listing12),expected='1',who=other13),'40001')
 same13=save13('property.save',dict(listing=listing12),who=other13);assert same13['id']!=sp13['id'];results.append('same Remates listing distinct per-account saved identity')
 searchbody13=dict(name='Private bank search',definition=dict(currency='CRC',price_min='100',province='1001'),language='es');sr13=save13('search.create',searchbody13);assert read13('searches')['items'][0]['population']=='REMATES';results.append('independent typed search and canonical query definition')
 reject('ordinary query fields denied',sc13('search.create',dict(searchbody13,definition=dict(transaction_type='sale'))),'22023')
 reject('search cannot include listing identity',sc13('search.create',dict(searchbody13,definition=dict(id=listing12))),'22023')
 reject('cross-account search editing denied',sc13('search.update',dict(searchbody13,id=sr13['id']),expected='1',who=other13),'42501')
 updated13=save13('search.update',dict(searchbody13,id=sr13['id'],name='Revised private search'),expected='1');assert updated13['revision']=='2';results.append('audited expected-revision search edit')
 reject('notifications fail closed until D09 decision',sc13('alerts.configure',dict(id=sr13['id'],enabled=True,frequency='daily'),expected='2'),'42501')
 # Equal text UUIDs in disposable ordinary stubs never create cross-domain saved memberships.
 sql("CREATE TABLE public.r13_ordinary_saved_fixture(id uuid PRIMARY KEY,user_id uuid,population text);INSERT INTO public.r13_ordinary_saved_fixture VALUES('"+sr13['id']+"','"+other13+"','SALE');")
 assert read13('searches',who=other13)['items']==[];results.append('equal ordinary saved UUID never resolves as Remates own identity')
 assert read13()['items'][0]['property']['id']==listing12;results.append('saved public evidence uses R12 safe projection only')
 sql(dq12(dict(expected='3',enabled=False,reason='LOCAL gate off test')));row13=read13()['items'][0];assert row13['property'] is None and row13['active'];results.append('unavailable saved listing retains reference without private evidence leak')
 remove13=save13('property.remove',dict(listing=listing12),expected='1');assert remove13['revision']=='2';results.append('own removal works while delivery disabled')
 reject('cannot newly save hidden/private inventory',sc13('property.save',dict(listing=listing12),expected='2'),'42501')
 race13=dict(searchbody13,id=sr13['id'],name='Concurrent revision');ps=[subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env) for _ in range(2)]
 for proc in ps:proc.stdin.write(sc13('search.update',race13,expected='2'));proc.stdin.close();proc.stdin=None
 outs=[proc.communicate(timeout=15) for proc in ps];assert sum(proc.returncode==0 for proc in ps)==1;results.append('independent-session search edit one revision winner')
 request13=ident();ps=[subprocess.Popen(base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env) for _ in range(2)]
 for proc in ps:proc.stdin.write(sc13('search.create',searchbody13,req=request13));proc.stdin.close();proc.stdin=None
 outs=[proc.communicate(timeout=15) for proc in ps];assert all(proc.returncode==0 for proc in ps) and len({json.loads(out.splitlines()[-1])['id'] for out,err in outs})==1;results.append('independent-session identical create one identity and receipt')
 for role_name in ['anon','service_role']:reject('saved RPC role denied '+role_name,role('SELECT public.remate_saved_read('+js(dict(mode='properties'))+');',role_name),'42501')
 for table in ['saved_properties','saved_searches','saved_events']:
  check('R13 owner/RLS '+table,"SELECT relowner='postgres'::regrole AND relrowsecurity FROM pg_class WHERE oid='twuanis_remates_private."+table+"'::regclass")
  for role_name in ['anon','authenticated','service_role']:check('no direct runtime saved access '+table+role_name,"SELECT NOT has_table_privilege('"+role_name+"','twuanis_remates_private."+table+"','SELECT,INSERT,UPDATE,DELETE,TRUNCATE')")
 for fn in ['public.remate_saved_command(uuid,jsonb)','public.remate_saved_read(jsonb)']:check('saved RPC owner/fixedpath/auth-only '+fn,"SELECT proowner='postgres'::regrole AND prosecdef AND proconfig @> ARRAY['search_path=pg_catalog'] AND has_function_privilege('authenticated',oid,'EXECUTE') AND NOT EXISTS(SELECT 1 FROM aclexplode(proacl) WHERE grantee=0) FROM pg_proc WHERE oid='"+fn+"'::regprocedure")
 reject('saved events immutable','DELETE FROM twuanis_remates_private.saved_events','55000')
 check('receipt preserves minimal audit not personal search copy',"SELECT bool_and(command ? 'sha256' AND NOT command ? 'data') FROM twuanis_remates_private.command_receipts WHERE command->>'operation' LIKE 'search.%'")
 # New disposable customer, never canonical Owner, exercises Auth cascading privacy cleanup.
 gone13=account();setsession(gone13);gone_search13=save13('search.create',searchbody13,who=gone13);sql("DELETE FROM auth.users WHERE id='"+gone13+"'");check('Auth deletion clears private saved search',"SELECT NOT EXISTS(SELECT 1 FROM twuanis_remates_private.saved_searches WHERE user_id='"+gone13+"')");check('minimal historical audit survives without live Auth',"SELECT EXISTS(SELECT 1 FROM twuanis_remates_private.saved_events WHERE actor_id='"+gone13+"')");reject('deleted session cannot read saved records',scoped('SELECT public.remate_saved_read('+js(dict(mode='searches'))+');',gone13),'42501')
 assert snap()==before13;results.append('R13 ten ordinary population/reference/cache snapshots unchanged')
 print('R13',len(results)-r13_start,'focused saved DB checks PASS',flush=True)
