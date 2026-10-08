-- Local Step6 authority. No customer Order API or fulfillment activation.
BEGIN;
CREATE TABLE twuanis_canonical_private.offer_order_snapshots(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),account_id uuid NOT NULL REFERENCES auth.users(id),request_id uuid NOT NULL,
 target_type text NOT NULL CHECK(target_type IN ('package','addon')),product_id text NOT NULL,
 listing_id uuid REFERENCES public.listings(id),job_id uuid REFERENCES twuanis_canonical_private.addon_import_jobs(id),
 currency text NOT NULL CHECK(currency IN ('USD','CRC')),resolved_terms jsonb NOT NULL,
 created_at timestamptz NOT NULL,payment_deadline timestamptz NOT NULL,
 UNIQUE(account_id,request_id),CHECK(payment_deadline=created_at+interval '24 hours')
);
CREATE INDEX offer_pending_listing ON twuanis_canonical_private.offer_order_snapshots(listing_id,payment_deadline);
CREATE TRIGGER offer_order_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON twuanis_canonical_private.offer_order_snapshots FOR EACH STATEMENT EXECUTE FUNCTION twuanis_canonical_private.administrative_immutable();
ALTER TABLE twuanis_canonical_private.offer_order_snapshots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON twuanis_canonical_private.offer_order_snapshots FROM PUBLIC,anon,authenticated,service_role;
-- Dormant contract only: no bank verification and no runtime caller grant.
CREATE TABLE twuanis_canonical_private.offer_paid_acknowledgements(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),order_id uuid NOT NULL UNIQUE REFERENCES twuanis_canonical_private.offer_order_snapshots(id),
 request_id uuid NOT NULL UNIQUE,source text NOT NULL CHECK(length(btrim(source)) BETWEEN 1 AND 100),
 payment_event_id uuid NOT NULL,external_reference text CHECK(length(external_reference)<=500),
 amount numeric NOT NULL CHECK(amount>0 AND amount<1000000000000 AND scale(amount)<=2),currency text NOT NULL CHECK(currency IN ('USD','CRC')),
 acknowledged_at timestamptz NOT NULL,authority text NOT NULL CHECK(length(btrim(authority)) BETWEEN 1 AND 300),
 execution_actor name NOT NULL DEFAULT session_user,UNIQUE(source,payment_event_id)
);
ALTER TABLE twuanis_canonical_private.offer_paid_acknowledgements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON twuanis_canonical_private.offer_paid_acknowledgements FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER offer_paid_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON twuanis_canonical_private.offer_paid_acknowledgements FOR EACH STATEMENT EXECUTE FUNCTION twuanis_canonical_private.administrative_immutable();
CREATE FUNCTION twuanis_canonical_private.offer_order_state(p_order uuid,p_at timestamptz) RETURNS text
LANGUAGE sql STABLE SET search_path=pg_catalog AS $$
 SELECT CASE WHEN EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id=o.id) THEN 'paid' WHEN p_at>=o.payment_deadline THEN 'expired' ELSE 'pending' END
 FROM twuanis_canonical_private.offer_order_snapshots o WHERE o.id=p_order
$$;
CREATE FUNCTION twuanis_canonical_private.acknowledge_offer_order_paid(p_order uuid,p_request uuid,p_source text,p_event uuid,p_amount numeric,p_currency text,p_authority text,p_external_reference text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SET search_path=pg_catalog AS $$
DECLARE o twuanis_canonical_private.offer_order_snapshots%ROWTYPE;a twuanis_canonical_private.offer_paid_acknowledgements%ROWTYPE;at_time timestamptz;aid uuid;
BEGIN
 IF p_order IS NULL OR p_request IS NULL OR p_event IS NULL OR nullif(btrim(p_source),'') IS NULL OR nullif(btrim(p_authority),'') IS NULL OR p_amount IS NULL OR p_currency IS NULL THEN RAISE EXCEPTION 'trusted payment evidence required'; END IF;
 PERFORM pg_advisory_xact_lock(3163,hashtext(p_request::text));
 SELECT * INTO a FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE request_id=p_request;
 IF FOUND THEN
  IF (a.order_id,a.source,a.payment_event_id,a.amount,a.currency,a.authority,a.external_reference) IS DISTINCT FROM (p_order,p_source,p_event,p_amount,p_currency,p_authority,p_external_reference) THEN RAISE EXCEPTION 'payment acknowledgement replay conflict'; END IF;
  RETURN jsonb_build_object('id',a.id,'orderId',a.order_id,'state','paid','replayed',true);
 END IF;
 SELECT * INTO STRICT o FROM twuanis_canonical_private.offer_order_snapshots WHERE id=p_order;
 IF o.listing_id IS NOT NULL THEN PERFORM id FROM public.listings WHERE id=o.listing_id FOR UPDATE; END IF;
 SELECT * INTO STRICT o FROM twuanis_canonical_private.offer_order_snapshots WHERE id=p_order FOR UPDATE;
 at_time:=clock_timestamp();
 IF EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id=p_order) THEN RAISE EXCEPTION 'order already acknowledged'; END IF;
 IF at_time>=o.payment_deadline THEN RAISE EXCEPTION 'expired unpaid order; later payment resolution required'; END IF;
 IF p_currency IS DISTINCT FROM o.currency OR p_amount IS DISTINCT FROM (o.resolved_terms->>'total')::numeric THEN RAISE EXCEPTION 'payment does not match immutable order'; END IF;
 INSERT INTO twuanis_canonical_private.offer_paid_acknowledgements(order_id,request_id,source,payment_event_id,external_reference,amount,currency,acknowledged_at,authority)
 VALUES(p_order,p_request,p_source,p_event,p_external_reference,p_amount,p_currency,at_time,p_authority) RETURNING id INTO aid;
 RETURN jsonb_build_object('id',aid,'orderId',p_order,'state','paid','replayed',false);
END $$;
REVOKE ALL ON FUNCTION twuanis_canonical_private.offer_order_state(uuid,timestamptz),twuanis_canonical_private.acknowledge_offer_order_paid(uuid,uuid,text,uuid,numeric,text,text,text) FROM PUBLIC,anon,authenticated,service_role;
-- Price resolution is private: time and accepted quantity are supplied only by trusted callers.
CREATE FUNCTION twuanis_canonical_private.resolve_offer_price(p_kind text,p_product text,p_currency text,p_quantity integer,p_at timestamptz) RETURNS jsonb
LANGUAGE plpgsql STABLE SET search_path=pg_catalog AS $$
DECLARE config uuid;term jsonb;standard numeric;effective numeric;oc uuid;oid uuid;n integer;end_time timestamptz;label_en text;label_es text;shape text;
BEGIN
 IF p_kind IS NULL OR p_kind NOT IN ('package','addon') OR p_currency IS NULL OR p_currency NOT IN ('USD','CRC') OR p_quantity IS NULL OR p_quantity<1 OR p_at IS NULL OR NOT isfinite(p_at) THEN RAISE EXCEPTION 'invalid resolution context'; END IF;
 IF p_kind='package' THEN
  SELECT c.id,jsonb_build_object('quantity',c.term_quantity,'unit',c.term_unit,'capabilities',c.capabilities)
  INTO config,term FROM twuanis_canonical_private.intelligence_packages p JOIN twuanis_canonical_private.intelligence_package_configurations c ON c.id=p.current_configuration_id WHERE p.id=p_product AND p.state='active';
  SELECT amount INTO standard FROM twuanis_canonical_private.intelligence_package_prices WHERE package_id=p_product AND currency=p_currency;
  shape:='scalar';
 ELSE
  SELECT c.id,jsonb_build_object('kind',p.term_kind,'durationDays',c.duration_days,'behavior',p.behavior),CASE WHEN p.term_kind='whole_job' THEN 'whole_job' ELSE 'scalar' END
  INTO config,term,shape FROM twuanis_canonical_private.addon_products p JOIN twuanis_canonical_private.addon_configurations c ON c.id=p.current_configuration_id WHERE p.id=p_product AND p.state='active' AND p.term_kind<>'unconfigured';
  IF shape='whole_job' THEN
   SELECT unit_rate INTO standard FROM twuanis_canonical_private.addon_quantity_tiers WHERE configuration_id=config AND currency=p_currency AND p_quantity BETWEEN lower_quantity AND upper_quantity;
  ELSE
   SELECT amount INTO standard FROM twuanis_canonical_private.addon_standard_prices WHERE configuration_id=config AND currency=p_currency;
  END IF;
 END IF;
 IF config IS NULL THEN RETURN jsonb_build_object('available',false,'reason','target_unavailable'); END IF;
 IF shape='scalar' AND p_quantity<>1 THEN RAISE EXCEPTION 'scalar quantity must be one'; END IF;
 IF standard IS NULL THEN RETURN jsonb_build_object('available',false,'reason','unpriced'); END IF;
 SELECT count(*) INTO n FROM twuanis_canonical_private.offers o JOIN twuanis_canonical_private.offer_configurations c ON c.id=o.current_configuration_id
 WHERE ((p_kind='package' AND o.package_id=p_product) OR (p_kind='addon' AND o.addon_id=p_product)) AND o.state='eligible' AND p_at BETWEEN c.starts_at AND c.ends_at
 AND (EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_scalar_prices WHERE configuration_id=c.id AND currency=p_currency)
 OR EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_quantity_tiers WHERE configuration_id=c.id AND currency=p_currency AND p_quantity BETWEEN lower_quantity AND upper_quantity));
 IF n>1 THEN RAISE EXCEPTION 'ambiguous applicable offer'; END IF;
 IF n=1 THEN
  SELECT o.id,c.id,c.ends_at,c.name_en,c.name_es,coalesce(s.amount,t.unit_rate) INTO oid,oc,end_time,label_en,label_es,effective
  FROM twuanis_canonical_private.offers o JOIN twuanis_canonical_private.offer_configurations c ON c.id=o.current_configuration_id
  LEFT JOIN twuanis_canonical_private.offer_scalar_prices s ON s.configuration_id=c.id AND s.currency=p_currency
  LEFT JOIN twuanis_canonical_private.offer_quantity_tiers t ON t.configuration_id=c.id AND t.currency=p_currency AND p_quantity BETWEEN t.lower_quantity AND t.upper_quantity
  WHERE ((p_kind='package' AND o.package_id=p_product) OR (p_kind='addon' AND o.addon_id=p_product)) AND o.state='eligible' AND p_at BETWEEN c.starts_at AND c.ends_at AND coalesce(s.amount,t.unit_rate) IS NOT NULL;
 END IF;
 effective:=coalesce(effective,standard);
 RETURN jsonb_build_object('available',true,'targetType',p_kind,'productId',p_product,'configurationId',config,'currency',p_currency,
 'priceShape',shape,'quantity',p_quantity,'standardRate',standard::text,'effectiveRate',effective::text,'total',(effective*p_quantity)::text,
 'source',CASE WHEN oid IS NULL THEN 'STANDARD' ELSE 'OFFER' END,'offerId',oid,'offerConfigurationId',oc,'offerEnd',end_time,'name_en',label_en,'name_es',label_es,'terms',term,'resolvedAt',p_at);
END $$;
CREATE FUNCTION twuanis_canonical_private.create_offer_order_snapshot(p_account uuid,p_request uuid,p_kind text,p_product text,p_currency text,p_listing uuid DEFAULT NULL,p_job uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SET search_path=pg_catalog AS $$
DECLARE prior twuanis_canonical_private.offer_order_snapshots%ROWTYPE;l public.listings%ROWTYPE;quantity integer:=1;at_time timestamptz;terms jsonb;oid uuid;target_kind text;job_configuration uuid;
BEGIN
 IF p_account IS NULL OR p_request IS NULL OR p_kind IS NULL OR p_kind NOT IN ('package','addon') OR p_product IS NULL OR length(p_product)>150 THEN RAISE EXCEPTION 'trusted bounded identity required'; END IF;
 PERFORM pg_advisory_xact_lock(3162,hashtext(jsonb_build_array(p_account,p_request)::text));
 SELECT * INTO prior FROM twuanis_canonical_private.offer_order_snapshots WHERE account_id=p_account AND request_id=p_request;
 IF FOUND THEN
  IF (prior.target_type,prior.product_id,prior.currency,prior.listing_id,prior.job_id) IS DISTINCT FROM (p_kind,p_product,p_currency,p_listing,p_job) THEN RAISE EXCEPTION 'order replay conflict'; END IF;
  RETURN jsonb_build_object('id',prior.id,'terms',prior.resolved_terms,'createdAt',prior.created_at,'paymentDeadline',prior.payment_deadline,'state',twuanis_canonical_private.offer_order_state(prior.id,clock_timestamp()),'expired',twuanis_canonical_private.offer_order_state(prior.id,clock_timestamp())='expired','replayed',true);
 END IF;
 PERFORM pg_advisory_xact_lock(3161,hashtext(p_kind||':'||p_product));
 IF p_kind='package' THEN
  IF p_listing IS NOT NULL OR p_job IS NOT NULL THEN RAISE EXCEPTION 'package targets account'; END IF;
  PERFORM id FROM twuanis_canonical_private.intelligence_packages WHERE id=p_product FOR SHARE;
  PERFORM package_id FROM twuanis_canonical_private.intelligence_package_prices WHERE package_id=p_product FOR SHARE;
 ELSE
  SELECT target INTO STRICT target_kind FROM twuanis_canonical_private.addon_products WHERE id=p_product FOR SHARE;
  IF target_kind='listing' THEN
   IF p_listing IS NULL OR p_job IS NOT NULL THEN RAISE EXCEPTION 'listing target required'; END IF;
   SELECT * INTO STRICT l FROM public.listings WHERE id=p_listing FOR UPDATE;
   IF l.owner_id IS DISTINCT FROM p_account OR l.canonical_domain_version IS DISTINCT FROM 1 OR l.listing_status='deleted' THEN RAISE EXCEPTION 'owned canonical listing required'; END IF;
   at_time:=clock_timestamp();
   IF EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_order_snapshots s WHERE s.listing_id=p_listing AND (
    (s.payment_deadline>at_time AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_paid_acknowledgements a WHERE a.order_id=s.id))
    OR (EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_paid_acknowledgements a WHERE a.order_id=s.id)
     AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_fulfillments f WHERE f.purchase_id=s.id AND f.account_id=s.account_id AND f.product_id=s.product_id AND f.configuration_id=(s.resolved_terms->>'configurationId')::uuid AND f.target_kind='listing' AND f.target_id=s.listing_id AND f.result->>'ok'='true'))
   )) THEN RAISE EXCEPTION 'pending listing acquisition'; END IF;
   IF EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_placement_rights WHERE listing_id=p_listing AND product_id<>p_product AND activated_at<=at_time AND expires_at>at_time AND revoked_at IS NULL) THEN RAISE EXCEPTION 'incompatible active add-on'; END IF;
   IF l.listing_status<>'active' AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_placement_rights WHERE listing_id=p_listing AND product_id=p_product AND activated_at<=at_time AND expires_at>at_time AND revoked_at IS NULL) THEN RAISE EXCEPTION 'publication required for new placement'; END IF;
  ELSIF target_kind='operation' THEN
   IF p_job IS NULL OR p_listing IS NOT NULL THEN RAISE EXCEPTION 'server-owned job required'; END IF;
   SELECT accepted_count,configuration_id INTO STRICT quantity,job_configuration FROM twuanis_canonical_private.addon_import_jobs WHERE id=p_job AND account_id=p_account FOR SHARE;
  ELSE
   IF p_listing IS NOT NULL OR p_job IS NOT NULL THEN RAISE EXCEPTION 'account target required'; END IF;
  END IF;
 END IF;
 at_time:=clock_timestamp();
 terms:=twuanis_canonical_private.resolve_offer_price(p_kind,p_product,p_currency,quantity,at_time);
 IF terms->>'available' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'no authoritative purchasable price'; END IF;
 IF p_job IS NOT NULL AND job_configuration IS DISTINCT FROM (terms->>'configurationId')::uuid THEN RAISE EXCEPTION 'job configuration is no longer current; new authoritative preflight required'; END IF;
 -- Universal V1: every unpaid customer Order has the same 24-hour deadline.
 INSERT INTO twuanis_canonical_private.offer_order_snapshots(account_id,request_id,target_type,product_id,listing_id,job_id,currency,resolved_terms,created_at,payment_deadline)
 VALUES(p_account,p_request,p_kind,p_product,p_listing,p_job,p_currency,terms,at_time,at_time+interval '24 hours') RETURNING id INTO oid;
 RETURN jsonb_build_object('id',oid,'terms',terms,'createdAt',at_time,'paymentDeadline',at_time+interval '24 hours','expired',false,'replayed',false);
END $$;
REVOKE ALL ON FUNCTION twuanis_canonical_private.resolve_offer_price(text,text,text,integer,timestamptz),twuanis_canonical_private.create_offer_order_snapshot(uuid,uuid,text,text,text,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
