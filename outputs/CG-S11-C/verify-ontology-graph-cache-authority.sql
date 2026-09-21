-- Read-only exact graph-cache forward-repair verification.
SELECT r,p,has_table_privilege(r,'public.ontology_graph_cache',p)=(r='service_role' AND p='SELECT') AS graph_authority_verified
FROM unnest(ARRAY['anon','authenticated','service_role'])r CROSS JOIN unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN'])p;
SELECT r,a.attname,p,has_column_privilege(r,a.attrelid,a.attnum,p)=(r='service_role' AND p='SELECT') AS graph_column_verified
FROM pg_attribute a CROSS JOIN unnest(ARRAY['anon','authenticated','service_role'])r CROSS JOIN unnest(ARRAY['SELECT','INSERT','UPDATE','REFERENCES'])p
WHERE a.attrelid='public.ontology_graph_cache'::regclass AND a.attnum>0 AND NOT a.attisdropped;
SELECT c.relkind='m' AS graph_type_verified,pg_get_userbyid(c.relowner)='postgres' AS graph_owner_verified,
 has_table_privilege('postgres',c.oid,'MAINTAIN') AS owner_refresh_verified,
 NOT EXISTS(SELECT 1 FROM aclexplode(coalesce(c.relacl,acldefault('r',c.relowner)))a WHERE a.grantee=0) AS graph_public_denied,
 NOT EXISTS(SELECT 1 FROM pg_attribute a CROSS JOIN LATERAL aclexplode(a.attacl)x WHERE a.attrelid=c.oid AND x.grantee=0) AS graph_public_columns_denied
FROM pg_class c WHERE c.oid='public.ontology_graph_cache'::regclass;
