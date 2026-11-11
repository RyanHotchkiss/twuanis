\set ON_ERROR_STOP on
BEGIN;
DO $$ BEGIN IF current_database()<>'cg_s7_measurement_clear' OR inet_server_addr() IS NOT NULL THEN RAISE EXCEPTION 'disposable only';END IF;END $$;
CREATE TEMP TABLE checks(label text);
CREATE FUNCTION pg_temp.ok(v boolean,t text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF v IS NOT TRUE THEN RAISE EXCEPTION 'FAIL %',t;END IF;INSERT INTO checks VALUES(t);END $$;
INSERT INTO auth.users(id) VALUES('07000000-0000-0000-0000-000000001701');
SELECT set_config('request.jwt.claim.sub','07000000-0000-0000-0000-000000001701',true);
SELECT public.create_customer_canonical_listing(gen_random_uuid(),'{"transaction":"sale","geography":{"province":"3","canton":"304"},"semantics":{"property_type":["1"]},"measurements":{"property_area":{"value":"85"}}}')->>'listing_id' AS lid \gset
SELECT public.mutate_customer_canonical_listing(:'lid',1,'07000000-0000-0000-0000-000000001702','{"lifecycle":{"event":"archive"}}');
SELECT pg_temp.ok((SELECT listing_status='archived' AND canonical_revision=2 AND property_area=85 FROM listings WHERE id=:'lid'),'archive preserves facts and advances revision');
SELECT public.mutate_customer_canonical_listing(:'lid',2,gen_random_uuid(),'{"lifecycle":{"event":"restore"}}');
SELECT pg_temp.ok((SELECT listing_status='draft' AND canonical_revision=3 FROM listings WHERE id=:'lid'),'restore');
SELECT public.mutate_customer_canonical_listing(:'lid',3,gen_random_uuid(),'{"lifecycle":{"event":"delete"}}');
SELECT pg_temp.ok((SELECT listing_status='deleted' AND canonical_revision=4 FROM listings WHERE id=:'lid'),'delete retains canonical identity');
SELECT public.mutate_customer_canonical_listing(:'lid',4,gen_random_uuid(),'{"lifecycle":{"event":"restore"}}');
SELECT pg_temp.ok((SELECT listing_status='draft' AND canonical_revision=5 FROM listings WHERE id=:'lid'),'restore deleted identity');
SELECT public.mutate_customer_canonical_listing(:'lid',1,'07000000-0000-0000-0000-000000001702','{"lifecycle":{"event":"archive"}}');
SELECT pg_temp.ok((SELECT listing_status='draft' AND canonical_revision=5 FROM listings WHERE id=:'lid'),'old archive replay cannot overwrite later restore');
-- Fixture-only active precondition; no application/publication policy is changed.
UPDATE listings SET listing_status='active',publication_expires_at=clock_timestamp()+interval '1 day' WHERE id=:'lid';
SELECT public.mutate_customer_canonical_listing(:'lid',5,gen_random_uuid(),'{"lifecycle":{"event":"unpublish"}}');
SELECT pg_temp.ok((SELECT listing_status='draft' AND canonical_revision=6 FROM listings WHERE id=:'lid'),'unpublish');
SELECT pg_temp.ok((SELECT count(*)=6 FROM listing_lifecycle_events WHERE listing_id=:'lid'),'creation and five mutations have lifecycle events, replay adds none');
SELECT 'LIFECYCLE SQL ASSERTIONS '||count(*) FROM checks;
ROLLBACK;
