-- LOCAL ONLY. Continuous purchased Package scheduling; no composition change.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
-- This lock is held until the caller commits its one immutable purchased contribution.
-- Existing grants and legacy access are deliberately absent from this query.
CREATE FUNCTION twuanis_canonical_private.purchased_package_interval(
 p_account uuid,p_product text,p_unit text,p_quantity integer,p_fulfilled_at timestamptz
) RETURNS TABLE(starts_at timestamptz,ends_at timestamptz)
LANGUAGE plpgsql VOLATILE SET search_path=pg_catalog AS $$
DECLARE coverage tstzmultirange;tail timestamptz;
BEGIN
 IF p_account IS NULL OR p_product IS NULL OR p_fulfilled_at IS NULL OR NOT isfinite(p_fulfilled_at)
 OR p_quantity IS DISTINCT FROM 1 OR p_unit NOT IN('day','month') OR p_unit IS NULL THEN
 RAISE EXCEPTION 'explicit daily or monthly Package term required';END IF;
 PERFORM id FROM twuanis_canonical_private.intelligence_packages WHERE id=p_product;
 IF NOT FOUND THEN RAISE EXCEPTION 'canonical Package required';END IF;
 PERFORM pg_advisory_xact_lock(3254,hashtext(p_account::text||':'||p_product));
 -- range_agg merges touching intervals, but keeps disjoint future coverage separate.
 SELECT range_agg(twuanis_canonical_private.entitlement_interval(t.starts_at,t.ends_at,v.revoked_at))
 INTO coverage FROM twuanis_canonical_private.entitlement_terms t
 LEFT JOIN twuanis_canonical_private.entitlement_revocations v ON v.term_id=t.id
 WHERE t.account_id=p_account AND t.product_class='PACKAGE' AND t.product_id=p_product AND t.source='PURCHASED';
 SELECT upper(span) INTO tail FROM unnest(coverage) span WHERE span @> p_fulfilled_at;
 starts_at:=coalesce(tail,p_fulfilled_at);
 ends_at:=CASE WHEN p_unit='day' THEN starts_at+interval '24 hours'
 ELSE ((starts_at AT TIME ZONE 'America/Costa_Rica')+interval '1 month') AT TIME ZONE 'America/Costa_Rica' END;
 RETURN NEXT;
END $$;
REVOKE ALL ON FUNCTION twuanis_canonical_private.purchased_package_interval(uuid,text,text,integer,timestamptz) FROM PUBLIC,anon,authenticated,service_role;
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
   SELECT starts_at,ends_at INTO begins,ends FROM twuanis_canonical_private.purchased_package_interval(o.account_id,o.product_id,cfg.term_unit,cfg.term_quantity,clock_timestamp());
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

COMMIT;
