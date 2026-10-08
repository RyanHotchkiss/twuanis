-- LOCAL ONLY. Explicit daily prices; monthly price/Offer authority remains unchanged.
BEGIN;
CREATE TABLE twuanis_canonical_private.package_daily_access_prices(
 package_id text NOT NULL REFERENCES twuanis_canonical_private.intelligence_packages(id),
 currency text NOT NULL CHECK(currency IN('USD','CRC')),
 amount numeric NOT NULL CHECK(amount>0 AND scale(amount)<=2),
 version integer NOT NULL CHECK(version=1),PRIMARY KEY(package_id,currency)
);
INSERT INTO twuanis_canonical_private.package_daily_access_prices VALUES
 ('pkg-matching-market-comparison','USD',2,1),('pkg-matching-market-comparison','CRC',1000,1),
 ('pkg-pricing-position-relationships','USD',4,1),('pkg-pricing-position-relationships','CRC',2000,1);
ALTER TABLE twuanis_canonical_private.package_daily_access_prices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON twuanis_canonical_private.package_daily_access_prices FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER package_daily_prices_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON twuanis_canonical_private.package_daily_access_prices FOR EACH STATEMENT EXECUTE FUNCTION twuanis_canonical_private.administrative_immutable();
CREATE FUNCTION public.read_package_daily_prices(p_products text[],p_currency text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE result jsonb;BEGIN
 IF p_products IS NULL OR cardinality(p_products)>25 OR p_currency IS NULL OR p_currency NOT IN('USD','CRC') THEN RAISE EXCEPTION 'bounded price request required';END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('productId',d.package_id,'currency',d.currency,'amount',d.amount::text,'version',d.version,'unit','day','quantity',1) ORDER BY d.package_id),'[]') INTO result
 FROM twuanis_canonical_private.package_daily_access_prices d JOIN twuanis_canonical_private.intelligence_packages p ON p.id=d.package_id WHERE d.package_id=ANY(p_products) AND d.currency=p_currency AND p.state='active';RETURN result;
END$$;
REVOKE ALL ON FUNCTION public.read_package_daily_prices(text[],text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.read_package_daily_prices(text[],text) TO anon,authenticated,service_role;
CREATE FUNCTION twuanis_canonical_private.create_package_access_order(p_account uuid,p_request uuid,p_product text,p_currency text,p_duration text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SET search_path=pg_catalog AS $$
DECLARE prior twuanis_canonical_private.offer_order_snapshots%ROWTYPE;cfg twuanis_canonical_private.intelligence_package_configurations%ROWTYPE;d twuanis_canonical_private.package_daily_access_prices%ROWTYPE;terms jsonb;oid uuid;at_time timestamptz;
BEGIN
 IF p_account IS NULL OR p_request IS NULL OR p_duration IS NULL OR p_duration NOT IN('day','month') THEN RAISE EXCEPTION 'explicit purchase identity required';END IF;
 PERFORM pg_advisory_xact_lock(3162,hashtext(p_account::text||p_request::text));
 SELECT * INTO prior FROM twuanis_canonical_private.offer_order_snapshots WHERE account_id=p_account AND request_id=p_request;
 IF FOUND THEN
 IF prior.target_type<>'package' OR prior.product_id IS DISTINCT FROM p_product OR prior.currency IS DISTINCT FROM p_currency OR prior.resolved_terms->'terms'->>'unit' IS DISTINCT FROM p_duration THEN RAISE EXCEPTION 'purchase request conflict';END IF;
 RETURN jsonb_build_object('id',prior.id,'terms',prior.resolved_terms,'replayed',true);END IF;
 IF p_duration='month' THEN RETURN twuanis_canonical_private.create_offer_order_snapshot(p_account,p_request,'package',p_product,p_currency,NULL,NULL);END IF;
 SELECT * INTO STRICT d FROM twuanis_canonical_private.package_daily_access_prices WHERE package_id=p_product AND currency=p_currency;
 SELECT c.* INTO STRICT cfg FROM twuanis_canonical_private.intelligence_packages p JOIN twuanis_canonical_private.intelligence_package_configurations c ON c.id=p.current_configuration_id AND c.package_id=p.id WHERE p.id=p_product AND p.state='active' FOR SHARE OF p;
 at_time:=clock_timestamp();
 terms:=jsonb_build_object('available',true,'kind','package','productId',p_product,'currency',p_currency,'quantity',1,'source','STANDARD','standardRate',d.amount::text,'unitPrice',d.amount::text,'total',d.amount::text,'standardTotal',d.amount::text,'configurationId',cfg.id,'configurationVersion',cfg.version::text,'orderContractVersion',1,'productClass','PACKAGE','targetKind','account','targetId',p_account,'purchaseOption','day','purchaseOptionVersion',d.version,'terms',jsonb_build_object('quantity',1,'unit','day','capabilities',cfg.capabilities));
 INSERT INTO twuanis_canonical_private.offer_order_snapshots(account_id,request_id,target_type,product_id,currency,resolved_terms,created_at,payment_deadline) VALUES(p_account,p_request,'package',p_product,p_currency,terms,at_time,at_time+interval '24 hours') RETURNING id INTO oid;
 RETURN jsonb_build_object('id',oid,'terms',terms,'createdAt',at_time,'paymentDeadline',at_time+interval '24 hours','replayed',false);
END$$;
REVOKE ALL ON FUNCTION twuanis_canonical_private.create_package_access_order(uuid,uuid,text,text,text) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.create_customer_package_order(p_request uuid,p_product text,p_currency text,p_duration text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=auth.uid();result jsonb;BEGIN
 IF actor IS NULL OR auth.jwt()->>'role' IS DISTINCT FROM 'authenticated' OR NOT public.customer_commerce_ready() OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=actor AND email_confirmed_at IS NOT NULL) THEN RAISE EXCEPTION 'confirmed account and enabled commerce required';END IF;
 IF NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.sinpe_receiving_accounts WHERE enabled AND currency=p_currency) THEN RAISE EXCEPTION 'payment channel unavailable';END IF;
 result:=twuanis_canonical_private.create_package_access_order(actor,p_request,p_product,p_currency,p_duration);
 RETURN jsonb_build_object('id',result->>'id','replayed',result->'replayed');END$$;
REVOKE ALL ON FUNCTION public.create_customer_package_order(uuid,text,text,text) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.create_customer_package_order(uuid,text,text,text) TO authenticated;
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
   IF o.resolved_terms->'terms'->>'unit'='day' THEN
    IF o.resolved_terms->'terms' IS DISTINCT FROM jsonb_build_object('quantity',1,'unit','day','capabilities',cfg.capabilities)
    OR o.resolved_terms->>'purchaseOption' IS DISTINCT FROM 'day'
    OR NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.package_daily_access_prices d WHERE d.package_id=o.product_id AND d.currency=o.currency AND d.version=(o.resolved_terms->>'purchaseOptionVersion')::integer AND d.amount=(o.resolved_terms->>'total')::numeric) THEN RAISE EXCEPTION 'daily purchase configuration mismatch';END IF;
   ELSIF o.resolved_terms->'terms' IS DISTINCT FROM jsonb_build_object('quantity',cfg.term_quantity,'unit',cfg.term_unit,'capabilities',cfg.capabilities) THEN RAISE EXCEPTION 'purchased package configuration mismatch';END IF;
   SELECT starts_at,ends_at INTO begins,ends FROM twuanis_canonical_private.purchased_package_interval(o.account_id,o.product_id,o.resolved_terms->'terms'->>'unit',(o.resolved_terms->'terms'->>'quantity')::integer,clock_timestamp());
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


CREATE OR REPLACE FUNCTION public.create_customer_order(p_request uuid,p_kind text,p_product text,p_currency text,p_listing uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=auth.uid();result jsonb;
BEGIN
 IF actor IS NULL OR auth.jwt()->>'role' IS DISTINCT FROM 'authenticated' OR NOT public.customer_commerce_ready() THEN RAISE EXCEPTION 'customer commerce unavailable';END IF;
 IF p_kind='package' THEN RETURN public.create_customer_package_order(p_request,p_product,p_currency,'month');END IF;
 IF p_kind IS NULL OR p_kind NOT IN('package','addon') OR p_currency IS NULL OR p_currency NOT IN('USD','CRC') THEN RAISE EXCEPTION 'invalid commercial intent';END IF;
 IF NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.sinpe_receiving_accounts WHERE enabled AND currency=p_currency) THEN RAISE EXCEPTION 'payment channel unavailable';END IF;
 IF p_kind='addon' AND (p_listing IS NULL OR NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_products WHERE id=p_product AND target='listing' AND term_kind='elapsed_days')) THEN RAISE EXCEPTION 'listing Add-on required';END IF;
 result:=twuanis_canonical_private.create_offer_order_snapshot(actor,p_request,p_kind,p_product,p_currency,p_listing,NULL);
 -- Exact safe identifier only: internal immutable commercial configuration stays server-side.
 RETURN jsonb_build_object('id',result->>'id','replayed',result->'replayed');
END$$;
REVOKE ALL ON FUNCTION public.create_customer_order(uuid,text,text,text,uuid) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.create_customer_order(uuid,text,text,text,uuid) TO authenticated;

COMMIT;
