-- CG-3B2B2-S2: dormant publisher coordination. No current application integration.
-- Evidence: package_limits.listing_limit is integer NULL=unlimited; one row/package.
-- Subscription effectiveness follows resolve_current_user_entitlement: active,
-- nullable start <= observation time, nullable end > observation time.
-- Protocol (READ COMMITTED only): policy guard -> publisher -> future purchase/
-- subscription rows -> future listings. No multi-publisher API is exposed.
-- Ordinary capacity readers share the guard; global policy writers lock it exclusively.
-- Never upgrade a shared policy lock after taking a publisher lock. Acquire exclusive
-- first when policy will change. Private primitives require disciplined composition.
-- NO CAPACITY-AFFECTING CUSTOMER OPERATION MAY REMAIN ACTIVE UNLESS IT
-- PARTICIPATES IN THE APPROVED PUBLISHER COORDINATION PROTOCOL.
-- Both listing writers AND commercial/allowance writers must join at future cutover.
-- Hold these locks through the caller transaction, including the later mutation
-- and its commit. Separate application RPC requests cannot retain these row locks.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';

CREATE FUNCTION twuanis_canonical_private.initialize_capacity_guard()
RETURNS void LANGUAGE plpgsql VOLATILE SECURITY INVOKER
SET search_path=pg_catalog,pg_temp AS $f$
BEGIN
 IF current_setting('transaction_isolation') <> 'read committed' THEN
  RAISE EXCEPTION 'coordination requires READ COMMITTED' USING ERRCODE='0A000';
 END IF;
 INSERT INTO public.capacity_policy_guard(id) VALUES(1) ON CONFLICT(id) DO NOTHING;
END $f$;
SELECT twuanis_canonical_private.initialize_capacity_guard();

CREATE FUNCTION twuanis_canonical_private.lock_capacity_policy(p_exclusive boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql VOLATILE SECURITY INVOKER
SET search_path=pg_catalog,pg_temp AS $f$
BEGIN
 IF current_setting('transaction_isolation') <> 'read committed' THEN
  RAISE EXCEPTION 'coordination requires READ COMMITTED' USING ERRCODE='0A000';
 END IF;
 IF p_exclusive IS NULL THEN RAISE EXCEPTION 'policy lock mode required' USING ERRCODE='22023'; END IF;
 IF p_exclusive THEN
  PERFORM id FROM public.capacity_policy_guard WHERE id=1 FOR UPDATE;
 ELSE
  PERFORM id FROM public.capacity_policy_guard WHERE id=1 FOR SHARE;
 END IF;
 IF NOT FOUND THEN RAISE EXCEPTION 'capacity guard missing' USING ERRCODE='55000'; END IF;
END $f$;

CREATE FUNCTION twuanis_canonical_private.ensure_publisher_account(p_owner uuid)
RETURNS uuid LANGUAGE plpgsql VOLATILE SECURITY INVOKER
SET search_path=pg_catalog,pg_temp AS $f$
DECLARE v_id uuid;
BEGIN
 IF p_owner IS NULL THEN RAISE EXCEPTION 'customer identity required' USING ERRCODE='22023'; END IF;
 PERFORM twuanis_canonical_private.lock_capacity_policy(false);
 INSERT INTO public.publisher_accounts(owner_user_id) VALUES(p_owner)
  ON CONFLICT(owner_user_id) DO NOTHING;
 -- Separate post-conflict statement obtains a fresh READ COMMITTED snapshot.
 SELECT id INTO STRICT v_id FROM public.publisher_accounts WHERE owner_user_id=p_owner FOR UPDATE;
 RETURN v_id;
END $f$;

CREATE FUNCTION twuanis_canonical_private.lock_publisher(p_publisher uuid)
RETURNS uuid LANGUAGE plpgsql VOLATILE SECURITY INVOKER
SET search_path=pg_catalog,pg_temp AS $f$
DECLARE v_owner uuid;
BEGIN
 PERFORM twuanis_canonical_private.lock_capacity_policy(false);
 SELECT owner_user_id INTO v_owner FROM public.publisher_accounts WHERE id=p_publisher FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'publisher not found' USING ERRCODE='P0002'; END IF;
 RETURN v_owner;
END $f$;

CREATE FUNCTION twuanis_canonical_private.resolve_publisher(p_owner uuid)
RETURNS uuid LANGUAGE plpgsql VOLATILE SECURITY INVOKER
SET search_path=pg_catalog,pg_temp AS $f$
DECLARE v_id uuid;
BEGIN
 IF p_owner IS NULL THEN RAISE EXCEPTION 'customer identity required' USING ERRCODE='22023'; END IF;
 PERFORM twuanis_canonical_private.lock_capacity_policy(false);
 SELECT id INTO v_id FROM public.publisher_accounts WHERE owner_user_id=p_owner FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'publisher not provisioned' USING ERRCODE='P0002'; END IF;
 RETURN v_id;
END $f$;

CREATE FUNCTION twuanis_canonical_private.publisher_allowance(p_publisher uuid,p_owner uuid)
RETURNS TABLE(subscription_id uuid,package_id uuid,allowance bigint,unlimited boolean,
 effective_start timestamptz,effective_end timestamptz,observed_at timestamptz)
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog,pg_temp AS $f$
DECLARE v_owner uuid; s record; n integer:=0; v_limit integer; v_at timestamptz;
BEGIN
 v_owner:=twuanis_canonical_private.lock_publisher(p_publisher);
 IF p_owner IS DISTINCT FROM v_owner THEN RAISE EXCEPTION 'publisher/customer mismatch' USING ERRCODE='22023'; END IF;
 -- Observe time after waiting; a transaction-start timestamp may already be stale.
 v_at:=clock_timestamp();
 FOR s IN SELECT u.id,u.package_id,u.current_period_start,u.current_period_end
  FROM public.user_subscriptions u WHERE u.user_id=v_owner AND u.status='active' LIMIT 2
 LOOP
  n:=n+1;
  subscription_id:=s.id; package_id:=s.package_id;
  effective_start:=s.current_period_start; effective_end:=s.current_period_end;
 END LOOP;
 IF n<>1 THEN RAISE EXCEPTION 'one authoritative active subscription required' USING ERRCODE='55000'; END IF;
 IF (effective_start IS NOT NULL AND effective_start>v_at)
  OR (effective_end IS NOT NULL AND effective_end<=v_at)
  OR (effective_start IS NOT NULL AND effective_end IS NOT NULL AND effective_end<=effective_start) THEN
  RAISE EXCEPTION 'subscription not effective' USING ERRCODE='55000';
 END IF;
 PERFORM p.id FROM public.packages p WHERE p.id=package_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'subscription package missing' USING ERRCODE='55000'; END IF;
 SELECT l.listing_limit INTO v_limit FROM public.package_limits l WHERE l.package_id=publisher_allowance.package_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'publication limit missing' USING ERRCODE='55000'; END IF;
 IF v_limit<0 THEN RAISE EXCEPTION 'negative publication limit' USING ERRCODE='22023'; END IF;
 allowance:=v_limit::bigint; unlimited:=v_limit IS NULL; observed_at:=v_at;
 RETURN NEXT;
END $f$;

-- Existing S1 index covers all publisher-linked rows. This smaller covering index
-- serves the active-only count and ownership validation without listing payloads.
CREATE INDEX listings_canonical_active_publisher_idx ON public.listings(publisher_account_id)
 INCLUDE(owner_id) WHERE publisher_account_id IS NOT NULL AND listing_status='active';

CREATE FUNCTION twuanis_canonical_private.publisher_consumption(p_publisher uuid,p_owner uuid)
RETURNS bigint LANGUAGE plpgsql VOLATILE SECURITY INVOKER
SET search_path=pg_catalog,pg_temp AS $f$
DECLARE v_owner uuid; v_count bigint; v_bad bigint;
BEGIN
 v_owner:=twuanis_canonical_private.lock_publisher(p_publisher);
 IF p_owner IS DISTINCT FROM v_owner THEN RAISE EXCEPTION 'publisher/customer mismatch' USING ERRCODE='22023'; END IF;
 SELECT count(*),count(*) FILTER(WHERE l.owner_id IS DISTINCT FROM v_owner)
 INTO v_count,v_bad FROM public.listings l
 WHERE l.publisher_account_id=p_publisher AND l.listing_status='active';
 IF v_bad<>0 THEN RAISE EXCEPTION 'canonical listing ownership mismatch' USING ERRCODE='55000'; END IF;
 RETURN v_count;
END $f$;

CREATE FUNCTION twuanis_canonical_private.capacity_state(p_allowance bigint,p_consumption bigint)
RETURNS TABLE(allowance bigint,consumption bigint,remaining bigint,over_capacity bigint,
 adding_one_exceeds boolean,is_over_capacity boolean,unlimited boolean)
LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path=pg_catalog,pg_temp AS $f$
BEGIN
 IF p_consumption IS NULL OR p_consumption<0 OR p_allowance<0 THEN
  RAISE EXCEPTION 'invalid capacity numbers' USING ERRCODE='22023';
 END IF;
 allowance:=p_allowance; consumption:=p_consumption; unlimited:=p_allowance IS NULL;
 remaining:=p_allowance-p_consumption;
 over_capacity:=CASE WHEN unlimited THEN 0 ELSE greatest(p_consumption-p_allowance,0) END;
 adding_one_exceeds:=NOT unlimited AND p_consumption>=p_allowance;
 is_over_capacity:=NOT unlimited AND p_consumption>p_allowance;
 RETURN NEXT;
END $f$;

DO $f$ DECLARE signature regprocedure;
BEGIN
 FOR signature IN SELECT p.oid::regprocedure FROM pg_proc p
 WHERE p.pronamespace='twuanis_canonical_private'::regnamespace AND p.proname IN
 ('initialize_capacity_guard','lock_capacity_policy','ensure_publisher_account','lock_publisher',
 'resolve_publisher','publisher_allowance','publisher_consumption','capacity_state')
 LOOP
  EXECUTE format('ALTER FUNCTION %s OWNER TO postgres',signature);
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',signature);
 END LOOP;
END $f$;
COMMIT;
