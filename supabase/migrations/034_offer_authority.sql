-- Step 6 LOCAL PREPARATION ONLY. Installation does not activate Offers or checkout.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
CREATE TABLE twuanis_canonical_private.offers(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 package_id text REFERENCES twuanis_canonical_private.intelligence_packages(id),
 addon_id text REFERENCES twuanis_canonical_private.addon_products(id),
 state text NOT NULL DEFAULT 'draft' CHECK(state IN ('draft','eligible','ended','archived')),
 revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
 current_configuration_id uuid NOT NULL,
 ended_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CHECK(num_nonnulls(package_id,addon_id)=1),
 CHECK(ended_at IS NULL OR isfinite(ended_at))
);
CREATE INDEX offers_package ON twuanis_canonical_private.offers(package_id) WHERE package_id IS NOT NULL;
CREATE INDEX offers_addon ON twuanis_canonical_private.offers(addon_id) WHERE addon_id IS NOT NULL;
CREATE TABLE twuanis_canonical_private.offer_configurations(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 offer_id uuid NOT NULL REFERENCES twuanis_canonical_private.offers(id),
 version bigint NOT NULL CHECK(version>0),
 name_en text NOT NULL CHECK(length(btrim(name_en)) BETWEEN 1 AND 300),
 name_es text NOT NULL CHECK(length(btrim(name_es)) BETWEEN 1 AND 300),
 description_en text NOT NULL DEFAULT '' CHECK(length(description_en)<=4000),
 description_es text NOT NULL DEFAULT '' CHECK(length(description_es)<=4000),
 starts_at timestamptz NOT NULL,
 ends_at timestamptz NOT NULL,
 price_shape text NOT NULL CHECK(price_shape IN ('scalar','whole_job')),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CHECK(isfinite(starts_at) AND isfinite(ends_at) AND ends_at>starts_at),
 UNIQUE(offer_id,version),UNIQUE(offer_id,id)
);
ALTER TABLE twuanis_canonical_private.offers ADD CONSTRAINT offer_current_configuration
 FOREIGN KEY(id,current_configuration_id) REFERENCES twuanis_canonical_private.offer_configurations(offer_id,id) DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE twuanis_canonical_private.offer_scalar_prices(
 configuration_id uuid NOT NULL REFERENCES twuanis_canonical_private.offer_configurations(id),
 currency text NOT NULL CHECK(currency IN ('USD','CRC')),
 amount numeric NOT NULL CHECK(amount>0 AND amount<1000000000000 AND scale(amount)<=2 AND (currency<>'CRC' OR amount=trunc(amount))),
 PRIMARY KEY(configuration_id,currency)
);
CREATE TABLE twuanis_canonical_private.offer_quantity_tiers(
 configuration_id uuid NOT NULL REFERENCES twuanis_canonical_private.offer_configurations(id),
 currency text NOT NULL CHECK(currency='USD'),
 lower_quantity integer NOT NULL CHECK(lower_quantity>0),
 upper_quantity integer NOT NULL CHECK(upper_quantity>=lower_quantity),
 unit_rate numeric NOT NULL CHECK(unit_rate>0 AND unit_rate<1000000000 AND scale(unit_rate)<=2),
 PRIMARY KEY(configuration_id,currency,lower_quantity)
);
CREATE FUNCTION twuanis_canonical_private.guard_offer_identity() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$ BEGIN
 IF (NEW.id,NEW.package_id,NEW.addon_id,NEW.created_at) IS DISTINCT FROM (OLD.id,OLD.package_id,OLD.addon_id,OLD.created_at) THEN RAISE EXCEPTION 'offer identity immutable'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER offer_identity_guard BEFORE UPDATE ON twuanis_canonical_private.offers FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.guard_offer_identity();
CREATE FUNCTION twuanis_canonical_private.guard_offer_price_insert() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_configurations WHERE id=NEW.configuration_id AND xmin::text::numeric=mod(pg_current_xact_id()::text::numeric,4294967296)) THEN RAISE EXCEPTION 'committed offer configuration sealed'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER offer_scalar_insert_guard BEFORE INSERT ON twuanis_canonical_private.offer_scalar_prices FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.guard_offer_price_insert();
CREATE TRIGGER offer_tier_insert_guard BEFORE INSERT ON twuanis_canonical_private.offer_quantity_tiers FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.guard_offer_price_insert();
CREATE FUNCTION twuanis_canonical_private.validate_offer_configuration() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE cid uuid; c twuanis_canonical_private.offer_configurations%ROWTYPE;o twuanis_canonical_private.offers%ROWTYPE;
BEGIN
 IF TG_TABLE_NAME='offers' THEN cid:=NEW.current_configuration_id;
 ELSIF TG_TABLE_NAME='offer_configurations' THEN cid:=NEW.id; ELSE cid:=NEW.configuration_id; END IF;
 SELECT * INTO STRICT c FROM twuanis_canonical_private.offer_configurations WHERE id=cid;
 SELECT * INTO STRICT o FROM twuanis_canonical_private.offers WHERE id=c.offer_id;
 IF c.price_shape='whole_job' THEN
  IF o.addon_id IS DISTINCT FROM 'addon-bulk-listing-import'
   OR EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_scalar_prices WHERE configuration_id=cid)
   OR (SELECT count(*) FROM twuanis_canonical_private.offer_quantity_tiers WHERE configuration_id=cid)<>3
   OR NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_quantity_tiers WHERE configuration_id=cid AND lower_quantity=1 AND upper_quantity=25)
   OR NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_quantity_tiers WHERE configuration_id=cid AND lower_quantity=26 AND upper_quantity=100)
   OR NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_quantity_tiers WHERE configuration_id=cid AND lower_quantity=101 AND upper_quantity=500)
  THEN RAISE EXCEPTION 'complete approved whole-job offer schedule required'; END IF;
 ELSE
  IF o.addon_id='addon-bulk-listing-import'
   OR EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_quantity_tiers WHERE configuration_id=cid)
   OR NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_scalar_prices WHERE configuration_id=cid)
  THEN RAISE EXCEPTION 'scalar offer price required'; END IF;
 END IF;
 IF o.addon_id='addon-premium-listing-template' THEN RAISE EXCEPTION 'unavailable target'; END IF;
 IF o.addon_id='addon-2026-founding-membership' AND EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_scalar_prices WHERE configuration_id=cid AND currency<>'USD') THEN RAISE EXCEPTION 'founding CRC unpriced'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER offer_valid AFTER INSERT OR UPDATE ON twuanis_canonical_private.offers DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.validate_offer_configuration();
CREATE CONSTRAINT TRIGGER offer_configuration_valid AFTER INSERT ON twuanis_canonical_private.offer_configurations DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.validate_offer_configuration();
CREATE CONSTRAINT TRIGGER offer_scalar_valid AFTER INSERT ON twuanis_canonical_private.offer_scalar_prices DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.validate_offer_configuration();
CREATE CONSTRAINT TRIGGER offer_tier_valid AFTER INSERT ON twuanis_canonical_private.offer_quantity_tiers DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.validate_offer_configuration();
-- Configuration history and its prices are immutable, including unused configurations.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['offer_configurations','offer_scalar_prices','offer_quantity_tiers'] LOOP
  EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE OR DELETE OR TRUNCATE ON twuanis_canonical_private.%I FOR EACH STATEMENT EXECUTE FUNCTION twuanis_canonical_private.administrative_immutable()',t||'_immutable',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['offers','offer_configurations','offer_scalar_prices','offer_quantity_tiers'] LOOP
  EXECUTE format('ALTER TABLE twuanis_canonical_private.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE twuanis_canonical_private.%I OWNER TO postgres',t);
  EXECUTE format('REVOKE ALL ON twuanis_canonical_private.%I FROM PUBLIC,anon,authenticated,service_role',t);
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION twuanis_canonical_private.guard_offer_identity(),twuanis_canonical_private.guard_offer_price_insert(),twuanis_canonical_private.validate_offer_configuration() FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION twuanis_canonical_private.offer_status(s text,b timestamptz,e timestamptz,at_time timestamptz) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path=pg_catalog AS $$
 SELECT CASE WHEN s='archived' THEN 'archived' WHEN s='draft' THEN 'draft' WHEN s='ended' OR at_time>e THEN 'ended' WHEN at_time<b THEN 'scheduled' ELSE 'active' END
$$;
CREATE FUNCTION twuanis_canonical_private.offer_projection(oid uuid,at_time timestamptz) RETURNS jsonb
LANGUAGE sql STABLE SET search_path=pg_catalog AS $$
 SELECT jsonb_build_object('id',o.id,'targetType',CASE WHEN o.package_id IS NOT NULL THEN 'package' ELSE 'addon' END,
 'targetId',coalesce(o.package_id,o.addon_id),'state',twuanis_canonical_private.offer_status(o.state,c.starts_at,c.ends_at,at_time),
 'administrativeState',o.state,'revision',o.revision::text,'configurationId',c.id,'version',c.version::text,
 'name_en',c.name_en,'name_es',c.name_es,'description_en',c.description_en,'description_es',c.description_es,
 'startsAt',c.starts_at,'endsAt',c.ends_at,'priceShape',c.price_shape,
 'prices',coalesce((SELECT jsonb_object_agg(currency,amount::text) FROM twuanis_canonical_private.offer_scalar_prices WHERE configuration_id=c.id),'{}'),
 'tiers',coalesce((SELECT jsonb_agg(jsonb_build_object('min',lower_quantity,'max',upper_quantity,'currency',currency,'unitRate',unit_rate::text) ORDER BY lower_quantity) FROM twuanis_canonical_private.offer_quantity_tiers WHERE configuration_id=c.id),'[]'))
 FROM twuanis_canonical_private.offers o JOIN twuanis_canonical_private.offer_configurations c ON c.id=o.current_configuration_id WHERE o.id=oid
$$;
CREATE FUNCTION public.admin_offer_command(p_request uuid,p_command jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid;o twuanis_canonical_private.offers%ROWTYPE;oldc twuanis_canonical_private.offer_configurations%ROWTYPE;
 prior twuanis_canonical_private.administrative_receipts%ROWTYPE;oid uuid;cid uuid;op text;v_target text;kind text;
 before_data jsonb;after_data jsonb;x record;v bigint;eid bigint;at_time timestamptz;authority text;
BEGIN
 actor:=twuanis_canonical_private.assert_administrative_permission('offers.manage');
 IF p_request IS NULL OR jsonb_typeof(p_command) IS DISTINCT FROM 'object' OR octet_length(p_command::text)>16000 THEN RAISE EXCEPTION 'bounded command required'; END IF;
 op:=p_command->>'operation';
 IF op IS NULL OR op NOT IN ('create','configure','schedule','end','archive') OR length(coalesce(p_command->>'reason',''))>2000 THEN RAISE EXCEPTION 'invalid operation'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_object_keys(p_command) k WHERE k<>ALL(ARRAY['operation','id','expected','reason']||CASE WHEN op='create' THEN ARRAY['targetType','targetId'] ELSE '{}'::text[] END||CASE WHEN op IN ('create','configure') THEN ARRAY['name_en','name_es','description_en','description_es','startsAt','endsAt','prices','tiers'] ELSE '{}'::text[] END)) THEN RAISE EXCEPTION 'unexpected field'; END IF;
 PERFORM pg_advisory_xact_lock(3160,hashtext(jsonb_build_array(actor,p_request)::text));
 SELECT * INTO prior FROM twuanis_canonical_private.administrative_receipts WHERE actor_id=actor AND request_id=p_request;
 IF FOUND THEN
  IF prior.command IS DISTINCT FROM jsonb_build_object('domain','offers','command',p_command) THEN RAISE EXCEPTION 'request conflict'; END IF;
  SELECT after_state INTO after_data FROM twuanis_canonical_private.administrative_events WHERE id=prior.event_id;
  RETURN jsonb_build_object('ok',true,'offerId',after_data->>'id','replayed',true);
 END IF;
 -- Serialize all mutations of this v_target before offer locks; disjoint targets do not block.
 IF op='create' THEN
  IF p_command ? 'id' OR p_command ? 'expected' THEN RAISE EXCEPTION 'server-generated identity required'; END IF;
  kind:=p_command->>'targetType';v_target:=p_command->>'targetId';
 ELSE
  SELECT * INTO STRICT o FROM twuanis_canonical_private.offers WHERE id=(p_command->>'id')::uuid;
  kind:=CASE WHEN o.package_id IS NOT NULL THEN 'package' ELSE 'addon' END;v_target:=coalesce(o.package_id,o.addon_id);
 END IF;
 IF kind IS NULL OR kind NOT IN ('package','addon') OR v_target IS NULL OR length(v_target)>150 THEN RAISE EXCEPTION 'invalid v_target'; END IF;
 PERFORM pg_advisory_xact_lock(3161,hashtext(kind||':'||v_target));
 IF kind='package' THEN
  PERFORM id FROM twuanis_canonical_private.intelligence_packages WHERE id=v_target AND state='active' FOR SHARE;
 ELSE
  PERFORM id FROM twuanis_canonical_private.addon_products WHERE id=v_target AND state='active' AND term_kind<>'unconfigured' FOR SHARE;
 END IF;
 IF NOT FOUND AND op IN ('create','configure','schedule') THEN RAISE EXCEPTION 'v_target unavailable'; END IF;
 at_time:=clock_timestamp();
 IF op='create' THEN
  oid:=gen_random_uuid();cid:=gen_random_uuid();v:=1;
  INSERT INTO twuanis_canonical_private.offers(id,package_id,addon_id,current_configuration_id) VALUES(oid,CASE WHEN kind='package' THEN v_target END,CASE WHEN kind='addon' THEN v_target END,cid);
 ELSE
  oid:=o.id;
  SELECT * INTO STRICT o FROM twuanis_canonical_private.offers WHERE id=oid FOR UPDATE;
  oid:=o.id;
  IF jsonb_typeof(p_command->'expected') IS DISTINCT FROM 'string' OR p_command->>'expected' IS DISTINCT FROM o.revision::text THEN RAISE EXCEPTION 'stale offer revision' USING ERRCODE='40001'; END IF;
  IF o.state IN ('archived','ended') AND NOT(op='archive' AND o.state='ended') THEN RAISE EXCEPTION 'offer is historical'; END IF;
  SELECT * INTO STRICT oldc FROM twuanis_canonical_private.offer_configurations WHERE id=o.current_configuration_id;
  before_data:=twuanis_canonical_private.offer_projection(oid,at_time);
  cid:=gen_random_uuid();v:=oldc.version+1;
 END IF;
 IF op IN ('create','configure') THEN
  IF jsonb_typeof(p_command->'name_en') IS DISTINCT FROM 'string' OR jsonb_typeof(p_command->'name_es') IS DISTINCT FROM 'string'
   OR (p_command->>'startsAt') !~ '(Z|[+-][0-9]{2}:[0-9]{2})$' OR (p_command->>'endsAt') !~ '(Z|[+-][0-9]{2}:[0-9]{2})$' THEN RAISE EXCEPTION 'localized names and timezone-aware dates required'; END IF;
  INSERT INTO twuanis_canonical_private.offer_configurations(id,offer_id,version,name_en,name_es,description_en,description_es,starts_at,ends_at,price_shape)
  VALUES(cid,oid,v,p_command->>'name_en',p_command->>'name_es',coalesce(p_command->>'description_en',''),coalesce(p_command->>'description_es',''),(p_command->>'startsAt')::timestamptz,(p_command->>'endsAt')::timestamptz,CASE WHEN v_target='addon-bulk-listing-import' THEN 'whole_job' ELSE 'scalar' END);
  IF v_target='addon-bulk-listing-import' THEN
   IF p_command ? 'prices' OR jsonb_typeof(p_command->'tiers') IS DISTINCT FROM 'array' OR jsonb_array_length(p_command->'tiers')<>3 THEN RAISE EXCEPTION 'three whole-job tiers required'; END IF;
   FOR x IN SELECT value FROM jsonb_array_elements(p_command->'tiers') LOOP
    IF EXISTS(SELECT 1 FROM jsonb_object_keys(x.value) k WHERE k<>ALL(ARRAY['min','max','unitRate','currency'])) OR jsonb_typeof(x.value->'unitRate') IS DISTINCT FROM 'string' OR (x.value->>'unitRate') !~ '^[0-9]+(\.[0-9]{1,2})?$' THEN RAISE EXCEPTION 'invalid tier'; END IF;
    INSERT INTO twuanis_canonical_private.offer_quantity_tiers VALUES(cid,x.value->>'currency',(x.value->>'min')::integer,(x.value->>'max')::integer,(x.value->>'unitRate')::numeric);
   END LOOP;
  ELSE
   IF p_command ? 'tiers' OR jsonb_typeof(p_command->'prices') IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'explicit scalar prices required'; END IF;
   FOR x IN SELECT key,value FROM jsonb_each(p_command->'prices') LOOP
    IF jsonb_typeof(x.value) IS DISTINCT FROM 'string' OR (x.value#>>'{}') !~ '^[0-9]+(\.[0-9]{1,2})?$' THEN RAISE EXCEPTION 'decimal money required'; END IF;
    INSERT INTO twuanis_canonical_private.offer_scalar_prices VALUES(cid,x.key,(x.value#>>'{}')::numeric);
   END LOOP;
  END IF;
  UPDATE twuanis_canonical_private.offers SET current_configuration_id=cid WHERE id=oid;
 ELSIF op='schedule' THEN
  IF o.state<>'draft' OR oldc.ends_at<at_time THEN RAISE EXCEPTION 'draft and nonexpired window required'; END IF;
  UPDATE twuanis_canonical_private.offers SET state='eligible' WHERE id=oid;
 ELSIF op='end' THEN
  UPDATE twuanis_canonical_private.offers SET state='ended',ended_at=at_time WHERE id=oid;
 ELSE
  IF nullif(btrim(p_command->>'reason'),'') IS NULL THEN RAISE EXCEPTION 'archive reason required'; END IF;
  UPDATE twuanis_canonical_private.offers SET state='archived',ended_at=coalesce(ended_at,at_time) WHERE id=oid;
 END IF;
 -- No precedence: any currency/window overlap is rejected while holding the v_target lock.
 IF EXISTS(SELECT 1 FROM twuanis_canonical_private.offers a
 JOIN twuanis_canonical_private.offer_configurations ac ON ac.id=a.current_configuration_id
 JOIN twuanis_canonical_private.offers b ON b.id<>a.id AND coalesce(b.package_id,b.addon_id)=v_target AND b.state='eligible'
 JOIN twuanis_canonical_private.offer_configurations bc ON bc.id=b.current_configuration_id
 WHERE a.id=oid AND a.state='eligible' AND ac.starts_at<=bc.ends_at AND bc.starts_at<=ac.ends_at
 AND EXISTS((SELECT currency FROM twuanis_canonical_private.offer_scalar_prices WHERE configuration_id=ac.id
 UNION SELECT currency FROM twuanis_canonical_private.offer_quantity_tiers WHERE configuration_id=ac.id)
 INTERSECT (SELECT currency FROM twuanis_canonical_private.offer_scalar_prices WHERE configuration_id=bc.id UNION SELECT currency FROM twuanis_canonical_private.offer_quantity_tiers WHERE configuration_id=bc.id))) THEN RAISE EXCEPTION 'overlapping applicable offers'; END IF;
 SET CONSTRAINTS twuanis_canonical_private.offer_valid,twuanis_canonical_private.offer_configuration_valid,twuanis_canonical_private.offer_scalar_valid,twuanis_canonical_private.offer_tier_valid IMMEDIATE;
 IF op<>'create' THEN UPDATE twuanis_canonical_private.offers SET revision=revision+1 WHERE id=oid; END IF;
 after_data:=twuanis_canonical_private.offer_projection(oid,at_time);
 authority:=CASE WHEN EXISTS(SELECT 1 FROM twuanis_canonical_private.owner_access_grants WHERE user_id=actor AND revoked_at IS NULL) THEN 'owner' ELSE 'scoped_administrator' END;
 eid:=twuanis_canonical_private.append_administrative_event(actor,authority,'offers.manage','offer.'||op,'offer',oid,before_data,after_data,p_command->>'reason',p_request);
 INSERT INTO twuanis_canonical_private.administrative_receipts VALUES(actor,p_request,jsonb_build_object('domain','offers','command',p_command),eid);
 RETURN jsonb_build_object('ok',true,'offerId',oid,'replayed',false);
END $$;
REVOKE ALL ON FUNCTION twuanis_canonical_private.offer_status(text,timestamptz,timestamptz,timestamptz),twuanis_canonical_private.offer_projection(uuid,timestamptz),public.admin_offer_command(uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.admin_offer_command(uuid,jsonb) TO authenticated;
COMMIT;
