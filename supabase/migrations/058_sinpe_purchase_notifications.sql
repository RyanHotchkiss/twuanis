-- LOCAL ONLY. One owner notification obligation per canonical paid SINPE Order.
BEGIN;
CREATE TABLE twuanis_canonical_private.sinpe_purchase_notifications(
 order_id uuid PRIMARY KEY REFERENCES twuanis_canonical_private.offer_order_snapshots(id),acknowledgement_id uuid NOT NULL UNIQUE REFERENCES twuanis_canonical_private.offer_paid_acknowledgements(id),recipient text NOT NULL DEFAULT 'ryanjonhotchkiss@gmail.com' CHECK(recipient='ryanjonhotchkiss@gmail.com'),created_at timestamptz NOT NULL DEFAULT clock_timestamp(),state text NOT NULL DEFAULT 'PENDING' CHECK(state IN('PENDING','RETRY','ACCEPTED','NEEDS_RESOLUTION')),payload jsonb,first_attempt timestamptz,lease uuid,lease_until timestamptz,next_attempt timestamptz NOT NULL DEFAULT clock_timestamp(),provider_message text
);
CREATE TABLE twuanis_canonical_private.sinpe_notification_attempts(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),order_id uuid NOT NULL REFERENCES twuanis_canonical_private.sinpe_purchase_notifications(order_id),attempted_at timestamptz NOT NULL DEFAULT clock_timestamp(),outcome text NOT NULL CHECK(outcome IN('ACCEPTED','RETRY','NEEDS_RESOLUTION')),provider_message text);
ALTER TABLE twuanis_canonical_private.sinpe_purchase_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE twuanis_canonical_private.sinpe_notification_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON twuanis_canonical_private.sinpe_purchase_notifications,twuanis_canonical_private.sinpe_notification_attempts FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER notification_attempt_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON twuanis_canonical_private.sinpe_notification_attempts FOR EACH STATEMENT EXECUTE FUNCTION twuanis_canonical_private.administrative_immutable();
CREATE FUNCTION twuanis_canonical_private.queue_sinpe_notification() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$BEGIN
 IF NEW.source IN('sinpe','onvo') THEN INSERT INTO twuanis_canonical_private.sinpe_purchase_notifications(order_id,acknowledgement_id)VALUES(NEW.order_id,NEW.id)ON CONFLICT(order_id)DO NOTHING;END IF;RETURN NEW;END$$;
CREATE TRIGGER paid_sinpe_notification AFTER INSERT ON twuanis_canonical_private.offer_paid_acknowledgements FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.queue_sinpe_notification();
INSERT INTO twuanis_canonical_private.sinpe_purchase_notifications(order_id,acknowledgement_id) SELECT order_id,id FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE source IN('sinpe','onvo');
REVOKE ALL ON FUNCTION twuanis_canonical_private.queue_sinpe_notification() FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.sinpe_notification_service(p_operation text,p_command jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE n twuanis_canonical_private.sinpe_purchase_notifications%ROWTYPE;o twuanis_canonical_private.offer_order_snapshots%ROWTYPE;a twuanis_canonical_private.offer_paid_acknowledgements%ROWTYPE;t twuanis_canonical_private.entitlement_terms%ROWTYPE;token uuid;body jsonb;at_time timestamptz:=clock_timestamp();BEGIN
 IF p_operation='claim' THEN
 SELECT * INTO n FROM twuanis_canonical_private.sinpe_purchase_notifications WHERE state IN('PENDING','RETRY') AND next_attempt<=at_time AND(lease_until IS NULL OR lease_until<=at_time)ORDER BY next_attempt LIMIT 1 FOR UPDATE SKIP LOCKED;
 IF NOT FOUND THEN RETURN NULL;END IF;
 IF n.first_attempt IS NOT NULL AND at_time>=n.first_attempt+interval '23 hours 50 minutes' THEN
 UPDATE twuanis_canonical_private.sinpe_purchase_notifications SET state='NEEDS_RESOLUTION' WHERE order_id=n.order_id;INSERT INTO twuanis_canonical_private.sinpe_notification_attempts(order_id,outcome)VALUES(n.order_id,'NEEDS_RESOLUTION');RETURN NULL;END IF;
 token:=gen_random_uuid();SELECT * INTO STRICT o FROM twuanis_canonical_private.offer_order_snapshots WHERE id=n.order_id;SELECT * INTO STRICT a FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE id=n.acknowledgement_id;SELECT * INTO t FROM twuanis_canonical_private.entitlement_terms WHERE order_id=n.order_id;
 body:=coalesce(n.payload,twuanis_canonical_private.customer_product_copy(o.target_type,o.product_id)||jsonb_build_object('orderId',o.id,'productClass',o.resolved_terms->>'productClass','productId',o.product_id,'unit',o.resolved_terms->'terms'->>'unit','quantity',o.resolved_terms->'terms'->>'quantity','durationDays',o.resolved_terms->'terms'->>'durationDays','termKind',o.resolved_terms->'terms'->>'termKind','amount',a.amount::text,'currency',a.currency,'payment','APPROVED','confirmedAt',a.acknowledged_at,'receivedAt',coalesce((SELECT received_at FROM twuanis_canonical_private.onvo_receipts WHERE acknowledgement_id=a.id),(SELECT received_at FROM twuanis_canonical_private.sinpe_review_decisions WHERE acknowledgement_id=a.id)),'fulfillment',CASE WHEN t.id IS NOT NULL OR EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_fulfillments WHERE purchase_id=o.id AND result->>'ok'='true') THEN 'COMPLETE' ELSE 'PENDING' END,'startsAt',t.starts_at,'endsAt',t.ends_at,'asOf',at_time));
 UPDATE twuanis_canonical_private.sinpe_purchase_notifications SET payload=body,first_attempt=coalesce(first_attempt,at_time),lease=token,lease_until=at_time+interval '2 minutes' WHERE order_id=n.order_id;
 RETURN jsonb_build_object('orderId',n.order_id,'token',token,'recipient',n.recipient,'payload',body);
 ELSIF p_operation='finish' THEN
 SELECT * INTO STRICT n FROM twuanis_canonical_private.sinpe_purchase_notifications WHERE order_id=(p_command->>'orderId')::uuid FOR UPDATE;
 IF n.lease IS DISTINCT FROM(p_command->>'token')::uuid THEN RAISE EXCEPTION 'notification lease conflict';END IF;
 IF p_command->>'outcome' NOT IN('ACCEPTED','RETRY') THEN RAISE EXCEPTION 'bounded outcome required';END IF;
 UPDATE twuanis_canonical_private.sinpe_purchase_notifications SET state=p_command->>'outcome',provider_message=p_command->>'messageId',lease=NULL,lease_until=NULL,next_attempt=at_time+interval '1 minute' WHERE order_id=n.order_id;
 INSERT INTO twuanis_canonical_private.sinpe_notification_attempts(order_id,outcome,provider_message)VALUES(n.order_id,p_command->>'outcome',p_command->>'messageId');RETURN jsonb_build_object('ok',true);
 ELSE RAISE EXCEPTION 'unknown notification operation';END IF;
END$$;
REVOKE ALL ON FUNCTION public.sinpe_notification_service(text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.sinpe_notification_service(text,jsonb) TO service_role;
CREATE FUNCTION public.admin_onvo_operations(p_after uuid DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE result jsonb;BEGIN PERFORM twuanis_canonical_private.assert_administrative_permission('payments.read');
 SELECT coalesce(jsonb_agg(jsonb_build_object('orderId',o.id,'productId',o.product_id,'intentState',(SELECT state FROM twuanis_canonical_private.onvo_intents WHERE order_id=o.id),'payment',(SELECT disposition FROM twuanis_canonical_private.onvo_receipts WHERE order_id=o.id ORDER BY processed_at DESC LIMIT 1),'paymentReason',(SELECT reason FROM twuanis_canonical_private.onvo_receipts WHERE order_id=o.id ORDER BY processed_at DESC LIMIT 1),'fulfillment',(SELECT state FROM twuanis_canonical_private.onvo_fulfillment_jobs WHERE order_id=o.id),'notification',(SELECT state FROM twuanis_canonical_private.sinpe_purchase_notifications WHERE order_id=o.id)) ORDER BY o.id),'[]')INTO result FROM(SELECT * FROM twuanis_canonical_private.offer_order_snapshots WHERE(p_after IS NULL OR id>p_after) AND(EXISTS(SELECT 1 FROM twuanis_canonical_private.onvo_intents WHERE order_id=id)OR EXISTS(SELECT 1 FROM twuanis_canonical_private.sinpe_purchase_notifications WHERE order_id=id))ORDER BY id LIMIT 26)o;RETURN result;END$$;
REVOKE ALL ON FUNCTION public.admin_onvo_operations(uuid) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.admin_onvo_operations(uuid) TO authenticated;
CREATE FUNCTION twuanis_canonical_private.guard_notification_obligation() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$BEGIN
 IF (NEW.order_id,NEW.acknowledgement_id,NEW.recipient,NEW.created_at) IS DISTINCT FROM(OLD.order_id,OLD.acknowledgement_id,OLD.recipient,OLD.created_at) OR(OLD.payload IS NOT NULL AND NEW.payload IS DISTINCT FROM OLD.payload) OR(OLD.first_attempt IS NOT NULL AND NEW.first_attempt IS DISTINCT FROM OLD.first_attempt) THEN RAISE EXCEPTION 'notification obligation and frozen payload are immutable';END IF;RETURN NEW;END$$;
CREATE TRIGGER notification_identity_guard BEFORE UPDATE ON twuanis_canonical_private.sinpe_purchase_notifications FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.guard_notification_obligation();
CREATE TRIGGER notification_no_delete BEFORE DELETE OR TRUNCATE ON twuanis_canonical_private.sinpe_purchase_notifications FOR EACH STATEMENT EXECUTE FUNCTION twuanis_canonical_private.administrative_immutable();
REVOKE ALL ON FUNCTION twuanis_canonical_private.guard_notification_obligation() FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
