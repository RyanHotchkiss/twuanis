-- READ ONLY. All verified/denied fields must be true. Exact names derive from installed canonical migrations.
WITH canonical AS (
 SELECT c.oid,c.relowner,c.relrowsecurity,c.relname,n.nspname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE c.relkind='r' AND (n.nspname='twuanis_canonical_private' OR (n.nspname='public' AND c.relname IN
 ('publisher_accounts','capacity_policy_guard','listing_semantic_selections','listing_fact_evidence','listing_classification_rule_sets','listing_classification_rules','listing_membership_origins','canonical_operation_receipts','listing_source_observations','source_identity_conflicts','listing_lifecycle_events','listing_monetary_events')))
)
SELECT oid::regclass AS object,pg_get_userbyid(relowner)='postgres' AS owner_verified,relrowsecurity AS rls_verified,
 has_table_privilege('postgres',oid,'SELECT,INSERT,UPDATE,DELETE') AS trusted_owner_verified,
 NOT EXISTS(SELECT 1 FROM pg_class c CROSS JOIN LATERAL aclexplode(coalesce(c.relacl,acldefault('r',c.relowner)))a WHERE c.oid=canonical.oid AND a.grantee=0) AS public_denied,
 r,p,NOT has_table_privilege(r,oid,p) AS api_denied
FROM canonical CROSS JOIN unnest(ARRAY['anon','authenticated','service_role'])r
CROSS JOIN unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'])p ORDER BY oid::regclass::text,r,p;
SELECT n.nspname,r,NOT has_schema_privilege(r,n.oid,'USAGE') AS usage_denied,NOT has_schema_privilege(r,n.oid,'CREATE') AS create_denied,
 pg_get_userbyid(n.nspowner)='postgres' AS owner_verified
FROM pg_namespace n CROSS JOIN unnest(ARRAY['anon','authenticated','service_role'])r WHERE n.nspname IN('twuanis_private','twuanis_canonical_private');
-- Expected empty: any disabled canonical/FK guard is a reopen blocker.
SELECT tgrelid::regclass,tgname,tgenabled FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname IN('public','twuanis_canonical_private') AND tgenabled NOT IN('O','A');
