-- Step11 local preparation only. Pre-publication payment policy explicitly approved.
BEGIN;
SET LOCAL lock_timeout='5s';
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
    ((s.payment_deadline>at_time OR twuanis_canonical_private.sinpe_pending_review(s.id)) AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_paid_acknowledgements a WHERE a.order_id=s.id))
    OR (EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_paid_acknowledgements a WHERE a.order_id=s.id)
     AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_fulfillments f WHERE f.purchase_id=s.id AND f.account_id=s.account_id AND f.product_id=s.product_id AND f.configuration_id=(s.resolved_terms->>'configurationId')::uuid AND f.target_kind='listing' AND f.target_id=s.listing_id AND f.result->>'ok'='true'))
   )) THEN RAISE EXCEPTION 'pending listing acquisition'; END IF;
   IF EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_placement_rights WHERE listing_id=p_listing AND product_id<>p_product AND effective_intervals @> at_time) THEN RAISE EXCEPTION 'incompatible active add-on'; END IF;
   -- Step11: an owned durable canonical draft may acquire an optional Order.
   -- Publication remains a separate prerequisite at trusted fulfillment, not ordering.
  ELSIF target_kind='operation' THEN
   IF p_job IS NULL OR p_listing IS NOT NULL THEN RAISE EXCEPTION 'server-owned job required'; END IF;
   -- Match existing fulfillment lock order: capacity policy -> publisher -> job.
   PERFORM twuanis_canonical_private.lock_capacity_policy(false);
   PERFORM id FROM public.publisher_accounts WHERE owner_user_id=p_account FOR UPDATE;
   SELECT * INTO STRICT j FROM twuanis_canonical_private.addon_import_jobs WHERE id=p_job AND account_id=p_account FOR UPDATE;
   quantity:=j.accepted_count;job_configuration:=j.configuration_id;
   IF EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_import_results WHERE job_id=p_job) THEN RAISE EXCEPTION 'bulk job already fulfilled'; END IF;
   at_time:=clock_timestamp();
   IF EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_order_snapshots o WHERE o.job_id=p_job AND (o.payment_deadline>at_time OR twuanis_canonical_private.sinpe_pending_review(o.id) OR EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_paid_acknowledgements a WHERE a.order_id=o.id))) THEN RAISE EXCEPTION 'bulk acquisition in flight'; END IF;
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


CREATE OR REPLACE FUNCTION public.retry_sinpe_fulfillment(p_order uuid,p_request uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid;prior twuanis_canonical_private.sinpe_fulfillment_attempts%ROWTYPE;o twuanis_canonical_private.offer_order_snapshots%ROWTYPE;a twuanis_canonical_private.offer_paid_acknowledgements%ROWTYPE;result jsonb;cfg twuanis_canonical_private.intelligence_package_configurations%ROWTYPE;term_id uuid;begins timestamptz;ends timestamptz;BEGIN
 actor:=twuanis_canonical_private.assert_administrative_permission('payments.review');
 IF p_request IS NULL OR p_order IS NULL THEN RAISE EXCEPTION 'bounded identity required';END IF;
 PERFORM pg_advisory_xact_lock(3192,hashtext(actor::text||p_request::text));
 SELECT * INTO prior FROM twuanis_canonical_private.sinpe_fulfillment_attempts WHERE actor_id=actor AND request_id=p_request;
 IF FOUND THEN IF prior.order_id<>p_order THEN RAISE EXCEPTION 'fulfillment request conflict';END IF;RETURN prior.result;END IF;
 SELECT * INTO STRICT o FROM twuanis_canonical_private.offer_order_snapshots WHERE id=p_order;
 SELECT a1.* INTO STRICT a FROM twuanis_canonical_private.offer_paid_acknowledgements a1 JOIN twuanis_canonical_private.sinpe_review_decisions d ON d.acknowledgement_id=a1.id WHERE a1.order_id=p_order AND d.disposition='APPROVED';
 -- Serialize every fulfillment for an Order, including distinct retry request identities.
 PERFORM pg_advisory_xact_lock(3200,hashtext(o.id::text));
 BEGIN
 IF o.target_type='package' THEN
  SELECT id INTO term_id FROM twuanis_canonical_private.entitlement_terms WHERE order_id=o.id;
  IF term_id IS NULL THEN
   SELECT * INTO STRICT cfg FROM twuanis_canonical_private.intelligence_package_configurations WHERE id=(o.resolved_terms->>'configurationId')::uuid AND package_id=o.product_id;
   IF o.resolved_terms->'terms' IS DISTINCT FROM jsonb_build_object('quantity',cfg.term_quantity,'unit',cfg.term_unit,'capabilities',cfg.capabilities) THEN RAISE EXCEPTION 'purchased package configuration mismatch';END IF;
   begins:=clock_timestamp();
   ends:=((begins AT TIME ZONE 'America/Costa_Rica')+make_interval(months=>cfg.term_quantity)) AT TIME ZONE 'America/Costa_Rica';
   term_id:=twuanis_canonical_private.commit_entitlement_term(o.account_id,'PACKAGE',o.product_id,cfg.id,NULL,'PURCHASED',o.id,a.id,actor,p_request,begins,ends,NULL,NULL);
  END IF;
  result:=jsonb_build_object('state','COMPLETE','evidence',jsonb_build_object('termId',term_id));
 ELSIF o.listing_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_fulfillments f WHERE f.purchase_id=o.id) AND EXISTS(SELECT 1 FROM public.listings l WHERE l.id=o.listing_id AND l.owner_id=o.account_id AND l.canonical_domain_version=1 AND l.listing_status NOT IN('active','deleted')) THEN
   -- No entitlement or capacity reservation; paid acknowledgement remains intact.
   result:=jsonb_build_object('state','PENDING','reason','awaiting_publication');
 ELSE
   result:=twuanis_canonical_private.fulfill_addon(o.id,a.payment_event_id,o.account_id,o.product_id,(o.resolved_terms->>'configurationId')::uuid,CASE WHEN o.job_id IS NOT NULL THEN 'operation' WHEN o.listing_id IS NOT NULL THEN 'listing' ELSE 'account' END,coalesce(o.job_id,o.listing_id,o.account_id),jsonb_build_object('currency',o.currency,'amount',o.resolved_terms->>'total'));
   result:=jsonb_build_object('state',CASE WHEN result->>'ok'='true' THEN 'COMPLETE' ELSE 'FAILED' END,'evidence',result);
 END IF;
  EXCEPTION WHEN OTHERS THEN result:=jsonb_build_object('state','FAILED','reason','fulfillment_revalidation_failed','sqlstate',SQLSTATE);
 END;
 INSERT INTO twuanis_canonical_private.sinpe_fulfillment_attempts(order_id,actor_id,request_id,result) VALUES(p_order,actor,p_request,result);
 PERFORM twuanis_canonical_private.append_administrative_event(actor,CASE WHEN public.is_current_user_owner() THEN 'Owner' ELSE 'Payment Review' END,'payments.review','sinpe.fulfillment','order',o.id,NULL,result,NULL,p_request);
 RETURN result;
END$$;
CREATE OR REPLACE FUNCTION twuanis_canonical_private.sinpe_projection(p_id uuid,p_admin boolean) RETURNS jsonb LANGUAGE sql STABLE SET search_path=pg_catalog AS $$
 SELECT jsonb_build_object('id',p.id,'orderId',p.canonical_order_id,'accountId',p.user_id,'submittedAt',p.created_at,'expectedAmount',o.resolved_terms->>'total','currency',o.currency,'deadline',o.payment_deadline,'lateEvidence',p.created_at>o.payment_deadline,'customerEvidence',p.submission_evidence,'receivingAccount',p.receiving_account_id,'state',coalesce(d.disposition,'REVIEW_PENDING'),'decisionAt',d.decided_at,'reason',d.reason,
 'awaitingPublication',d.disposition='APPROVED' AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_fulfillments f WHERE f.purchase_id=o.id) AND EXISTS(SELECT 1 FROM public.listings l WHERE l.id=o.listing_id AND l.owner_id=o.account_id AND l.listing_status NOT IN('active','deleted')),
 'fulfillmentState',CASE WHEN d.disposition<>'APPROVED' OR d.disposition IS NULL THEN 'NOT_ELIGIBLE' ELSE coalesce((SELECT f.result->>'state' FROM twuanis_canonical_private.sinpe_fulfillment_attempts f WHERE f.order_id=o.id ORDER BY f.created_at DESC,f.id DESC LIMIT 1),'PENDING') END,
 'review',CASE WHEN p_admin THEN jsonb_build_object('actorId',d.actor_id,'bankReference',d.bank_reference,'receivedAt',d.received_at,'amount',d.amount::text,'currency',d.currency,'bankEvidence',d.bank_evidence,'receivingAccount',d.receiving_account_id) ELSE NULL END,
 'order',CASE WHEN p_admin THEN twuanis_canonical_private.order_evidence(o.id) ELSE NULL END)
 FROM public.sinpe_payments p JOIN twuanis_canonical_private.offer_order_snapshots o ON o.id=p.canonical_order_id LEFT JOIN twuanis_canonical_private.sinpe_review_decisions d ON d.attempt_id=p.id WHERE p.id=p_id
$$;

-- Revalidate under the existing target lock, including same-product renewals.
CREATE OR REPLACE FUNCTION twuanis_canonical_private.fulfill_addon(p_purchase uuid,p_verified_payment uuid,p_account uuid,p_product text,p_configuration uuid,p_target_kind text,p_target uuid,p_evidence jsonb) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE p twuanis_canonical_private.addon_products%ROWTYPE;c twuanis_canonical_private.addon_configurations%ROWTYPE;
 old twuanis_canonical_private.addon_fulfillments%ROWTYPE;
 at_time timestamptz;expires timestamptz;result jsonb;term_id uuid;ack uuid;term_start timestamptz;
BEGIN
 IF p_purchase IS NULL OR p_verified_payment IS NULL OR p_account IS NULL OR p_target IS NULL OR jsonb_typeof(p_evidence) IS DISTINCT FROM 'object' OR octet_length(p_evidence::text)>16000 THEN RAISE EXCEPTION 'bounded trusted purchased evidence required'; END IF;
 -- This is a private INVOKER primitive for a future verified-payment transaction.
 -- UUIDs supplied by a browser are never accepted as proof; API roles have no EXECUTE.
 PERFORM pg_advisory_xact_lock(3153,hashtext(p_purchase::text));
 SELECT * INTO old FROM twuanis_canonical_private.addon_fulfillments WHERE purchase_id=p_purchase;
 IF FOUND THEN
  IF (old.verified_payment_id,old.account_id,old.product_id,old.configuration_id,old.target_kind,old.target_id,old.purchased_evidence) IS DISTINCT FROM (p_verified_payment,p_account,p_product,p_configuration,p_target_kind,p_target,p_evidence) THEN RAISE EXCEPTION 'purchase replay conflict'; END IF;
  RETURN old.result;
 END IF;
 SELECT * INTO STRICT p FROM twuanis_canonical_private.addon_products WHERE id=p_product;
 SELECT * INTO STRICT c FROM twuanis_canonical_private.addon_configurations WHERE product_id=p_product AND id=p_configuration;
 IF p.target IS DISTINCT FROM p_target_kind OR p.term_kind='unconfigured' THEN RAISE EXCEPTION 'target/fulfillment unavailable'; END IF;
 IF p_evidence->>'currency' IS NULL OR p_evidence->>'currency' NOT IN ('USD','CRC') OR jsonb_typeof(p_evidence->'amount') IS DISTINCT FROM 'string' OR (p_evidence->>'amount') !~ '^[0-9]+(\.[0-9]{1,2})?$' OR (p_evidence->>'amount')::numeric<=0 THEN RAISE EXCEPTION 'immutable resolved purchase price required'; END IF;
 IF p.term_kind IN ('whole_job','lifetime') AND p_evidence->>'currency'<>'USD' THEN RAISE EXCEPTION 'unpriced currency'; END IF;
 SELECT a.id INTO STRICT ack FROM twuanis_canonical_private.offer_paid_acknowledgements a
 JOIN twuanis_canonical_private.offer_order_snapshots o ON o.id=a.order_id
 WHERE o.id=p_purchase AND a.payment_event_id=p_verified_payment AND o.account_id=p_account AND o.product_id=p_product
 AND (o.resolved_terms->>'configurationId')::uuid=p_configuration AND o.currency=p_evidence->>'currency'
 AND o.resolved_terms->>'total'=p_evidence->>'amount'
 AND coalesce(o.job_id,o.listing_id,o.account_id)=p_target;
 IF p.term_kind='elapsed_days' THEN
  IF c.duration_days IS NULL THEN RAISE EXCEPTION 'purchased duration missing';END IF;
  IF p.behavior='homepage_carousel' THEN PERFORM h.capacity FROM twuanis_canonical_private.addon_homepage_capacity h WHERE h.id FOR UPDATE;END IF;
  PERFORM id FROM public.listings WHERE id=p_target FOR UPDATE;
  IF NOT EXISTS(SELECT 1 FROM public.listings WHERE id=p_target AND listing_status='active' AND canonical_domain_version=1 AND owner_id=p_account) THEN RAISE EXCEPTION 'publication required for purchased fulfillment';END IF;
  at_time:=clock_timestamp();
  SELECT greatest(at_time,max(t.ends_at)) INTO term_start FROM twuanis_canonical_private.entitlement_terms t
  WHERE t.listing_id=p_target AND t.product_id=p_product AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.entitlement_revocations r WHERE r.term_id=t.id);
  expires:=term_start+c.duration_days*interval '24 hours';
  term_id:=twuanis_canonical_private.commit_entitlement_term(p_account,'LISTING_ADDON',p_product,p_configuration,p_target,'PURCHASED',p_purchase,ack,auth.uid(),p_purchase,term_start,expires,NULL,NULL);
  result:=jsonb_build_object('ok',true,'termId',term_id,'listingId',p_target,'activatedAt',term_start,'expiresAt',expires,'behavior',p.behavior);
 ELSIF p.term_kind='lifetime' THEN
  IF p_target<>p_account THEN RAISE EXCEPTION 'account target mismatch';END IF;
  at_time:=clock_timestamp();
  term_id:=twuanis_canonical_private.commit_entitlement_term(p_account,'FOUNDING_MEMBERSHIP',p_product,p_configuration,NULL,'PURCHASED',p_purchase,ack,auth.uid(),p_purchase,at_time,NULL,NULL,NULL);
  result:=jsonb_build_object('ok',true,'termId',term_id,'accountId',p_account,'kind','founding_pricing_entitlement');
 ELSE
  IF NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_import_jobs WHERE id=p_target AND account_id=p_account AND configuration_id=p_configuration) THEN RAISE EXCEPTION 'immutable customer job mismatch'; END IF;
  result:=jsonb_build_object('ok',true,'jobId',p_target,'listings',twuanis_canonical_private.fulfill_customer_addon_import(p_target,p_purchase,p_verified_payment));at_time:=clock_timestamp();
 END IF;
 INSERT INTO twuanis_canonical_private.addon_fulfillments VALUES(p_purchase,p_verified_payment,p_account,p_product,p_configuration,p_target_kind,p_target,p_evidence,result,at_time);
 RETURN result;
END $$;
COMMIT;
