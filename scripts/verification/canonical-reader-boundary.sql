\set ON_ERROR_STOP on
BEGIN;
CREATE TEMP TABLE s6_results(name text);
CREATE FUNCTION pg_temp.assert(ok boolean,label text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'S6 failed: %',label; END IF; INSERT INTO s6_results VALUES(label); END $$;
SELECT pg_temp.assert(has_function_privilege('service_role','public.read_canonical_listing_evidence(uuid[],text[],text[])','EXECUTE'),'server execute');
SELECT pg_temp.assert(NOT has_function_privilege('anon','public.read_canonical_listing_evidence(uuid[],text[],text[])','EXECUTE'),'anon denied');
SELECT pg_temp.assert(NOT has_function_privilege('authenticated','public.read_canonical_listing_evidence(uuid[],text[],text[])','EXECUTE'),'authenticated denied');
SELECT pg_temp.assert(NOT EXISTS(SELECT 1 FROM pg_proc p,LATERAL aclexplode(p.proacl) a WHERE p.oid='public.read_canonical_listing_evidence(uuid[],text[],text[])'::regprocedure AND a.grantee=0),'public denied');
SELECT pg_temp.assert(NOT has_table_privilege(r,t,'SELECT'),r||' table denied '||t) FROM unnest(ARRAY['anon','authenticated','service_role']) r CROSS JOIN unnest(ARRAY['public.listing_fact_evidence','public.listing_semantic_selections']) t;
SELECT pg_temp.assert(p.provolatile='s' AND p.prosecdef AND p.proowner='postgres'::regrole AND p.proconfig=ARRAY['search_path=pg_catalog'],'stable owner and search_path') FROM pg_proc p WHERE oid='public.read_canonical_listing_evidence(uuid[],text[],text[])'::regprocedure;
DELETE FROM public.listing_fact_evidence WHERE listing_id='70000000-0000-0000-0000-000000000004';
INSERT INTO public.listing_fact_evidence(listing_id,dimension,kind,exact_value,range_lower,range_upper,lower_inclusive,upper_inclusive,evidence_source) VALUES
('70000000-0000-0000-0000-000000000004','bedrooms','exact',3,NULL,NULL,NULL,NULL,'manual'),
('70000000-0000-0000-0000-000000000004','parking','range',NULL,1,5,true,false,'manual');
INSERT INTO public.listing_semantic_selections VALUES('70000000-0000-0000-0000-000000000004','terrain',9007199254740993,now()) ON CONFLICT DO NOTHING;
INSERT INTO public.ontology_terms(id,term_name,term_type,level) VALUES(9100000000000001,'Category 2','bathrooms',1);
INSERT INTO public.listing_fact_evidence(listing_id,dimension,kind,category_term_id,evidence_source) VALUES('70000000-0000-0000-0000-000000000004','bathrooms','category',9100000000000001,'manual');
SELECT pg_temp.assert(public.read_canonical_listing_evidence(ARRAY['70000000-0000-0000-0000-000000000004'::uuid],ARRAY['bathrooms'],'{}')#>>'{0,facts,0,category_term_id}'='9100000000000001','category identity');
CREATE TEMP TABLE s6_payload AS SELECT public.read_canonical_listing_evidence(ARRAY['70000000-0000-0000-0000-000000000004'::uuid],ARRAY['bedrooms','parking'],ARRAY['terrain']) v;
SELECT pg_temp.assert(jsonb_array_length(v)=1,'bounded identity') FROM s6_payload;
SELECT pg_temp.assert(v#>>'{0,facts,0,kind}'='exact' AND v#>>'{0,facts,0,exact_value}'='3','exact typed value') FROM s6_payload;
SELECT pg_temp.assert(v#>>'{0,facts,1,kind}'='range' AND v#>>'{0,facts,1,range_upper}'='5','range preserved') FROM s6_payload;
SELECT pg_temp.assert(v#>>'{0,selections,0,ontology_term_id}'='9007199254740993','lossless bigint') FROM s6_payload;
SELECT pg_temp.assert(NOT v::text ~ '(source|reference|recorded|observed|receipt|history|rule)','minimum fields') FROM s6_payload;
SELECT pg_temp.assert(public.read_canonical_listing_evidence(ARRAY['10000000-0000-0000-0000-000000000001'::uuid],'{}','{}')='[]','legacy omitted');
SELECT pg_temp.assert(public.read_canonical_listing_evidence(ARRAY['00000000-0000-0000-0000-000000000000'::uuid],'{}','{}')='[]','unrequested cannot leak');
DO $$ BEGIN
 BEGIN PERFORM public.read_canonical_listing_evidence('{}','{}','{}'); RAISE EXCEPTION 'empty accepted'; EXCEPTION WHEN invalid_parameter_value THEN PERFORM pg_temp.assert(true,'empty rejected'); END;
 BEGIN PERFORM public.read_canonical_listing_evidence(array_fill('70000000-0000-0000-0000-000000000004'::uuid,ARRAY[26]),'{}','{}'); RAISE EXCEPTION 'oversized accepted'; EXCEPTION WHEN invalid_parameter_value THEN PERFORM pg_temp.assert(true,'oversized rejected'); END;
 BEGIN PERFORM public.read_canonical_listing_evidence(ARRAY[NULL::uuid],'{}','{}'); RAISE EXCEPTION 'null accepted'; EXCEPTION WHEN invalid_parameter_value THEN PERFORM pg_temp.assert(true,'null rejected'); END;
 BEGIN PERFORM public.read_canonical_listing_evidence(ARRAY['70000000-0000-0000-0000-000000000004'::uuid],ARRAY['history'],'{}'); RAISE EXCEPTION 'dimension accepted'; EXCEPTION WHEN invalid_parameter_value THEN PERFORM pg_temp.assert(true,'dimension rejected'); END;
END $$;
SET LOCAL ROLE service_role;
SELECT public.read_canonical_listing_evidence(ARRAY['70000000-0000-0000-0000-000000000004'::uuid],ARRAY['bedrooms'],ARRAY['terrain']);
DO $$ BEGIN
 BEGIN PERFORM 1 FROM public.listing_fact_evidence; RAISE EXCEPTION 'direct facts readable'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM 1 FROM public.listing_semantic_selections; RAISE EXCEPTION 'direct semantics readable'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
 BEGIN PERFORM public.read_canonical_listing_evidence(ARRAY['70000000-0000-0000-0000-000000000004'::uuid],'{}','{}'); RAISE EXCEPTION 'anon callable'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 BEGIN PERFORM public.read_canonical_listing_evidence(ARRAY['70000000-0000-0000-0000-000000000004'::uuid],'{}','{}'); RAISE EXCEPTION 'authenticated callable'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SELECT count(*) AS assertions FROM s6_results;
ROLLBACK;

\set ON_ERROR_STOP on
BEGIN;
CREATE TEMP TABLE s6_legacy_results(label text);
CREATE FUNCTION pg_temp.check_legacy(ok boolean,label text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'S6 legacy failed: %',label; END IF; INSERT INTO s6_legacy_results VALUES(label); END $$;
SELECT pg_temp.check_legacy(twuanis_canonical_private.s6_legacy_normalize('  San José + ',true)='san-jose-plus','slug compatibility');
SELECT pg_temp.check_legacy(twuanis_canonical_private.s6_legacy_normalize('  Provincia Cartágo  ')='provincia cartago','name compatibility');
UPDATE public.listings SET province='Cartago',canton='Jiménez',district='Pejivalle',listing_status='active',transaction_type='sale' WHERE id='10000000-0000-0000-0000-000000000001';
SELECT pg_temp.check_legacy(EXISTS(SELECT 1 FROM public.read_legacy_geographic_candidates(ARRAY['cartago'],ARRAY['jimenez'],ARRAY['pejivalle'],'{}','sale') WHERE listing_id='10000000-0000-0000-0000-000000000001'),'bounded legacy candidate');
SELECT pg_temp.check_legacy(NOT EXISTS(SELECT 1 FROM public.read_legacy_geographic_candidates(ARRAY['san-jose'],'{}','{}','{}','sale') WHERE listing_id='10000000-0000-0000-0000-000000000001'),'unrelated province excluded');
SELECT pg_temp.check_legacy(NOT EXISTS(SELECT 1 FROM public.read_legacy_geographic_candidates(ARRAY['cartago'],'{}','{}','{}','rent') WHERE listing_id='10000000-0000-0000-0000-000000000001'),'transaction bounded');
SELECT pg_temp.check_legacy(jsonb_array_length(public.read_legacy_geography_dictionary(ARRAY['10000000-0000-0000-0000-000000000001'::uuid]))=3,'only relevant dictionary');
SELECT pg_temp.check_legacy(public.read_legacy_geography_dictionary(ARRAY['00000000-0000-0000-0000-000000000000'::uuid])='[]','no unrequested dictionary');
SELECT pg_temp.check_legacy(NOT has_function_privilege(r,f,'EXECUTE'),r||' denied '||f) FROM unnest(ARRAY['anon','authenticated']) r CROSS JOIN unnest(ARRAY['public.read_legacy_geography_dictionary(uuid[])','public.read_legacy_geographic_candidates(text[],text[],text[],text[],text)']) f;
SET LOCAL ROLE service_role;
SELECT * FROM public.read_legacy_geographic_candidates(ARRAY['cartago'],'{}','{}','{}','sale');
SELECT public.read_legacy_geography_dictionary(ARRAY['10000000-0000-0000-0000-000000000001'::uuid]);
RESET ROLE;
SELECT count(*) AS legacy_assertions FROM s6_legacy_results;
ROLLBACK;

\set ON_ERROR_STOP on
BEGIN;
CREATE TEMP TABLE s6_security_results(label text);
CREATE FUNCTION pg_temp.s6_secure(ok boolean,label text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'S6 security failed: %',label; END IF; INSERT INTO s6_security_results VALUES(label); END $$;
SELECT pg_temp.s6_secure(p.prosecdef AND p.provolatile='s' AND p.proowner='postgres'::regrole AND p.proconfig=ARRAY['search_path=pg_catalog'],'definer security '||p.proname) FROM pg_proc p WHERE p.oid IN ('public.read_legacy_geographic_candidates(text[],text[],text[],text[],text)'::regprocedure,'public.read_legacy_geography_dictionary(uuid[])'::regprocedure);
SELECT pg_temp.s6_secure(NOT EXISTS(SELECT 1 FROM aclexplode(p.proacl) a WHERE a.grantee=0),'no PUBLIC execute '||p.proname) FROM pg_proc p WHERE p.oid IN ('public.read_legacy_geographic_candidates(text[],text[],text[],text[],text)'::regprocedure,'public.read_legacy_geography_dictionary(uuid[])'::regprocedure);
SELECT pg_temp.s6_secure(NOT EXISTS(SELECT 1 FROM public.read_legacy_geographic_candidates(ARRAY['cartago'],'{}','{}','{}',NULL) c JOIN public.listings l ON l.id=c.listing_id WHERE l.canonical_domain_version=1),'canonical excluded');
SELECT pg_temp.s6_secure(public.read_legacy_geography_dictionary(ARRAY['70000000-0000-0000-0000-000000000004'::uuid])='[]','canonical not legacy dictionary');
DO $$ BEGIN
 BEGIN PERFORM public.read_legacy_geography_dictionary(array_fill('10000000-0000-0000-0000-000000000001'::uuid,ARRAY[26])); RAISE EXCEPTION 'oversized accepted'; EXCEPTION WHEN invalid_parameter_value THEN PERFORM pg_temp.s6_secure(true,'oversized denied'); END;
 BEGIN PERFORM public.read_legacy_geography_dictionary('{}'); RAISE EXCEPTION 'empty accepted'; EXCEPTION WHEN invalid_parameter_value THEN PERFORM pg_temp.s6_secure(true,'empty denied'); END;
 BEGIN PERFORM public.read_legacy_geography_dictionary(ARRAY[NULL::uuid]); RAISE EXCEPTION 'null accepted'; EXCEPTION WHEN invalid_parameter_value THEN PERFORM pg_temp.s6_secure(true,'null denied'); END;
 BEGIN PERFORM public.read_legacy_geographic_candidates('{}','{}','{}','{}',NULL); RAISE EXCEPTION 'unbounded accepted'; EXCEPTION WHEN invalid_parameter_value THEN PERFORM pg_temp.s6_secure(true,'unbounded denied'); END;
 BEGIN PERFORM public.read_legacy_geographic_candidates(ARRAY['x;DROP TABLE listings'],'{}','{}','{}',NULL); RAISE EXCEPTION 'malformed accepted'; EXCEPTION WHEN invalid_parameter_value THEN PERFORM pg_temp.s6_secure(true,'malformed denied'); END;
END $$;
SET LOCAL ROLE anon;
DO $$ BEGIN
 BEGIN PERFORM public.read_legacy_geography_dictionary(ARRAY['10000000-0000-0000-0000-000000000001'::uuid]); RAISE EXCEPTION 'anon dictionary callable'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.read_legacy_geographic_candidates(ARRAY['cartago'],'{}','{}','{}',NULL); RAISE EXCEPTION 'anon candidates callable'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 BEGIN PERFORM public.read_legacy_geography_dictionary(ARRAY['10000000-0000-0000-0000-000000000001'::uuid]); RAISE EXCEPTION 'authenticated dictionary callable'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.read_legacy_geographic_candidates(ARRAY['cartago'],'{}','{}','{}',NULL); RAISE EXCEPTION 'authenticated candidates callable'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SELECT count(*) AS security_assertions FROM s6_security_results;
ROLLBACK;
