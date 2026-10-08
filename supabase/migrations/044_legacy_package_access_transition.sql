-- Step 11 local preparation. Installing this migration does NOT activate the transition.
BEGIN;
SET LOCAL lock_timeout='5s';
DO $$BEGIN IF current_user<>'postgres' THEN RAISE EXCEPTION 'postgres installation required';END IF;END$$;
CREATE TABLE twuanis_canonical_private.package_access_transition(
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 transitioned_at timestamptz NOT NULL CHECK(isfinite(transitioned_at))
);
CREATE TABLE twuanis_canonical_private.legacy_package_access(
 subscription_id uuid PRIMARY KEY REFERENCES public.user_subscriptions(id),
 account_id uuid NOT NULL REFERENCES auth.users(id),
 package_id uuid NOT NULL REFERENCES public.packages(id),
 period_start timestamptz,
 expires_at timestamptz NOT NULL CHECK(isfinite(expires_at)),
 captured_at timestamptz NOT NULL,
 capabilities text[] NOT NULL,
 CHECK(period_start IS NULL OR period_start<expires_at)
);
CREATE INDEX legacy_package_access_account ON twuanis_canonical_private.legacy_package_access(account_id,expires_at);
ALTER TABLE twuanis_canonical_private.package_access_transition ENABLE ROW LEVEL SECURITY;
ALTER TABLE twuanis_canonical_private.legacy_package_access ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON twuanis_canonical_private.package_access_transition,twuanis_canonical_private.legacy_package_access FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER package_access_transition_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON twuanis_canonical_private.package_access_transition FOR EACH STATEMENT EXECUTE FUNCTION twuanis_canonical_private.administrative_immutable();
CREATE TRIGGER legacy_package_access_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON twuanis_canonical_private.legacy_package_access FOR EACH STATEMENT EXECUTE FUNCTION twuanis_canonical_private.administrative_immutable();
-- The exact eleven existing authenticated price-m2-intelligence operations. The six
-- previously-public capabilities are deliberately absent. No Owner/Admin override.
CREATE FUNCTION twuanis_canonical_private.capture_legacy_package_transition() RETURNS timestamptz
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE at_time timestamptz;
BEGIN
 IF current_user<>'postgres' THEN RAISE EXCEPTION 'administrative transition required';END IF;
 LOCK TABLE public.user_subscriptions,public.packages,public.package_entitlements,public.entitlements IN SHARE ROW EXCLUSIVE MODE;
 SELECT transitioned_at INTO at_time FROM twuanis_canonical_private.package_access_transition WHERE singleton;
 IF FOUND THEN RETURN at_time;END IF;
 at_time:=clock_timestamp();
 INSERT INTO twuanis_canonical_private.package_access_transition VALUES(true,at_time);
 INSERT INTO twuanis_canonical_private.legacy_package_access
 SELECT s.id,s.user_id,s.package_id,s.current_period_start,s.current_period_end,at_time,
 ARRAY['cap-price-m2-distribution','cap-geographic-price-m2-comparison','cap-size-price-m2','cap-construction-land-price-m2','cap-user-defined-cohort-price-m2-comparison','cap-cross-dimensional-analysis','cap-comparative-price-m2-discovery','cap-property-price-m2-position','cap-user-defined-comparable-cohort','cap-asking-area-coefficient-ratio','cap-weighted-price-m2']::text[]
 FROM public.user_subscriptions s JOIN public.packages p ON p.id=s.package_id
 WHERE p.slug='market-pricing-intelligence' AND s.status='active'
 AND (s.current_period_start IS NULL OR s.current_period_start<=at_time)
 AND s.current_period_end>at_time AND isfinite(s.current_period_end)
 AND s.cancelled_at IS NULL AND s.expired_at IS NULL
 AND EXISTS(SELECT 1 FROM public.package_entitlements pe JOIN public.entitlements e ON e.id=pe.entitlement_id
 WHERE pe.package_id=p.id AND e.slug='price-m2-intelligence' AND e.is_active AND pe.boolean_value IS TRUE);
 RETURN at_time;
END$$;
REVOKE ALL ON FUNCTION twuanis_canonical_private.capture_legacy_package_transition() FROM PUBLIC,anon,authenticated,service_role;
-- After the captured boundary there can be no new legacy acquisition, renewal,
-- extension or reactivation. Ordinary cancellation/expiry remains possible.
CREATE FUNCTION twuanis_canonical_private.guard_legacy_package_transition() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.package_access_transition WHERE singleton) THEN RETURN NEW;END IF;
 IF EXISTS(SELECT 1 FROM public.packages WHERE id=NEW.package_id AND slug='market-pricing-intelligence') THEN
  IF TG_OP='INSERT' THEN RAISE EXCEPTION 'legacy acquisition closed';END IF;
  IF (NEW.id,NEW.user_id,NEW.package_id,NEW.current_period_start,NEW.current_period_end,NEW.started_at) IS DISTINCT FROM (OLD.id,OLD.user_id,OLD.package_id,OLD.current_period_start,OLD.current_period_end,OLD.started_at)
   OR (NEW.status='active' AND OLD.status<>'active')
   OR (OLD.cancelled_at IS NOT NULL AND NEW.cancelled_at IS NULL)
   OR (OLD.expired_at IS NOT NULL AND NEW.expired_at IS NULL)
  THEN RAISE EXCEPTION 'legacy renewal or reactivation closed';END IF;
 END IF;
 RETURN NEW;
END$$;
REVOKE ALL ON FUNCTION twuanis_canonical_private.guard_legacy_package_transition() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER legacy_package_transition_guard BEFORE INSERT OR UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.guard_legacy_package_transition();
CREATE OR REPLACE FUNCTION public.current_account_has_capability(p_capability text) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE a uuid:=auth.uid();
BEGIN
 IF a IS NULL OR auth.jwt()->>'role' IS DISTINCT FROM 'authenticated' THEN RETURN false;END IF;
 RETURN EXISTS(SELECT 1 FROM twuanis_canonical_private.intelligence_package_rights r
 JOIN twuanis_canonical_private.intelligence_package_configurations v ON v.id=r.configuration_id AND v.package_id=r.package_id
 WHERE r.account_id=a AND r.revoked_at IS NULL AND r.starts_at<=statement_timestamp() AND r.ends_at>statement_timestamp() AND p_capability=ANY(v.capabilities))
 OR EXISTS(SELECT 1 FROM twuanis_canonical_private.legacy_package_access g JOIN public.user_subscriptions s ON s.id=g.subscription_id
 WHERE g.account_id=a AND s.user_id=a AND s.package_id=g.package_id AND s.status='active'
 AND s.cancelled_at IS NULL AND s.expired_at IS NULL
 AND s.current_period_start IS NOT DISTINCT FROM g.period_start AND s.current_period_end=g.expires_at
 AND (g.period_start IS NULL OR g.period_start<=statement_timestamp()) AND g.expires_at>statement_timestamp()
 AND p_capability=ANY(g.capabilities));
END$$;
REVOKE ALL ON FUNCTION public.current_account_has_capability(text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.current_account_has_capability(text) TO authenticated;
-- Surviving legacy total-price valuation has no identity in the 17-capability
-- catalog. Preserve only its captured legacy subscription access; never substitute
-- a new Package capability or Owner/Admin override.
CREATE FUNCTION public.current_account_has_legacy_valuation_access() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT auth.uid() IS NOT NULL AND auth.jwt()->>'role'='authenticated' AND EXISTS(
 SELECT 1 FROM twuanis_canonical_private.legacy_package_access g
 JOIN public.user_subscriptions s ON s.id=g.subscription_id
 WHERE g.account_id=auth.uid() AND s.user_id=g.account_id AND s.package_id=g.package_id
 AND s.status='active' AND s.cancelled_at IS NULL AND s.expired_at IS NULL
 AND s.current_period_start IS NOT DISTINCT FROM g.period_start AND s.current_period_end=g.expires_at
 AND (g.period_start IS NULL OR g.period_start<=statement_timestamp()) AND g.expires_at>statement_timestamp())
$$;
REVOKE ALL ON FUNCTION public.current_account_has_legacy_valuation_access() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.current_account_has_legacy_valuation_access() TO authenticated;
COMMIT;
