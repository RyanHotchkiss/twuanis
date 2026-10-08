BEGIN;
-- Existing schema: supplied production catalog snapshot. No customer rows rewritten.
ALTER TABLE public.push_subscriptions ADD COLUMN enabled boolean NOT NULL DEFAULT true;
REVOKE ALL ON public.push_subscriptions FROM PUBLIC,anon,authenticated,service_role;
-- Keep existing RLS policies as defense in depth; runtime goes through this bounded command.
CREATE FUNCTION public.account_push_command(p_operation text,p_endpoint text DEFAULT NULL,p_registration uuid DEFAULT NULL,p_keys jsonb DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE u uuid:=auth.uid();r public.push_subscriptions;
BEGIN
 IF u IS NULL OR auth.jwt()->>'role' IS DISTINCT FROM 'authenticated' THEN RAISE EXCEPTION 'authentication required' USING ERRCODE='42501';END IF;
 IF p_operation NOT IN ('state','enable','disable') OR p_operation IS NULL OR (p_endpoint IS NULL AND p_registration IS NULL) OR (p_endpoint IS NOT NULL AND (length(p_endpoint)>2048 OR p_endpoint !~ '^https://[^[:space:]]+$')) THEN RAISE EXCEPTION 'invalid command' USING ERRCODE='22023';END IF;
 IF p_operation='enable' AND (p_endpoint IS NULL OR p_registration IS NOT NULL OR jsonb_typeof(p_keys) IS DISTINCT FROM 'object' OR p_keys->>'p256dh' IS NULL OR p_keys->>'auth' IS NULL OR p_keys->>'p256dh' !~ '^[A-Za-z0-9_-]{87}=?$' OR p_keys->>'auth' !~ '^[A-Za-z0-9_-]{22}(==)?$' OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_keys) k WHERE k NOT IN ('p256dh','auth'))) THEN RAISE EXCEPTION 'invalid subscription' USING ERRCODE='22023';END IF;
 IF p_operation<>'enable' AND p_keys IS NOT NULL THEN RAISE EXCEPTION 'unexpected keys' USING ERRCODE='22023';END IF;
 -- Endpoint-scoped lock covers absent-row inserts as well as retries/collisions.
 IF p_endpoint IS NOT NULL THEN PERFORM pg_advisory_xact_lock(hashtextextended('account-push:'||p_endpoint,0));END IF;
 SELECT * INTO r FROM public.push_subscriptions WHERE CASE WHEN p_endpoint IS NOT NULL THEN endpoint=p_endpoint ELSE id=p_registration END FOR UPDATE;
 IF FOUND AND r.user_id<>u THEN RETURN jsonb_build_object('ok',false,'reason','unavailable');END IF;
 IF p_operation='enable' THEN
  IF r.id IS NULL THEN
   INSERT INTO public.push_subscriptions(user_id,endpoint,p256dh,auth,enabled) VALUES(u,p_endpoint,p_keys->>'p256dh',p_keys->>'auth',true) RETURNING * INTO r;
  ELSE
   UPDATE public.push_subscriptions SET enabled=true,p256dh=p_keys->>'p256dh',auth=p_keys->>'auth',updated_at=clock_timestamp() WHERE id=r.id RETURNING * INTO r;
  END IF;
 ELSIF p_operation='disable' AND r.id IS NOT NULL THEN
  UPDATE public.push_subscriptions SET enabled=false,updated_at=clock_timestamp() WHERE id=r.id RETURNING * INTO r;
 END IF;
 RETURN jsonb_build_object('ok',true,'active',coalesce(r.enabled,false),'registration',r.id);
END $$;
ALTER FUNCTION public.account_push_command(text,text,uuid,jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.account_push_command(text,text,uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.account_push_command(text,text,uuid,jsonb) TO authenticated;
COMMIT;
