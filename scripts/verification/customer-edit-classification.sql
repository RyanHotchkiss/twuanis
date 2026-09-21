\set ON_ERROR_STOP on
BEGIN;
DO $$ BEGIN IF current_database()<>'cg_s7_customer_edit' OR inet_server_addr() IS NOT NULL THEN RAISE EXCEPTION 'disposable only'; END IF; END $$;
CREATE TEMP TABLE checks(label text PRIMARY KEY);
CREATE FUNCTION pg_temp.ok(v boolean,label text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF v IS NOT TRUE THEN RAISE EXCEPTION 'FAIL %',label;END IF;INSERT INTO checks VALUES(label);END $$;
CREATE FUNCTION pg_temp.reject(q text,expected text,label text) RETURNS void LANGUAGE plpgsql AS $$ DECLARE code text;BEGIN BEGIN EXECUTE q;EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS code=RETURNED_SQLSTATE;END;PERFORM pg_temp.ok(code IS NOT DISTINCT FROM expected,label||' '||coalesce(code,'success'));END $$;
INSERT INTO auth.users(id) VALUES('07000000-0000-0000-0000-000000001401');
SELECT set_config('request.jwt.claim.sub','07000000-0000-0000-0000-000000001401',true);
SELECT public.create_customer_canonical_listing(gen_random_uuid(),'{"transaction":"sale","geography":{"province":"3","canton":"304"},"semantics":{"property_type":["1"]},"facts":{"bedrooms":{"kind":"exact","value":"6"},"bathrooms":{"kind":"exact","value":"0.5"}},"measurements":{"property_area":{"value":"850"},"construction_area":{"value":"70"}}}')->>'listing_id' AS lid \gset
SELECT twuanis_canonical_private.s3_command(:'lid',1,'owner','07000000-0000-0000-0000-000000001401',gen_random_uuid(),'{"facts":{"bedrooms":{"kind":"exact","value":"6","source":"owner","rule_set":"80000000-0000-0000-0000-000000000002"}},"measurements":{"property_area":{"value":"850","rule_set":"80000000-0000-0000-0000-000000000001"}}}',NULL);
CREATE TEMP TABLE sealed_before AS SELECT to_jsonb(r) value FROM listing_classification_rules r;
SELECT public.mutate_customer_canonical_listing(:'lid',2,'07000000-0000-0000-0000-000000001402','{"measurements":{"property_area":{"value":"50"},"construction_area":{"value":"80"}},"facts":{"bedrooms":{"kind":"exact","value":"7"},"bathrooms":{"kind":"exact","value":"1"}}}');
SELECT pg_temp.ok((SELECT property_area=50 AND construction_area=80 AND canonical_revision=3 FROM listings WHERE id=:'lid'),'new exact measures authoritative');
SELECT pg_temp.ok(EXISTS(SELECT 1 FROM listing_membership_origins m JOIN listing_classification_rules r ON r.id=m.classification_rule_id WHERE m.listing_id=:'lid' AND m.origin_domain='property_area' AND r.rule_set_id='80000000-0000-0000-0000-000000000001' AND r.ontology_term_id=7),'recorded rule set rederived lower band');
SELECT pg_temp.ok(NOT EXISTS(SELECT 1 FROM listing_membership_origins WHERE listing_id=:'lid' AND origin_domain='property_area' AND ontology_term_id=8),'obsolete band removed');
SELECT pg_temp.ok((SELECT exact_value=7 FROM listing_fact_evidence WHERE listing_id=:'lid' AND dimension='bedrooms'),'new exact fact authoritative');
SELECT pg_temp.ok(EXISTS(SELECT 1 FROM listing_membership_origins m JOIN listing_classification_rules r ON r.id=m.classification_rule_id WHERE m.listing_id=:'lid' AND m.origin_domain='bedrooms' AND r.rule_set_id='80000000-0000-0000-0000-000000000002'),'fact recorded rule preserved');
SELECT pg_temp.ok(NOT EXISTS(SELECT 1 FROM listing_membership_origins WHERE listing_id=:'lid' AND origin_domain IN ('bathrooms','construction_area')),'unclassified remains unclassified');
SELECT pg_temp.ok((SELECT exact_value=1 FROM listing_fact_evidence WHERE listing_id=:'lid' AND dimension='bathrooms'),'unclassified exact value not lost');
SELECT pg_temp.ok((public.mutate_customer_canonical_listing(:'lid',2,'07000000-0000-0000-0000-000000001402','{"measurements":{"property_area":{"value":"50"},"construction_area":{"value":"80"}},"facts":{"bedrooms":{"kind":"exact","value":"7"},"bathrooms":{"kind":"exact","value":"1"}}}')->>'replayed')::boolean,'retry stable');
SELECT pg_temp.reject(format('SELECT public.mutate_customer_canonical_listing(%L,3,%L,''{"measurements":{"property_area":{"value":"51"}}}'')',:'lid','07000000-0000-0000-0000-000000001402'),'22023','request payload conflict');
SELECT pg_temp.reject(format('SELECT public.mutate_customer_canonical_listing(%L,3,gen_random_uuid(),''{"measurements":{"property_area":{"value":"51","rule_set":"80000000-0000-0000-0000-000000000001"}}}'')',:'lid'),'22023','client rule rejected');
SELECT pg_temp.reject(format('SELECT public.mutate_customer_canonical_listing(%L,2,gen_random_uuid(),''{"measurements":{"property_area":{"value":"51"}}}'')',:'lid'),'40001','stale revision rejected');
SELECT pg_temp.ok((SELECT count(*)=1 FROM twuanis_canonical_private.customer_domain_edits WHERE listing_id=:'lid'),'failed commands roll back snapshots');
SELECT public.mutate_customer_canonical_listing(:'lid',3,gen_random_uuid(),'{"facts":{"distance_to_paved_road":{"kind":"range","lower":"100","upper":"500","lower_inclusive":true,"upper_inclusive":false}}}');
SELECT pg_temp.ok((SELECT kind='range' AND exact_value IS NULL AND range_lower=100 AND range_upper=500 AND lower_inclusive AND NOT upper_inclusive FROM listing_fact_evidence WHERE listing_id=:'lid' AND dimension='distance_to_paved_road'),'approved range remains evidence not exact measurement');
SELECT pg_temp.ok(NOT EXISTS((SELECT to_jsonb(r) FROM listing_classification_rules r) EXCEPT SELECT value FROM sealed_before),'sealed rules unchanged');
SELECT pg_temp.ok(NOT has_table_privilege('authenticated','twuanis_canonical_private.customer_domain_edits','INSERT'),'cannot forge stored rule choice');
SELECT pg_temp.ok(NOT has_function_privilege('service_role','public.mutate_customer_canonical_listing(uuid,bigint,uuid,jsonb)','EXECUTE'),'customer authority not service-role substitute');

SELECT public.edit_customer_canonical_listing(:'lid',4,'07000000-0000-0000-0000-000000001403','{"measurements":{"property_area":{"value":"100"}}}','{"title":"updated title"}');
SELECT pg_temp.ok((SELECT title='updated title' AND property_area=100 AND canonical_revision=5 FROM listings WHERE id=:'lid'),'atomic content and domains');
SELECT pg_temp.ok(EXISTS(SELECT 1 FROM listing_membership_origins m JOIN listing_classification_rules r ON r.id=m.classification_rule_id WHERE m.listing_id=:'lid' AND m.origin_domain='property_area' AND r.ontology_term_id=8),'exact band boundary reclassified');
SELECT public.edit_customer_canonical_listing(:'lid',5,gen_random_uuid(),'{}','{"title":"later title"}');
SELECT public.edit_customer_canonical_listing(:'lid',4,'07000000-0000-0000-0000-000000001403','{"measurements":{"property_area":{"value":"100"}}}','{"title":"updated title"}');
SELECT pg_temp.ok((SELECT title='later title' FROM listings WHERE id=:'lid'),'replay never rewrites later content');
SELECT pg_temp.reject(format('SELECT public.edit_customer_canonical_listing(%L,4,%L,''{"measurements":{"property_area":{"value":"100"}}}'',''{"title":"different"}'')',:'lid','07000000-0000-0000-0000-000000001403'),'22023','content request conflict');
SELECT pg_temp.reject(format('SELECT public.edit_customer_canonical_listing(%L,5,gen_random_uuid(),''{"measurements":{"property_area":{"value":"-1"}}}'',''{"title":"must rollback"}'')',:'lid'),'22023','invalid domain rolls back content');
SELECT pg_temp.ok((SELECT title='later title' AND property_area=100 FROM listings WHERE id=:'lid'),'atomic failure preserves both');
SELECT pg_temp.reject(format('SELECT public.edit_customer_canonical_listing(%L,5,gen_random_uuid(),''{}'',''{"owner_id":"spoof"}'')',:'lid'),'22023','protected content rejected');
SELECT public.mutate_customer_canonical_listing(:'lid',5,gen_random_uuid(),'{"facts":{"distance_to_paved_road":{"kind":"exact","value":"123"}}}');
SELECT pg_temp.reject(format('SELECT public.mutate_customer_canonical_listing(%L,6,gen_random_uuid(),''{"facts":{"distance_to_paved_road":{"kind":"range","lower":"100","upper":"500","lower_inclusive":true,"upper_inclusive":false}}}'')',:'lid'),'22023','range cannot degrade established exact distance');
SELECT pg_temp.ok((SELECT kind='exact' AND exact_value=123 FROM listing_fact_evidence WHERE listing_id=:'lid' AND dimension='distance_to_paved_road'),'exact distance preserved');
SELECT pg_temp.ok((public.mutate_customer_canonical_listing(:'lid',2,'07000000-0000-0000-0000-000000001402','{"measurements":{"property_area":{"value":"50"},"construction_area":{"value":"80"}},"facts":{"bedrooms":{"kind":"exact","value":"7"},"bathrooms":{"kind":"exact","value":"1"}}}')->>'replayed')::boolean,'domain replay after later edits');
SELECT pg_temp.ok((SELECT property_area=100 AND canonical_revision=6 FROM listings WHERE id=:'lid'),'replay does not reapply old measurement');

-- Targeted compatibility: a receipt established without the new snapshot table.
SELECT twuanis_canonical_private.s3_command(:'lid',6,'owner','07000000-0000-0000-0000-000000001401','07000000-0000-0000-0000-000000001404','{"facts":{"distance_to_paved_road":{"kind":"range","lower":"100","upper":"500","lower_inclusive":true,"upper_inclusive":false,"source":"owner"}}}',NULL);
SELECT public.mutate_customer_canonical_listing(:'lid',7,gen_random_uuid(),'{"facts":{"distance_to_paved_road":{"kind":"exact","value":"124"}}}');
SELECT pg_temp.ok((public.mutate_customer_canonical_listing(:'lid',6,'07000000-0000-0000-0000-000000001404','{"facts":{"distance_to_paved_road":{"kind":"range","lower":"100","upper":"500","lower_inclusive":true,"upper_inclusive":false}}}')->>'replayed')::boolean,'pre-snapshot receipt replay preserved');
SELECT pg_temp.ok((SELECT kind='exact' AND exact_value=124 FROM listing_fact_evidence WHERE listing_id=:'lid' AND dimension='distance_to_paved_road'),'old receipt cannot undo later exact distance');
SELECT count(*) assertions FROM checks;
ROLLBACK;
