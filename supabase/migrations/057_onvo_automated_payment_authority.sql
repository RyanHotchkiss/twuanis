-- LOCAL ONLY. Provider transport/evidence extends existing paid and entitlement authority.
BEGIN;
ALTER TABLE twuanis_canonical_private.entitlement_terms ALTER COLUMN actor_id DROP NOT NULL;
ALTER TABLE twuanis_canonical_private.entitlement_terms ADD COLUMN execution_authority text NOT NULL DEFAULT 'HUMAN' CHECK(execution_authority IN('HUMAN','ONVO'));
ALTER TABLE twuanis_canonical_private.entitlement_terms ADD CONSTRAINT entitlement_execution_actor CHECK((execution_authority='HUMAN' AND actor_id IS NOT NULL) OR(execution_authority='ONVO' AND actor_id IS NULL AND source='PURCHASED'));
CREATE OR REPLACE FUNCTION twuanis_canonical_private.commit_entitlement_term(
 p_account uuid,p_class text,p_product text,p_configuration uuid,p_listing uuid,
 p_source text,p_order uuid,p_ack uuid,p_actor uuid,p_request uuid,p_start timestamptz,p_end timestamptz,p_reason text,p_note text
) RETURNS uuid LANGUAGE plpgsql VOLATILE SET search_path=pg_catalog AS $$
DECLARE tid uuid:=gen_random_uuid();p twuanis_canonical_private.addon_products%ROWTYPE;
 l public.listings%ROWTYPE;tail timestamptz;at_time timestamptz:=clock_timestamp();
BEGIN
 IF p_account IS NULL OR p_request IS NULL OR p_start IS NULL OR NOT isfinite(p_start) THEN RAISE EXCEPTION 'exact entitlement identities and interval required';END IF;
 IF p_source='PURCHASED' AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_order_snapshots o JOIN twuanis_canonical_private.offer_paid_acknowledgements a ON a.order_id=o.id WHERE o.id=p_order AND a.id=p_ack AND o.account_id=p_account AND o.product_id=p_product AND (o.resolved_terms->>'configurationId')::uuid=p_configuration AND o.listing_id IS NOT DISTINCT FROM p_listing AND o.resolved_terms->>'productClass'=p_class) THEN RAISE EXCEPTION 'exact paid source required';END IF;
 IF p_actor IS NULL AND (p_source<>'PURCHASED' OR NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE id=p_ack AND source='onvo')) THEN RAISE EXCEPTION 'system execution requires ONVO paid authority';END IF;
 IF p_class='PACKAGE' THEN
  PERFORM id FROM twuanis_canonical_private.intelligence_package_configurations WHERE id=p_configuration AND package_id=p_product;
  IF NOT FOUND THEN RAISE EXCEPTION 'canonical package configuration required';END IF;
 ELSE
  SELECT * INTO STRICT p FROM twuanis_canonical_private.addon_products WHERE id=p_product;
  PERFORM id FROM twuanis_canonical_private.addon_configurations WHERE id=p_configuration AND product_id=p_product;
  IF NOT FOUND OR (p_class='LISTING_ADDON' AND p.term_kind<>'elapsed_days') OR (p_class='FOUNDING_MEMBERSHIP' AND p.term_kind<>'lifetime') THEN RAISE EXCEPTION 'canonical entitlement product required';END IF;
  IF p.behavior='homepage_carousel' THEN PERFORM capacity FROM twuanis_canonical_private.addon_homepage_capacity WHERE id FOR UPDATE;END IF;
  IF p_class='LISTING_ADDON' THEN
   SELECT * INTO STRICT l FROM public.listings WHERE id=p_listing FOR UPDATE;
   IF l.owner_id IS DISTINCT FROM p_account OR l.canonical_domain_version IS DISTINCT FROM 1 OR l.listing_status='deleted' THEN RAISE EXCEPTION 'owned canonical target required';END IF;
   IF l.listing_status<>'active' AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_placement_rights WHERE listing_id=p_listing AND product_id=p_product AND effective_intervals @> at_time) THEN RAISE EXCEPTION 'publication required for new placement';END IF;
   -- Append only at commitment. No later operation compacts the committed calendar.
   SELECT max(t.ends_at) INTO tail FROM twuanis_canonical_private.entitlement_terms t WHERE t.listing_id=p_listing AND t.product_id=p_product AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.entitlement_revocations r WHERE r.term_id=t.id);
   IF tail>p_start THEN RAISE EXCEPTION 'interval must follow committed same-product time';END IF;
   IF EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_placement_rights WHERE listing_id=p_listing AND product_id<>p_product AND effective_intervals && tstzmultirange(tstzrange(p_start,p_end,'[)'))) THEN RAISE EXCEPTION 'incompatible add-on interval';END IF;
   IF p.behavior='homepage_carousel' THEN PERFORM twuanis_canonical_private.assert_homepage_interval(p_start,p_end);END IF;
  ELSE
   PERFORM id FROM auth.users WHERE id=p_account FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'recipient required';END IF;
  END IF;
 END IF;
 INSERT INTO twuanis_canonical_private.entitlement_terms(id,account_id,product_class,product_id,configuration_id,listing_id,source,order_id,acknowledgement_id,actor_id,request_id,reason,note,starts_at,ends_at,execution_authority)
 VALUES(tid,p_account,p_class,p_product,p_configuration,p_listing,p_source,p_order,p_ack,p_actor,p_request,p_reason,p_note,p_start,p_end,CASE WHEN p_actor IS NULL THEN 'ONVO' ELSE 'HUMAN' END);
 IF p_class='PACKAGE' THEN
  INSERT INTO twuanis_canonical_private.intelligence_package_rights(id,account_id,package_id,configuration_id,starts_at,ends_at,provenance) VALUES(tid,p_account,p_product,p_configuration,p_start,p_end,p_source||':'||tid::text);
 ELSIF p_class='LISTING_ADDON' THEN PERFORM twuanis_canonical_private.refresh_placement_terms(p_listing,p_product);
 ELSE
  INSERT INTO twuanis_canonical_private.addon_founder_rights(account_id,product_id,configuration_id,activated_at,purchase_id)
  VALUES(p_account,p_product,p_configuration,p_start,p_order)
  ON CONFLICT(account_id) DO UPDATE SET activated_at=(SELECT min(x.starts_at) FROM twuanis_canonical_private.entitlement_terms x WHERE x.account_id=p_account AND x.product_class='FOUNDING_MEMBERSHIP' AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.entitlement_revocations r WHERE r.term_id=x.id)),revoked_at=NULL,purchase_id=coalesce(EXCLUDED.purchase_id,twuanis_canonical_private.addon_founder_rights.purchase_id);
 END IF;
 RETURN tid;
END $$;

CREATE TABLE twuanis_canonical_private.onvo_intents(
 order_id uuid PRIMARY KEY REFERENCES twuanis_canonical_private.offer_order_snapshots(id),provider_account text NOT NULL,mode text NOT NULL CHECK(mode IN('test','live')),receiving_account uuid NOT NULL REFERENCES twuanis_canonical_private.sinpe_receiving_accounts(id),intent_id text UNIQUE,confirmation_claimed boolean NOT NULL DEFAULT false,state text NOT NULL DEFAULT 'RESERVED' CHECK(state IN('RESERVED','BOUND','UNCERTAIN')),created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE twuanis_canonical_private.onvo_inbox(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),digest text UNIQUE NOT NULL CHECK(digest~'^[0-9a-f]{64}$'),event jsonb NOT NULL,received_at timestamptz NOT NULL DEFAULT clock_timestamp(),processed_at timestamptz,result jsonb,attempts integer NOT NULL DEFAULT 0,next_attempt timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE twuanis_canonical_private.sinpe_external_claims(
 receiving_account uuid NOT NULL REFERENCES twuanis_canonical_private.sinpe_receiving_accounts(id),bank_reference text NOT NULL,source text NOT NULL CHECK(source IN('SINPE_REVIEW','ONVO')),source_id uuid NOT NULL,PRIMARY KEY(receiving_account,bank_reference)
);
INSERT INTO twuanis_canonical_private.sinpe_external_claims SELECT receiving_account_id,bank_reference,'SINPE_REVIEW',id FROM twuanis_canonical_private.sinpe_review_decisions WHERE disposition IN('APPROVED','RECEIVED_UNMATCHED');
CREATE FUNCTION twuanis_canonical_private.claim_manual_sinpe_event() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$BEGIN
 IF NEW.disposition IN('APPROVED','RECEIVED_UNMATCHED') THEN INSERT INTO twuanis_canonical_private.sinpe_external_claims VALUES(NEW.receiving_account_id,NEW.bank_reference,'SINPE_REVIEW',NEW.id);END IF;RETURN NEW;END$$;
CREATE TRIGGER sinpe_claim_shared_event BEFORE INSERT ON twuanis_canonical_private.sinpe_review_decisions FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.claim_manual_sinpe_event();
CREATE TABLE twuanis_canonical_private.onvo_receipts(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),order_id uuid NOT NULL REFERENCES twuanis_canonical_private.offer_order_snapshots(id),provider_account text NOT NULL,mode text NOT NULL,transaction_id text NOT NULL,bank_reference text NOT NULL,received_at timestamptz,processed_at timestamptz NOT NULL DEFAULT clock_timestamp(),amount numeric NOT NULL CHECK(amount>0),currency text NOT NULL,disposition text NOT NULL CHECK(disposition IN('APPROVED','RECEIVED_UNMATCHED','NEEDS_RESOLUTION')),reason text,acknowledgement_id uuid REFERENCES twuanis_canonical_private.offer_paid_acknowledgements(id),UNIQUE(provider_account,mode,transaction_id)
);
CREATE TABLE twuanis_canonical_private.onvo_fulfillment_jobs(order_id uuid PRIMARY KEY REFERENCES twuanis_canonical_private.offer_order_snapshots(id),state text NOT NULL DEFAULT 'PENDING' CHECK(state IN('PENDING','COMPLETE')),attempts integer NOT NULL DEFAULT 0,next_attempt timestamptz NOT NULL DEFAULT clock_timestamp());
CREATE TABLE twuanis_canonical_private.onvo_fulfillment_attempts(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),order_id uuid NOT NULL REFERENCES twuanis_canonical_private.offer_order_snapshots(id),created_at timestamptz NOT NULL DEFAULT clock_timestamp(),result jsonb NOT NULL);
DO $$DECLARE t text;BEGIN FOREACH t IN ARRAY ARRAY['onvo_intents','onvo_inbox','sinpe_external_claims','onvo_receipts','onvo_fulfillment_jobs','onvo_fulfillment_attempts'] LOOP
 EXECUTE format('ALTER TABLE twuanis_canonical_private.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON twuanis_canonical_private.%I FROM PUBLIC,anon,authenticated,service_role',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['sinpe_external_claims','onvo_receipts','onvo_fulfillment_attempts'] LOOP EXECUTE format('CREATE TRIGGER immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON twuanis_canonical_private.%I FOR EACH STATEMENT EXECUTE FUNCTION twuanis_canonical_private.administrative_immutable()',t);END LOOP;END$$;
REVOKE ALL ON FUNCTION twuanis_canonical_private.claim_manual_sinpe_event() FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.onvo_service_command(p_operation text,p_command jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE o twuanis_canonical_private.offer_order_snapshots%ROWTYPE;i twuanis_canonical_private.onvo_intents%ROWTYPE;r twuanis_canonical_private.onvo_receipts%ROWTYPE;c twuanis_canonical_private.intelligence_package_configurations%ROWTYPE;j twuanis_canonical_private.onvo_fulfillment_jobs%ROWTYPE;tid uuid;aid uuid;rid uuid:=gen_random_uuid();start_at timestamptz;end_at timestamptz;received timestamptz;amount numeric;currency text;disposition text;reason text;result jsonb;inbox uuid;
BEGIN
 IF p_command IS NULL OR jsonb_typeof(p_command)<>'object' OR octet_length(p_command::text)>16384 THEN RAISE EXCEPTION 'bounded service command required';END IF;
 IF p_operation='unassociated' THEN
 SELECT id INTO inbox FROM twuanis_canonical_private.onvo_inbox WHERE digest=p_command->>'digest';IF FOUND THEN RETURN jsonb_build_object('state','NEEDS_RESOLUTION','id',inbox);END IF;
 IF NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.sinpe_receiving_accounts WHERE id=(p_command->>'receivingAccount')::uuid AND enabled) THEN RAISE EXCEPTION 'canonical receiving account required';END IF;
 INSERT INTO twuanis_canonical_private.sinpe_external_claims VALUES((p_command->>'receivingAccount')::uuid,p_command->>'reference','ONVO',rid);
 INSERT INTO twuanis_canonical_private.onvo_inbox(id,digest,event,processed_at,result)VALUES(rid,p_command->>'digest',jsonb_build_object('type','UNASSOCIATED','providerAccount',p_command->>'providerAccount','mode',p_command->>'mode','transactionId',p_command->>'transactionId','reference',p_command->>'reference','amount',p_command->>'amount','currency',p_command->>'currency','receivedAt',p_command->>'receivedAt'),clock_timestamp(),jsonb_build_object('state','NEEDS_RESOLUTION'));
 RETURN jsonb_build_object('state','NEEDS_RESOLUTION','id',rid);
 ELSIF p_operation='inbox' THEN
 INSERT INTO twuanis_canonical_private.onvo_inbox(digest,event)VALUES(p_command->>'digest',p_command->'event') ON CONFLICT(digest)DO NOTHING;
 SELECT id INTO inbox FROM twuanis_canonical_private.onvo_inbox WHERE digest=p_command->>'digest';RETURN jsonb_build_object('id',inbox);
 ELSIF p_operation='inbox_fail' THEN UPDATE twuanis_canonical_private.onvo_inbox SET attempts=attempts+1,next_attempt=clock_timestamp()+interval '1 minute',result=jsonb_build_object('state','RETRY','reason','provider_evidence_unavailable') WHERE id=(p_command->>'id')::uuid AND processed_at IS NULL;RETURN jsonb_build_object('ok',true);
 ELSIF p_operation='inbox_done' THEN UPDATE twuanis_canonical_private.onvo_inbox SET processed_at=clock_timestamp(),result=p_command->'result' WHERE id=(p_command->>'id')::uuid AND processed_at IS NULL;RETURN jsonb_build_object('ok',true);
 ELSIF p_operation='work' THEN RETURN jsonb_build_object('events',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'event',event)),'[]')FROM(SELECT * FROM twuanis_canonical_private.onvo_inbox WHERE processed_at IS NULL AND next_attempt<=clock_timestamp() ORDER BY received_at LIMIT 20)x),'fulfillments',(SELECT coalesce(jsonb_agg(order_id),'[]')FROM(SELECT order_id FROM twuanis_canonical_private.onvo_fulfillment_jobs WHERE state='PENDING' AND next_attempt<=clock_timestamp() ORDER BY next_attempt LIMIT 20)x));
 END IF;
 IF p_operation IN('lookup','lookup_order') THEN
 SELECT * INTO i FROM twuanis_canonical_private.onvo_intents WHERE (p_operation='lookup' AND intent_id=p_command->>'intentId') OR(p_operation='lookup_order' AND order_id=(p_command->>'orderId')::uuid);IF NOT FOUND THEN RETURN NULL;END IF;
 ELSE SELECT * INTO STRICT o FROM twuanis_canonical_private.offer_order_snapshots WHERE id=(p_command->>'orderId')::uuid;
 END IF;
 IF p_operation='reserve' THEN
 IF o.account_id IS DISTINCT FROM (p_command->>'accountId')::uuid OR o.currency<>'CRC' OR o.target_type<>'package' OR NOT public.customer_commerce_ready() OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=o.account_id AND email_confirmed_at IS NOT NULL) OR clock_timestamp()>o.payment_deadline OR EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id=o.id) THEN RAISE EXCEPTION 'eligible confirmed owned CRC Order required';END IF;
 IF NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.sinpe_receiving_accounts bank WHERE bank.id=(p_command->>'receivingAccount')::uuid AND bank.enabled AND bank.currency='CRC') THEN RAISE EXCEPTION 'canonical receiving identity required';END IF;
 INSERT INTO twuanis_canonical_private.onvo_intents(order_id,provider_account,mode,receiving_account)VALUES(o.id,p_command->>'providerAccount',p_command->>'mode',(p_command->>'receivingAccount')::uuid)ON CONFLICT(order_id)DO NOTHING;
 SELECT * INTO STRICT i FROM twuanis_canonical_private.onvo_intents WHERE order_id=o.id FOR UPDATE;
 IF (i.provider_account,i.mode,i.receiving_account) IS DISTINCT FROM(p_command->>'providerAccount',p_command->>'mode',(p_command->>'receivingAccount')::uuid) THEN RAISE EXCEPTION 'provider reservation conflict';END IF;
 -- Claim the one POST opportunity before network I/O. Unknown outcomes never repeat it.
 IF i.state='RESERVED' THEN UPDATE twuanis_canonical_private.onvo_intents SET state='UNCERTAIN' WHERE order_id=o.id;result:=jsonb_build_object('create',true);ELSE result:=jsonb_build_object('create',false);END IF;
 RETURN result||jsonb_build_object('intentId',i.intent_id,'order',jsonb_build_object('id',o.id,'currency',o.currency,'amount',o.resolved_terms->>'total','createdAt',o.created_at,'deadline',o.payment_deadline));
 END IF;
 IF p_operation NOT IN('lookup','lookup_order') THEN SELECT * INTO STRICT i FROM twuanis_canonical_private.onvo_intents WHERE order_id=o.id FOR UPDATE;ELSE SELECT * INTO STRICT o FROM twuanis_canonical_private.offer_order_snapshots WHERE id=i.order_id;END IF;
 IF p_operation='bind' THEN
 IF i.intent_id IS NOT NULL AND i.intent_id IS DISTINCT FROM p_command->>'intentId' THEN RAISE EXCEPTION 'intent binding conflict';END IF;
 UPDATE twuanis_canonical_private.onvo_intents SET intent_id=p_command->>'intentId',state='BOUND' WHERE order_id=o.id;RETURN jsonb_build_object('ok',true);
 ELSIF p_operation='confirmation' THEN
 IF i.confirmation_claimed THEN RETURN jsonb_build_object('confirm',false);END IF;UPDATE twuanis_canonical_private.onvo_intents SET confirmation_claimed=true WHERE order_id=o.id;RETURN jsonb_build_object('confirm',true);
 ELSIF p_operation IN('lookup','lookup_order') THEN RETURN jsonb_build_object('order',jsonb_build_object('id',o.id,'currency',o.currency,'amount',o.resolved_terms->>'total','createdAt',o.created_at,'deadline',o.payment_deadline),'intentId',i.intent_id,'providerAccount',i.provider_account,'mode',i.mode);
 ELSIF p_operation='receipt' THEN
 IF i.intent_id IS DISTINCT FROM p_command->>'intentId' OR i.provider_account IS DISTINCT FROM p_command->>'providerAccount' OR i.mode IS DISTINCT FROM p_command->>'mode' THEN RAISE EXCEPTION 'provider binding mismatch';END IF;
 PERFORM pg_advisory_xact_lock(3257,hashtext(i.provider_account||':'||i.mode||':'||(p_command->>'transactionId')));
 SELECT * INTO r FROM twuanis_canonical_private.onvo_receipts WHERE provider_account=i.provider_account AND mode=i.mode AND transaction_id=p_command->>'transactionId';
 IF FOUND THEN IF r.order_id<>o.id OR r.bank_reference IS DISTINCT FROM p_command->>'reference' OR r.amount IS DISTINCT FROM(p_command->>'amount')::numeric OR r.currency IS DISTINCT FROM p_command->>'currency' THEN RAISE EXCEPTION 'external event reuse conflict';END IF;RETURN jsonb_build_object('id',r.id,'disposition',r.disposition,'acknowledgementId',r.acknowledgement_id);END IF;
 PERFORM id FROM twuanis_canonical_private.offer_order_snapshots WHERE id=o.id FOR UPDATE;
 received:=(p_command->>'receivedAt')::timestamptz;amount:=(p_command->>'amount')::numeric;currency:=p_command->>'currency';reason:=NULL;
 IF received IS NULL THEN disposition:='NEEDS_RESOLUTION';reason:='missing_receipt_time';
 ELSIF NOT isfinite(received) OR received>clock_timestamp() THEN RAISE EXCEPTION 'invalid provider receipt time';
 ELSIF amount IS DISTINCT FROM(o.resolved_terms->>'total')::numeric OR currency IS DISTINCT FROM o.currency THEN disposition:='RECEIVED_UNMATCHED';reason:='amount_or_currency_mismatch';
 ELSIF received<o.created_at OR received>o.payment_deadline THEN disposition:='RECEIVED_UNMATCHED';reason:='outside_order_window';
 ELSIF EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id=o.id) THEN disposition:='RECEIVED_UNMATCHED';reason:='order_already_paid';
 ELSE disposition:='APPROVED';END IF;
 INSERT INTO twuanis_canonical_private.sinpe_external_claims VALUES(i.receiving_account,p_command->>'reference','ONVO',rid);
 IF disposition='APPROVED' THEN
 aid:=gen_random_uuid();INSERT INTO twuanis_canonical_private.offer_paid_acknowledgements(id,order_id,request_id,source,payment_event_id,external_reference,amount,currency,acknowledged_at,authority)VALUES(aid,o.id,rid,'onvo',rid,p_command->>'reference',amount,currency,clock_timestamp(),'ONVO:'||i.provider_account||':'||i.mode);
 INSERT INTO twuanis_canonical_private.onvo_fulfillment_jobs(order_id)VALUES(o.id)ON CONFLICT DO NOTHING;END IF;
 INSERT INTO twuanis_canonical_private.onvo_receipts(id,order_id,provider_account,mode,transaction_id,bank_reference,received_at,amount,currency,disposition,reason,acknowledgement_id)VALUES(rid,o.id,i.provider_account,i.mode,p_command->>'transactionId',p_command->>'reference',received,amount,currency,disposition,reason,aid);
 RETURN jsonb_build_object('id',rid,'disposition',disposition,'acknowledgementId',aid);
 ELSIF p_operation='fulfill' THEN
 SELECT * INTO STRICT j FROM twuanis_canonical_private.onvo_fulfillment_jobs WHERE order_id=o.id FOR UPDATE;
 IF j.state='COMPLETE' THEN RETURN jsonb_build_object('state','COMPLETE','replayed',true);END IF;
 BEGIN
 SELECT id INTO STRICT aid FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id=o.id AND source='onvo';
 PERFORM pg_advisory_xact_lock(3200,hashtext(o.id::text));SELECT id INTO tid FROM twuanis_canonical_private.entitlement_terms WHERE order_id=o.id;
 IF tid IS NULL THEN
 SELECT * INTO STRICT c FROM twuanis_canonical_private.intelligence_package_configurations WHERE id=(o.resolved_terms->>'configurationId')::uuid AND package_id=o.product_id;
 IF o.target_type<>'package' OR o.resolved_terms->'terms'->'capabilities' IS DISTINCT FROM to_jsonb(c.capabilities) OR o.resolved_terms->'terms'->>'quantity'<>'1' OR o.resolved_terms->'terms'->>'unit' NOT IN('day','month') THEN RAISE EXCEPTION 'pinned Package contract mismatch';END IF;
 IF o.resolved_terms->'terms'->>'unit'='day' AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.package_daily_access_prices dp WHERE dp.package_id=o.product_id AND dp.currency=o.currency AND dp.amount=(o.resolved_terms->>'total')::numeric AND version=(o.resolved_terms->>'purchaseOptionVersion')::integer) THEN RAISE EXCEPTION 'daily configuration mismatch';END IF;
 SELECT starts_at,ends_at INTO start_at,end_at FROM twuanis_canonical_private.purchased_package_interval(o.account_id,o.product_id,o.resolved_terms->'terms'->>'unit',1,clock_timestamp());
 tid:=twuanis_canonical_private.commit_entitlement_term(o.account_id,'PACKAGE',o.product_id,c.id,NULL,'PURCHASED',o.id,aid,NULL,o.id,start_at,end_at,NULL,NULL);END IF;
 result:=jsonb_build_object('state','COMPLETE','termId',tid);UPDATE twuanis_canonical_private.onvo_fulfillment_jobs SET state='COMPLETE' WHERE order_id=o.id;
 EXCEPTION WHEN OTHERS THEN result:=jsonb_build_object('state','PENDING','reason','fulfillment_revalidation_failed');END;
 UPDATE twuanis_canonical_private.onvo_fulfillment_jobs SET attempts=attempts+1,next_attempt=clock_timestamp()+interval '1 minute' WHERE order_id=o.id;
 INSERT INTO twuanis_canonical_private.onvo_fulfillment_attempts(order_id,result)VALUES(o.id,result);RETURN result;
 ELSE RAISE EXCEPTION 'unknown ONVO operation';END IF;
END$$;
REVOKE ALL ON FUNCTION public.onvo_service_command(text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.onvo_service_command(text,jsonb) TO service_role;
CREATE FUNCTION public.read_my_onvo_payment(p_order uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT jsonb_build_object('orderId',o.id,'payment',coalesce((SELECT disposition FROM twuanis_canonical_private.onvo_receipts WHERE order_id=o.id ORDER BY processed_at DESC LIMIT 1),'PENDING'),'fulfillment',(SELECT state FROM twuanis_canonical_private.onvo_fulfillment_jobs WHERE order_id=o.id),'startsAt',(SELECT starts_at FROM twuanis_canonical_private.entitlement_terms WHERE order_id=o.id),'endsAt',(SELECT ends_at FROM twuanis_canonical_private.entitlement_terms WHERE order_id=o.id),'accessState',(SELECT CASE WHEN EXISTS(SELECT 1 FROM twuanis_canonical_private.entitlement_revocations WHERE term_id=t.id) THEN 'REVOKED' WHEN starts_at>statement_timestamp() THEN 'SCHEDULED' WHEN ends_at<=statement_timestamp() THEN 'EXPIRED' ELSE 'ACTIVE' END FROM twuanis_canonical_private.entitlement_terms t WHERE order_id=o.id)) FROM twuanis_canonical_private.offer_order_snapshots o WHERE o.id=p_order AND o.account_id=auth.uid() AND auth.jwt()->>'role'='authenticated'
$$;
REVOKE ALL ON FUNCTION public.read_my_onvo_payment(uuid) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.read_my_onvo_payment(uuid) TO authenticated;
CREATE TABLE twuanis_canonical_private.onvo_reconciliation(provider_account text NOT NULL,mode text NOT NULL,window_start timestamptz NOT NULL,window_end timestamptz NOT NULL,cursor text,PRIMARY KEY(provider_account,mode));
ALTER TABLE twuanis_canonical_private.onvo_reconciliation ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON twuanis_canonical_private.onvo_reconciliation FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.onvo_reconciliation_service(p_operation text,p_command jsonb)RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE r twuanis_canonical_private.onvo_reconciliation%ROWTYPE;BEGIN
 IF p_operation='read' THEN
 INSERT INTO twuanis_canonical_private.onvo_reconciliation VALUES(p_command->>'providerAccount',p_command->>'mode',(p_command->>'from')::timestamptz,clock_timestamp(),NULL) ON CONFLICT DO NOTHING;
 SELECT * INTO STRICT r FROM twuanis_canonical_private.onvo_reconciliation WHERE provider_account=p_command->>'providerAccount' AND mode=p_command->>'mode';RETURN to_jsonb(r);
 ELSIF p_operation='advance' THEN
 SELECT * INTO STRICT r FROM twuanis_canonical_private.onvo_reconciliation WHERE provider_account=p_command->>'providerAccount' AND mode=p_command->>'mode' FOR UPDATE;
 IF r.cursor IS DISTINCT FROM p_command->>'expectedCursor' OR r.window_start IS DISTINCT FROM(p_command->>'start')::timestamptz OR r.window_end IS DISTINCT FROM(p_command->>'end')::timestamptz THEN RAISE EXCEPTION 'reconciliation cursor conflict';END IF;
 IF (p_command->>'hasMore')::boolean THEN IF p_command->>'cursor' IS NULL OR r.cursor IS NOT DISTINCT FROM p_command->>'cursor' THEN RAISE EXCEPTION 'nonadvancing cursor';END IF;UPDATE twuanis_canonical_private.onvo_reconciliation SET cursor=p_command->>'cursor' WHERE provider_account=r.provider_account AND mode=r.mode;
 ELSE UPDATE twuanis_canonical_private.onvo_reconciliation SET window_start=window_end,window_end=clock_timestamp(),cursor=NULL WHERE provider_account=r.provider_account AND mode=r.mode;END IF;RETURN jsonb_build_object('ok',true);
 ELSE RAISE EXCEPTION 'unknown reconciliation operation';END IF;
END$$;
REVOKE ALL ON FUNCTION public.onvo_reconciliation_service(text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.onvo_reconciliation_service(text,jsonb) TO service_role;
CREATE FUNCTION public.admin_onvo_exceptions(p_after uuid DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$DECLARE result jsonb;BEGIN
 PERFORM twuanis_canonical_private.assert_administrative_permission('payments.read');SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'state','NEEDS_RESOLUTION','reason','unassociated_received_money','receivedAt',event->>'receivedAt','amount',event->>'amount','currency',event->>'currency')ORDER BY id),'[]')INTO result FROM(SELECT * FROM twuanis_canonical_private.onvo_inbox WHERE event->>'type'='UNASSOCIATED' AND(p_after IS NULL OR id>p_after) ORDER BY id LIMIT 26)x;RETURN result;END$$;
REVOKE ALL ON FUNCTION public.admin_onvo_exceptions(uuid) FROM PUBLIC,anon,service_role;GRANT EXECUTE ON FUNCTION public.admin_onvo_exceptions(uuid) TO authenticated;
COMMIT;
