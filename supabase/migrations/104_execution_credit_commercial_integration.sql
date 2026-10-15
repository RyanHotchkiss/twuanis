-- Phase5.2A local preparation only. Migration103 is preserved. No provider activation.
BEGIN;SET LOCAL lock_timeout='5s';SET LOCAL statement_timeout='60s';
DO $$BEGIN IF md5(pg_get_functiondef('public.read_customer_commercial(text,uuid,uuid,uuid,boolean)'::regprocedure))<>'3ca08ee3c2f210b3b1142888691860e7'THEN RAISE EXCEPTION 'Reviewed predecessor read_customer_commercial required';END IF;END$$;
DO $$BEGIN IF md5(pg_get_functiondef('twuanis_canonical_private.customer_order_projection(uuid)'::regprocedure))<>'39a4a78b37f9db1fe49bc8880dfec4c7'THEN RAISE EXCEPTION 'Reviewed predecessor customer_order_projection required';END IF;END$$;
DO $$BEGIN IF md5(pg_get_functiondef('twuanis_canonical_private.customer_product_copy(text,text)'::regprocedure))<>'d41cc5ec078b34f999a20913fc33bcad'THEN RAISE EXCEPTION 'Reviewed predecessor customer_product_copy required';END IF;END$$;
DO $$BEGIN IF md5(pg_get_functiondef('twuanis_canonical_private.resolve_offer_price(text,text,text,integer,timestamp with time zone)'::regprocedure))<>'9fae65c27724f5450dc562d25c10d1bf'THEN RAISE EXCEPTION 'Reviewed predecessor resolve_offer_price required';END IF;END$$;
DO $$BEGIN IF md5(pg_get_functiondef('public.onvo_service_command(text,jsonb)'::regprocedure))<>'d9ba951cc96c5ab3b73d427acecae5b1'THEN RAISE EXCEPTION 'Reviewed predecessor onvo_service_command required';END IF;END$$;
DO $$BEGIN IF md5(pg_get_functiondef('public.retry_sinpe_fulfillment(uuid,uuid)'::regprocedure))<>'3ae438de8a3ed2fdcd8d7722b0d213a3'THEN RAISE EXCEPTION 'Reviewed predecessor retry_sinpe_fulfillment required';END IF;END$$;
DO $$BEGIN IF md5(pg_get_functiondef('public.fulfill_execution_credit_purchase(uuid,uuid,uuid)'::regprocedure))<>'7b9ea8911e0ace8b0234642049c43a40'THEN RAISE EXCEPTION 'Reviewed predecessor fulfill_execution_credit_purchase required';END IF;END$$;

ALTER TABLE twuanis_canonical_private.customer_commerce_control ADD COLUMN execution_credit_enabled boolean NOT NULL DEFAULT false;
CREATE FUNCTION public.execution_credit_commerce_ready()RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$SELECT coalesce((SELECT enabled AND execution_credit_enabled FROM twuanis_canonical_private.customer_commerce_control WHERE singleton),false)$$;
REVOKE ALL ON FUNCTION public.execution_credit_commerce_ready()FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.execution_credit_commerce_ready()TO authenticated,service_role;
CREATE TABLE twuanis_canonical_private.execution_credit_price_versions(
 id uuid PRIMARY KEY,product_id text NOT NULL CHECK(product_id='execution-credit-v1'),version integer NOT NULL CHECK(version=1),
 effective_from timestamptz NOT NULL,effective_until timestamptz,usd_unit numeric NOT NULL CHECK(usd_unit=1),crc_unit numeric NOT NULL CHECK(crc_unit=500),
 CHECK(isfinite(effective_from)AND(effective_until IS NULL OR(isfinite(effective_until)AND effective_until>effective_from))),UNIQUE(product_id,version));
ALTER TABLE twuanis_canonical_private.execution_credit_price_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON twuanis_canonical_private.execution_credit_price_versions FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER immutable_history BEFORE UPDATE OR DELETE OR TRUNCATE ON twuanis_canonical_private.execution_credit_price_versions FOR EACH STATEMENT EXECUTE FUNCTION twuanis_canonical_private.administrative_immutable();
INSERT INTO twuanis_canonical_private.execution_credit_price_versions VALUES('10400000-0000-4000-8000-000000000001','execution-credit-v1',1,statement_timestamp(),NULL,1,500);
ALTER TABLE twuanis_canonical_private.offer_order_snapshots DROP CONSTRAINT offer_order_snapshots_target_type_check;
ALTER TABLE twuanis_canonical_private.offer_order_snapshots ADD CONSTRAINT offer_order_snapshots_target_type_check CHECK(target_type IN('package','addon','execution_credit'));
CREATE OR REPLACE FUNCTION twuanis_canonical_private.resolve_offer_price(p_kind text, p_product text, p_currency text, p_quantity integer, p_at timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE config uuid;term jsonb;standard numeric;effective numeric;oc uuid;oid uuid;n integer;end_time timestamptz;label_en text;label_es text;shape text;
BEGIN
 IF p_kind='execution_credit' THEN
  IF p_product IS DISTINCT FROM 'execution-credit-v1'OR p_quantity IS NULL OR p_quantity NOT IN(2,5,10,20,50)OR p_currency IS NULL OR p_currency NOT IN('USD','CRC')OR p_at IS NULL OR NOT isfinite(p_at)THEN RAISE EXCEPTION 'Invalid token product/quantity/currency';END IF;
  RETURN (SELECT jsonb_build_object('available',true,'targetType',p_kind,'productId',v.product_id,'productClass','EXECUTION_CREDIT','configurationId',v.id,'priceVersionId',v.id,'priceVersion',v.version,'quantity',p_quantity,'currency',p_currency,'unitPrice',(CASE WHEN p_currency='USD'THEN v.usd_unit ELSE v.crc_unit END)::text,'total',(p_quantity*(CASE WHEN p_currency='USD'THEN v.usd_unit ELSE v.crc_unit END))::text,'standardTotal',(p_quantity*(CASE WHEN p_currency='USD'THEN v.usd_unit ELSE v.crc_unit END))::text,'source','STANDARD','terms',jsonb_build_object('quantity',p_quantity,'unit','execution_credit'),'resolvedAt',p_at)FROM twuanis_canonical_private.execution_credit_price_versions v WHERE v.product_id=p_product AND v.effective_from<=p_at AND(v.effective_until IS NULL OR p_at<v.effective_until));
 END IF;
 IF p_kind IS NULL OR p_kind NOT IN ('package','addon') OR p_currency IS NULL OR p_currency NOT IN ('USD','CRC') OR p_quantity IS NULL OR p_quantity<1 OR p_at IS NULL OR NOT isfinite(p_at) THEN RAISE EXCEPTION 'invalid resolution context'; END IF;
 IF p_kind='package' THEN
  SELECT c.id,jsonb_build_object('quantity',c.term_quantity,'unit',c.term_unit,'capabilities',c.capabilities)
  INTO config,term FROM twuanis_canonical_private.intelligence_packages p JOIN twuanis_canonical_private.intelligence_package_configurations c ON c.id=p.current_configuration_id WHERE p.id=p_product AND p.state='active';
  SELECT amount INTO standard FROM twuanis_canonical_private.intelligence_package_prices WHERE package_id=p_product AND currency=p_currency;
  shape:='scalar';
 ELSE
  SELECT c.id,jsonb_build_object('kind',p.term_kind,'durationDays',c.duration_days,'behavior',p.behavior),CASE WHEN p.term_kind='whole_job' THEN 'whole_job' ELSE 'scalar' END
  INTO config,term,shape FROM twuanis_canonical_private.addon_products p JOIN twuanis_canonical_private.addon_configurations c ON c.id=p.current_configuration_id WHERE p.id=p_product AND p.state='active' AND p.term_kind<>'unconfigured';
  IF shape='whole_job' THEN
   SELECT unit_rate INTO standard FROM twuanis_canonical_private.addon_quantity_tiers WHERE configuration_id=config AND currency=p_currency AND p_quantity BETWEEN lower_quantity AND upper_quantity;
  ELSE
   SELECT amount INTO standard FROM twuanis_canonical_private.addon_standard_prices WHERE configuration_id=config AND currency=p_currency;
  END IF;
 END IF;
 IF config IS NULL THEN RETURN jsonb_build_object('available',false,'reason','target_unavailable'); END IF;
 IF shape='scalar' AND p_quantity<>1 THEN RAISE EXCEPTION 'scalar quantity must be one'; END IF;
 IF standard IS NULL THEN RETURN jsonb_build_object('available',false,'reason','unpriced'); END IF;
 SELECT count(*) INTO n FROM twuanis_canonical_private.offers o JOIN twuanis_canonical_private.offer_configurations c ON c.id=o.current_configuration_id
 WHERE ((p_kind='package' AND o.package_id=p_product) OR (p_kind='addon' AND o.addon_id=p_product)) AND o.state='eligible' AND p_at BETWEEN c.starts_at AND c.ends_at
 AND (EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_scalar_prices WHERE configuration_id=c.id AND currency=p_currency)
 OR EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_quantity_tiers WHERE configuration_id=c.id AND currency=p_currency AND p_quantity BETWEEN lower_quantity AND upper_quantity));
 IF n>1 THEN RAISE EXCEPTION 'ambiguous applicable offer'; END IF;
 IF n=1 THEN
  SELECT o.id,c.id,c.ends_at,c.name_en,c.name_es,coalesce(s.amount,t.unit_rate) INTO oid,oc,end_time,label_en,label_es,effective
  FROM twuanis_canonical_private.offers o JOIN twuanis_canonical_private.offer_configurations c ON c.id=o.current_configuration_id
  LEFT JOIN twuanis_canonical_private.offer_scalar_prices s ON s.configuration_id=c.id AND s.currency=p_currency
  LEFT JOIN twuanis_canonical_private.offer_quantity_tiers t ON t.configuration_id=c.id AND t.currency=p_currency AND p_quantity BETWEEN t.lower_quantity AND t.upper_quantity
  WHERE ((p_kind='package' AND o.package_id=p_product) OR (p_kind='addon' AND o.addon_id=p_product)) AND o.state='eligible' AND p_at BETWEEN c.starts_at AND c.ends_at AND coalesce(s.amount,t.unit_rate) IS NOT NULL;
 END IF;
 effective:=coalesce(effective,standard);
 RETURN jsonb_build_object('available',true,'targetType',p_kind,'productId',p_product,'configurationId',config,'currency',p_currency,
 'priceShape',shape,'quantity',p_quantity,'standardRate',standard::text,'effectiveRate',effective::text,'total',(effective*p_quantity)::text,
 'source',CASE WHEN oid IS NULL THEN 'STANDARD' ELSE 'OFFER' END,'offerId',oid,'offerConfigurationId',oc,'offerEnd',end_time,'name_en',label_en,'name_es',label_es,'terms',term,'resolvedAt',p_at);
END $function$;

-- Quantity overload delegates every original commercial target to its unchanged seven-argument implementation.
CREATE FUNCTION twuanis_canonical_private.create_offer_order_snapshot(p_account uuid,p_request uuid,p_kind text,p_product text,p_currency text,p_listing uuid,p_job uuid,p_quantity integer)RETURNS jsonb LANGUAGE plpgsql VOLATILE SET search_path=pg_catalog AS $$DECLARE old twuanis_canonical_private.offer_order_snapshots%ROWTYPE;terms jsonb;at_time timestamptz;oid uuid;BEGIN
 IF p_kind IS DISTINCT FROM'execution_credit'THEN IF p_quantity IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'Original scalar quantity required';END IF;RETURN twuanis_canonical_private.create_offer_order_snapshot(p_account,p_request,p_kind,p_product,p_currency,p_listing,p_job);END IF;
 IF p_account IS NULL OR p_request IS NULL OR p_listing IS NOT NULL OR p_job IS NOT NULL OR p_product IS DISTINCT FROM'execution-credit-v1'OR p_quantity IS NULL OR p_quantity NOT IN(2,5,10,20,50)OR p_currency IS NULL OR p_currency NOT IN('USD','CRC')THEN RAISE EXCEPTION 'Exact token order intent required';END IF;
 PERFORM pg_advisory_xact_lock(3162,hashtext(jsonb_build_array(p_account,p_request)::text));SELECT * INTO old FROM twuanis_canonical_private.offer_order_snapshots WHERE account_id=p_account AND request_id=p_request;
 IF FOUND THEN IF old.target_type<>p_kind OR old.product_id<>p_product OR old.currency<>p_currency OR(old.resolved_terms->>'quantity')::integer<>p_quantity OR old.listing_id IS NOT NULL OR old.job_id IS NOT NULL THEN RAISE EXCEPTION 'Order replay conflict';END IF;RETURN jsonb_build_object('id',old.id,'replayed',true);END IF;
 at_time:=clock_timestamp();terms:=twuanis_canonical_private.resolve_offer_price(p_kind,p_product,p_currency,p_quantity,at_time);IF terms IS NULL OR terms->>'available'IS DISTINCT FROM'true'THEN RAISE EXCEPTION 'Token price unavailable';END IF;
 INSERT INTO twuanis_canonical_private.offer_order_snapshots(account_id,request_id,target_type,product_id,currency,resolved_terms,created_at,payment_deadline)VALUES(p_account,p_request,p_kind,p_product,p_currency,terms,at_time,at_time+interval'24 hours')RETURNING id INTO oid;RETURN jsonb_build_object('id',oid,'replayed',false);
END$$;
CREATE FUNCTION public.create_execution_credit_order(p_request uuid,p_product text,p_currency text,p_quantity integer)RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$DECLARE a uuid;BEGIN
 a:=twuanis_canonical_private.execution_credit_actor();IF NOT public.execution_credit_commerce_ready()OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=a AND email_confirmed_at IS NOT NULL)OR NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.sinpe_receiving_accounts WHERE enabled AND currency=p_currency)THEN RAISE EXCEPTION 'Existing customer/payment readiness required';END IF;
 RETURN twuanis_canonical_private.create_offer_order_snapshot(a,p_request,'execution_credit',p_product,p_currency,NULL,NULL,p_quantity);
END$$;
CREATE FUNCTION public.read_execution_credit_catalog(p_currency text)RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$BEGIN
 IF p_currency IS NULL OR p_currency NOT IN('USD','CRC')THEN RAISE EXCEPTION 'Explicit commercial currency required';END IF;
 RETURN(SELECT jsonb_agg(twuanis_canonical_private.resolve_offer_price('execution_credit','execution-credit-v1',p_currency,q,statement_timestamp())ORDER BY q)FROM unnest(ARRAY[2,5,10,20,50])q);
END$$;
CREATE FUNCTION twuanis_canonical_private.assert_execution_credit_payment(p_order uuid,p_ack uuid)RETURNS void LANGUAGE plpgsql VOLATILE SET search_path=pg_catalog AS $$DECLARE o twuanis_canonical_private.offer_order_snapshots%ROWTYPE;v twuanis_canonical_private.execution_credit_price_versions%ROWTYPE;a twuanis_canonical_private.offer_paid_acknowledgements%ROWTYPE;q bigint;BEGIN
 SELECT * INTO STRICT o FROM twuanis_canonical_private.offer_order_snapshots WHERE id=p_order;IF o.target_type<>'execution_credit'OR o.product_id<>'execution-credit-v1'THEN RAISE EXCEPTION 'Exact approved execution-credit payment correspondence required' USING ERRCODE='23514';END IF;SELECT * INTO STRICT v FROM twuanis_canonical_private.execution_credit_price_versions WHERE id=(o.resolved_terms->>'priceVersionId')::uuid;
 q:=(o.resolved_terms->>'quantity')::bigint;
 IF o.target_type<>'execution_credit'OR o.product_id<>v.product_id OR v.version<>(o.resolved_terms->>'priceVersion')::integer OR v.effective_from>o.created_at OR(v.effective_until IS NOT NULL AND o.created_at>=v.effective_until)OR q IS NULL OR q NOT IN(2,5,10,20,50)OR(o.resolved_terms->>'unitPrice')::numeric IS DISTINCT FROM(CASE WHEN o.currency='USD'THEN v.usd_unit ELSE v.crc_unit END)OR(o.resolved_terms->>'total')::numeric IS DISTINCT FROM q*(CASE WHEN o.currency='USD'THEN v.usd_unit ELSE v.crc_unit END)THEN RAISE EXCEPTION 'Pinned token price correspondence required';END IF;
 SELECT * INTO STRICT a FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE id=p_ack AND order_id=o.id AND currency=o.currency AND amount=(o.resolved_terms->>'total')::numeric;
 IF NOT((a.source='onvo'AND EXISTS(SELECT 1 FROM twuanis_canonical_private.onvo_receipts r JOIN twuanis_canonical_private.onvo_intents i ON i.order_id=r.order_id AND i.provider_account=r.provider_account AND i.mode=r.mode WHERE r.acknowledgement_id=a.id AND r.order_id=o.id AND r.disposition='APPROVED'AND r.amount=a.amount AND r.currency=a.currency AND r.received_at BETWEEN o.created_at AND o.payment_deadline AND i.receiving_account IS NOT NULL))OR(a.source='sinpe'AND EXISTS(SELECT 1 FROM twuanis_canonical_private.sinpe_review_decisions d JOIN public.sinpe_payments s ON s.id=d.attempt_id WHERE d.acknowledgement_id=a.id AND d.disposition='APPROVED'AND s.canonical_order_id=o.id AND s.user_id=o.account_id AND d.amount=a.amount AND d.currency=a.currency AND d.received_at BETWEEN o.created_at AND o.payment_deadline AND d.receiving_account_id IS NOT NULL)))THEN RAISE EXCEPTION 'Existing exact approved payment evidence required' USING ERRCODE='23514';END IF;
END$$;
CREATE FUNCTION twuanis_canonical_private.assert_execution_credit_delivery(p_order uuid)RETURNS uuid LANGUAGE plpgsql VOLATILE SET search_path=pg_catalog AS $$DECLARE o twuanis_canonical_private.offer_order_snapshots%ROWTYPE;a twuanis_canonical_private.execution_credit_allocations%ROWTYPE;ack uuid;BEGIN
 SELECT * INTO STRICT o FROM twuanis_canonical_private.offer_order_snapshots WHERE id=p_order;SELECT id INTO STRICT ack FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id=o.id;PERFORM twuanis_canonical_private.assert_execution_credit_payment(o.id,ack);
 SELECT * INTO STRICT a FROM twuanis_canonical_private.execution_credit_allocations WHERE order_id=o.id AND kind='PURCHASED';
 IF a.account_id<>o.account_id OR a.quantity<>(o.resolved_terms->>'quantity')::bigint OR a.acknowledgement_id<>ack OR a.origin<>'ORDER:'||o.id OR a.expires_at IS NOT NULL OR a.package_id IS NOT NULL OR a.term_id IS NOT NULL OR NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.execution_credit_events WHERE allocation_id=a.id AND account_id=o.account_id AND kind='PURCHASE_CREDITED'AND quantity=a.quantity)THEN RAISE EXCEPTION 'Complete exact token delivery required';END IF;RETURN a.id;
END$$;
CREATE OR REPLACE FUNCTION twuanis_canonical_private.commit_execution_credit_purchase(p_order uuid, p_ack uuid, p_request uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE o twuanis_canonical_private.offer_order_snapshots%ROWTYPE;a twuanis_canonical_private.offer_paid_acknowledgements%ROWTYPE;old twuanis_canonical_private.execution_credit_receipts%ROWTYPE;q bigint;id uuid;command jsonb;result jsonb;
BEGIN
 IF p_request IS NULL THEN RAISE EXCEPTION 'Trusted payment fulfillment required' USING ERRCODE='42501';END IF;
 PERFORM pg_advisory_xact_lock(3110,1);PERFORM pg_advisory_xact_lock(3200,hashtext(p_order::text));SELECT * INTO STRICT o FROM twuanis_canonical_private.offer_order_snapshots WHERE offer_order_snapshots.id=p_order;
 PERFORM pg_advisory_xact_lock(3512,hashtext(o.account_id::text));PERFORM twuanis_canonical_private.assert_execution_credit_payment(o.id,p_ack);command:=jsonb_build_object('operation','purchase.credit','order',p_order,'ack',p_ack);
 SELECT * INTO old FROM twuanis_canonical_private.execution_credit_receipts WHERE account_id=o.account_id AND request_id=p_request;
 IF FOUND THEN IF old.command IS DISTINCT FROM command THEN RAISE EXCEPTION 'Purchase retry conflict';END IF;PERFORM twuanis_canonical_private.assert_execution_credit_delivery(o.id);RETURN old.result||jsonb_build_object('replayed',true);END IF;
 q:=(o.resolved_terms->>'quantity')::bigint;SELECT * INTO a FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE offer_paid_acknowledgements.id=p_ack AND order_id=o.id AND currency=o.currency AND amount=(o.resolved_terms->>'total')::numeric;
 IF o.target_type<>'execution_credit' OR o.product_id<>'execution-credit-v1' OR o.resolved_terms->>'productClass'IS DISTINCT FROM'EXECUTION_CREDIT' OR o.resolved_terms->>'priceVersion'IS DISTINCT FROM'1' OR q IS NULL OR q NOT IN(2,5,10,20,50) OR o.currency NOT IN('USD','CRC') OR(o.resolved_terms->>'unitPrice')::numeric IS DISTINCT FROM (CASE WHEN o.currency='USD'THEN 1 ELSE 500 END) OR(o.resolved_terms->>'total')::numeric IS DISTINCT FROM q*(CASE WHEN o.currency='USD'THEN 1 ELSE 500 END) OR a.id IS NULL OR NOT((a.source='sinpe'AND EXISTS(SELECT 1 FROM twuanis_canonical_private.sinpe_review_decisions WHERE acknowledgement_id=a.id AND disposition='APPROVED'))OR(a.source='onvo'AND EXISTS(SELECT 1 FROM twuanis_canonical_private.onvo_receipts WHERE acknowledgement_id=a.id AND disposition='APPROVED')))THEN RAISE EXCEPTION 'Exact approved execution-credit payment correspondence required' USING ERRCODE='23514';END IF;
 id:=twuanis_canonical_private.execution_credit_issue(o.account_id,'PURCHASED',q,'ORDER:'||o.id,NULL,NULL,o.id,a.id,o.created_at,NULL,jsonb_build_object('source','APPROVED_PAYMENT','currency',o.currency,'quantity',q,'total',a.amount::text,'provider',a.source,'orderId',o.id,'acknowledgementId',a.id,'priceVersion',1),p_request);PERFORM twuanis_canonical_private.assert_execution_credit_delivery(o.id);result:=jsonb_build_object('allocation',id,'quantity',q::text);
 INSERT INTO twuanis_canonical_private.execution_credit_receipts(account_id,request_id,command,result)VALUES(o.account_id,p_request,command,result);RETURN result||jsonb_build_object('replayed',false);
END$function$;
CREATE OR REPLACE FUNCTION public.fulfill_execution_credit_purchase(p_order uuid,p_ack uuid,p_request uuid)RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$BEGIN IF auth.jwt()->>'role'IS DISTINCT FROM'service_role'THEN RAISE EXCEPTION 'Trusted payment fulfillment required' USING ERRCODE='42501';END IF;RETURN twuanis_canonical_private.commit_execution_credit_purchase(p_order,p_ack,p_request);END$$;
CREATE OR REPLACE FUNCTION public.onvo_service_command(p_operation text, p_command jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
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
 IF o.account_id IS DISTINCT FROM (p_command->>'accountId')::uuid OR o.currency<>'CRC' OR o.target_type NOT IN('package','execution_credit') OR NOT public.customer_commerce_ready() OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=o.account_id AND email_confirmed_at IS NOT NULL) OR clock_timestamp()>o.payment_deadline OR EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id=o.id) THEN RAISE EXCEPTION 'eligible confirmed owned CRC Order required';END IF;
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

 BEGIN
 IF j.state='COMPLETE' THEN IF o.target_type='execution_credit'THEN PERFORM twuanis_canonical_private.assert_execution_credit_delivery(o.id);ELSE PERFORM twuanis_canonical_private.assert_package_delivery(o.id,NULL);END IF;RETURN jsonb_build_object('state','COMPLETE','replayed',true);END IF;
 SELECT id INTO STRICT aid FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id=o.id AND source='onvo';
 IF o.target_type='execution_credit'THEN
 result:=twuanis_canonical_private.commit_execution_credit_purchase(o.id,aid,o.id);PERFORM twuanis_canonical_private.assert_execution_credit_delivery(o.id);result:=result||jsonb_build_object('state','COMPLETE');UPDATE twuanis_canonical_private.onvo_fulfillment_jobs SET state='COMPLETE'WHERE order_id=o.id;
 ELSE
 PERFORM pg_advisory_xact_lock(3200,hashtext(o.id::text));SELECT id INTO tid FROM twuanis_canonical_private.entitlement_terms WHERE order_id=o.id;
 IF tid IS NULL THEN
 SELECT * INTO STRICT c FROM twuanis_canonical_private.intelligence_package_configurations WHERE id=(o.resolved_terms->>'configurationId')::uuid AND package_id=o.product_id;
 IF o.target_type<>'package' OR o.resolved_terms->'terms'->'capabilities' IS DISTINCT FROM to_jsonb(c.capabilities) OR o.resolved_terms->'terms'->>'quantity'<>'1' OR o.resolved_terms->'terms'->>'unit' NOT IN('day','month') THEN RAISE EXCEPTION 'pinned Package contract mismatch';END IF;
 IF o.resolved_terms->'terms'->>'unit'='day' AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.package_daily_access_prices dp WHERE dp.package_id=o.product_id AND dp.currency=o.currency AND dp.amount=(o.resolved_terms->>'total')::numeric AND version=(o.resolved_terms->>'purchaseOptionVersion')::integer) THEN RAISE EXCEPTION 'daily configuration mismatch';END IF;
 SELECT starts_at,ends_at INTO start_at,end_at FROM twuanis_canonical_private.purchased_package_interval(o.account_id,o.product_id,o.resolved_terms->'terms'->>'unit',1,clock_timestamp());
 tid:=twuanis_canonical_private.commit_entitlement_term(o.account_id,'PACKAGE',o.product_id,c.id,NULL,'PURCHASED',o.id,aid,NULL,o.id,start_at,end_at,NULL,NULL);END IF;
 tid:=twuanis_canonical_private.assert_package_delivery(o.id,NULL);
 result:=jsonb_build_object('state','COMPLETE','termId',tid);UPDATE twuanis_canonical_private.onvo_fulfillment_jobs SET state='COMPLETE' WHERE order_id=o.id;
 END IF;
 EXCEPTION WHEN OTHERS THEN result:=jsonb_build_object('state','PENDING','reason','fulfillment_revalidation_failed');UPDATE twuanis_canonical_private.onvo_fulfillment_jobs SET state='PENDING' WHERE order_id=o.id;END;
 UPDATE twuanis_canonical_private.onvo_fulfillment_jobs SET attempts=attempts+1,next_attempt=clock_timestamp()+interval '1 minute' WHERE order_id=o.id;
 INSERT INTO twuanis_canonical_private.onvo_fulfillment_attempts(order_id,result)VALUES(o.id,result);RETURN result;
 ELSE RAISE EXCEPTION 'unknown ONVO operation';END IF;
END$function$

;
CREATE OR REPLACE FUNCTION public.retry_sinpe_fulfillment(p_order uuid, p_request uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE actor uuid;prior twuanis_canonical_private.sinpe_fulfillment_attempts%ROWTYPE;o twuanis_canonical_private.offer_order_snapshots%ROWTYPE;a twuanis_canonical_private.offer_paid_acknowledgements%ROWTYPE;result jsonb;cfg twuanis_canonical_private.intelligence_package_configurations%ROWTYPE;term_id uuid;begins timestamptz;ends timestamptz;BEGIN
 actor:=twuanis_canonical_private.assert_administrative_permission('payments.review');
 IF p_request IS NULL OR p_order IS NULL THEN RAISE EXCEPTION 'bounded identity required';END IF;
 PERFORM pg_advisory_xact_lock(3192,hashtext(actor::text||p_request::text));
 SELECT * INTO prior FROM twuanis_canonical_private.sinpe_fulfillment_attempts WHERE actor_id=actor AND request_id=p_request;
 IF FOUND THEN IF prior.order_id<>p_order THEN RAISE EXCEPTION 'fulfillment request conflict';END IF;IF prior.result->>'state'='COMPLETE' AND EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_order_snapshots WHERE id=p_order AND target_type='package') THEN PERFORM twuanis_canonical_private.assert_package_delivery(p_order,actor);END IF;IF prior.result->>'state'='COMPLETE'AND EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_order_snapshots WHERE id=p_order AND target_type='execution_credit')THEN PERFORM twuanis_canonical_private.assert_execution_credit_delivery(p_order);END IF;RETURN prior.result;END IF;
 SELECT * INTO STRICT o FROM twuanis_canonical_private.offer_order_snapshots WHERE id=p_order;
 SELECT a1.* INTO STRICT a FROM twuanis_canonical_private.offer_paid_acknowledgements a1 JOIN twuanis_canonical_private.sinpe_review_decisions d ON d.acknowledgement_id=a1.id WHERE a1.order_id=p_order AND d.disposition='APPROVED';
 -- Serialize every fulfillment for an Order, including distinct retry request identities.
 PERFORM pg_advisory_xact_lock(3200,hashtext(o.id::text));
 BEGIN
 IF o.target_type='package' THEN
  SELECT id INTO term_id FROM twuanis_canonical_private.entitlement_terms WHERE order_id=o.id;
  IF term_id IS NULL THEN
   SELECT * INTO STRICT cfg FROM twuanis_canonical_private.intelligence_package_configurations WHERE id=(o.resolved_terms->>'configurationId')::uuid AND package_id=o.product_id;
   IF o.resolved_terms->'terms'->>'unit'='day' THEN
    IF o.resolved_terms->'terms' IS DISTINCT FROM jsonb_build_object('quantity',1,'unit','day','capabilities',cfg.capabilities)
    OR o.resolved_terms->>'purchaseOption' IS DISTINCT FROM 'day'
    OR NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.package_daily_access_prices d WHERE d.package_id=o.product_id AND d.currency=o.currency AND d.version=(o.resolved_terms->>'purchaseOptionVersion')::integer AND d.amount=(o.resolved_terms->>'total')::numeric) THEN RAISE EXCEPTION 'daily purchase configuration mismatch';END IF;
   ELSIF o.resolved_terms->'terms' IS DISTINCT FROM jsonb_build_object('quantity',cfg.term_quantity,'unit',cfg.term_unit,'capabilities',cfg.capabilities) THEN RAISE EXCEPTION 'purchased package configuration mismatch';END IF;
   SELECT starts_at,ends_at INTO begins,ends FROM twuanis_canonical_private.purchased_package_interval(o.account_id,o.product_id,o.resolved_terms->'terms'->>'unit',(o.resolved_terms->'terms'->>'quantity')::integer,clock_timestamp());
   term_id:=twuanis_canonical_private.commit_entitlement_term(o.account_id,'PACKAGE',o.product_id,cfg.id,NULL,'PURCHASED',o.id,a.id,actor,p_request,begins,ends,NULL,NULL);
  END IF;
  term_id:=twuanis_canonical_private.assert_package_delivery(o.id,actor);
   result:=jsonb_build_object('state','COMPLETE','evidence',jsonb_build_object('termId',term_id));
 ELSIF o.target_type='execution_credit'THEN result:=twuanis_canonical_private.commit_execution_credit_purchase(o.id,a.id,p_request);PERFORM twuanis_canonical_private.assert_execution_credit_delivery(o.id);result:=result||jsonb_build_object('state','COMPLETE');
 ELSIF o.listing_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_fulfillments f WHERE f.purchase_id=o.id) AND EXISTS(SELECT 1 FROM public.listings l WHERE l.id=o.listing_id AND l.owner_id=o.account_id AND l.canonical_domain_version=1 AND l.listing_status NOT IN('active','deleted')) THEN
   -- No entitlement or capacity reservation; paid acknowledgement remains intact.
   result:=jsonb_build_object('state','PENDING','reason','awaiting_publication');
 ELSE
   result:=twuanis_canonical_private.fulfill_addon(o.id,a.payment_event_id,o.account_id,o.product_id,(o.resolved_terms->>'configurationId')::uuid,CASE WHEN o.job_id IS NOT NULL THEN 'operation' WHEN o.listing_id IS NOT NULL THEN 'listing' ELSE 'account' END,coalesce(o.job_id,o.listing_id,o.account_id),jsonb_build_object('currency',o.currency,'amount',o.resolved_terms->>'total'));
   result:=jsonb_build_object('state',CASE WHEN result->>'ok'='true' THEN 'COMPLETE' ELSE 'FAILED' END,'evidence',result);
 END IF;
  EXCEPTION WHEN OTHERS THEN result:=jsonb_build_object('state','FAILED','reason','fulfillment_revalidation_failed','sqlstate',SQLSTATE);
 END;
 INSERT INTO twuanis_canonical_private.sinpe_fulfillment_attempts(order_id,actor_id,request_id,result) VALUES(p_order,actor,p_request,result);
 PERFORM twuanis_canonical_private.append_administrative_event(actor,CASE WHEN public.is_current_user_owner() THEN 'Owner' ELSE 'Payment Review' END,'payments.review','sinpe.fulfillment','order',o.id,NULL,result,NULL,p_request);
 RETURN result;
END$function$

;
CREATE OR REPLACE FUNCTION twuanis_canonical_private.customer_product_copy(p_kind text, p_product text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'pg_catalog'
AS $function$
 SELECT CASE WHEN p_kind='execution_credit'THEN jsonb_build_object('nameEN','Execution tokens','nameES','Tokens de ejecución') WHEN p_kind IN('package','PACKAGE') THEN (SELECT jsonb_build_object('nameEN',name_en,'nameES',name_es) FROM twuanis_canonical_private.intelligence_packages WHERE id=p_product)
 ELSE (SELECT jsonb_build_object('nameEN',name_en,'nameES',name_es) FROM twuanis_canonical_private.addon_products WHERE id=p_product) END
$function$;
CREATE OR REPLACE FUNCTION twuanis_canonical_private.customer_order_projection(p_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 VOLATILE
 SET search_path TO 'pg_catalog'
AS $function$
 SELECT CASE WHEN o.target_type='execution_credit'THEN jsonb_build_object('id',o.id,'kind',o.target_type,'product',o.product_id,'nameEN','Execution tokens','nameES','Tokens de ejecución','quantity',o.resolved_terms->>'quantity','unitPrice',o.resolved_terms->>'unitPrice','priceVersionId',o.resolved_terms->>'priceVersionId','createdAt',o.created_at,'currency',o.currency,'amount',o.resolved_terms->>'total','deadline',o.payment_deadline,'state',twuanis_canonical_private.offer_order_state(o.id,statement_timestamp()),'paid',EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id=o.id),'receiptReference',(SELECT external_reference FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id=o.id),'provider',(SELECT source FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id=o.id),'allocationId',(SELECT id FROM twuanis_canonical_private.execution_credit_allocations WHERE order_id=o.id AND kind='PURCHASED'),'tokensIssued',(SELECT quantity::text FROM twuanis_canonical_private.execution_credit_allocations WHERE order_id=o.id AND kind='PURCHASED'),'tokensRemaining',(SELECT twuanis_canonical_private.execution_credit_remaining(id)::text FROM twuanis_canonical_private.execution_credit_allocations WHERE order_id=o.id AND kind='PURCHASED'),'fulfilled',CASE WHEN EXISTS(SELECT 1 FROM twuanis_canonical_private.execution_credit_allocations WHERE order_id=o.id AND kind='PURCHASED')THEN twuanis_canonical_private.assert_execution_credit_delivery(o.id)IS NOT NULL ELSE false END)ELSE twuanis_canonical_private.customer_product_copy(o.target_type,o.product_id)||jsonb_build_object('id',o.id,'kind',o.target_type,'product',o.product_id,'listing',o.listing_id,'currency',o.currency,'amount',o.resolved_terms->>'total','standardAmount',o.resolved_terms->>'standardTotal','priceSource',o.resolved_terms->>'source','termQuantity',o.resolved_terms->'terms'->'quantity','termUnit',o.resolved_terms->'terms'->>'unit','durationDays',o.resolved_terms->'terms'->'durationDays','createdAt',o.created_at,'deadline',o.payment_deadline,'state',twuanis_canonical_private.offer_order_state(o.id,statement_timestamp()),
 'paid',EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id=o.id),
 'fulfilled',EXISTS(SELECT 1 FROM twuanis_canonical_private.entitlement_terms WHERE order_id=o.id) OR EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_fulfillments af WHERE af.purchase_id=o.id AND af.result->>'ok'='true'),
 'awaitingPublication',EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id=o.id) AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.addon_fulfillments WHERE purchase_id=o.id) AND EXISTS(SELECT 1 FROM public.listings WHERE id=o.listing_id AND owner_id=o.account_id AND listing_status NOT IN('active','deleted')))
 END FROM twuanis_canonical_private.offer_order_snapshots o WHERE o.id=p_id
$function$;
CREATE OR REPLACE FUNCTION public.read_customer_commercial(p_area text, p_after uuid DEFAULT NULL::uuid, p_id uuid DEFAULT NULL::uuid, p_listing uuid DEFAULT NULL::uuid, p_history boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 VOLATILE SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE actor uuid:=auth.uid();result jsonb;
BEGIN
 IF actor IS NULL OR auth.jwt()->>'role' IS DISTINCT FROM 'authenticated' THEN RAISE EXCEPTION 'authentication required';END IF;
 IF p_listing IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.listings WHERE id=p_listing AND owner_id=actor AND canonical_domain_version=1 AND listing_status<>'deleted') THEN RAISE EXCEPTION 'owned canonical listing required';END IF;
 IF p_area IN('orders','tokens') THEN
  SELECT coalesce(jsonb_agg(twuanis_canonical_private.customer_order_projection(q.id) ORDER BY q.id),'[]') INTO result FROM (
   SELECT o.id FROM twuanis_canonical_private.offer_order_snapshots o WHERE o.account_id=actor AND(p_area<>'tokens'OR o.target_type='execution_credit')AND (p_after IS NULL OR o.id>p_after) AND (p_id IS NULL OR o.id=p_id) AND (p_listing IS NULL OR o.listing_id=p_listing)
   ORDER BY o.id LIMIT 26)q;
 ELSIF p_area='rights' THEN
  SELECT coalesce(jsonb_agg(twuanis_canonical_private.customer_product_copy(q.product_class,q.product_id)||jsonb_build_object('id',q.id,'product',q.product_id,'class',q.product_class,'listing',q.listing_id,'source',q.source,'startsAt',q.starts_at,'endsAt',q.ends_at,'state',CASE WHEN q.revoked THEN 'REVOKED' WHEN q.starts_at>statement_timestamp() THEN 'SCHEDULED' WHEN q.ends_at<=statement_timestamp() THEN 'EXPIRED' ELSE 'ACTIVE' END) ORDER BY q.id),'[]') INTO result FROM (
   SELECT t.*,EXISTS(SELECT 1 FROM twuanis_canonical_private.entitlement_revocations WHERE term_id=t.id) revoked FROM twuanis_canonical_private.entitlement_terms t
   WHERE t.account_id=actor AND (p_after IS NULL OR t.id>p_after) AND (p_id IS NULL OR t.id=p_id) AND (p_listing IS NULL OR t.listing_id=p_listing)
   AND (p_history OR ((t.ends_at IS NULL OR t.ends_at>statement_timestamp()) AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.entitlement_revocations WHERE term_id=t.id))) ORDER BY t.id LIMIT 26)q;
 ELSIF p_area='payments' THEN
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',q.id,'order',q.canonical_order_id,'submittedAt',q.created_at,'currency',q.currency,'amount',q.amount::text,'state',coalesce(d.disposition,'REVIEW_PENDING'),'late',q.created_at>o.payment_deadline) ORDER BY q.id),'[]') INTO result FROM(
   SELECT p.* FROM public.sinpe_payments p WHERE p.user_id=actor AND p.canonical_order_id IS NOT NULL AND (p_after IS NULL OR p.id>p_after) AND (p_id IS NULL OR p.id=p_id) ORDER BY p.id LIMIT 26)q
   JOIN twuanis_canonical_private.offer_order_snapshots o ON o.id=q.canonical_order_id LEFT JOIN twuanis_canonical_private.sinpe_review_decisions d ON d.attempt_id=q.id;
 ELSIF p_area='listings' THEN
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',q.id,'title',q.title,'state',q.listing_status) ORDER BY q.id),'[]') INTO result FROM(
   SELECT id,title,listing_status FROM public.listings WHERE owner_id=actor AND canonical_domain_version=1 AND listing_status<>'deleted' AND (p_after IS NULL OR id>p_after) AND (p_id IS NULL OR id=p_id) ORDER BY id LIMIT 26)q;
 ELSIF p_area='legacy' THEN
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',g.subscription_id,'source','LEGACY','endsAt',g.expires_at,'capabilities',g.capabilities) ORDER BY g.subscription_id),'[]') INTO result FROM (SELECT g.* FROM twuanis_canonical_private.legacy_package_access g JOIN public.user_subscriptions s ON s.id=g.subscription_id
   WHERE g.account_id=actor AND s.user_id=actor AND s.package_id=g.package_id AND s.status='active' AND s.cancelled_at IS NULL AND s.expired_at IS NULL AND s.current_period_end=g.expires_at AND g.expires_at>statement_timestamp() AND (p_after IS NULL OR g.subscription_id>p_after) AND (p_id IS NULL OR g.subscription_id=p_id) ORDER BY g.subscription_id LIMIT 26)g;
 ELSE RAISE EXCEPTION 'unknown bounded commercial area';END IF;
 RETURN result;
END$function$

;

REVOKE ALL ON FUNCTION twuanis_canonical_private.create_offer_order_snapshot(uuid,uuid,text,text,text,uuid,uuid,integer),twuanis_canonical_private.assert_execution_credit_payment(uuid,uuid),twuanis_canonical_private.assert_execution_credit_delivery(uuid),twuanis_canonical_private.commit_execution_credit_purchase(uuid,uuid,uuid)FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.create_execution_credit_order(uuid,text,text,integer),public.read_execution_credit_catalog(text)FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.create_execution_credit_order(uuid,text,text,integer)TO authenticated;
GRANT EXECUTE ON FUNCTION public.read_execution_credit_catalog(text)TO authenticated,service_role;
NOTIFY pgrst,'reload schema';COMMIT;
