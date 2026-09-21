\set ON_ERROR_STOP on
-- Read-only aggregate evidence: output counts/hashes, never row contents.
-- Missing pre-canonical reference objects are recorded before installation;
-- all must be present at the post-installation/final gate.
BEGIN TRANSACTION READ ONLY;
DO $snapshot$
DECLARE t text; n bigint; digest text;
BEGIN
 FOREACH t IN ARRAY ARRAY['public.account_permissions','public.add_on_product_packages','public.add_on_products','public.engines','public.entitlements','public.fx_rates','public.geography_import','public.ontology_relationships','public.ontology_terms','public.package_account_permissions','public.package_engines','public.package_entitlements','public.package_limits','public.packages','auth.users','public.listing_classification_rule_sets','public.listing_classification_rules','public.capacity_policy_guard','twuanis_canonical_private.classification_seals','twuanis_canonical_private.accessibility_identity'] LOOP
  IF to_regclass(t) IS NULL THEN RAISE NOTICE 'REFERENCE %',jsonb_build_object('table',t,'present',false);CONTINUE;END IF;
  EXECUTE format('SELECT count(*),md5(coalesce(string_agg(row_text,E''\n'' ORDER BY row_text COLLATE "C"),'''')) FROM(SELECT to_jsonb(x)::text row_text FROM %s x)s',t) INTO n,digest;
  RAISE NOTICE 'REFERENCE %',jsonb_build_object('table',t,'present',true,'count',n,'digest',digest);
 END LOOP;
END $snapshot$;
ROLLBACK;
