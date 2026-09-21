import subprocess,json
psql='/opt/homebrew/opt/postgresql@17/bin/psql'
queries={
 'closed_functions':"SELECT coalesce(jsonb_agg(x ORDER BY x.signature),'[]') FROM (SELECT p.oid::regprocedure::text signature,p.prosrc,p.prosecdef,p.provolatile,p.proconfig,p.proacl::text,p.proowner::regrole::text FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','twuanis_canonical_private') AND p.proname NOT IN ('read_canonical_listing_evidence','read_legacy_geographic_candidates','read_legacy_geography_dictionary','s6_legacy_normalize')) x",
 'table_security':"SELECT jsonb_agg(x ORDER BY x.relname) FROM (SELECT c.relname,c.relrowsecurity,c.relforcerowsecurity,c.relacl::text,c.relowner::regrole::text FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','twuanis_canonical_private') AND c.relkind='r') x",
 'constraints':"SELECT jsonb_agg(x ORDER BY x.relation,x.conname) FROM (SELECT c.conrelid::regclass::text relation,c.conname,pg_get_constraintdef(c.oid) definition FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace WHERE n.nspname IN ('public','twuanis_canonical_private'))x",
 'triggers':"SELECT jsonb_agg(x ORDER BY x.relation,x.tgname) FROM (SELECT tgrelid::regclass::text relation,tgname,pg_get_triggerdef(t.oid) definition FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','twuanis_canonical_private') AND NOT t.tgisinternal)x"
}
for name,q in queries.items():
 values=[]
 for db in ['cg_s5_verification','cg_s6_integrated']:
  values.append(json.loads(subprocess.check_output([psql,'-h','/private/tmp/cg-s2a-lab/socket','-p','55441','-U','postgres','-d',db,'-At','-c',q],text=True)))
 assert values[0]==values[1],name
 print('PASS',name,len(values[0]),'unchanged')
