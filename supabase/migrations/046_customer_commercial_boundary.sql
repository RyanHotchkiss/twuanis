-- Local Step11 preparation. All intake remains disabled until separately activated.
BEGIN;
CREATE TABLE twuanis_canonical_private.customer_commerce_control(singleton boolean PRIMARY KEY CHECK(singleton),enabled boolean NOT NULL DEFAULT false);
INSERT INTO twuanis_canonical_private.customer_commerce_control VALUES(true,false);
ALTER TABLE twuanis_canonical_private.customer_commerce_control ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON twuanis_canonical_private.customer_commerce_control FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.customer_commerce_ready() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT coalesce((SELECT enabled FROM twuanis_canonical_private.customer_commerce_control WHERE singleton),false)
$$;
REVOKE ALL ON FUNCTION public.customer_commerce_ready() FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.customer_commerce_ready() TO authenticated,service_role;
CREATE FUNCTION public.create_customer_order(p_request uuid,p_kind text,p_product text,p_currency text,p_listing uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=auth.uid();result jsonb;
BEGIN
 IF actor IS NULL OR auth.jwt()->>'role' IS DISTINCT FROM 'authenticated' OR NOT public.customer_commerce_ready() THEN RAISE EXCEPTION 'customer commerce unavailable';END IF;
 IF p_kind IS NULL OR p_kind NOT IN('package','addon') OR p_currency IS NULL OR p_currency NOT IN('USD','CRC') THEN RAISE EXCEPTION 'invalid commercial intent';END IF;
 IF NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.sinpe_receiving_accounts WHERE enabled AND currency=p_currency) THEN RAISE EXCEPTION 'payment channel unavailable';END IF;
 IF p_kind='addon' AND (p_listing IS NULL OR NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_products WHERE id=p_product AND target='listing' AND term_kind='elapsed_days')) THEN RAISE EXCEPTION 'listing Add-on required';END IF;
 result:=twuanis_canonical_private.create_offer_order_snapshot(actor,p_request,p_kind,p_product,p_currency,p_listing,NULL);
 -- Exact safe identifier only: internal immutable commercial configuration stays server-side.
 RETURN jsonb_build_object('id',result->>'id','replayed',result->'replayed');
END$$;
REVOKE ALL ON FUNCTION public.create_customer_order(uuid,text,text,text,uuid) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.create_customer_order(uuid,text,text,text,uuid) TO authenticated;
CREATE FUNCTION twuanis_canonical_private.customer_product_copy(p_kind text,p_product text) RETURNS jsonb
LANGUAGE sql STABLE SET search_path=pg_catalog AS $$
 SELECT CASE WHEN p_kind IN('package','PACKAGE') THEN (SELECT jsonb_build_object('nameEN',name_en,'nameES',name_es) FROM twuanis_canonical_private.intelligence_packages WHERE id=p_product)
 ELSE (SELECT jsonb_build_object('nameEN',name_en,'nameES',name_es) FROM twuanis_canonical_private.addon_products WHERE id=p_product) END
$$;
REVOKE ALL ON FUNCTION twuanis_canonical_private.customer_product_copy(text,text) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION twuanis_canonical_private.customer_order_projection(p_id uuid) RETURNS jsonb
LANGUAGE sql STABLE SET search_path=pg_catalog AS $$
 SELECT twuanis_canonical_private.customer_product_copy(o.target_type,o.product_id)||jsonb_build_object('id',o.id,'kind',o.target_type,'product',o.product_id,'listing',o.listing_id,'currency',o.currency,'amount',o.resolved_terms->>'total','standardAmount',o.resolved_terms->>'standardTotal','priceSource',o.resolved_terms->>'source','termQuantity',o.resolved_terms->'terms'->'quantity','termUnit',o.resolved_terms->'terms'->>'unit','durationDays',o.resolved_terms->'terms'->'durationDays','createdAt',o.created_at,'deadline',o.payment_deadline,'state',twuanis_canonical_private.offer_order_state(o.id,statement_timestamp()),
 'paid',EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id=o.id),
 'fulfilled',EXISTS(SELECT 1 FROM twuanis_canonical_private.entitlement_terms WHERE order_id=o.id) OR EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_fulfillments af WHERE af.purchase_id=o.id AND af.result->>'ok'='true'),
 'awaitingPublication',EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id=o.id) AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_fulfillments WHERE purchase_id=o.id) AND EXISTS(SELECT 1 FROM public.listings WHERE id=o.listing_id AND owner_id=o.account_id AND listing_status NOT IN('active','deleted')))
 FROM twuanis_canonical_private.offer_order_snapshots o WHERE o.id=p_id
$$;
REVOKE ALL ON FUNCTION twuanis_canonical_private.customer_order_projection(uuid) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.read_customer_commercial(p_area text,p_after uuid DEFAULT NULL,p_id uuid DEFAULT NULL,p_listing uuid DEFAULT NULL,p_history boolean DEFAULT false) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=auth.uid();result jsonb;
BEGIN
 IF actor IS NULL OR auth.jwt()->>'role' IS DISTINCT FROM 'authenticated' THEN RAISE EXCEPTION 'authentication required';END IF;
 IF p_listing IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.listings WHERE id=p_listing AND owner_id=actor AND canonical_domain_version=1 AND listing_status<>'deleted') THEN RAISE EXCEPTION 'owned canonical listing required';END IF;
 IF p_area='orders' THEN
  SELECT coalesce(jsonb_agg(twuanis_canonical_private.customer_order_projection(q.id) ORDER BY q.id),'[]') INTO result FROM (
   SELECT o.id FROM twuanis_canonical_private.offer_order_snapshots o WHERE o.account_id=actor AND (p_after IS NULL OR o.id>p_after) AND (p_id IS NULL OR o.id=p_id) AND (p_listing IS NULL OR o.listing_id=p_listing)
   ORDER BY o.id LIMIT 26)q;
 ELSIF p_area='rights' THEN
  SELECT coalesce(jsonb_agg(twuanis_canonical_private.customer_product_copy(q.product_class,q.product_id)||jsonb_build_object('id',q.id,'product',q.product_id,'class',q.product_class,'listing',q.listing_id,'source',q.source,'startsAt',q.starts_at,'endsAt',q.ends_at,'state',CASE WHEN q.revoked THEN 'REVOKED' WHEN q.starts_at>statement_timestamp() THEN 'SCHEDULED' WHEN q.ends_at<=statement_timestamp() THEN 'EXPIRED' ELSE 'ACTIVE' END) ORDER BY q.id),'[]') INTO result FROM (
   SELECT t.*,EXISTS(SELECT 1 FROM twuanis_canonical_private.entitlement_revocations WHERE term_id=t.id) revoked FROM twuanis_canonical_private.entitlement_terms t
   WHERE t.account_id=actor AND (p_after IS NULL OR t.id>p_after) AND (p_id IS NULL OR t.id=p_id) AND (p_listing IS NULL OR t.listing_id=p_listing)
   AND (p_history OR ((t.ends_at IS NULL OR t.ends_at>statement_timestamp()) AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.entitlement_revocations WHERE term_id=t.id))) ORDER BY t.id LIMIT 26)q;
 ELSIF p_area='payments' THEN
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',q.id,'order',q.canonical_order_id,'submittedAt',q.created_at,'currency',q.currency,'amount',q.amount::text,'state',coalesce(d.disposition,'REVIEW_PENDING'),'late',q.created_at>o.payment_deadline) ORDER BY q.id),'[]') INTO result FROM(
   SELECT p.* FROM public.sinpe_payments p WHERE p.user_id=actor AND p.canonical_order_id IS NOT NULL AND (p_after IS NULL OR p.id>p_after) AND (p_id IS NULL OR p.id=p_id) ORDER BY p.id LIMIT 26)q
   JOIN twuanis_canonical_private.offer_order_snapshots o ON o.id=q.canonical_order_id LEFT JOIN twuanis_canonical_private.sinpe_review_decisions d ON d.attempt_id=q.id;
 ELSIF p_area='listings' THEN
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',q.id,'title',q.title,'state',q.listing_status) ORDER BY q.id),'[]') INTO result FROM(
   SELECT id,title,listing_status FROM public.listings WHERE owner_id=actor AND canonical_domain_version=1 AND listing_status<>'deleted' AND (p_after IS NULL OR id>p_after) AND (p_id IS NULL OR id=p_id) ORDER BY id LIMIT 26)q;
 ELSIF p_area='legacy' THEN
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',g.subscription_id,'source','LEGACY','endsAt',g.expires_at,'capabilities',g.capabilities) ORDER BY g.subscription_id),'[]') INTO result FROM (SELECT g.* FROM twuanis_canonical_private.legacy_package_access g JOIN public.user_subscriptions s ON s.id=g.subscription_id
   WHERE g.account_id=actor AND s.user_id=actor AND s.package_id=g.package_id AND s.status='active' AND s.cancelled_at IS NULL AND s.expired_at IS NULL AND s.current_period_end=g.expires_at AND g.expires_at>statement_timestamp() AND (p_after IS NULL OR g.subscription_id>p_after) AND (p_id IS NULL OR g.subscription_id=p_id) ORDER BY g.subscription_id LIMIT 26)g;
 ELSE RAISE EXCEPTION 'unknown bounded commercial area';END IF;
 RETURN result;
END$$;
REVOKE ALL ON FUNCTION public.read_customer_commercial(text,uuid,uuid,uuid,boolean) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.read_customer_commercial(text,uuid,uuid,uuid,boolean) TO authenticated;
CREATE FUNCTION public.read_listing_addon_acquisition(p_listing uuid,p_currency text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=auth.uid();l public.listings%ROWTYPE;hold uuid;p record;reason text;tail timestamptz;begins timestamptz;result jsonb:='[]';
BEGIN
 IF actor IS NULL OR auth.jwt()->>'role' IS DISTINCT FROM 'authenticated' OR p_currency IS NULL OR p_currency NOT IN('USD','CRC') THEN RAISE EXCEPTION 'authenticated bounded request required';END IF;
 SELECT * INTO STRICT l FROM public.listings WHERE id=p_listing AND owner_id=actor AND canonical_domain_version=1 AND listing_status<>'deleted';
 SELECT o.id INTO hold FROM twuanis_canonical_private.offer_order_snapshots o WHERE o.listing_id=p_listing AND o.account_id=actor AND (
  (o.payment_deadline>clock_timestamp() AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id=o.id))
  OR twuanis_canonical_private.sinpe_pending_review(o.id)
  OR (EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id=o.id) AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_fulfillments af WHERE af.purchase_id=o.id AND af.result->>'ok'='true'))
 ) ORDER BY o.id LIMIT 1;
 FOR p IN SELECT a.id,a.behavior,c.duration_days FROM twuanis_canonical_private.addon_products a JOIN twuanis_canonical_private.addon_configurations c ON c.id=a.current_configuration_id WHERE a.target='listing' AND a.term_kind='elapsed_days' AND a.state='active' ORDER BY a.id LIMIT 26 LOOP
  reason:=NULL;
  IF NOT public.customer_commerce_ready() THEN reason:='inactive';
  ELSIF NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.sinpe_receiving_accounts WHERE enabled AND currency=p_currency) THEN reason:='channel_unavailable';
  ELSIF hold IS NOT NULL THEN reason:='acquisition_in_flight';
  ELSIF EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_placement_rights WHERE listing_id=p_listing AND product_id<>p.id AND effective_intervals @> clock_timestamp()) THEN reason:='different_active_product';
  END IF;
  IF reason IS NULL AND p.behavior='homepage_carousel' THEN
   SELECT max(t.ends_at) INTO tail FROM twuanis_canonical_private.entitlement_terms t WHERE t.listing_id=p_listing AND t.product_id=p.id AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.entitlement_revocations WHERE term_id=t.id);
   begins:=greatest(clock_timestamp(),tail);
   BEGIN PERFORM twuanis_canonical_private.assert_homepage_interval(begins,begins+p.duration_days*interval '24 hours');
   EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM='homepage_capacity_full' THEN reason:='capacity_unavailable';ELSE RAISE;END IF;END;
  END IF;
  result:=result||jsonb_build_array(jsonb_build_object('id',p.id,'available',reason IS NULL,'reason',reason));
 END LOOP;
 RETURN jsonb_build_object('products',result,'order',hold);
END$$;
REVOKE ALL ON FUNCTION public.read_listing_addon_acquisition(uuid,text) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.read_listing_addon_acquisition(uuid,text) TO authenticated;

CREATE FUNCTION public.read_customer_package_catalog(p_after text DEFAULT NULL) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT coalesce(jsonb_agg(x.value || jsonb_build_object('capabilityLabels',(
 SELECT jsonb_agg(jsonb_build_object('id',c.id,'en',c.name_en,'es',c.name_es) ORDER BY c.id)
 FROM twuanis_canonical_private.intelligence_capabilities c WHERE c.id IN(SELECT jsonb_array_elements_text(x.value->'capabilities')))) ORDER BY x.value->>'id'),'[]')
 FROM jsonb_array_elements(public.read_intelligence_package_catalog(p_after)) x
$$;
REVOKE ALL ON FUNCTION public.read_customer_package_catalog(text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.read_customer_package_catalog(text) TO anon,authenticated,service_role;
COMMIT;
