-- READ ONLY post-installation/closure evidence. Every verified result must be true.
WITH expected(signature,security,setting,auth_execute,service_execute) AS (VALUES
('twuanis_private.normalize_geographic_projection(text)','INVOKER','search_path=pg_catalog, pg_temp',false,false),
('twuanis_private.write_listing_canonical(uuid,text,text,text,text,text,uuid,boolean)','INVOKER','search_path=pg_catalog, pg_temp',false,false),
('public.write_my_listing_canonical(uuid,text,text,text,text,text)','DEFINER','search_path=pg_catalog, pg_temp',false,false),
('public.write_listing_canonical_server(uuid,text,text,text,text,text)','DEFINER','search_path=pg_catalog, pg_temp',false,false),
('twuanis_canonical_private.finite_numeric(numeric)','INVOKER','search_path=pg_catalog, pg_temp',false,false),
('twuanis_canonical_private.reject_immutable_mutation()','INVOKER','search_path=pg_catalog, pg_temp',false,false),
('twuanis_canonical_private.validate_new_term_reference()','INVOKER','search_path=pg_catalog, pg_temp',false,false),
('twuanis_canonical_private.validate_classification_rule()','INVOKER','search_path=pg_catalog, pg_temp',false,false),
('twuanis_canonical_private.initialize_capacity_guard()','INVOKER','search_path=pg_catalog, pg_temp',false,false),
('twuanis_canonical_private.lock_capacity_policy(boolean)','INVOKER','search_path=pg_catalog, pg_temp',false,false),
('twuanis_canonical_private.ensure_publisher_account(uuid)','INVOKER','search_path=pg_catalog, pg_temp',false,false),
('twuanis_canonical_private.lock_publisher(uuid)','INVOKER','search_path=pg_catalog, pg_temp',false,false),
('twuanis_canonical_private.resolve_publisher(uuid)','INVOKER','search_path=pg_catalog, pg_temp',false,false),
('twuanis_canonical_private.publisher_allowance(uuid,uuid)','INVOKER','search_path=pg_catalog, pg_temp',false,false),
('twuanis_canonical_private.publisher_consumption(uuid,uuid)','INVOKER','search_path=pg_catalog, pg_temp',false,false),
('twuanis_canonical_private.capacity_state(bigint,bigint)','INVOKER','search_path=pg_catalog, pg_temp',false,false),
('twuanis_canonical_private.s3_sealed_rule_guard()','INVOKER','search_path=pg_catalog, pg_temp',false,false),
('twuanis_canonical_private.s3_seal_classification(uuid)','INVOKER','search_path=pg_catalog, pg_temp',false,false),
('twuanis_canonical_private.s3_keys(jsonb,text[],text[])','INVOKER','search_path=pg_catalog, pg_temp',false,false),
('twuanis_canonical_private.s3_decimal(jsonb)','INVOKER','search_path=pg_catalog, pg_temp',false,false),
('twuanis_canonical_private.s3_term_ids(jsonb)','INVOKER','search_path=pg_catalog, pg_temp',false,false),
('twuanis_canonical_private.s3_geography(jsonb)','INVOKER','search_path=pg_catalog, pg_temp',false,false),
('twuanis_canonical_private.s3_origins(uuid,text,bigint[],uuid)','INVOKER','search_path=pg_catalog, pg_temp',false,false),
('twuanis_canonical_private.s3_command(uuid,bigint,text,text,uuid,jsonb,jsonb)','INVOKER','search_path=pg_catalog, pg_temp',false,false),
('twuanis_canonical_private.s4_domains(jsonb,text)','INVOKER','search_path=pg_catalog, pg_temp',false,false),
('twuanis_canonical_private.s4_create_core(uuid,uuid,jsonb,jsonb)','INVOKER','search_path=pg_catalog, pg_temp',false,false),
('public.create_customer_canonical_listing(uuid,jsonb)','DEFINER','search_path=pg_catalog, pg_temp',true,false),
('public.create_trusted_canonical_listing(uuid,jsonb,jsonb)','DEFINER','search_path=pg_catalog, pg_temp',false,true),
('public.mutate_customer_canonical_listing(uuid,bigint,uuid,jsonb)','DEFINER','search_path=pg_catalog, pg_temp',true,false),
('public.mutate_trusted_canonical_listing(uuid,bigint,uuid,jsonb,jsonb)','DEFINER','search_path=pg_catalog, pg_temp',false,true),
('public.assign_default_market_package()','DEFINER','search_path=pg_catalog, pg_temp',false,false),
('public.approve_sinpe_payment(uuid)','DEFINER','search_path=pg_catalog, pg_temp',true,false),
('public.activate_purchase(uuid)','DEFINER','search_path=pg_catalog, pg_temp',false,true),
('public.read_canonical_listing_evidence(uuid[],text[],text[])','DEFINER','search_path=pg_catalog',false,true),
('twuanis_canonical_private.s6_legacy_normalize(text,boolean)','INVOKER','search_path=pg_catalog',false,false),
('public.read_legacy_geographic_candidates(text[],text[],text[],text[],text)','DEFINER','search_path=pg_catalog',false,true),
('public.read_legacy_geography_dictionary(uuid[])','DEFINER','search_path=pg_catalog',false,true),
('twuanis_canonical_private.set_import_operator(uuid,boolean)','DEFINER','search_path=pg_catalog',false,false),
('public.is_current_user_import_operator()','DEFINER','search_path=pg_catalog',true,false),
('public.create_csv_canonical_listing(uuid,jsonb,jsonb)','DEFINER','search_path=pg_catalog',false,true),
('public.initially_publish_csv_listing(uuid)','DEFINER','search_path=pg_catalog',false,true),
('twuanis_canonical_private.guard_publication_entitlement()','INVOKER','search_path=pg_catalog',false,false),
('public.publish_customer_canonical_listing(uuid,bigint,uuid,text)','DEFINER','search_path=pg_catalog',true,false),
('public.prepare_customer_duplicate(uuid,uuid)','DEFINER','search_path=pg_catalog, pg_temp',true,false),
('public.attach_customer_duplicate_media(uuid)','DEFINER','search_path=pg_catalog, pg_temp',false,true),
('twuanis_canonical_private.guard_duplicate_publication()','DEFINER','search_path=pg_catalog, pg_temp',false,false),
('public.edit_customer_canonical_listing(uuid,bigint,uuid,jsonb,jsonb)','DEFINER','search_path=pg_catalog, pg_temp',true,false),
('public.prepare_token_canonical_listing(text,uuid,jsonb,jsonb)','DEFINER','search_path=pg_catalog, pg_temp',false,true),
('public.get_token_canonical_operation(text,uuid)','DEFINER','search_path=pg_catalog, pg_temp',false,true),
('public.attach_token_canonical_media(text,uuid)','DEFINER','search_path=pg_catalog, pg_temp',false,true),
('public.publish_token_canonical_listing(text)','DEFINER','search_path=pg_catalog, pg_temp',true,false),
('twuanis_canonical_private.guard_token_media_publication()','DEFINER','search_path=pg_catalog, pg_temp',false,false),
('twuanis_canonical_private.guard_token_snapshot()','DEFINER','search_path=pg_catalog, pg_temp',false,false),
('twuanis_canonical_private.reject_csv_evidence_change()','INVOKER','search_path=pg_catalog',false,false),
('public.retain_csv_source_evidence(jsonb,jsonb)','DEFINER','search_path=pg_catalog, pg_temp',false,true),
('public.complete_csv_source_references(uuid,uuid)','DEFINER','search_path=pg_catalog, pg_temp',false,true),
('twuanis_canonical_private.guard_csv_source_reference_completion()','DEFINER','search_path=pg_catalog, pg_temp',false,false),
('public.prepare_ordinary_upload(uuid,uuid,integer)','DEFINER','search_path=pg_catalog, pg_temp',false,true),
('public.get_ordinary_upload(uuid,uuid)','DEFINER','search_path=pg_catalog, pg_temp',false,true),
('public.attach_ordinary_upload(uuid,uuid)','DEFINER','search_path=pg_catalog, pg_temp',false,true),
('public.detach_listing_image(uuid,uuid,text)','DEFINER','search_path=pg_catalog, pg_temp',false,true),
('public.get_image_detach_operation(uuid,uuid)','DEFINER','search_path=pg_catalog, pg_temp',false,true),
('public.confirm_image_cleanup(uuid,uuid)','DEFINER','search_path=pg_catalog, pg_temp',false,true),
('public.claim_abandoned_listing_token(uuid)','DEFINER','search_path=pg_catalog, pg_temp',false,true),
('public.ingest_canonical_source_observation(uuid,jsonb)','DEFINER','search_path=pg_catalog, pg_temp',false,true),
('public.complete_canonical_source_run(text,uuid,timestamptz,jsonb,jsonb)','DEFINER','search_path=pg_catalog, pg_temp',false,true),
('twuanis_canonical_private.s11_image_trim(text)','INVOKER','search_path=pg_catalog, pg_temp',false,false),
('twuanis_canonical_private.s11_image_string(jsonb,boolean)','INVOKER','search_path=pg_catalog, pg_temp',false,false),
('public.reorder_listing_images(uuid,uuid,text,text[])','DEFINER','search_path=pg_catalog, pg_temp',false,true)
), actual AS (
 SELECT e.*,p.oid,p.proowner,p.prosecdef,p.proconfig,p.proacl,p.proname,p.pronamespace
 FROM expected e LEFT JOIN pg_proc p ON p.oid=to_regprocedure(e.signature)
)
SELECT signature,oid IS NOT NULL AS exists,
 pg_get_userbyid(proowner)='postgres' AS owner_verified,
 prosecdef=(security='DEFINER') AS security_verified,
 EXISTS(SELECT 1 FROM unnest(proconfig)c WHERE replace(c,' ','')=replace(setting,' ','')) AS search_path_verified,
 NOT EXISTS(SELECT 1 FROM aclexplode(coalesce(proacl,acldefault('f',proowner)))a WHERE a.grantee=0 AND a.privilege_type='EXECUTE') AS public_denied,
 NOT coalesce(has_function_privilege('anon',oid,'EXECUTE'),true) AS anon_denied,
 coalesce(has_function_privilege('authenticated',oid,'EXECUTE')=auth_execute,false) AS authenticated_verified,
 coalesce(has_function_privilege('service_role',oid,'EXECUTE')=service_execute,false) AS service_verified,
 NOT EXISTS(SELECT 1 FROM pg_proc other WHERE other.pronamespace=actual.pronamespace AND other.proname=actual.proname
 AND NOT EXISTS(SELECT 1 FROM expected e WHERE to_regprocedure(e.signature)=other.oid)
 AND (has_function_privilege('anon',other.oid,'EXECUTE') OR has_function_privilege('authenticated',other.oid,'EXECUTE') OR has_function_privilege('service_role',other.oid,'EXECUTE'))) AS no_broader_overload
FROM actual ORDER BY signature;

SELECT r,t,p,NOT has_table_privilege(r,t,p) AS denied
FROM unnest(ARRAY['anon','authenticated','service_role']) r
CROSS JOIN unnest(ARRAY['public.listings','public.listings_ontology_terms'])t
CROSS JOIN unnest(ARRAY['INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'])p;
SELECT r,t,p,NOT has_table_privilege(r,t,p) AS denied
FROM unnest(ARRAY['anon','authenticated','service_role']) r
CROSS JOIN unnest(ARRAY['public.ontology_terms','public.entitlements','public.package_entitlements','public.package_limits','public.packages','public.user_subscriptions','public.saved_analyses','public.listing_publish_tokens','public.payment_reviewers'])t
CROSS JOIN unnest(ARRAY['TRUNCATE','REFERENCES','TRIGGER'])p;
SELECT r,c.oid::regclass AS object,a.attname,p,NOT has_column_privilege(r,c.oid,a.attnum,p) AS denied
FROM pg_class c JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped
CROSS JOIN unnest(ARRAY['anon','authenticated','service_role'])r CROSS JOIN unnest(ARRAY['INSERT','UPDATE','REFERENCES'])p
WHERE c.oid IN('public.listings'::regclass,'public.listings_ontology_terms'::regclass);
SELECT r,NOT has_function_privilege(r,'public.recover_listing_measurement(uuid,text,numeric,text,text,text,text)','EXECUTE') AS obsolete_denied
FROM unnest(ARRAY['anon','authenticated','service_role'])r;
SELECT has_table_privilege('service_role','public.ontology_terms','SELECT') AS required_ontology_read;
SELECT rolname,rolsuper,rolbypassrls,rolcreaterole,rolinherit,rolcanlogin FROM pg_roles WHERE rolname IN('anon','authenticated','service_role');
-- Empty expected. Any new reachable role requires reviewed closure before reopening.
SELECT r,other.rolname FROM unnest(ARRAY['anon','authenticated','service_role'])r CROSS JOIN pg_roles other
WHERE r<>other.rolname AND pg_has_role(r,other.oid,'MEMBER');
-- Empty expected: API ownership cannot be closed by revocation alone.
SELECT n.nspname,c.relname,pg_get_userbyid(c.relowner) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname IN('public','twuanis_canonical_private','twuanis_private') AND pg_get_userbyid(c.relowner) IN('anon','authenticated','service_role');

-- C2-R5: exact relationship authority, including inherited and column-level paths.
SELECT has_table_privilege('service_role','public.ontology_relationships','SELECT') AS relationship_server_read_verified;
SELECT r,p,NOT has_table_privilege(r,'public.ontology_relationships',p) AS relationship_mutation_denied
FROM unnest(ARRAY['anon','authenticated','service_role'])r
CROSS JOIN unnest(ARRAY['INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN'])p;
SELECT r,a.attname,p,NOT has_column_privilege(r,a.attrelid,a.attnum,p) AS relationship_column_mutation_denied
FROM pg_attribute a CROSS JOIN unnest(ARRAY['anon','authenticated','service_role'])r
CROSS JOIN unnest(ARRAY['INSERT','UPDATE','REFERENCES'])p
WHERE a.attrelid='public.ontology_relationships'::regclass AND a.attnum>0 AND NOT a.attisdropped;
SELECT pg_get_userbyid(c.relowner)='postgres' AS relationship_owner_verified,
 c.relrowsecurity AS relationship_rls_verified,
 NOT c.relforcerowsecurity AS relationship_force_rls_unchanged,
 NOT EXISTS(SELECT 1 FROM aclexplode(coalesce(c.relacl,acldefault('r',c.relowner)))a WHERE a.grantee=0) AS relationship_public_denied,
 NOT EXISTS(SELECT 1 FROM pg_attribute col CROSS JOIN LATERAL aclexplode(col.attacl)a WHERE col.attrelid=c.oid AND a.grantee=0) AS relationship_public_columns_denied
FROM pg_class c WHERE c.oid='public.ontology_relationships'::regclass;
