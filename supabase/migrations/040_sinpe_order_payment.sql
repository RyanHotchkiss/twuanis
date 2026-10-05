-- Step9 local only; no receiving accounts seeded, no production activation.
BEGIN;
SET LOCAL lock_timeout='5s';
CREATE TABLE twuanis_canonical_private.sinpe_receiving_accounts(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),currency text NOT NULL CHECK(currency IN('USD','CRC')),
 instructions_en text NOT NULL CHECK(length(instructions_en) BETWEEN 1 AND 2000),instructions_es text NOT NULL CHECK(length(instructions_es) BETWEEN 1 AND 2000),
 enabled boolean NOT NULL DEFAULT false,created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE public.sinpe_payments ENABLE ROW LEVEL SECURITY;
-- Account identity/currency cannot change; switching destinations requires a new canonical account.
CREATE FUNCTION twuanis_canonical_private.sinpe_account_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$BEGIN
 IF TG_OP='DELETE' OR (NEW.id,NEW.currency,NEW.instructions_en,NEW.instructions_es) IS DISTINCT FROM (OLD.id,OLD.currency,OLD.instructions_en,OLD.instructions_es) THEN RAISE EXCEPTION 'receiving identity immutable'; END IF;RETURN NEW;END$$;
CREATE TRIGGER sinpe_account_identity BEFORE UPDATE OR DELETE ON twuanis_canonical_private.sinpe_receiving_accounts FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.sinpe_account_guard();
ALTER TABLE public.sinpe_payments ADD COLUMN canonical_order_id uuid REFERENCES twuanis_canonical_private.offer_order_snapshots(id),ADD COLUMN submission_request_id uuid,ADD COLUMN receiving_account_id uuid REFERENCES twuanis_canonical_private.sinpe_receiving_accounts(id),ADD COLUMN submission_evidence jsonb;
-- Explicit legacy/canonical compatibility. No historical evidence is rewritten.
-- payment_date retains legacy meaning; canonical bank time belongs to immutable
-- sinpe_review_decisions.received_at, never a customer claim or submission clock.
ALTER TABLE public.sinpe_payments ALTER COLUMN payment_date DROP NOT NULL;
ALTER TABLE public.sinpe_payments DROP CONSTRAINT sinpe_payments_commercial_relationship;
ALTER TABLE public.sinpe_payments ADD CONSTRAINT sinpe_payments_commercial_relationship CHECK (
 (canonical_order_id IS NULL AND (purchase_request_id IS NOT NULL OR subscription_id IS NOT NULL))
 OR (canonical_order_id IS NOT NULL AND purchase_request_id IS NULL AND subscription_id IS NULL)
);
ALTER TABLE public.sinpe_payments ADD CONSTRAINT sinpe_payment_date_authority CHECK (
 (canonical_order_id IS NULL AND payment_date IS NOT NULL)
 OR (canonical_order_id IS NOT NULL AND payment_date IS NULL)
);
CREATE OR REPLACE FUNCTION public.validate_sinpe_payment_subscription() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF NEW.canonical_order_id IS NOT NULL THEN RETURN NEW; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.user_subscriptions us
                WHERE us.id=NEW.subscription_id AND us.user_id=NEW.user_id) THEN
  RAISE EXCEPTION 'The subscription does not belong to the specified user.';
 END IF;
 RETURN NEW;
END $$;
ALTER TABLE public.sinpe_payments ADD CONSTRAINT sinpe_canonical_submission_shape CHECK(canonical_order_id IS NULL OR (submission_request_id IS NOT NULL AND receiving_account_id IS NOT NULL AND submission_evidence IS NOT NULL AND jsonb_typeof(submission_evidence)='object' AND octet_length(submission_evidence::text)<=8000 AND created_at IS NOT NULL));
CREATE POLICY canonical_sinpe_no_direct_api ON public.sinpe_payments AS RESTRICTIVE FOR ALL TO anon,authenticated USING(canonical_order_id IS NULL) WITH CHECK(canonical_order_id IS NULL);
CREATE UNIQUE INDEX sinpe_submission_request ON public.sinpe_payments(user_id,submission_request_id) WHERE canonical_order_id IS NOT NULL;
CREATE INDEX sinpe_order_attempts ON public.sinpe_payments(canonical_order_id,id) WHERE canonical_order_id IS NOT NULL;
CREATE TABLE twuanis_canonical_private.sinpe_review_decisions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),attempt_id uuid NOT NULL UNIQUE REFERENCES public.sinpe_payments(id),actor_id uuid NOT NULL REFERENCES auth.users(id),request_id uuid NOT NULL,
 command jsonb NOT NULL,disposition text NOT NULL CHECK(disposition IN('APPROVED','RECEIVED_UNMATCHED','REJECTED')),
 reason text NOT NULL,receiving_account_id uuid REFERENCES twuanis_canonical_private.sinpe_receiving_accounts(id),bank_reference text,
 amount numeric,currency text,received_at timestamptz,bank_evidence text,decided_at timestamptz NOT NULL DEFAULT clock_timestamp(),acknowledgement_id uuid REFERENCES twuanis_canonical_private.offer_paid_acknowledgements(id),
 UNIQUE(actor_id,request_id),
 CHECK((disposition='REJECTED' AND receiving_account_id IS NULL AND bank_reference IS NULL AND amount IS NULL AND currency IS NULL AND received_at IS NULL AND acknowledgement_id IS NULL) OR (disposition IN('APPROVED','RECEIVED_UNMATCHED') AND receiving_account_id IS NOT NULL AND bank_reference IS NOT NULL AND length(bank_reference) BETWEEN 1 AND 300 AND bank_reference=btrim(bank_reference) AND amount>0 AND amount<1000000000000 AND scale(amount)<=2 AND currency IN('USD','CRC') AND bank_evidence IS NOT NULL AND length(bank_evidence) BETWEEN 1 AND 2000)),
 CHECK((disposition='APPROVED')=(acknowledgement_id IS NOT NULL))
);
-- Both matched and unmatched received funds protect the exact scoped event; no normalization guesses.
CREATE UNIQUE INDEX sinpe_bank_event_consumed ON twuanis_canonical_private.sinpe_review_decisions(receiving_account_id,bank_reference COLLATE "C") WHERE bank_reference IS NOT NULL;
CREATE FUNCTION twuanis_canonical_private.sinpe_submission_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.canonical_order_id IS NOT NULL AND current_user<>'postgres' THEN RAISE EXCEPTION 'trusted submission only';END IF;RETURN NEW;
 END IF;
 IF OLD.canonical_order_id IS NOT NULL OR (TG_OP='UPDATE' AND NEW.canonical_order_id IS NOT NULL) THEN RAISE EXCEPTION 'canonical submission immutable';END IF;
 IF TG_OP='DELETE' THEN RETURN OLD;END IF;RETURN NEW;END$$;
CREATE TRIGGER sinpe_canonical_evidence_guard BEFORE INSERT OR UPDATE OR DELETE ON public.sinpe_payments FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.sinpe_submission_guard();
CREATE TRIGGER sinpe_no_truncate BEFORE TRUNCATE ON public.sinpe_payments FOR EACH STATEMENT EXECUTE FUNCTION twuanis_canonical_private.administrative_immutable();
CREATE TRIGGER sinpe_review_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON twuanis_canonical_private.sinpe_review_decisions FOR EACH STATEMENT EXECUTE FUNCTION twuanis_canonical_private.administrative_immutable();
CREATE FUNCTION twuanis_canonical_private.sinpe_pending_review(p_order uuid) RETURNS boolean LANGUAGE sql STABLE SET search_path=pg_catalog AS $$
 SELECT EXISTS(SELECT 1 FROM public.sinpe_payments p JOIN twuanis_canonical_private.offer_order_snapshots o ON o.id=p.canonical_order_id WHERE o.id=p_order AND p.created_at<=o.payment_deadline AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.sinpe_review_decisions d WHERE d.attempt_id=p.id))
$$;
CREATE FUNCTION twuanis_canonical_private.sinpe_lock_order(p_order uuid) RETURNS void LANGUAGE plpgsql SET search_path=pg_catalog AS $$DECLARE o twuanis_canonical_private.offer_order_snapshots%ROWTYPE;BEGIN
 SELECT * INTO STRICT o FROM twuanis_canonical_private.offer_order_snapshots WHERE id=p_order;
 IF o.listing_id IS NOT NULL THEN PERFORM id FROM public.listings WHERE id=o.listing_id FOR UPDATE;
 ELSIF o.job_id IS NOT NULL THEN PERFORM twuanis_canonical_private.lock_capacity_policy(false);PERFORM id FROM public.publisher_accounts WHERE owner_user_id=o.account_id FOR UPDATE;PERFORM id FROM twuanis_canonical_private.addon_import_jobs WHERE id=o.job_id FOR UPDATE;END IF;
 PERFORM id FROM twuanis_canonical_private.offer_order_snapshots WHERE id=p_order FOR UPDATE;
END$$;
CREATE FUNCTION public.submit_order_sinpe(p_order uuid,p_request uuid,p_account uuid,p_evidence jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=auth.uid();o twuanis_canonical_private.offer_order_snapshots%ROWTYPE;prior public.sinpe_payments%ROWTYPE;at_time timestamptz;result uuid;BEGIN
 IF actor IS NULL OR p_request IS NULL OR p_order IS NULL OR p_account IS NULL OR jsonb_typeof(p_evidence) IS DISTINCT FROM 'object' OR octet_length(p_evidence::text)>8000 OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_evidence) k WHERE k NOT IN('reference','senderName','senderPhone','claimedPaymentDate')) OR length(btrim(coalesce(p_evidence->>'reference',''))) NOT BETWEEN 1 AND 300 OR length(btrim(coalesce(p_evidence->>'senderName',''))) NOT BETWEEN 1 AND 300 THEN RAISE EXCEPTION 'bounded customer evidence required';END IF;
 PERFORM pg_advisory_xact_lock(3190,hashtext(actor::text||p_request::text));
 SELECT * INTO prior FROM public.sinpe_payments WHERE user_id=actor AND submission_request_id=p_request AND canonical_order_id IS NOT NULL;
 IF FOUND THEN IF (prior.canonical_order_id,prior.receiving_account_id,prior.submission_evidence) IS DISTINCT FROM(p_order,p_account,p_evidence) THEN RAISE EXCEPTION 'submission replay conflict';END IF;RETURN prior.id;END IF;
 SELECT * INTO STRICT o FROM twuanis_canonical_private.offer_order_snapshots WHERE id=p_order AND account_id=actor;
 PERFORM twuanis_canonical_private.sinpe_lock_order(p_order);at_time:=clock_timestamp();
 IF EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id=p_order) THEN RAISE EXCEPTION 'Order not eligible for submission';END IF;
 PERFORM id FROM twuanis_canonical_private.sinpe_receiving_accounts WHERE id=p_account AND enabled AND currency=o.currency FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'receiving currency unavailable';END IF;
 INSERT INTO public.sinpe_payments(user_id,canonical_order_id,submission_request_id,receiving_account_id,submission_evidence,amount,currency,sinpe_reference,sender_name,sender_phone,status,created_at,updated_at)
 VALUES(actor,p_order,p_request,p_account,p_evidence,(o.resolved_terms->>'total')::numeric,o.currency,p_evidence->>'reference',p_evidence->>'senderName',p_evidence->>'senderPhone','submitted',at_time,at_time) RETURNING id INTO result;
 RETURN result;
END$$;
CREATE FUNCTION public.review_order_sinpe(p_attempt uuid,p_request uuid,p_command jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
<<review_order_sinpe>>
DECLARE actor uuid;prior twuanis_canonical_private.sinpe_review_decisions%ROWTYPE;p public.sinpe_payments%ROWTYPE;o twuanis_canonical_private.offer_order_snapshots%ROWTYPE;disposition text;reason text;account uuid;reference text;amount numeric;currency text;received timestamptz;evidence text;did uuid:=gen_random_uuid();ack uuid;at_time timestamptz;BEGIN
 actor:=twuanis_canonical_private.assert_administrative_permission('payments.review');
 IF p_request IS NULL OR p_attempt IS NULL OR jsonb_typeof(p_command) IS DISTINCT FROM 'object' OR octet_length(p_command::text)>8000 OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_command) k WHERE k NOT IN('disposition','reason','receivingAccount','bankReference','amount','currency','receivedAt','bankEvidence')) THEN RAISE EXCEPTION 'bounded review required';END IF;
 PERFORM pg_advisory_xact_lock(3191,hashtext(actor::text||p_request::text));
 SELECT * INTO prior FROM twuanis_canonical_private.sinpe_review_decisions WHERE actor_id=actor AND request_id=p_request;
 IF FOUND THEN IF (prior.attempt_id,prior.command) IS DISTINCT FROM(p_attempt,p_command) THEN RAISE EXCEPTION 'review replay conflict';END IF;RETURN jsonb_build_object('id',prior.id,'disposition',prior.disposition,'acknowledgementId',prior.acknowledgement_id);END IF;
 SELECT * INTO STRICT p FROM public.sinpe_payments WHERE id=p_attempt AND canonical_order_id IS NOT NULL;
 PERFORM twuanis_canonical_private.sinpe_lock_order(p.canonical_order_id);
 PERFORM id FROM public.sinpe_payments WHERE id=p_attempt FOR UPDATE;
 IF EXISTS(SELECT 1 FROM twuanis_canonical_private.sinpe_review_decisions WHERE attempt_id=p_attempt) THEN RAISE EXCEPTION 'attempt already decided';END IF;
 SELECT * INTO STRICT o FROM twuanis_canonical_private.offer_order_snapshots WHERE id=p.canonical_order_id;
 disposition:=p_command->>'disposition';reason:=p_command->>'reason';at_time:=clock_timestamp();
 IF disposition IS NULL OR disposition NOT IN('APPROVED','REJECTED','RECEIVED_UNMATCHED') OR reason IS NULL OR reason NOT IN('verified','insufficient_evidence','reference_mismatch','amount_mismatch','currency_mismatch','late_receipt','late_submission','wrong_order','timing_not_established','order_already_paid') THEN RAISE EXCEPTION 'review reason required';END IF;
 IF disposition='REJECTED' THEN
  IF p_command - 'disposition' - 'reason'<>'{}'::jsonb OR reason NOT IN('insufficient_evidence','reference_mismatch') THEN RAISE EXCEPTION 'received money cannot be rejected';END IF;
 ELSE
  account:=(p_command->>'receivingAccount')::uuid;reference:=p_command->>'bankReference';currency:=p_command->>'currency';evidence:=p_command->>'bankEvidence';
  IF coalesce(p_command->>'amount','') !~ '^[0-9]+(\.[0-9]{1,2})?$' THEN RAISE EXCEPTION 'exact amount required';END IF;amount:=(p_command->>'amount')::numeric;
  IF account IS NULL OR reference IS NULL OR length(reference) NOT BETWEEN 1 AND 300 OR reference<>btrim(reference) OR currency IS NULL OR currency NOT IN('USD','CRC') OR evidence IS NULL OR length(btrim(evidence)) NOT BETWEEN 1 AND 2000 THEN RAISE EXCEPTION 'verified receiving-bank evidence required';END IF;
  IF nullif(p_command->>'receivedAt','') IS NOT NULL AND (p_command->>'receivedAt') !~ '(Z|[+-][0-9]{2}:[0-9]{2})$' THEN RAISE EXCEPTION 'verified receipt timezone required';END IF;
  received:=nullif(p_command->>'receivedAt','')::timestamptz;
  IF received IS NOT NULL AND (NOT isfinite(received) OR received>at_time) THEN RAISE EXCEPTION 'invalid verified receipt time';END IF;
  PERFORM id FROM twuanis_canonical_private.sinpe_receiving_accounts a WHERE a.id=account AND a.currency=review_order_sinpe.currency FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'verified receiving identity/currency missing';END IF;
  IF disposition='APPROVED' THEN
   IF reason<>'verified' OR account IS DISTINCT FROM p.receiving_account_id OR amount IS DISTINCT FROM(o.resolved_terms->>'total')::numeric OR currency IS DISTINCT FROM o.currency OR received IS NULL OR received>o.payment_deadline OR p.created_at>o.payment_deadline OR EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id=o.id) THEN RAISE EXCEPTION 'approval does not satisfy immutable Order';END IF;
   -- Same paid authority; Step9 supplies verified timing instead of backdating the review.
   ack:=gen_random_uuid();
   INSERT INTO twuanis_canonical_private.offer_paid_acknowledgements(id,order_id,request_id,source,payment_event_id,external_reference,amount,currency,acknowledged_at,authority)
   VALUES(ack,o.id,p_request,'sinpe',did,reference,amount,currency,at_time,'payments.review:'||actor::text);
  ELSIF reason='verified' THEN RAISE EXCEPTION 'unmatched reason required';END IF;
 END IF;
 INSERT INTO twuanis_canonical_private.sinpe_review_decisions(id,attempt_id,actor_id,request_id,command,disposition,reason,receiving_account_id,bank_reference,amount,currency,received_at,bank_evidence,decided_at,acknowledgement_id)
 VALUES(did,p_attempt,actor,p_request,p_command,disposition,reason,account,reference,amount,currency,received,evidence,at_time,ack);
 PERFORM twuanis_canonical_private.append_administrative_event(actor,CASE WHEN public.is_current_user_owner() THEN 'Owner' ELSE 'Payment Review' END,'payments.review','sinpe.review','payment',p_attempt,NULL,jsonb_build_object('decisionId',did,'disposition',disposition,'orderId',o.id,'acknowledgementId',ack),reason,p_request);
 RETURN jsonb_build_object('id',did,'disposition',disposition,'acknowledgementId',ack);
END$$;
-- Separate transaction call after paid acknowledgement; never part of payment truth.
CREATE TABLE twuanis_canonical_private.sinpe_fulfillment_attempts(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),order_id uuid NOT NULL REFERENCES twuanis_canonical_private.offer_order_snapshots(id),actor_id uuid NOT NULL,request_id uuid NOT NULL,result jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),UNIQUE(actor_id,request_id)
);
CREATE INDEX sinpe_fulfillment_order_page ON twuanis_canonical_private.sinpe_fulfillment_attempts(order_id,created_at DESC,id DESC);
ALTER TABLE twuanis_canonical_private.sinpe_fulfillment_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON twuanis_canonical_private.sinpe_fulfillment_attempts FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER sinpe_fulfillment_history BEFORE UPDATE OR DELETE OR TRUNCATE ON twuanis_canonical_private.sinpe_fulfillment_attempts FOR EACH STATEMENT EXECUTE FUNCTION twuanis_canonical_private.administrative_immutable();
CREATE FUNCTION public.retry_sinpe_fulfillment(p_order uuid,p_request uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid;prior twuanis_canonical_private.sinpe_fulfillment_attempts%ROWTYPE;o twuanis_canonical_private.offer_order_snapshots%ROWTYPE;a twuanis_canonical_private.offer_paid_acknowledgements%ROWTYPE;result jsonb;BEGIN
 actor:=twuanis_canonical_private.assert_administrative_permission('payments.review');
 IF p_request IS NULL OR p_order IS NULL THEN RAISE EXCEPTION 'bounded identity required';END IF;
 PERFORM pg_advisory_xact_lock(3192,hashtext(actor::text||p_request::text));
 SELECT * INTO prior FROM twuanis_canonical_private.sinpe_fulfillment_attempts WHERE actor_id=actor AND request_id=p_request;
 IF FOUND THEN IF prior.order_id<>p_order THEN RAISE EXCEPTION 'fulfillment request conflict';END IF;RETURN prior.result;END IF;
 SELECT * INTO STRICT o FROM twuanis_canonical_private.offer_order_snapshots WHERE id=p_order;
 SELECT a1.* INTO STRICT a FROM twuanis_canonical_private.offer_paid_acknowledgements a1 JOIN twuanis_canonical_private.sinpe_review_decisions d ON d.acknowledgement_id=a1.id WHERE a1.order_id=p_order AND d.disposition='APPROVED';
 IF o.target_type='package' THEN result:=jsonb_build_object('state','PENDING','reason','canonical_package_fulfillment_not_established');
 ELSE
  BEGIN
   result:=twuanis_canonical_private.fulfill_addon(o.id,a.payment_event_id,o.account_id,o.product_id,(o.resolved_terms->>'configurationId')::uuid,CASE WHEN o.job_id IS NOT NULL THEN 'operation' WHEN o.listing_id IS NOT NULL THEN 'listing' ELSE 'account' END,coalesce(o.job_id,o.listing_id,o.account_id),jsonb_build_object('currency',o.currency,'amount',o.resolved_terms->>'total'));
   result:=jsonb_build_object('state',CASE WHEN result->>'ok'='true' THEN 'COMPLETE' ELSE 'FAILED' END,'evidence',result);
  EXCEPTION WHEN OTHERS THEN result:=jsonb_build_object('state','FAILED','reason','fulfillment_revalidation_failed','sqlstate',SQLSTATE);
  END;
 END IF;
 INSERT INTO twuanis_canonical_private.sinpe_fulfillment_attempts(order_id,actor_id,request_id,result) VALUES(p_order,actor,p_request,result);
 PERFORM twuanis_canonical_private.append_administrative_event(actor,CASE WHEN public.is_current_user_owner() THEN 'Owner' ELSE 'Payment Review' END,'payments.review','sinpe.fulfillment','order',o.id,NULL,result,NULL,p_request);
 RETURN result;
END$$;
ALTER FUNCTION public.retry_sinpe_fulfillment(uuid,uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.retry_sinpe_fulfillment(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.retry_sinpe_fulfillment(uuid,uuid) TO authenticated;
CREATE FUNCTION twuanis_canonical_private.sinpe_projection(p_id uuid,p_admin boolean) RETURNS jsonb LANGUAGE sql STABLE SET search_path=pg_catalog AS $$
 SELECT jsonb_build_object('id',p.id,'orderId',p.canonical_order_id,'accountId',p.user_id,'submittedAt',p.created_at,'expectedAmount',o.resolved_terms->>'total','currency',o.currency,'deadline',o.payment_deadline,'lateEvidence',p.created_at>o.payment_deadline,'customerEvidence',p.submission_evidence,'receivingAccount',p.receiving_account_id,'state',coalesce(d.disposition,'REVIEW_PENDING'),'decisionAt',d.decided_at,'reason',d.reason,
 'fulfillmentState',CASE WHEN d.disposition<>'APPROVED' OR d.disposition IS NULL THEN 'NOT_ELIGIBLE' WHEN o.target_type='package' THEN 'PENDING' ELSE coalesce((SELECT f.result->>'state' FROM twuanis_canonical_private.sinpe_fulfillment_attempts f WHERE f.order_id=o.id ORDER BY f.created_at DESC,f.id DESC LIMIT 1),'PENDING') END,
 'review',CASE WHEN p_admin THEN jsonb_build_object('actorId',d.actor_id,'bankReference',d.bank_reference,'receivedAt',d.received_at,'amount',d.amount::text,'currency',d.currency,'bankEvidence',d.bank_evidence,'receivingAccount',d.receiving_account_id) ELSE NULL END,
 'order',CASE WHEN p_admin THEN twuanis_canonical_private.order_evidence(o.id) ELSE NULL END)
 FROM public.sinpe_payments p JOIN twuanis_canonical_private.offer_order_snapshots o ON o.id=p.canonical_order_id LEFT JOIN twuanis_canonical_private.sinpe_review_decisions d ON d.attempt_id=p.id WHERE p.id=p_id
$$;
CREATE FUNCTION public.read_order_sinpe(p_order uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$DECLARE o twuanis_canonical_private.offer_order_snapshots%ROWTYPE;BEGIN
 SELECT * INTO STRICT o FROM twuanis_canonical_private.offer_order_snapshots WHERE id=p_order AND account_id=auth.uid();
 RETURN jsonb_build_object('orderId',o.id,'productClass',o.resolved_terms->>'productClass','amount',o.resolved_terms->>'total','currency',o.currency,'deadline',o.payment_deadline,'expired',statement_timestamp()>o.payment_deadline,'paid',EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id=o.id),
 'accounts',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',a.id,'instructionsEN',a.instructions_en,'instructionsES',a.instructions_es)),'[]') FROM (SELECT * FROM twuanis_canonical_private.sinpe_receiving_accounts WHERE enabled AND currency=o.currency ORDER BY id LIMIT 10)a),
 'attempts',(SELECT coalesce(jsonb_agg(twuanis_canonical_private.sinpe_projection(p.id,false) ORDER BY p.created_at DESC,p.id DESC),'[]') FROM (SELECT id,created_at FROM public.sinpe_payments WHERE canonical_order_id=o.id ORDER BY created_at DESC,id DESC LIMIT 25)p));
END$$;
CREATE FUNCTION public.admin_sinpe_read(p_id uuid DEFAULT NULL,p_after uuid DEFAULT NULL,p_state text DEFAULT NULL,p_order uuid DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$DECLARE result jsonb;BEGIN
 PERFORM twuanis_canonical_private.assert_administrative_permission('payments.read');
 IF p_state IS NOT NULL AND p_state NOT IN('REVIEW_PENDING','APPROVED','RECEIVED_UNMATCHED','REJECTED') THEN RAISE EXCEPTION 'invalid state';END IF;
 IF p_id IS NOT NULL THEN RETURN twuanis_canonical_private.sinpe_projection(p_id,true);END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',p.id,'orderId',p.canonical_order_id,'submittedAt',p.created_at,'currency',p.currency,'expectedAmount',p.amount::text,'state',p.state,'lateEvidence',p.created_at>p.payment_deadline) ORDER BY p.id),'[]') INTO result FROM (
 SELECT p.*,o.payment_deadline,coalesce(d.disposition,'REVIEW_PENDING') state FROM public.sinpe_payments p JOIN twuanis_canonical_private.offer_order_snapshots o ON o.id=p.canonical_order_id LEFT JOIN twuanis_canonical_private.sinpe_review_decisions d ON d.attempt_id=p.id WHERE p.canonical_order_id IS NOT NULL AND(p_after IS NULL OR p.id>p_after)AND(p_order IS NULL OR p.canonical_order_id=p_order)AND(p_state IS NULL OR coalesce(d.disposition,'REVIEW_PENDING')=p_state)ORDER BY p.id LIMIT 26)p;
 RETURN result;
END$$;
ALTER TABLE twuanis_canonical_private.sinpe_receiving_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE twuanis_canonical_private.sinpe_review_decisions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON twuanis_canonical_private.sinpe_receiving_accounts,twuanis_canonical_private.sinpe_review_decisions FROM PUBLIC,anon,authenticated,service_role;

-- Additive Step9 replacement; original039 artifact remains unchanged.
CREATE OR REPLACE FUNCTION twuanis_canonical_private.create_offer_order_snapshot(p_account uuid,p_request uuid,p_kind text,p_product text,p_currency text,p_listing uuid DEFAULT NULL,p_job uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SET search_path=pg_catalog AS $$
DECLARE prior twuanis_canonical_private.offer_order_snapshots%ROWTYPE;l public.listings%ROWTYPE;quantity integer:=1;at_time timestamptz;terms jsonb;oid uuid;target_kind text;job_configuration uuid;j twuanis_canonical_private.addon_import_jobs%ROWTYPE;x jsonb;version bigint;standard_tier jsonb;effective_tier jsonb;
BEGIN
 IF p_account IS NULL OR p_request IS NULL OR p_kind IS NULL OR p_kind NOT IN ('package','addon') OR p_product IS NULL OR length(p_product)>150 THEN RAISE EXCEPTION 'trusted bounded identity required'; END IF;
 PERFORM pg_advisory_xact_lock(3162,hashtext(jsonb_build_array(p_account,p_request)::text));
 SELECT * INTO prior FROM twuanis_canonical_private.offer_order_snapshots WHERE account_id=p_account AND request_id=p_request;
 IF FOUND THEN
  IF (prior.target_type,prior.product_id,prior.currency,prior.listing_id,prior.job_id) IS DISTINCT FROM (p_kind,p_product,p_currency,p_listing,p_job) THEN RAISE EXCEPTION 'order replay conflict'; END IF;
  RETURN jsonb_build_object('id',prior.id,'terms',prior.resolved_terms,'createdAt',prior.created_at,'paymentDeadline',prior.payment_deadline,'state',twuanis_canonical_private.offer_order_state(prior.id,clock_timestamp()),'expired',twuanis_canonical_private.offer_order_state(prior.id,clock_timestamp())='expired','replayed',true);
 END IF;
 PERFORM pg_advisory_xact_lock(3161,hashtext(p_kind||':'||p_product));
 IF p_kind='package' THEN
  IF p_listing IS NOT NULL OR p_job IS NOT NULL THEN RAISE EXCEPTION 'package targets account'; END IF;
  PERFORM id FROM twuanis_canonical_private.intelligence_packages WHERE id=p_product FOR SHARE;
  PERFORM package_id FROM twuanis_canonical_private.intelligence_package_prices WHERE package_id=p_product FOR SHARE;
 ELSE
  SELECT target INTO STRICT target_kind FROM twuanis_canonical_private.addon_products WHERE id=p_product FOR SHARE;
  IF target_kind='listing' THEN
   IF p_listing IS NULL OR p_job IS NOT NULL THEN RAISE EXCEPTION 'listing target required'; END IF;
   SELECT * INTO STRICT l FROM public.listings WHERE id=p_listing FOR UPDATE;
   IF l.owner_id IS DISTINCT FROM p_account OR l.canonical_domain_version IS DISTINCT FROM 1 OR l.listing_status='deleted' THEN RAISE EXCEPTION 'owned canonical listing required'; END IF;
   at_time:=clock_timestamp();
   IF EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_order_snapshots s WHERE s.listing_id=p_listing AND (
    ((s.payment_deadline>at_time OR twuanis_canonical_private.sinpe_pending_review(s.id)) AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_paid_acknowledgements a WHERE a.order_id=s.id))
    OR (EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_paid_acknowledgements a WHERE a.order_id=s.id)
     AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_fulfillments f WHERE f.purchase_id=s.id AND f.account_id=s.account_id AND f.product_id=s.product_id AND f.configuration_id=(s.resolved_terms->>'configurationId')::uuid AND f.target_kind='listing' AND f.target_id=s.listing_id AND f.result->>'ok'='true'))
   )) THEN RAISE EXCEPTION 'pending listing acquisition'; END IF;
   IF EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_placement_rights WHERE listing_id=p_listing AND product_id<>p_product AND activated_at<=at_time AND expires_at>at_time AND revoked_at IS NULL) THEN RAISE EXCEPTION 'incompatible active add-on'; END IF;
   IF l.listing_status<>'active' AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_placement_rights WHERE listing_id=p_listing AND product_id=p_product AND activated_at<=at_time AND expires_at>at_time AND revoked_at IS NULL) THEN RAISE EXCEPTION 'publication required for new placement'; END IF;
  ELSIF target_kind='operation' THEN
   IF p_job IS NULL OR p_listing IS NOT NULL THEN RAISE EXCEPTION 'server-owned job required'; END IF;
   -- Match existing fulfillment lock order: capacity policy -> publisher -> job.
   PERFORM twuanis_canonical_private.lock_capacity_policy(false);
   PERFORM id FROM public.publisher_accounts WHERE owner_user_id=p_account FOR UPDATE;
   SELECT * INTO STRICT j FROM twuanis_canonical_private.addon_import_jobs WHERE id=p_job AND account_id=p_account FOR UPDATE;
   quantity:=j.accepted_count;job_configuration:=j.configuration_id;
   IF EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_import_results WHERE job_id=p_job) THEN RAISE EXCEPTION 'bulk job already fulfilled'; END IF;
   at_time:=clock_timestamp();
   IF EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_order_snapshots o WHERE o.job_id=p_job AND (o.payment_deadline>at_time OR twuanis_canonical_private.sinpe_pending_review(o.id) OR EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_paid_acknowledgements a WHERE a.order_id=o.id))) THEN RAISE EXCEPTION 'bulk acquisition in flight'; END IF;
   IF j.validator_version<>'canonical-customer-v1' OR j.total IS NULL OR j.currency IS DISTINCT FROM p_currency THEN RAISE EXCEPTION 'accepted job unavailable'; END IF;
   -- Revalidate independently; this creates/reserves no listing or capacity.
   LOCK TABLE public.ontology_terms,public.ontology_relationships,twuanis_canonical_private.accessibility_identity IN SHARE MODE;
   FOR x IN SELECT value FROM jsonb_array_elements(j.accepted_rows) LOOP PERFORM twuanis_canonical_private.addon_customer_input(x->'input'); END LOOP;
   PERFORM twuanis_canonical_private.addon_publication_capacity(p_account,quantity);
  ELSE
   IF p_listing IS NOT NULL OR p_job IS NOT NULL THEN RAISE EXCEPTION 'account target required'; END IF;
  END IF;
 END IF;
 at_time:=clock_timestamp();
 terms:=twuanis_canonical_private.resolve_offer_price(p_kind,p_product,p_currency,quantity,at_time);
 IF terms->>'available' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'no authoritative purchasable price'; END IF;
 IF p_job IS NOT NULL AND job_configuration IS DISTINCT FROM (terms->>'configurationId')::uuid THEN RAISE EXCEPTION 'job configuration is no longer current; new authoritative preflight required'; END IF;
 -- Complete immutable evidence without a second resolver or Order identity.
 IF p_kind='package' THEN SELECT c.version INTO STRICT version FROM twuanis_canonical_private.intelligence_package_configurations c WHERE c.id=(terms->>'configurationId')::uuid;
 ELSE SELECT c.version INTO STRICT version FROM twuanis_canonical_private.addon_configurations c WHERE c.id=(terms->>'configurationId')::uuid; END IF;
 IF p_job IS NOT NULL THEN
  SELECT jsonb_build_object('lower',lower_quantity,'upper',upper_quantity,'unitRate',unit_rate::text) INTO STRICT standard_tier FROM twuanis_canonical_private.addon_quantity_tiers WHERE configuration_id=job_configuration AND currency=p_currency AND quantity BETWEEN lower_quantity AND upper_quantity;
  IF terms->>'source'='OFFER' THEN
   SELECT jsonb_build_object('lower',lower_quantity,'upper',upper_quantity,'unitRate',unit_rate::text) INTO STRICT effective_tier FROM twuanis_canonical_private.offer_quantity_tiers WHERE configuration_id=(terms->>'offerConfigurationId')::uuid AND currency=p_currency AND quantity BETWEEN lower_quantity AND upper_quantity;
  ELSE effective_tier:=standard_tier;END IF;
 END IF;
 terms:=terms||jsonb_build_object('orderContractVersion',1,'configurationVersion',version::text,
 'productClass',CASE WHEN p_kind='package' THEN 'PACKAGE' WHEN p_job IS NOT NULL THEN 'BULK_IMPORT' WHEN p_listing IS NOT NULL THEN 'LISTING_ADDON' ELSE 'FOUNDING_MEMBERSHIP' END,
 'targetKind',CASE WHEN p_listing IS NOT NULL THEN 'listing' WHEN p_job IS NOT NULL THEN 'job' ELSE 'account' END,'targetId',coalesce(p_listing,p_job,p_account),
 'standardTotal',((terms->>'standardRate')::numeric*quantity)::text,'standardTier',standard_tier,'purchasedTier',effective_tier,
 'offerVersion',(SELECT c.version::text FROM twuanis_canonical_private.offer_configurations c WHERE c.id=(terms->>'offerConfigurationId')::uuid),
 'acceptedJob',CASE WHEN p_job IS NOT NULL THEN jsonb_build_object('id',j.id,'acceptedQuantity',j.accepted_count,'fingerprint',j.input_fingerprint,'validator',j.validator_version,'publicationEvidence',j.publication_evidence) ELSE NULL END);
 -- Universal V1: every unpaid customer Order has the same 24-hour deadline.
 INSERT INTO twuanis_canonical_private.offer_order_snapshots(account_id,request_id,target_type,product_id,listing_id,job_id,currency,resolved_terms,created_at,payment_deadline)
 VALUES(p_account,p_request,p_kind,p_product,p_listing,p_job,p_currency,terms,at_time,at_time+interval '24 hours') RETURNING id INTO oid;
 RETURN jsonb_build_object('id',oid,'terms',terms,'createdAt',at_time,'paymentDeadline',at_time+interval '24 hours','expired',false,'replayed',false);
END $$;


DO $$DECLARE f text;BEGIN
 FOREACH f IN ARRAY ARRAY[
 'twuanis_canonical_private.sinpe_account_guard()',
 'twuanis_canonical_private.sinpe_submission_guard()',
 'twuanis_canonical_private.sinpe_pending_review(uuid)',
 'twuanis_canonical_private.sinpe_lock_order(uuid)',
 'twuanis_canonical_private.sinpe_projection(uuid,boolean)',
 'public.submit_order_sinpe(uuid,uuid,uuid,jsonb)',
 'public.review_order_sinpe(uuid,uuid,jsonb)',
 'public.read_order_sinpe(uuid)',
 'public.admin_sinpe_read(uuid,uuid,text,uuid)'] LOOP
 EXECUTE format('ALTER FUNCTION %s OWNER TO postgres',f);
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',f);
 END LOOP;
END$$;
GRANT EXECUTE ON FUNCTION public.submit_order_sinpe(uuid,uuid,uuid,jsonb),public.review_order_sinpe(uuid,uuid,jsonb),public.read_order_sinpe(uuid),public.admin_sinpe_read(uuid,uuid,text,uuid) TO authenticated;
COMMIT;
