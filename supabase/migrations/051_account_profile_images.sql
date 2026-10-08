-- Phase C; additive to 050. No phone, Auth, trial or commercial changes.
BEGIN;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 VALUES('profile-images','profile-images',false,5242880,ARRAY['image/webp']);
DO $$ BEGIN IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='storage.objects'::regclass) THEN RAISE EXCEPTION 'Storage RLS prerequisite missing'; END IF; END $$;
-- Hosted installer uses the existing supported supautils.policy_grants authority,
-- verified before activation. Never alter ownership or grants on managed Storage.
CREATE POLICY profile_images_no_customer_api ON storage.objects AS RESTRICTIVE FOR ALL TO anon,authenticated
 USING(bucket_id<>'profile-images') WITH CHECK(bucket_id<>'profile-images');
ALTER TABLE twuanis_canonical_private.account_request_receipts DROP CONSTRAINT account_request_receipts_operation_check;
ALTER TABLE twuanis_canonical_private.account_request_receipts ADD CONSTRAINT account_request_receipts_operation_check
 CHECK(operation IN ('PROFILE_UPDATE','PHONE_CHANGE','IMAGE_UPLOAD','IMAGE_REMOVE'));
ALTER TABLE twuanis_canonical_private.account_profile_images ADD COLUMN cleanup_completed_at timestamptz;
CREATE TABLE twuanis_canonical_private.account_image_operations(
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT, request_id uuid NOT NULL,
 asset_id uuid NOT NULL UNIQUE REFERENCES twuanis_canonical_private.account_profile_images(id) ON DELETE RESTRICT,
 expected_revision bigint NOT NULL CHECK(expected_revision>=0), content_sha256 text NOT NULL CHECK(content_sha256 ~ '^[a-f0-9]{64}$'),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), expires_at timestamptz NOT NULL DEFAULT (clock_timestamp()+interval '15 minutes'),
 PRIMARY KEY(user_id,request_id), CHECK(expires_at>created_at)
);
ALTER TABLE twuanis_canonical_private.account_image_operations OWNER TO postgres;
ALTER TABLE twuanis_canonical_private.account_image_operations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON twuanis_canonical_private.account_image_operations FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER immutable_image_operation BEFORE UPDATE OR DELETE ON twuanis_canonical_private.account_image_operations FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.account_immutable();
CREATE INDEX account_image_cleanup ON twuanis_canonical_private.account_profile_images(created_at,id) WHERE state IN ('STAGED','RETIRED','DELETED') AND cleanup_completed_at IS NULL;
CREATE FUNCTION public.read_account_profile_image() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE u uuid:=twuanis_canonical_private.account_actor(); result jsonb;
BEGIN
 PERFORM public.read_account_profile();
 SELECT jsonb_build_object('revision',p.revision,'assetId',i.id,'hasImage',i.id IS NOT NULL) INTO result
 FROM twuanis_canonical_private.account_profiles p LEFT JOIN twuanis_canonical_private.account_profile_images i ON i.id=p.active_image_id AND i.user_id=p.user_id AND i.state='READY' AND i.validated_at IS NOT NULL WHERE p.user_id=u;
 RETURN result;
END $$;
-- Only the trusted server may invoke this dispatcher. p_user is always obtained by
-- server auth.getUser(), never copied from request input. No arbitrary SQL/path/URL.
CREATE FUNCTION public.account_profile_image_service(p_user uuid,p_request uuid,p_operation text,p_expected_revision bigint DEFAULT NULL,p_evidence jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE p twuanis_canonical_private.account_profiles; a twuanis_canonical_private.account_profile_images;
 op twuanis_canonical_private.account_image_operations; receipt twuanis_canonical_private.account_request_receipts;
 result jsonb; old_image uuid; candidate record; batch jsonb:='[]'::jsonb;
BEGIN
 IF auth.jwt()->>'role' IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'trusted image service required' USING ERRCODE='42501'; END IF;
 IF p_operation='cleanup' THEN
  -- Lock profile before asset, just like finalization/removal. No bucket scan.
  FOR candidate IN SELECT i.id,i.user_id FROM twuanis_canonical_private.account_profile_images i
   WHERE i.cleanup_completed_at IS NULL AND (i.state IN ('RETIRED','DELETED') OR (i.state='STAGED' AND i.created_at<clock_timestamp()-interval '1 hour')) ORDER BY i.created_at,i.id LIMIT 20 LOOP
   PERFORM 1 FROM twuanis_canonical_private.account_profiles WHERE user_id=candidate.user_id FOR UPDATE;
   SELECT * INTO a FROM twuanis_canonical_private.account_profile_images WHERE id=candidate.id FOR UPDATE;
   IF a.cleanup_completed_at IS NULL AND a.state<>'READY' AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.account_profiles WHERE active_image_id=a.id) THEN
    IF a.state<>'DELETED' THEN UPDATE twuanis_canonical_private.account_profile_images SET state='DELETED',retired_at=coalesce(retired_at,clock_timestamp()) WHERE id=a.id; END IF;
    batch:=batch||jsonb_build_array(jsonb_build_object('assetId',a.id,'path',a.object_path));
   END IF;
  END LOOP; RETURN batch;
 ELSIF p_operation='cleanup_done' THEN
  UPDATE twuanis_canonical_private.account_profile_images SET cleanup_completed_at=clock_timestamp() WHERE id=p_request AND state='DELETED' AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.account_profiles WHERE active_image_id=p_request);
  RETURN jsonb_build_object('ok',FOUND);
 END IF;
 IF p_user IS NULL OR p_operation IS NULL OR p_operation NOT IN ('read','reserve','finalize','remove') THEN RAISE EXCEPTION 'invalid image operation' USING ERRCODE='22023'; END IF;
 INSERT INTO twuanis_canonical_private.account_profiles(user_id) VALUES(p_user) ON CONFLICT DO NOTHING;
 SELECT * INTO p FROM twuanis_canonical_private.account_profiles WHERE user_id=p_user FOR UPDATE;
 IF p_operation='read' THEN
  SELECT * INTO a FROM twuanis_canonical_private.account_profile_images WHERE id=p.active_image_id AND user_id=p_user AND state='READY' AND validated_at IS NOT NULL;
  RETURN jsonb_build_object('revision',p.revision,'assetId',a.id,'path',a.object_path,'hasImage',a.id IS NOT NULL);
 END IF;
 IF p_request IS NULL OR p_expected_revision IS NULL OR p_expected_revision<0 OR jsonb_typeof(p_evidence) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'invalid image command' USING ERRCODE='22023'; END IF;
 SELECT * INTO receipt FROM twuanis_canonical_private.account_request_receipts WHERE user_id=p_user AND request_id=p_request;
 IF FOUND THEN
  IF receipt.operation<>(CASE WHEN p_operation='remove' THEN 'IMAGE_REMOVE' ELSE 'IMAGE_UPLOAD' END) OR (receipt.input->>'revision')::bigint<>p_expected_revision OR (p_operation<>'remove' AND receipt.input->>'sha256' IS DISTINCT FROM p_evidence->>'sha256') THEN RAISE EXCEPTION 'request conflict' USING ERRCODE='22023'; END IF;
  RETURN receipt.result||jsonb_build_object('complete',true);
 END IF;
 IF p_operation='reserve' THEN
  IF EXISTS(SELECT 1 FROM jsonb_object_keys(p_evidence) k WHERE k<>'sha256') OR (p_evidence->>'sha256') IS NULL OR (p_evidence->>'sha256') !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'invalid digest'; END IF;
  SELECT * INTO op FROM twuanis_canonical_private.account_image_operations WHERE user_id=p_user AND request_id=p_request;
  IF FOUND THEN
   IF op.content_sha256<>p_evidence->>'sha256' OR op.expected_revision<>p_expected_revision THEN RAISE EXCEPTION 'request conflict' USING ERRCODE='22023'; END IF;
   SELECT * INTO a FROM twuanis_canonical_private.account_profile_images WHERE id=op.asset_id;
   IF a.state<>'STAGED' OR op.expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'upload expired' USING ERRCODE='40001'; END IF;
  ELSE
   IF p.revision<>p_expected_revision THEN RAISE EXCEPTION 'profile revision conflict' USING ERRCODE='40001'; END IF;
   IF (SELECT count(*) FROM twuanis_canonical_private.account_image_operations WHERE user_id=p_user AND created_at>clock_timestamp()-interval '1 hour')>=10 THEN RAISE EXCEPTION 'upload rate limit' USING ERRCODE='54000'; END IF;
   INSERT INTO twuanis_canonical_private.account_profile_images(user_id) VALUES(p_user) RETURNING * INTO a;
   INSERT INTO twuanis_canonical_private.account_image_operations(user_id,request_id,asset_id,expected_revision,content_sha256) VALUES(p_user,p_request,a.id,p_expected_revision,p_evidence->>'sha256');
  END IF;
  RETURN jsonb_build_object('assetId',a.id,'path',a.object_path,'complete',false);
 END IF;
 IF p.revision<>p_expected_revision THEN RAISE EXCEPTION 'profile revision conflict' USING ERRCODE='40001'; END IF;
 old_image:=p.active_image_id;
 IF p_operation='finalize' THEN
  IF EXISTS(SELECT 1 FROM jsonb_object_keys(p_evidence) k WHERE k NOT IN ('sha256','width','height','bytes')) THEN RAISE EXCEPTION 'invalid validated metadata'; END IF;
  SELECT * INTO op FROM twuanis_canonical_private.account_image_operations WHERE user_id=p_user AND request_id=p_request;
  IF NOT FOUND OR op.expires_at<=clock_timestamp() OR op.expected_revision<>p_expected_revision OR op.content_sha256 IS DISTINCT FROM p_evidence->>'sha256' THEN RAISE EXCEPTION 'invalid upload reservation' USING ERRCODE='40001'; END IF;
  SELECT * INTO a FROM twuanis_canonical_private.account_profile_images WHERE id=op.asset_id AND user_id=p_user FOR UPDATE;
  IF a.state<>'STAGED' THEN RAISE EXCEPTION 'asset not staged' USING ERRCODE='40001'; END IF;
  UPDATE twuanis_canonical_private.account_profile_images SET state='READY',mime='image/webp',width=(p_evidence->>'width')::integer,height=(p_evidence->>'height')::integer,byte_size=(p_evidence->>'bytes')::bigint,validated_at=clock_timestamp() WHERE id=a.id;
  UPDATE twuanis_canonical_private.account_profiles SET active_image_id=a.id,revision=revision+1,updated_at=clock_timestamp() WHERE user_id=p_user RETURNING * INTO p;
 ELSE
  IF p_evidence<>'{}'::jsonb THEN RAISE EXCEPTION 'remove does not accept asset identity'; END IF;
  UPDATE twuanis_canonical_private.account_profiles SET active_image_id=NULL,revision=revision+1,updated_at=clock_timestamp() WHERE user_id=p_user RETURNING * INTO p;
 END IF;
 IF old_image IS NOT NULL THEN UPDATE twuanis_canonical_private.account_profile_images SET state='RETIRED',retired_at=clock_timestamp() WHERE id=old_image AND user_id=p_user; END IF;
 result:=jsonb_build_object('revision',p.revision,'assetId',p.active_image_id,'hasImage',p.active_image_id IS NOT NULL);
 INSERT INTO twuanis_canonical_private.account_request_receipts(user_id,request_id,operation,input,result) VALUES(p_user,p_request,CASE WHEN p_operation='remove' THEN 'IMAGE_REMOVE' ELSE 'IMAGE_UPLOAD' END,jsonb_build_object('revision',p_expected_revision,'sha256',p_evidence->>'sha256'),result);
 INSERT INTO twuanis_canonical_private.account_security_events(user_id,kind,request_id,object_id,revision) VALUES(p_user,CASE WHEN p_operation='remove' THEN 'IMAGE_REMOVED' ELSE 'IMAGE_ACTIVATED' END,p_request,CASE WHEN p_operation='remove' THEN old_image ELSE a.id END,p.revision);
 RETURN result||jsonb_build_object('complete',true);
END $$;
ALTER FUNCTION public.read_account_profile_image() OWNER TO postgres;
ALTER FUNCTION public.account_profile_image_service(uuid,uuid,text,bigint,jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.read_account_profile_image(),public.account_profile_image_service(uuid,uuid,text,bigint,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.read_account_profile_image() TO authenticated;
GRANT EXECUTE ON FUNCTION public.account_profile_image_service(uuid,uuid,text,bigint,jsonb) TO service_role;
COMMIT;
