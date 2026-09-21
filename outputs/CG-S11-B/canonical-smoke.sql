\set ON_ERROR_STOP on
-- S11-C separately authorized checkpoint: controlled transactional smoke only.
-- psql variables: owner = reviewed retained user UUID, property_term = reviewed
-- level-1 property_type ID. Geography uses reviewed official codes 3 / 304.
-- All fixture operations ROLLBACK; do not replace this with COMMIT.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
SELECT set_config('request.jwt.claim.sub',:'owner',true);
CREATE FUNCTION pg_temp.s11_assert(v boolean,label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF v IS DISTINCT FROM true THEN RAISE EXCEPTION 'S11 smoke failed: %',label; END IF;END $$;
SET LOCAL ROLE authenticated;
SELECT public.create_customer_canonical_listing(gen_random_uuid(),jsonb_build_object(
 'transaction','sale','geography',jsonb_build_object('province','3','canton','304'),
 'semantics',jsonb_build_object('property_type',jsonb_build_array(:'property_term')),
 'money',jsonb_build_object('amount','0.5','currency','CRC')))->>'listing_id' AS lid \gset
RESET ROLE;
SELECT pg_temp.s11_assert(current_price=0.5 AND canonical_domain_version=1,'customer creation') FROM listings WHERE id=:'lid';
SELECT canonical_revision AS rev FROM listings WHERE id=:'lid' \gset
SET LOCAL ROLE authenticated;
SELECT public.edit_customer_canonical_listing(:'lid',:rev,gen_random_uuid(),'{"measurements":{"property_area":{"value":"250"}},"facts":{"year_built":{"kind":"exact","value":"1995"}}}', '{"title":"S11 transactional smoke"}');
RESET ROLE;
SELECT pg_temp.s11_assert(property_area=250 AND title='S11 transactional smoke','domain/content edit') FROM listings WHERE id=:'lid';
SELECT canonical_revision AS rev FROM listings WHERE id=:'lid' \gset
SET LOCAL ROLE authenticated;
SELECT public.publish_customer_canonical_listing(:'lid',:rev,gen_random_uuid(),'publish');
RESET ROLE;
SELECT publication_expires_at::text AS prior_deadline,canonical_revision AS rev FROM listings WHERE id=:'lid' \gset
SET LOCAL ROLE authenticated;
SELECT public.publish_customer_canonical_listing(:'lid',:rev,gen_random_uuid(),'renew');
RESET ROLE;
SELECT pg_temp.s11_assert(listing_status='active' AND publication_expires_at>:'prior_deadline'::timestamptz,'publication/renewal') FROM listings WHERE id=:'lid';
SET LOCAL ROLE authenticated;
SELECT public.prepare_customer_duplicate(:'lid',gen_random_uuid())->>'listing_id' AS duplicate_id \gset
RESET ROLE;
SELECT pg_temp.s11_assert(id<>:'lid'::uuid AND listing_status='draft' AND property_area=250,'independent canonical duplicate') FROM listings WHERE id=:'duplicate_id';
SET LOCAL ROLE service_role;
SELECT public.prepare_ordinary_upload(:'owner',:'lid',100)->>'id' AS upload_a \gset
SELECT public.attach_ordinary_upload(:'owner',:'upload_a')->>'path' AS image_a \gset
SELECT public.prepare_ordinary_upload(:'owner',:'lid',100)->>'id' AS upload_b \gset
SELECT public.attach_ordinary_upload(:'owner',:'upload_b')->>'path' AS image_b \gset
RESET ROLE;
SELECT images AS prior FROM listings WHERE id=:'lid' \gset
SET LOCAL ROLE service_role;
SELECT public.reorder_listing_images(:'owner',:'lid',:'prior',ARRAY[:'image_b',:'image_a']);
SELECT public.detach_listing_image(:'owner',:'lid',:'image_a');
SELECT public.read_canonical_listing_evidence(ARRAY[:'lid']::uuid[],ARRAY['year_built'],ARRAY['property_type']);
RESET ROLE;
SELECT pg_temp.s11_assert(images::jsonb=jsonb_build_array(:'image_b'),'upload/reorder/detach') FROM listings WHERE id=:'lid';
SELECT canonical_revision AS rev FROM listings WHERE id=:'lid' \gset
SET LOCAL ROLE authenticated;
SELECT public.mutate_customer_canonical_listing(:'lid',:rev,gen_random_uuid(),'{"lifecycle":{"event":"archive","reason":"S11 controlled smoke"}}');
RESET ROLE;
SELECT pg_temp.s11_assert(listing_status='archived','canonical lifecycle') FROM listings WHERE id=:'lid';
SELECT 'S11_CUSTOMER_SMOKE_PASSED_ROLLBACK_REQUIRED' AS checkpoint;
ROLLBACK;

-- Independent token scenario: prior customer state has rolled back.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
SELECT set_config('request.jwt.claim.sub',:'owner',true);
CREATE FUNCTION pg_temp.s11_assert(v boolean,label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF v IS DISTINCT FROM true THEN RAISE EXCEPTION 'S11 smoke failed: %',label; END IF;END $$;
SELECT pg_temp.s11_assert(NOT EXISTS(SELECT 1 FROM listings WHERE owner_id=:'owner' AND listing_status='active'),'token scenario starts without prior active fixture');
SELECT gen_random_uuid()::text AS token \gset
INSERT INTO listing_publish_tokens(token,phone,verified,listing_data) VALUES(:'token','S11-ROLLBACK-ONLY-NONREAL-PHONE',false,'{"images":[],"temporary_images":[]}');
SET LOCAL ROLE service_role;
SELECT public.prepare_token_canonical_listing(:'token',:'owner','{"images":[],"temporary_images":[]}',jsonb_build_object(
 'transaction','sale','geography',jsonb_build_object('province','3','canton','304'),
 'semantics',jsonb_build_object('property_type',jsonb_build_array(:'property_term')),
 'money',jsonb_build_object('amount','1','currency','CRC')));
SELECT public.attach_token_canonical_media(:'token',:'owner');
SET LOCAL ROLE authenticated;
SELECT public.publish_token_canonical_listing(:'token');
RESET ROLE;
SELECT pg_temp.s11_assert(l.listing_status='active','token canonical publication') FROM twuanis_canonical_private.token_creation_commands c JOIN listings l ON l.id=c.listing_id WHERE c.token=:'token';
SELECT 'S11_CANONICAL_SMOKE_PASSED_ROLLBACK_REQUIRED' AS checkpoint;
ROLLBACK;
