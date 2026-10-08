-- Step 7 local preparation. No campaign seeds, commercial grants, or activation.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
DO $$ BEGIN IF current_user<>'postgres' THEN RAISE EXCEPTION 'postgres installation required'; END IF; END $$;
CREATE TABLE twuanis_canonical_private.campaigns(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),target_class text NOT NULL CHECK(target_class IN ('TWUANIS','PACKAGE','ADD_ON','OFFER','ENGINE','FEATURE')),
 target_id text NOT NULL CHECK(length(target_id) BETWEEN 1 AND 150),state text NOT NULL DEFAULT 'draft' CHECK(state IN ('draft','eligible','paused','ended','archived')),
 revision bigint NOT NULL DEFAULT 1,current_configuration_id uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE twuanis_canonical_private.campaign_creatives(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),revision bigint NOT NULL DEFAULT 1,current_version_id uuid NOT NULL);
CREATE TABLE twuanis_canonical_private.campaign_creative_versions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),creative_id uuid NOT NULL REFERENCES twuanis_canonical_private.campaign_creatives,
 version bigint NOT NULL,payload jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),UNIQUE(creative_id,version),UNIQUE(creative_id,id)
);
ALTER TABLE twuanis_canonical_private.campaign_creatives ADD FOREIGN KEY(id,current_version_id) REFERENCES twuanis_canonical_private.campaign_creative_versions(creative_id,id) DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE twuanis_canonical_private.campaign_surfaces(
 id text PRIMARY KEY,form text NOT NULL CHECK(form IN ('banner','popup')),route_scope text NOT NULL,
 capacity integer NOT NULL CHECK(capacity=1),media_forms text[] NOT NULL,language_behavior text NOT NULL CHECK(language_behavior='explicit-en-es')
);
INSERT INTO twuanis_canonical_private.campaign_surfaces VALUES
 ('homepage','banner','homepage',1,ARRAY['text','image','video'],'explicit-en-es'),
 ('banner','banner','public',1,ARRAY['text','image','video'],'explicit-en-es'),
 ('popup','popup','public',1,ARRAY['text','image'],'explicit-en-es'),
 ('package','banner','package',1,ARRAY['text','image','video'],'explicit-en-es'),
 ('intelligence-hub','banner','intelligence-hub',1,ARRAY['text','image','video'],'explicit-en-es'),
 ('market-hub','banner','market-hub',1,ARRAY['text','image','video'],'explicit-en-es');
CREATE TABLE twuanis_canonical_private.campaign_channels(id text PRIMARY KEY);
INSERT INTO twuanis_canonical_private.campaign_channels VALUES('FACEBOOK'),('INSTAGRAM'),('GOOGLE');
CREATE TABLE twuanis_canonical_private.campaign_configurations(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),campaign_id uuid NOT NULL REFERENCES twuanis_canonical_private.campaigns,
 version bigint NOT NULL,name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 300),
 creative_version uuid NOT NULL REFERENCES twuanis_canonical_private.campaign_creative_versions,
 surfaces text[] NOT NULL CHECK(cardinality(surfaces) BETWEEN 0 AND 6),
 audience text NOT NULL CHECK(audience IN ('ALL','AUTHENTICATED','UNAUTHENTICATED')),
 starts_at timestamptz NOT NULL,ends_at timestamptz NOT NULL,
 frequency integer NOT NULL CHECK(frequency BETWEEN 1 AND 20),priority integer NOT NULL CHECK(priority BETWEEN -1000 AND 1000),
 external jsonb NOT NULL DEFAULT '[]',created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(campaign_id,version),UNIQUE(campaign_id,id),CHECK(isfinite(starts_at) AND isfinite(ends_at) AND ends_at>starts_at)
);
ALTER TABLE twuanis_canonical_private.campaigns ADD FOREIGN KEY(id,current_configuration_id) REFERENCES twuanis_canonical_private.campaign_configurations(campaign_id,id) DEFERRABLE INITIALLY DEFERRED;
CREATE FUNCTION twuanis_canonical_private.guard_campaign_identity() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$ BEGIN
 IF (NEW.id,NEW.target_class,NEW.target_id,NEW.created_at) IS DISTINCT FROM (OLD.id,OLD.target_class,OLD.target_id,OLD.created_at) THEN RAISE EXCEPTION 'campaign identity immutable';END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER campaign_identity_guard BEFORE UPDATE ON twuanis_canonical_private.campaigns FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.guard_campaign_identity();
CREATE INDEX campaign_active ON twuanis_canonical_private.campaigns(state,id);
CREATE INDEX campaign_surface ON twuanis_canonical_private.campaign_configurations USING gin(surfaces);
-- Minimal system-owned storage authority: independent namespace, same Supabase Storage.
CREATE TABLE twuanis_canonical_private.campaign_media(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),actor_id uuid NOT NULL,request_id uuid NOT NULL,
 path text NOT NULL UNIQUE,mime text NOT NULL CHECK(mime IN ('image/jpeg','video/mp4')),
 bytes integer NOT NULL CHECK(bytes>0 AND bytes<=4194304),sha256 text NOT NULL CHECK(sha256 ~ '^[a-f0-9]{64}$'),
 completed boolean NOT NULL DEFAULT false,UNIQUE(actor_id,request_id),CHECK(mime<>'image/jpeg' OR bytes<=614400)
);
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('campaign-media','campaign-media',true,4194304,ARRAY['image/jpeg','video/mp4']);
-- Restrict this namespace even when an older permissive Storage policy is broad.
-- Public object delivery uses the bucket's public endpoint; API mutation remains server-owned.
DO $$ BEGIN IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='storage.objects'::regclass) THEN RAISE EXCEPTION 'Storage RLS prerequisite missing';END IF;END $$;
CREATE POLICY campaign_media_no_customer_api ON storage.objects AS RESTRICTIVE FOR ALL TO anon,authenticated
 USING(bucket_id<>'campaign-media') WITH CHECK(bucket_id<>'campaign-media');
CREATE FUNCTION twuanis_canonical_private.campaign_target_valid(kind text,tid text,at_time timestamptz,rendering boolean DEFAULT false) RETURNS boolean
LANGUAGE sql STABLE SET search_path=pg_catalog AS $$
 SELECT CASE kind WHEN 'TWUANIS' THEN tid='twuanis'
 WHEN 'PACKAGE' THEN EXISTS(SELECT 1 FROM twuanis_canonical_private.intelligence_packages WHERE id=tid AND state='active')
 WHEN 'ADD_ON' THEN EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_products WHERE id=tid AND state='active' AND term_kind<>'unconfigured')
 WHEN 'ENGINE' THEN EXISTS(SELECT 1 FROM twuanis_canonical_private.intelligence_capabilities WHERE id=tid)
 WHEN 'OFFER' THEN EXISTS(SELECT 1 FROM twuanis_canonical_private.offers o JOIN twuanis_canonical_private.offer_configurations c ON c.id=o.current_configuration_id WHERE o.id::text=tid AND o.state NOT IN ('ended','archived') AND (NOT rendering OR twuanis_canonical_private.offer_status(o.state,c.starts_at,c.ends_at,at_time)='active') AND twuanis_canonical_private.campaign_target_valid(CASE WHEN o.package_id IS NULL THEN 'ADD_ON' ELSE 'PACKAGE' END,coalesce(o.package_id,o.addon_id),at_time,rendering))
 ELSE false END
$$;
CREATE FUNCTION twuanis_canonical_private.campaign_status(s text,b timestamptz,e timestamptz,t timestamptz) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path=pg_catalog AS $$SELECT CASE WHEN s IN ('draft','ended','archived') THEN s WHEN t>=e THEN 'ended' WHEN s='paused' THEN 'paused' WHEN t<b THEN 'scheduled' ELSE 'active' END$$;
CREATE FUNCTION twuanis_canonical_private.validate_campaign_creative(v jsonb) RETURNS void
LANGUAGE plpgsql SET search_path=pg_catalog AS $$ DECLARE k text;u text;mid uuid; BEGIN
 IF jsonb_typeof(v) IS DISTINCT FROM 'object' OR octet_length(v::text)>12000 OR EXISTS(SELECT 1 FROM jsonb_object_keys(v)x WHERE x<>ALL(ARRAY['headline_en','headline_es','copy_en','copy_es','cta_en','cta_es','destination_en','destination_es','alt_en','alt_es','image','video'])) THEN RAISE EXCEPTION 'invalid creative';END IF;
 FOREACH k IN ARRAY ARRAY['headline_en','headline_es','copy_en','copy_es','cta_en','cta_es','destination_en','destination_es','alt_en','alt_es'] LOOP
  IF jsonb_typeof(v->k) IS DISTINCT FROM 'string' OR length(v->>k)>2000 THEN RAISE EXCEPTION 'localized creative fields required';END IF;
 END LOOP;
 FOREACH k IN ARRAY ARRAY['headline_en','headline_es','cta_en','cta_es'] LOOP IF length(btrim(v->>k)) NOT BETWEEN 1 AND 300 THEN RAISE EXCEPTION 'headline and CTA required';END IF;END LOOP;
 FOREACH k IN ARRAY ARRAY['destination_en','destination_es'] LOOP
  u:=v->>k;
  -- V1 owned destinations only. No open redirect, URL scheme, query redirect, or executable data.
  IF u <> ALL(ARRAY['/en','/es','/en/market-hub','/es/centro-de-mercado','/en/market-intelligence','/es/inteligencia-de-mercado','/en/market-intelligence/packages','/es/inteligencia-de-mercado/paquetes']) THEN RAISE EXCEPTION 'approved internal information destination required';END IF;
 END LOOP;
 FOREACH k IN ARRAY ARRAY['image','video'] LOOP
  IF v ? k AND v->k<>'null'::jsonb THEN
   mid:=(v->>k)::uuid;
   IF NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.campaign_media WHERE id=mid AND completed AND mime=CASE WHEN k='image' THEN 'image/jpeg' ELSE 'video/mp4' END) THEN RAISE EXCEPTION 'completed system media required';END IF;
   IF length(btrim(v->>'alt_en'))=0 OR length(btrim(v->>'alt_es'))=0 THEN RAISE EXCEPTION 'localized media description required';END IF;
  END IF;
 END LOOP;
END $$;
CREATE FUNCTION twuanis_canonical_private.campaign_projection(cid uuid) RETURNS jsonb
LANGUAGE sql STABLE SET search_path=pg_catalog AS $$
 SELECT jsonb_build_object('id',c.id,'targetClass',c.target_class,'targetId',c.target_id,'revision',c.revision::text,
 'state',twuanis_canonical_private.campaign_status(c.state,v.starts_at,v.ends_at,statement_timestamp()),'creativeEvidence',(SELECT payload FROM twuanis_canonical_private.campaign_creative_versions WHERE id=v.creative_version),'configuration',jsonb_build_object('name',v.name,'creativeVersion',v.creative_version,'surfaces',v.surfaces,'audience',v.audience,'startsAt',v.starts_at,'endsAt',v.ends_at,'frequency',v.frequency,'priority',v.priority,'external',v.external))
 FROM twuanis_canonical_private.campaigns c JOIN twuanis_canonical_private.campaign_configurations v ON v.id=c.current_configuration_id WHERE c.id=cid
$$;
CREATE FUNCTION public.admin_campaign_command(p_request uuid,p_command jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid;op text;cid uuid;vid uuid;eid bigint;ver bigint;before_data jsonb;after_data jsonb;v jsonb;x jsonb;c twuanis_canonical_private.campaigns%ROWTYPE;
 cr twuanis_canonical_private.campaign_creatives%ROWTYPE;r twuanis_canonical_private.administrative_receipts%ROWTYPE;ss text[];st timestamptz;et timestamptz;
BEGIN
 actor:=twuanis_canonical_private.assert_administrative_permission('promotions.manage');
 IF p_request IS NULL OR jsonb_typeof(p_command) IS DISTINCT FROM 'object' OR octet_length(p_command::text)>32000 THEN RAISE EXCEPTION 'bounded command required';END IF;
 op:=p_command->>'operation';
 IF op IS NULL OR op NOT IN ('create','configure','schedule','pause','resume','end','archive','creative.create','creative.configure') OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_command)k WHERE k<>ALL(ARRAY['operation','id','expected','reason','targetClass','targetId','configuration','creative'])) THEN RAISE EXCEPTION 'invalid command';END IF;
 PERFORM pg_advisory_xact_lock(3170,hashtext(jsonb_build_array(actor,p_request)::text));
 SELECT * INTO r FROM twuanis_canonical_private.administrative_receipts WHERE actor_id=actor AND request_id=p_request;
 IF FOUND THEN
  IF r.command IS DISTINCT FROM jsonb_build_object('domain','campaign','command',p_command) THEN RAISE EXCEPTION 'request conflict';END IF;
  SELECT after_state INTO after_data FROM twuanis_canonical_private.administrative_events WHERE id=r.event_id;
  RETURN jsonb_build_object('ok',true,'id',after_data->>'id','replayed',true);
 END IF;
 IF length(coalesce(p_command->>'reason',''))>2000 THEN RAISE EXCEPTION 'reason too long';END IF;
 IF op LIKE 'creative.%' THEN
  IF p_command ?| ARRAY['configuration','targetClass','targetId'] THEN RAISE EXCEPTION 'unexpected creative authority';END IF;
  PERFORM twuanis_canonical_private.validate_campaign_creative(p_command->'creative');
  vid:=gen_random_uuid();
  IF op='creative.create' THEN
   IF p_command ?| ARRAY['id','expected'] THEN RAISE EXCEPTION 'server identity required';END IF;
   cid:=gen_random_uuid();ver:=1;
   INSERT INTO twuanis_canonical_private.campaign_creatives VALUES(cid,ver,vid);
  ELSE
   SELECT * INTO STRICT cr FROM twuanis_canonical_private.campaign_creatives WHERE id=(p_command->>'id')::uuid FOR UPDATE;
   IF jsonb_typeof(p_command->'expected') IS DISTINCT FROM 'string' OR p_command->>'expected' IS DISTINCT FROM cr.revision::text THEN RAISE EXCEPTION 'stale' USING ERRCODE='40001';END IF;
   cid:=cr.id;ver:=cr.revision+1;before_data:=to_jsonb(cr);
   UPDATE twuanis_canonical_private.campaign_creatives SET revision=ver,current_version_id=vid WHERE id=cid;
  END IF;
  INSERT INTO twuanis_canonical_private.campaign_creative_versions VALUES(vid,cid,ver,p_command->'creative',clock_timestamp());
  after_data:=jsonb_build_object('id',cid,'versionId',vid,'revision',ver);
 ELSE
  IF p_command ? 'creative' THEN RAISE EXCEPTION 'unexpected creative';END IF;
  IF op='create' THEN
   IF p_command ?| ARRAY['id','expected'] THEN RAISE EXCEPTION 'server identity required';END IF;
   IF NOT coalesce(twuanis_canonical_private.campaign_target_valid(p_command->>'targetClass',p_command->>'targetId',clock_timestamp()),false) THEN RAISE EXCEPTION 'canonical target unavailable';END IF;
   cid:=gen_random_uuid();vid:=gen_random_uuid();ver:=1;
   INSERT INTO twuanis_canonical_private.campaigns(id,target_class,target_id,current_configuration_id) VALUES(cid,p_command->>'targetClass',p_command->>'targetId',vid);
  ELSE
   IF p_command ?| ARRAY['targetClass','targetId'] THEN RAISE EXCEPTION 'target identity immutable';END IF;
   SELECT * INTO STRICT c FROM twuanis_canonical_private.campaigns WHERE id=(p_command->>'id')::uuid FOR UPDATE;
   IF jsonb_typeof(p_command->'expected') IS DISTINCT FROM 'string' OR p_command->>'expected' IS DISTINCT FROM c.revision::text THEN RAISE EXCEPTION 'stale' USING ERRCODE='40001';END IF;
   IF c.state='archived' OR (c.state='ended' AND op<>'archive') THEN RAISE EXCEPTION 'historical campaign';END IF;
   cid:=c.id;vid:=gen_random_uuid();ver:=c.revision+1;before_data:=twuanis_canonical_private.campaign_projection(cid);
  END IF;
  IF op IN ('create','configure') THEN
   v:=p_command->'configuration';
   IF jsonb_typeof(v) IS DISTINCT FROM 'object' OR EXISTS(SELECT 1 FROM jsonb_object_keys(v)k WHERE k<>ALL(ARRAY['name','creativeVersion','surfaces','audience','startsAt','endsAt','frequency','priority','external'])) THEN RAISE EXCEPTION 'invalid configuration';END IF;
   IF jsonb_typeof(v->'name') IS DISTINCT FROM 'string' OR jsonb_typeof(v->'creativeVersion') IS DISTINCT FROM 'string' OR jsonb_typeof(v->'audience') IS DISTINCT FROM 'string' OR jsonb_typeof(v->'frequency') IS DISTINCT FROM 'number' OR jsonb_typeof(v->'priority') IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'typed configuration required';END IF;
   IF jsonb_typeof(v->'surfaces') IS DISTINCT FROM 'array' OR jsonb_array_length(v->'surfaces')>6 THEN RAISE EXCEPTION 'bounded surfaces required';END IF;
   ss:=ARRAY(SELECT jsonb_array_elements_text(v->'surfaces'));
   IF cardinality(ss)<>(SELECT count(DISTINCT z) FROM unnest(ss)z) OR EXISTS(SELECT 1 FROM unnest(ss)z WHERE NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.campaign_surfaces WHERE id=z)) THEN RAISE EXCEPTION 'registered surfaces required';END IF;
   PERFORM 1 FROM twuanis_canonical_private.campaign_creative_versions WHERE id=(v->>'creativeVersion')::uuid;
   IF NOT FOUND THEN RAISE EXCEPTION 'creative version required';END IF;
   IF 'popup'=ANY(ss) AND EXISTS(SELECT 1 FROM twuanis_canonical_private.campaign_creative_versions WHERE id=(v->>'creativeVersion')::uuid AND nullif(payload->>'video','') IS NOT NULL) THEN RAISE EXCEPTION 'popup video unsupported';END IF;
   IF (v->>'startsAt') IS NULL OR (v->>'startsAt') !~ '(Z|[+-][0-9]{2}:[0-9]{2})$' OR (v->>'endsAt') IS NULL OR (v->>'endsAt') !~ '(Z|[+-][0-9]{2}:[0-9]{2})$' THEN RAISE EXCEPTION 'timezone required';END IF;
   st:=(v->>'startsAt')::timestamptz;et:=(v->>'endsAt')::timestamptz;
   IF jsonb_typeof(v->'external') IS DISTINCT FROM 'array' OR jsonb_array_length(v->'external')>3 THEN RAISE EXCEPTION 'bounded external relationships required';END IF;
   FOR x IN SELECT value FROM jsonb_array_elements(v->'external') LOOP
    IF jsonb_typeof(x) IS DISTINCT FROM 'object' OR EXISTS(SELECT 1 FROM jsonb_object_keys(x)k WHERE k<>ALL(ARRAY['channel','externalId','audience','status','reference','impressions','clicks','provenance','observedAt','adId','adSetId','plannedStart','plannedEnd','actualStart','actualEnd'])) OR NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.campaign_channels WHERE id=x->>'channel') OR x->>'provenance' IS NULL OR x->>'provenance' NOT IN ('manual','imported','reference') OR length(x::text)>2000 THEN RAISE EXCEPTION 'invalid external evidence';END IF;
    IF EXISTS(SELECT 1 FROM jsonb_each(x) e WHERE e.key<>ALL(ARRAY['impressions','clicks']) AND jsonb_typeof(e.value)<>'string') THEN RAISE EXCEPTION 'external strings required';END IF;
    IF EXISTS(SELECT 1 FROM jsonb_each_text(x) e WHERE e.key=ANY(ARRAY['plannedStart','plannedEnd','actualStart','actualEnd','observedAt']) AND e.value !~ '(Z|[+-][0-9]{2}:[0-9]{2})$') THEN RAISE EXCEPTION 'external timezone required';END IF;
    IF (x ? 'impressions') IS DISTINCT FROM (x ? 'clicks') THEN RAISE EXCEPTION 'paired external counts required';END IF;
    IF x ? 'impressions' AND ((x->>'observedAt') IS NULL OR (x->>'impressions') !~ '^[0-9]{1,12}$' OR (x->>'clicks') !~ '^[0-9]{1,12}$' OR (x->>'clicks')::bigint>(x->>'impressions')::bigint OR (x->>'observedAt') !~ '(Z|[+-][0-9]{2}:[0-9]{2})$') THEN RAISE EXCEPTION 'invalid external counts/provenance';END IF;
   END LOOP;
   IF cardinality(ss)=0 AND jsonb_array_length(v->'external')=0 THEN RAISE EXCEPTION 'placement or channel required';END IF;
   INSERT INTO twuanis_canonical_private.campaign_configurations VALUES(vid,cid,ver,v->>'name',(v->>'creativeVersion')::uuid,ss,v->>'audience',st,et,(v->>'frequency')::integer,(v->>'priority')::integer,v->'external',clock_timestamp());
   UPDATE twuanis_canonical_private.campaigns SET current_configuration_id=vid WHERE id=cid;
  ELSE
   IF p_command ? 'configuration' THEN RAISE EXCEPTION 'lifecycle cannot replace configuration';END IF;
   SELECT starts_at,ends_at INTO st,et FROM twuanis_canonical_private.campaign_configurations WHERE id=c.current_configuration_id;
   IF op IN ('schedule','resume') THEN
    IF (op='schedule' AND c.state<>'draft') OR (op='resume' AND c.state<>'paused') OR et<=clock_timestamp() OR NOT twuanis_canonical_private.campaign_target_valid(c.target_class,c.target_id,clock_timestamp()) THEN RAISE EXCEPTION 'not schedulable';END IF;
    UPDATE twuanis_canonical_private.campaigns SET state='eligible' WHERE id=cid;
   ELSIF op='pause' THEN
    IF c.state<>'eligible' OR et<=clock_timestamp() THEN RAISE EXCEPTION 'not pausable';END IF;
    UPDATE twuanis_canonical_private.campaigns SET state='paused' WHERE id=cid;
   ELSIF op='end' THEN UPDATE twuanis_canonical_private.campaigns SET state='ended' WHERE id=cid;
   ELSE
    IF nullif(btrim(p_command->>'reason'),'') IS NULL THEN RAISE EXCEPTION 'archive reason required';END IF;
    UPDATE twuanis_canonical_private.campaigns SET state='archived' WHERE id=cid;
   END IF;
  END IF;
  IF op<>'create' THEN UPDATE twuanis_canonical_private.campaigns SET revision=ver WHERE id=cid;END IF;
  after_data:=twuanis_canonical_private.campaign_projection(cid);
 END IF;
 eid:=twuanis_canonical_private.append_administrative_event(actor,CASE WHEN public.is_current_user_owner() THEN 'Owner' ELSE 'Administrator' END,'promotions.manage','campaign.'||op,'campaign',cid,before_data,after_data,p_command->>'reason',p_request);
 INSERT INTO twuanis_canonical_private.administrative_receipts VALUES(actor,p_request,jsonb_build_object('domain','campaign','command',p_command),eid);
 RETURN jsonb_build_object('ok',true,'id',cid,'replayed',false);
END $$;
CREATE FUNCTION public.admin_campaign_read(p_after uuid DEFAULT NULL,p_state text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ DECLARE v jsonb; BEGIN
 PERFORM twuanis_canonical_private.assert_administrative_permission('promotions.read');
 IF p_state IS NOT NULL AND p_state NOT IN ('draft','active','scheduled','paused','ended','archived') THEN RAISE EXCEPTION 'invalid state';END IF;
 SELECT coalesce(jsonb_agg(twuanis_canonical_private.campaign_projection(q.id) ORDER BY q.id),'[]') INTO v FROM (SELECT c.id FROM twuanis_canonical_private.campaigns c JOIN twuanis_canonical_private.campaign_configurations v ON v.id=c.current_configuration_id WHERE (p_after IS NULL OR c.id>p_after) AND (p_state IS NULL OR twuanis_canonical_private.campaign_status(c.state,v.starts_at,v.ends_at,statement_timestamp())=p_state) ORDER BY c.id LIMIT 26)q;
 RETURN v;
END $$;
CREATE FUNCTION public.admin_campaign_options(p_kind text,p_after text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ DECLARE v jsonb;BEGIN
 PERFORM twuanis_canonical_private.assert_administrative_permission('promotions.read');
 IF length(p_after)>150 THEN RAISE EXCEPTION 'invalid cursor';END IF;
 IF p_kind='FEATURE' THEN RETURN '[]';
 ELSIF p_kind='TWUANIS' THEN RETURN '[{"id":"twuanis","name":"Twuanis"}]';
 ELSIF p_kind='ENGINE' THEN SELECT jsonb_agg(jsonb_build_object('id',id,'name',name_en,'name_es',name_es) ORDER BY id) INTO v FROM twuanis_canonical_private.intelligence_capabilities;
 ELSIF p_kind='PACKAGE' THEN SELECT jsonb_agg(to_jsonb(q)) INTO v FROM (SELECT id,name_en AS name,name_es FROM twuanis_canonical_private.intelligence_packages WHERE state='active' AND (p_after IS NULL OR id>p_after) ORDER BY id LIMIT 26)q;
 ELSIF p_kind='ADD_ON' THEN SELECT jsonb_agg(to_jsonb(q)) INTO v FROM (SELECT id,name_en AS name,name_es FROM twuanis_canonical_private.addon_products WHERE state='active' AND term_kind<>'unconfigured' AND (p_after IS NULL OR id>p_after) ORDER BY id LIMIT 26)q;
 ELSIF p_kind='OFFER' THEN SELECT jsonb_agg(to_jsonb(q)) INTO v FROM (SELECT o.id,c.name_en AS name,c.name_es FROM twuanis_canonical_private.offers o JOIN twuanis_canonical_private.offer_configurations c ON c.id=o.current_configuration_id WHERE o.state NOT IN ('ended','archived') AND (p_after IS NULL OR o.id::text>p_after) ORDER BY o.id LIMIT 26)q;
 ELSIF p_kind='CREATIVE' THEN SELECT jsonb_agg(to_jsonb(q)) INTO v FROM (SELECT c.id,c.revision::text,c.current_version_id AS "versionId",v.payload FROM twuanis_canonical_private.campaign_creatives c JOIN twuanis_canonical_private.campaign_creative_versions v ON v.id=c.current_version_id WHERE p_after IS NULL OR c.id::text>p_after ORDER BY c.id LIMIT 26)q;
 ELSE RAISE EXCEPTION 'unknown target class';END IF;
 RETURN coalesce(v,'[]');
END $$;
-- RLS with no API table policies; exact public RPC boundaries only.
DO $$ DECLARE t text;f regprocedure; BEGIN
 FOREACH t IN ARRAY ARRAY['campaigns','campaign_creatives','campaign_creative_versions','campaign_surfaces','campaign_channels','campaign_configurations','campaign_media'] LOOP
  EXECUTE format('ALTER TABLE twuanis_canonical_private.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE twuanis_canonical_private.%I OWNER TO postgres',t);
  EXECUTE format('REVOKE ALL ON twuanis_canonical_private.%I FROM PUBLIC,anon,authenticated,service_role',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['campaign_creative_versions','campaign_configurations','campaign_surfaces','campaign_channels'] LOOP
  EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE OR DELETE OR TRUNCATE ON twuanis_canonical_private.%I FOR EACH STATEMENT EXECUTE FUNCTION twuanis_canonical_private.administrative_immutable()',t||'_immutable',t);
 END LOOP;
 FOR f IN SELECT p.oid::regprocedure FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE (n.nspname='twuanis_canonical_private' AND p.proname IN ('guard_campaign_identity','campaign_target_valid','campaign_status','validate_campaign_creative','campaign_projection')) OR (n.nspname='public' AND p.proname IN ('admin_campaign_command','admin_campaign_read','admin_campaign_options')) LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',f);
  EXECUTE format('ALTER FUNCTION %s OWNER TO postgres',f);
 END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_campaign_command(uuid,jsonb),public.admin_campaign_read(uuid,text),public.admin_campaign_options(text,text) TO authenticated;
COMMIT;
