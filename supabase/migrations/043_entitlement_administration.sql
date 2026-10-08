-- STEP10 LOCAL PREPARATION: activation requires the complete local gate and separate authorization.
-- Local Step10: bounded entitlement administration, no direct runtime table authority.
BEGIN;
CREATE FUNCTION twuanis_canonical_private.entitlement_projection(p_id uuid) RETURNS jsonb LANGUAGE sql STABLE SET search_path=pg_catalog AS $$
 SELECT jsonb_build_object('id',t.id,'accountId',t.account_id,'productClass',t.product_class,'productId',t.product_id,'configurationId',t.configuration_id,'listingId',t.listing_id,'source',t.source,'orderId',t.order_id,'acknowledgementId',t.acknowledgement_id,'actorId',t.actor_id,'requestId',t.request_id,'reason',t.reason,'note',t.note,'startsAt',t.starts_at,'endsAt',t.ends_at,'committedAt',t.committed_at,
 'state',CASE WHEN r.term_id IS NOT NULL THEN 'REVOKED' WHEN t.starts_at>statement_timestamp() THEN 'SCHEDULED' WHEN t.ends_at<=statement_timestamp() THEN 'EXPIRED' ELSE 'ACTIVE' END,
 'revocation',CASE WHEN r.term_id IS NOT NULL THEN jsonb_build_object('actorId',r.actor_id,'requestId',r.request_id,'reason',r.reason,'revokedAt',r.revoked_at) END)
 FROM twuanis_canonical_private.entitlement_terms t LEFT JOIN twuanis_canonical_private.entitlement_revocations r ON r.term_id=t.id WHERE t.id=p_id
$$;
CREATE FUNCTION public.admin_entitlement_read(p_id uuid DEFAULT NULL,p_after uuid DEFAULT NULL,p_account uuid DEFAULT NULL,p_source text DEFAULT NULL,p_class text DEFAULT NULL,p_state text DEFAULT NULL,p_listing uuid DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE result jsonb;BEGIN
 PERFORM twuanis_canonical_private.assert_administrative_permission('entitlements.read');
 IF (p_source IS NOT NULL AND p_source NOT IN('PURCHASED','ADMIN_GRANT')) OR (p_class IS NOT NULL AND p_class NOT IN('PACKAGE','LISTING_ADDON','FOUNDING_MEMBERSHIP')) OR (p_state IS NOT NULL AND p_state NOT IN('ACTIVE','SCHEDULED','EXPIRED','REVOKED')) THEN RAISE EXCEPTION 'invalid entitlement filter';END IF;
 IF p_id IS NOT NULL THEN RETURN twuanis_canonical_private.entitlement_projection(p_id);END IF;
 SELECT coalesce(jsonb_agg(twuanis_canonical_private.entitlement_projection(q.id) ORDER BY q.id),'[]') INTO result FROM (
 SELECT t.id FROM twuanis_canonical_private.entitlement_terms t LEFT JOIN twuanis_canonical_private.entitlement_revocations r ON r.term_id=t.id
 WHERE (p_after IS NULL OR t.id>p_after) AND(p_account IS NULL OR t.account_id=p_account)AND(p_source IS NULL OR t.source=p_source)AND(p_class IS NULL OR t.product_class=p_class)AND(p_listing IS NULL OR t.listing_id=p_listing)
 AND(p_state IS NULL OR p_state=CASE WHEN r.term_id IS NOT NULL THEN 'REVOKED' WHEN t.starts_at>statement_timestamp() THEN 'SCHEDULED' WHEN t.ends_at<=statement_timestamp() THEN 'EXPIRED' ELSE 'ACTIVE' END)
 ORDER BY t.id LIMIT 26)q;
 RETURN result;
END $$;
CREATE FUNCTION public.admin_entitlement_command(p_request uuid,p_command jsonb) RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid;prior twuanis_canonical_private.administrative_receipts%ROWTYPE;tid uuid;t twuanis_canonical_private.entitlement_terms%ROWTYPE;result jsonb;event bigint;at_time timestamptz;starts timestamptz;ends timestamptz;pid text;cfg uuid;kind text;reason text;days integer;tail timestamptz;
BEGIN
 actor:=twuanis_canonical_private.assert_administrative_permission('entitlements.manage');
 IF p_request IS NULL OR p_command IS NULL OR jsonb_typeof(p_command)<>'object' OR octet_length(p_command::text)>8000 OR p_command->>'operation' IS NULL THEN RAISE EXCEPTION 'bounded explicit command required';END IF;
 SELECT * INTO prior FROM twuanis_canonical_private.administrative_receipts WHERE actor_id=actor AND request_id=p_request;
 IF FOUND THEN IF prior.command IS DISTINCT FROM p_command THEN RAISE EXCEPTION 'request replay conflict';END IF;SELECT after_state INTO result FROM twuanis_canonical_private.administrative_events WHERE id=prior.event_id;RETURN result;END IF;
 IF EXISTS(SELECT 1 FROM jsonb_object_keys(p_command) k WHERE k NOT IN('operation','confirmed','id','accountId','productClass','productId','configurationId','listingId','startMode','startsAt','endsAt','durationDays','reason','note')) THEN RAISE EXCEPTION 'unknown command field';END IF;
 IF jsonb_typeof(p_command->'confirmed') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'confirmation boolean required';END IF;
 IF p_command->>'confirmed' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'explicit confirmation required';END IF;
 reason:=p_command->>'reason';
 IF reason IS NULL OR reason NOT IN('SALES','CUSTOMER_SERVICE','PROMOTION','PARTNER','OPERATIONAL_CORRECTION','OTHER') OR (reason='OTHER' AND coalesce(length(btrim(p_command->>'note')),0)=0) THEN RAISE EXCEPTION 'structured reason required';END IF;
 IF p_command->>'operation'='grant' THEN
  IF p_command->>'startMode' IS NOT NULL AND p_command->>'startMode' NOT IN('immediate','scheduled') THEN RAISE EXCEPTION 'invalid start mode';END IF;
  pid:=p_command->>'productId';cfg:=(p_command->>'configurationId')::uuid;kind:=p_command->>'productClass';
  IF kind='PACKAGE' THEN PERFORM id FROM twuanis_canonical_private.intelligence_packages WHERE id=pid AND current_configuration_id=cfg AND state='active' FOR SHARE;
  ELSE PERFORM id FROM twuanis_canonical_private.addon_products WHERE id=pid AND current_configuration_id=cfg AND state='active' FOR SHARE;END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'current grantable product/configuration required';END IF;
  IF p_command->>'startMode'='immediate' THEN
   IF kind='LISTING_ADDON' THEN
    IF EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_products WHERE id=pid AND behavior='homepage_carousel') THEN PERFORM capacity FROM twuanis_canonical_private.addon_homepage_capacity WHERE id FOR UPDATE;END IF;
    PERFORM id FROM public.listings WHERE id=(p_command->>'listingId')::uuid FOR UPDATE;
    SELECT max(x.ends_at) INTO tail FROM twuanis_canonical_private.entitlement_terms x WHERE x.listing_id=(p_command->>'listingId')::uuid AND x.product_id=pid AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.entitlement_revocations r WHERE r.term_id=x.id);
   END IF;
   starts:=greatest(clock_timestamp(),tail);
   IF kind<>'FOUNDING_MEMBERSHIP' THEN days:=(p_command->>'durationDays')::integer;IF days IS NULL OR days<1 THEN RAISE EXCEPTION 'explicit positive grant duration required';END IF;ends:=starts+days*interval '24 hours';END IF;
  ELSE
  starts:=(p_command->>'startsAt')::timestamptz;ends:=(p_command->>'endsAt')::timestamptz;
  IF starts<clock_timestamp() OR (p_command->>'startsAt') !~ '(Z|[+-][0-9]{2}:[0-9]{2})$' OR (ends IS NOT NULL AND (p_command->>'endsAt') !~ '(Z|[+-][0-9]{2}:[0-9]{2})$') THEN RAISE EXCEPTION 'explicit future timezone-aware interval required';END IF;
 END IF;
  tid:=twuanis_canonical_private.commit_entitlement_term((p_command->>'accountId')::uuid,kind,pid,cfg,(p_command->>'listingId')::uuid,'ADMIN_GRANT',NULL,NULL,actor,p_request,starts,ends,reason,p_command->>'note');
 ELSIF p_command->>'operation'='revoke' THEN
  tid:=(p_command->>'id')::uuid;SELECT * INTO STRICT t FROM twuanis_canonical_private.entitlement_terms WHERE id=tid;
  IF t.source='PURCHASED' AND NOT public.is_current_user_owner() THEN RAISE EXCEPTION 'Owner required for purchased revocation' USING ERRCODE='42501';END IF;
  IF t.product_class='LISTING_ADDON' THEN
   IF EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_products WHERE id=t.product_id AND behavior='homepage_carousel') THEN PERFORM capacity FROM twuanis_canonical_private.addon_homepage_capacity WHERE id FOR UPDATE;END IF;
   PERFORM id FROM public.listings WHERE id=t.listing_id FOR UPDATE;
  ELSE PERFORM id FROM auth.users WHERE id=t.account_id FOR UPDATE;END IF;
  at_time:=clock_timestamp();
  IF t.ends_at<=at_time THEN RAISE EXCEPTION 'entitlement already expired';END IF;
  IF EXISTS(SELECT 1 FROM twuanis_canonical_private.entitlement_revocations WHERE term_id=tid) THEN RAISE EXCEPTION 'entitlement already revoked';END IF;
  INSERT INTO twuanis_canonical_private.entitlement_revocations(term_id,actor_id,request_id,reason,revoked_at) VALUES(tid,actor,p_request,reason||coalesce(': '||(p_command->>'note'),''),at_time);
  IF t.product_class='PACKAGE' THEN UPDATE twuanis_canonical_private.intelligence_package_rights SET revoked_at=at_time WHERE id=tid;
  ELSIF t.product_class='LISTING_ADDON' THEN PERFORM twuanis_canonical_private.refresh_placement_terms(t.listing_id,t.product_id);
  ELSE
   SELECT min(x.starts_at) INTO starts FROM twuanis_canonical_private.entitlement_terms x WHERE x.account_id=t.account_id AND x.product_class='FOUNDING_MEMBERSHIP' AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.entitlement_revocations r WHERE r.term_id=x.id);
   UPDATE twuanis_canonical_private.addon_founder_rights SET activated_at=coalesce(starts,activated_at),revoked_at=CASE WHEN starts IS NULL THEN at_time END WHERE account_id=t.account_id;
  END IF;
 ELSE RAISE EXCEPTION 'unsupported entitlement operation';END IF;
 result:=twuanis_canonical_private.entitlement_projection(tid);
 event:=twuanis_canonical_private.append_administrative_event(actor,CASE WHEN public.is_current_user_owner() THEN 'Owner' ELSE 'Scoped Administrator' END,'entitlements.manage','entitlement.'||(p_command->>'operation'),'entitlement',tid,NULL,result,reason,p_request);
 INSERT INTO twuanis_canonical_private.administrative_receipts VALUES(actor,p_request,p_command,event);
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION twuanis_canonical_private.entitlement_projection(uuid),public.admin_entitlement_read(uuid,uuid,uuid,text,text,text,uuid),public.admin_entitlement_command(uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.admin_entitlement_read(uuid,uuid,uuid,text,text,text,uuid),public.admin_entitlement_command(uuid,jsonb) TO authenticated;
CREATE FUNCTION public.admin_entitlement_targets(p_after text DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE result jsonb;BEGIN
 PERFORM twuanis_canonical_private.assert_administrative_permission('entitlements.manage');
 IF length(p_after)>150 THEN RAISE EXCEPTION 'bounded cursor required';END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(q) ORDER BY q.id),'[]') INTO result FROM (
 SELECT * FROM (
 SELECT p.id,p.name_en,p.name_es,p.current_configuration_id AS "configurationId",'PACKAGE'::text AS "productClass" FROM twuanis_canonical_private.intelligence_packages p WHERE state='active'
 UNION ALL SELECT p.id,p.name_en,p.name_es,p.current_configuration_id,CASE WHEN p.term_kind='lifetime' THEN 'FOUNDING_MEMBERSHIP' ELSE 'LISTING_ADDON' END FROM twuanis_canonical_private.addon_products p WHERE state='active' AND term_kind IN('lifetime','elapsed_days')
 )a WHERE p_after IS NULL OR a.id>p_after ORDER BY a.id LIMIT 26)q;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.admin_entitlement_targets(text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.admin_entitlement_targets(text) TO authenticated;
COMMIT;
