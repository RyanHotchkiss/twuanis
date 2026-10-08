-- Administrative foundation. One-shot installation after 025; no commercial catalog changes.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
DO $$ BEGIN IF current_user <> 'postgres' THEN RAISE EXCEPTION 'postgres administrative installation required'; END IF; END $$;

CREATE TABLE twuanis_canonical_private.administrators (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id), active boolean NOT NULL DEFAULT true
);
CREATE TABLE twuanis_canonical_private.administrative_permissions (
 permission text PRIMARY KEY
);
INSERT INTO twuanis_canonical_private.administrative_permissions VALUES
 ('listings.read'),('listings.manage'),('packages.read'),('packages.manage'),
 ('addons.read'),('addons.manage'),('offers.read'),('offers.manage'),
 ('promotions.read'),('promotions.manage'),('orders.read'),
 ('payments.read'),('payments.review'),('entitlements.read'),('entitlements.manage'),
 ('administrators.read'),('administrators.manage'),('configuration.read'),('configuration.manage'),
 ('imports.read'),('imports.manage');
CREATE TABLE twuanis_canonical_private.administrative_permission_grants (
 user_id uuid NOT NULL REFERENCES twuanis_canonical_private.administrators(user_id),
 permission text NOT NULL REFERENCES twuanis_canonical_private.administrative_permissions(permission),
 PRIMARY KEY(user_id,permission), CHECK(permission <> 'administrators.manage')
);
CREATE TABLE twuanis_canonical_private.top_administrator (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id)
);
CREATE TABLE twuanis_canonical_private.administrative_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 actor_id uuid, -- Deliberately no cascading FK: historical account evidence survives deletion.
 authority text NOT NULL, permission text, operation text NOT NULL,
 target_type text NOT NULL, target_id uuid, occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 execution_actor name NOT NULL DEFAULT session_user,
 execution_role text NOT NULL DEFAULT coalesce(auth.jwt()->>'role',session_user::text),
 result text NOT NULL CHECK(result IN ('succeeded','denied')),
 before_state jsonb, after_state jsonb, reason text CHECK(length(reason)<=2000),
 request_id uuid NOT NULL,
 actor_provenance text NOT NULL DEFAULT 'authenticated_account_only'
);
CREATE INDEX administrative_events_target ON twuanis_canonical_private.administrative_events(target_id,id);
CREATE TABLE twuanis_canonical_private.administrative_receipts (
 actor_id uuid NOT NULL, request_id uuid NOT NULL, command jsonb NOT NULL,
 event_id bigint NOT NULL REFERENCES twuanis_canonical_private.administrative_events(id),
 PRIMARY KEY(actor_id,request_id)
);

-- Retire disposable broad compatibility grants; do not migrate them into scoped authority.
UPDATE twuanis_canonical_private.owner_access_grants SET revoked_at=clock_timestamp(),revoked_by=session_user
 WHERE revoked_at IS NULL AND user_id <> 'd81064bc-1b4a-478f-8f6a-b263c4779bc1';
INSERT INTO twuanis_canonical_private.owner_access_grants(user_id)
 VALUES('d81064bc-1b4a-478f-8f6a-b263c4779bc1') ON CONFLICT(user_id) WHERE revoked_at IS NULL DO NOTHING;
INSERT INTO twuanis_canonical_private.top_administrator(user_id) VALUES('d81064bc-1b4a-478f-8f6a-b263c4779bc1');
UPDATE twuanis_canonical_private.administrative_access_grants SET revoked_at=clock_timestamp(),revoked_by=session_user WHERE revoked_at IS NULL;
-- Historical reviewer/import grant rows are retained but cease to confer runtime authority.

CREATE FUNCTION twuanis_canonical_private.administrative_immutable() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$ BEGIN RAISE EXCEPTION 'administrative history is immutable' USING ERRCODE='42501'; END $$;
CREATE TRIGGER administrative_events_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON twuanis_canonical_private.administrative_events
 FOR EACH STATEMENT EXECUTE FUNCTION twuanis_canonical_private.administrative_immutable();
CREATE TRIGGER administrative_receipts_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON twuanis_canonical_private.administrative_receipts
 FOR EACH STATEMENT EXECUTE FUNCTION twuanis_canonical_private.administrative_immutable();

CREATE FUNCTION twuanis_canonical_private.administrative_actor() RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE v uuid:=auth.uid();
BEGIN
 IF v IS NULL OR auth.jwt()->>'role' IS DISTINCT FROM 'authenticated'
 OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=v) THEN
  RAISE EXCEPTION 'administrative access denied' USING ERRCODE='42501';
 END IF;
 RETURN v;
END $$;

CREATE FUNCTION twuanis_canonical_private.administrative_permission(p_actor uuid,p_permission text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT EXISTS(SELECT 1 FROM twuanis_canonical_private.administrative_permissions WHERE permission=p_permission)
 AND (EXISTS(SELECT 1 FROM twuanis_canonical_private.owner_access_grants WHERE user_id=p_actor AND revoked_at IS NULL)
 OR (p_permission IN ('administrators.read','administrators.manage') AND EXISTS(SELECT 1 FROM twuanis_canonical_private.top_administrator WHERE user_id=p_actor))
 OR (p_permission <> 'administrators.manage' AND EXISTS(
 SELECT 1 FROM twuanis_canonical_private.administrators a JOIN twuanis_canonical_private.administrative_permission_grants g USING(user_id)
 WHERE a.user_id=p_actor AND a.active AND g.permission=p_permission)))
$$;

-- All authority writers and privileged domain transactions use this lock before checking grants.
-- The lock lasts until commit; revocation and in-flight mutations have a defined serial order.
CREATE FUNCTION twuanis_canonical_private.assert_administrative_permission(p_permission text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE v uuid;
BEGIN
 PERFORM pg_advisory_xact_lock(3110,1);
 v:=twuanis_canonical_private.administrative_actor();
 IF NOT twuanis_canonical_private.administrative_permission(v,p_permission) THEN
 RAISE EXCEPTION 'administrative access denied' USING ERRCODE='42501'; END IF;
 RETURN v;
END $$;

CREATE FUNCTION twuanis_canonical_private.elevated_owner(p_actor uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT EXISTS(SELECT 1 FROM twuanis_canonical_private.owner_access_grants WHERE user_id=p_actor AND revoked_at IS NULL)
 AND auth.jwt()->>'aal'='aal2'
 AND EXISTS(SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(auth.jwt()->'amr')='array' THEN auth.jwt()->'amr' ELSE '[]'::jsonb END) e
 WHERE e->>'method' IN ('mfa/totp','mfa/phone','mfa/webauthn')
 AND CASE WHEN jsonb_typeof(e->'timestamp')='number' THEN (e->>'timestamp')::numeric BETWEEN extract(epoch FROM statement_timestamp())-300 AND extract(epoch FROM statement_timestamp()) ELSE false END)
$$;

CREATE FUNCTION twuanis_canonical_private.administrative_reason_required(p_operation text) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path=pg_catalog AS $$
 SELECT p_operation IN ('owner.grant','owner.revoke','top.assign','owner.recover','delete','entitlement.revoke','payment.reject','override','exceptional_correction','listing.archive_other')
$$;

CREATE FUNCTION twuanis_canonical_private.append_administrative_event(
 p_actor uuid,p_authority text,p_permission text,p_operation text,p_target_type text,p_target uuid,
 p_before jsonb,p_after jsonb,p_reason text,p_request uuid,p_result text DEFAULT 'succeeded') RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE v bigint;
BEGIN
 IF p_actor IS DISTINCT FROM twuanis_canonical_private.administrative_actor() OR p_request IS NULL THEN
 RAISE EXCEPTION 'administrative access denied' USING ERRCODE='42501'; END IF;
 IF length(p_reason)>2000 OR (p_result='succeeded' AND twuanis_canonical_private.administrative_reason_required(p_operation) AND nullif(btrim(p_reason),'') IS NULL) THEN
 RAISE EXCEPTION 'administrative reason required' USING ERRCODE='22023'; END IF;
 INSERT INTO twuanis_canonical_private.administrative_events(actor_id,authority,permission,operation,target_type,target_id,result,before_state,after_state,reason,request_id)
 VALUES(p_actor,p_authority,p_permission,p_operation,p_target_type,p_target,p_result,p_before,p_after,nullif(btrim(p_reason),''),p_request) RETURNING id INTO v;
 RETURN v;
END $$;

CREATE FUNCTION public.current_administrative_authority() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE v uuid:=twuanis_canonical_private.administrative_actor();
BEGIN
 RETURN jsonb_build_object('actorId',v,
 'owner',EXISTS(SELECT 1 FROM twuanis_canonical_private.owner_access_grants WHERE user_id=v AND revoked_at IS NULL),
 'topAdministrator',EXISTS(SELECT 1 FROM twuanis_canonical_private.top_administrator WHERE user_id=v),
 'permissions',(SELECT coalesce(jsonb_agg(permission ORDER BY permission),'[]') FROM twuanis_canonical_private.administrative_permissions WHERE twuanis_canonical_private.administrative_permission(v,permission)));
END $$;

-- Closed administrative-identity command set, never a generic table/column mutation endpoint.
CREATE FUNCTION public.change_administrative_authority(p_request uuid,p_operation text,p_target uuid,p_permission text DEFAULT NULL,p_reason text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE v_actor uuid; v_owner boolean; v_top boolean; v_before jsonb; v_after jsonb;
 v_command jsonb; v_prior twuanis_canonical_private.administrative_receipts%ROWTYPE; v_event bigint; v_authority text;
BEGIN
 v_actor:=twuanis_canonical_private.assert_administrative_permission('administrators.manage');
 v_owner:=EXISTS(SELECT 1 FROM twuanis_canonical_private.owner_access_grants WHERE user_id=v_actor AND revoked_at IS NULL);
 v_top:=EXISTS(SELECT 1 FROM twuanis_canonical_private.top_administrator WHERE user_id=v_actor);
 IF p_request IS NULL OR p_target IS NULL OR p_operation NOT IN ('administrator.activate','administrator.deactivate','permission.grant','permission.revoke','owner.grant','owner.revoke','top.assign') OR p_operation IS NULL THEN
 RAISE EXCEPTION 'invalid administrative request' USING ERRCODE='22023'; END IF;
 IF p_operation IN ('owner.grant','owner.revoke','top.assign') THEN
 IF NOT v_owner OR NOT coalesce(twuanis_canonical_private.elevated_owner(v_actor),false) THEN RAISE EXCEPTION 'administrative access denied' USING ERRCODE='42501'; END IF;
 v_authority:='Owner';
 ELSE v_authority:=CASE WHEN v_top THEN 'Top Administrator' ELSE 'Owner' END;
 END IF;
 IF length(p_reason)>2000 OR (twuanis_canonical_private.administrative_reason_required(p_operation) AND nullif(btrim(p_reason),'') IS NULL) THEN RAISE EXCEPTION 'administrative reason required' USING ERRCODE='22023'; END IF;
 IF p_operation IN ('permission.grant','permission.revoke') THEN
 IF p_permission IS NULL OR p_permission='administrators.manage' OR NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.administrative_permissions WHERE permission=p_permission) THEN RAISE EXCEPTION 'invalid administrative permission' USING ERRCODE='22023'; END IF;
 ELSIF p_permission IS NOT NULL THEN RAISE EXCEPTION 'unexpected permission' USING ERRCODE='22023'; END IF;
 v_command:=jsonb_build_object('operation',p_operation,'target',p_target,'permission',p_permission,'reason',nullif(btrim(p_reason),''));
 SELECT * INTO v_prior FROM twuanis_canonical_private.administrative_receipts WHERE actor_id=v_actor AND request_id=p_request;
 IF FOUND THEN
 IF v_prior.command IS DISTINCT FROM v_command THEN RAISE EXCEPTION 'administrative replay conflict' USING ERRCODE='22023'; END IF;
 RETURN jsonb_build_object('ok',true,'eventId',v_prior.event_id::text,'replayed',true);
 END IF;
 IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p_target) THEN RAISE EXCEPTION 'invalid administrative target' USING ERRCODE='22023'; END IF;
 -- Top Administrator manages ordinary accounts, never themselves or protected authorities.
 IF NOT v_owner AND (p_target=v_actor OR EXISTS(SELECT 1 FROM twuanis_canonical_private.owner_access_grants WHERE user_id=p_target AND revoked_at IS NULL) OR EXISTS(SELECT 1 FROM twuanis_canonical_private.top_administrator WHERE user_id=p_target)) THEN RAISE EXCEPTION 'administrative access denied' USING ERRCODE='42501'; END IF;
 v_before:=jsonb_build_object('active',coalesce((SELECT active FROM twuanis_canonical_private.administrators WHERE user_id=p_target),false),
 'owner',EXISTS(SELECT 1 FROM twuanis_canonical_private.owner_access_grants WHERE user_id=p_target AND revoked_at IS NULL),
 'topAdministrator',(SELECT user_id FROM twuanis_canonical_private.top_administrator),
 'permissions',(SELECT coalesce(jsonb_agg(permission ORDER BY permission),'[]') FROM twuanis_canonical_private.administrative_permission_grants WHERE user_id=p_target));
 CASE p_operation
 WHEN 'administrator.activate' THEN
 INSERT INTO twuanis_canonical_private.administrators VALUES(p_target,true) ON CONFLICT(user_id) DO UPDATE SET active=true;
 WHEN 'administrator.deactivate' THEN
 IF EXISTS(SELECT 1 FROM twuanis_canonical_private.top_administrator WHERE user_id=p_target) OR EXISTS(SELECT 1 FROM twuanis_canonical_private.owner_access_grants WHERE user_id=p_target AND revoked_at IS NULL) THEN RAISE EXCEPTION 'protected authority requires explicit operation' USING ERRCODE='22023'; END IF;
 UPDATE twuanis_canonical_private.administrators SET active=false WHERE user_id=p_target;
 DELETE FROM twuanis_canonical_private.administrative_permission_grants WHERE user_id=p_target;
 WHEN 'permission.grant' THEN
 IF NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.administrators WHERE user_id=p_target AND active) THEN RAISE EXCEPTION 'active administrator required' USING ERRCODE='22023'; END IF;
 INSERT INTO twuanis_canonical_private.administrative_permission_grants VALUES(p_target,p_permission) ON CONFLICT DO NOTHING;
 WHEN 'permission.revoke' THEN DELETE FROM twuanis_canonical_private.administrative_permission_grants WHERE user_id=p_target AND permission=p_permission;
 WHEN 'owner.grant' THEN
 INSERT INTO twuanis_canonical_private.owner_access_grants(user_id) VALUES(p_target) ON CONFLICT(user_id) WHERE revoked_at IS NULL DO NOTHING;
 WHEN 'owner.revoke' THEN
 IF EXISTS(SELECT 1 FROM twuanis_canonical_private.owner_access_grants WHERE user_id=p_target AND revoked_at IS NULL) AND (SELECT count(*) FROM twuanis_canonical_private.owner_access_grants WHERE revoked_at IS NULL)<=1 THEN RAISE EXCEPTION 'last Owner cannot be removed' USING ERRCODE='23514'; END IF;
 UPDATE twuanis_canonical_private.owner_access_grants SET revoked_at=clock_timestamp(),revoked_by=session_user WHERE user_id=p_target AND revoked_at IS NULL;
 WHEN 'top.assign' THEN UPDATE twuanis_canonical_private.top_administrator SET user_id=p_target WHERE singleton;
 END CASE;
 v_after:=jsonb_build_object('active',coalesce((SELECT active FROM twuanis_canonical_private.administrators WHERE user_id=p_target),false),
 'owner',EXISTS(SELECT 1 FROM twuanis_canonical_private.owner_access_grants WHERE user_id=p_target AND revoked_at IS NULL),
 'topAdministrator',(SELECT user_id FROM twuanis_canonical_private.top_administrator),
 'permissions',(SELECT coalesce(jsonb_agg(permission ORDER BY permission),'[]') FROM twuanis_canonical_private.administrative_permission_grants WHERE user_id=p_target));
 v_event:=twuanis_canonical_private.append_administrative_event(v_actor,v_authority,'administrators.manage',p_operation,'account',p_target,v_before,v_after,p_reason,p_request);
 INSERT INTO twuanis_canonical_private.administrative_receipts VALUES(v_actor,p_request,v_command,v_event);
 RETURN jsonb_build_object('ok',true,'eventId',v_event::text,'replayed',false);
END $$;

-- Recovery re-establishes access for a CURRENT Owner after provider recovery + fresh MFA.
-- It cannot reinstate a revoked Owner or change any role, grant, data, or entitlement.
CREATE FUNCTION public.recover_owner_administrative_access(p_request uuid,p_reason text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE v uuid; e bigint; c jsonb; prior twuanis_canonical_private.administrative_receipts%ROWTYPE;
BEGIN
 PERFORM pg_advisory_xact_lock(3110,1);
 v:=twuanis_canonical_private.administrative_actor();
 IF p_request IS NULL OR nullif(btrim(p_reason),'') IS NULL OR length(p_reason)>2000 THEN RAISE EXCEPTION 'invalid recovery request' USING ERRCODE='22023'; END IF;
 IF NOT coalesce(twuanis_canonical_private.elevated_owner(v),false) THEN
 e:=twuanis_canonical_private.append_administrative_event(v,'Unestablished',NULL,'owner.recover','account',v,NULL,NULL,NULL,p_request,'denied');
 RETURN jsonb_build_object('ok',false); -- Normal result preserves the durable denial audit.
 END IF;
 c:=jsonb_build_object('operation','owner.recover','reason',btrim(p_reason));
 SELECT * INTO prior FROM twuanis_canonical_private.administrative_receipts WHERE actor_id=v AND request_id=p_request;
 IF FOUND THEN
 IF prior.command IS DISTINCT FROM c THEN RAISE EXCEPTION 'administrative replay conflict' USING ERRCODE='22023'; END IF;
 RETURN jsonb_build_object('ok',true,'eventId',prior.event_id::text,'replayed',true);
 END IF;
 e:=twuanis_canonical_private.append_administrative_event(v,'Owner',NULL,'owner.recover','account',v,NULL,jsonb_build_object('mechanism','Supabase Auth + fresh MFA','access','current Owner only'),p_reason,p_request);
 INSERT INTO twuanis_canonical_private.administrative_receipts VALUES(v,p_request,c,e);
 RETURN jsonb_build_object('ok',true,'eventId',e::text,'replayed',false);
END $$;

-- Compatibility checks now resolve specialized scoped capabilities; no legacy grant OR fallback.
CREATE OR REPLACE FUNCTION public.is_current_user_payment_reviewer() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT auth.jwt()->>'role'='authenticated' AND twuanis_canonical_private.administrative_permission(auth.uid(),'payments.review') $$;
CREATE OR REPLACE FUNCTION public.is_payment_reviewer(p_user_id uuid DEFAULT auth.uid()) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT twuanis_canonical_private.administrative_permission(p_user_id,'payments.review') $$;
CREATE OR REPLACE FUNCTION public.require_payment_reviewer() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
 BEGIN PERFORM twuanis_canonical_private.assert_administrative_permission('payments.review'); END $$;
CREATE OR REPLACE FUNCTION public.is_current_user_import_operator() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT auth.jwt()->>'role'='authenticated' AND twuanis_canonical_private.administrative_permission(auth.uid(),'imports.manage') $$;
-- Broad analytical override remains Owner-only compatibility; scoped grants never imply it.
CREATE OR REPLACE FUNCTION public.is_current_user_administrator() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$ SELECT public.is_current_user_owner() $$;

-- Old setters cannot silently alter the new authority model.
CREATE OR REPLACE FUNCTION twuanis_canonical_private.set_owner_access(p_user uuid,p_active boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ BEGIN RAISE EXCEPTION 'use audited administrative authority boundary' USING ERRCODE='42501'; END $$;
CREATE OR REPLACE FUNCTION twuanis_canonical_private.set_administrative_access(p_user uuid,p_active boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ BEGIN RAISE EXCEPTION 'use audited administrative authority boundary' USING ERRCODE='42501'; END $$;
CREATE OR REPLACE FUNCTION twuanis_canonical_private.set_import_operator(p_user uuid,p_active boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ BEGIN RAISE EXCEPTION 'use audited administrative authority boundary' USING ERRCODE='42501'; END $$;

-- Preserve the installed payment implementations byte-for-byte behind audited wrappers.
-- Their existing transaction/lifecycle checks remain authoritative; no payment math is rewritten.
ALTER FUNCTION public.approve_sinpe_payment(uuid) SET SCHEMA twuanis_canonical_private;
ALTER FUNCTION twuanis_canonical_private.approve_sinpe_payment(uuid) RENAME TO step2_approve_sinpe_payment;
ALTER FUNCTION public.reject_sinpe_payment(uuid,text) SET SCHEMA twuanis_canonical_private;
ALTER FUNCTION twuanis_canonical_private.reject_sinpe_payment(uuid,text) RENAME TO step2_reject_sinpe_payment;
REVOKE ALL ON FUNCTION twuanis_canonical_private.step2_approve_sinpe_payment(uuid),twuanis_canonical_private.step2_reject_sinpe_payment(uuid,text) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.approve_sinpe_payment(p_payment_id uuid)
RETURNS TABLE(payment_id uuid,subscription_id uuid,previous_subscription_id uuid,user_id uuid,package_id uuid,payment_status text,subscription_status text,period_start timestamptz,period_end timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE v_actor uuid; v_result record;
BEGIN
 v_actor:=twuanis_canonical_private.assert_administrative_permission('payments.review');
 SELECT * INTO STRICT v_result FROM twuanis_canonical_private.step2_approve_sinpe_payment(p_payment_id);
 PERFORM twuanis_canonical_private.append_administrative_event(v_actor,CASE WHEN public.is_current_user_owner() THEN 'Owner' ELSE 'Payment Review' END,'payments.review','payment.approve','payment',p_payment_id,
 NULL,jsonb_build_object('paymentStatus',v_result.payment_status,'subscriptionStatus',v_result.subscription_status),NULL,gen_random_uuid());
 RETURN QUERY SELECT v_result.payment_id,v_result.subscription_id,v_result.previous_subscription_id,v_result.user_id,v_result.package_id,v_result.payment_status,v_result.subscription_status,v_result.period_start,v_result.period_end;
END $$;
CREATE FUNCTION public.reject_sinpe_payment(p_payment_id uuid,p_rejection_reason text)
RETURNS TABLE(payment_id uuid,subscription_id uuid,user_id uuid,package_id uuid,payment_status text,subscription_status text,rejection_reason text,rejected_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE v_actor uuid; v_result record;
BEGIN
 v_actor:=twuanis_canonical_private.assert_administrative_permission('payments.review');
 IF nullif(btrim(p_rejection_reason),'') IS NULL OR length(p_rejection_reason)>2000 THEN RAISE EXCEPTION 'administrative reason required' USING ERRCODE='22023'; END IF;
 SELECT * INTO STRICT v_result FROM twuanis_canonical_private.step2_reject_sinpe_payment(p_payment_id,p_rejection_reason);
 PERFORM twuanis_canonical_private.append_administrative_event(v_actor,CASE WHEN public.is_current_user_owner() THEN 'Owner' ELSE 'Payment Review' END,'payments.review','payment.reject','payment',p_payment_id,
 NULL,jsonb_build_object('paymentStatus',v_result.payment_status,'subscriptionStatus',v_result.subscription_status),p_rejection_reason,gen_random_uuid());
 RETURN QUERY SELECT v_result.payment_id,v_result.subscription_id,v_result.user_id,v_result.package_id,v_result.payment_status,v_result.subscription_status,v_result.rejection_reason,v_result.rejected_at;
END $$;
ALTER FUNCTION public.approve_sinpe_payment(uuid) OWNER TO postgres;
ALTER FUNCTION public.reject_sinpe_payment(uuid,text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.approve_sinpe_payment(uuid),public.reject_sinpe_payment(uuid,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.approve_sinpe_payment(uuid),public.reject_sinpe_payment(uuid,text) TO authenticated;

-- A short-lived, server-issued handoff binds the verified human to service execution.
-- Service credentials alone cannot manufacture an authenticated human audit identity.
CREATE TABLE twuanis_canonical_private.administrative_import_operations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid NOT NULL REFERENCES auth.users(id),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), evidence_id uuid,
 input_snapshot jsonb, result jsonb
);
ALTER TABLE twuanis_canonical_private.administrative_import_operations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON twuanis_canonical_private.administrative_import_operations FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.begin_administrative_import() RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE a uuid; v uuid;
BEGIN
 a:=twuanis_canonical_private.assert_administrative_permission('imports.manage');
 INSERT INTO twuanis_canonical_private.administrative_import_operations(actor_id) VALUES(a) RETURNING id INTO v;
 PERFORM twuanis_canonical_private.append_administrative_event(a,CASE WHEN public.is_current_user_owner() THEN 'Owner' ELSE 'Import Operator' END,'imports.manage','import.begin','import_operation',v,NULL,NULL,NULL,v);
 RETURN v;
END $$;
CREATE FUNCTION twuanis_canonical_private.lock_administrative_import(p_operation uuid)
RETURNS twuanis_canonical_private.administrative_import_operations
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE r twuanis_canonical_private.administrative_import_operations%ROWTYPE;
BEGIN
 IF auth.jwt()->>'role' IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'administrative access denied' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(3110,1);
 SELECT * INTO r FROM twuanis_canonical_private.administrative_import_operations WHERE id=p_operation FOR UPDATE;
 IF NOT FOUND OR r.created_at < clock_timestamp()-interval '5 minutes' OR NOT twuanis_canonical_private.administrative_permission(r.actor_id,'imports.manage') THEN RAISE EXCEPTION 'administrative access denied' USING ERRCODE='42501'; END IF;
 RETURN r;
END $$;
CREATE FUNCTION twuanis_canonical_private.audit_administrative_import(p_operation uuid,p_step text,p_target uuid,p_result jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE r twuanis_canonical_private.administrative_import_operations%ROWTYPE;
BEGIN
 r:=twuanis_canonical_private.lock_administrative_import(p_operation);
 IF p_step NOT IN ('import.retain','import.apply') THEN RAISE EXCEPTION 'invalid import step'; END IF;
 INSERT INTO twuanis_canonical_private.administrative_events(actor_id,authority,permission,operation,target_type,target_id,result,after_state,request_id)
 VALUES(r.actor_id,CASE WHEN EXISTS(SELECT 1 FROM twuanis_canonical_private.owner_access_grants WHERE user_id=r.actor_id AND revoked_at IS NULL) THEN 'Owner' ELSE 'Import Operator' END,'imports.manage',p_step,'source_evidence',p_target,'succeeded',p_result,p_operation);
END $$;
CREATE FUNCTION public.retain_administrative_csv_evidence(p_operation uuid,p_raw jsonb,p_review jsonb) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE r twuanis_canonical_private.administrative_import_operations%ROWTYPE; v uuid;
BEGIN
 r:=twuanis_canonical_private.lock_administrative_import(p_operation);
 v:=public.retain_csv_source_evidence(p_raw,p_review);
 IF r.evidence_id IS NOT NULL AND r.evidence_id<>v THEN RAISE EXCEPTION 'import operation evidence mismatch'; END IF;
 IF r.evidence_id IS NULL THEN
 UPDATE twuanis_canonical_private.administrative_import_operations SET evidence_id=v WHERE id=p_operation;
 PERFORM twuanis_canonical_private.audit_administrative_import(p_operation,'import.retain',v,jsonb_build_object('evidenceId',v));
 END IF;
 RETURN v;
END $$;
CREATE FUNCTION public.apply_administrative_csv_observation(p_operation uuid,p_evidence uuid,p_input jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE r twuanis_canonical_private.administrative_import_operations%ROWTYPE; v jsonb;
BEGIN
 r:=twuanis_canonical_private.lock_administrative_import(p_operation);
 IF r.evidence_id IS NULL OR r.evidence_id IS DISTINCT FROM p_evidence OR p_input IS NULL OR jsonb_typeof(p_input)<>'object' OR octet_length(p_input::text)>524288 THEN RAISE EXCEPTION 'invalid import operation'; END IF;
 IF r.result IS NOT NULL THEN
 IF r.input_snapshot IS DISTINCT FROM p_input THEN RAISE EXCEPTION 'import replay mismatch'; END IF;
 RETURN r.result;
 END IF;
 v:=public.ingest_canonical_source_observation(p_evidence,p_input);
 UPDATE twuanis_canonical_private.administrative_import_operations SET input_snapshot=p_input,result=v WHERE id=p_operation;
 PERFORM twuanis_canonical_private.audit_administrative_import(p_operation,'import.apply',p_evidence,jsonb_build_object('evidenceId',p_evidence,'listingId',v->>'listing_id','outcome',v->>'outcome'));
 RETURN v;
END $$;
REVOKE ALL ON FUNCTION public.begin_administrative_import(),public.retain_administrative_csv_evidence(uuid,jsonb,jsonb),public.apply_administrative_csv_observation(uuid,uuid,jsonb),twuanis_canonical_private.lock_administrative_import(uuid),twuanis_canonical_private.audit_administrative_import(uuid,text,uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.begin_administrative_import() TO authenticated;
GRANT EXECUTE ON FUNCTION public.retain_administrative_csv_evidence(uuid,jsonb,jsonb),public.apply_administrative_csv_observation(uuid,uuid,jsonb) TO service_role;

-- Protect every new table and function explicitly, including sequence privileges.
DO $$ DECLARE t text; f record; BEGIN
 FOREACH t IN ARRAY ARRAY['administrators','administrative_permissions','administrative_permission_grants','top_administrator','administrative_events','administrative_receipts'] LOOP
 EXECUTE format('ALTER TABLE twuanis_canonical_private.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON TABLE twuanis_canonical_private.%I FROM PUBLIC,anon,authenticated,service_role',t);
 END LOOP;
 FOR f IN SELECT p.oid::regprocedure AS signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='twuanis_canonical_private' AND p.proname IN ('administrative_immutable','administrative_actor','administrative_permission','assert_administrative_permission','elevated_owner','administrative_reason_required','append_administrative_event') LOOP
 EXECUTE format('ALTER FUNCTION %s OWNER TO postgres',f.signature);
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',f.signature);
 END LOOP;
END $$;
REVOKE ALL ON SEQUENCE twuanis_canonical_private.administrative_events_id_seq FROM PUBLIC,anon,authenticated,service_role;
ALTER FUNCTION public.current_administrative_authority() OWNER TO postgres;
ALTER FUNCTION public.change_administrative_authority(uuid,text,uuid,text,text) OWNER TO postgres;
ALTER FUNCTION public.recover_owner_administrative_access(uuid,text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.current_administrative_authority(),public.change_administrative_authority(uuid,text,uuid,text,text),public.recover_owner_administrative_access(uuid,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.current_administrative_authority(),public.change_administrative_authority(uuid,text,uuid,text,text),public.recover_owner_administrative_access(uuid,text) TO authenticated;
INSERT INTO twuanis_canonical_private.administrative_events(actor_id,authority,operation,target_type,target_id,result,after_state,request_id,actor_provenance)
 VALUES(NULL,'Database installation','authority.initialize','account','d81064bc-1b4a-478f-8f6a-b263c4779bc1','succeeded',
 '{"owner":true,"topAdministrator":true,"accountUse":"shared; individual human not distinguishable"}',
 '93b3d05a-1df5-48c2-b6c8-0c2d562b5ee2','administrative_installation_user_authorized');
COMMIT;
