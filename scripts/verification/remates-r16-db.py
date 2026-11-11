"""Local consolidated database gates plus final-install metadata; no provider connection."""
from pathlib import Path
root=Path('/Users/cassidydaddy/twuanis')
script=(root/'scripts/verification/remates-r14-db.py').read_text()
extra='''
 check('R16 final private function owners and fixed paths',"SELECT bool_and(pg_get_userbyid(p.proowner)='postgres' AND p.proconfig @> ARRAY['search_path=pg_catalog']) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='twuanis_remates_private'")
 check('R16 final private helper execution denied',"SELECT NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='twuanis_remates_private' AND (has_function_privilege('anon',p.oid,'EXECUTE') OR has_function_privilege('authenticated',p.oid,'EXECUTE') OR has_function_privilege('service_role',p.oid,'EXECUTE')))")
 check('R16 final private table owner and RLS',"SELECT bool_and(pg_get_userbyid(c.relowner)='postgres' AND c.relrowsecurity) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='twuanis_remates_private' AND c.relkind='r'")
 check('R16 final direct runtime private table access denied',"SELECT NOT EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='twuanis_remates_private' AND c.relkind='r' AND (has_table_privilege('anon',c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE') OR has_table_privilege('authenticated',c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE') OR has_table_privilege('service_role',c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')))")
 check('R16 final public RPC owner security and fixed paths',"SELECT bool_and(pg_get_userbyid(p.proowner)='postgres' AND p.prosecdef AND p.proconfig @> ARRAY['search_path=pg_catalog']) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname LIKE 'remate_%'")
'''
(root/'scripts/verification/remates-r16-db-cases.py').write_text(extra)
script=script.replace('source=source.replace(" report=', "extra+=(root/'scripts/verification/remates-r16-db-cases.py').read_text()\nsource=source.replace(\" report=",1).replace("'R-14-db-results.json'","'R-16-db-results.json'")
exec(compile(script,str(root/'scripts/verification/remates-r14-db.py'),'exec'))
