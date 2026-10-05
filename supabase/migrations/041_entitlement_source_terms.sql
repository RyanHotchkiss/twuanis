-- STEP10 LOCAL PREPARATION: activation requires the complete local gate and separate authorization.
-- Step 10 local preparation. Source terms are immutable; effective intervals are projections.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
DO $$ BEGIN IF current_user<>'postgres' THEN RAISE EXCEPTION 'postgres installation required';END IF;END $$;
CREATE TABLE twuanis_canonical_private.entitlement_terms(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 account_id uuid NOT NULL REFERENCES auth.users(id),
 product_class text NOT NULL CHECK(product_class IN ('PACKAGE','LISTING_ADDON','FOUNDING_MEMBERSHIP')),
 product_id text NOT NULL,configuration_id uuid NOT NULL,
 listing_id uuid REFERENCES public.listings(id),
 source text NOT NULL CHECK(source IN ('PURCHASED','ADMIN_GRANT')),
 order_id uuid UNIQUE REFERENCES twuanis_canonical_private.offer_order_snapshots(id),
 acknowledgement_id uuid UNIQUE REFERENCES twuanis_canonical_private.offer_paid_acknowledgements(id),
 actor_id uuid NOT NULL,request_id uuid NOT NULL,
 reason text,note text CHECK(length(note)<=2000),
 starts_at timestamptz NOT NULL,ends_at timestamptz,
 committed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CHECK(isfinite(starts_at) AND (ends_at IS NULL OR (isfinite(ends_at) AND ends_at>starts_at))),
 CHECK((product_class='FOUNDING_MEMBERSHIP')=(ends_at IS NULL)),
 CHECK((product_class='LISTING_ADDON')=(listing_id IS NOT NULL)),
 CHECK((source='PURCHASED' AND order_id IS NOT NULL AND acknowledgement_id IS NOT NULL AND reason IS NULL)
 OR (source='ADMIN_GRANT' AND order_id IS NULL AND acknowledgement_id IS NULL AND reason IN('SALES','CUSTOMER_SERVICE','PROMOTION','PARTNER','OPERATIONAL_CORRECTION','OTHER') AND (reason<>'OTHER' OR coalesce(length(btrim(note)),0)>0))),
 UNIQUE(actor_id,request_id)
);
CREATE INDEX entitlement_terms_source_page ON twuanis_canonical_private.entitlement_terms(source,id);
CREATE INDEX entitlement_terms_class_page ON twuanis_canonical_private.entitlement_terms(product_class,id);
CREATE INDEX entitlement_terms_recipient_page ON twuanis_canonical_private.entitlement_terms(account_id,id);
CREATE INDEX entitlement_terms_listing_tail ON twuanis_canonical_private.entitlement_terms(listing_id,product_id,ends_at);
CREATE INDEX entitlement_terms_current_placement ON twuanis_canonical_private.entitlement_terms(listing_id,product_id,starts_at DESC) INCLUDE(ends_at);
CREATE INDEX entitlement_terms_product_interval ON twuanis_canonical_private.entitlement_terms(product_id,ends_at,starts_at);
CREATE TABLE twuanis_canonical_private.entitlement_revocations(
 term_id uuid PRIMARY KEY REFERENCES twuanis_canonical_private.entitlement_terms(id),
 actor_id uuid NOT NULL,request_id uuid NOT NULL,reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 2000),
 revoked_at timestamptz NOT NULL DEFAULT clock_timestamp(),UNIQUE(actor_id,request_id)
);
ALTER TABLE twuanis_canonical_private.entitlement_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE twuanis_canonical_private.entitlement_revocations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON twuanis_canonical_private.entitlement_terms,twuanis_canonical_private.entitlement_revocations FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER entitlement_terms_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON twuanis_canonical_private.entitlement_terms FOR EACH STATEMENT EXECUTE FUNCTION twuanis_canonical_private.administrative_immutable();
CREATE TRIGGER entitlement_revocations_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON twuanis_canonical_private.entitlement_revocations FOR EACH STATEMENT EXECUTE FUNCTION twuanis_canonical_private.administrative_immutable();
-- Existing right identity remains the one effective product/listing effect. It may contain gaps.
ALTER TABLE twuanis_canonical_private.addon_placement_rights ADD COLUMN effective_intervals tstzmultirange;
UPDATE twuanis_canonical_private.addon_placement_rights SET effective_intervals=CASE WHEN revoked_at IS NULL THEN tstzmultirange(tstzrange(activated_at,expires_at,'[)')) ELSE '{}'::tstzmultirange END;
ALTER TABLE twuanis_canonical_private.addon_placement_rights ALTER COLUMN effective_intervals SET NOT NULL;
ALTER TABLE twuanis_canonical_private.addon_placement_rights ALTER COLUMN last_purchase_id DROP NOT NULL;
ALTER TABLE twuanis_canonical_private.addon_founder_rights ALTER COLUMN purchase_id DROP NOT NULL;
-- Existing purchased evidence is retained, never guessed into a source term. Activation must
-- reconcile any nonempty pre-Step10 canonical right set before installing this one-shot bridge.
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_placement_rights)
 OR EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_founder_rights)
 OR EXISTS(SELECT 1 FROM twuanis_canonical_private.intelligence_package_rights)
 THEN RAISE EXCEPTION 'Step10 requires reviewed empty canonical-right baseline; existing rights require attributable migration evidence'; END IF;
END $$;
CREATE FUNCTION twuanis_canonical_private.entitlement_interval(p_start timestamptz,p_end timestamptz,p_revoked timestamptz) RETURNS tstzrange
LANGUAGE sql IMMUTABLE SET search_path=pg_catalog AS $$
 SELECT CASE WHEN p_revoked IS NOT NULL AND p_revoked<=p_start THEN 'empty'::tstzrange
 ELSE tstzrange(p_start,CASE WHEN p_revoked IS NULL THEN p_end WHEN p_end IS NULL THEN p_revoked ELSE least(p_end,p_revoked) END,'[)') END
$$;
-- Caller holds the singleton capacity lock through commit, including term insertion.
-- Sweep endpoints, grouping starts/ends at the same instant, implements [start,end).
CREATE FUNCTION twuanis_canonical_private.assert_homepage_interval(p_start timestamptz,p_end timestamptz) RETURNS void
LANGUAGE plpgsql VOLATILE SET search_path=pg_catalog AS $$
DECLARE cap integer; peak bigint;
BEGIN
 IF p_start IS NULL OR p_end IS NULL OR NOT isfinite(p_start) OR NOT isfinite(p_end) OR p_end<=p_start THEN RAISE EXCEPTION 'bounded homepage interval required';END IF;
 SELECT capacity INTO STRICT cap FROM twuanis_canonical_private.addon_homepage_capacity WHERE id FOR UPDATE;
 WITH intervals AS (
  SELECT twuanis_canonical_private.entitlement_interval(t.starts_at,t.ends_at,r.revoked_at) span
  FROM twuanis_canonical_private.entitlement_terms t
  JOIN twuanis_canonical_private.addon_products p ON p.id=t.product_id
  LEFT JOIN twuanis_canonical_private.entitlement_revocations r ON r.term_id=t.id
  WHERE p.behavior='homepage_carousel' AND t.starts_at<p_end AND t.ends_at>p_start
 ), clipped AS (
  SELECT span*tstzrange(p_start,p_end,'[)') span FROM intervals WHERE span&&tstzrange(p_start,p_end,'[)')
 ), events AS (
  SELECT lower(span) at_time,1 delta FROM clipped UNION ALL SELECT upper(span),-1 FROM clipped
  UNION ALL SELECT p_start,1 UNION ALL SELECT p_end,-1
 ), sweep AS (SELECT sum(sum(delta)) OVER(ORDER BY at_time) occupied FROM events GROUP BY at_time)
 SELECT max(occupied) INTO peak FROM sweep;
 IF peak>cap THEN RAISE EXCEPTION 'homepage_capacity_full' USING ERRCODE='P0001';END IF;
END $$;
-- activated_at/expires_at are historical envelope metadata, never recency authority.
-- Readers select the currently effective source term independently of this envelope.
-- Materialize only this product/listing's surviving intervals. Revocation never rewrites a term.
CREATE FUNCTION twuanis_canonical_private.refresh_placement_terms(p_listing uuid,p_product text) RETURNS void
LANGUAGE plpgsql VOLATILE SET search_path=pg_catalog AS $$
DECLARE spans tstzmultirange;first_at timestamptz;last_at timestamptz;t twuanis_canonical_private.entitlement_terms%ROWTYPE;purchase uuid;
BEGIN
 SELECT * INTO STRICT t FROM twuanis_canonical_private.entitlement_terms WHERE listing_id=p_listing AND product_id=p_product ORDER BY committed_at DESC,id DESC LIMIT 1;
 SELECT coalesce(range_agg(twuanis_canonical_private.entitlement_interval(x.starts_at,x.ends_at,r.revoked_at)),'{}'::tstzmultirange),min(x.starts_at),max(x.ends_at)
 INTO spans,first_at,last_at FROM twuanis_canonical_private.entitlement_terms x LEFT JOIN twuanis_canonical_private.entitlement_revocations r ON r.term_id=x.id WHERE x.listing_id=p_listing AND x.product_id=p_product;
 SELECT order_id INTO purchase FROM twuanis_canonical_private.entitlement_terms WHERE listing_id=p_listing AND product_id=p_product AND source='PURCHASED' ORDER BY committed_at DESC,id DESC LIMIT 1;
 INSERT INTO twuanis_canonical_private.addon_placement_rights(product_id,listing_id,account_id,configuration_id,activated_at,expires_at,last_purchase_id,effective_intervals)
 VALUES(p_product,p_listing,t.account_id,t.configuration_id,first_at,last_at,purchase,spans)
 ON CONFLICT(product_id,listing_id) DO UPDATE SET account_id=EXCLUDED.account_id,configuration_id=EXCLUDED.configuration_id,activated_at=EXCLUDED.activated_at,expires_at=EXCLUDED.expires_at,last_purchase_id=EXCLUDED.last_purchase_id,effective_intervals=EXCLUDED.effective_intervals,revoked_at=NULL;
END $$;
REVOKE ALL ON FUNCTION twuanis_canonical_private.entitlement_interval(timestamptz,timestamptz,timestamptz),twuanis_canonical_private.assert_homepage_interval(timestamptz,timestamptz),twuanis_canonical_private.refresh_placement_terms(uuid,text) FROM PUBLIC,anon,authenticated,service_role;
-- All source commitments use the same private boundary. No runtime role executes it.
CREATE FUNCTION twuanis_canonical_private.commit_entitlement_term(
 p_account uuid,p_class text,p_product text,p_configuration uuid,p_listing uuid,
 p_source text,p_order uuid,p_ack uuid,p_actor uuid,p_request uuid,p_start timestamptz,p_end timestamptz,p_reason text,p_note text
) RETURNS uuid LANGUAGE plpgsql VOLATILE SET search_path=pg_catalog AS $$
DECLARE tid uuid:=gen_random_uuid();p twuanis_canonical_private.addon_products%ROWTYPE;
 l public.listings%ROWTYPE;tail timestamptz;at_time timestamptz:=clock_timestamp();
BEGIN
 IF p_account IS NULL OR p_actor IS NULL OR p_request IS NULL OR p_start IS NULL OR NOT isfinite(p_start) THEN RAISE EXCEPTION 'exact entitlement identities and interval required';END IF;
 IF p_source='PURCHASED' AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_order_snapshots o JOIN twuanis_canonical_private.offer_paid_acknowledgements a ON a.order_id=o.id WHERE o.id=p_order AND a.id=p_ack AND o.account_id=p_account AND o.product_id=p_product AND (o.resolved_terms->>'configurationId')::uuid=p_configuration AND o.listing_id IS NOT DISTINCT FROM p_listing AND o.resolved_terms->>'productClass'=p_class) THEN RAISE EXCEPTION 'exact paid source required';END IF;
 IF p_class='PACKAGE' THEN
  PERFORM id FROM twuanis_canonical_private.intelligence_package_configurations WHERE id=p_configuration AND package_id=p_product;
  IF NOT FOUND THEN RAISE EXCEPTION 'canonical package configuration required';END IF;
 ELSE
  SELECT * INTO STRICT p FROM twuanis_canonical_private.addon_products WHERE id=p_product;
  PERFORM id FROM twuanis_canonical_private.addon_configurations WHERE id=p_configuration AND product_id=p_product;
  IF NOT FOUND OR (p_class='LISTING_ADDON' AND p.term_kind<>'elapsed_days') OR (p_class='FOUNDING_MEMBERSHIP' AND p.term_kind<>'lifetime') THEN RAISE EXCEPTION 'canonical entitlement product required';END IF;
  IF p.behavior='homepage_carousel' THEN PERFORM capacity FROM twuanis_canonical_private.addon_homepage_capacity WHERE id FOR UPDATE;END IF;
  IF p_class='LISTING_ADDON' THEN
   SELECT * INTO STRICT l FROM public.listings WHERE id=p_listing FOR UPDATE;
   IF l.owner_id IS DISTINCT FROM p_account OR l.canonical_domain_version IS DISTINCT FROM 1 OR l.listing_status='deleted' THEN RAISE EXCEPTION 'owned canonical target required';END IF;
   IF l.listing_status<>'active' AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_placement_rights WHERE listing_id=p_listing AND product_id=p_product AND effective_intervals @> at_time) THEN RAISE EXCEPTION 'publication required for new placement';END IF;
   -- Append only at commitment. No later operation compacts the committed calendar.
   SELECT max(t.ends_at) INTO tail FROM twuanis_canonical_private.entitlement_terms t WHERE t.listing_id=p_listing AND t.product_id=p_product AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.entitlement_revocations r WHERE r.term_id=t.id);
   IF tail>p_start THEN RAISE EXCEPTION 'interval must follow committed same-product time';END IF;
   IF EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_placement_rights WHERE listing_id=p_listing AND product_id<>p_product AND effective_intervals && tstzmultirange(tstzrange(p_start,p_end,'[)'))) THEN RAISE EXCEPTION 'incompatible add-on interval';END IF;
   IF p.behavior='homepage_carousel' THEN PERFORM twuanis_canonical_private.assert_homepage_interval(p_start,p_end);END IF;
  ELSE
   PERFORM id FROM auth.users WHERE id=p_account FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'recipient required';END IF;
  END IF;
 END IF;
 INSERT INTO twuanis_canonical_private.entitlement_terms(id,account_id,product_class,product_id,configuration_id,listing_id,source,order_id,acknowledgement_id,actor_id,request_id,reason,note,starts_at,ends_at)
 VALUES(tid,p_account,p_class,p_product,p_configuration,p_listing,p_source,p_order,p_ack,p_actor,p_request,p_reason,p_note,p_start,p_end);
 IF p_class='PACKAGE' THEN
  INSERT INTO twuanis_canonical_private.intelligence_package_rights(id,account_id,package_id,configuration_id,starts_at,ends_at,provenance) VALUES(tid,p_account,p_product,p_configuration,p_start,p_end,p_source||':'||tid::text);
 ELSIF p_class='LISTING_ADDON' THEN PERFORM twuanis_canonical_private.refresh_placement_terms(p_listing,p_product);
 ELSE
  INSERT INTO twuanis_canonical_private.addon_founder_rights(account_id,product_id,configuration_id,activated_at,purchase_id)
  VALUES(p_account,p_product,p_configuration,p_start,p_order)
  ON CONFLICT(account_id) DO UPDATE SET activated_at=(SELECT min(x.starts_at) FROM twuanis_canonical_private.entitlement_terms x WHERE x.account_id=p_account AND x.product_class='FOUNDING_MEMBERSHIP' AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.entitlement_revocations r WHERE r.term_id=x.id)),revoked_at=NULL,purchase_id=coalesce(EXCLUDED.purchase_id,twuanis_canonical_private.addon_founder_rights.purchase_id);
 END IF;
 RETURN tid;
END $$;
REVOKE ALL ON FUNCTION twuanis_canonical_private.commit_entitlement_term(uuid,text,text,uuid,uuid,text,uuid,uuid,uuid,uuid,timestamptz,timestamptz,text,text) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
