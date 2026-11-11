\set ON_ERROR_STOP on
-- S4 disposable-only verification. Clone the completed closed S3 fixture into
-- cg_s4_verification; never use a remote, linked, or production database.
-- Extends the representative fixture only. Applies migration 007 exactly once.
DO $$ BEGIN IF current_database()<>'cg_s4_verification' OR inet_server_addr() IS NOT NULL OR session_user<>'postgres' THEN RAISE EXCEPTION 'disposable S4 database required'; END IF; END $$;
ALTER TABLE public.listings ADD COLUMN description text, ADD COLUMN whatsapp text;
\ir ../../supabase/migrations/007_canonical_creation_authority.sql
CREATE TEMP TABLE assertions(label text PRIMARY KEY);
CREATE FUNCTION pg_temp.ok(v boolean,label text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF v IS NOT TRUE THEN RAISE EXCEPTION 'FAIL %',label; END IF; INSERT INTO assertions VALUES(label); END $$;
CREATE FUNCTION pg_temp.reject(q text,code text,label text) RETURNS void LANGUAGE plpgsql AS $$ DECLARE e text; BEGIN BEGIN EXECUTE q; EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS e=RETURNED_SQLSTATE; END; PERFORM pg_temp.ok(e IS NOT DISTINCT FROM code,label||' ['||coalesce(e,'success')||']'); END $$;
CREATE FUNCTION pg_temp.base() RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$ SELECT '{"transaction":"sale","geography":{"province":"3","canton":"304"},"semantics":{"property_type":["1"]}}'::jsonb $$;
CREATE FUNCTION pg_temp.customer(d jsonb DEFAULT NULL,r uuid DEFAULT NULL) RETURNS jsonb LANGUAGE sql AS $$ SELECT public.create_customer_canonical_listing(coalesce(r,gen_random_uuid()),coalesce(d,pg_temp.base())) $$;
CREATE FUNCTION pg_temp.trusted(d jsonb DEFAULT NULL,s jsonb DEFAULT NULL,r uuid DEFAULT NULL) RETURNS jsonb LANGUAGE sql AS $$ SELECT public.create_trusted_canonical_listing(coalesce(r,gen_random_uuid()),coalesce(d,pg_temp.base()),s) $$;
CREATE FUNCTION pg_temp.src() RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$ SELECT '{"source_name":" s4/raw ","source_listing_id":" AbC/1 ","observation_id":"obs1","observed_at":"2026-09-16T00:00:00Z","source_type":"realtor"}'::jsonb $$;
CREATE TEMP TABLE result(label text PRIMARY KEY,value jsonb);
BEGIN;
INSERT INTO auth.users(id) SELECT ('00000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid FROM generate_series(301,305)n;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000301',false);
INSERT INTO result VALUES('customer',pg_temp.customer(NULL,'a4000000-0000-0000-0000-000000000001'));
SELECT pg_temp.ok(l.owner_id='00000000-0000-0000-0000-000000000301','owner auth derived'),
 pg_temp.ok(l.publisher_account_id=p.id AND p.owner_user_id=l.owner_id,'durable correct publisher'),
 pg_temp.ok(l.transaction_type='sale','explicit sale'),pg_temp.ok(l.listing_status='draft','draft not active default'),
 pg_temp.ok(l.canonical_revision=1 AND l.canonical_domain_version=1,'coherent initial revision and eligibility'),
 pg_temp.ok(l.province='Cartago' AND l.canton='Jiménez' AND l.district IS NULL,'minimum P+C'),
 pg_temp.ok(l.property_type='House','typed property projection'),
 pg_temp.ok(l.current_price IS NULL AND l.monthly_price IS NULL AND l.price_millions IS NULL,'money absent draft'),
 pg_temp.ok(l.listing_origin='customer' AND l.listing_source_type='customer','customer provenance')
 FROM listings l JOIN publisher_accounts p ON p.id=l.publisher_account_id WHERE l.id=(SELECT (value->>'listing_id')::uuid FROM result WHERE label='customer');
SELECT pg_temp.ok((SELECT count(*)=1 FROM listing_lifecycle_events WHERE listing_id=(SELECT (value->>'listing_id')::uuid FROM result WHERE label='customer') AND event_type='create' AND previous_state IS NULL AND resulting_state='draft' AND listing_revision=1),'explicit creation lifecycle');
SELECT pg_temp.ok((SELECT count(*)=1 FROM canonical_operation_receipts WHERE request_id='a4000000-0000-0000-0000-000000000001' AND result_revision=1 AND outcome='succeeded'),'creation receipt');
SELECT pg_temp.ok((SELECT count(*)=0 FROM listing_monetary_events WHERE listing_id=(SELECT (value->>'listing_id')::uuid FROM result WHERE label='customer')),'no invented monetary event');
SELECT pg_temp.ok(pg_temp.customer(NULL,'a4000000-0000-0000-0000-000000000001')=(SELECT value||'{"replayed":true}' FROM result WHERE label='customer'),'customer replay stable complete result');
SELECT pg_temp.reject($q$SELECT pg_temp.customer(pg_temp.base()||'{"transaction":"rent"}','a4000000-0000-0000-0000-000000000001')$q$,'22023','changed creation replay');
INSERT INTO result VALUES('full',pg_temp.customer(pg_temp.base()||'{"transaction":"rent","geography":{"province":"3","canton":"304","district":"30403"},"semantics":{"property_type":["1"],"utility":["4","3","4"],"environment":["1010","1011"],"terrain":["9007199254740993","1012"],"accessibility":["109","10","1015"],"legal_status":["1013"]},"facts":{"bedrooms":{"kind":"category","term":"5"},"bathrooms":{"kind":"exact","value":"0.5"},"parking":{"kind":"exact","value":"0"},"year_built":{"kind":"exact","value":"2020"},"distance_to_paved_road":{"kind":"range","lower":"0","upper":"20","lower_inclusive":true,"upper_inclusive":false}},"measurements":{"property_area":{"value":"100.25"},"construction_area":{"value":"70.125"}},"money":{"amount":"0.50","currency":"USD"},"content":{"title":"S4 title","description":"S4 description","whatsapp":"123"}}'));
SELECT pg_temp.ok(l.transaction_type='rent' AND l.monthly_price=.5 AND l.current_price IS NULL,'rent original amount'),pg_temp.ok(l.district='Pejivalle' AND l.district_normalized='pejivalle','Pejivalle30403'),pg_temp.ok(l.property_area=100.25 AND l.construction_area=70.125,'exact positive measures'),pg_temp.ok(l.title='S4 title' AND l.description='S4 description' AND l.whatsapp='123','bounded ordinary content'),pg_temp.ok(l.bedrooms='5+' AND l.bathrooms='0.5','category vs fractional exact') FROM listings l WHERE id=(SELECT (value->>'listing_id')::uuid FROM result WHERE label='full');
SELECT pg_temp.ok((SELECT count(*)=11 FROM listing_semantic_selections WHERE listing_id=(SELECT (value->>'listing_id')::uuid FROM result WHERE label='full')),'all semantic sets deduped');
SELECT pg_temp.ok((SELECT count(*)=5 AND bool_and(evidence_source='owner') FROM listing_fact_evidence WHERE listing_id=(SELECT (value->>'listing_id')::uuid FROM result WHERE label='full')),'five typed facts owner evidence');
SELECT pg_temp.ok((SELECT count(*)=1 FROM listing_monetary_events WHERE listing_id=(SELECT (value->>'listing_id')::uuid FROM result WHERE label='full') AND old_amount IS NULL AND old_currency IS NULL AND new_amount=.5 AND new_currency='USD' AND event_kind='initial_observation'),'initial money honest history');
SELECT pg_temp.ok(EXISTS(SELECT 1 FROM listings_ontology_terms WHERE listing_id=(SELECT (value->>'listing_id')::uuid FROM result WHERE label='full') AND ontology_term_id=9007199254740993),'lossless bigint projection');
-- Request and domain rejections: each failure is a transaction sub-block.
SELECT pg_temp.reject($q$SELECT pg_temp.customer(pg_temp.base()-'transaction')$q$,'22023','missing transaction');
SELECT pg_temp.reject($q$SELECT pg_temp.customer(pg_temp.base()||'{"transaction":"buy"}')$q$,'22023','legacy buy');
SELECT pg_temp.reject($q$SELECT pg_temp.customer(pg_temp.base()||'{"geography":{"province":"3"}}')$q$,'22023','missing Canton');
SELECT pg_temp.reject($q$SELECT pg_temp.customer(pg_temp.base()||'{"geography":{"province":"1","canton":"304"}}')$q$,'23514','wrong geography ancestry');
SELECT pg_temp.reject($q$SELECT pg_temp.customer(pg_temp.base()||'{"geography":{"province":"03","canton":"304"}}')$q$,'22023','noncanonical DTA');
SELECT pg_temp.reject($q$SELECT pg_temp.customer(pg_temp.base()||'{"semantics":{}}')$q$,'23514','missing property type');
SELECT pg_temp.reject($q$SELECT pg_temp.customer(pg_temp.base()||'{"semantics":{"property_type":[]}}')$q$,'23514','empty property type');
SELECT pg_temp.reject($q$SELECT pg_temp.customer(pg_temp.base()||'{"semantics":{"property_type":["1","2"]}}')$q$,'23514','multiple property types');
SELECT pg_temp.reject($q$SELECT pg_temp.customer(pg_temp.base()||'{"semantics":{"property_type":["3"]}}')$q$,'23514','wrong property dimension');
SELECT pg_temp.reject($q$SELECT pg_temp.customer(pg_temp.base()||'{"semantics":{"property_type":["1"],"terrain":[9007199254740993]}}')$q$,'22023','JSON numeric bigint rejected');
SELECT pg_temp.reject($q$SELECT pg_temp.customer(pg_temp.base()||'{"semantics":{"property_type":["1"],"accessibility":["1016","1015"]}}')$q$,'23514','boat incompatibility');
SELECT pg_temp.reject($q$SELECT pg_temp.customer(pg_temp.base()||'{"semantics":{"property_type":["1"],"accessibility":["1014","109"]}}')$q$,'23514','4x4 paved incompatibility');
SELECT pg_temp.reject($q$SELECT pg_temp.customer(pg_temp.base()||'{"facts":{"bathrooms":{"kind":"exact","value":"0"}}}')$q$,'23514','zero bathrooms rejected');
SELECT pg_temp.reject($q$SELECT pg_temp.customer(pg_temp.base()||'{"facts":{"bedrooms":{"kind":"exact","value":"1.5"}}}')$q$,'23514','fractional bedrooms rejected');
SELECT pg_temp.reject($q$SELECT pg_temp.customer(pg_temp.base()||'{"facts":{"parking":{"kind":"category","term":"5"}}}')$q$,'23514','wrong fact category type');
SELECT pg_temp.reject($q$SELECT pg_temp.customer(pg_temp.base()||'{"measurements":{"property_area":{"value":"0"}}}')$q$,'23514','zero measurement');
SELECT pg_temp.reject($q$SELECT pg_temp.customer(pg_temp.base()||'{"measurements":{"property_area":{"value":"NaN"}}}')$q$,'22023','nonfinite measurement');
SELECT pg_temp.reject($q$SELECT pg_temp.customer(pg_temp.base()||'{"money":{"amount":"0","currency":"USD"}}')$q$,'23514','zero money');
SELECT pg_temp.reject($q$SELECT pg_temp.customer(pg_temp.base()||'{"money":{"amount":"1","currency":"EUR"}}')$q$,'23514','unsupported denomination');
SELECT pg_temp.reject($q$SELECT pg_temp.customer(pg_temp.base()||'{"money":{"amount":"1"}}')$q$,'22023','money pair required');
DO $$ DECLARE k text; BEGIN FOREACH k IN ARRAY ARRAY['owner_id','publisher_account_id','listing_status','canonical_revision','canonical_domain_version','created_at','updated_at','published_at','archived_at','expired_at','deleted_at','renewed_at','listing_origin','listing_source_type','source','source_name','membership_origins','history','receipt','actor','trusted','price_millions','id','images'] LOOP PERFORM pg_temp.reject(format('SELECT pg_temp.customer(pg_temp.base()||jsonb_build_object(%L,''spoof''))',k),'22023','protected creation field '||k); END LOOP; END $$;
SELECT pg_temp.reject($q$SELECT pg_temp.customer(pg_temp.base()||'{"facts":{"bedrooms":{"kind":"exact","value":"1","source":"manual"}}}')$q$,'22023','caller evidence authority rejected');
SELECT pg_temp.reject($q$SELECT pg_temp.customer(pg_temp.base()||'{"measurements":{"property_area":{"value":"10","rule_set":"80000000-0000-0000-0000-000000000001"}}}')$q$,'22023','caller classification policy rejected');
SELECT pg_temp.reject($q$SELECT pg_temp.customer(pg_temp.base()||jsonb_build_object('content',jsonb_build_object('description',repeat('x',16001))))$q$,'22023','bounded content');
SELECT pg_temp.reject($q$SELECT pg_temp.customer(pg_temp.base()||jsonb_build_object('content',jsonb_build_object('description',repeat('x',70000))))$q$,'54000','total creation bound');
-- Different authorities use separate receipt identities; neither can steal another listing.
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000302',false);
INSERT INTO result VALUES('customerB',pg_temp.customer(NULL,'a4000000-0000-0000-0000-000000000001'));
SELECT pg_temp.ok((SELECT value->>'listing_id' FROM result WHERE label='customer')<>(SELECT value->>'listing_id' FROM result WHERE label='customerB'),'same request distinct owner identities');
SELECT pg_temp.reject($q$SELECT public.mutate_customer_canonical_listing((SELECT (value->>'listing_id')::uuid FROM result WHERE label='customer'),1,gen_random_uuid(),'{"money":{"amount":"1","currency":"USD"}}')$q$,'42501','nonowner mutation denied');
SELECT set_config('request.jwt.claim.sub','',false);
SELECT pg_temp.reject($q$SELECT pg_temp.customer()$q$,'42501','unauthenticated creation');
SELECT pg_temp.reject($q$SELECT public.mutate_customer_canonical_listing(gen_random_uuid(),1,gen_random_uuid(),'{}')$q$,'42501','unauthenticated mutation');
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000301',false);
-- Canonical Sale below/equal 1 and legacy evidence preservation through wrapper.
UPDATE listings SET price_millions=87 WHERE id=(SELECT (value->>'listing_id')::uuid FROM result WHERE label='customer');
INSERT INTO result SELECT 'mutation',public.mutate_customer_canonical_listing((value->>'listing_id')::uuid,1,'a4000000-0000-0000-0000-000000000002','{"money":{"amount":"0.50","currency":"USD"},"geography":{"province":"3","canton":"304","district":"30403"}}') FROM result WHERE label='customer';
SELECT pg_temp.ok((SELECT current_price=.5 AND price_millions=87 AND district='Pejivalle' AND canonical_revision=2 FROM listings WHERE id=(SELECT (value->>'listing_id')::uuid FROM result WHERE label='customer')),'composed money geography revision');
SELECT pg_temp.ok(public.mutate_customer_canonical_listing((SELECT (value->>'listing_id')::uuid FROM result WHERE label='customer'),1,'a4000000-0000-0000-0000-000000000002','{"money":{"amount":"0.500","currency":"USD"},"geography":{"province":"3","canton":"304","district":"30403"}}')->>'replayed'='true','mutation normalized replay');
SELECT pg_temp.reject($q$SELECT public.mutate_customer_canonical_listing((SELECT (value->>'listing_id')::uuid FROM result WHERE label='customer'),1,gen_random_uuid(),'{"money":{"amount":"1","currency":"USD"}}')$q$,'40001','stale expected revision');
SELECT pg_temp.reject($q$SELECT public.mutate_customer_canonical_listing((SELECT (value->>'listing_id')::uuid FROM result WHERE label='customer'),1,'a4000000-0000-0000-0000-000000000002','{"money":{"amount":"2","currency":"USD"}}')$q$,'22023','changed mutation replay');
SELECT public.mutate_customer_canonical_listing((value->>'listing_id')::uuid,2,gen_random_uuid(),'{"money":{"amount":"1","currency":"USD"},"geography":{"province":"3","canton":"304"}}') FROM result WHERE label='customer';
SELECT pg_temp.ok((SELECT current_price=1 AND price_millions=87 AND district IS NULL FROM listings WHERE id=(SELECT (value->>'listing_id')::uuid FROM result WHERE label='customer')),'Sale 1 legacy preserved D removed');
SELECT public.mutate_customer_canonical_listing((value->>'listing_id')::uuid,3,gen_random_uuid(),'{"lifecycle":{"event":"archive"}}') FROM result WHERE label='customer';
SELECT pg_temp.ok((SELECT listing_status='archived' FROM listings WHERE id=(SELECT (value->>'listing_id')::uuid FROM result WHERE label='customer')),'owner archive');
SELECT public.mutate_customer_canonical_listing((value->>'listing_id')::uuid,4,gen_random_uuid(),'{"lifecycle":{"event":"restore"}}') FROM result WHERE label='customer';
SELECT pg_temp.ok((SELECT listing_status='draft' FROM listings WHERE id=(SELECT (value->>'listing_id')::uuid FROM result WHERE label='customer')),'owner restore draft');
SELECT pg_temp.reject($q$SELECT public.mutate_customer_canonical_listing((SELECT (value->>'listing_id')::uuid FROM result WHERE label='customer'),5,gen_random_uuid(),'{"lifecycle":{"event":"publish"}}')$q$,'0A000','publication policy deferred');
SELECT pg_temp.reject($q$SELECT public.mutate_customer_canonical_listing((SELECT (value->>'listing_id')::uuid FROM result WHERE label='customer'),5,gen_random_uuid(),'{"lifecycle":{"event":"publish","duration_seconds":"3600"}}')$q$,'22023','owner cannot choose duration');
DO $$ DECLARE k text; BEGIN FOREACH k IN ARRAY ARRAY['transaction','owner_id','publisher_account_id','listing_status','canonical_revision','canonical_domain_version','listing_origin','source','actor','trusted','current_price','price_millions'] LOOP PERFORM pg_temp.reject(format('SELECT public.mutate_customer_canonical_listing((SELECT (value->>''listing_id'')::uuid FROM result WHERE label=''customer''),5,gen_random_uuid(),jsonb_build_object(%L,''spoof''))',k),'22023','protected mutation field '||k); END LOOP; END $$;
-- Trusted/system and source creation.
INSERT INTO result VALUES('system',pg_temp.trusted(NULL,NULL,'a4000000-0000-0000-0000-000000000003'));
SELECT pg_temp.ok(l.owner_id IS NULL AND l.publisher_account_id IS NULL,'system ownerless publisherless'),pg_temp.ok(l.listing_origin='system' AND l.listing_source_type='unknown','explicit system provenance'),pg_temp.ok(l.listing_status='draft' AND l.canonical_domain_version=1,'system eligible draft') FROM listings l WHERE id=(SELECT (value->>'listing_id')::uuid FROM result WHERE label='system');
SELECT pg_temp.ok(pg_temp.trusted(NULL,NULL,'a4000000-0000-0000-0000-000000000003')=(SELECT value||'{"replayed":true}' FROM result WHERE label='system'),'system replay');
INSERT INTO result VALUES('source',pg_temp.trusted(pg_temp.base()||'{"transaction":"rent","geography":{"province":"3","canton":"304","district":"30403"},"money":{"amount":"100.25","currency":"CRC"}}',pg_temp.src(),'a4000000-0000-0000-0000-000000000004'));
SELECT pg_temp.ok(l.owner_id IS NULL AND l.publisher_account_id IS NULL AND l.transaction_type='rent','source rent ownerless'),pg_temp.ok(l.listing_origin='imported' AND l.listing_source_type='realtor','source provenance'),pg_temp.ok(l.source_name=' s4/raw ' AND l.source_listing_id=' AbC/1 ','raw source identity preserved'),pg_temp.ok(l.first_seen='2026-09-16T00:00:00Z' AND l.last_seen=l.first_seen AND l.times_scraped=1 AND l.last_scraped IS NOT NULL,'source metadata first observation') FROM listings l WHERE id=(SELECT (value->>'listing_id')::uuid FROM result WHERE label='source');
SELECT pg_temp.ok((SELECT count(*)=1 FROM listing_source_observations WHERE listing_id=(SELECT (value->>'listing_id')::uuid FROM result WHERE label='source') AND outcome='accepted' AND result_revision=1),'source accepted observation');
INSERT INTO result VALUES('source_alias',pg_temp.trusted(pg_temp.base()||'{"transaction":"rent","geography":{"province":"3","canton":"304","district":"30403"},"money":{"amount":"100.250","currency":"CRC"}}',pg_temp.src(),'a4000000-0000-0000-0000-000000000020'));
SELECT pg_temp.ok((SELECT (value-'receipt_id')=(SELECT (value-'receipt_id')||'{"replayed":true}' FROM result WHERE label='source') FROM result WHERE label='source_alias'),'same source new request normalized replay');
SELECT pg_temp.ok(pg_temp.trusted(pg_temp.base()||'{"transaction":"rent","geography":{"province":"3","canton":"304","district":"30403"},"money":{"amount":"100.25","currency":"CRC"}}',pg_temp.src(),'a4000000-0000-0000-0000-000000000020')=(SELECT value FROM result WHERE label='source_alias'),'source replay operation receipt stable');
SELECT pg_temp.reject($q$SELECT pg_temp.trusted(NULL,pg_temp.src()||'{"source_listing_id":"different"}','a4000000-0000-0000-0000-000000000020')$q$,'22023','source replay request cannot be rebound');
SELECT pg_temp.ok((SELECT count(*)=1 FROM listing_source_observations WHERE listing_id=(SELECT (value->>'listing_id')::uuid FROM result WHERE label='source')) AND (SELECT count(*)=1 FROM listing_lifecycle_events WHERE listing_id=(SELECT (value->>'listing_id')::uuid FROM result WHERE label='source')),'source operation alias no duplicate observation history');
SELECT pg_temp.reject($q$SELECT pg_temp.trusted(pg_temp.base(),pg_temp.src())$q$,'22023','changed source observation payload');
SELECT pg_temp.reject($q$SELECT pg_temp.trusted(pg_temp.base(),pg_temp.src()||'{"observation_id":"obs2"}')$q$,'55000','new source observation routes to mutation');
SELECT pg_temp.reject($q$SELECT pg_temp.trusted(pg_temp.base()||'{"geography":{"province":"3"}}')$q$,'22023','trusted invalid geo');
SELECT pg_temp.reject($q$SELECT pg_temp.trusted(pg_temp.base()||'{"semantics":{"property_type":["3"]}}')$q$,'23514','trusted invalid dimension');
SELECT pg_temp.reject($q$SELECT pg_temp.trusted(pg_temp.base(),pg_temp.src()||'{"source_type":"customer"}')$q$,'22023','trusted cannot masquerade customer');
SELECT pg_temp.reject($q$SELECT pg_temp.trusted(pg_temp.base(),pg_temp.src()||jsonb_build_object('source_name',repeat('x',129)))$q$,'22023','raw namespace bound');
SELECT pg_temp.reject($q$SELECT pg_temp.trusted(pg_temp.base(),pg_temp.src()||jsonb_build_object('source_listing_id',repeat('x',257)))$q$,'22023','raw source ID bound');
SELECT pg_temp.reject($q$SELECT public.mutate_trusted_canonical_listing((SELECT (value->>'listing_id')::uuid FROM result WHERE label='source'),1,gen_random_uuid(),'{"money":{"amount":"2","currency":"USD"}}')$q$,'22023','source mutation requires observation');
-- Source identity conflicts must return evidence and preserve canonical identity.
INSERT INTO result SELECT 'conflict',public.mutate_trusted_canonical_listing((value->>'listing_id')::uuid,1,gen_random_uuid(),'{"money":{"amount":"2","currency":"USD"}}',(pg_temp.src()-'source_type')||'{"observation_id":"conflict","observed_at":"2026-09-17T00:00:00Z","transaction":"rent","geography":{"province":"1","canton":"101"}}') FROM result WHERE label='source';
SELECT pg_temp.ok((SELECT value->>'outcome'='conflict' FROM result WHERE label='conflict'),'trusted source identity conflict result');
SELECT pg_temp.ok((SELECT province='Cartago' AND canton='Jiménez' AND monthly_price=100.25 AND canonical_revision=1 FROM listings WHERE id=(SELECT (value->>'listing_id')::uuid FROM result WHERE label='source')),'source conflict preserves identity amount revision');
SELECT pg_temp.ok((SELECT count(*)=1 FROM source_identity_conflicts WHERE listing_id=(SELECT (value->>'listing_id')::uuid FROM result WHERE label='source')),'source conflict immutable evidence');
SELECT public.mutate_trusted_canonical_listing((value->>'listing_id')::uuid,1,gen_random_uuid(),'{"money":{"amount":"0.5","currency":"USD"}}') FROM result WHERE label='system';
SELECT pg_temp.reject($q$SELECT public.mutate_trusted_canonical_listing((SELECT (value->>'listing_id')::uuid FROM result WHERE label='system'),1,gen_random_uuid(),'{"money":{"amount":"1","currency":"USD"}}')$q$,'40001','trusted stale revision');
SELECT pg_temp.reject($q$SELECT public.mutate_trusted_canonical_listing((SELECT (value->>'listing_id')::uuid FROM result WHERE label='system'),2,gen_random_uuid(),'{"transaction":"rent"}')$q$,'22023','trusted transaction immutable');
SELECT pg_temp.reject($q$SELECT public.mutate_trusted_canonical_listing((SELECT (value->>'listing_id')::uuid FROM result WHERE label='system'),2,gen_random_uuid(),'{"owner_id":"00000000-0000-0000-0000-000000000301"}')$q$,'22023','trusted no arbitrary patch');
-- Drafts do not require a subscription and consume no slots; trusted publication
-- uses the existing S2/S3 capacity boundary, never a wrapper-specific counter.
DO $$ BEGIN FOR i IN 1..10 LOOP PERFORM pg_temp.customer(); END LOOP; END $$;
SELECT pg_temp.ok(twuanis_canonical_private.publisher_consumption((SELECT id FROM publisher_accounts WHERE owner_user_id='00000000-0000-0000-0000-000000000301'),'00000000-0000-0000-0000-000000000301')=0,'ten drafts consume zero');
INSERT INTO user_subscriptions(user_id,package_id,status,billing_cycle) VALUES('00000000-0000-0000-0000-000000000301','90000000-0000-0000-0000-000000000001','active','monthly');
UPDATE package_limits SET listing_limit=1 WHERE package_id='90000000-0000-0000-0000-000000000001';
SELECT public.mutate_trusted_canonical_listing((value->>'listing_id')::uuid,5,gen_random_uuid(),'{"lifecycle":{"event":"publish","duration_seconds":"3600"}}') FROM result WHERE label='customer';
SELECT pg_temp.ok((SELECT listing_status='active' AND publication_expires_at>clock_timestamp() FROM listings WHERE id=(SELECT (value->>'listing_id')::uuid FROM result WHERE label='customer')),'trusted owned publication uses S3');
SELECT pg_temp.reject($q$SELECT public.mutate_trusted_canonical_listing((SELECT (value->>'listing_id')::uuid FROM result WHERE label='full'),1,gen_random_uuid(),'{"lifecycle":{"event":"publish","duration_seconds":"3600"}}')$q$,'23514','trusted cannot bypass customer capacity');
SELECT pg_temp.ok(twuanis_canonical_private.publisher_consumption((SELECT id FROM publisher_accounts WHERE owner_user_id='00000000-0000-0000-0000-000000000301'),'00000000-0000-0000-0000-000000000301')=1,'bounded S2 active count');
-- Actual role invocation, not ACL inspection alone. pg_temp helpers are invoker.
GRANT ALL ON assertions,result TO anon,authenticated,service_role;
SET LOCAL ROLE authenticated;
INSERT INTO result VALUES('role_customer',pg_temp.customer());
SELECT pg_temp.ok((SELECT value->>'revision'='1' FROM result WHERE label='role_customer'),'authenticated exact creation signature works');
SELECT pg_temp.reject($q$SELECT public.create_trusted_canonical_listing(gen_random_uuid(),pg_temp.base(),NULL)$q$,'42501','authenticated denied trusted create');
SELECT pg_temp.reject($q$SELECT public.mutate_trusted_canonical_listing(gen_random_uuid(),1,gen_random_uuid(),'{}',NULL)$q$,'42501','authenticated denied trusted mutate');
SELECT pg_temp.reject($q$SELECT twuanis_canonical_private.s4_create_core(NULL,gen_random_uuid(),pg_temp.base(),NULL)$q$,'42501','authenticated denied raw creation');
SELECT pg_temp.reject($q$SELECT twuanis_canonical_private.s3_command(gen_random_uuid(),1,'trusted','spoof',gen_random_uuid(),'{}',NULL)$q$,'42501','authenticated denied raw S3');
SELECT pg_temp.reject($q$SELECT twuanis_canonical_private.ensure_publisher_account(gen_random_uuid())$q$,'42501','authenticated denied raw S2');
RESET ROLE;
SET LOCAL ROLE anon;
SELECT pg_temp.reject($q$SELECT public.create_customer_canonical_listing(gen_random_uuid(),pg_temp.base())$q$,'42501','anon denied customer create');
SELECT pg_temp.reject($q$SELECT public.mutate_customer_canonical_listing(gen_random_uuid(),1,gen_random_uuid(),'{}')$q$,'42501','anon denied customer mutate');
SELECT pg_temp.reject($q$SELECT public.create_trusted_canonical_listing(gen_random_uuid(),pg_temp.base(),NULL)$q$,'42501','anon denied trusted create');
SELECT pg_temp.reject($q$SELECT public.mutate_trusted_canonical_listing(gen_random_uuid(),1,gen_random_uuid(),'{}',NULL)$q$,'42501','anon denied trusted mutate');
RESET ROLE;
SET LOCAL ROLE service_role;
INSERT INTO result VALUES('role_trusted',pg_temp.trusted());
SELECT pg_temp.ok(public.mutate_trusted_canonical_listing((SELECT (value->>'listing_id')::uuid FROM result WHERE label='role_trusted'),1,gen_random_uuid(),'{"money":{"amount":"1","currency":"USD"}}')->>'revision'='2','service exact trusted mutate works');
SELECT pg_temp.reject($q$SELECT public.create_customer_canonical_listing(gen_random_uuid(),pg_temp.base())$q$,'42501','service denied customer surface');
SELECT pg_temp.reject($q$SELECT twuanis_canonical_private.s4_create_core(NULL,gen_random_uuid(),pg_temp.base(),NULL)$q$,'42501','service denied raw S4');
SELECT pg_temp.reject($q$SELECT twuanis_canonical_private.s4_domains('{}','source')$q$,'42501','service denied normalization helper');
SELECT pg_temp.reject($q$SELECT twuanis_canonical_private.s3_command(gen_random_uuid(),1,'trusted','service_role',gen_random_uuid(),'{}',NULL)$q$,'42501','service denied raw S3');
SELECT pg_temp.reject($q$SELECT twuanis_canonical_private.lock_capacity_policy(false)$q$,'42501','service denied raw S2');
RESET ROLE;
-- PUBLIC is a pseudo-role. Test its effective ACL and a real role with no grants.
CREATE ROLE s4_public_only;
GRANT ALL ON assertions TO s4_public_only;
SET LOCAL ROLE s4_public_only;
SELECT pg_temp.reject($q$SELECT public.create_customer_canonical_listing(gen_random_uuid(),pg_temp.base())$q$,'42501','PUBLIC-only role denied customer');
SELECT pg_temp.reject($q$SELECT public.create_trusted_canonical_listing(gen_random_uuid(),pg_temp.base(),NULL)$q$,'42501','PUBLIC-only role denied trusted');
RESET ROLE;
SELECT pg_temp.ok((SELECT count(*)=4 AND bool_and(p.prosecdef AND r.rolname='postgres' AND p.proconfig=ARRAY['search_path=pg_catalog, pg_temp']) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace JOIN pg_roles r ON r.oid=p.proowner WHERE n.nspname='public' AND p.proname IN ('create_customer_canonical_listing','create_trusted_canonical_listing','mutate_customer_canonical_listing','mutate_trusted_canonical_listing')),'exact four controlled definer signatures');
SELECT pg_temp.ok((SELECT count(*)=2 AND bool_and(NOT p.prosecdef AND p.proconfig=ARRAY['search_path=pg_catalog, pg_temp']) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='twuanis_canonical_private' AND p.proname LIKE 's4_%'),'private two invokers safe path');
SELECT pg_temp.ok(NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace CROSS JOIN LATERAL aclexplode(p.proacl) a WHERE (p.proname LIKE 's4_%' OR p.proname IN ('create_customer_canonical_listing','create_trusted_canonical_listing','mutate_customer_canonical_listing','mutate_trusted_canonical_listing')) AND a.grantee=0 AND a.privilege_type='EXECUTE'),'no PUBLIC or overload grant');
SELECT pg_temp.ok(NOT has_schema_privilege('authenticated','twuanis_canonical_private','USAGE') AND NOT has_schema_privilege('service_role','twuanis_canonical_private','USAGE'),'private schema isolation');
SELECT pg_temp.ok(NOT pg_has_role('authenticated','service_role','MEMBER') AND NOT pg_has_role('anon','service_role','MEMBER'),'no trusted role inheritance');
-- Relation/function shadowing must not redirect SECURITY DEFINER work.
CREATE TEMP TABLE listings(id uuid);
CREATE FUNCTION pg_temp.s4_create_core(uuid,uuid,jsonb,jsonb) RETURNS jsonb LANGUAGE sql AS $$ SELECT '{"spoof":true}'::jsonb $$;
SET LOCAL search_path=pg_temp,public;
SET LOCAL ROLE authenticated;
INSERT INTO result VALUES('searchpath',pg_temp.customer());
RESET ROLE;
SELECT pg_temp.ok((SELECT count(*)=0 FROM pg_temp.listings),'temp relation shadow untouched');
SELECT pg_temp.ok(EXISTS(SELECT 1 FROM public.listings WHERE id=(SELECT (value->>'listing_id')::uuid FROM result WHERE label='searchpath')),'qualified safe-path actual creation');
DROP TABLE pg_temp.listings;
SET LOCAL search_path=public;
-- Test-only triggers inject faults at each durable boundary. All side effects,
-- including a newly provisioned publisher, must vanish on failure.
CREATE FUNCTION pg_temp.inject() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'S4 injected failure' USING ERRCODE='ZX004'; END $$;
CREATE FUNCTION pg_temp.snapshot() RETURNS jsonb LANGUAGE sql AS $$ SELECT jsonb_build_array((SELECT count(*) FROM public.listings),(SELECT count(*) FROM public.publisher_accounts),(SELECT count(*) FROM public.canonical_operation_receipts),(SELECT count(*) FROM public.listing_semantic_selections),(SELECT count(*) FROM public.listing_fact_evidence),(SELECT count(*) FROM public.listing_membership_origins),(SELECT count(*) FROM public.listings_ontology_terms),(SELECT count(*) FROM public.listing_source_observations),(SELECT count(*) FROM public.listing_lifecycle_events),(SELECT count(*) FROM public.listing_monetary_events)) $$;
DO $$ DECLARE t text; mode text; before jsonb; request uuid; q text; d jsonb:=pg_temp.base()||'{"facts":{"bathrooms":{"kind":"exact","value":"0.5"}},"money":{"amount":"1","currency":"USD"}}'; BEGIN
 FOREACH mode IN ARRAY ARRAY['customer','trusted'] LOOP
  PERFORM set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000303',true);
  FOREACH t IN ARRAY ARRAY['listings','listing_membership_origins','listings_ontology_terms','listing_semantic_selections','listing_fact_evidence','canonical_operation_receipts','listing_source_observations','listing_lifecycle_events','listing_monetary_events','eligibility'] LOOP
   IF mode='customer' AND t='listing_source_observations' THEN CONTINUE; END IF;
   before:=pg_temp.snapshot();request:=gen_random_uuid();
   IF t='eligibility' THEN EXECUTE 'CREATE TRIGGER s4_inject AFTER UPDATE OF canonical_domain_version ON public.listings FOR EACH ROW EXECUTE FUNCTION pg_temp.inject()';
   ELSE EXECUTE format('CREATE TRIGGER s4_inject AFTER INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION pg_temp.inject()',t); END IF;
   q:=CASE mode WHEN 'customer' THEN format('SELECT pg_temp.customer(%L::jsonb,%L::uuid)',d,request) ELSE format('SELECT pg_temp.trusted(%L::jsonb,pg_temp.src()||''{"source_listing_id":"failure"}''::jsonb,%L::uuid)',d,request) END;
   PERFORM pg_temp.reject(q,'ZX004',mode||' injected '||t);
   PERFORM pg_temp.ok(before=pg_temp.snapshot(),mode||' complete rollback '||t);
   EXECUTE format('DROP TRIGGER s4_inject ON public.%I',CASE t WHEN 'eligibility' THEN 'listings' ELSE t END);
  END LOOP;
 END LOOP;
 PERFORM pg_temp.ok(NOT EXISTS(SELECT 1 FROM publisher_accounts WHERE owner_user_id='00000000-0000-0000-0000-000000000303'),'failed new publisher rolls back');
 -- Last failed request retries cleanly once the injected fault is removed.
 EXECUTE q;
 PERFORM pg_temp.ok((SELECT count(*)=1 FROM canonical_operation_receipts WHERE request_id=request),'failed creation then retry');
END $$;
-- Existing mutation also rolls back all domain/receipt/history changes.
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000301',false);
DO $$ DECLARE before jsonb; oldrow jsonb; target_id uuid; BEGIN
 SELECT (value->>'listing_id')::uuid INTO target_id FROM result WHERE label='customer';
 SELECT to_jsonb(l) INTO oldrow FROM public.listings l WHERE l.id=target_id;before:=pg_temp.snapshot();
 CREATE TRIGGER s4_inject AFTER INSERT ON public.listing_monetary_events FOR EACH ROW EXECUTE FUNCTION pg_temp.inject();
 PERFORM pg_temp.reject(format('SELECT public.mutate_customer_canonical_listing(%L,6,gen_random_uuid(),''{"money":{"amount":"2","currency":"USD"},"geography":{"province":"3","canton":"304","district":"30403"}}'')',target_id),'ZX004','composed mutation injected history failure');
 PERFORM pg_temp.ok(before=pg_temp.snapshot() AND oldrow=(SELECT to_jsonb(l) FROM public.listings l WHERE l.id=target_id),'composed mutation full rollback');
 DROP TRIGGER s4_inject ON public.listing_monetary_events;
END $$;
-- Additional targeted closed-contract regressions and actual authenticated mutation.
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000301',false);
SET LOCAL ROLE authenticated;
SELECT pg_temp.ok(public.mutate_customer_canonical_listing((SELECT (value->>'listing_id')::uuid FROM result WHERE label='role_customer'),1,gen_random_uuid(),'{"facts":{"bathrooms":{"kind":"exact","value":"1.25"}}}')->>'revision'='2','actual authenticated mutation works');
RESET ROLE;
SELECT pg_temp.ok((SELECT exact_value=1.25 AND evidence_source='owner' FROM listing_fact_evidence WHERE listing_id=(SELECT (value->>'listing_id')::uuid FROM result WHERE label='role_customer') AND dimension='bathrooms'),'S1 positive fractional bathroom retained');
ALTER ROLE service_role BYPASSRLS;
SET LOCAL ROLE service_role;
SELECT pg_temp.reject($q$SELECT twuanis_canonical_private.s4_create_core(NULL,gen_random_uuid(),pg_temp.base(),NULL)$q$,'42501','BYPASSRLS does not grant private execution');
RESET ROLE;
SELECT pg_temp.ok((SELECT remaining=-1 AND over_capacity=1 AND adding_one_exceeds FROM twuanis_canonical_private.capacity_state(1,2)),'S2 overcapacity arithmetic');
SELECT pg_temp.ok((SELECT unlimited AND remaining IS NULL AND NOT adding_one_exceeds FROM twuanis_canonical_private.capacity_state(NULL,9223372036854775807)),'S2 unlimited overflow-safe arithmetic');
SELECT pg_temp.ok((SELECT remaining=0 AND adding_one_exceeds AND NOT is_over_capacity FROM twuanis_canonical_private.capacity_state(9223372036854775807,9223372036854775807)),'S2 max bigint arithmetic');
DO $$ DECLARE p uuid; BEGIN SELECT id INTO p FROM publisher_accounts WHERE owner_user_id='00000000-0000-0000-0000-000000000301';DELETE FROM user_subscriptions WHERE user_id='00000000-0000-0000-0000-000000000301';PERFORM pg_temp.ok(p=twuanis_canonical_private.ensure_publisher_account('00000000-0000-0000-0000-000000000301'),'publisher survives subscription replacement'); END $$;
SELECT pg_temp.ok(public.mutate_trusted_canonical_listing((SELECT (value->>'listing_id')::uuid FROM result WHERE label='system'),2,gen_random_uuid(),'{"money":{"amount":"0.500","currency":"USD"}}')->>'revision'='2','S3 no-op revision preserved');
SELECT pg_temp.ok(pg_temp.customer(NULL,'a4000000-0000-0000-0000-000000000001')=(SELECT value||'{"replayed":true}' FROM result WHERE label='customer'),'stale creation replay after later mutation returns creation result');
INSERT INTO result VALUES('normalized',pg_temp.customer(pg_temp.base()||'{"semantics":{"property_type":["1"],"utility":["4","3","4"]},"money":{"amount":"1.00","currency":"USD"}}','a4000000-0000-0000-0000-000000000010'));
SELECT pg_temp.ok(pg_temp.customer(pg_temp.base()||'{"geography":{"province":"3","canton":"304","district":null},"semantics":{"property_type":["1"],"utility":["3","4"]},"money":{"amount":"1","currency":"USD"}}','a4000000-0000-0000-0000-000000000010')=(SELECT value||'{"replayed":true}' FROM result WHERE label='normalized'),'normalized semantic order decimals district replay');
SELECT pg_temp.reject($q$SELECT pg_temp.customer(pg_temp.base()||jsonb_build_object('semantics',jsonb_build_object('property_type',jsonb_build_array('1'),'utility',(SELECT jsonb_agg(n::text) FROM generate_series(1,33)n))))$q$,'22023','semantic dimension bound');
SELECT pg_temp.reject($q$SELECT pg_temp.customer(pg_temp.base()||'{"semantics":{"property_type":["1"],"legal_status":["1013","1"]}}')$q$,'23514','legal singleton enforced');
SELECT pg_temp.reject($q$SELECT pg_temp.customer(pg_temp.base()||'{"facts":{"year_built":{"kind":"exact","value":"10000"}}}')$q$,'23514','year bound unchanged');
SELECT pg_temp.reject($q$SELECT pg_temp.customer(pg_temp.base()||'{"facts":{"distance_to_paved_road":{"kind":"range","lower":"2","upper":"1","lower_inclusive":true,"upper_inclusive":false}}}')$q$,'22000','range bounds unchanged');
SELECT pg_temp.reject($q$SELECT pg_temp.trusted(NULL,pg_temp.src()||'{"source_listing_id":"   "}')$q$,'22023','whitespace raw identity rejected');
SELECT pg_temp.reject($q$SELECT pg_temp.trusted(NULL,pg_temp.src()||jsonb_build_object('observation_id',repeat('x',257)))$q$,'22023','raw observation bound');
-- Legacy source collision must go to reconciliation, not duplicate creation.
INSERT INTO public.listings(id,transaction_type,listing_status,listing_origin,listing_source_type,source_name,source_listing_id) VALUES('a4000000-0000-0000-0000-000000000099','sale','draft','imported','realtor','legacy-s4','raw');
SELECT pg_temp.reject($q$SELECT pg_temp.trusted(NULL,pg_temp.src()||'{"source_name":"legacy-s4","source_listing_id":"raw"}')$q$,'55000','legacy source collision requires reconciliation');
-- Accepted existing-source update and stale observation preserve S3 metadata semantics.
SELECT public.mutate_trusted_canonical_listing((value->>'listing_id')::uuid,1,gen_random_uuid(),'{"money":{"amount":"101","currency":"CRC"}}',(pg_temp.src()-'source_type')||'{"observation_id":"accepted2","observed_at":"2026-09-18T00:00:00Z","transaction":"rent","geography":{"province":"3","canton":"304","district":"30403"}}') FROM result WHERE label='source';
SELECT pg_temp.ok((SELECT monthly_price=101 AND times_scraped=2 AND first_seen='2026-09-16T00:00:00Z' AND last_seen='2026-09-18T00:00:00Z' AND canonical_revision=2 FROM listings WHERE id=(SELECT (value->>'listing_id')::uuid FROM result WHERE label='source')),'S3 accepted source metadata and revision');
SELECT pg_temp.ok(public.mutate_trusted_canonical_listing((SELECT (value->>'listing_id')::uuid FROM result WHERE label='source'),2,gen_random_uuid(),'{"money":{"amount":"99","currency":"CRC"}}',(pg_temp.src()-'source_type')||'{"observation_id":"older","observed_at":"2026-09-17T00:00:00Z","transaction":"rent","geography":{"province":"3","canton":"304","district":"30403"}}')->>'outcome'='stale','S3 stale source result');
SELECT pg_temp.ok((SELECT monthly_price=101 AND times_scraped=2 AND canonical_revision=2 FROM listings WHERE id=(SELECT (value->>'listing_id')::uuid FROM result WHERE label='source')),'stale source no state overwrite');
SELECT pg_temp.reject($q$UPDATE listing_lifecycle_events SET resulting_state='draft' WHERE listing_id=(SELECT (value->>'listing_id')::uuid FROM result WHERE label='customer')$q$,'55000','S1 lifecycle immutability');
SELECT pg_temp.reject($q$DELETE FROM canonical_operation_receipts WHERE request_id='a4000000-0000-0000-0000-000000000001'$q$,'55000','S1 receipt immutability');
-- Eligibility is absent on INSERT and its final establishment sees all required
-- evidence. These test-only triggers also inspect the no-money minimum case.
CREATE FUNCTION pg_temp.eligibility_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='INSERT' THEN IF NEW.canonical_domain_version IS NOT NULL OR NEW.canonical_revision<>0 OR NEW.listing_status<>'draft' THEN RAISE EXCEPTION 'premature eligibility'; END IF;
 ELSE IF NEW.canonical_domain_version<>1 OR NEW.canonical_revision<>1 OR NOT EXISTS(SELECT 1 FROM public.listing_semantic_selections WHERE listing_id=NEW.id AND dimension='property_type') OR (SELECT count(*) FROM public.listing_membership_origins WHERE listing_id=NEW.id AND origin_domain='geography')<2 OR NOT EXISTS(SELECT 1 FROM public.listing_lifecycle_events WHERE listing_id=NEW.id AND event_type='create') OR NOT EXISTS(SELECT 1 FROM public.canonical_operation_receipts WHERE listing_id=NEW.id AND result_revision=1) THEN RAISE EXCEPTION 'incoherent final eligibility'; END IF; END IF;RETURN NEW;
END $$;
CREATE TRIGGER s4_elig_insert BEFORE INSERT ON public.listings FOR EACH ROW EXECUTE FUNCTION pg_temp.eligibility_guard();
CREATE TRIGGER s4_elig_update BEFORE UPDATE OF canonical_domain_version ON public.listings FOR EACH ROW EXECUTE FUNCTION pg_temp.eligibility_guard();
SELECT pg_temp.ok(pg_temp.customer()->>'revision'='1','minimum creation final eligibility ordering');
SELECT pg_temp.ok(pg_temp.trusted()->>'revision'='1','trusted final eligibility ordering');
DROP TRIGGER s4_elig_insert ON public.listings;DROP TRIGGER s4_elig_update ON public.listings;


SELECT pg_temp.reject($q$SELECT pg_temp.trusted(NULL,pg_temp.src()-'source_listing_id')$q$,'22023','missing source identity');
SELECT pg_temp.reject($q$SELECT pg_temp.trusted(pg_temp.base()||'{"transaction":"buy"}')$q$,'22023','trusted legacy transaction rejected');
SET LOCAL ROLE authenticated;
SELECT pg_temp.reject($q$SELECT twuanis_canonical_private.s3_origins(gen_random_uuid(),'geography',ARRAY[1001,1002]::bigint[],NULL)$q$,'42501','authenticated projection helper denied');
SELECT pg_temp.reject($q$SELECT twuanis_canonical_private.s3_seal_classification(gen_random_uuid())$q$,'42501','authenticated configuration helper denied');
RESET ROLE;
SET LOCAL ROLE service_role;
SELECT pg_temp.reject($q$SELECT twuanis_canonical_private.s3_origins(gen_random_uuid(),'geography',ARRAY[1001,1002]::bigint[],NULL)$q$,'42501','service projection helper denied');
SELECT pg_temp.reject($q$SELECT twuanis_canonical_private.s3_seal_classification(gen_random_uuid())$q$,'42501','service configuration helper denied');
RESET ROLE;

SELECT count(*) AS s4_assertions_passed FROM assertions;
ROLLBACK;
-- Behavioral test data rolls back; concurrency suite creates its own fresh owners.
