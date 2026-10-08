-- Step 8 LOCAL ONLY. Existing Order identity, no checkout/payment/fulfillment grant.
BEGIN;
SET LOCAL lock_timeout='5s';
CREATE INDEX offer_order_job_window ON twuanis_canonical_private.offer_order_snapshots(job_id,payment_deadline);
CREATE INDEX offer_order_account_page ON twuanis_canonical_private.offer_order_snapshots(account_id,id);
CREATE OR REPLACE FUNCTION twuanis_canonical_private.create_offer_order_snapshot(p_account uuid,p_request uuid,p_kind text,p_product text,p_currency text,p_listing uuid DEFAULT NULL,p_job uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SET search_path=pg_catalog AS $$
DECLARE prior twuanis_canonical_private.offer_order_snapshots%ROWTYPE;l public.listings%ROWTYPE;quantity integer:=1;at_time timestamptz;terms jsonb;oid uuid;target_kind text;job_configuration uuid;j twuanis_canonical_private.addon_import_jobs%ROWTYPE;x jsonb;version bigint;standard_tier jsonb;effective_tier jsonb;
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
   -- Match existing fulfillment lock order: capacity policy -> publisher -> job.
   PERFORM twuanis_canonical_private.lock_capacity_policy(false);
   PERFORM id FROM public.publisher_accounts WHERE owner_user_id=p_account FOR UPDATE;
   SELECT * INTO STRICT j FROM twuanis_canonical_private.addon_import_jobs WHERE id=p_job AND account_id=p_account FOR UPDATE;
   quantity:=j.accepted_count;job_configuration:=j.configuration_id;
   IF EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_import_results WHERE job_id=p_job) THEN RAISE EXCEPTION 'bulk job already fulfilled'; END IF;
   at_time:=clock_timestamp();
   IF EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_order_snapshots o WHERE o.job_id=p_job AND (o.payment_deadline>at_time OR EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_paid_acknowledgements a WHERE a.order_id=o.id))) THEN RAISE EXCEPTION 'bulk acquisition in flight'; END IF;
   IF j.validator_version<>'canonical-customer-v1' OR j.total IS NULL OR j.currency IS DISTINCT FROM p_currency THEN RAISE EXCEPTION 'accepted job unavailable'; END IF;
   -- Revalidate independently; this creates/reserves no listing or capacity.
   LOCK TABLE public.ontology_terms,public.ontology_relationships,twuanis_canonical_private.accessibility_identity IN SHARE MODE;
   FOR x IN SELECT value FROM jsonb_array_elements(j.accepted_rows) LOOP PERFORM twuanis_canonical_private.addon_customer_input(x->'input'); END LOOP;
   PERFORM twuanis_canonical_private.addon_publication_capacity(p_account,quantity);
  ELSE
   IF p_listing IS NOT NULL OR p_job IS NOT NULL THEN RAISE EXCEPTION 'account target required'; END IF;
  END IF;
 END IF;
 at_time:=clock_timestamp();
 terms:=twuanis_canonical_private.resolve_offer_price(p_kind,p_product,p_currency,quantity,at_time);
 IF terms->>'available' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'no authoritative purchasable price'; END IF;
 IF p_job IS NOT NULL AND job_configuration IS DISTINCT FROM (terms->>'configurationId')::uuid THEN RAISE EXCEPTION 'job configuration is no longer current; new authoritative preflight required'; END IF;
 -- Complete immutable evidence without a second resolver or Order identity.
 IF p_kind='package' THEN SELECT c.version INTO STRICT version FROM twuanis_canonical_private.intelligence_package_configurations c WHERE c.id=(terms->>'configurationId')::uuid;
 ELSE SELECT c.version INTO STRICT version FROM twuanis_canonical_private.addon_configurations c WHERE c.id=(terms->>'configurationId')::uuid; END IF;
 IF p_job IS NOT NULL THEN
  SELECT jsonb_build_object('lower',lower_quantity,'upper',upper_quantity,'unitRate',unit_rate::text) INTO STRICT standard_tier FROM twuanis_canonical_private.addon_quantity_tiers WHERE configuration_id=job_configuration AND currency=p_currency AND quantity BETWEEN lower_quantity AND upper_quantity;
  IF terms->>'source'='OFFER' THEN
   SELECT jsonb_build_object('lower',lower_quantity,'upper',upper_quantity,'unitRate',unit_rate::text) INTO STRICT effective_tier FROM twuanis_canonical_private.offer_quantity_tiers WHERE configuration_id=(terms->>'offerConfigurationId')::uuid AND currency=p_currency AND quantity BETWEEN lower_quantity AND upper_quantity;
  ELSE effective_tier:=standard_tier;END IF;
 END IF;
 terms:=terms||jsonb_build_object('orderContractVersion',1,'configurationVersion',version::text,
 'productClass',CASE WHEN p_kind='package' THEN 'PACKAGE' WHEN p_job IS NOT NULL THEN 'BULK_IMPORT' WHEN p_listing IS NOT NULL THEN 'LISTING_ADDON' ELSE 'FOUNDING_MEMBERSHIP' END,
 'targetKind',CASE WHEN p_listing IS NOT NULL THEN 'listing' WHEN p_job IS NOT NULL THEN 'job' ELSE 'account' END,'targetId',coalesce(p_listing,p_job,p_account),
 'standardTotal',((terms->>'standardRate')::numeric*quantity)::text,'standardTier',standard_tier,'purchasedTier',effective_tier,
 'offerVersion',(SELECT c.version::text FROM twuanis_canonical_private.offer_configurations c WHERE c.id=(terms->>'offerConfigurationId')::uuid),
 'acceptedJob',CASE WHEN p_job IS NOT NULL THEN jsonb_build_object('id',j.id,'acceptedQuantity',j.accepted_count,'fingerprint',j.input_fingerprint,'validator',j.validator_version,'publicationEvidence',j.publication_evidence) ELSE NULL END);
 -- Universal V1: every unpaid customer Order has the same 24-hour deadline.
 INSERT INTO twuanis_canonical_private.offer_order_snapshots(account_id,request_id,target_type,product_id,listing_id,job_id,currency,resolved_terms,created_at,payment_deadline)
 VALUES(p_account,p_request,p_kind,p_product,p_listing,p_job,p_currency,terms,at_time,at_time+interval '24 hours') RETURNING id INTO oid;
 RETURN jsonb_build_object('id',oid,'terms',terms,'createdAt',at_time,'paymentDeadline',at_time+interval '24 hours','expired',false,'replayed',false);
END $$;

REVOKE ALL ON FUNCTION twuanis_canonical_private.create_offer_order_snapshot(uuid,uuid,text,text,text,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION twuanis_canonical_private.order_evidence(p_id uuid) RETURNS jsonb LANGUAGE sql STABLE SET search_path=pg_catalog AS $$
 SELECT jsonb_build_object('id',o.id,'accountId',o.account_id,'requestId',o.request_id,'productId',o.product_id,'targetType',o.target_type,'listingId',o.listing_id,'jobId',o.job_id,'currency',o.currency,'createdAt',o.created_at,'paymentDeadline',o.payment_deadline,'terms',o.resolved_terms,
 'state',twuanis_canonical_private.offer_order_state(o.id,statement_timestamp()),
 'payment', (SELECT jsonb_build_object('id',a.id,'eventId',a.payment_event_id,'source',a.source,'amount',a.amount::text,'currency',a.currency,'acknowledgedAt',a.acknowledged_at) FROM twuanis_canonical_private.offer_paid_acknowledgements a WHERE a.order_id=o.id),
 'fulfillment',(SELECT jsonb_build_object('purchaseId',f.purchase_id,'paymentId',f.verified_payment_id,'activatedAt',f.activated_at,'result',f.result) FROM twuanis_canonical_private.addon_fulfillments f WHERE f.purchase_id=o.id AND f.account_id=o.account_id AND f.product_id=o.product_id AND f.configuration_id=(o.resolved_terms->>'configurationId')::uuid AND f.target_id=coalesce(o.listing_id,o.job_id,o.account_id)),
 'evidenceComplete',o.resolved_terms->>'orderContractVersion'='1')
 FROM twuanis_canonical_private.offer_order_snapshots o WHERE o.id=p_id
$$;
REVOKE ALL ON FUNCTION twuanis_canonical_private.order_evidence(uuid) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.admin_order_read(p_id uuid DEFAULT NULL,p_after uuid DEFAULT NULL,p_account uuid DEFAULT NULL,p_kind text DEFAULT NULL,p_source text DEFAULT NULL,p_currency text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$DECLARE result jsonb;BEGIN
 PERFORM twuanis_canonical_private.assert_administrative_permission('orders.read');
 IF (p_kind IS NOT NULL AND p_kind NOT IN ('package','addon')) OR (p_source IS NOT NULL AND p_source NOT IN ('STANDARD','OFFER')) OR (p_currency IS NOT NULL AND p_currency NOT IN ('USD','CRC')) THEN RAISE EXCEPTION 'invalid Order filter'; END IF;
 IF p_id IS NOT NULL THEN RETURN twuanis_canonical_private.order_evidence(p_id); END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',q.id,'accountId',q.account_id,'productId',q.product_id,'currency',q.currency,'source',q.resolved_terms->>'source','total',q.resolved_terms->>'total','createdAt',q.created_at,'paymentDeadline',q.payment_deadline,'state',twuanis_canonical_private.offer_order_state(q.id,statement_timestamp())) ORDER BY q.id),'[]') INTO result FROM (
 SELECT o.* FROM twuanis_canonical_private.offer_order_snapshots o WHERE (p_after IS NULL OR o.id>p_after) AND (p_account IS NULL OR o.account_id=p_account) AND (p_kind IS NULL OR o.target_type=p_kind) AND (p_source IS NULL OR o.resolved_terms->>'source'=p_source) AND (p_currency IS NULL OR o.currency=p_currency) ORDER BY o.id LIMIT 26)q;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.admin_order_read(uuid,uuid,uuid,text,text,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.admin_order_read(uuid,uuid,uuid,text,text,text) TO authenticated;
COMMIT;
