\set ON_ERROR_STOP on
BEGIN;
DO $$ BEGIN IF current_database()<>'cg_s7_customer' OR inet_server_addr() IS NOT NULL THEN RAISE EXCEPTION 'disposable only';END IF;END $$;
CREATE TEMP TABLE checks(label text PRIMARY KEY);
CREATE FUNCTION pg_temp.ok(v boolean,label text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF v IS NOT TRUE THEN RAISE EXCEPTION 'FAIL %',label;END IF;INSERT INTO checks VALUES(label);END $$;
CREATE FUNCTION pg_temp.reject(q text,expected text,label text) RETURNS void LANGUAGE plpgsql AS $$ DECLARE code text;BEGIN BEGIN EXECUTE q;EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS code=RETURNED_SQLSTATE;END;PERFORM pg_temp.ok(code IS NOT DISTINCT FROM expected,label||' '||coalesce(code,'success'));END $$;
SELECT pg_temp.ok((SELECT publication_duration_seconds=2592000 FROM package_limits l JOIN packages p ON p.id=l.package_id WHERE p.slug='market-explorer'),'Market Explorer explicit30days');
INSERT INTO auth.users(id) VALUES('07000000-0000-0000-0000-000000001201');
SELECT twuanis_canonical_private.ensure_publisher_account('07000000-0000-0000-0000-000000001201');
INSERT INTO packages(id,slug,billing_interval) VALUES('07000000-0000-0000-0000-000000001202','s7-customer-fixture','monthly');
INSERT INTO package_limits(package_id,listing_limit,publication_duration_seconds) VALUES('07000000-0000-0000-0000-000000001202',1,2592000);
UPDATE user_subscriptions SET status='cancelled' WHERE user_id='07000000-0000-0000-0000-000000001201';
INSERT INTO user_subscriptions(user_id,package_id,status,billing_cycle,current_period_start,current_period_end) VALUES('07000000-0000-0000-0000-000000001201','07000000-0000-0000-0000-000000001202','active','monthly',clock_timestamp()-interval '1 day',clock_timestamp()+interval '1 year');
SELECT set_config('request.jwt.claim.sub','07000000-0000-0000-0000-000000001201',true);
SELECT public.create_customer_canonical_listing(gen_random_uuid(),'{"transaction":"sale","geography":{"province":"3","canton":"304"},"semantics":{"property_type":["1"]},"money":{"amount":"1","currency":"CRC"}}')->>'listing_id' AS lid \gset
SELECT public.publish_customer_canonical_listing(:'lid',1,'07000000-0000-0000-0000-000000001203','publish');
SELECT pg_temp.ok((SELECT listing_status='active' AND publication_expires_at-published_at=interval '2592000 seconds' AND canonical_revision=2 FROM listings WHERE id=:'lid'),'publish via canonical lifecycle with entitlement');
CREATE TEMP TABLE old_deadline AS SELECT publication_expires_at FROM listings WHERE id=:'lid';
UPDATE packages SET billing_interval='annual' WHERE id='07000000-0000-0000-0000-000000001202';
SELECT pg_temp.ok((SELECT publication_expires_at=(SELECT publication_expires_at FROM old_deadline) FROM listings WHERE id=:'lid'),'billing change does not change deadline');
SELECT public.publish_customer_canonical_listing(:'lid',2,'07000000-0000-0000-0000-000000001204','renew');
SELECT pg_temp.ok((SELECT publication_expires_at=(SELECT publication_expires_at+interval '2592000 seconds' FROM old_deadline) FROM listings WHERE id=:'lid'),'active renewal uses explicit duration not annual billing');
UPDATE old_deadline SET publication_expires_at=(SELECT publication_expires_at FROM listings WHERE id=:'lid');
UPDATE package_limits SET publication_duration_seconds=7776000 WHERE package_id='07000000-0000-0000-0000-000000001202';
SELECT pg_temp.ok((SELECT publication_expires_at=(SELECT publication_expires_at FROM old_deadline) FROM listings WHERE id=:'lid'),'entitlement change no retroactive deadline');
SELECT pg_temp.ok((public.publish_customer_canonical_listing(:'lid',2,'07000000-0000-0000-0000-000000001204','renew')->>'replayed')::boolean,'renew retry reuses old authorized duration');
SELECT pg_temp.ok((SELECT publication_expires_at=(SELECT publication_expires_at FROM old_deadline) FROM listings WHERE id=:'lid'),'renew retry no extension');
SELECT public.publish_customer_canonical_listing(:'lid',3,'07000000-0000-0000-0000-000000001205','renew');
SELECT pg_temp.ok((SELECT publication_expires_at=(SELECT publication_expires_at+interval '7776000 seconds' FROM old_deadline) FROM listings WHERE id=:'lid'),'new renewal uses updated explicit entitlement');
SELECT pg_temp.reject(format('SELECT public.publish_customer_canonical_listing(%L,4,%L,''renew'')',:'lid','07000000-0000-0000-0000-000000001205'),'22023','reused request changed expected rejected');
UPDATE package_limits SET publication_duration_seconds=NULL WHERE package_id='07000000-0000-0000-0000-000000001202';
SELECT pg_temp.reject(format('SELECT public.publish_customer_canonical_listing(%L,4,gen_random_uuid(),''renew'')',:'lid'),'55000','null duration rejects renewal despite capacity');
SELECT pg_temp.reject($q$UPDATE package_limits SET publication_duration_seconds=0 WHERE package_id='07000000-0000-0000-0000-000000001202'$q$,'23514','zero invalid');
SELECT pg_temp.reject($q$UPDATE package_limits SET publication_duration_seconds=-1 WHERE package_id='07000000-0000-0000-0000-000000001202'$q$,'23514','negative invalid');
SELECT pg_temp.reject($q$UPDATE package_limits SET publication_duration_seconds=315576001 WHERE package_id='07000000-0000-0000-0000-000000001202'$q$,'23514','upper bound preserved');
UPDATE package_limits SET publication_duration_seconds=2592000,listing_limit=0 WHERE package_id='07000000-0000-0000-0000-000000001202';
SELECT pg_temp.reject(format('SELECT public.publish_customer_canonical_listing(%L,4,gen_random_uuid(),''renew'')',:'lid'),'23514','overcapacity renewal denied despite valid duration');
SELECT pg_temp.ok((SELECT listing_status='active' FROM listings WHERE id=:'lid'),'downgrade retains active listing');
UPDATE package_limits SET listing_limit=1 WHERE package_id='07000000-0000-0000-0000-000000001202';
SELECT public.create_customer_canonical_listing(gen_random_uuid(),'{"transaction":"rent","geography":{"province":"3","canton":"304"},"semantics":{"property_type":["1"]},"money":{"amount":"1","currency":"USD"}}')->>'listing_id' AS second \gset
SELECT pg_temp.reject(format('SELECT public.publish_customer_canonical_listing(%L,1,gen_random_uuid(),''publish'')',:'second'),'23514','at capacity new publication denied');
-- Actual authenticated role cannot choose another identity or write the entitlement.
GRANT SELECT,UPDATE ON package_limits TO authenticated;
GRANT INSERT ON checks TO authenticated;
SET LOCAL ROLE authenticated;
SELECT pg_temp.reject($q$UPDATE public.package_limits SET publication_duration_seconds=7776000 WHERE package_id='07000000-0000-0000-0000-000000001202'$q$,'42501','table-wide legacy grant cannot change new entitlement');
RESET ROLE;
-- Controlled fixture time setup; exercising real expired-renewal machinery.
UPDATE listings SET listing_status='expired',publication_expires_at=clock_timestamp()-interval '1 day' WHERE id=:'lid';
SELECT public.publish_customer_canonical_listing(:'lid',4,'07000000-0000-0000-0000-000000001206','renew');
SELECT pg_temp.ok((SELECT publication_expires_at-renewed_at=interval '2592000 seconds' AND canonical_revision=5 FROM listings WHERE id=:'lid'),'expired renewal starts at renewal time');
DELETE FROM package_limits WHERE package_id='07000000-0000-0000-0000-000000001202';
SELECT pg_temp.reject(format('SELECT public.publish_customer_canonical_listing(%L,5,gen_random_uuid(),''renew'')',:'lid'),'55000','missing entitlement record denied');
SELECT set_config('request.jwt.claim.sub','',true);
SELECT pg_temp.reject(format('SELECT public.publish_customer_canonical_listing(%L,4,gen_random_uuid(),''renew'')',:'lid'),'42501','unauthenticated denied');
SELECT pg_temp.ok(NOT has_function_privilege('anon','public.publish_customer_canonical_listing(uuid,bigint,uuid,text)','EXECUTE'),'anon no wrapper execution');
SELECT pg_temp.ok(NOT has_table_privilege('authenticated','twuanis_canonical_private.customer_publication_commands','INSERT'),'customer cannot fabricate duration snapshot');
SELECT count(*) AS assertions FROM checks;
ROLLBACK;
