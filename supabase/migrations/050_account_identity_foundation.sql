-- Phase A: dormant account identity foundation. No Storage, messaging, trials or commerce.
BEGIN;
-- Existing private schema and Auth are installation prerequisites. No replacement authority.
CREATE TABLE twuanis_canonical_private.account_profiles (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
 display_name text CHECK(char_length(display_name)<=120), biography text CHECK(char_length(biography)<=2000),
 language text CHECK(language IN ('en','es')), active_image_id uuid,
 revision bigint NOT NULL DEFAULT 0 CHECK(revision>=0),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE twuanis_canonical_private.account_phone_state (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
 phone_e164 text CHECK(phone_e164 ~ '^\+[1-9][0-9]{1,14}$'),
 revision bigint NOT NULL DEFAULT 0 CHECK(revision>=0),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE twuanis_canonical_private.account_profile_images (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
 object_version uuid NOT NULL DEFAULT gen_random_uuid(),
 object_path text GENERATED ALWAYS AS (user_id::text || '/' || id::text || '/' || object_version::text || '.webp') STORED,
 state text NOT NULL DEFAULT 'STAGED' CHECK(state IN ('STAGED','READY','RETIRED','DELETED')),
 mime text CHECK(mime='image/webp'), width integer CHECK(width BETWEEN 1 AND 1024), height integer CHECK(height BETWEEN 1 AND 1024),
 byte_size bigint CHECK(byte_size BETWEEN 1 AND 5242880), validated_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), retired_at timestamptz,
 CHECK(state='STAGED' OR (mime IS NOT NULL AND width IS NOT NULL AND height IS NOT NULL AND byte_size IS NOT NULL AND validated_at IS NOT NULL) OR state='DELETED'),
 CHECK((state IN ('RETIRED','DELETED'))=(retired_at IS NOT NULL)),
 UNIQUE(id,user_id), UNIQUE(object_path)
);
ALTER TABLE twuanis_canonical_private.account_profiles ADD CONSTRAINT account_profile_owned_image
 FOREIGN KEY(active_image_id,user_id) REFERENCES twuanis_canonical_private.account_profile_images(id,user_id) ON DELETE RESTRICT;
CREATE TABLE twuanis_canonical_private.account_request_receipts (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT, request_id uuid NOT NULL,
 operation text NOT NULL CHECK(operation IN ('PROFILE_UPDATE','PHONE_CHANGE')),
 input jsonb NOT NULL, result jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(), PRIMARY KEY(user_id,request_id)
);
CREATE TABLE twuanis_canonical_private.account_security_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
 kind text NOT NULL CHECK(kind IN ('PROFILE_UPDATED','PHONE_CHANGED','IMAGE_ACTIVATED','IMAGE_REMOVED')),
 request_id uuid, object_id uuid, revision bigint NOT NULL CHECK(revision>=0), created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
-- Explicit guards complement ACLs; no client-controlled verification or upload finalizer exists.
CREATE FUNCTION twuanis_canonical_private.account_immutable() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN RAISE EXCEPTION 'immutable account evidence' USING ERRCODE='23514'; END $$;
CREATE TRIGGER immutable_account_receipt BEFORE UPDATE OR DELETE ON twuanis_canonical_private.account_request_receipts FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.account_immutable();
CREATE TRIGGER immutable_account_event BEFORE UPDATE OR DELETE ON twuanis_canonical_private.account_security_events FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.account_immutable();
CREATE FUNCTION twuanis_canonical_private.account_evidence_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF TG_TABLE_NAME='account_profiles' AND NEW.active_image_id IS NOT NULL THEN
  PERFORM 1 FROM twuanis_canonical_private.account_profile_images i WHERE i.id=NEW.active_image_id AND i.user_id=NEW.user_id AND i.state='READY' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'profile image must be owned and ready' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER profile_ready_image BEFORE INSERT OR UPDATE ON twuanis_canonical_private.account_profiles FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.account_evidence_guard();
CREATE FUNCTION twuanis_canonical_private.account_image_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'retire image metadata; do not delete history' USING ERRCODE='23514'; END IF;
 IF (NEW.id,NEW.user_id,NEW.object_version,NEW.created_at) IS DISTINCT FROM (OLD.id,OLD.user_id,OLD.object_version,OLD.created_at) THEN RAISE EXCEPTION 'immutable image identity' USING ERRCODE='23514'; END IF;
 IF OLD.state<>'STAGED' AND (NEW.mime,NEW.width,NEW.height,NEW.byte_size,NEW.validated_at) IS DISTINCT FROM (OLD.mime,OLD.width,OLD.height,OLD.byte_size,OLD.validated_at) THEN RAISE EXCEPTION 'immutable validated image metadata' USING ERRCODE='23514'; END IF;
 IF NEW.state<>OLD.state AND NOT ((OLD.state='STAGED' AND NEW.state IN ('READY','DELETED')) OR (OLD.state='READY' AND NEW.state='RETIRED') OR (OLD.state='RETIRED' AND NEW.state='DELETED')) THEN RAISE EXCEPTION 'invalid image lifecycle' USING ERRCODE='23514'; END IF;
 IF NEW.state<>'READY' AND EXISTS(SELECT 1 FROM twuanis_canonical_private.account_profiles p WHERE p.active_image_id=OLD.id) THEN RAISE EXCEPTION 'clear active reference before retirement' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER image_lifecycle BEFORE UPDATE OR DELETE ON twuanis_canonical_private.account_profile_images FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.account_image_guard();
CREATE FUNCTION twuanis_canonical_private.account_phone_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF NEW.user_id<>OLD.user_id THEN RAISE EXCEPTION 'immutable phone owner'; END IF;
 IF NEW.phone_e164 IS DISTINCT FROM OLD.phone_e164 THEN
  NEW.revision:=OLD.revision+1; NEW.updated_at:=clock_timestamp();
 ELSIF NEW.revision<>OLD.revision THEN RAISE EXCEPTION 'phone revision changes only with phone' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER canonical_phone_change BEFORE UPDATE ON twuanis_canonical_private.account_phone_state FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.account_phone_guard();
CREATE FUNCTION twuanis_canonical_private.account_actor() RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE u uuid:=auth.uid(); BEGIN
 IF u IS NULL OR auth.jwt()->>'role' IS DISTINCT FROM 'authenticated' THEN RAISE EXCEPTION 'authentication required' USING ERRCODE='42501'; END IF;
 RETURN u;
END $$;
CREATE FUNCTION public.read_account_profile() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE u uuid:=twuanis_canonical_private.account_actor(); p twuanis_canonical_private.account_profiles; s twuanis_canonical_private.account_phone_state;
BEGIN
 INSERT INTO twuanis_canonical_private.account_profiles(user_id) VALUES(u) ON CONFLICT DO NOTHING;
 INSERT INTO twuanis_canonical_private.account_phone_state(user_id) VALUES(u) ON CONFLICT DO NOTHING;
 SELECT * INTO p FROM twuanis_canonical_private.account_profiles WHERE user_id=u;
 SELECT * INTO s FROM twuanis_canonical_private.account_phone_state WHERE user_id=u;
 RETURN jsonb_build_object('userId',u,'name',p.display_name,'biography',p.biography,'language',p.language,'revision',p.revision,'imageId',p.active_image_id,'phone',s.phone_e164,'phoneRevision',s.revision);
END $$;
CREATE FUNCTION public.update_account_profile(p_request uuid,p_expected_revision bigint,p_patch jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE u uuid:=twuanis_canonical_private.account_actor(); p twuanis_canonical_private.account_profiles; receipt twuanis_canonical_private.account_request_receipts; payload jsonb; result jsonb;
BEGIN
 IF p_request IS NULL OR p_expected_revision IS NULL OR p_expected_revision<0 OR p_patch IS NULL OR jsonb_typeof(p_patch)<>'object' OR p_patch='{}'::jsonb THEN RAISE EXCEPTION 'invalid profile command' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_each(p_patch) e WHERE e.key NOT IN ('name','biography','language') OR jsonb_typeof(e.value) NOT IN ('string','null')) THEN RAISE EXCEPTION 'unsupported profile fields' USING ERRCODE='22023'; END IF;
 PERFORM public.read_account_profile();
 SELECT * INTO p FROM twuanis_canonical_private.account_profiles WHERE user_id=u FOR UPDATE;
 payload:=jsonb_build_object('expectedRevision',p_expected_revision,'patch',p_patch);
 SELECT * INTO receipt FROM twuanis_canonical_private.account_request_receipts WHERE user_id=u AND request_id=p_request;
 IF FOUND THEN
  IF receipt.operation<>'PROFILE_UPDATE' OR receipt.input<>payload THEN RAISE EXCEPTION 'request identity conflict' USING ERRCODE='22023'; END IF;
  RETURN receipt.result;
 END IF;
 IF p.revision<>p_expected_revision THEN RAISE EXCEPTION 'profile revision conflict' USING ERRCODE='40001'; END IF;
 UPDATE twuanis_canonical_private.account_profiles SET display_name=CASE WHEN p_patch?'name' THEN p_patch->>'name' ELSE display_name END, biography=CASE WHEN p_patch?'biography' THEN p_patch->>'biography' ELSE biography END, language=CASE WHEN p_patch?'language' THEN p_patch->>'language' ELSE language END, revision=revision+1,updated_at=clock_timestamp() WHERE user_id=u RETURNING * INTO p;
 result:=jsonb_build_object('name',p.display_name,'biography',p.biography,'language',p.language,'revision',p.revision);
 INSERT INTO twuanis_canonical_private.account_request_receipts(user_id,request_id,operation,input,result) VALUES(u,p_request,'PROFILE_UPDATE',payload,result);
 INSERT INTO twuanis_canonical_private.account_security_events(user_id,kind,request_id,revision) VALUES(u,'PROFILE_UPDATED',p_request,p.revision);
 RETURN result;
END $$;
-- Dormant trusted boundary, deliberately NOT granted to any API role. Later normalized
-- phone workflow must derive user from authentication before invoking this own-account RPC.
CREATE FUNCTION twuanis_canonical_private.change_account_phone(p_request uuid,p_expected_revision bigint,p_phone text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE u uuid:=twuanis_canonical_private.account_actor(); s twuanis_canonical_private.account_phone_state; receipt twuanis_canonical_private.account_request_receipts; payload jsonb; result jsonb;
BEGIN
 IF p_request IS NULL OR p_expected_revision IS NULL OR p_expected_revision<0 OR (p_phone IS NOT NULL AND p_phone !~ '^\+[1-9][0-9]{1,14}$') THEN RAISE EXCEPTION 'invalid canonical phone command' USING ERRCODE='22023'; END IF;
 PERFORM public.read_account_profile();
 -- Same lock order as profile updates, so the shared receipt namespace is atomic.
 PERFORM 1 FROM twuanis_canonical_private.account_profiles WHERE user_id=u FOR UPDATE;
 SELECT * INTO s FROM twuanis_canonical_private.account_phone_state WHERE user_id=u FOR UPDATE;
 payload:=jsonb_build_object('expectedRevision',p_expected_revision,'phone',p_phone);
 SELECT * INTO receipt FROM twuanis_canonical_private.account_request_receipts WHERE user_id=u AND request_id=p_request;
 IF FOUND THEN
  IF receipt.operation<>'PHONE_CHANGE' OR receipt.input<>payload THEN RAISE EXCEPTION 'request identity conflict' USING ERRCODE='22023'; END IF;
  RETURN receipt.result;
 END IF;
 IF s.revision<>p_expected_revision THEN RAISE EXCEPTION 'phone revision conflict' USING ERRCODE='40001'; END IF;
 IF s.phone_e164 IS DISTINCT FROM p_phone THEN
  UPDATE twuanis_canonical_private.account_phone_state SET phone_e164=p_phone WHERE user_id=u RETURNING * INTO s;
  INSERT INTO twuanis_canonical_private.account_security_events(user_id,kind,request_id,revision) VALUES(u,'PHONE_CHANGED',p_request,s.revision);
 END IF;
 result:=jsonb_build_object('phone',s.phone_e164,'revision',s.revision);
 INSERT INTO twuanis_canonical_private.account_request_receipts(user_id,request_id,operation,input,result) VALUES(u,p_request,'PHONE_CHANGE',payload,result);
 RETURN result;
END $$;
-- Explicit owner/ACL/RLS on this migration's objects only. Existing defaults cannot leak evidence.
DO $$ DECLARE t text; f regprocedure; BEGIN
 FOREACH t IN ARRAY ARRAY['account_profiles','account_phone_state','account_profile_images','account_request_receipts','account_security_events'] LOOP
  EXECUTE format('ALTER TABLE twuanis_canonical_private.%I OWNER TO postgres',t);
  EXECUTE format('ALTER TABLE twuanis_canonical_private.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON TABLE twuanis_canonical_private.%I FROM PUBLIC,anon,authenticated,service_role',t);
 END LOOP;
 FOR f IN SELECT p.oid::regprocedure FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE (n.nspname='twuanis_canonical_private' AND p.proname IN ('account_immutable','account_evidence_guard','account_image_guard','account_phone_guard','account_actor','change_account_phone')) OR (n.nspname='public' AND p.proname IN ('read_account_profile','update_account_profile')) LOOP
  EXECUTE format('ALTER FUNCTION %s OWNER TO postgres',f);
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',f);
 END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION public.read_account_profile(),public.update_account_profile(uuid,bigint,jsonb) TO authenticated;
COMMIT;
