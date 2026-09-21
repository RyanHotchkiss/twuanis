-- Reviewed S11-C group only. Signup and commercial writes MUST remain paused.
-- Execute as postgres after disposable subscriptions are purged and setup installed.
-- No public function or browser endpoint. Receipt makes the SAME operation retryable.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
DO $init$
DECLARE
 operation constant uuid := 'd07b12fe-d18d-4a86-a256-8cab437fab96';
 package uuid; package_count bigint; active_count bigint; ids jsonb; rows_now jsonb;
 receipt twuanis_canonical_private.s11_retained_auth_receipt%ROWTYPE;
BEGIN
 IF current_user <> 'postgres' OR session_user <> 'postgres' THEN
  RAISE EXCEPTION 'postgres administrative session required' USING ERRCODE='42501'; END IF;
 -- Fixed lock order, no runtime initialization authority. Block signup/commercial races.
 LOCK TABLE auth.users IN SHARE MODE;
 LOCK TABLE public.packages IN SHARE MODE;
 LOCK TABLE public.user_subscriptions IN EXCLUSIVE MODE;
 LOCK TABLE twuanis_canonical_private.s11_retained_auth_receipt IN EXCLUSIVE MODE;
 SELECT count(*),count(*) FILTER(WHERE is_active),min(id::text)::uuid
 INTO package_count,active_count,package FROM public.packages WHERE slug='market-explorer';
 IF package_count<>1 OR active_count<>1 THEN
  RAISE EXCEPTION 'exactly one existing active Market Explorer package required' USING ERRCODE='55000'; END IF;
 SELECT coalesce(jsonb_agg(id ORDER BY id),'[]') INTO ids FROM auth.users;
 SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY s.user_id,s.id),'[]') INTO rows_now FROM public.user_subscriptions s;
 SELECT * INTO receipt FROM twuanis_canonical_private.s11_retained_auth_receipt WHERE singleton;
 IF FOUND THEN
  IF receipt.operation_id<>operation OR receipt.package_id<>package OR receipt.auth_ids<>ids OR receipt.subscriptions<>rows_now THEN
   RAISE EXCEPTION 'cutover receipt/current state mismatch; no reinitialization permitted' USING ERRCODE='55000'; END IF;
  RAISE NOTICE 'S11 retained-auth initialization replay: % identities, no writes',jsonb_array_length(ids);
  RETURN;
 END IF;
 IF rows_now<>'[]'::jsonb THEN
  RAISE EXCEPTION 'disposable subscriptions must be absent before first initialization' USING ERRCODE='55000'; END IF;
 INSERT INTO public.user_subscriptions(user_id,package_id,status,billing_cycle,started_at,current_period_start)
 SELECT id,package,'active','free',now(),now() FROM auth.users ORDER BY id;
 IF EXISTS(SELECT 1 FROM auth.users u LEFT JOIN public.user_subscriptions s ON s.user_id=u.id
  GROUP BY u.id HAVING count(s.id)<>1 OR count(s.id) FILTER(WHERE s.package_id=package AND s.status='active' AND s.billing_cycle='free')<>1)
 OR (SELECT count(*) FROM public.user_subscriptions)<>jsonb_array_length(ids) THEN
  RAISE EXCEPTION 'default subscription cardinality verification failed' USING ERRCODE='55000'; END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY s.user_id,s.id),'[]') INTO rows_now FROM public.user_subscriptions s;
 INSERT INTO twuanis_canonical_private.s11_retained_auth_receipt
 VALUES(true,operation,package,now(),ids,rows_now);
 RAISE NOTICE 'S11 retained-auth initialized: % identities',jsonb_array_length(ids);
END $init$;
COMMIT;
