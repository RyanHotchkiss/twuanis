-- Local Step 7 delivery/media boundary. No production activation.
BEGIN;
CREATE TABLE twuanis_canonical_private.campaign_sessions(id uuid PRIMARY KEY,expires_at timestamptz NOT NULL);
CREATE INDEX campaign_session_expiry ON twuanis_canonical_private.campaign_sessions(expires_at);
CREATE TABLE twuanis_canonical_private.campaign_frequency(session_id uuid REFERENCES twuanis_canonical_private.campaign_sessions ON DELETE CASCADE,campaign_id uuid REFERENCES twuanis_canonical_private.campaigns,reservations integer NOT NULL DEFAULT 0,dismissed boolean NOT NULL DEFAULT false,PRIMARY KEY(session_id,campaign_id));
CREATE TABLE twuanis_canonical_private.campaign_deliveries(
 token uuid PRIMARY KEY DEFAULT gen_random_uuid(),session_id uuid NOT NULL REFERENCES twuanis_canonical_private.campaign_sessions ON DELETE CASCADE,
 campaign_id uuid NOT NULL REFERENCES twuanis_canonical_private.campaigns,configuration_id uuid NOT NULL REFERENCES twuanis_canonical_private.campaign_configurations,
 surface text NOT NULL REFERENCES twuanis_canonical_private.campaign_surfaces,expires_at timestamptz NOT NULL,
 impression boolean NOT NULL DEFAULT false,click boolean NOT NULL DEFAULT false,dismissed boolean NOT NULL DEFAULT false
);
CREATE INDEX campaign_delivery_session ON twuanis_canonical_private.campaign_deliveries(session_id);
CREATE TABLE twuanis_canonical_private.campaign_counts(configuration_id uuid REFERENCES twuanis_canonical_private.campaign_configurations,surface text REFERENCES twuanis_canonical_private.campaign_surfaces,impressions bigint NOT NULL DEFAULT 0,clicks bigint NOT NULL DEFAULT 0,PRIMARY KEY(configuration_id,surface));
CREATE FUNCTION public.resolve_owned_campaigns(p_session uuid,p_surfaces text[],p_language text,p_authenticated boolean) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE sid uuid;sf text;x record;tok uuid;v jsonb:='[]';at_time timestamptz:=clock_timestamp();media_image text;media_video text;
BEGIN
 IF p_surfaces IS NULL OR cardinality(p_surfaces)>3 OR cardinality(p_surfaces)<>(SELECT count(DISTINCT s) FROM unnest(p_surfaces)s) OR array_ndims(p_surfaces)>1 OR p_language IS NULL OR p_language NOT IN ('en','es') OR p_authenticated IS NULL OR EXISTS(SELECT 1 FROM unnest(p_surfaces)s WHERE NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.campaign_surfaces WHERE id=s)) THEN RAISE EXCEPTION 'bounded registered surfaces required';END IF;
 -- Token supplied by the server; callers cannot select another account or audience authority.
 SELECT id INTO sid FROM twuanis_canonical_private.campaign_sessions WHERE id=p_session AND expires_at>at_time FOR UPDATE;
 IF sid IS NULL THEN sid:=gen_random_uuid();INSERT INTO twuanis_canonical_private.campaign_sessions VALUES(sid,at_time+interval '24 hours');END IF;
 -- Privacy retention: bounded cleanup only; aggregate counts retain version attribution, no visitor identity.
 DELETE FROM twuanis_canonical_private.campaign_sessions WHERE id IN (SELECT id FROM twuanis_canonical_private.campaign_sessions WHERE expires_at<at_time ORDER BY expires_at LIMIT 20 FOR UPDATE SKIP LOCKED);
 FOREACH sf IN ARRAY p_surfaces LOOP
  SELECT c.id,c.current_configuration_id,v.frequency,cv.payload INTO x
  FROM twuanis_canonical_private.campaigns c JOIN twuanis_canonical_private.campaign_configurations v ON v.id=c.current_configuration_id
  JOIN twuanis_canonical_private.campaign_creative_versions cv ON cv.id=v.creative_version
  LEFT JOIN twuanis_canonical_private.campaign_frequency f ON f.session_id=sid AND f.campaign_id=c.id
  WHERE c.state='eligible' AND sf=ANY(v.surfaces) AND v.starts_at<=at_time AND v.ends_at>at_time
   AND (v.audience='ALL' OR v.audience=CASE WHEN p_authenticated THEN 'AUTHENTICATED' ELSE 'UNAUTHENTICATED' END)
   AND NOT coalesce(f.dismissed,false) AND coalesce(f.reservations,0)<v.frequency
   AND twuanis_canonical_private.campaign_target_valid(c.target_class,c.target_id,at_time,true)
  ORDER BY v.priority DESC,c.id LIMIT 1;
  IF FOUND THEN
   INSERT INTO twuanis_canonical_private.campaign_frequency VALUES(sid,x.id,1,false) ON CONFLICT(session_id,campaign_id) DO UPDATE SET reservations=twuanis_canonical_private.campaign_frequency.reservations+1;
   tok:=gen_random_uuid();INSERT INTO twuanis_canonical_private.campaign_deliveries(token,session_id,campaign_id,configuration_id,surface,expires_at) VALUES(tok,sid,x.id,x.current_configuration_id,sf,at_time+interval '1 hour');
   SELECT path INTO media_image FROM twuanis_canonical_private.campaign_media WHERE id=(x.payload->>'image')::uuid AND completed;
   SELECT path INTO media_video FROM twuanis_canonical_private.campaign_media WHERE id=(x.payload->>'video')::uuid AND completed;
   v:=v||jsonb_build_array(jsonb_build_object('token',tok,'surface',sf,'headline',x.payload->>('headline_'||p_language),'copy',x.payload->>('copy_'||p_language),'cta',x.payload->>('cta_'||p_language),'destination',x.payload->>('destination_'||p_language),'alt',x.payload->>('alt_'||p_language),'image',media_image,'video',media_video));
  END IF;
 END LOOP;
 RETURN jsonb_build_object('session',sid,'items',v);
END $$;
CREATE FUNCTION public.report_campaign_events(p_session uuid,p_events jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ DECLARE e jsonb;d twuanis_canonical_private.campaign_deliveries%ROWTYPE;BEGIN
 IF jsonb_typeof(p_events) IS DISTINCT FROM 'array' OR jsonb_array_length(p_events)>6 THEN RAISE EXCEPTION 'bounded events required';END IF;
 PERFORM id FROM twuanis_canonical_private.campaign_sessions WHERE id=p_session AND expires_at>clock_timestamp() FOR UPDATE;
 IF NOT FOUND THEN RETURN;END IF;
 FOR e IN SELECT value FROM jsonb_array_elements(p_events) ORDER BY value->>'token',CASE value->>'kind' WHEN 'impression' THEN 0 WHEN 'click' THEN 1 ELSE 2 END LOOP
  IF e->>'kind' IS NULL OR e->>'kind' NOT IN ('impression','click','dismiss') OR EXISTS(SELECT 1 FROM jsonb_object_keys(e)k WHERE k<>ALL(ARRAY['token','kind'])) THEN RAISE EXCEPTION 'invalid event';END IF;
  SELECT * INTO d FROM twuanis_canonical_private.campaign_deliveries WHERE token=(e->>'token')::uuid AND session_id=p_session AND expires_at>clock_timestamp() FOR UPDATE;
  IF NOT FOUND THEN CONTINUE;END IF;
  IF e->>'kind'='dismiss' THEN
   UPDATE twuanis_canonical_private.campaign_frequency SET dismissed=true WHERE session_id=p_session AND campaign_id=d.campaign_id;
   UPDATE twuanis_canonical_private.campaign_deliveries SET dismissed=true WHERE token=d.token;
  ELSIF e->>'kind'='impression' AND NOT d.impression THEN
   UPDATE twuanis_canonical_private.campaign_deliveries SET impression=true WHERE token=d.token;
   INSERT INTO twuanis_canonical_private.campaign_counts VALUES(d.configuration_id,d.surface,1,0) ON CONFLICT(configuration_id,surface) DO UPDATE SET impressions=twuanis_canonical_private.campaign_counts.impressions+1;
  ELSIF e->>'kind'='click' AND d.impression AND NOT d.click THEN
   UPDATE twuanis_canonical_private.campaign_deliveries SET click=true WHERE token=d.token;
   UPDATE twuanis_canonical_private.campaign_counts SET clicks=clicks+1 WHERE configuration_id=d.configuration_id AND surface=d.surface;
  END IF;
 END LOOP;
END $$;
CREATE FUNCTION public.admin_campaign_performance(p_id uuid,p_after uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$DECLARE v jsonb;BEGIN
 PERFORM twuanis_canonical_private.assert_administrative_permission('promotions.read');
 SELECT coalesce(jsonb_agg(to_jsonb(q) ORDER BY q.id),'[]') INTO v FROM (SELECT v.id,v.version::text,v.creative_version,v.external,coalesce(sum(c.impressions),0)::text AS impressions,coalesce(sum(c.clicks),0)::text AS clicks
 FROM twuanis_canonical_private.campaign_configurations v LEFT JOIN twuanis_canonical_private.campaign_counts c ON c.configuration_id=v.id
 WHERE v.campaign_id=p_id AND (p_after IS NULL OR v.id>p_after) GROUP BY v.id ORDER BY v.id LIMIT 26)q;
 RETURN v;
END $$;
CREATE FUNCTION public.admin_campaign_media(p_request uuid,p_mime text,p_bytes integer,p_sha256 text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$DECLARE actor uuid;m twuanis_canonical_private.campaign_media%ROWTYPE;BEGIN
 actor:=twuanis_canonical_private.assert_administrative_permission('promotions.manage');
 IF p_request IS NULL THEN RAISE EXCEPTION 'request required';END IF;
 PERFORM pg_advisory_xact_lock(3171,hashtext(jsonb_build_array(actor,p_request)::text));
 SELECT * INTO m FROM twuanis_canonical_private.campaign_media WHERE actor_id=actor AND request_id=p_request;
 IF FOUND THEN
  IF (m.mime,m.bytes,m.sha256) IS DISTINCT FROM (p_mime,p_bytes,p_sha256) THEN RAISE EXCEPTION 'media retry conflict';END IF;
 ELSE
  m.id:=gen_random_uuid();m.path:='system/campaigns/'||m.id||CASE WHEN p_mime='image/jpeg' THEN '.jpg' ELSE '.mp4' END;
  INSERT INTO twuanis_canonical_private.campaign_media(id,actor_id,request_id,path,mime,bytes,sha256) VALUES(m.id,actor,p_request,m.path,p_mime,p_bytes,p_sha256) RETURNING * INTO m;
  PERFORM twuanis_canonical_private.append_administrative_event(actor,CASE WHEN public.is_current_user_owner() THEN 'Owner' ELSE 'Administrator' END,'promotions.manage','campaign.media.prepare','campaign_media',m.id,NULL,jsonb_build_object('path',m.path,'provenance','twuanis-managed'),NULL,p_request);
 END IF;
 RETURN to_jsonb(m);
END $$;
CREATE FUNCTION public.admin_campaign_media_complete(p_request uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$DECLARE actor uuid;m twuanis_canonical_private.campaign_media%ROWTYPE;BEGIN
 actor:=twuanis_canonical_private.assert_administrative_permission('promotions.manage');
 SELECT * INTO STRICT m FROM twuanis_canonical_private.campaign_media WHERE actor_id=actor AND request_id=p_request FOR UPDATE;
 IF NOT m.completed THEN
  IF NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='campaign-media' AND name=m.path AND (metadata->>'size')::bigint=m.bytes AND metadata->>'mimetype'=m.mime) THEN RAISE EXCEPTION 'storage incomplete';END IF;
  UPDATE twuanis_canonical_private.campaign_media SET completed=true WHERE id=m.id;
  PERFORM twuanis_canonical_private.append_administrative_event(actor,CASE WHEN public.is_current_user_owner() THEN 'Owner' ELSE 'Administrator' END,'promotions.manage','campaign.media.complete','campaign_media',m.id,NULL,jsonb_build_object('path',m.path,'provenance','twuanis-managed'),NULL,p_request);
 END IF;
 RETURN jsonb_build_object('id',m.id,'path',m.path);
END $$;
DO $$ DECLARE t text;f regprocedure;BEGIN
 FOREACH t IN ARRAY ARRAY['campaign_sessions','campaign_frequency','campaign_deliveries','campaign_counts'] LOOP
 EXECUTE format('ALTER TABLE twuanis_canonical_private.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('ALTER TABLE twuanis_canonical_private.%I OWNER TO postgres',t);
 EXECUTE format('REVOKE ALL ON twuanis_canonical_private.%I FROM PUBLIC,anon,authenticated,service_role',t);
 END LOOP;
 FOR f IN SELECT p.oid::regprocedure FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('resolve_owned_campaigns','report_campaign_events','admin_campaign_performance','admin_campaign_media','admin_campaign_media_complete') LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',f);
 EXECUTE format('ALTER FUNCTION %s OWNER TO postgres',f);
 END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION public.resolve_owned_campaigns(uuid,text[],text,boolean),public.report_campaign_events(uuid,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_campaign_performance(uuid,uuid),public.admin_campaign_media(uuid,text,integer,text),public.admin_campaign_media_complete(uuid) TO authenticated;
COMMIT;
