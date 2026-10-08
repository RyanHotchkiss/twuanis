-- Revised uninstalled 052: optional phone storage only. No challenge or messaging authority.
BEGIN;
CREATE FUNCTION public.account_phone_service(p_user uuid,p_request uuid,p_operation text,p_revision bigint DEFAULT NULL,p_data jsonb DEFAULT '{}'::jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE s twuanis_canonical_private.account_phone_state; receipt twuanis_canonical_private.account_request_receipts; input jsonb; result jsonb;
BEGIN
 IF auth.jwt()->>'role' IS DISTINCT FROM 'service_role' OR p_user IS NULL THEN RAISE EXCEPTION 'trusted account phone service required' USING ERRCODE='42501'; END IF;
 IF p_operation IS NULL OR p_operation NOT IN ('read','change') OR jsonb_typeof(p_data) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'invalid command' USING ERRCODE='22023'; END IF;
 INSERT INTO twuanis_canonical_private.account_profiles(user_id) VALUES(p_user) ON CONFLICT DO NOTHING;
 INSERT INTO twuanis_canonical_private.account_phone_state(user_id) VALUES(p_user) ON CONFLICT DO NOTHING;
 PERFORM 1 FROM twuanis_canonical_private.account_profiles WHERE user_id=p_user FOR UPDATE;
 SELECT * INTO s FROM twuanis_canonical_private.account_phone_state WHERE user_id=p_user FOR UPDATE;
 IF p_operation='read' THEN RETURN jsonb_build_object('phone',s.phone_e164,'revision',s.revision); END IF;
 IF p_request IS NULL OR p_revision IS NULL OR p_revision<0 OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_data) k WHERE k<>'phone') OR NOT(p_data?'phone') OR jsonb_typeof(p_data->'phone') NOT IN ('string','null') OR ((p_data->>'phone') IS NOT NULL AND (p_data->>'phone') !~ '^\+[1-9][0-9]{1,14}$') THEN RAISE EXCEPTION 'invalid phone' USING ERRCODE='22023'; END IF;
 input:=jsonb_build_object('expectedRevision',p_revision,'phone',p_data->>'phone');
 SELECT * INTO receipt FROM twuanis_canonical_private.account_request_receipts WHERE user_id=p_user AND request_id=p_request;
 IF FOUND THEN IF receipt.operation<>'PHONE_CHANGE' OR receipt.input<>input THEN RAISE EXCEPTION 'request conflict' USING ERRCODE='22023'; END IF;RETURN receipt.result;END IF;
 IF s.revision<>p_revision THEN RETURN jsonb_build_object('ok',false,'reason','conflict');END IF;
 IF s.phone_e164 IS DISTINCT FROM p_data->>'phone' THEN
  UPDATE twuanis_canonical_private.account_phone_state SET phone_e164=p_data->>'phone' WHERE user_id=p_user RETURNING * INTO s;
  INSERT INTO twuanis_canonical_private.account_security_events(user_id,kind,request_id,revision) VALUES(p_user,'PHONE_CHANGED',p_request,s.revision);
 END IF;
 result:=jsonb_build_object('ok',true,'phone',s.phone_e164,'revision',s.revision);
 INSERT INTO twuanis_canonical_private.account_request_receipts(user_id,request_id,operation,input,result) VALUES(p_user,p_request,'PHONE_CHANGE',input,result);RETURN result;
END $$;
ALTER FUNCTION public.account_phone_service(uuid,uuid,text,bigint,jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.account_phone_service(uuid,uuid,text,bigint,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.account_phone_service(uuid,uuid,text,bigint,jsonb) TO service_role;
COMMIT;
