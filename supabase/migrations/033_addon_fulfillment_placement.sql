-- Local-only trusted fulfillment/placement preparation; no checkout or runtime grant API.
BEGIN;
CREATE TABLE twuanis_canonical_private.addon_fulfillments(
 purchase_id uuid PRIMARY KEY,verified_payment_id uuid NOT NULL,account_id uuid NOT NULL REFERENCES auth.users,
 product_id text NOT NULL,configuration_id uuid NOT NULL,
 target_kind text NOT NULL CHECK(target_kind IN ('listing','account','operation')),target_id uuid NOT NULL,
 purchased_evidence jsonb NOT NULL CHECK(jsonb_typeof(purchased_evidence)='object' AND octet_length(purchased_evidence::text)<=16000),
 result jsonb NOT NULL,activated_at timestamptz NOT NULL,
 FOREIGN KEY(product_id,configuration_id) REFERENCES twuanis_canonical_private.addon_configurations(product_id,id)
);
CREATE TABLE twuanis_canonical_private.addon_placement_rights(
 product_id text NOT NULL REFERENCES twuanis_canonical_private.addon_products(id),listing_id uuid NOT NULL REFERENCES public.listings(id),
 account_id uuid NOT NULL REFERENCES auth.users(id),configuration_id uuid NOT NULL,
 activated_at timestamptz NOT NULL,expires_at timestamptz NOT NULL,revoked_at timestamptz,
 last_purchase_id uuid NOT NULL REFERENCES twuanis_canonical_private.addon_fulfillments(purchase_id) DEFERRABLE INITIALLY DEFERRED,
 PRIMARY KEY(product_id,listing_id),FOREIGN KEY(product_id,configuration_id) REFERENCES twuanis_canonical_private.addon_configurations(product_id,id),
 CHECK(isfinite(activated_at) AND isfinite(expires_at) AND expires_at>activated_at)
);
CREATE INDEX addon_placement_listing_expiry ON twuanis_canonical_private.addon_placement_rights(listing_id,expires_at) WHERE revoked_at IS NULL;
CREATE INDEX addon_placement_product_expiry ON twuanis_canonical_private.addon_placement_rights(product_id,expires_at) WHERE revoked_at IS NULL;
CREATE TABLE twuanis_canonical_private.addon_founder_rights(
 account_id uuid PRIMARY KEY REFERENCES auth.users(id),product_id text NOT NULL,configuration_id uuid NOT NULL,
 activated_at timestamptz NOT NULL,revoked_at timestamptz,
 purchase_id uuid NOT NULL REFERENCES twuanis_canonical_private.addon_fulfillments(purchase_id) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(product_id,configuration_id) REFERENCES twuanis_canonical_private.addon_configurations(product_id,id)
);
CREATE TRIGGER addon_fulfillments_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON twuanis_canonical_private.addon_fulfillments FOR EACH STATEMENT EXECUTE FUNCTION twuanis_canonical_private.administrative_immutable();
CREATE FUNCTION twuanis_canonical_private.fulfill_addon(p_purchase uuid,p_verified_payment uuid,p_account uuid,p_product text,p_configuration uuid,p_target_kind text,p_target uuid,p_evidence jsonb) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE p twuanis_canonical_private.addon_products%ROWTYPE;c twuanis_canonical_private.addon_configurations%ROWTYPE;
 old twuanis_canonical_private.addon_fulfillments%ROWTYPE;r twuanis_canonical_private.addon_placement_rights%ROWTYPE;
 l public.listings%ROWTYPE;at_time timestamptz;expires timestamptz;result jsonb;capacity integer;occupied integer;
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
 IF p.term_kind='elapsed_days' THEN
  IF c.duration_days IS NULL THEN RAISE EXCEPTION 'purchased duration missing'; END IF;
  IF p.behavior='homepage_carousel' THEN SELECT h.capacity INTO STRICT capacity FROM twuanis_canonical_private.addon_homepage_capacity h WHERE id FOR UPDATE; END IF;
  SELECT * INTO STRICT l FROM public.listings WHERE id=p_target FOR UPDATE;
  IF l.owner_id IS DISTINCT FROM p_account OR l.canonical_domain_version IS DISTINCT FROM 1 OR l.listing_status='deleted' THEN RAISE EXCEPTION 'owned canonical target required'; END IF;
  SELECT * INTO r FROM twuanis_canonical_private.addon_placement_rights WHERE product_id=p_product AND listing_id=p_target FOR UPDATE;
  at_time:=clock_timestamp();
  IF l.listing_status<>'active' AND NOT coalesce(r.expires_at>at_time AND r.revoked_at IS NULL,false) THEN RAISE EXCEPTION 'publication required for new placement'; END IF;
  IF p.behavior='homepage_carousel' AND NOT coalesce(r.expires_at>at_time AND r.revoked_at IS NULL,false) THEN
   SELECT count(*) INTO occupied FROM twuanis_canonical_private.addon_placement_rights occupied_right JOIN twuanis_canonical_private.addon_products occupied_product ON occupied_product.id=occupied_right.product_id
   WHERE occupied_product.behavior='homepage_carousel' AND occupied_right.revoked_at IS NULL AND occupied_right.activated_at<=at_time AND occupied_right.expires_at>at_time;
   IF occupied>=capacity THEN RETURN jsonb_build_object('ok',false,'code','homepage_capacity_full'); END IF;
  END IF;
  expires:=greatest(at_time,CASE WHEN r.revoked_at IS NULL THEN r.expires_at END)+c.duration_days*interval '24 hours';
  INSERT INTO twuanis_canonical_private.addon_placement_rights(product_id,listing_id,account_id,configuration_id,activated_at,expires_at,last_purchase_id)
  VALUES(p_product,p_target,p_account,p_configuration,at_time,expires,p_purchase)
  ON CONFLICT(product_id,listing_id) DO UPDATE SET account_id=EXCLUDED.account_id,configuration_id=EXCLUDED.configuration_id,activated_at=EXCLUDED.activated_at,expires_at=EXCLUDED.expires_at,revoked_at=NULL,last_purchase_id=EXCLUDED.last_purchase_id;
  result:=jsonb_build_object('ok',true,'listingId',p_target,'activatedAt',at_time,'expiresAt',expires,'behavior',p.behavior);
 ELSIF p.term_kind='lifetime' THEN
  IF p_target<>p_account THEN RAISE EXCEPTION 'account target mismatch'; END IF;
  PERFORM id FROM auth.users WHERE id=p_account FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'account missing'; END IF;
  IF EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_founder_rights WHERE account_id=p_account AND revoked_at IS NOT NULL) THEN RAISE EXCEPTION 'revoked pricing authority requires separate authorized resolution'; END IF;
  at_time:=clock_timestamp();
  INSERT INTO twuanis_canonical_private.addon_founder_rights(account_id,product_id,configuration_id,activated_at,purchase_id) VALUES(p_account,p_product,p_configuration,at_time,p_purchase)
  ON CONFLICT(account_id) DO NOTHING;
  result:=jsonb_build_object('ok',true,'accountId',p_account,'kind','founding_pricing_entitlement');
 ELSE
  IF NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_import_jobs WHERE id=p_target AND account_id=p_account AND configuration_id=p_configuration) THEN RAISE EXCEPTION 'immutable customer job mismatch'; END IF;
  result:=jsonb_build_object('ok',true,'jobId',p_target,'listings',twuanis_canonical_private.fulfill_customer_addon_import(p_target,p_purchase,p_verified_payment));at_time:=clock_timestamp();
 END IF;
 INSERT INTO twuanis_canonical_private.addon_fulfillments VALUES(p_purchase,p_verified_payment,p_account,p_product,p_configuration,p_target_kind,p_target,p_evidence,result,at_time);
 RETURN result;
END $$;
-- Bounded effective evidence projection for already-selected marketplace IDs.
-- Canonical membership supplies contextual identity; commercial rows cannot create it.
CREATE FUNCTION public.read_addon_placement(p_ids uuid[],p_surface text,p_province bigint DEFAULT NULL,p_property_type bigint DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE result jsonb;
BEGIN
 IF cardinality(p_ids)>512 OR p_surface IS NULL OR p_surface NOT IN ('buy','rent','swipe-buy','swipe-rent','homepage') THEN RAISE EXCEPTION 'bounded marketplace context required'; END IF;
 IF p_province IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.ontology_terms WHERE id=p_province AND term_type='province' AND level=1) THEN RAISE EXCEPTION 'canonical province required'; END IF;
 IF p_property_type IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.ontology_terms WHERE id=p_property_type AND term_type='property_type' AND level=1) THEN RAISE EXCEPTION 'canonical property type required'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('listingId',x.listing_id,'behavior',x.behavior,'activatedAt',x.activated_at) ORDER BY x.listing_id,x.behavior),'[]') INTO result FROM (
 SELECT r.listing_id,p.behavior,max(r.activated_at) AS activated_at FROM twuanis_canonical_private.addon_placement_rights r
 JOIN twuanis_canonical_private.addon_products p ON p.id=r.product_id JOIN public.listings l ON l.id=r.listing_id
 WHERE r.listing_id=ANY(p_ids) AND r.revoked_at IS NULL AND r.activated_at<=statement_timestamp() AND r.expires_at>statement_timestamp()
 AND l.owner_id=r.account_id AND l.listing_status='active' AND l.canonical_domain_version=1
 AND (p_surface='homepage' OR (p_surface IN ('buy','swipe-buy') AND l.transaction_type='sale') OR (p_surface IN ('rent','swipe-rent') AND l.transaction_type='rent'))
 AND ((p_surface='homepage' AND p.behavior='homepage_carousel') OR (p_surface<>'homepage' AND (
 p.behavior IN ('featured_collection','priority_over_organic') OR
 (p_surface IN ('buy','rent') AND p.behavior='province_contextual_priority' AND p_province IS NOT NULL AND EXISTS(SELECT 1 FROM public.listings_ontology_terms WHERE listing_id=l.id AND ontology_term_id=p_province)) OR
 (p_surface IN ('buy','rent') AND p.behavior='property_type_contextual_priority' AND p_property_type IS NOT NULL AND EXISTS(SELECT 1 FROM public.listing_semantic_selections WHERE listing_id=l.id AND dimension='property_type' AND ontology_term_id=p_property_type)))))
 GROUP BY r.listing_id,p.behavior)x;
 RETURN result;
END $$;
CREATE FUNCTION public.read_addon_homepage_ids() RETURNS uuid[]
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT coalesce(array_agg(id ORDER BY activated_at DESC,id),'{}'::uuid[]) FROM (
 SELECT l.id,max(r.activated_at) activated_at FROM twuanis_canonical_private.addon_placement_rights r JOIN twuanis_canonical_private.addon_products p ON p.id=r.product_id JOIN public.listings l ON l.id=r.listing_id
 WHERE p.behavior='homepage_carousel' AND r.revoked_at IS NULL AND r.activated_at<=statement_timestamp() AND r.expires_at>statement_timestamp()
 AND l.owner_id=r.account_id AND l.listing_status='active' AND l.canonical_domain_version=1
 GROUP BY l.id ORDER BY activated_at DESC,l.id LIMIT 10)x
$$;
DO $$ DECLARE t text;f regprocedure;BEGIN
 FOREACH t IN ARRAY ARRAY['addon_fulfillments','addon_placement_rights','addon_founder_rights'] LOOP
  EXECUTE format('ALTER TABLE twuanis_canonical_private.%I OWNER TO postgres',t);EXECUTE format('ALTER TABLE twuanis_canonical_private.%I ENABLE ROW LEVEL SECURITY',t);EXECUTE format('REVOKE ALL ON TABLE twuanis_canonical_private.%I FROM PUBLIC,anon,authenticated,service_role',t);
 END LOOP;
 FOREACH f IN ARRAY ARRAY['twuanis_canonical_private.fulfill_addon(uuid,uuid,uuid,text,uuid,text,uuid,jsonb)'::regprocedure,'public.read_addon_placement(uuid[],text,bigint,bigint)'::regprocedure,'public.read_addon_homepage_ids()'::regprocedure] LOOP
  EXECUTE format('ALTER FUNCTION %s OWNER TO postgres',f);EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',f);
 END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION public.read_addon_placement(uuid[],text,bigint,bigint),public.read_addon_homepage_ids() TO service_role;
COMMIT;
