-- Step 5 local preparation. No production activation or customer checkout.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
CREATE TABLE twuanis_canonical_private.addon_behaviors(
 id text PRIMARY KEY, target text NOT NULL CHECK(target IN ('listing','account','operation')),
 term_kind text NOT NULL CHECK(term_kind IN ('elapsed_days','whole_job','lifetime','unconfigured')),
 create_supported boolean NOT NULL, UNIQUE(id,target,term_kind)
);
INSERT INTO twuanis_canonical_private.addon_behaviors VALUES
 ('featured_collection','listing','elapsed_days',true),
 ('priority_over_organic','listing','elapsed_days',true),
 ('homepage_carousel','listing','elapsed_days',false),
 ('province_contextual_priority','listing','elapsed_days',true),
 ('property_type_contextual_priority','listing','elapsed_days',true),
 ('bulk_import_job','operation','whole_job',false),
 ('founding_pricing_entitlement','account','lifetime',false),
 ('premium_listing_experience','listing','unconfigured',false);
CREATE TABLE twuanis_canonical_private.addon_products(
 id text PRIMARY KEY CHECK(id ~ '^addon-[a-z0-9-]+$'),
 name_en text NOT NULL CHECK(length(btrim(name_en)) BETWEEN 1 AND 300),
 name_es text CHECK(length(btrim(name_es)) BETWEEN 1 AND 300),
 description_en text CHECK(length(description_en)<=4000), description_es text CHECK(length(description_es)<=4000),
 target text NOT NULL, behavior text NOT NULL, term_kind text NOT NULL,
 state text NOT NULL CHECK(state IN ('draft','active','inactive','archived')),
 revision bigint NOT NULL DEFAULT 1 CHECK(revision>0), current_configuration_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 FOREIGN KEY(behavior,target,term_kind) REFERENCES twuanis_canonical_private.addon_behaviors(id,target,term_kind)
);
CREATE TABLE twuanis_canonical_private.addon_configurations(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),product_id text NOT NULL REFERENCES twuanis_canonical_private.addon_products(id),
 version bigint NOT NULL CHECK(version>0),duration_days integer CHECK(duration_days BETWEEN 1 AND 3650),
 behavior_version integer NOT NULL DEFAULT 1 CHECK(behavior_version=1),created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(product_id,version),UNIQUE(product_id,id)
);
ALTER TABLE twuanis_canonical_private.addon_products ADD CONSTRAINT addon_current_configuration
 FOREIGN KEY(id,current_configuration_id) REFERENCES twuanis_canonical_private.addon_configurations(product_id,id) DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE twuanis_canonical_private.addon_standard_prices(
 configuration_id uuid NOT NULL REFERENCES twuanis_canonical_private.addon_configurations(id),
 currency text NOT NULL CHECK(currency IN ('USD','CRC')),
 amount numeric NOT NULL CHECK(amount>0 AND amount<1000000000000 AND scale(amount)<=2 AND (currency<>'CRC' OR amount=trunc(amount))),
 PRIMARY KEY(configuration_id,currency)
);
CREATE TABLE twuanis_canonical_private.addon_quantity_tiers(
 configuration_id uuid NOT NULL REFERENCES twuanis_canonical_private.addon_configurations(id),
 lower_quantity integer NOT NULL CHECK(lower_quantity>0),upper_quantity integer NOT NULL CHECK(upper_quantity>=lower_quantity),
 currency text NOT NULL CHECK(currency='USD'),unit_rate numeric NOT NULL CHECK(unit_rate>0 AND unit_rate<1000000000 AND scale(unit_rate)<=2),
 PRIMARY KEY(configuration_id,lower_quantity)
);
-- Global capacity is operational authority, not a benefit purchased by a customer.
CREATE TABLE twuanis_canonical_private.addon_homepage_capacity(
 id boolean PRIMARY KEY DEFAULT true CHECK(id),capacity integer NOT NULL CHECK(capacity=10)
);
INSERT INTO twuanis_canonical_private.addon_homepage_capacity VALUES(true,10);
CREATE FUNCTION twuanis_canonical_private.validate_addon_configuration() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE pid text; p twuanis_canonical_private.addon_products%ROWTYPE; c twuanis_canonical_private.addon_configurations%ROWTYPE;
BEGIN
 IF TG_TABLE_NAME='addon_products' THEN pid:=NEW.id;
 ELSIF TG_TABLE_NAME='addon_configurations' THEN pid:=NEW.product_id;
 ELSE SELECT product_id INTO pid FROM twuanis_canonical_private.addon_configurations WHERE id=NEW.configuration_id; END IF;
 SELECT * INTO STRICT p FROM twuanis_canonical_private.addon_products WHERE id=pid;
 FOR c IN SELECT * FROM twuanis_canonical_private.addon_configurations WHERE product_id=pid LOOP
  IF (p.term_kind<>'elapsed_days' AND c.duration_days IS NOT NULL) OR (p.term_kind='elapsed_days' AND p.state='active' AND c.id=p.current_configuration_id AND c.duration_days IS NULL) THEN RAISE EXCEPTION 'typed add-on duration required'; END IF;
  IF p.term_kind='whole_job' THEN
   IF EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_standard_prices WHERE configuration_id=c.id)
    OR (SELECT count(*) FROM twuanis_canonical_private.addon_quantity_tiers WHERE configuration_id=c.id)<>3
    OR NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_quantity_tiers WHERE configuration_id=c.id AND lower_quantity=1 AND upper_quantity=25)
    OR NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_quantity_tiers WHERE configuration_id=c.id AND lower_quantity=26 AND upper_quantity=100)
    OR NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_quantity_tiers WHERE configuration_id=c.id AND lower_quantity=101 AND upper_quantity=500)
   THEN RAISE EXCEPTION 'approved complete whole-job schedule required'; END IF;
  ELSE
   IF EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_quantity_tiers WHERE configuration_id=c.id) THEN RAISE EXCEPTION 'quantity pricing requires operation product'; END IF;
   IF p.term_kind='unconfigured' AND EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_standard_prices WHERE configuration_id=c.id) THEN RAISE EXCEPTION 'future experience remains unpriced'; END IF;
   IF p.term_kind='lifetime' AND EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_standard_prices WHERE configuration_id=c.id AND currency<>'USD') THEN RAISE EXCEPTION 'founding CRC unpriced'; END IF;
  END IF;
 END LOOP;
 IF p.term_kind='unconfigured' AND p.state<>'inactive' THEN RAISE EXCEPTION 'future experience remains inactive'; END IF;
 IF p.state='active' AND p.term_kind IN ('elapsed_days','lifetime') AND
  (SELECT count(*) FROM twuanis_canonical_private.addon_standard_prices WHERE configuration_id=p.current_configuration_id) <> (CASE WHEN p.term_kind='elapsed_days' THEN 2 ELSE 1 END)
 THEN RAISE EXCEPTION 'active add-on prices incomplete'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER addon_product_valid AFTER INSERT OR UPDATE ON twuanis_canonical_private.addon_products DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.validate_addon_configuration();
CREATE CONSTRAINT TRIGGER addon_configuration_valid AFTER INSERT ON twuanis_canonical_private.addon_configurations DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.validate_addon_configuration();
CREATE CONSTRAINT TRIGGER addon_price_valid AFTER INSERT ON twuanis_canonical_private.addon_standard_prices DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.validate_addon_configuration();
CREATE CONSTRAINT TRIGGER addon_tier_valid AFTER INSERT ON twuanis_canonical_private.addon_quantity_tiers DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.validate_addon_configuration();
CREATE TRIGGER addon_configurations_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON twuanis_canonical_private.addon_configurations FOR EACH STATEMENT EXECUTE FUNCTION twuanis_canonical_private.administrative_immutable();
CREATE TRIGGER addon_prices_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON twuanis_canonical_private.addon_standard_prices FOR EACH STATEMENT EXECUTE FUNCTION twuanis_canonical_private.administrative_immutable();
CREATE TRIGGER addon_tiers_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON twuanis_canonical_private.addon_quantity_tiers FOR EACH STATEMENT EXECUTE FUNCTION twuanis_canonical_private.administrative_immutable();
CREATE FUNCTION twuanis_canonical_private.guard_addon_identity() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$ BEGIN
 IF (NEW.id,NEW.target,NEW.behavior,NEW.term_kind) IS DISTINCT FROM (OLD.id,OLD.target,OLD.behavior,OLD.term_kind) THEN RAISE EXCEPTION 'add-on identity is immutable'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER addon_identity_immutable BEFORE UPDATE ON twuanis_canonical_private.addon_products FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.guard_addon_identity();
CREATE FUNCTION twuanis_canonical_private.guard_addon_terms_insert() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_configurations WHERE id=NEW.configuration_id AND xmin::text::numeric=mod(pg_current_xact_id()::text::numeric,4294967296)) THEN RAISE EXCEPTION 'committed configuration is sealed'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER addon_price_insert_sealed BEFORE INSERT ON twuanis_canonical_private.addon_standard_prices FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.guard_addon_terms_insert();
CREATE TRIGGER addon_tier_insert_sealed BEFORE INSERT ON twuanis_canonical_private.addon_quantity_tiers FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.guard_addon_terms_insert();
CREATE FUNCTION twuanis_canonical_private.addon_projection(pid text) RETURNS jsonb
LANGUAGE sql STABLE SET search_path=pg_catalog AS $$
 SELECT jsonb_build_object('id',p.id,'name_en',p.name_en,'name_es',p.name_es,'description_en',p.description_en,'description_es',p.description_es,
 'target',p.target,'behavior',p.behavior,'termKind',p.term_kind,'state',p.state,'revision',p.revision::text,'configurationId',c.id,'version',c.version::text,
 'durationDays',c.duration_days,'capacity',CASE WHEN p.behavior='homepage_carousel' THEN (SELECT capacity FROM twuanis_canonical_private.addon_homepage_capacity WHERE id) END,
 'standardPrices',coalesce((SELECT jsonb_object_agg(currency,amount::text) FROM twuanis_canonical_private.addon_standard_prices WHERE configuration_id=c.id),'{}'),
 'quantityTiers',coalesce((SELECT jsonb_agg(jsonb_build_object('min',lower_quantity,'max',upper_quantity,'currency',currency,'unitRate',unit_rate::text) ORDER BY lower_quantity) FROM twuanis_canonical_private.addon_quantity_tiers WHERE configuration_id=c.id),'[]'),
 'acquisitionAvailable',false,'acquisitionState',CASE WHEN p.term_kind='unconfigured' THEN 'unconfigured' ELSE 'fulfillment_not_activated' END)
 FROM twuanis_canonical_private.addon_products p JOIN twuanis_canonical_private.addon_configurations c ON c.id=p.current_configuration_id AND c.product_id=p.id WHERE p.id=pid
$$;
CREATE FUNCTION public.admin_addon_read(p_after text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE v jsonb;
BEGIN
 PERFORM twuanis_canonical_private.assert_administrative_permission('addons.read');
 IF length(p_after)>150 THEN RAISE EXCEPTION 'invalid cursor'; END IF;
 SELECT coalesce(jsonb_agg(twuanis_canonical_private.addon_projection(id) ORDER BY id),'[]') INTO v FROM
 (SELECT id FROM twuanis_canonical_private.addon_products WHERE p_after IS NULL OR id>p_after ORDER BY id LIMIT 26)q;
 RETURN jsonb_build_object('products',v,'createBehaviors',(SELECT jsonb_agg(id ORDER BY id) FROM twuanis_canonical_private.addon_behaviors WHERE create_supported));
END $$;
CREATE FUNCTION public.read_addon_catalog(p_after text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE v jsonb;
BEGIN
 IF length(p_after)>150 THEN RAISE EXCEPTION 'invalid cursor'; END IF;
 SELECT coalesce(jsonb_agg(twuanis_canonical_private.addon_projection(id)-ARRAY['revision','configurationId','version'] ORDER BY id),'[]') INTO v FROM
 (SELECT id FROM twuanis_canonical_private.addon_products WHERE state='active' AND (p_after IS NULL OR id>p_after) ORDER BY id LIMIT 26)q;
 RETURN v;
END $$;
CREATE FUNCTION public.admin_addon_command(p_request uuid,p_command jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE a uuid;p twuanis_canonical_private.addon_products%ROWTYPE;c twuanis_canonical_private.addon_configurations%ROWTYPE;
 prior twuanis_canonical_private.administrative_receipts%ROWTYPE;before_data jsonb;after_data jsonb;op text;pid text;cid uuid;eid bigint;authority text;x record;days integer;
BEGIN
 a:=twuanis_canonical_private.assert_administrative_permission('addons.manage');
 IF p_request IS NULL OR jsonb_typeof(p_command) IS DISTINCT FROM 'object' OR octet_length(p_command::text)>16000 THEN RAISE EXCEPTION 'bounded command required'; END IF;
 SET CONSTRAINTS twuanis_canonical_private.addon_product_valid,twuanis_canonical_private.addon_configuration_valid,twuanis_canonical_private.addon_price_valid,twuanis_canonical_private.addon_tier_valid DEFERRED;
 op:=p_command->>'operation';
 IF op IS NULL OR op NOT IN ('create','copy','configuration','lifecycle') OR length(coalesce(p_command->>'reason',''))>2000 THEN RAISE EXCEPTION 'invalid command'; END IF;
 -- Actor-bound receipt serialization precedes any catalog mutation.
 PERFORM pg_advisory_xact_lock(3151,hashtext(jsonb_build_array(a,p_request)::text));
 SELECT * INTO prior FROM twuanis_canonical_private.administrative_receipts WHERE actor_id=a AND request_id=p_request;
 IF FOUND THEN
  IF prior.command IS DISTINCT FROM jsonb_build_object('domain','addons','command',p_command) THEN RAISE EXCEPTION 'request conflict'; END IF;
  SELECT after_state INTO after_data FROM twuanis_canonical_private.administrative_events WHERE id=prior.event_id;
  RETURN jsonb_build_object('ok',true,'productId',after_data->>'id','eventId',prior.event_id::text,'replayed',true);
 END IF;
 IF op='create' THEN
  IF EXISTS(SELECT 1 FROM jsonb_object_keys(p_command)k WHERE k<>ALL(ARRAY['operation','name_en','behavior','reason']))
   OR jsonb_typeof(p_command->'name_en') IS DISTINCT FROM 'string'
   OR NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_behaviors WHERE id=p_command->>'behavior' AND create_supported) THEN RAISE EXCEPTION 'supported creation behavior required'; END IF;
  pid:='addon-'||gen_random_uuid()::text;cid:=gen_random_uuid();
  INSERT INTO twuanis_canonical_private.addon_products(id,name_en,target,behavior,term_kind,state,current_configuration_id)
   SELECT pid,p_command->>'name_en',target,id,term_kind,'draft',cid FROM twuanis_canonical_private.addon_behaviors WHERE id=p_command->>'behavior';
  -- Draft has explicit incomplete terms; activation is unavailable until configured.
  INSERT INTO twuanis_canonical_private.addon_configurations(id,product_id,version,duration_days) VALUES(cid,pid,1,NULL);
 ELSE
  pid:=p_command->>'product';
  IF pid IS NULL OR length(pid)>150 OR jsonb_typeof(p_command->'expected') IS DISTINCT FROM 'string'
   OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_command)k WHERE k<>ALL(ARRAY['operation','product','expected','reason']||CASE op WHEN 'copy' THEN ARRAY['name_en','name_es','description_en','description_es'] WHEN 'configuration' THEN ARRAY['durationDays','prices','tiers'] ELSE ARRAY['state'] END)) THEN RAISE EXCEPTION 'invalid command fields'; END IF;
  SELECT * INTO STRICT p FROM twuanis_canonical_private.addon_products WHERE id=pid FOR UPDATE;
  IF p.revision::text IS DISTINCT FROM p_command->>'expected' THEN RAISE EXCEPTION 'stale add-on revision' USING ERRCODE='40001'; END IF;
  IF p.state='archived' THEN RAISE EXCEPTION 'archived product is read only'; END IF;
  SELECT * INTO STRICT c FROM twuanis_canonical_private.addon_configurations WHERE id=p.current_configuration_id;
  before_data:=twuanis_canonical_private.addon_projection(pid);
  IF op='copy' THEN
   IF jsonb_typeof(p_command->'name_en') IS DISTINCT FROM 'string' OR EXISTS(SELECT 1 FROM jsonb_each(p_command)copy_field WHERE copy_field.key IN ('name_es','description_en','description_es') AND jsonb_typeof(copy_field.value) NOT IN ('string','null')) THEN RAISE EXCEPTION 'invalid localized copy'; END IF;
   UPDATE twuanis_canonical_private.addon_products SET name_en=p_command->>'name_en',name_es=CASE WHEN p_command ? 'name_es' THEN p_command->>'name_es' ELSE name_es END,
    description_en=CASE WHEN p_command ? 'description_en' THEN p_command->>'description_en' ELSE description_en END,description_es=CASE WHEN p_command ? 'description_es' THEN p_command->>'description_es' ELSE description_es END WHERE id=pid;
  ELSIF op='configuration' THEN
   IF p.term_kind='unconfigured' THEN RAISE EXCEPTION 'future experience terms not authorized'; END IF;
   days:=c.duration_days;
   IF p_command ? 'durationDays' THEN
    IF p.term_kind<>'elapsed_days' OR jsonb_typeof(p_command->'durationDays') IS DISTINCT FROM 'number' OR (p_command->>'durationDays') !~ '^[1-9][0-9]*$' THEN RAISE EXCEPTION 'typed positive elapsed days required'; END IF;
    days:=(p_command->>'durationDays')::integer;
   END IF;
   cid:=gen_random_uuid();
   INSERT INTO twuanis_canonical_private.addon_configurations(id,product_id,version,duration_days) VALUES(cid,pid,c.version+1,days);
   IF p_command ? 'prices' THEN
    IF p.term_kind='whole_job' OR jsonb_typeof(p_command->'prices') IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'typed flat prices required'; END IF;
    FOR x IN SELECT key,value FROM jsonb_each(p_command->'prices') LOOP
     IF x.key NOT IN ('USD','CRC') OR jsonb_typeof(x.value) IS DISTINCT FROM 'string' OR (x.value#>>'{}') !~ '^[0-9]+(\.[0-9]{1,2})?$' THEN RAISE EXCEPTION 'exact decimal price required'; END IF;
     INSERT INTO twuanis_canonical_private.addon_standard_prices VALUES(cid,x.key,(x.value#>>'{}')::numeric);
    END LOOP;
   ELSE INSERT INTO twuanis_canonical_private.addon_standard_prices SELECT cid,currency,amount FROM twuanis_canonical_private.addon_standard_prices WHERE configuration_id=c.id; END IF;
   IF p_command ? 'tiers' THEN
    IF p.term_kind<>'whole_job' OR jsonb_typeof(p_command->'tiers') IS DISTINCT FROM 'array' OR jsonb_array_length(p_command->'tiers')<>3 THEN RAISE EXCEPTION 'typed three-tier schedule required'; END IF;
    FOR x IN SELECT value FROM jsonb_array_elements(p_command->'tiers') LOOP
     IF jsonb_typeof(x.value) IS DISTINCT FROM 'object' OR EXISTS(SELECT 1 FROM jsonb_object_keys(x.value)k WHERE k<>ALL(ARRAY['min','max','currency','unitRate']))
      OR jsonb_typeof(x.value->'min') IS DISTINCT FROM 'number' OR jsonb_typeof(x.value->'max') IS DISTINCT FROM 'number'
      OR (x.value->>'min') !~ '^[1-9][0-9]*$' OR (x.value->>'max') !~ '^[1-9][0-9]*$'
      OR jsonb_typeof(x.value->'unitRate') IS DISTINCT FROM 'string' OR (x.value->>'unitRate') !~ '^[0-9]+(\.[0-9]{1,2})?$' THEN RAISE EXCEPTION 'invalid quantity tier'; END IF;
     INSERT INTO twuanis_canonical_private.addon_quantity_tiers VALUES(cid,(x.value->>'min')::integer,(x.value->>'max')::integer,x.value->>'currency',(x.value->>'unitRate')::numeric);
    END LOOP;
   ELSE INSERT INTO twuanis_canonical_private.addon_quantity_tiers SELECT cid,lower_quantity,upper_quantity,currency,unit_rate FROM twuanis_canonical_private.addon_quantity_tiers WHERE configuration_id=c.id; END IF;
   UPDATE twuanis_canonical_private.addon_products SET current_configuration_id=cid WHERE id=pid;
  ELSE
   IF p_command->>'state' IS NULL OR NOT ((p.state='draft' AND p_command->>'state' IN ('active','inactive','archived')) OR (p.state='active' AND p_command->>'state' IN ('inactive','archived')) OR (p.state='inactive' AND p_command->>'state' IN ('active','archived'))) THEN RAISE EXCEPTION 'invalid lifecycle'; END IF;
   IF p_command->>'state'='archived' AND nullif(btrim(p_command->>'reason'),'') IS NULL THEN RAISE EXCEPTION 'archive reason required'; END IF;
   UPDATE twuanis_canonical_private.addon_products SET state=p_command->>'state' WHERE id=pid;
  END IF;
  UPDATE twuanis_canonical_private.addon_products SET revision=revision+1,updated_at=clock_timestamp() WHERE id=pid;
 END IF;
 SET CONSTRAINTS twuanis_canonical_private.addon_product_valid,twuanis_canonical_private.addon_configuration_valid,twuanis_canonical_private.addon_price_valid,twuanis_canonical_private.addon_tier_valid IMMEDIATE;
 after_data:=twuanis_canonical_private.addon_projection(pid);
 authority:=CASE WHEN EXISTS(SELECT 1 FROM twuanis_canonical_private.owner_access_grants WHERE user_id=a AND revoked_at IS NULL) THEN 'owner' ELSE 'scoped_administrator' END;
 eid:=twuanis_canonical_private.append_administrative_event(a,authority,'addons.manage','addon.'||op,'addon',NULL,before_data,after_data,p_command->>'reason',p_request);
 INSERT INTO twuanis_canonical_private.administrative_receipts VALUES(a,p_request,jsonb_build_object('domain','addons','command',p_command),eid);
 RETURN jsonb_build_object('ok',true,'productId',pid,'eventId',eid::text,'replayed',false);
END $$;

INSERT INTO twuanis_canonical_private.addon_products(id,name_en,target,behavior,term_kind,state,current_configuration_id) VALUES('addon-featured-listing','Featured Listing','listing','featured_collection','elapsed_days','active','05000000-0000-4000-8000-000000000001');
INSERT INTO twuanis_canonical_private.addon_configurations(id,product_id,version,duration_days) VALUES('05000000-0000-4000-8000-000000000001','addon-featured-listing',1,60);
INSERT INTO twuanis_canonical_private.addon_standard_prices VALUES('05000000-0000-4000-8000-000000000001','USD',12);
INSERT INTO twuanis_canonical_private.addon_standard_prices VALUES('05000000-0000-4000-8000-000000000001','CRC',6000);

INSERT INTO twuanis_canonical_private.addon_products(id,name_en,target,behavior,term_kind,state,current_configuration_id) VALUES('addon-listing-boost','Listing Boost','listing','priority_over_organic','elapsed_days','active','05000000-0000-4000-8000-000000000002');
INSERT INTO twuanis_canonical_private.addon_configurations(id,product_id,version,duration_days) VALUES('05000000-0000-4000-8000-000000000002','addon-listing-boost',1,14);
INSERT INTO twuanis_canonical_private.addon_standard_prices VALUES('05000000-0000-4000-8000-000000000002','USD',5);
INSERT INTO twuanis_canonical_private.addon_standard_prices VALUES('05000000-0000-4000-8000-000000000002','CRC',2500);

INSERT INTO twuanis_canonical_private.addon_products(id,name_en,target,behavior,term_kind,state,current_configuration_id) VALUES('addon-homepage-exposure','Homepage Exposure','listing','homepage_carousel','elapsed_days','active','05000000-0000-4000-8000-000000000003');
INSERT INTO twuanis_canonical_private.addon_configurations(id,product_id,version,duration_days) VALUES('05000000-0000-4000-8000-000000000003','addon-homepage-exposure',1,14);
INSERT INTO twuanis_canonical_private.addon_standard_prices VALUES('05000000-0000-4000-8000-000000000003','USD',35);
INSERT INTO twuanis_canonical_private.addon_standard_prices VALUES('05000000-0000-4000-8000-000000000003','CRC',17500);

INSERT INTO twuanis_canonical_private.addon_products(id,name_en,target,behavior,term_kind,state,current_configuration_id) VALUES('addon-province-exposure','Province Exposure','listing','province_contextual_priority','elapsed_days','active','05000000-0000-4000-8000-000000000004');
INSERT INTO twuanis_canonical_private.addon_configurations(id,product_id,version,duration_days) VALUES('05000000-0000-4000-8000-000000000004','addon-province-exposure',1,28);
INSERT INTO twuanis_canonical_private.addon_standard_prices VALUES('05000000-0000-4000-8000-000000000004','USD',18);
INSERT INTO twuanis_canonical_private.addon_standard_prices VALUES('05000000-0000-4000-8000-000000000004','CRC',9000);

INSERT INTO twuanis_canonical_private.addon_products(id,name_en,target,behavior,term_kind,state,current_configuration_id) VALUES('addon-property-type-exposure','Property-Type Exposure','listing','property_type_contextual_priority','elapsed_days','active','05000000-0000-4000-8000-000000000005');
INSERT INTO twuanis_canonical_private.addon_configurations(id,product_id,version,duration_days) VALUES('05000000-0000-4000-8000-000000000005','addon-property-type-exposure',1,28);
INSERT INTO twuanis_canonical_private.addon_standard_prices VALUES('05000000-0000-4000-8000-000000000005','USD',18);
INSERT INTO twuanis_canonical_private.addon_standard_prices VALUES('05000000-0000-4000-8000-000000000005','CRC',9000);

INSERT INTO twuanis_canonical_private.addon_products(id,name_en,target,behavior,term_kind,state,current_configuration_id) VALUES('addon-bulk-listing-import','Bulk Listing Import','operation','bulk_import_job','whole_job','active','05000000-0000-4000-8000-000000000006');
INSERT INTO twuanis_canonical_private.addon_configurations(id,product_id,version,duration_days) VALUES('05000000-0000-4000-8000-000000000006','addon-bulk-listing-import',1,NULL);
INSERT INTO twuanis_canonical_private.addon_quantity_tiers VALUES('05000000-0000-4000-8000-000000000006',1,25,'USD',0.50);
INSERT INTO twuanis_canonical_private.addon_quantity_tiers VALUES('05000000-0000-4000-8000-000000000006',26,100,'USD',0.25);
INSERT INTO twuanis_canonical_private.addon_quantity_tiers VALUES('05000000-0000-4000-8000-000000000006',101,500,'USD',0.10);

INSERT INTO twuanis_canonical_private.addon_products(id,name_en,target,behavior,term_kind,state,current_configuration_id) VALUES('addon-2026-founding-membership','2026 Founding Membership','account','founding_pricing_entitlement','lifetime','active','05000000-0000-4000-8000-000000000007');
INSERT INTO twuanis_canonical_private.addon_configurations(id,product_id,version,duration_days) VALUES('05000000-0000-4000-8000-000000000007','addon-2026-founding-membership',1,NULL);
INSERT INTO twuanis_canonical_private.addon_standard_prices VALUES('05000000-0000-4000-8000-000000000007','USD',500);

INSERT INTO twuanis_canonical_private.addon_products(id,name_en,target,behavior,term_kind,state,current_configuration_id) VALUES('addon-premium-listing-template','Premium Listing Template','listing','premium_listing_experience','unconfigured','inactive','05000000-0000-4000-8000-000000000008');
INSERT INTO twuanis_canonical_private.addon_configurations(id,product_id,version,duration_days) VALUES('05000000-0000-4000-8000-000000000008','addon-premium-listing-template',1,NULL);

SET CONSTRAINTS ALL IMMEDIATE;
DO $$ DECLARE t text;f regprocedure; BEGIN
 FOREACH t IN ARRAY ARRAY['addon_behaviors','addon_products','addon_configurations','addon_standard_prices','addon_quantity_tiers','addon_homepage_capacity'] LOOP
  EXECUTE format('ALTER TABLE twuanis_canonical_private.%I OWNER TO postgres',t);
  EXECUTE format('ALTER TABLE twuanis_canonical_private.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON TABLE twuanis_canonical_private.%I FROM PUBLIC,anon,authenticated,service_role',t);
 END LOOP;
 FOREACH f IN ARRAY ARRAY['twuanis_canonical_private.guard_addon_identity()'::regprocedure,'twuanis_canonical_private.guard_addon_terms_insert()'::regprocedure,'twuanis_canonical_private.validate_addon_configuration()'::regprocedure,'twuanis_canonical_private.addon_projection(text)'::regprocedure,'public.admin_addon_read(text)'::regprocedure,'public.read_addon_catalog(text)'::regprocedure,'public.admin_addon_command(uuid,jsonb)'::regprocedure] LOOP
  EXECUTE format('ALTER FUNCTION %s OWNER TO postgres',f);
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',f);
 END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_addon_read(text),public.admin_addon_command(uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.read_addon_catalog(text) TO anon,authenticated,service_role;
COMMIT;
