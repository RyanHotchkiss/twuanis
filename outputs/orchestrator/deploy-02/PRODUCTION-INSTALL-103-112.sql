-- ORCH-DEPLOY-02: exact reviewed migrations 103-112, single atomic transaction.
-- Only migration 107 statement terminator corrected; no resource settings increased.
BEGIN;
-- 103_execution_credit_ledger.sql SHA256 c08e48017ccfb1ef449c9f5313da331e8fd90a685ffeac5e03dcec13df3d2761
-- Phase 5.2. LOCAL ONLY: execution capacity, not a replacement analytical authority.

SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='60s';
DO $$BEGIN
 IF current_user<>'postgres'
 OR md5(pg_get_functiondef('public.current_account_has_population_capability(text,text)'::regprocedure))<>'621d0321f251b4d244ccfb357656181b'
 OR md5(pg_get_functiondef('twuanis_canonical_private.bank_analytical_grant_terms(uuid,text)'::regprocedure))<>'b3ff2393080ecd30021a18179f5cb088'
 OR to_regprocedure('twuanis_remates_private.live_session_actor()') IS NULL THEN
 RAISE EXCEPTION 'Reviewed canonical predecessors through 102 required';END IF;
END$$;
CREATE TABLE twuanis_canonical_private.execution_credit_orchestrators(
 id text PRIMARY KEY,version integer NOT NULL CHECK(version=1),package_id text NOT NULL REFERENCES twuanis_canonical_private.intelligence_packages(id),
 capabilities text[] NOT NULL,engines text[] NOT NULL,CHECK(cardinality(capabilities)=cardinality(engines)),CHECK(cardinality(engines) IN(7,17)));
INSERT INTO twuanis_canonical_private.execution_credit_orchestrators VALUES
('orchestrator-market-comparison',1,'pkg-matching-market-comparison',ARRAY['cap-market-summary','cap-market-composition','cap-market-asking-price-distribution','cap-property-matching','cap-market-comparison','cap-geographic-price-m2-comparison','cap-comparative-price-m2-discovery'],ARRAY['summary','composition','market-asking-price-distribution','matching','comparison','geography','discovery']),
('orchestrator-markets-current-valuation-of-property',1,'pkg-pricing-position-relationships',ARRAY['cap-market-summary','cap-market-composition','cap-market-asking-price-distribution','cap-property-matching','cap-market-comparison','cap-property-configuration-frequency','cap-price-m2-distribution','cap-geographic-price-m2-comparison','cap-size-price-m2','cap-construction-land-price-m2','cap-user-defined-cohort-price-m2-comparison','cap-cross-dimensional-analysis','cap-comparative-price-m2-discovery','cap-property-price-m2-position','cap-user-defined-comparable-cohort','cap-asking-area-coefficient-ratio','cap-weighted-price-m2'],ARRAY['summary','composition','market-asking-price-distribution','matching','comparison','configuration','distribution','geography','size','construction-land','cohort-comparison','cross-dimensional','discovery','position','comparables','asking-area-ratio','weighted-price']);
DO $$BEGIN
 IF EXISTS(SELECT 1 FROM twuanis_canonical_private.execution_credit_orchestrators o JOIN twuanis_canonical_private.intelligence_packages p ON p.id=o.package_id JOIN twuanis_canonical_private.intelligence_package_configurations c ON c.id=p.current_configuration_id WHERE NOT(c.capabilities@>o.capabilities AND o.capabilities@>c.capabilities)) THEN RAISE EXCEPTION 'Canonical seven/seventeen configuration differs';END IF;
END$$;
CREATE TABLE twuanis_canonical_private.execution_credit_allocations(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),account_id uuid NOT NULL REFERENCES twuanis_canonical_private.account_principals(id),
 kind text NOT NULL CHECK(kind IN('INCLUDED_PACKAGE','PURCHASED','ADMIN_ALLOWANCE')),quantity bigint NOT NULL CHECK(quantity>0 AND quantity<=1000000),
 origin text NOT NULL,package_id text REFERENCES twuanis_canonical_private.intelligence_packages(id),term_id uuid REFERENCES twuanis_canonical_private.entitlement_terms(id),
 order_id uuid REFERENCES twuanis_canonical_private.offer_order_snapshots(id),acknowledgement_id uuid REFERENCES twuanis_canonical_private.offer_paid_acknowledgements(id),
 effective_at timestamptz NOT NULL,expires_at timestamptz,issued_at timestamptz NOT NULL DEFAULT clock_timestamp(),provenance jsonb NOT NULL CHECK(jsonb_typeof(provenance)='object'),
 UNIQUE(account_id,origin),CHECK(expires_at IS NULL OR expires_at>effective_at),CHECK(isfinite(effective_at) AND(expires_at IS NULL OR isfinite(expires_at))),
 CHECK((kind='INCLUDED_PACKAGE' AND term_id IS NOT NULL AND package_id IS NOT NULL AND order_id IS NOT NULL AND acknowledgement_id IS NOT NULL AND expires_at IS NOT NULL)
 OR(kind='ADMIN_ALLOWANCE' AND term_id IS NULL AND package_id IS NULL AND order_id IS NULL AND acknowledgement_id IS NULL AND quantity=3 AND expires_at IS NOT NULL)
 OR(kind='PURCHASED' AND term_id IS NULL AND package_id IS NULL AND order_id IS NOT NULL AND acknowledgement_id IS NOT NULL AND expires_at IS NULL AND quantity IN(2,5,10,20,50))));
CREATE UNIQUE INDEX execution_credit_one_term ON twuanis_canonical_private.execution_credit_allocations(term_id) WHERE term_id IS NOT NULL;
CREATE UNIQUE INDEX execution_credit_one_purchase ON twuanis_canonical_private.execution_credit_allocations(order_id) WHERE kind='PURCHASED';
CREATE TABLE twuanis_canonical_private.execution_credit_executions(
 id uuid PRIMARY KEY,account_id uuid NOT NULL REFERENCES twuanis_canonical_private.account_principals(id),request_id uuid NOT NULL,
 orchestrator_id text NOT NULL REFERENCES twuanis_canonical_private.execution_credit_orchestrators(id),population text NOT NULL CHECK(population IN('PRIVATE','BANK','COMBINED')),
 request_payload jsonb NOT NULL CHECK(jsonb_typeof(request_payload)='object'),allocation_id uuid REFERENCES twuanis_canonical_private.execution_credit_allocations(id),
 authority jsonb NOT NULL CHECK(jsonb_typeof(authority)='object'),reserved_at timestamptz NOT NULL DEFAULT clock_timestamp(),lease_until timestamptz NOT NULL,
 UNIQUE(account_id,request_id),CHECK(isfinite(lease_until) AND lease_until>reserved_at),CHECK((allocation_id IS NULL)=(authority->>'kind'='OWNER_UNMETERED')));
CREATE TABLE twuanis_canonical_private.execution_credit_reports(
 id uuid PRIMARY KEY,execution_id uuid NOT NULL UNIQUE REFERENCES twuanis_canonical_private.execution_credit_executions(id),account_id uuid NOT NULL REFERENCES twuanis_canonical_private.account_principals(id),
 body jsonb NOT NULL CHECK(jsonb_typeof(body)='object'),content_md5 text NOT NULL CHECK(content_md5~'^[0-9a-f]{32}$'),substantive_count integer NOT NULL CHECK(substantive_count>=0 AND substantive_count<=17),created_at timestamptz NOT NULL DEFAULT clock_timestamp());
CREATE TABLE twuanis_canonical_private.execution_credit_events(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,account_id uuid NOT NULL REFERENCES twuanis_canonical_private.account_principals(id),allocation_id uuid REFERENCES twuanis_canonical_private.execution_credit_allocations(id),execution_id uuid REFERENCES twuanis_canonical_private.execution_credit_executions(id),report_id uuid REFERENCES twuanis_canonical_private.execution_credit_reports(id),
 kind text NOT NULL CHECK(kind IN('ALLOCATION_ISSUED','PURCHASE_CREDITED','EXECUTION_RESERVED','RESERVATION_RELEASED','EXECUTION_CONSUMED','ALLOCATION_EXPIRED','ADJUSTMENT','REFUND','OWNER_COMPLETED')),
 quantity bigint NOT NULL,occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),actor_id uuid REFERENCES twuanis_canonical_private.account_principals(id),request_id uuid NOT NULL,metadata jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(metadata)='object'),
 CHECK((kind='ADJUSTMENT' AND quantity<>0 AND abs(quantity)<=1000000) OR(kind IN('ALLOCATION_ISSUED','PURCHASE_CREDITED','ALLOCATION_EXPIRED') AND quantity>=0) OR(kind IN('EXECUTION_RESERVED','RESERVATION_RELEASED') AND quantity IN(0,1)) OR(kind IN('EXECUTION_CONSUMED','REFUND') AND quantity=1) OR(kind='OWNER_COMPLETED' AND quantity=0)),
 CHECK((kind IN('EXECUTION_RESERVED','RESERVATION_RELEASED','EXECUTION_CONSUMED','OWNER_COMPLETED','REFUND'))=(execution_id IS NOT NULL)),
 CHECK(kind NOT IN('EXECUTION_CONSUMED','OWNER_COMPLETED') OR report_id IS NOT NULL),UNIQUE(execution_id,kind));
CREATE UNIQUE INDEX execution_credit_issue_once ON twuanis_canonical_private.execution_credit_events(allocation_id) WHERE kind IN('ALLOCATION_ISSUED','PURCHASE_CREDITED');
CREATE UNIQUE INDEX execution_credit_expire_once ON twuanis_canonical_private.execution_credit_events(allocation_id) WHERE kind='ALLOCATION_EXPIRED';
CREATE TABLE twuanis_canonical_private.execution_credit_receipts(
 account_id uuid NOT NULL REFERENCES twuanis_canonical_private.account_principals(id),request_id uuid NOT NULL,command jsonb NOT NULL,result jsonb NOT NULL,occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(account_id,request_id));
DO $$DECLARE t text;BEGIN
 FOREACH t IN ARRAY ARRAY['execution_credit_orchestrators','execution_credit_allocations','execution_credit_executions','execution_credit_reports','execution_credit_events','execution_credit_receipts'] LOOP
  EXECUTE format('ALTER TABLE twuanis_canonical_private.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON twuanis_canonical_private.%I FROM PUBLIC,anon,authenticated,service_role',t);
  EXECUTE format('CREATE TRIGGER immutable_history BEFORE UPDATE OR DELETE OR TRUNCATE ON twuanis_canonical_private.%I FOR EACH STATEMENT EXECUTE FUNCTION twuanis_canonical_private.administrative_immutable()',t);
 END LOOP;
END$$;
REVOKE ALL ON SEQUENCE twuanis_canonical_private.execution_credit_events_id_seq FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION twuanis_canonical_private.execution_credit_actor() RETURNS uuid LANGUAGE plpgsql VOLATILE SET search_path=pg_catalog AS $$DECLARE a uuid;BEGIN
 IF auth.jwt()->>'role' IS DISTINCT FROM 'authenticated' OR jsonb_typeof(auth.jwt()->'exp') IS DISTINCT FROM 'number' OR(auth.jwt()->>'exp')::numeric<=extract(epoch FROM clock_timestamp()) THEN RAISE EXCEPTION 'Current authenticated session required' USING ERRCODE='42501';END IF;
 a:=twuanis_remates_private.live_session_actor();
 IF EXISTS(SELECT 1 FROM auth.sessions WHERE id=(auth.jwt()->>'session_id')::uuid AND user_id=a AND not_after IS NOT NULL AND not_after<=clock_timestamp())THEN RAISE EXCEPTION 'Session expired' USING ERRCODE='42501';END IF;RETURN a;
END$$;
CREATE FUNCTION twuanis_canonical_private.execution_credit_bridge(p_claims jsonb) RETURNS uuid LANGUAGE plpgsql VOLATILE SET search_path=pg_catalog AS $$DECLARE a uuid;BEGIN
 IF auth.jwt()->>'role' IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Trusted server required' USING ERRCODE='42501';END IF;
 IF jsonb_typeof(p_claims)<>'object' OR (SELECT array_agg(k ORDER BY k) FROM jsonb_object_keys(p_claims)k)<>ARRAY['aal','exp','role','session_id','sub'] OR p_claims->>'role'<>'authenticated' OR p_claims->>'aal' IS NULL OR p_claims->>'aal' NOT IN('aal1','aal2') OR jsonb_typeof(p_claims->'exp')<>'number' OR(p_claims->>'exp')::numeric<=extract(epoch FROM clock_timestamp()) THEN RAISE EXCEPTION 'Verified current customer claims required' USING ERRCODE='42501';END IF;
 PERFORM set_config('request.jwt.claims',p_claims::text,true);
 a:=twuanis_canonical_private.execution_credit_actor();
 PERFORM pg_advisory_xact_lock(3512,hashtext(a::text));RETURN a;
END$$;
CREATE FUNCTION twuanis_canonical_private.execution_credit_is_admin(p_account uuid) RETURNS boolean LANGUAGE sql STABLE SET search_path=pg_catalog AS $$
 SELECT EXISTS(SELECT 1 FROM twuanis_canonical_private.administrators WHERE user_id=p_account AND active) OR EXISTS(SELECT 1 FROM twuanis_canonical_private.top_administrator WHERE user_id=p_account)
$$;
CREATE FUNCTION twuanis_canonical_private.execution_credit_authority(p_orchestrator text,p_population text) RETURNS jsonb LANGUAGE plpgsql VOLATILE SET search_path=pg_catalog AS $$
DECLARE a uuid;o twuanis_canonical_private.execution_credit_orchestrators%ROWTYPE;t record;cap text;ok boolean;
BEGIN
 a:=twuanis_canonical_private.execution_credit_actor();
 IF p_population IS NULL OR p_population NOT IN('PRIVATE','BANK','COMBINED') THEN RAISE EXCEPTION 'Explicit population required' USING ERRCODE='22023';END IF;
 SELECT * INTO STRICT o FROM twuanis_canonical_private.execution_credit_orchestrators WHERE id=p_orchestrator;
 IF public.is_current_user_owner() THEN RETURN jsonb_build_object('kind','OWNER_UNMETERED','accountId',a,'orchestrator',o.id,'version',o.version,'capabilities',o.capabilities,'population',p_population);END IF;
 FOR t IN SELECT e.id,e.configuration_id,c.capabilities,e.product_id,e.starts_at,e.ends_at FROM twuanis_canonical_private.entitlement_terms e
 JOIN twuanis_canonical_private.intelligence_package_rights r ON r.id=e.id AND r.account_id=e.account_id AND r.package_id=e.product_id AND r.configuration_id=e.configuration_id AND r.starts_at=e.starts_at AND r.ends_at=e.ends_at
 JOIN twuanis_canonical_private.intelligence_package_configurations c ON c.id=e.configuration_id AND c.package_id=e.product_id
 WHERE e.account_id=a AND e.product_class='PACKAGE' AND e.product_id IN(o.package_id,'pkg-pricing-position-relationships') AND c.capabilities@>o.capabilities AND e.starts_at<=statement_timestamp() AND e.ends_at>statement_timestamp() AND r.revoked_at IS NULL AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.entitlement_revocations v WHERE v.term_id=e.id)
 ORDER BY e.ends_at,e.id LOOP
  ok:=true;
  FOREACH cap IN ARRAY o.capabilities LOOP
   IF NOT public.current_account_has_capability(cap) THEN ok:=false;EXIT;END IF;
   IF p_population<>'PRIVATE' AND (NOT public.current_account_has_population_capability(cap,'BANK') OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(twuanis_canonical_private.bank_analytical_grant_terms(a,cap)) x WHERE x->>'id'=t.id::text)) THEN ok:=false;EXIT;END IF;
  END LOOP;
  IF ok THEN RETURN jsonb_build_object('kind','PACKAGE','accountId',a,'orchestrator',o.id,'version',o.version,'termId',t.id,'configurationId',t.configuration_id,'packageId',t.product_id,'capabilities',o.capabilities,'population',p_population,'startsAt',t.starts_at,'endsAt',t.ends_at);END IF;
 END LOOP;
 RAISE EXCEPTION 'Current Package and same-term population authority required' USING ERRCODE='42501';
END$$;
CREATE FUNCTION twuanis_canonical_private.execution_credit_monthly_term_source(p_term uuid) RETURNS boolean LANGUAGE sql VOLATILE SET search_path=pg_catalog AS $$
 SELECT EXISTS(SELECT 1 FROM twuanis_canonical_private.entitlement_terms t
 JOIN twuanis_canonical_private.intelligence_package_rights r ON r.id=t.id AND r.account_id=t.account_id AND r.package_id=t.product_id AND r.configuration_id=t.configuration_id AND r.starts_at=t.starts_at AND r.ends_at=t.ends_at
 JOIN twuanis_canonical_private.intelligence_package_configurations c ON c.id=t.configuration_id AND c.package_id=t.product_id
 JOIN twuanis_canonical_private.offer_order_snapshots o ON o.id=t.order_id AND o.account_id=t.account_id AND o.product_id=t.product_id AND o.target_type='package'
 JOIN twuanis_canonical_private.offer_paid_acknowledgements ack ON ack.id=t.acknowledgement_id AND ack.order_id=o.id AND ack.currency=o.currency AND ack.amount=(o.resolved_terms->>'total')::numeric
 WHERE t.id=p_term AND t.product_class='PACKAGE' AND t.source='PURCHASED' AND t.product_id IN('pkg-matching-market-comparison','pkg-pricing-position-relationships')
 AND c.term_unit='month' AND c.term_quantity=1 AND o.resolved_terms->'terms'->>'unit'='month' AND o.resolved_terms->'terms'->>'quantity'='1' AND o.resolved_terms->>'configurationId'=t.configuration_id::text

 AND((ack.source='sinpe' AND EXISTS(SELECT 1 FROM twuanis_canonical_private.sinpe_review_decisions d WHERE d.acknowledgement_id=ack.id AND d.disposition='APPROVED')) OR(ack.source='onvo' AND EXISTS(SELECT 1 FROM twuanis_canonical_private.onvo_receipts v WHERE v.acknowledgement_id=ack.id AND v.disposition='APPROVED'))))
$$;
CREATE FUNCTION twuanis_canonical_private.execution_credit_qualifying_term(p_term uuid) RETURNS boolean LANGUAGE sql VOLATILE SET search_path=pg_catalog AS $$
 SELECT twuanis_canonical_private.execution_credit_monthly_term_source(p_term) AND EXISTS(SELECT 1 FROM twuanis_canonical_private.entitlement_terms t JOIN twuanis_canonical_private.intelligence_package_rights r ON r.id=t.id WHERE t.id=p_term AND t.starts_at<=statement_timestamp() AND t.ends_at>statement_timestamp() AND r.revoked_at IS NULL AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.entitlement_revocations v WHERE v.term_id=t.id))
$$;
CREATE FUNCTION twuanis_canonical_private.execution_credit_allocation_live(p_allocation uuid) RETURNS boolean LANGUAGE sql VOLATILE SET search_path=pg_catalog AS $$
 SELECT EXISTS(SELECT 1 FROM twuanis_canonical_private.execution_credit_allocations a WHERE a.id=p_allocation AND a.effective_at<=statement_timestamp() AND(a.expires_at IS NULL OR a.expires_at>statement_timestamp()) AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.execution_credit_events e WHERE e.allocation_id=a.id AND e.kind='ALLOCATION_EXPIRED') AND
 (a.kind='PURCHASED' OR(a.kind='INCLUDED_PACKAGE' AND twuanis_canonical_private.execution_credit_qualifying_term(a.term_id)) OR(a.kind='ADMIN_ALLOWANCE' AND twuanis_canonical_private.execution_credit_is_admin(a.account_id))))
$$;
CREATE FUNCTION twuanis_canonical_private.execution_credit_execution_state(p_execution uuid) RETURNS text LANGUAGE sql STABLE SET search_path=pg_catalog AS $$
 SELECT CASE WHEN EXISTS(SELECT 1 FROM twuanis_canonical_private.execution_credit_events WHERE execution_id=p_execution AND kind IN('EXECUTION_CONSUMED','OWNER_COMPLETED')) THEN 'COMPLETED'
 WHEN EXISTS(SELECT 1 FROM twuanis_canonical_private.execution_credit_events WHERE execution_id=p_execution AND kind='RESERVATION_RELEASED') THEN 'RELEASED' ELSE 'RESERVED' END
$$;
CREATE FUNCTION twuanis_canonical_private.execution_credit_remaining(p_allocation uuid) RETURNS bigint LANGUAGE plpgsql VOLATILE SET search_path=pg_catalog AS $$DECLARE n bigint;BEGIN
 SELECT a.quantity+coalesce(sum(CASE WHEN e.kind IN('ADJUSTMENT','REFUND')THEN e.quantity WHEN e.kind IN('EXECUTION_CONSUMED','ALLOCATION_EXPIRED','EXECUTION_RESERVED')THEN -e.quantity WHEN e.kind='RESERVATION_RELEASED'THEN e.quantity ELSE 0 END),0)::bigint INTO n
 FROM twuanis_canonical_private.execution_credit_allocations a LEFT JOIN twuanis_canonical_private.execution_credit_events e ON e.allocation_id=a.id WHERE a.id=p_allocation GROUP BY a.quantity;
 -- CONSUMED retires an already-reserved unit; it must not debit available units twice.
 n:=n+coalesce((SELECT sum(quantity) FROM twuanis_canonical_private.execution_credit_events WHERE allocation_id=p_allocation AND kind='EXECUTION_CONSUMED'),0)::bigint;
 IF n IS NULL OR n<0 THEN RAISE EXCEPTION 'Invalid negative execution-credit balance' USING ERRCODE='23514';END IF;RETURN n;
END$$;
CREATE FUNCTION twuanis_canonical_private.execution_credit_event(p_account uuid,p_allocation uuid,p_execution uuid,p_report uuid,p_kind text,p_quantity bigint,p_actor uuid,p_request uuid,p_metadata jsonb DEFAULT '{}') RETURNS bigint LANGUAGE plpgsql VOLATILE SET search_path=pg_catalog AS $$DECLARE id bigint;BEGIN
 IF p_allocation IS NOT NULL AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.execution_credit_allocations WHERE execution_credit_allocations.id=p_allocation AND account_id=p_account) OR p_execution IS NOT NULL AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.execution_credit_executions WHERE execution_credit_executions.id=p_execution AND account_id=p_account AND allocation_id IS NOT DISTINCT FROM p_allocation) OR p_report IS NOT NULL AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.execution_credit_reports WHERE execution_credit_reports.id=p_report AND execution_id=p_execution AND account_id=p_account) THEN RAISE EXCEPTION 'Exact accounting identity required' USING ERRCODE='23514';END IF;
 INSERT INTO twuanis_canonical_private.execution_credit_events(account_id,allocation_id,execution_id,report_id,kind,quantity,actor_id,request_id,metadata) VALUES(p_account,p_allocation,p_execution,p_report,p_kind,p_quantity,p_actor,p_request,p_metadata) RETURNING execution_credit_events.id INTO id;RETURN id;
END$$;
CREATE FUNCTION twuanis_canonical_private.execution_credit_issue(p_account uuid,p_kind text,p_quantity bigint,p_origin text,p_package text,p_term uuid,p_order uuid,p_ack uuid,p_start timestamptz,p_end timestamptz,p_provenance jsonb,p_request uuid) RETURNS uuid LANGUAGE plpgsql VOLATILE SET search_path=pg_catalog AS $$DECLARE id uuid;old twuanis_canonical_private.execution_credit_allocations%ROWTYPE;BEGIN

 IF p_kind='INCLUDED_PACKAGE' AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.entitlement_terms t WHERE t.id=p_term AND t.account_id=p_account AND t.product_id=p_package AND t.order_id=p_order AND t.acknowledgement_id=p_ack AND t.starts_at=p_start AND t.ends_at=p_end AND p_origin='TERM:'||t.id AND p_quantity=CASE WHEN t.product_id='pkg-matching-market-comparison'THEN 5 WHEN t.product_id='pkg-pricing-position-relationships'THEN 10 ELSE 0 END AND p_provenance->>'configurationId'=t.configuration_id::text AND twuanis_canonical_private.execution_credit_monthly_term_source(t.id) AND t.starts_at<=clock_timestamp() AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.entitlement_revocations v WHERE v.term_id=t.id AND v.revoked_at<=t.starts_at))THEN RAISE EXCEPTION 'Exact included term provenance required';END IF;
 SELECT * INTO old FROM twuanis_canonical_private.execution_credit_allocations WHERE account_id=p_account AND origin=p_origin;
 IF FOUND THEN IF(old.kind,old.quantity,old.package_id,old.term_id,old.order_id,old.acknowledgement_id,old.effective_at,old.expires_at,old.provenance) IS DISTINCT FROM(p_kind,p_quantity,p_package,p_term,p_order,p_ack,p_start,p_end,p_provenance) THEN RAISE EXCEPTION 'Allocation retry conflict';END IF;RETURN old.id;END IF;
 INSERT INTO twuanis_canonical_private.execution_credit_allocations(account_id,kind,quantity,origin,package_id,term_id,order_id,acknowledgement_id,effective_at,expires_at,provenance) VALUES(p_account,p_kind,p_quantity,p_origin,p_package,p_term,p_order,p_ack,p_start,p_end,p_provenance) RETURNING execution_credit_allocations.id INTO id;
 PERFORM twuanis_canonical_private.execution_credit_event(p_account,id,NULL,NULL,CASE WHEN p_kind='PURCHASED'THEN 'PURCHASE_CREDITED'ELSE'ALLOCATION_ISSUED'END,p_quantity,p_account,p_request,p_provenance);RETURN id;
END$$;
CREATE FUNCTION twuanis_canonical_private.execution_credit_maintain(p_account uuid,p_request uuid) RETURNS void LANGUAGE plpgsql VOLATILE SET search_path=pg_catalog AS $$DECLARE x record;n bigint;BEGIN
 FOR x IN SELECT e.* FROM twuanis_canonical_private.execution_credit_executions e WHERE e.account_id=p_account AND twuanis_canonical_private.execution_credit_execution_state(e.id)='RESERVED' AND(e.lease_until<=clock_timestamp() OR(e.allocation_id IS NOT NULL AND NOT twuanis_canonical_private.execution_credit_allocation_live(e.allocation_id))) ORDER BY e.id LOOP
  PERFORM twuanis_canonical_private.execution_credit_event(p_account,x.allocation_id,x.id,NULL,'RESERVATION_RELEASED',CASE WHEN x.allocation_id IS NULL THEN 0 ELSE 1 END,p_account,p_request,jsonb_build_object('reason','LEASE_OR_ALLOCATION_EXPIRED'));
 END LOOP;
 FOR x IN SELECT a.* FROM twuanis_canonical_private.execution_credit_allocations a WHERE a.account_id=p_account AND a.kind<>'PURCHASED' AND(a.expires_at<=clock_timestamp() OR(a.kind='INCLUDED_PACKAGE' AND NOT twuanis_canonical_private.execution_credit_qualifying_term(a.term_id))) AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.execution_credit_events e WHERE e.allocation_id=a.id AND e.kind='ALLOCATION_EXPIRED') ORDER BY a.id LOOP
  n:=twuanis_canonical_private.execution_credit_remaining(x.id);PERFORM twuanis_canonical_private.execution_credit_event(p_account,x.id,NULL,NULL,'ALLOCATION_EXPIRED',n,p_account,p_request,jsonb_build_object('originalQuantity',x.quantity,'expiresAt',x.expires_at,'termId',x.term_id,'reason','TIME_OR_ORIGIN_AUTHORITY_ENDED'));
 END LOOP;
END$$;
CREATE FUNCTION twuanis_canonical_private.execution_credit_sync(p_account uuid,p_request uuid) RETURNS void LANGUAGE plpgsql VOLATILE SET search_path=pg_catalog AS $$DECLARE t record;start_at timestamptz;end_at timestamptz;BEGIN
 FOR t IN SELECT * FROM twuanis_canonical_private.entitlement_terms WHERE account_id=p_account AND starts_at<=clock_timestamp() AND twuanis_canonical_private.execution_credit_monthly_term_source(id) AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.entitlement_revocations v WHERE v.term_id=entitlement_terms.id AND v.revoked_at<=entitlement_terms.starts_at) ORDER BY id LOOP
  PERFORM twuanis_canonical_private.execution_credit_issue(p_account,'INCLUDED_PACKAGE',CASE WHEN t.product_id='pkg-matching-market-comparison'THEN 5 ELSE 10 END,'TERM:'||t.id,t.product_id,t.id,t.order_id,t.acknowledgement_id,t.starts_at,t.ends_at,jsonb_build_object('source','PURCHASED_MONTHLY_TERM','configurationId',t.configuration_id,'termId',t.id),p_request);
 END LOOP;
 IF twuanis_canonical_private.execution_credit_is_admin(p_account) AND NOT public.is_current_user_owner() THEN
  start_at:=date_trunc('month',clock_timestamp() AT TIME ZONE 'America/Costa_Rica') AT TIME ZONE 'America/Costa_Rica';end_at:=((start_at AT TIME ZONE 'America/Costa_Rica')+interval'1 month')AT TIME ZONE 'America/Costa_Rica';
  IF NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.execution_credit_allocations WHERE account_id=p_account AND origin='ADMIN:'||to_char(start_at AT TIME ZONE 'America/Costa_Rica','YYYY-MM')) THEN
  PERFORM twuanis_canonical_private.execution_credit_issue(p_account,'ADMIN_ALLOWANCE',3,'ADMIN:'||to_char(start_at AT TIME ZONE 'America/Costa_Rica','YYYY-MM'),NULL,NULL,NULL,NULL,start_at,end_at,jsonb_build_object('source','CANONICAL_ADMIN','period',to_char(start_at AT TIME ZONE 'America/Costa_Rica','YYYY-MM'),'timezone','America/Costa_Rica','authoritySnapshot',coalesce((SELECT to_jsonb(ad) FROM twuanis_canonical_private.administrators ad WHERE ad.user_id=p_account),(SELECT to_jsonb(ad)FROM twuanis_canonical_private.top_administrator ad WHERE ad.user_id=p_account))),p_request);END IF;
 END IF;
 PERFORM twuanis_canonical_private.execution_credit_maintain(p_account,p_request);
END$$;
CREATE FUNCTION twuanis_canonical_private.execution_credit_term_allocation() RETURNS trigger LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$BEGIN
 -- Deferred: the existing issuer inserts the matching rights after the term.
 -- Add only accounting effects; do not replace payment or entitlement issuers.
 IF NEW.product_class='PACKAGE' AND NEW.source='PURCHASED' AND NEW.starts_at<=clock_timestamp() AND twuanis_canonical_private.execution_credit_qualifying_term(NEW.id) THEN
  PERFORM pg_advisory_xact_lock(3512,hashtext(NEW.account_id::text));
  PERFORM twuanis_canonical_private.execution_credit_issue(NEW.account_id,'INCLUDED_PACKAGE',CASE WHEN NEW.product_id='pkg-matching-market-comparison'THEN 5 ELSE 10 END,'TERM:'||NEW.id,NEW.product_id,NEW.id,NEW.order_id,NEW.acknowledgement_id,NEW.starts_at,NEW.ends_at,jsonb_build_object('source','PURCHASED_MONTHLY_TERM','configurationId',NEW.configuration_id,'termId',NEW.id),NEW.request_id);
 END IF;RETURN NULL;
END$$;
CREATE CONSTRAINT TRIGGER execution_credit_monthly_term_allocation AFTER INSERT ON twuanis_canonical_private.entitlement_terms DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.execution_credit_term_allocation();
CREATE FUNCTION public.read_execution_credit_authority(p_orchestrator text,p_population text) RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$BEGIN
 RETURN twuanis_canonical_private.execution_credit_authority(p_orchestrator,p_population);
END$$;
CREATE FUNCTION public.read_execution_credits(p_after_allocation uuid DEFAULT NULL,p_after_event bigint DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$DECLARE a uuid;allocations jsonb;events jsonb;BEGIN
 a:=twuanis_canonical_private.execution_credit_actor();IF p_after_event IS NOT NULL AND p_after_event<1 THEN RAISE EXCEPTION 'Invalid cursor';END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',x.id,'kind',x.kind,'quantity',x.quantity::text,'packageId',x.package_id,'termId',x.term_id,'orderId',x.order_id,'effectiveAt',x.effective_at,'expiresAt',x.expires_at,'remaining',CASE WHEN twuanis_canonical_private.execution_credit_allocation_live(x.id) THEN twuanis_canonical_private.execution_credit_remaining(x.id) ELSE 0 END::text,'active',twuanis_canonical_private.execution_credit_allocation_live(x.id))ORDER BY x.id),'[]')INTO allocations FROM(SELECT * FROM twuanis_canonical_private.execution_credit_allocations WHERE account_id=a AND(p_after_allocation IS NULL OR id>p_after_allocation)ORDER BY id LIMIT 26)x;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',x.id::text,'kind',x.kind,'quantity',x.quantity::text,'allocationId',x.allocation_id,'executionId',x.execution_id,'reportId',x.report_id,'at',x.occurred_at,'metadata',x.metadata)ORDER BY x.id),'[]')INTO events FROM(SELECT * FROM twuanis_canonical_private.execution_credit_events WHERE account_id=a AND(p_after_event IS NULL OR id>p_after_event)ORDER BY id LIMIT 26)x;
 RETURN jsonb_build_object('ownerUnmetered',public.is_current_user_owner(),'balance',(SELECT coalesce(sum(twuanis_canonical_private.execution_credit_remaining(id)),0)::text FROM twuanis_canonical_private.execution_credit_allocations WHERE account_id=a AND twuanis_canonical_private.execution_credit_allocation_live(id)),'allocations',allocations,'events',events,'purchase',jsonb_build_object('enabled',false,'usdUnit','1','crcUnit','500','quantities',ARRAY[2,5,10,20,50]));
END$$;
CREATE FUNCTION public.record_execution_credit_report(p_claims jsonb,p_execution uuid,p_report uuid,p_body jsonb) RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE a uuid;x twuanis_canonical_private.execution_credit_executions%ROWTYPE;o twuanis_canonical_private.execution_credit_orchestrators%ROWTYPE;old twuanis_canonical_private.execution_credit_reports%ROWTYPE;ids text[];count_sub integer;
BEGIN
 a:=twuanis_canonical_private.execution_credit_bridge(p_claims);SELECT * INTO STRICT x FROM twuanis_canonical_private.execution_credit_executions WHERE id=p_execution AND account_id=a;
 SELECT * INTO old FROM twuanis_canonical_private.execution_credit_reports WHERE execution_id=x.id;
 IF FOUND THEN IF old.id<>p_report OR old.body IS DISTINCT FROM p_body THEN RAISE EXCEPTION 'Immutable report retry conflict';END IF;RETURN jsonb_build_object('id',old.id,'substantiveCount',old.substantive_count,'replayed',true);END IF;
 IF p_report IS NULL OR twuanis_canonical_private.execution_credit_execution_state(x.id)<>'RESERVED' OR x.lease_until<=clock_timestamp() OR jsonb_typeof(p_body)<>'object' OR octet_length(p_body::text)>262144 OR p_body->>'language' NOT IN('en','es') OR p_body->>'language' IS NULL OR p_body->>'orchestrator' IS DISTINCT FROM x.orchestrator_id OR p_body->>'population' IS DISTINCT FROM x.population OR p_body->'request' IS DISTINCT FROM x.request_payload OR jsonb_typeof(p_body->'engines') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Complete bound durable report evidence required';END IF;
 SELECT * INTO STRICT o FROM twuanis_canonical_private.execution_credit_orchestrators WHERE id=x.orchestrator_id;
 SELECT array_agg(v->>'id' ORDER BY v->>'id'),count(*)FILTER(WHERE v->>'state'='SUBSTANTIVE') INTO ids,count_sub FROM jsonb_array_elements(p_body->'engines')v;
 IF ids IS DISTINCT FROM(SELECT array_agg(e ORDER BY e)FROM unnest(o.engines)e) OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_body->'engines')v WHERE jsonb_typeof(v)<>'object' OR v->>'state' IS NULL OR v->>'state' NOT IN('SUBSTANTIVE','UNDEFINED') OR(v->>'state'='SUBSTANTIVE' AND(jsonb_typeof(v->'result')NOT IN('object','array')OR v->'result'IS NULL OR v->'result' IN('{}'::jsonb,'[]'::jsonb))) OR(v->>'state'='UNDEFINED' AND coalesce(length(btrim(v->>'reason')),0)=0))THEN RAISE EXCEPTION 'Exact engine coverage and verified result states required';END IF;
 INSERT INTO twuanis_canonical_private.execution_credit_reports(id,execution_id,account_id,body,content_md5,substantive_count) VALUES(p_report,x.id,a,p_body,md5(p_body::text),count_sub);
 RETURN jsonb_build_object('id',p_report,'substantiveCount',count_sub,'replayed',false);
END$$;
CREATE FUNCTION public.execution_credit_service(p_claims jsonb,p_request uuid,p_command jsonb) RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE a uuid;prior twuanis_canonical_private.execution_credit_receipts%ROWTYPE;x twuanis_canonical_private.execution_credit_executions%ROWTYPE;allocation twuanis_canonical_private.execution_credit_allocations%ROWTYPE;report twuanis_canonical_private.execution_credit_reports%ROWTYPE;authority jsonb;result jsonb;op text;execution_id_value uuid;reason text;n bigint;owner boolean;
BEGIN
 a:=twuanis_canonical_private.execution_credit_bridge(p_claims);op:=p_command->>'operation';
 IF p_request IS NULL OR jsonb_typeof(p_command)IS DISTINCT FROM'object' OR octet_length(p_command::text)>16000 OR op IS NULL OR op NOT IN('sync','reserve','release','settle','adjust','refund')THEN RAISE EXCEPTION 'Bounded execution-credit command required';END IF;
 SELECT * INTO prior FROM twuanis_canonical_private.execution_credit_receipts WHERE account_id=a AND request_id=p_request;
 IF FOUND THEN IF prior.command IS DISTINCT FROM p_command THEN RAISE EXCEPTION 'Command retry conflict';END IF;RETURN prior.result||jsonb_build_object('replayed',true);END IF;
 IF EXISTS(SELECT 1 FROM jsonb_object_keys(p_command)k WHERE k NOT IN('operation','execution','orchestrator','population','request','reason','allocation','delta','confirmed'))THEN RAISE EXCEPTION 'Unknown execution-credit command field';END IF;

 IF(SELECT array_agg(k ORDER BY k)FROM jsonb_object_keys(p_command)k)IS DISTINCT FROM (CASE op
 WHEN'sync'THEN ARRAY['operation'] WHEN'reserve'THEN ARRAY['execution','operation','orchestrator','population','request'] WHEN'release'THEN ARRAY['execution','operation','reason'] WHEN'settle'THEN ARRAY['execution','operation'] WHEN'adjust'THEN ARRAY['allocation','confirmed','delta','operation','reason'] WHEN'refund'THEN ARRAY['confirmed','execution','operation','reason']END) THEN RAISE EXCEPTION 'Exact operation fields required';END IF;
 PERFORM twuanis_canonical_private.execution_credit_sync(a,p_request);owner:=public.is_current_user_owner();
 IF op='sync' THEN result:=jsonb_build_object('state','SYNCHRONIZED');
 ELSIF op='reserve' THEN
  execution_id_value:=(p_command->>'execution')::uuid;authority:=twuanis_canonical_private.execution_credit_authority(p_command->>'orchestrator',p_command->>'population');
  IF execution_id_value IS NULL OR jsonb_typeof(p_command->'request') IS DISTINCT FROM'object' THEN RAISE EXCEPTION 'Execution identity and question required';END IF;
  SELECT * INTO x FROM twuanis_canonical_private.execution_credit_executions WHERE execution_credit_executions.id=execution_id_value;
  IF FOUND THEN IF x.account_id<>a OR x.orchestrator_id IS DISTINCT FROM p_command->>'orchestrator' OR x.population IS DISTINCT FROM p_command->>'population' OR x.request_payload IS DISTINCT FROM p_command->'request' THEN RAISE EXCEPTION 'Execution retry conflict';END IF;
   result:=jsonb_build_object('execution',execution_id_value,'state',twuanis_canonical_private.execution_credit_execution_state(execution_id_value),'allocation',x.allocation_id,'unmetered',x.allocation_id IS NULL);
  ELSE
   IF NOT owner THEN
    SELECT * INTO allocation FROM twuanis_canonical_private.execution_credit_allocations c WHERE c.account_id=a AND twuanis_canonical_private.execution_credit_allocation_live(c.id) AND twuanis_canonical_private.execution_credit_remaining(c.id)>0
    ORDER BY CASE c.kind WHEN 'INCLUDED_PACKAGE'THEN 1 WHEN'ADMIN_ALLOWANCE'THEN 2 ELSE 3 END,c.expires_at NULLS LAST,c.effective_at,c.id LIMIT 1;
    IF NOT FOUND THEN RAISE EXCEPTION 'Execution credit balance required' USING ERRCODE='42501';END IF;
   END IF;
   INSERT INTO twuanis_canonical_private.execution_credit_executions(id,account_id,request_id,orchestrator_id,population,request_payload,allocation_id,authority,reserved_at,lease_until) VALUES(execution_id_value,a,p_request,p_command->>'orchestrator',p_command->>'population',p_command->'request',allocation.id,authority,clock_timestamp(),clock_timestamp()+interval'10 minutes');
   PERFORM twuanis_canonical_private.execution_credit_event(a,allocation.id,execution_id_value,NULL,'EXECUTION_RESERVED',CASE WHEN owner THEN 0 ELSE 1 END,a,p_request,jsonb_build_object('authority',authority));result:=jsonb_build_object('execution',execution_id_value,'state','RESERVED','allocation',allocation.id,'unmetered',owner);
  END IF;
 ELSIF op IN('release','settle','refund')THEN
  execution_id_value:=(p_command->>'execution')::uuid;SELECT * INTO STRICT x FROM twuanis_canonical_private.execution_credit_executions WHERE execution_credit_executions.id=execution_id_value AND(account_id=a OR(op='refund' AND owner));
  IF op='release' THEN
   reason:=p_command->>'reason';IF reason NOT IN('REQUEST_REJECTED','REQUIRED_ENGINE_FAILED','REPORT_COMPOSITION_FAILED','PERSISTENCE_FAILED','ENTIRELY_UNDEFINED','AUTHORIZATION_LOST','SYSTEM_FAILURE') OR reason IS NULL THEN RAISE EXCEPTION 'Explicit system release reason required';END IF;
   IF twuanis_canonical_private.execution_credit_execution_state(execution_id_value)='COMPLETED'THEN RAISE EXCEPTION 'Completed report cannot be released';END IF;
   IF twuanis_canonical_private.execution_credit_execution_state(execution_id_value)='RESERVED'THEN PERFORM twuanis_canonical_private.execution_credit_event(a,x.allocation_id,execution_id_value,NULL,'RESERVATION_RELEASED',CASE WHEN x.allocation_id IS NULL THEN 0 ELSE 1 END,a,p_request,jsonb_build_object('reason',reason));END IF;result:=jsonb_build_object('execution',execution_id_value,'state','RELEASED');
  ELSIF op='refund' THEN
   IF NOT owner OR p_command->>'confirmed'IS DISTINCT FROM'true' OR p_command->>'reason'NOT IN('SYSTEM_DELIVERY_FAILURE','ACCOUNTING_CORRECTION') OR p_command->>'reason'IS NULL OR x.allocation_id IS NULL OR twuanis_canonical_private.execution_credit_execution_state(execution_id_value)<>'COMPLETED'THEN RAISE EXCEPTION 'Explicit Owner accounting correction required' USING ERRCODE='42501';END IF;
   IF NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.execution_credit_events WHERE execution_id=execution_id_value AND kind='REFUND')THEN PERFORM pg_advisory_xact_lock(3512,hashtext(x.account_id::text));PERFORM twuanis_canonical_private.execution_credit_maintain(x.account_id,p_request);PERFORM twuanis_canonical_private.execution_credit_event(x.account_id,x.allocation_id,execution_id_value,NULL,'REFUND',1,a,p_request,jsonb_build_object('reason',p_command->>'reason'));IF NOT twuanis_canonical_private.execution_credit_allocation_live(x.allocation_id) THEN PERFORM twuanis_canonical_private.execution_credit_event(x.account_id,x.allocation_id,NULL,NULL,'ADJUSTMENT',-1,a,p_request,jsonb_build_object('reason','REFUND_RETAINS_ORIGINAL_EXPIRY','execution',execution_id_value));END IF;END IF;result:=jsonb_build_object('execution',execution_id_value,'state','REFUNDED');
  ELSE
   IF twuanis_canonical_private.execution_credit_execution_state(execution_id_value)<>'RESERVED'THEN result:=jsonb_build_object('execution',execution_id_value,'state',twuanis_canonical_private.execution_credit_execution_state(execution_id_value));
   ELSE
    reason:=NULL;
    BEGIN authority:=twuanis_canonical_private.execution_credit_authority(x.orchestrator_id,x.population);IF authority IS DISTINCT FROM x.authority THEN reason:='AUTHORIZATION_CHANGED';END IF;EXCEPTION WHEN insufficient_privilege THEN reason:='AUTHORIZATION_LOST';END;
    SELECT * INTO report FROM twuanis_canonical_private.execution_credit_reports WHERE execution_id=execution_id_value AND account_id=a;
    IF report.id IS NULL THEN reason:='DURABLE_REPORT_REQUIRED';ELSIF report.substantive_count=0 THEN reason:='ENTIRELY_UNDEFINED';END IF;
    IF reason IS NOT NULL THEN PERFORM twuanis_canonical_private.execution_credit_event(a,x.allocation_id,execution_id_value,NULL,'RESERVATION_RELEASED',CASE WHEN x.allocation_id IS NULL THEN 0 ELSE 1 END,a,p_request,jsonb_build_object('reason',reason));result:=jsonb_build_object('execution',execution_id_value,'state','RELEASED','reason',reason);
    ELSE PERFORM twuanis_canonical_private.execution_credit_event(a,x.allocation_id,execution_id_value,report.id,CASE WHEN x.allocation_id IS NULL THEN'OWNER_COMPLETED'ELSE'EXECUTION_CONSUMED'END,CASE WHEN x.allocation_id IS NULL THEN 0 ELSE 1 END,a,p_request,jsonb_build_object('substantiveCount',report.substantive_count,'contentMD5',report.content_md5));result:=jsonb_build_object('execution',execution_id_value,'state','COMPLETED','report',report.id,'charged',x.allocation_id IS NOT NULL);END IF;
   END IF;
  END IF;
 ELSIF op='adjust'THEN
  IF NOT owner OR p_command->>'confirmed'IS DISTINCT FROM'true' OR coalesce(length(btrim(p_command->>'reason')),0)<8 THEN RAISE EXCEPTION 'Confirmed Owner adjustment required' USING ERRCODE='42501';END IF;
  SELECT * INTO STRICT allocation FROM twuanis_canonical_private.execution_credit_allocations WHERE execution_credit_allocations.id=(p_command->>'allocation')::uuid;
  PERFORM pg_advisory_xact_lock(3512,hashtext(allocation.account_id::text));n:=(p_command->>'delta')::bigint;
  IF n IS NULL OR n=0 OR abs(n)>1000000 OR NOT twuanis_canonical_private.execution_credit_allocation_live(allocation.id) OR twuanis_canonical_private.execution_credit_remaining(allocation.id)+n<0 THEN RAISE EXCEPTION 'Bounded nonnegative adjustment required';END IF;
  PERFORM twuanis_canonical_private.execution_credit_event(allocation.account_id,allocation.id,NULL,NULL,'ADJUSTMENT',n,a,p_request,jsonb_build_object('reason',p_command->>'reason','authority','OWNER_ADJUSTMENT'));result:=jsonb_build_object('allocation',allocation.id,'state','ADJUSTED','delta',n::text);
 END IF;
 INSERT INTO twuanis_canonical_private.execution_credit_receipts(account_id,request_id,command,result) VALUES(a,p_request,p_command,result);RETURN result||jsonb_build_object('replayed',false);
END$$;
-- Dormant correspondence contract. Existing Orders do not yet create this target.
-- No Order, payment, provider, price or fulfillment function is replaced or activated.
CREATE FUNCTION public.fulfill_execution_credit_purchase(p_order uuid,p_ack uuid,p_request uuid) RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE o twuanis_canonical_private.offer_order_snapshots%ROWTYPE;a twuanis_canonical_private.offer_paid_acknowledgements%ROWTYPE;old twuanis_canonical_private.execution_credit_receipts%ROWTYPE;q bigint;id uuid;command jsonb;result jsonb;
BEGIN
 IF auth.jwt()->>'role' IS DISTINCT FROM'service_role' OR p_request IS NULL THEN RAISE EXCEPTION 'Trusted payment fulfillment required' USING ERRCODE='42501';END IF;
 PERFORM pg_advisory_xact_lock(3110,1);PERFORM pg_advisory_xact_lock(3200,hashtext(p_order::text));SELECT * INTO STRICT o FROM twuanis_canonical_private.offer_order_snapshots WHERE offer_order_snapshots.id=p_order;
 PERFORM pg_advisory_xact_lock(3512,hashtext(o.account_id::text));command:=jsonb_build_object('operation','purchase.credit','order',p_order,'ack',p_ack);
 SELECT * INTO old FROM twuanis_canonical_private.execution_credit_receipts WHERE account_id=o.account_id AND request_id=p_request;
 IF FOUND THEN IF old.command IS DISTINCT FROM command THEN RAISE EXCEPTION 'Purchase retry conflict';END IF;RETURN old.result||jsonb_build_object('replayed',true);END IF;
 q:=(o.resolved_terms->>'quantity')::bigint;SELECT * INTO a FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE offer_paid_acknowledgements.id=p_ack AND order_id=o.id AND currency=o.currency AND amount=(o.resolved_terms->>'total')::numeric;
 IF o.target_type<>'execution_credit' OR o.product_id<>'execution-credit-v1' OR o.resolved_terms->>'productClass'IS DISTINCT FROM'EXECUTION_CREDIT' OR o.resolved_terms->>'priceVersion'IS DISTINCT FROM'1' OR q IS NULL OR q NOT IN(2,5,10,20,50) OR o.currency NOT IN('USD','CRC') OR(o.resolved_terms->>'unitPrice')::numeric IS DISTINCT FROM (CASE WHEN o.currency='USD'THEN 1 ELSE 500 END) OR(o.resolved_terms->>'total')::numeric IS DISTINCT FROM q*(CASE WHEN o.currency='USD'THEN 1 ELSE 500 END) OR a.id IS NULL OR NOT((a.source='sinpe'AND EXISTS(SELECT 1 FROM twuanis_canonical_private.sinpe_review_decisions WHERE acknowledgement_id=a.id AND disposition='APPROVED'))OR(a.source='onvo'AND EXISTS(SELECT 1 FROM twuanis_canonical_private.onvo_receipts WHERE acknowledgement_id=a.id AND disposition='APPROVED')))THEN RAISE EXCEPTION 'Exact approved execution-credit payment correspondence required' USING ERRCODE='23514';END IF;
 id:=twuanis_canonical_private.execution_credit_issue(o.account_id,'PURCHASED',q,'ORDER:'||o.id,NULL,NULL,o.id,a.id,o.created_at,NULL,jsonb_build_object('source','APPROVED_PAYMENT','currency',o.currency,'quantity',q,'total',a.amount::text,'provider',a.source,'orderId',o.id,'acknowledgementId',a.id,'priceVersion',1),p_request);result:=jsonb_build_object('allocation',id,'quantity',q::text);
 INSERT INTO twuanis_canonical_private.execution_credit_receipts(account_id,request_id,command,result)VALUES(o.account_id,p_request,command,result);RETURN result||jsonb_build_object('replayed',false);
END$$;
CREATE FUNCTION public.read_completed_execution_report(p_report uuid) RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$DECLARE a uuid;body jsonb;BEGIN
 a:=twuanis_canonical_private.execution_credit_actor();SELECT r.body INTO body FROM twuanis_canonical_private.execution_credit_reports r WHERE r.id=p_report AND r.account_id=a AND EXISTS(SELECT 1 FROM twuanis_canonical_private.execution_credit_events e WHERE e.report_id=r.id AND e.execution_id=r.execution_id AND e.account_id=a AND e.kind IN('EXECUTION_CONSUMED','OWNER_COMPLETED'));
 IF body IS NULL THEN RAISE EXCEPTION 'Completed account-owned report required' USING ERRCODE='42501';END IF;RETURN body;
END$$;
DO $$DECLARE f record;BEGIN
 FOR f IN SELECT p.oid::regprocedure signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE(n.nspname='twuanis_canonical_private'AND p.proname LIKE'execution_credit_%')OR(n.nspname='public'AND p.proname IN('read_execution_credit_authority','read_execution_credits','record_execution_credit_report','execution_credit_service','fulfill_execution_credit_purchase','read_completed_execution_report'))LOOP
  EXECUTE format('ALTER FUNCTION %s OWNER TO postgres',f.signature);EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',f.signature);
 END LOOP;
END$$;
GRANT EXECUTE ON FUNCTION public.read_execution_credit_authority(text,text),public.read_execution_credits(uuid,bigint),public.read_completed_execution_report(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execution_credit_service(jsonb,uuid,jsonb),public.record_execution_credit_report(jsonb,uuid,uuid,jsonb),public.fulfill_execution_credit_purchase(uuid,uuid,uuid) TO service_role;
NOTIFY pgrst,'reload schema';

-- 104_execution_credit_commercial_integration.sql SHA256 9935ffc2771070a538fd2cae912763dd58b66f9d03e9aad208fa56e4ab3f0494
-- Phase5.2A local preparation only. Migration103 is preserved. No provider activation.
SET LOCAL lock_timeout='5s';SET LOCAL statement_timeout='60s';
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
NOTIFY pgrst,'reload schema';
-- 105_orchestrator_execution.sql SHA256 fccd74b16daedcc72da876144fd18ae8b5be3b40564eef38de57a81515b1c52f
-- Phase 5.3 local preparation: owned execution claims and historical report index.

SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='60s';
DO $$BEGIN
 IF current_user<>'postgres' OR
 md5(pg_get_functiondef('public.execution_credit_service(jsonb,uuid,jsonb)'::regprocedure))<>'bf39f331dd4af451f9043a1ec90967ec' OR
 md5(pg_get_functiondef('public.record_execution_credit_report(jsonb,uuid,uuid,jsonb)'::regprocedure))<>'eed60c06b467c4d9114c6a3838bc0ab1' OR
 md5(pg_get_functiondef('public.read_canonical_bank_analytical_evidence(uuid,text,text,uuid)'::regprocedure))<>'e858c094eea88e61f903baf10a8a2138' OR
 to_regprocedure('public.create_execution_credit_order(uuid,text,text,integer)') IS NULL
 THEN RAISE EXCEPTION 'Reviewed predecessors 102–104 required';END IF;
END$$;
CREATE TABLE twuanis_canonical_private.orchestrator_execution_claims(
 execution_id uuid PRIMARY KEY REFERENCES twuanis_canonical_private.execution_credit_executions(id),
 worker uuid NOT NULL,lease_until timestamptz NOT NULL,attempt integer NOT NULL DEFAULT 1 CHECK(attempt BETWEEN 1 AND 3));
ALTER TABLE twuanis_canonical_private.orchestrator_execution_claims ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON twuanis_canonical_private.orchestrator_execution_claims FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.orchestrator_execution_claim(p_claims jsonb,p_request uuid,p_execution uuid,p_orchestrator text,p_population text,p_question jsonb,p_worker uuid)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE transport text:=current_setting('request.jwt.claims',true);a uuid;authority jsonb;x twuanis_canonical_private.execution_credit_executions%ROWTYPE;j twuanis_canonical_private.orchestrator_execution_claims%ROWTYPE;r jsonb;rid uuid;
BEGIN
 a:=twuanis_canonical_private.execution_credit_bridge(p_claims);
 authority:=twuanis_canonical_private.execution_credit_authority(p_orchestrator,p_population);
 IF p_worker IS NULL THEN RAISE EXCEPTION 'Trusted worker required';END IF;
 -- Account lock comes from the existing bridge. Bound active work independently
 -- of token quantity; retries of the same reserved execution remain admissible.
 IF NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.execution_credit_executions WHERE id=p_execution AND account_id=a)
 AND (SELECT count(*) FROM twuanis_canonical_private.orchestrator_execution_claims claim_row JOIN twuanis_canonical_private.execution_credit_executions ex ON ex.id=claim_row.execution_id WHERE ex.account_id=a AND claim_row.lease_until>clock_timestamp() AND twuanis_canonical_private.execution_credit_execution_state(ex.id)='RESERVED')>=2
 THEN RAISE EXCEPTION 'Two active orchestrator executions per account maximum' USING ERRCODE='54000';END IF;
 PERFORM set_config('request.jwt.claims',transport,true);
 r:=public.execution_credit_service(p_claims,p_request,jsonb_build_object('operation','reserve','execution',p_execution,'orchestrator',p_orchestrator,'population',p_population,'request',p_question));
 SELECT * INTO STRICT x FROM twuanis_canonical_private.execution_credit_executions WHERE id=p_execution AND account_id=a;
 IF x.authority IS DISTINCT FROM authority THEN RAISE EXCEPTION 'Execution authority changed' USING ERRCODE='42501';END IF;
 SELECT id INTO rid FROM twuanis_canonical_private.execution_credit_reports WHERE execution_id=x.id;
 IF rid IS NOT NULL THEN RETURN r||jsonb_build_object('state',twuanis_canonical_private.execution_credit_execution_state(x.id),'report',rid,'reason',(SELECT metadata->>'reason' FROM twuanis_canonical_private.execution_credit_events WHERE execution_id=x.id AND kind='RESERVATION_RELEASED'),'resumeCommit',true);END IF;
 IF twuanis_canonical_private.execution_credit_execution_state(x.id)<>'RESERVED' OR x.lease_until<=clock_timestamp() THEN RETURN r||jsonb_build_object('state','RELEASED');END IF;
 SELECT * INTO j FROM twuanis_canonical_private.orchestrator_execution_claims WHERE execution_id=x.id FOR UPDATE;
 IF FOUND THEN
  IF j.lease_until>clock_timestamp() THEN RETURN jsonb_build_object('state','WORKING','execution',x.id);END IF;
  IF j.attempt>=3 THEN RAISE EXCEPTION 'Execution retry limit reached';END IF;
  UPDATE twuanis_canonical_private.orchestrator_execution_claims SET worker=p_worker,lease_until=least(clock_timestamp()+interval'3 minutes',x.lease_until),attempt=attempt+1 WHERE execution_id=x.id;
 ELSE INSERT INTO twuanis_canonical_private.orchestrator_execution_claims(execution_id,worker,lease_until)VALUES(x.id,p_worker,least(clock_timestamp()+interval'3 minutes',x.lease_until));END IF;
 RETURN jsonb_build_object('state','CLAIMED','execution',x.id,'authority',authority,'createdAt',x.reserved_at);
END$$;
CREATE FUNCTION public.orchestrator_execution_commit(p_claims jsonb,p_execution uuid,p_worker uuid,p_report uuid,p_body jsonb,p_settlement uuid)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE transport text:=current_setting('request.jwt.claims',true);a uuid;x twuanis_canonical_private.execution_credit_executions%ROWTYPE;r jsonb;existing uuid;
BEGIN
 a:=twuanis_canonical_private.execution_credit_bridge(p_claims);
 SELECT * INTO STRICT x FROM twuanis_canonical_private.execution_credit_executions WHERE id=p_execution AND account_id=a;
 PERFORM pg_advisory_xact_lock(3512,hashtext(a::text));
 IF x.authority IS DISTINCT FROM twuanis_canonical_private.execution_credit_authority(x.orchestrator_id,x.population)THEN RAISE EXCEPTION 'Current execution authority required' USING ERRCODE='42501';END IF;
 SELECT id INTO existing FROM twuanis_canonical_private.execution_credit_reports WHERE execution_id=x.id;
 IF existing IS NULL AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.orchestrator_execution_claims WHERE execution_id=x.id AND worker=p_worker AND lease_until>clock_timestamp())THEN RAISE EXCEPTION 'Current worker claim required';END IF;
 IF existing IS NULL THEN PERFORM set_config('request.jwt.claims',transport,true);PERFORM public.record_execution_credit_report(p_claims,x.id,p_report,p_body);
 ELSIF existing IS DISTINCT FROM p_report THEN RAISE EXCEPTION 'Report identity conflict';
 ELSIF p_body IS NOT NULL THEN PERFORM set_config('request.jwt.claims',transport,true);PERFORM public.record_execution_credit_report(p_claims,x.id,p_report,p_body);END IF;
 PERFORM set_config('request.jwt.claims',transport,true);
 r:=public.execution_credit_service(p_claims,p_settlement,jsonb_build_object('operation','settle','execution',x.id));
 RETURN r;
END$$;
CREATE FUNCTION public.read_orchestrator_reports(p_after uuid DEFAULT NULL)RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE a uuid;result jsonb;BEGIN
 a:=twuanis_canonical_private.execution_credit_actor();
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',r.id,'execution',r.execution_id,'createdAt',r.created_at,'orchestrator',r.body->>'orchestrator','population',r.body->>'population','language',r.body->>'language')ORDER BY r.id),'[]')INTO result
 FROM(SELECT x.* FROM twuanis_canonical_private.execution_credit_reports x WHERE x.account_id=a AND(p_after IS NULL OR x.id>p_after)AND EXISTS(SELECT 1 FROM twuanis_canonical_private.execution_credit_events e WHERE e.report_id=x.id AND e.account_id=a AND e.kind IN('EXECUTION_CONSUMED','OWNER_COMPLETED'))ORDER BY x.id LIMIT 26)r;
 RETURN result;
END$$;
-- Exactly the approved 102 evidence query; new entry is limited to a currently
-- authorized registered orchestrator capability. Existing 102 interfaces unchanged.
CREATE FUNCTION public.read_orchestrator_bank_evidence(p_claims jsonb,p_orchestrator text,p_capability text,p_population text,p_after uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE a uuid;grant_value jsonb;authority jsonb;rows jsonb;terms jsonb;
BEGIN
 a:=twuanis_canonical_private.execution_credit_bridge(p_claims);
 grant_value:=twuanis_canonical_private.execution_credit_authority(p_orchestrator,p_population);
 IF p_population NOT IN('BANK','COMBINED') OR NOT(grant_value->'capabilities'?p_capability) THEN RAISE EXCEPTION 'Registered orchestrator population/capability required' USING ERRCODE='42501';END IF;
 terms:=CASE WHEN grant_value->>'kind'='OWNER_UNMETERED' THEN '[]'::jsonb ELSE twuanis_canonical_private.bank_analytical_grant_terms(a,p_capability) END;
 IF terms IS NULL THEN RAISE EXCEPTION 'Same-term Bank authority required' USING ERRCODE='42501';END IF;
 authority:=jsonb_build_object('accountId',a,'capability',p_capability,'population',p_population,'terms',terms);
 SELECT jsonb_build_object('items',coalesce(jsonb_agg(item ORDER BY listing_id,property_id),'[]'),'dataRevision',
 (SELECT md5(jsonb_build_object('public',coalesce(jsonb_agg(v ORDER BY v.id),'[]'),
 'classes',(SELECT coalesce(jsonb_agg(cc.id ORDER BY cc.id),'[]') FROM twuanis_remates_private.classification_versions cc JOIN twuanis_remates_private.offering_properties op ON op.property_id=cc.property_id JOIN twuanis_remates_private.public_projection vp ON vp.offering_id=op.offering_id),
 'financial',(SELECT coalesce(jsonb_agg(fe.id ORDER BY fe.id),'[]') FROM twuanis_remates_private.offering_events fe JOIN twuanis_remates_private.public_projection vp ON vp.offering_id=fe.offering_id),
 'policies',(SELECT coalesce(jsonb_agg(pol.id ORDER BY pol.id),'[]') FROM twuanis_remates_private.source_lifecycle_policies pol JOIN twuanis_remates_private.offerings off ON off.source_id=pol.source_id JOIN twuanis_remates_private.public_projection vp ON vp.offering_id=off.id))::text) FROM twuanis_remates_private.public_projection v)) INTO rows FROM (
 SELECT v.id listing_id,p.id property_id,jsonb_build_object(
 'population','BANK','listingId',v.id,'propertyId',p.id,'offeringId',v.offering_id,'sourceId',s.id,'sourceNamespace',s.namespace,
 'sourceRevision',s.revision::text,'recordKey',b.record_key,'bindingId',b.id,'bindingRevision',b.revision::text,
 'publicationRevision',v.revision,'publicationStatus',v.state,'classificationId',c.id,'classificationRevision',c.revision::text,
 'observationId',ob.id,'observedAt',ob.retrieved_at,'contentHash',ob.content_sha256,'policyId',pol.id,'policyRevision',pol.revision::text,
 'freshSeconds',pol.fresh_seconds::text,'lifecycle',twuanis_remates_private.lifecycle_eligibility(v.offering_id),
 'mechanism',v.mechanism,'transactionEvidence',CASE WHEN ob.raw_text LIKE '{%' AND ob.parse_status='PARSED' THEN jsonb_build_array(jsonb_build_object('value',ob.raw_text::jsonb->>'transaction_type','path','raw.transaction_type','ordinal',0,'validation','RETAINED_RAW')) ELSE '[]'::jsonb END,
 'financial',jsonb_build_object('id',fv.id,'eventId',fe.id,'eventRevision',fe.revision::text,'kind',fv.kind,'status',fv.status,'amount',fv.amount::text,'currency',fv.currency,'observationId',fv.observation_id,'sourceId',fv.source_id,'offeringId',fv.offering_id,'fieldPath',fv.field_path,'ordinal',fv.ordinal,'selectionValid',twuanis_remates_private.financial_selection_valid(fe.id)),
 'terms',(SELECT jsonb_agg(jsonb_build_object('id',t.id::text,'parent_id',t.parent_id::text,'term_type',t.term_type,'level',t.level,'official_code',t.official_code,'slug',t.slug,'term_name',t.term_name,'term_name_en',to_jsonb(t)->>'term_name_en','term_name_es',to_jsonb(t)->>'term_name_es','slug_en',to_jsonb(t)->>'slug_en','slug_es',to_jsonb(t)->>'slug_es')) FROM twuanis_remates_private.property_terms pt JOIN public.ontology_terms t ON t.id=pt.term_id WHERE pt.classification_id=c.id AND pt.selected AND t.term_type IN('province','canton','district','property_type')),
 'measurements',(SELECT coalesce(jsonb_agg(jsonb_build_object('dimension',f.dimension,'kind',f.kind,'value',f.exact_value::text,'observationId',f.evidence_id,'fieldPath',f.field_path,'ordinal',f.ordinal,'unit',ef.unit,'validation',ef.validation,'fieldValue',ef.raw_value,'observedAt',eo.retrieved_at,'sourceId',eo.source_id,'recordKey',eo.record_key,'contentHash',eo.content_sha256,'page',ef.document_page,'selector',ef.selector)), '[]') FROM twuanis_remates_private.property_facts f JOIN twuanis_remates_private.observation_fields ef ON (ef.observation_id,ef.field_path,ef.ordinal)=(f.evidence_id,f.field_path,f.ordinal) JOIN twuanis_remates_private.observations eo ON eo.id=f.evidence_id WHERE f.classification_id=c.id AND f.dimension IN('property_area','construction_area')),
 'registryMeasurements',(SELECT coalesce(jsonb_agg(jsonb_build_object('value',f.raw_value,'observationId',f.observation_id,'fieldPath',f.field_path,'ordinal',f.ordinal,'unit',f.unit,'validation',f.validation,'page',f.document_page,'selector',f.selector)), '[]') FROM twuanis_remates_private.observation_fields f WHERE f.observation_id=c.observation_id AND f.field_path='pdf.normalized_registry_area'),
 'otherFacts',(SELECT coalesce(jsonb_agg(jsonb_build_object('dimension',f.dimension,'kind',f.kind,'exactValue',f.exact_value::text,'categoryTermId',f.category_term_id::text,'rangeLower',f.range_lower::text,'rangeUpper',f.range_upper::text,'lowerInclusive',f.lower_inclusive,'upperInclusive',f.upper_inclusive,'observationId',f.evidence_id,'fieldPath',f.field_path,'ordinal',f.ordinal)), '[]') FROM twuanis_remates_private.property_facts f WHERE f.classification_id=c.id AND f.dimension NOT IN('property_area','construction_area')),
 'semantics',(SELECT coalesce(jsonb_agg(jsonb_build_object('dimension',pt.dimension,'termId',pt.term_id::text,'observationId',pt.evidence_id)), '[]') FROM twuanis_remates_private.property_terms pt WHERE pt.classification_id=c.id AND pt.selected AND pt.dimension NOT IN('geography')),
 'areaSelection',(SELECT CASE WHEN eo.raw_text LIKE '{%' AND eo.raw_text::jsonb->>'format'='bp-reviewed-factual-areas-v1' THEN eo.raw_text::jsonb->'selection' ELSE NULL END FROM twuanis_remates_private.observations eo WHERE eo.id=c.observation_id)
 ) item
 FROM twuanis_remates_private.public_projection v
 JOIN twuanis_remates_private.offerings off ON off.id=v.offering_id
 JOIN twuanis_remates_private.sources s ON s.id=off.source_id
 JOIN twuanis_remates_private.offering_properties op ON op.offering_id=off.id
 JOIN twuanis_remates_private.properties p ON p.id=op.property_id AND p.identity_status='CONFIRMED'
 JOIN LATERAL(SELECT cc.* FROM twuanis_remates_private.classification_versions cc WHERE cc.property_id=p.id ORDER BY cc.revision DESC LIMIT 1)c ON twuanis_remates_private.classification_minimum_valid(c.id) AND c.source_id=s.id
 JOIN twuanis_remates_private.source_bindings b ON b.id=c.binding_id AND b.source_id=s.id AND b.offering_id=off.id
 JOIN twuanis_remates_private.ingestion_results ir ON ir.id=twuanis_remates_private.current_ingestion(off.id)
 JOIN twuanis_remates_private.observations ob ON ob.id=ir.observation_id AND ob.source_id=s.id
 JOIN LATERAL(SELECT x.* FROM twuanis_remates_private.source_lifecycle_policies x WHERE x.source_id=s.id ORDER BY x.revision DESC LIMIT 1)pol ON pol.source_revision=s.revision
 JOIN LATERAL(SELECT x.* FROM twuanis_remates_private.offering_events x WHERE x.offering_id=off.id ORDER BY x.revision DESC LIMIT 1)fe ON true
 LEFT JOIN twuanis_remates_private.financial_values fv ON fv.id=fe.selected_value_id
 WHERE v.state='PUBLISHED' AND (p_after IS NULL OR v.id>p_after)
 AND (SELECT count(*) FROM twuanis_remates_private.offering_properties one WHERE one.offering_id=off.id)=1
 ORDER BY v.id,p.id LIMIT 26
 ) bounded;

 RETURN rows||jsonb_build_object('authority',authority);
END$$;
DO $$DECLARE f record;BEGIN
 FOR f IN SELECT p.oid::regprocedure signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'AND p.proname IN('orchestrator_execution_claim','orchestrator_execution_commit','read_orchestrator_reports','read_orchestrator_bank_evidence')LOOP
 EXECUTE format('ALTER FUNCTION %s OWNER TO postgres',f.signature);
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',f.signature);END LOOP;
END$$;
GRANT EXECUTE ON FUNCTION public.orchestrator_execution_claim(jsonb,uuid,uuid,text,text,jsonb,uuid),public.orchestrator_execution_commit(jsonb,uuid,uuid,uuid,jsonb,uuid),public.read_orchestrator_bank_evidence(jsonb,text,text,text,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_orchestrator_reports(uuid) TO authenticated;
NOTIFY pgrst,'reload schema';

-- 106_bank_analytical_attribute_projection.sql SHA256 75e5fb9ac14380321c16e32f5938e4c77dff024c63fdebf1bc2be48a6f9bb6e8
-- Phase 5.3G: categorical facts remain in otherFacts; only canonical semantic
-- relationships belong in semantics. Correct both existing evidence projections.
-- No evidence, ontology, authority, permissions, or mathematical changes.

SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
DO $bank_attribute_projection$
DECLARE
  target record;
  definition text;
  original_predicate constant text := $old$pt.dimension NOT IN('geography')$old$;
  corrected_predicate constant text := $new$pt.dimension IN('property_type','utility','environment','terrain','accessibility','legal_status')$new$;
BEGIN
  FOR target IN SELECT * FROM (VALUES
    ('public.read_canonical_bank_analytical_evidence(uuid,text,text,uuid)'::regprocedure,'5da4d232408f015247fc44b8fa3e1163c5166abd771aed93c7b24dab995654db'::text),
    ('public.read_orchestrator_bank_evidence(jsonb,text,text,text,uuid)'::regprocedure,'dd0bfab1c076ba2e010feaf936b5d76ba60d72245323f2c98d1fdc1064724191'::text)
  ) AS reviewed(signature,body_sha256) LOOP
    IF (SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex') FROM pg_proc WHERE oid=target.signature)
        IS DISTINCT FROM target.body_sha256 THEN
      RAISE EXCEPTION '106 Bank analytical reader predecessor mismatch: %',target.signature;
    END IF;
    definition := pg_get_functiondef(target.signature);
    IF (length(definition)-length(replace(definition,original_predicate,'')))/length(original_predicate) <> 1 THEN
      RAISE EXCEPTION '106 expected exactly one semantic projection predicate: %',target.signature;
    END IF;
    -- CREATE OR REPLACE retains object identity, owner and execution ACL.
    -- pg_get_functiondef retains the complete function configuration and body.
    EXECUTE replace(definition,original_predicate,corrected_predicate);
  END LOOP;
END
$bank_attribute_projection$;

-- 107_orchestrator_immutable_evidence_v2.sql SHA256 be7bc16fde84e6dccc7f56bff6955043d0f4d620b7e57b3d334fb6b9ac29bab7

DO $$BEGIN IF encode(sha256(convert_to(pg_get_functiondef('public.record_execution_credit_report(jsonb,uuid,uuid,jsonb)'::regprocedure),'UTF8')),'hex')<>'9f1b15ed3c97aa4df30998888aadd66133d99c1bd611b1d60b9060ab0e5b6d47' THEN RAISE EXCEPTION 'Unreviewed report validator predecessor';END IF;END$$;

-- Controlled local candidate. Resource qualification and complete semantic acceptance pending.
-- No previous migration or mathematical/authorization implementation is changed.
CREATE FUNCTION twuanis_canonical_private.evidence_v2_json(p jsonb) RETURNS text LANGUAGE plpgsql IMMUTABLE STRICT SET search_path=pg_catalog AS $$
DECLARE s text;BEGIN
 IF NOT jsonb_path_exists(p,'$.** ? (@.type() == "object")') THEN
  RETURN regexp_replace(p::text,'("(?:[^"\\]|\\.)*")|[[:space:]]+','\1','g');
 END IF;
 CASE jsonb_typeof(p)
 WHEN 'array' THEN SELECT '['||coalesce(string_agg(twuanis_canonical_private.evidence_v2_json(value),',' ORDER BY ord),'')||']' INTO s FROM jsonb_array_elements(p) WITH ORDINALITY e(value,ord);
 WHEN 'object' THEN SELECT '{'||coalesce(string_agg(to_jsonb(key)::text||':'||twuanis_canonical_private.evidence_v2_json(value),',' ORDER BY key COLLATE "C"),'')||'}' INTO s FROM jsonb_each(p);
 ELSE s:=p::text; END CASE; RETURN s;
END$$;
CREATE FUNCTION twuanis_canonical_private.evidence_v2_decode(nodes jsonb,id text,depth integer DEFAULT 0) RETURNS jsonb LANGUAGE plpgsql IMMUTABLE STRICT SET search_path=pg_catalog AS $$
DECLARE n jsonb;v jsonb;pair jsonb;result jsonb;kind text;k text;BEGIN
 IF depth>32 THEN RAISE EXCEPTION 'Evidence nesting limit';END IF;n:=nodes->id;IF n IS NULL THEN RAISE EXCEPTION 'Missing evidence reference';END IF;kind:=n->>0;
 IF kind='scalar' THEN RETURN n->1;
 ELSIF kind='binary64' THEN RETURN (n->>2)::jsonb;
 ELSIF kind='bigint' THEN RETURN n->1;
 ELSIF kind='undefined' THEN RETURN 'null';
 ELSIF kind IN('array','set') THEN result:='[]';FOR v IN SELECT value FROM jsonb_array_elements(n->1) LOOP result:=result||jsonb_build_array(twuanis_canonical_private.evidence_v2_decode(nodes,v#>>'{}',depth+1));END LOOP;RETURN result;
 ELSIF kind='object' THEN result:='{}';FOR pair IN SELECT value FROM jsonb_array_elements(n->1) LOOP k:=pair->>0;IF result?k THEN RAISE EXCEPTION 'Duplicate evidence field';END IF;IF nodes->(pair->>1)->>0<>'undefined' THEN result:=result||jsonb_build_object(k,twuanis_canonical_private.evidence_v2_decode(nodes,pair->>1,depth+1));END IF;END LOOP;RETURN result;
 ELSIF kind='map' THEN RETURN jsonb_build_object('entries',n->1,'properties',n->2);
 ELSIF kind='archive-callback' THEN RETURN jsonb_build_object('protectedArchiveCallback',n->1);
 END IF;RAISE EXCEPTION 'Unsupported evidence node';
END$$;
CREATE FUNCTION twuanis_canonical_private.evidence_v2_field(nodes jsonb,id text,k text) RETURNS text LANGUAGE sql IMMUTABLE STRICT SET search_path=pg_catalog AS $$ SELECT value->>1 FROM jsonb_array_elements(nodes->id->1) WHERE value->>0=k $$;
-- Relationship contract v1 for ordered-content-graph-binary64-v1.
-- Partial local correction: invocation shape/engine membership, not an execution witness.
CREATE FUNCTION twuanis_canonical_private.evidence_v2_call_relationships(body jsonb)
RETURNS void LANGUAGE plpgsql VOLATILE SET search_path=pg_catalog AS $$
DECLARE invalid boolean;records jsonb:=body#>'{immutableEvidence,records}';BEGIN
 body:=body-'immutableEvidence';
 WITH specifications(name,argument_types,output_type,engine_ids) AS (VALUES
 ('evaluateMarketPreferences',ARRAY['object','object','object'],'array',NULL::text[]),
 ('buildPriceMeterObservations',ARRAY['array','scalar'],'array',NULL::text[]),
 ('buildPriceMeterTransactionCohorts',ARRAY['array'],'object',NULL::text[]),
 ('buildPriceMeterAnalyticalCohort',ARRAY['object'],'object',NULL::text[]),
 ('calculateMarketSummary',ARRAY['object','binary64','binary64'],'object',ARRAY['summary']),
 ('canonicalMarketPrevalence',ARRAY['array'],'object',ARRAY['composition','comparison']),
 ('projectCanonicalPrevalence',ARRAY['array','array','map','map','map'],'object',ARRAY['composition','comparison']),
 ('buildNumericalDistribution',ARRAY['array'],'object',ARRAY['market-asking-price-distribution']),
 ('rankMarketPreferences',ARRAY['array'],'array',ARRAY['matching']),
 ('calculateConfigurationFrequency',ARRAY['object','scalar','binary64','binary64','scalar','array'],'object',ARRAY['configuration']),
 ('calculateMarketComparisonSide',ARRAY['array','object','binary64','scalar','object','archive-callback'],'object',ARRAY['comparison']),
 ('buildPriceMeterDistribution',ARRAY['object'],'object',ARRAY['distribution','geography','position']),
 ('buildPriceMeterGeographicLevel',ARRAY['object'],'array',ARRAY['geography']),
 ('buildPriceMeterGeographicStatistics',ARRAY['object'],'array',ARRAY['geography']),
 ('buildPriceMeterSizeRelationshipPopulation',ARRAY['object'],'object',ARRAY['size']),
 ('buildPriceMeterDescriptiveSizeRelationshipResult',ARRAY['object','scalar'],'object',ARRAY['size']),
 ('buildSelectedConstructionLand',ARRAY['array','scalar','scalar'],'object',ARRAY['construction-land']),
 ('buildPriceMeterComparisonCohortPopulation',ARRAY['object'],'object',ARRAY['cohort-comparison']),
 ('buildPriceMeterComparisonAnalysis',ARRAY['object'],'object',ARRAY['cohort-comparison']),
 ('analyzePriceMeterCrossDimensionalRelationship',ARRAY['object'],'object',ARRAY['cross-dimensional']),
 ('calculateDiscoveryPopulation',ARRAY['array'],'object',ARRAY['discovery']),
 ('buildPriceMeterPropertyPositionEvidence',ARRAY['object'],'object',ARRAY['position']),
 ('runPriceMeterComparableEngine',ARRAY['object'],'object',ARRAY['comparables']),
 ('analyzeAreaRatio',ARRAY['array'],'object',ARRAY['asking-area-ratio']),
 ('analyzeWeightedPrice',ARRAY['array','object'],'object',ARRAY['weighted-price']),
 ('establishWeightedSubject',ARRAY['object','scalar'],'object',ARRAY['weighted-price'])
 ), nodes AS NOT MATERIALIZED (SELECT node_id id,node FROM pg_temp.twuanis_evidence_validation_nodes),
 calls AS (SELECT r->>'kind' kind,r->>'contentId' id,split_part(r->>'kind','/',1) engine,split_part(r->>'kind','/',3) name FROM jsonb_array_elements(records)r WHERE r->>'kind' LIKE '%/call/%'),
 links AS (SELECT c.*,n.node,
 (SELECT jsonb_object_agg(p->>0,p->>1) FROM jsonb_array_elements(CASE WHEN n.node->>0='object' THEN n.node->1 ELSE '[]' END)p) fields
 FROM calls c LEFT JOIN nodes n ON n.id=c.id),
 contexts AS MATERIALIZED (SELECT cx.id,jsonb_object_agg(pair->>0,n.node->1) payload FROM nodes cx CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN cx.node->>0='object' THEN cx.node->1 ELSE '[]' END)pair JOIN nodes n ON n.id=pair->>1 WHERE cx.id IN(SELECT fields->>'context' FROM links) GROUP BY cx.id),
 checked AS MATERIALIZED (SELECT l.*,s.argument_types,s.output_type,s.engine_ids,i.node inode,o.node onode,a.node args,z.node result,ctx.payload context_value,ord.node order_node
 FROM links l LEFT JOIN specifications s ON s.name=l.name
 LEFT JOIN nodes i ON i.id=l.fields->>'inputId'
 LEFT JOIN nodes o ON o.id=l.fields->>'outputId'
 LEFT JOIN nodes a ON a.id=i.node->>1
 LEFT JOIN nodes z ON z.id=o.node->>1 LEFT JOIN contexts ctx ON ctx.id=l.fields->>'context' LEFT JOIN nodes ord ON ord.id=l.fields->>'invocationOrder')
 SELECT EXISTS(SELECT 1 FROM checked c WHERE
 c.argument_types IS NULL OR c.node->>0 IS DISTINCT FROM 'object'
 OR c.context_value->>'executionId' IS DISTINCT FROM body->>'executionId'
 OR c.context_value->>'accountId' IS DISTINCT FROM body->>'accountId'
 OR c.context_value->>'requestId' IS DISTINCT FROM body#>>'{request,requestId}'
 OR c.context_value->>'methodologyRelease' IS DISTINCT FROM body->>'methodologyRelease'
 OR c.context_value->>'engine' IS DISTINCT FROM c.engine
 OR c.context_value->>'population' IS NULL OR c.context_value->>'population' NOT IN('PRIVATE','BANK','COMBINED')
 OR body->>'population'<>'COMBINED' AND c.context_value->>'population' IS DISTINCT FROM body->>'population'
 OR c.order_node->>0 IS DISTINCT FROM 'binary64' OR c.order_node->>2 IS NULL OR c.order_node->>2!~'^[1-9][0-9]*$'
 OR jsonb_array_length(c.node->1)<>4 OR NOT(c.fields ?& ARRAY['inputId','outputId','invocationOrder','context'])
 OR c.inode->>0 IS DISTINCT FROM 'scalar' OR c.onode->>0 IS DISTINCT FROM 'scalar'
 OR c.args->>0 IS DISTINCT FROM 'array' OR c.result->>0 IS DISTINCT FROM c.output_type
 OR jsonb_array_length(c.args->1) IS DISTINCT FROM cardinality(c.argument_types)
 OR (c.engine_ids IS NOT NULL AND NOT(c.engine=ANY(c.engine_ids)))
 OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(body->'engines') e WHERE e->>'id'=c.engine)
 OR EXISTS(SELECT 1 FROM jsonb_array_elements_text(c.args->1) WITH ORDINALITY arg(id,ord)
 LEFT JOIN nodes n ON n.id=arg.id WHERE n.node->>0 IS DISTINCT FROM c.argument_types[arg.ord])
 ) OR EXISTS(SELECT 1 FROM checked HAVING count(*)<>count(DISTINCT order_node->>2) OR min(CASE WHEN order_node->>2~'^[1-9][0-9]*$' THEN (order_node->>2)::numeric END)<>1 OR max(CASE WHEN order_node->>2~'^[1-9][0-9]*$' THEN (order_node->>2)::numeric END)<>count(*)) INTO invalid;
 IF invalid THEN RAISE EXCEPTION 'ER_CALL_ROLE_OR_ENGINE_CONTRACT' USING ERRCODE='23514';END IF;
END$$;
REVOKE ALL ON FUNCTION twuanis_canonical_private.evidence_v2_call_relationships(jsonb) FROM PUBLIC,anon,authenticated,service_role;

-- Validation-local materialization. No persistent evidence or authorization is replaced.
CREATE FUNCTION twuanis_canonical_private.evidence_v2_decode_indexed(id text,depth integer DEFAULT 0) RETURNS jsonb LANGUAGE plpgsql VOLATILE STRICT SET search_path=pg_catalog AS $$
DECLARE n jsonb;answer jsonb;ready boolean;kind text;height integer;BEGIN
 IF depth>32 THEN RAISE EXCEPTION 'Evidence nesting limit';END IF;
 SELECT node,decoded,decoded_ready,decoded_height INTO n,answer,ready,height FROM pg_temp.twuanis_evidence_validation_nodes WHERE node_id=id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Missing evidence reference';END IF;
 IF ready THEN IF depth+height>32 THEN RAISE EXCEPTION 'Evidence nesting limit';END IF;RETURN answer;END IF;kind:=n->>0;
 IF kind='scalar' THEN answer:=n->1;
 ELSIF kind='binary64' THEN answer:=(n->>2)::jsonb;
 ELSIF kind='bigint' THEN answer:=n->1;
 ELSIF kind='undefined' THEN answer:='null';
 ELSIF kind IN('array','set') THEN
  SELECT coalesce(jsonb_agg(CASE WHEN child.decoded_ready AND depth+1+child.decoded_height<=32 THEN child.decoded ELSE twuanis_canonical_private.evidence_v2_decode_indexed(value#>>'{}',depth+1) END ORDER BY ord),'[]') INTO answer FROM jsonb_array_elements(n->1)WITH ORDINALITY e(value,ord) LEFT JOIN pg_temp.twuanis_evidence_validation_nodes child ON child.node_id=value#>>'{}';
 ELSIF kind='object' THEN
  IF (SELECT count(*)<>count(DISTINCT value->>0)FROM jsonb_array_elements(n->1)) THEN RAISE EXCEPTION 'Duplicate evidence field';END IF;
  SELECT coalesce(jsonb_object_agg(p->>0,CASE WHEN child.decoded_ready AND depth+1+child.decoded_height<=32 THEN child.decoded ELSE twuanis_canonical_private.evidence_v2_decode_indexed(p->>1,depth+1) END),'{}') INTO answer FROM jsonb_array_elements(n->1)p JOIN pg_temp.twuanis_evidence_validation_nodes child ON child.node_id=p->>1 WHERE child.node->>0<>'undefined';
 ELSIF kind='map' THEN answer:=jsonb_build_object('entries',n->1,'properties',n->2);
 ELSIF kind='archive-callback' THEN answer:=jsonb_build_object('protectedArchiveCallback',n->1);
 ELSE RAISE EXCEPTION 'Unsupported evidence node';END IF;
 height:=0;
 IF kind IN('array','set') THEN SELECT coalesce(max(child.decoded_height+1),0) INTO height FROM jsonb_array_elements_text(n->1)r JOIN pg_temp.twuanis_evidence_validation_nodes child ON child.node_id=r;
 ELSIF kind='object' THEN SELECT coalesce(max(child.decoded_height+1),0) INTO height FROM jsonb_array_elements(n->1)r JOIN pg_temp.twuanis_evidence_validation_nodes child ON child.node_id=r->>1 WHERE child.node->>0<>'undefined';END IF;
 IF depth+height>32 THEN RAISE EXCEPTION 'Evidence nesting limit';END IF;
 UPDATE pg_temp.twuanis_evidence_validation_nodes SET decoded=answer,decoded_ready=true,decoded_height=height WHERE node_id=id;
 RETURN answer;
END$$;
REVOKE ALL ON FUNCTION twuanis_canonical_private.evidence_v2_decode_indexed(text,integer) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION twuanis_canonical_private.evidence_v2_validate(body jsonb,execution uuid,report uuid,account uuid) RETURNS void LANGUAGE plpgsql VOLATILE SET search_path=pg_catalog AS $$
DECLARE ev jsonb;nodes jsonb;n jsonb;rec jsonb;entry record;kind text;item jsonb;refs text[];ref text;engine jsonb;decoded jsonb;ids text[];cnt integer;request_ref text;rows_ref text;checked_rows text[]:=ARRAY[]::text[];BEGIN
 ev:=body->'immutableEvidence';nodes:=ev->'nodes';
 IF body->>'format' IS DISTINCT FROM 'twuanis-orchestrator-evidence-v2' OR body->>'executionId' IS DISTINCT FROM execution::text OR body->>'reportId' IS DISTINCT FROM report::text OR body->>'accountId' IS DISTINCT FROM account::text OR ev->>'schema' IS DISTINCT FROM 'twuanis-analytical-evidence-v2' OR ev->>'encoding' IS DISTINCT FROM 'ordered-content-graph-binary64-v1' OR jsonb_typeof(nodes) IS DISTINCT FROM 'object' OR jsonb_typeof(ev->'records') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Complete V2 identity and schema required';END IF;
 -- Experimental ceiling: not a production-qualified budget. Scope remains fail closed.
 IF octet_length(body::text)>33554432 OR jsonb_array_length(ev->'records')>40000 OR (SELECT count(*) FROM jsonb_object_keys(nodes))>100000 THEN RAISE EXCEPTION 'V2 qualification resource ceiling exceeded';END IF;
 -- Rebuild a private, transaction-local lookup; never trust a caller-created cache.
 DROP TABLE IF EXISTS pg_temp.twuanis_evidence_validation_nodes;
 CREATE TEMP TABLE pg_temp.twuanis_evidence_validation_nodes(node_id text PRIMARY KEY,node jsonb NOT NULL,decoded jsonb,decoded_ready boolean NOT NULL DEFAULT false,decoded_height integer)ON COMMIT DROP;
 REVOKE ALL ON pg_temp.twuanis_evidence_validation_nodes FROM PUBLIC,anon,authenticated,service_role;
 INSERT INTO pg_temp.twuanis_evidence_validation_nodes(node_id,node) SELECT key,value FROM jsonb_each(nodes);
 ANALYZE pg_temp.twuanis_evidence_validation_nodes;
 PERFORM twuanis_canonical_private.evidence_v2_call_relationships(body);
 FOR entry IN SELECT * FROM jsonb_each(nodes) LOOP
  n:=entry.value;kind:=n->>0;refs:=ARRAY[]::text[];
  IF entry.key!~'^[0-9a-f]{64}$' OR encode(sha256(convert_to(twuanis_canonical_private.evidence_v2_json(n),'UTF8')),'hex')<>entry.key OR jsonb_typeof(n)<>'array' THEN RAISE EXCEPTION 'Evidence content hash mismatch';END IF;
  IF kind='scalar' THEN IF jsonb_array_length(n)<>2 OR jsonb_typeof(n->1) NOT IN('string','null','boolean') THEN RAISE EXCEPTION 'Invalid scalar evidence';END IF;
  ELSIF kind='binary64' THEN IF jsonb_array_length(n)<>3 OR n->>1!~'^[0-9a-f]{16}$' OR n->>2!~'^-?([0-9]+(\.[0-9]+)?)(e[+-]?[0-9]+)?$' OR encode(float8send((n->>2)::double precision),'hex')<>n->>1 THEN RAISE EXCEPTION 'Invalid numerical evidence';END IF;
  ELSIF kind='bigint' THEN IF jsonb_array_length(n)<>2 OR n->>1!~'^-?[0-9]+$' THEN RAISE EXCEPTION 'Invalid integer evidence';END IF;
  ELSIF kind='undefined' THEN IF jsonb_array_length(n)<>1 THEN RAISE EXCEPTION 'Invalid undefined value';END IF;
  ELSIF kind IN('array','set') THEN IF jsonb_array_length(n)<>2 OR jsonb_typeof(n->1)<>'array' THEN RAISE EXCEPTION 'Invalid sequence';END IF;SELECT coalesce(array_agg(value),ARRAY[]::text[]) INTO refs FROM jsonb_array_elements_text(n->1);
  ELSIF kind IN('object','map') THEN
   IF jsonb_array_length(n)<>(CASE WHEN kind='map' THEN 3 ELSE 2 END) OR jsonb_typeof(n->1)<>'array' THEN RAISE EXCEPTION 'Invalid keyed evidence';END IF;
   FOR item IN SELECT value FROM jsonb_array_elements(n->1) LOOP IF jsonb_typeof(item)<>'array' OR jsonb_array_length(item)<>2 OR jsonb_typeof(item->0)<>'string' OR jsonb_typeof(item->1)<>'string' THEN RAISE EXCEPTION 'Invalid keyed pair';END IF;refs:=array_append(refs,item->>1);IF kind='map' THEN refs:=array_append(refs,item->>0);END IF;END LOOP;
   IF kind='object' AND (SELECT count(*)<>count(DISTINCT value->>0) FROM jsonb_array_elements(n->1)) THEN RAISE EXCEPTION 'Duplicate evidence key';END IF;
   IF kind='map' THEN IF jsonb_typeof(n->2)<>'array' THEN RAISE EXCEPTION 'Invalid map properties';END IF;FOR item IN SELECT value FROM jsonb_array_elements(n->2) LOOP refs:=array_append(refs,item->>1);END LOOP;END IF;
  ELSIF kind='archive-callback' THEN IF jsonb_array_length(n)<>2 OR jsonb_typeof(n->1)<>'string' THEN RAISE EXCEPTION 'Invalid callback identity';END IF;
  ELSE RAISE EXCEPTION 'Unsupported evidence tag';END IF;
  FOREACH ref IN ARRAY refs LOOP IF ref IS NULL OR ref!~'^[0-9a-f]{64}$' OR NOT nodes?ref THEN RAISE EXCEPTION 'Incomplete evidence reference';END IF;END LOOP;
 END LOOP;
 FOR rec IN SELECT value FROM jsonb_array_elements(ev->'records') LOOP IF jsonb_typeof(rec)<>'object' OR jsonb_typeof(rec->'kind') IS DISTINCT FROM 'string' OR NOT nodes?(rec->>'contentId') THEN RAISE EXCEPTION 'Incomplete evidence root';END IF;END LOOP;
 UPDATE pg_temp.twuanis_evidence_validation_nodes SET decoded=CASE node->>0 WHEN 'binary64' THEN(node->>2)::jsonb WHEN 'undefined' THEN 'null'::jsonb ELSE node->1 END,decoded_ready=true,decoded_height=0 WHERE node->>0 IN('scalar','binary64','undefined','bigint');
 FOR engine IN SELECT value FROM jsonb_array_elements(body->'engines') LOOP
  SELECT count(*),min(value->>'contentId') INTO cnt,ref FROM jsonb_array_elements(ev->'records') WHERE value->>'kind'=engine->>'id'||'/engine-output';IF cnt<>1 THEN RAISE EXCEPTION 'Unique engine evidence required';END IF;
  decoded:=twuanis_canonical_private.evidence_v2_decode_indexed(ref);IF decoded IS DISTINCT FROM engine->'result' THEN RAISE EXCEPTION 'Engine output binding mismatch';END IF;
  SELECT count(*),min(value->>'contentId') INTO cnt,ref FROM jsonb_array_elements(ev->'records') WHERE value->>'kind'=engine->>'id'||'/resolved-input';IF cnt<>1 THEN RAISE EXCEPTION 'Complete engine inputs required';END IF;
  request_ref:=twuanis_canonical_private.evidence_v2_field(nodes,ref,'request');
  decoded:=twuanis_canonical_private.evidence_v2_decode_indexed(request_ref);
  IF decoded->>'engine' IS DISTINCT FROM engine->>'id' OR decoded#>>'{scope,population}' IS DISTINCT FROM body->>'population' OR decoded->'scope' IS DISTINCT FROM ((body#>'{request,scope}')||jsonb_build_object('population',body->>'population')) OR decoded->'filters' IS DISTINCT FROM body#>'{request,filters}' THEN RAISE EXCEPTION 'Engine input request binding mismatch';END IF;
  rows_ref:=twuanis_canonical_private.evidence_v2_field(nodes,ref,'rows');
  IF NOT(rows_ref=ANY(checked_rows)) THEN
  SELECT array_agg(identity_node.node->>1) INTO ids FROM jsonb_array_elements_text(nodes->rows_ref->1)v LEFT JOIN pg_temp.twuanis_evidence_validation_nodes row_node ON row_node.node_id=v LEFT JOIN LATERAL(SELECT pair->>1 id FROM jsonb_array_elements(row_node.node->1)pair WHERE pair->>0='id')identity_ref ON true LEFT JOIN pg_temp.twuanis_evidence_validation_nodes identity_node ON identity_node.node_id=identity_ref.id;
  IF cardinality(ids)<>(SELECT count(DISTINCT v)FROM unnest(ids)v) OR EXISTS(SELECT 1 FROM unnest(ids)v WHERE v!~'^(PRIVATE|BANK):[0-9a-f-]{36}$' OR body->>'population'<>'COMBINED' AND split_part(v,':',1)<>body->>'population') THEN RAISE EXCEPTION 'Population identity or qualification limit mismatch';END IF;
  checked_rows:=array_append(checked_rows,rows_ref);END IF;
 END LOOP;
 IF body#>>'{evidence,methodology,sourceDigest}' IS NULL THEN RAISE EXCEPTION 'Methodology reference required';END IF;
END$$;
-- Validate retained Private source values against the existing canonical source.
CREATE FUNCTION twuanis_canonical_private.evidence_v2_private_sources(body jsonb) RETURNS void LANGUAGE plpgsql VOLATILE SET search_path=pg_catalog AS $$
DECLARE nodes jsonb:=body#>'{immutableEvidence,nodes}';root text;v jsonb;source jsonb;current_value jsonb;BEGIN
 -- This function follows immutable-witness equality in report commitment.
 -- Rebuild the private lookup; never reuse a caller-created cache.
 DROP TABLE IF EXISTS pg_temp.twuanis_evidence_validation_nodes;
 CREATE TEMP TABLE pg_temp.twuanis_evidence_validation_nodes(node_id text PRIMARY KEY,node jsonb NOT NULL,decoded jsonb,decoded_ready boolean NOT NULL DEFAULT false,decoded_height integer)ON COMMIT DROP;
 REVOKE ALL ON pg_temp.twuanis_evidence_validation_nodes FROM PUBLIC,anon,authenticated,service_role;
 INSERT INTO pg_temp.twuanis_evidence_validation_nodes(node_id,node) SELECT key,value FROM jsonb_each(nodes);
 ANALYZE pg_temp.twuanis_evidence_validation_nodes;
 FOR root IN SELECT DISTINCT value->>'contentId' FROM jsonb_array_elements(body#>'{immutableEvidence,records}') WHERE value->>'kind'='private-scalar-source' OR value->>'kind' LIKE '%/private-scalar-source' LOOP
  v:=twuanis_canonical_private.evidence_v2_decode_indexed(root);source:=v->'source';
  SELECT jsonb_build_object('id',l.id,'canonical_domain_version',l.canonical_domain_version,'listing_status',l.listing_status,'transaction_type',l.transaction_type,'currency',l.currency,'created_at',l.created_at,'evidence_current_price',l.current_price::text,'evidence_monthly_price',l.monthly_price::text,'evidence_property_area',l.property_area::text,'evidence_construction_area',l.construction_area::text) INTO current_value FROM public.listings l WHERE l.id=(source->>'id')::uuid;
  IF current_value IS NULL OR source->>'evidence_current_price' IS DISTINCT FROM current_value->>'evidence_current_price' OR source->>'evidence_monthly_price' IS DISTINCT FROM current_value->>'evidence_monthly_price' OR source->>'evidence_property_area' IS DISTINCT FROM current_value->>'evidence_property_area' OR source->>'evidence_construction_area' IS DISTINCT FROM current_value->>'evidence_construction_area' OR source->>'currency' IS DISTINCT FROM current_value->>'currency' OR source->>'listing_status' IS DISTINCT FROM current_value->>'listing_status' OR source->>'transaction_type' IS DISTINCT FROM current_value->>'transaction_type' THEN RAISE EXCEPTION 'Original Private evidence changed or tampered';END IF;
 END LOOP;
END$$;
CREATE FUNCTION public.read_orchestrator_evidence_chunk(p_report uuid,p_offset integer DEFAULT 0,p_identity text DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE a uuid;r twuanis_canonical_private.execution_credit_reports%ROWTYPE;body text;identity text;total integer;BEGIN
 a:=twuanis_canonical_private.execution_credit_actor();
 IF p_offset IS NULL OR p_offset<0 OR p_offset%65536<>0 OR p_offset>33554432 THEN RAISE EXCEPTION 'Invalid evidence cursor';END IF;
 SELECT x.* INTO STRICT r FROM twuanis_canonical_private.execution_credit_reports x WHERE x.id=p_report AND x.account_id=a AND EXISTS(SELECT 1 FROM twuanis_canonical_private.execution_credit_events e WHERE e.report_id=x.id AND e.account_id=a AND e.kind IN('EXECUTION_CONSUMED','OWNER_COMPLETED'));
 IF md5(r.body::text)<>r.content_md5 THEN RAISE EXCEPTION 'Immutable evidence integrity failure';END IF;body:=twuanis_canonical_private.evidence_v2_report_body(r.body)::text;
 identity:=encode(sha256(convert_to(body,'UTF8')),'hex');total:=length(body);
 IF p_offset>=total OR p_offset>0 AND p_identity IS DISTINCT FROM identity OR p_identity IS NOT NULL AND p_identity<>identity THEN RAISE EXCEPTION 'Evidence cursor identity mismatch';END IF;
 RETURN jsonb_build_object('reportId',p_report,'offset',p_offset,'next',CASE WHEN p_offset+262144<total THEN p_offset+262144 ELSE NULL END,'totalCharacters',total,'identity',identity,'text',substr(body,p_offset+1,262144));
END$$;
REVOKE ALL ON FUNCTION public.read_orchestrator_evidence_chunk(uuid,integer,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.read_orchestrator_evidence_chunk(uuid,integer,text) TO authenticated;

-- Phase 5.3J-B: private witness extends the existing worker, never token authority.
CREATE TABLE twuanis_canonical_private.orchestrator_methodology_releases(
 id text PRIMARY KEY CHECK(id ~ '^[0-9a-f]{64}$'), manifest jsonb NOT NULL,
 archive_sha256 text NOT NULL CHECK(archive_sha256 ~ '^[0-9a-f]{64}$'), approved_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CHECK(jsonb_typeof(manifest)='object'));
CREATE TABLE twuanis_canonical_private.orchestrator_witness_attempts(
 execution_id uuid NOT NULL REFERENCES twuanis_canonical_private.execution_credit_executions,
 attempt integer NOT NULL,worker uuid NOT NULL,lease_until timestamptz NOT NULL,
 release_id text NOT NULL REFERENCES twuanis_canonical_private.orchestrator_methodology_releases,
 capture_digest text NOT NULL,PRIMARY KEY(execution_id,attempt));
CREATE TABLE twuanis_canonical_private.orchestrator_execution_witnesses(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),execution_id uuid NOT NULL,attempt integer NOT NULL,
 report_id uuid NOT NULL,settlement_id uuid NOT NULL, transcript jsonb NOT NULL, envelope jsonb NOT NULL,
 finalized_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(execution_id,attempt),FOREIGN KEY(execution_id,attempt) REFERENCES twuanis_canonical_private.orchestrator_witness_attempts);
DO $$DECLARE t text;BEGIN
 FOREACH t IN ARRAY ARRAY['orchestrator_methodology_releases','orchestrator_witness_attempts','orchestrator_execution_witnesses'] LOOP
 EXECUTE format('ALTER TABLE twuanis_canonical_private.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON twuanis_canonical_private.%I FROM PUBLIC,anon,authenticated,service_role',t);
 EXECUTE format('CREATE TRIGGER immutable_history BEFORE UPDATE OR DELETE OR TRUNCATE ON twuanis_canonical_private.%I FOR EACH STATEMENT EXECUTE FUNCTION twuanis_canonical_private.administrative_immutable()',t);
 END LOOP;
END$$;
CREATE FUNCTION public.orchestrator_execution_claim_v2(p_claims jsonb,p_request uuid,p_execution uuid,p_orchestrator text,p_population text,p_question jsonb,p_worker uuid,p_release text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE r jsonb;j twuanis_canonical_private.orchestrator_execution_claims%ROWTYPE;secret text;BEGIN
 IF NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.orchestrator_methodology_releases WHERE id=p_release) THEN RAISE EXCEPTION 'WITNESS_UNAPPROVED_RELEASE';END IF;
 r:=public.orchestrator_execution_claim(p_claims,p_request,p_execution,p_orchestrator,p_population,p_question,p_worker);
 IF r->>'state'<>'CLAIMED' THEN RETURN r;END IF;
 SELECT * INTO STRICT j FROM twuanis_canonical_private.orchestrator_execution_claims WHERE execution_id=p_execution AND worker=p_worker FOR UPDATE;
 secret:=encode(extensions.gen_random_bytes(32),'hex');
 INSERT INTO twuanis_canonical_private.orchestrator_witness_attempts VALUES(p_execution,j.attempt,p_worker,j.lease_until,p_release,encode(sha256(convert_to(secret,'UTF8')),'hex'));
 RETURN r||jsonb_build_object('captureCapability',secret,'attempt',j.attempt,'release',p_release);
END$$;
CREATE FUNCTION public.orchestrator_witness_finalize(p_claims jsonb,p_execution uuid,p_worker uuid,p_attempt integer,p_capture text,p_report uuid,p_settlement uuid,p_transcript jsonb,p_envelope jsonb)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE a uuid;x twuanis_canonical_private.execution_credit_executions%ROWTYPE;w twuanis_canonical_private.orchestrator_witness_attempts%ROWTYPE;old twuanis_canonical_private.orchestrator_execution_witnesses%ROWTYPE;rid uuid;BEGIN
 a:=twuanis_canonical_private.execution_credit_bridge(p_claims);
 SELECT * INTO STRICT x FROM twuanis_canonical_private.execution_credit_executions WHERE id=p_execution AND account_id=a;
 PERFORM pg_advisory_xact_lock(3512,hashtext(a::text));
 IF x.authority IS DISTINCT FROM twuanis_canonical_private.execution_credit_authority(x.orchestrator_id,x.population) THEN RAISE EXCEPTION 'WITNESS_AUTHORITY_CHANGED';END IF;
 SELECT * INTO STRICT w FROM twuanis_canonical_private.orchestrator_witness_attempts WHERE execution_id=x.id AND attempt=p_attempt;
 IF p_capture IS NULL OR w.capture_digest<>encode(sha256(convert_to(p_capture,'UTF8')),'hex') OR w.worker IS DISTINCT FROM p_worker THEN RAISE EXCEPTION 'WITNESS_CAPTURE_CAPABILITY_REQUIRED' USING ERRCODE='42501';END IF;
 SELECT * INTO old FROM twuanis_canonical_private.orchestrator_execution_witnesses WHERE execution_id=x.id AND attempt=p_attempt;
 IF FOUND THEN
 IF (old.report_id,old.settlement_id,old.transcript,old.envelope) IS DISTINCT FROM (p_report,p_settlement,p_transcript,p_envelope) THEN RAISE EXCEPTION 'WITNESS_IMMUTABLE_CONFLICT';END IF;
 RETURN jsonb_build_object('id',old.id,'replayed',true);END IF;
 IF twuanis_canonical_private.execution_credit_execution_state(x.id)<>'RESERVED' OR x.lease_until<=clock_timestamp() OR w.lease_until<=clock_timestamp() OR NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.orchestrator_execution_claims j WHERE j.execution_id=x.id AND j.worker=w.worker AND j.attempt=w.attempt AND j.lease_until>clock_timestamp()) THEN RAISE EXCEPTION 'WITNESS_CURRENT_ATTEMPT_REQUIRED';END IF;
 IF p_report IS NULL OR p_settlement IS NULL OR p_transcript->>'schema' IS DISTINCT FROM 'twuanis-analytical-evidence-v2' OR p_envelope#>'{evidence,methodology}' IS DISTINCT FROM (SELECT manifest->'methodology' FROM twuanis_canonical_private.orchestrator_methodology_releases WHERE id=w.release_id) THEN RAISE EXCEPTION 'WITNESS_RELEASE_OR_TRANSCRIPT_INVALID';END IF;
 IF octet_length(p_transcript::text)+octet_length(p_envelope::text)>33554432 THEN RAISE EXCEPTION 'WITNESS_RESOURCE_LIMIT';END IF;
 PERFORM twuanis_canonical_private.evidence_v2_validate(p_envelope||jsonb_build_object('immutableEvidence',p_transcript,'methodologyRelease',w.release_id),p_execution,p_report,a);
 -- Capture stores full inspectable JSONB; report hashes are not its authority.
 INSERT INTO twuanis_canonical_private.orchestrator_execution_witnesses(execution_id,attempt,report_id,settlement_id,transcript,envelope) VALUES(x.id,w.attempt,p_report,p_settlement,p_transcript,p_envelope) RETURNING id INTO rid;
 RETURN jsonb_build_object('id',rid,'attempt',w.attempt,'release',w.release_id);
END$$;

-- The existing immutable witness is the authoritative JSONB evidence bundle.
-- Only report persistence omits the duplicate graph; authorized readers reconstruct
-- the exact original body from the same account/execution/report-bound witness.
CREATE FUNCTION twuanis_canonical_private.evidence_v2_report_body(stored jsonb) RETURNS jsonb
LANGUAGE plpgsql VOLATILE STRICT SET search_path=pg_catalog AS $$
DECLARE w twuanis_canonical_private.orchestrator_execution_witnesses%ROWTYPE;BEGIN
 IF stored->>'format' IS DISTINCT FROM 'twuanis-orchestrator-evidence-v2' OR stored?'immutableEvidence' THEN RETURN stored;END IF;
 SELECT * INTO STRICT w FROM twuanis_canonical_private.orchestrator_execution_witnesses WHERE id=(stored->>'witnessId')::uuid AND report_id=(stored->>'reportId')::uuid AND execution_id=(stored->>'executionId')::uuid;
 IF stored-ARRAY['witnessId','methodologyRelease'] IS DISTINCT FROM w.envelope OR NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.orchestrator_witness_attempts a JOIN twuanis_canonical_private.execution_credit_executions x ON x.id=a.execution_id WHERE a.execution_id=w.execution_id AND a.attempt=w.attempt AND a.release_id=stored->>'methodologyRelease' AND x.account_id=(stored->>'accountId')::uuid) THEN RAISE EXCEPTION 'Stored report witness binding invalid';END IF;
 RETURN stored||jsonb_build_object('immutableEvidence',w.transcript);
END$$;
REVOKE ALL ON FUNCTION twuanis_canonical_private.evidence_v2_report_body(jsonb) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION twuanis_canonical_private.evidence_v2_witness_binding(body jsonb,execution uuid,report uuid,account uuid) RETURNS void LANGUAGE plpgsql VOLATILE SET search_path=pg_catalog AS $$
DECLARE w twuanis_canonical_private.orchestrator_execution_witnesses%ROWTYPE;a twuanis_canonical_private.orchestrator_witness_attempts%ROWTYPE;x twuanis_canonical_private.execution_credit_executions%ROWTYPE;BEGIN
 SELECT * INTO STRICT x FROM twuanis_canonical_private.execution_credit_executions WHERE id=execution AND account_id=account;
 SELECT * INTO w FROM twuanis_canonical_private.orchestrator_execution_witnesses WHERE id=(body->>'witnessId')::uuid AND execution_id=execution AND report_id=report;
 IF NOT FOUND THEN RAISE EXCEPTION 'WITNESS_REQUIRED';END IF;
 SELECT * INTO STRICT a FROM twuanis_canonical_private.orchestrator_witness_attempts WHERE execution_id=w.execution_id AND attempt=w.attempt;
 IF body->>'methodologyRelease' IS DISTINCT FROM a.release_id OR body->'request' IS DISTINCT FROM x.request_payload OR body->>'orchestrator' IS DISTINCT FROM x.orchestrator_id OR body->>'population' IS DISTINCT FROM x.population OR body#>>'{accounting,settlementRequestId}' IS DISTINCT FROM w.settlement_id::text THEN RAISE EXCEPTION 'WITNESS_EXECUTION_BINDING';END IF;
 IF body->'immutableEvidence' IS DISTINCT FROM w.transcript OR (body-ARRAY['immutableEvidence','witnessId','methodologyRelease']) IS DISTINCT FROM w.envelope THEN RAISE EXCEPTION 'WITNESS_REPORT_MISMATCH';END IF;
 IF NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.orchestrator_methodology_releases r WHERE r.id=a.release_id AND r.manifest->'methodology'=body#>'{evidence,methodology}') THEN RAISE EXCEPTION 'WITNESS_METHODOLOGY_BINDING';END IF;
 -- New commitment must belong to current attempt; immutable completed retries keep existing semantics.
 IF NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.execution_credit_reports r WHERE r.execution_id=execution) AND (a.lease_until<=clock_timestamp() OR x.lease_until<=clock_timestamp() OR NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.orchestrator_execution_claims c WHERE c.execution_id=execution AND c.attempt=a.attempt AND c.worker=a.worker AND c.lease_until>clock_timestamp())) THEN RAISE EXCEPTION 'WITNESS_EXPIRED_ATTEMPT';END IF;
END$$;
REVOKE ALL ON FUNCTION public.orchestrator_execution_claim_v2(jsonb,uuid,uuid,text,text,jsonb,uuid,text),public.orchestrator_witness_finalize(jsonb,uuid,uuid,integer,text,uuid,uuid,jsonb,jsonb),twuanis_canonical_private.evidence_v2_witness_binding(jsonb,uuid,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.orchestrator_execution_claim_v2(jsonb,uuid,uuid,text,text,jsonb,uuid,text),public.orchestrator_witness_finalize(jsonb,uuid,uuid,integer,text,uuid,uuid,jsonb,jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.record_execution_credit_report(p_claims jsonb, p_execution uuid, p_report uuid, p_body jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE a uuid;x twuanis_canonical_private.execution_credit_executions%ROWTYPE;o twuanis_canonical_private.execution_credit_orchestrators%ROWTYPE;old twuanis_canonical_private.execution_credit_reports%ROWTYPE;ids text[];count_sub integer;
BEGIN
 a:=twuanis_canonical_private.execution_credit_bridge(p_claims);SELECT * INTO STRICT x FROM twuanis_canonical_private.execution_credit_executions WHERE id=p_execution AND account_id=a;
 SELECT * INTO old FROM twuanis_canonical_private.execution_credit_reports WHERE execution_id=x.id;
 IF FOUND THEN IF old.id<>p_report OR twuanis_canonical_private.evidence_v2_report_body(old.body) IS DISTINCT FROM p_body THEN RAISE EXCEPTION 'Immutable report retry conflict';END IF;RETURN jsonb_build_object('id',old.id,'substantiveCount',old.substantive_count,'replayed',true);END IF;
 IF p_report IS NULL OR twuanis_canonical_private.execution_credit_execution_state(x.id)<>'RESERVED' OR x.lease_until<=clock_timestamp() OR jsonb_typeof(p_body)<>'object' OR (p_body->>'format' IS DISTINCT FROM 'twuanis-orchestrator-evidence-v2' AND octet_length(p_body::text)>262144) OR p_body->>'language' NOT IN('en','es') OR p_body->>'language' IS NULL OR p_body->>'orchestrator' IS DISTINCT FROM x.orchestrator_id OR p_body->>'population' IS DISTINCT FROM x.population OR p_body->'request' IS DISTINCT FROM x.request_payload OR jsonb_typeof(p_body->'engines') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Complete bound durable report evidence required';END IF;
 IF p_body->>'format'='twuanis-orchestrator-evidence-v2' THEN PERFORM twuanis_canonical_private.evidence_v2_witness_binding(p_body,p_execution,p_report,a);IF octet_length(p_body::text)>33554432 THEN RAISE EXCEPTION 'V2 qualification resource ceiling exceeded';END IF; -- Exact immutable witness equality reuses its completed DB validation; fresh source validation remains below.
PERFORM twuanis_canonical_private.evidence_v2_private_sources(p_body);ELSIF p_body->>'format' IS NOT NULL AND p_body->>'format'<>'twuanis-orchestrator-evidence-v1' THEN RAISE EXCEPTION 'Unsupported report version';END IF;
 SELECT * INTO STRICT o FROM twuanis_canonical_private.execution_credit_orchestrators WHERE id=x.orchestrator_id;
 SELECT array_agg(v->>'id' ORDER BY v->>'id'),count(*)FILTER(WHERE v->>'state'='SUBSTANTIVE') INTO ids,count_sub FROM jsonb_array_elements(p_body->'engines')v;
 IF ids IS DISTINCT FROM(SELECT array_agg(e ORDER BY e)FROM unnest(o.engines)e) OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_body->'engines')v WHERE jsonb_typeof(v)<>'object' OR v->>'state' IS NULL OR v->>'state' NOT IN('SUBSTANTIVE','UNDEFINED') OR(v->>'state'='SUBSTANTIVE' AND(jsonb_typeof(v->'result')NOT IN('object','array')OR v->'result'IS NULL OR v->'result' IN('{}'::jsonb,'[]'::jsonb))) OR(v->>'state'='UNDEFINED' AND coalesce(length(btrim(v->>'reason')),0)=0))THEN RAISE EXCEPTION 'Exact engine coverage and verified result states required';END IF;
 IF p_body->>'format'='twuanis-orchestrator-evidence-v2' THEN p_body:=p_body-'immutableEvidence';END IF;
 INSERT INTO twuanis_canonical_private.execution_credit_reports(id,execution_id,account_id,body,content_md5,substantive_count) VALUES(p_report,x.id,a,p_body,md5(p_body::text),count_sub);
 RETURN jsonb_build_object('id',p_report,'substantiveCount',count_sub,'replayed',false);
END$function$
;
REVOKE ALL ON FUNCTION twuanis_canonical_private.evidence_v2_private_sources(jsonb),twuanis_canonical_private.evidence_v2_field(jsonb,text,text),twuanis_canonical_private.evidence_v2_json(jsonb),twuanis_canonical_private.evidence_v2_decode(jsonb,text,integer),twuanis_canonical_private.evidence_v2_validate(jsonb,uuid,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
DO $$BEGIN IF encode(sha256(convert_to(pg_get_functiondef('public.orchestrator_execution_commit(jsonb,uuid,uuid,uuid,jsonb,uuid)'::regprocedure),'UTF8')),'hex')<>'7abcd91315f8dd078029d8f77106f5c96184a8265e915246eec7bb7c0af984f6' THEN RAISE EXCEPTION 'Unreviewed worker/settlement predecessor';END IF;END$$;
CREATE OR REPLACE FUNCTION public.orchestrator_execution_commit(p_claims jsonb, p_execution uuid, p_worker uuid, p_report uuid, p_body jsonb, p_settlement uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE transport text:=current_setting('request.jwt.claims',true);a uuid;x twuanis_canonical_private.execution_credit_executions%ROWTYPE;r jsonb;existing uuid;
BEGIN
 a:=twuanis_canonical_private.execution_credit_bridge(p_claims);
 SELECT * INTO STRICT x FROM twuanis_canonical_private.execution_credit_executions WHERE id=p_execution AND account_id=a;
 PERFORM pg_advisory_xact_lock(3512,hashtext(a::text));
 IF coalesce(p_body,(SELECT body FROM twuanis_canonical_private.execution_credit_reports WHERE execution_id=x.id))->>'format'='twuanis-orchestrator-evidence-v2' AND coalesce(p_body,(SELECT body FROM twuanis_canonical_private.execution_credit_reports WHERE execution_id=x.id))#>>'{accounting,settlementRequestId}' IS DISTINCT FROM p_settlement::text THEN RAISE EXCEPTION 'WITNESS_SETTLEMENT_IDENTITY';END IF;
 IF x.authority IS DISTINCT FROM twuanis_canonical_private.execution_credit_authority(x.orchestrator_id,x.population)THEN RAISE EXCEPTION 'Current execution authority required' USING ERRCODE='42501';END IF;
 SELECT id INTO existing FROM twuanis_canonical_private.execution_credit_reports WHERE execution_id=x.id;
 IF existing IS NULL AND NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.orchestrator_execution_claims WHERE execution_id=x.id AND worker=p_worker AND lease_until>clock_timestamp())THEN RAISE EXCEPTION 'Current worker claim required';END IF;
 IF existing IS NULL THEN PERFORM set_config('request.jwt.claims',transport,true);PERFORM public.record_execution_credit_report(p_claims,x.id,p_report,p_body);
 ELSIF existing IS DISTINCT FROM p_report THEN RAISE EXCEPTION 'Report identity conflict';
 ELSIF p_body IS NOT NULL THEN PERFORM set_config('request.jwt.claims',transport,true);PERFORM public.record_execution_credit_report(p_claims,x.id,p_report,p_body);END IF;
 PERFORM set_config('request.jwt.claims',transport,true);
 r:=public.execution_credit_service(p_claims,p_settlement,jsonb_build_object('operation','settle','execution',x.id));
 RETURN r;
END$function$
;
CREATE OR REPLACE FUNCTION public.read_completed_execution_report(p_report uuid) RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$DECLARE a uuid;body jsonb;BEGIN
 a:=twuanis_canonical_private.execution_credit_actor();SELECT r.body INTO body FROM twuanis_canonical_private.execution_credit_reports r WHERE r.id=p_report AND r.account_id=a AND EXISTS(SELECT 1 FROM twuanis_canonical_private.execution_credit_events e WHERE e.report_id=r.id AND e.execution_id=r.execution_id AND e.account_id=a AND e.kind IN('EXECUTION_CONSUMED','OWNER_COMPLETED'));
 IF body IS NULL THEN RAISE EXCEPTION 'Completed account-owned report required' USING ERRCODE='42501';END IF;RETURN twuanis_canonical_private.evidence_v2_report_body(body);
END$$;

DO $$BEGIN IF encode(sha256(convert_to(pg_get_functiondef('public.read_orchestrator_bank_evidence(jsonb,text,text,text,uuid)'::regprocedure),'UTF8')),'hex')<>'feaa04fd32e46b7e85804a7218c98ac883c62cd5305e6ec4206a73e8c2954813' THEN RAISE EXCEPTION 'Unreviewed Bank reader predecessor';END IF;END$$;
DO $$BEGIN IF encode(sha256(convert_to(pg_get_viewdef('twuanis_remates_private.public_projection'::regclass,true),'UTF8')),'hex')<>'6f2cf442c09fe4407e8b708954c547331553d9e389ceb1b20b2a174558130aa3' THEN RAISE EXCEPTION 'Unreviewed public projection predecessor';END IF;END$$;
CREATE OR REPLACE FUNCTION public.read_orchestrator_bank_evidence(p_claims jsonb, p_orchestrator text, p_capability text, p_population text, p_after uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE a uuid;grant_value jsonb;authority jsonb;rows jsonb;terms jsonb;
BEGIN
 a:=twuanis_canonical_private.execution_credit_bridge(p_claims);
 grant_value:=twuanis_canonical_private.execution_credit_authority(p_orchestrator,p_population);
 IF p_population NOT IN('BANK','COMBINED') OR NOT(grant_value->'capabilities'?p_capability) THEN RAISE EXCEPTION 'Registered orchestrator population/capability required' USING ERRCODE='42501';END IF;
 terms:=CASE WHEN grant_value->>'kind'='OWNER_UNMETERED' THEN '[]'::jsonb ELSE twuanis_canonical_private.bank_analytical_grant_terms(a,p_capability) END;
 IF terms IS NULL THEN RAISE EXCEPTION 'Same-term Bank authority required' USING ERRCODE='42501';END IF;
 authority:=jsonb_build_object('accountId',a,'capability',p_capability,'population',p_population,'terms',terms);
 WITH canonical_visibility AS MATERIALIZED (SELECT id,twuanis_remates_private.publication_visibility(id) value FROM twuanis_remates_private.listings), canonical_public AS MATERIALIZED (SELECT l.id,
    l.revision::text AS revision,
    l.offering_id,
    i.id AS institution_id,
    i.legal_name AS institution,
    COALESCE(fe.mechanism, 'UNKNOWN'::text) AS mechanism,
    l.state,
    vis.value ->> 'label'::text AS visibility_label,
        CASE
            WHEN COALESCE(( SELECT d.publication_model
               FROM twuanis_remates_private.independent_source_decisions d
              WHERE d.source_id = s.id
              ORDER BY d.revision DESC
             LIMIT 1), 'REVIEWED_SOURCE_CONTENT'::text) = 'FACTUAL_ONLY'::text THEN ''::text
            ELSE COALESCE(( SELECT "left"(f.raw_value, 256) AS "left"
               FROM twuanis_remates_private.observation_fields f
              WHERE f.observation_id = ob.id AND f.field_path = 'title'::text AND f.validation = 'VALID'::text
              ORDER BY f.ordinal
             LIMIT 1), ''::text)
        END AS title,
    s.namespace AS source_name,
        CASE
            WHEN ob.source_url ~~ 'https://%'::text AND twuanis_remates_private.valid_evidence_locator(s.id, ob.source_url) THEN ob.source_url
            ELSE NULL::text
        END AS source_url,
    fv.amount::text AS amount,
    fv.currency,
    fv.kind AS financial_kind,
    fv.original_label AS financial_label,
    fv.round_key AS auction_round,
    pub.recorded_at AS published_at,
    ( SELECT jsonb_agg(jsonb_build_object('id', p.id, 'terms', ( SELECT COALESCE(jsonb_agg(jsonb_build_object('id', t.id::text, 'type', t.term_type, 'parent', t.parent_id::text, 'en', COALESCE(to_jsonb(t.*) ->> 'term_name_en'::text, t.term_name), 'es', COALESCE(to_jsonb(t.*) ->> 'term_name_es'::text, t.term_name)) ORDER BY t.id), '[]'::jsonb) AS "coalesce"
                   FROM twuanis_remates_private.property_terms pt
                     JOIN public.ontology_terms t ON t.id = pt.term_id
                  WHERE pt.classification_id = c.id AND pt.selected AND (t.term_type = ANY (ARRAY['province'::text, 'canton'::text, 'district'::text, 'property_type'::text]))), 'area', ( SELECT property_facts.exact_value::text AS exact_value
                   FROM twuanis_remates_private.property_facts
                  WHERE property_facts.classification_id = c.id AND property_facts.dimension = 'property_area'::text AND property_facts.kind = 'exact'::text), 'construction_area', ( SELECT pf.exact_value::text AS exact_value
                   FROM twuanis_remates_private.property_facts pf
                  WHERE pf.classification_id = c.id AND pf.dimension = 'construction_area'::text AND pf.kind = 'exact'::text AND pf.exact_value > 0::numeric), 'images',
                CASE
                    WHEN s.namespace = 'bp-inventory'::text AND s.origin_host = 'srv.bancopopular.fi.cr'::text AND twuanis_remates_private.independent_source_allowed(s.id) AND COALESCE(( SELECT d.public_image_display
                       FROM twuanis_remates_private.independent_source_decisions d
                      WHERE d.source_id = s.id
                      ORDER BY d.revision DESC
                     LIMIT 1), false) AND (( SELECT count(*) AS count
                       FROM twuanis_remates_private.offering_properties single_property
                      WHERE single_property.offering_id = o.id)) = 1 THEN COALESCE(( SELECT jsonb_agg(ref.source_url ORDER BY ref.ordinal, ref.id) AS jsonb_agg
                       FROM ( SELECT a.id,
                                a.ordinal,
                                a.source_url
                               FROM twuanis_remates_private.media_assets a
                                 JOIN LATERAL ( SELECT ml.state
                                       FROM twuanis_remates_private.media_links ml
                                      WHERE ml.asset_id = a.id
                                      ORDER BY ml.revision DESC
                                     LIMIT 1) link ON true
                                 JOIN twuanis_remates_private.observation_fields field ON field.observation_id = a.observation_id AND field.field_path = a.field_path AND field.ordinal = a.ordinal
                              WHERE a.offering_id = o.id AND a.source_id = s.id AND a.observation_id = ob.id AND a.kind = 'SOURCE_REFERENCE'::text AND link.state = 'STAGED'::text AND a.field_path = 'csv.image_url'::text AND field.validation = 'VALID'::text AND field.raw_value = a.source_url AND a.source_url ~* '^https://srv[.]bancopopular[.]fi[.]cr/(?!.*([?#[:space:]]|[.][.]))[^?#[:space:]]+[.](jpg|jpeg|png|webp)$'::text
                              ORDER BY a.ordinal, a.id
                             LIMIT 32) ref), '[]'::jsonb)
                    ELSE '[]'::jsonb
                END)) AS jsonb_agg
           FROM twuanis_remates_private.offering_properties op
             JOIN twuanis_remates_private.properties p ON p.id = op.property_id
             JOIN LATERAL ( SELECT cc.id,
                    cc.institution_id,
                    cc.property_id,
                    cc.property_revision,
                    cc.source_id,
                    cc.observation_id,
                    cc.binding_id,
                    cc.revision,
                    cc.prior_id,
                    cc.actor_id,
                    cc.receipt_id,
                    cc.reason,
                    cc.snapshot,
                    cc.minimum_ready,
                    cc.recorded_at
                   FROM twuanis_remates_private.classification_versions cc
                  WHERE cc.property_id = p.id
                  ORDER BY cc.revision DESC
                 LIMIT 1) c ON true
          WHERE op.offering_id = o.id) AS properties
   FROM twuanis_remates_private.listings l JOIN canonical_visibility vis ON vis.id=l.id
     JOIN twuanis_remates_private.offerings o ON o.id = l.offering_id
     JOIN twuanis_remates_private.institutions i ON i.id = o.institution_id
     JOIN twuanis_remates_private.sources s ON s.id = o.source_id
     JOIN LATERAL ( SELECT e.id,
            e.institution_id,
            e.source_id,
            e.listing_id,
            e.offering_id,
            e.revision,
            e.prior_id,
            e.state,
            e.operation,
            e.policy_id,
            e.ingestion_id,
            e.financial_event_id,
            e.verification_id,
            e.actor_id,
            e.receipt_id,
            e.reason,
            e.evidence,
            e.transaction_id,
            e.recorded_at
           FROM twuanis_remates_private.publication_events e
          WHERE e.listing_id = l.id
          ORDER BY e.revision DESC
         LIMIT 1) pub ON true
     LEFT JOIN twuanis_remates_private.ingestion_results ir ON ir.id = pub.ingestion_id
     LEFT JOIN twuanis_remates_private.observations ob ON ob.id = ir.observation_id
     LEFT JOIN twuanis_remates_private.offering_events fe ON fe.id = pub.financial_event_id
     LEFT JOIN twuanis_remates_private.financial_values fv ON fv.id = fe.selected_value_id AND (fv.kind = ANY (ARRAY['SELLING_PRICE'::text, 'AUCTION_BASE'::text]))
  WHERE COALESCE(( SELECT delivery_versions.enabled
           FROM twuanis_remates_private.delivery_versions
          ORDER BY delivery_versions.revision DESC
         LIMIT 1), false) AND (vis.value -> 'visible'::text) = 'true'::jsonb) SELECT jsonb_build_object('items',coalesce(jsonb_agg(item ORDER BY listing_id,property_id),'[]'),'dataRevision',
 (SELECT md5(jsonb_build_object('public',coalesce(jsonb_agg(v ORDER BY v.id),'[]'),
 'classes',(SELECT coalesce(jsonb_agg(cc.id ORDER BY cc.id),'[]') FROM twuanis_remates_private.classification_versions cc JOIN twuanis_remates_private.offering_properties op ON op.property_id=cc.property_id JOIN canonical_public vp ON vp.offering_id=op.offering_id),
 'financial',(SELECT coalesce(jsonb_agg(fe.id ORDER BY fe.id),'[]') FROM twuanis_remates_private.offering_events fe JOIN canonical_public vp ON vp.offering_id=fe.offering_id),
 'policies',(SELECT coalesce(jsonb_agg(pol.id ORDER BY pol.id),'[]') FROM twuanis_remates_private.source_lifecycle_policies pol JOIN twuanis_remates_private.offerings off ON off.source_id=pol.source_id JOIN canonical_public vp ON vp.offering_id=off.id))::text) FROM canonical_public v)) INTO rows FROM (
 SELECT v.id listing_id,p.id property_id,jsonb_build_object(
 'population','BANK','listingId',v.id,'propertyId',p.id,'offeringId',v.offering_id,'sourceId',s.id,'sourceNamespace',s.namespace,
 'sourceRevision',s.revision::text,'recordKey',b.record_key,'bindingId',b.id,'bindingRevision',b.revision::text,
 'publicationRevision',v.revision,'publicationStatus',v.state,'classificationId',c.id,'classificationRevision',c.revision::text,
 'observationId',ob.id,'observedAt',ob.retrieved_at,'contentHash',ob.content_sha256,'policyId',pol.id,'policyRevision',pol.revision::text,
 'freshSeconds',pol.fresh_seconds::text,'lifecycle',twuanis_remates_private.lifecycle_eligibility(v.offering_id),
 'mechanism',v.mechanism,'transactionEvidence',CASE WHEN ob.raw_text LIKE '{%' AND ob.parse_status='PARSED' THEN jsonb_build_array(jsonb_build_object('value',ob.raw_text::jsonb->>'transaction_type','path','raw.transaction_type','ordinal',0,'validation','RETAINED_RAW')) ELSE '[]'::jsonb END,
 'financial',jsonb_build_object('id',fv.id,'eventId',fe.id,'eventRevision',fe.revision::text,'kind',fv.kind,'status',fv.status,'amount',fv.amount::text,'currency',fv.currency,'observationId',fv.observation_id,'sourceId',fv.source_id,'offeringId',fv.offering_id,'fieldPath',fv.field_path,'ordinal',fv.ordinal,'selectionValid',twuanis_remates_private.financial_selection_valid(fe.id)),
 'terms',(SELECT jsonb_agg(jsonb_build_object('id',t.id::text,'parent_id',t.parent_id::text,'term_type',t.term_type,'level',t.level,'official_code',t.official_code,'slug',t.slug,'term_name',t.term_name,'term_name_en',to_jsonb(t)->>'term_name_en','term_name_es',to_jsonb(t)->>'term_name_es','slug_en',to_jsonb(t)->>'slug_en','slug_es',to_jsonb(t)->>'slug_es')) FROM twuanis_remates_private.property_terms pt JOIN public.ontology_terms t ON t.id=pt.term_id WHERE pt.classification_id=c.id AND pt.selected AND t.term_type IN('province','canton','district','property_type')),
 'measurements',(SELECT coalesce(jsonb_agg(jsonb_build_object('dimension',f.dimension,'kind',f.kind,'value',f.exact_value::text,'observationId',f.evidence_id,'fieldPath',f.field_path,'ordinal',f.ordinal,'unit',ef.unit,'validation',ef.validation,'fieldValue',ef.raw_value,'observedAt',eo.retrieved_at,'sourceId',eo.source_id,'recordKey',eo.record_key,'contentHash',eo.content_sha256,'page',ef.document_page,'selector',ef.selector)), '[]') FROM twuanis_remates_private.property_facts f JOIN twuanis_remates_private.observation_fields ef ON (ef.observation_id,ef.field_path,ef.ordinal)=(f.evidence_id,f.field_path,f.ordinal) JOIN twuanis_remates_private.observations eo ON eo.id=f.evidence_id WHERE f.classification_id=c.id AND f.dimension IN('property_area','construction_area')),
 'registryMeasurements',(SELECT coalesce(jsonb_agg(jsonb_build_object('value',f.raw_value,'observationId',f.observation_id,'fieldPath',f.field_path,'ordinal',f.ordinal,'unit',f.unit,'validation',f.validation,'page',f.document_page,'selector',f.selector)), '[]') FROM twuanis_remates_private.observation_fields f WHERE f.observation_id=c.observation_id AND f.field_path='pdf.normalized_registry_area'),
 'otherFacts',(SELECT coalesce(jsonb_agg(jsonb_build_object('dimension',f.dimension,'kind',f.kind,'exactValue',f.exact_value::text,'categoryTermId',f.category_term_id::text,'rangeLower',f.range_lower::text,'rangeUpper',f.range_upper::text,'lowerInclusive',f.lower_inclusive,'upperInclusive',f.upper_inclusive,'observationId',f.evidence_id,'fieldPath',f.field_path,'ordinal',f.ordinal)), '[]') FROM twuanis_remates_private.property_facts f WHERE f.classification_id=c.id AND f.dimension NOT IN('property_area','construction_area')),
 'semantics',(SELECT coalesce(jsonb_agg(jsonb_build_object('dimension',pt.dimension,'termId',pt.term_id::text,'observationId',pt.evidence_id)), '[]') FROM twuanis_remates_private.property_terms pt WHERE pt.classification_id=c.id AND pt.selected AND pt.dimension IN('property_type','utility','environment','terrain','accessibility','legal_status')),
 'areaSelection',(SELECT CASE WHEN eo.raw_text LIKE '{%' AND eo.raw_text::jsonb->>'format'='bp-reviewed-factual-areas-v1' THEN eo.raw_text::jsonb->'selection' ELSE NULL END FROM twuanis_remates_private.observations eo WHERE eo.id=c.observation_id)
 ) item
 FROM canonical_public v
 JOIN twuanis_remates_private.offerings off ON off.id=v.offering_id
 JOIN twuanis_remates_private.sources s ON s.id=off.source_id
 JOIN twuanis_remates_private.offering_properties op ON op.offering_id=off.id
 JOIN twuanis_remates_private.properties p ON p.id=op.property_id AND p.identity_status='CONFIRMED'
 JOIN LATERAL(SELECT cc.* FROM twuanis_remates_private.classification_versions cc WHERE cc.property_id=p.id ORDER BY cc.revision DESC LIMIT 1)c ON twuanis_remates_private.classification_minimum_valid(c.id) AND c.source_id=s.id
 JOIN twuanis_remates_private.source_bindings b ON b.id=c.binding_id AND b.source_id=s.id AND b.offering_id=off.id
 JOIN twuanis_remates_private.ingestion_results ir ON ir.id=twuanis_remates_private.current_ingestion(off.id)
 JOIN twuanis_remates_private.observations ob ON ob.id=ir.observation_id AND ob.source_id=s.id
 JOIN LATERAL(SELECT x.* FROM twuanis_remates_private.source_lifecycle_policies x WHERE x.source_id=s.id ORDER BY x.revision DESC LIMIT 1)pol ON pol.source_revision=s.revision
 JOIN LATERAL(SELECT x.* FROM twuanis_remates_private.offering_events x WHERE x.offering_id=off.id ORDER BY x.revision DESC LIMIT 1)fe ON true
 LEFT JOIN twuanis_remates_private.financial_values fv ON fv.id=fe.selected_value_id
 WHERE v.state='PUBLISHED' AND (p_after IS NULL OR v.id>p_after)
 AND (SELECT count(*) FROM twuanis_remates_private.offering_properties one WHERE one.offering_id=off.id)=1
 ORDER BY v.id,p.id LIMIT 101
 ) bounded;

 RETURN rows||jsonb_build_object('authority',authority);
END$function$;


-- 108_orchestrator_validation_lookup_indexes.sql SHA256 6795ead34703417777dbd1da04f65412e381697490d5f05ebe88704bd8a664dd

-- Local qualification candidate only. Preserves all integrity predicates and resource limits.
DO $$BEGIN IF encode(sha256(convert_to(pg_get_functiondef('twuanis_canonical_private.evidence_v2_validate(jsonb,uuid,uuid,uuid)'::regprocedure),'UTF8')),'hex')<>'a9b824fd9cc456f7ffa1b15cbc9dc85764ba96151fa48c18d18b925c9860eb1d' THEN RAISE EXCEPTION 'Unreviewed evidence validator predecessor';END IF;END$$;
CREATE OR REPLACE FUNCTION twuanis_canonical_private.evidence_v2_validate(body jsonb,execution uuid,report uuid,account uuid) RETURNS void LANGUAGE plpgsql VOLATILE SET search_path=pg_catalog AS $$
DECLARE ev jsonb;nodes jsonb;n jsonb;rec jsonb;entry record;kind text;item jsonb;refs text[];ref text;engine jsonb;decoded jsonb;ids text[];cnt integer;request_ref text;rows_ref text;checked_rows text[]:=ARRAY[]::text[];BEGIN
 ev:=body->'immutableEvidence';nodes:=ev->'nodes';
 IF body->>'format' IS DISTINCT FROM 'twuanis-orchestrator-evidence-v2' OR body->>'executionId' IS DISTINCT FROM execution::text OR body->>'reportId' IS DISTINCT FROM report::text OR body->>'accountId' IS DISTINCT FROM account::text OR ev->>'schema' IS DISTINCT FROM 'twuanis-analytical-evidence-v2' OR ev->>'encoding' IS DISTINCT FROM 'ordered-content-graph-binary64-v1' OR jsonb_typeof(nodes) IS DISTINCT FROM 'object' OR jsonb_typeof(ev->'records') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Complete V2 identity and schema required';END IF;
 -- Experimental ceiling: not a production-qualified budget. Scope remains fail closed.
 IF octet_length(body::text)>33554432 OR jsonb_array_length(ev->'records')>40000 OR (SELECT count(*) FROM jsonb_object_keys(nodes))>100000 THEN RAISE EXCEPTION 'V2 qualification resource ceiling exceeded';END IF;
 -- Rebuild a private, transaction-local lookup; never trust a caller-created cache.
 DROP TABLE IF EXISTS pg_temp.twuanis_evidence_validation_nodes;
 CREATE TEMP TABLE pg_temp.twuanis_evidence_validation_nodes(node_id text PRIMARY KEY,node jsonb NOT NULL,decoded jsonb,decoded_ready boolean NOT NULL DEFAULT false,decoded_height integer)ON COMMIT DROP;
 REVOKE ALL ON pg_temp.twuanis_evidence_validation_nodes FROM PUBLIC,anon,authenticated,service_role;
 INSERT INTO pg_temp.twuanis_evidence_validation_nodes(node_id,node) SELECT key,value FROM jsonb_each(nodes);
 ANALYZE pg_temp.twuanis_evidence_validation_nodes;
 DROP TABLE IF EXISTS pg_temp.twuanis_evidence_validation_records;
 CREATE TEMP TABLE pg_temp.twuanis_evidence_validation_records ON COMMIT DROP AS SELECT value->>'kind' kind,value->>'contentId' content_id FROM jsonb_array_elements(ev->'records');
 REVOKE ALL ON pg_temp.twuanis_evidence_validation_records FROM PUBLIC,anon,authenticated,service_role;
 CREATE INDEX ON pg_temp.twuanis_evidence_validation_records(kind);
 ANALYZE pg_temp.twuanis_evidence_validation_records;
 PERFORM twuanis_canonical_private.evidence_v2_call_relationships(body);
 FOR entry IN SELECT * FROM jsonb_each(nodes) LOOP
  n:=entry.value;kind:=n->>0;refs:=ARRAY[]::text[];
  IF entry.key!~'^[0-9a-f]{64}$' OR encode(sha256(convert_to(twuanis_canonical_private.evidence_v2_json(n),'UTF8')),'hex')<>entry.key OR jsonb_typeof(n)<>'array' THEN RAISE EXCEPTION 'Evidence content hash mismatch';END IF;
  IF kind='scalar' THEN IF jsonb_array_length(n)<>2 OR jsonb_typeof(n->1) NOT IN('string','null','boolean') THEN RAISE EXCEPTION 'Invalid scalar evidence';END IF;
  ELSIF kind='binary64' THEN IF jsonb_array_length(n)<>3 OR n->>1!~'^[0-9a-f]{16}$' OR n->>2!~'^-?([0-9]+(\.[0-9]+)?)(e[+-]?[0-9]+)?$' OR encode(float8send((n->>2)::double precision),'hex')<>n->>1 THEN RAISE EXCEPTION 'Invalid numerical evidence';END IF;
  ELSIF kind='bigint' THEN IF jsonb_array_length(n)<>2 OR n->>1!~'^-?[0-9]+$' THEN RAISE EXCEPTION 'Invalid integer evidence';END IF;
  ELSIF kind='undefined' THEN IF jsonb_array_length(n)<>1 THEN RAISE EXCEPTION 'Invalid undefined value';END IF;
  ELSIF kind IN('array','set') THEN IF jsonb_array_length(n)<>2 OR jsonb_typeof(n->1)<>'array' THEN RAISE EXCEPTION 'Invalid sequence';END IF;SELECT coalesce(array_agg(value),ARRAY[]::text[]) INTO refs FROM jsonb_array_elements_text(n->1);
  ELSIF kind IN('object','map') THEN
   IF jsonb_array_length(n)<>(CASE WHEN kind='map' THEN 3 ELSE 2 END) OR jsonb_typeof(n->1)<>'array' THEN RAISE EXCEPTION 'Invalid keyed evidence';END IF;
   FOR item IN SELECT value FROM jsonb_array_elements(n->1) LOOP IF jsonb_typeof(item)<>'array' OR jsonb_array_length(item)<>2 OR jsonb_typeof(item->0)<>'string' OR jsonb_typeof(item->1)<>'string' THEN RAISE EXCEPTION 'Invalid keyed pair';END IF;refs:=array_append(refs,item->>1);IF kind='map' THEN refs:=array_append(refs,item->>0);END IF;END LOOP;
   IF kind='object' AND (SELECT count(*)<>count(DISTINCT value->>0) FROM jsonb_array_elements(n->1)) THEN RAISE EXCEPTION 'Duplicate evidence key';END IF;
   IF kind='map' THEN IF jsonb_typeof(n->2)<>'array' THEN RAISE EXCEPTION 'Invalid map properties';END IF;FOR item IN SELECT value FROM jsonb_array_elements(n->2) LOOP refs:=array_append(refs,item->>1);END LOOP;END IF;
  ELSIF kind='archive-callback' THEN IF jsonb_array_length(n)<>2 OR jsonb_typeof(n->1)<>'string' THEN RAISE EXCEPTION 'Invalid callback identity';END IF;
  ELSE RAISE EXCEPTION 'Unsupported evidence tag';END IF;
  FOREACH ref IN ARRAY refs LOOP IF ref IS NULL OR ref!~'^[0-9a-f]{64}$' OR NOT nodes?ref THEN RAISE EXCEPTION 'Incomplete evidence reference';END IF;END LOOP;
 END LOOP;
 FOR rec IN SELECT value FROM jsonb_array_elements(ev->'records') LOOP IF jsonb_typeof(rec)<>'object' OR jsonb_typeof(rec->'kind') IS DISTINCT FROM 'string' OR NOT nodes?(rec->>'contentId') THEN RAISE EXCEPTION 'Incomplete evidence root';END IF;END LOOP;
 UPDATE pg_temp.twuanis_evidence_validation_nodes SET decoded=CASE node->>0 WHEN 'binary64' THEN(node->>2)::jsonb WHEN 'undefined' THEN 'null'::jsonb ELSE node->1 END,decoded_ready=true,decoded_height=0 WHERE node->>0 IN('scalar','binary64','undefined','bigint');
 FOR engine IN SELECT value FROM jsonb_array_elements(body->'engines') LOOP
  SELECT count(*),min(content_id) INTO cnt,ref FROM pg_temp.twuanis_evidence_validation_records r WHERE r.kind=engine->>'id'||'/engine-output';IF cnt<>1 THEN RAISE EXCEPTION 'Unique engine evidence required';END IF;
  decoded:=twuanis_canonical_private.evidence_v2_decode_indexed(ref);IF decoded IS DISTINCT FROM engine->'result' THEN RAISE EXCEPTION 'Engine output binding mismatch';END IF;
  SELECT count(*),min(content_id) INTO cnt,ref FROM pg_temp.twuanis_evidence_validation_records r WHERE r.kind=engine->>'id'||'/resolved-input';IF cnt<>1 THEN RAISE EXCEPTION 'Complete engine inputs required';END IF;
  SELECT pair->>1 INTO request_ref FROM pg_temp.twuanis_evidence_validation_nodes n CROSS JOIN LATERAL jsonb_array_elements(n.node->1)pair WHERE n.node_id=ref AND pair->>0='request';
  decoded:=twuanis_canonical_private.evidence_v2_decode_indexed(request_ref);
  IF decoded->>'engine' IS DISTINCT FROM engine->>'id' OR decoded#>>'{scope,population}' IS DISTINCT FROM body->>'population' OR decoded->'scope' IS DISTINCT FROM ((body#>'{request,scope}')||jsonb_build_object('population',body->>'population')) OR decoded->'filters' IS DISTINCT FROM body#>'{request,filters}' THEN RAISE EXCEPTION 'Engine input request binding mismatch';END IF;
  SELECT pair->>1 INTO rows_ref FROM pg_temp.twuanis_evidence_validation_nodes n CROSS JOIN LATERAL jsonb_array_elements(n.node->1)pair WHERE n.node_id=ref AND pair->>0='rows';
  IF NOT(rows_ref=ANY(checked_rows)) THEN
  SELECT array_agg(identity_node.node->>1) INTO ids FROM jsonb_array_elements_text(nodes->rows_ref->1)v LEFT JOIN pg_temp.twuanis_evidence_validation_nodes row_node ON row_node.node_id=v LEFT JOIN LATERAL(SELECT pair->>1 id FROM jsonb_array_elements(row_node.node->1)pair WHERE pair->>0='id')identity_ref ON true LEFT JOIN pg_temp.twuanis_evidence_validation_nodes identity_node ON identity_node.node_id=identity_ref.id;
  IF cardinality(ids)<>(SELECT count(DISTINCT v)FROM unnest(ids)v) OR EXISTS(SELECT 1 FROM unnest(ids)v WHERE v!~'^(PRIVATE|BANK):[0-9a-f-]{36}$' OR body->>'population'<>'COMBINED' AND split_part(v,':',1)<>body->>'population') THEN RAISE EXCEPTION 'Population identity or qualification limit mismatch';END IF;
  checked_rows:=array_append(checked_rows,rows_ref);END IF;
 END LOOP;
 IF body#>>'{evidence,methodology,sourceDigest}' IS NULL THEN RAISE EXCEPTION 'Methodology reference required';END IF;
END$$;

-- 109_orchestrator_scoped_population_acquisition.sql SHA256 ac68bf3a5d337fdc5056236b4af6ac82d26e0dc627a68b5203a7980a8bb4c65b

-- ORCH-ACQ-02: local reviewed candidate only. No existing math, policy or authorization changed.
DO $$BEGIN
IF encode(sha256(convert_to(pg_get_functiondef('twuanis_canonical_private.evidence_v2_validate(jsonb,uuid,uuid,uuid)'::regprocedure),'UTF8')),'hex')<>'213004e6476f376d92f61972caf9a511cdc1a3160e8a6afcd2cfc94f87ad5b9e' THEN RAISE EXCEPTION 'Unreviewed acquisition validator predecessor';END IF;
IF encode(sha256(convert_to(pg_get_functiondef('twuanis_canonical_private.evidence_v2_private_sources(jsonb)'::regprocedure),'UTF8')),'hex')<>'82dd9ea265837694dfe9484243ae38e4c436fcb73ffcf914bae3a063824fe4d9' THEN RAISE EXCEPTION 'Unreviewed acquisition validator predecessor';END IF;
IF encode(sha256(convert_to(pg_get_functiondef('public.read_orchestrator_bank_evidence(jsonb,text,text,text,uuid)'::regprocedure),'UTF8')),'hex')<>'51838199f578e7dbf2541f035224e6f44a8979306c79badcfebc79407cd7ed32' THEN RAISE EXCEPTION 'Unreviewed Bank predecessor';END IF;
END$$;
CREATE FUNCTION twuanis_canonical_private.orchestrator_bank_scope_page(p_scope jsonb,p_after uuid DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql VOLATILE SET search_path=pg_catalog AS $scope$
DECLARE rows jsonb;geo_input record;geo_row public.ontology_terms%ROWTYPE;BEGIN

 IF jsonb_typeof(p_scope) IS DISTINCT FROM 'object' OR (SELECT array_agg(k ORDER BY k) FROM jsonb_object_keys(p_scope)k) IS DISTINCT FROM ARRAY['geography','propertyType','transaction'] OR p_scope->>'transaction' NOT IN('sale','rent') OR p_scope->>'transaction' IS NULL OR jsonb_typeof(p_scope->'geography') IS DISTINCT FROM 'object' OR (SELECT array_agg(k ORDER BY k) FROM jsonb_object_keys(p_scope->'geography')k) IS DISTINCT FROM ARRAY['canton','district','province'] THEN RAISE EXCEPTION 'Canonical scope required';END IF;
 IF p_scope#>>'{geography,district}' IS NOT NULL AND p_scope#>>'{geography,canton}' IS NULL OR p_scope#>>'{geography,canton}' IS NOT NULL AND p_scope#>>'{geography,province}' IS NULL THEN RAISE EXCEPTION 'Canonical geographic ancestry required';END IF;
 IF jsonb_typeof(p_scope->'propertyType') IS DISTINCT FROM 'string' OR NOT EXISTS(SELECT 1 FROM public.ontology_terms t WHERE t.id::text=p_scope->>'propertyType' AND t.term_type='property_type' AND t.level=1) THEN RAISE EXCEPTION 'Canonical property type required';END IF;
 FOR geo_input IN SELECT key,value FROM jsonb_each_text(p_scope->'geography') LOOP
 IF geo_input.value IS NULL THEN CONTINUE;END IF;
 SELECT * INTO geo_row FROM public.ontology_terms WHERE id::text=geo_input.value;
 IF NOT FOUND OR geo_row.term_type<>geo_input.key OR geo_row.level<>(CASE geo_input.key WHEN 'province' THEN 1 WHEN 'canton' THEN 2 ELSE 3 END) OR geo_row.official_code IS NULL OR geo_row.official_code!~(CASE geo_input.key WHEN 'province' THEN '^[0-9]$' WHEN 'canton' THEN '^[0-9]{3}$' ELSE '^[0-9]{5}$' END) THEN RAISE EXCEPTION 'Canonical geographic identity required';END IF;
 IF geo_input.key='canton' AND (geo_row.parent_id::text IS DISTINCT FROM p_scope#>>'{geography,province}' OR left(geo_row.official_code,1) IS DISTINCT FROM(SELECT official_code FROM public.ontology_terms WHERE id=geo_row.parent_id)) OR geo_input.key='district' AND(geo_row.parent_id::text IS DISTINCT FROM p_scope#>>'{geography,canton}' OR left(geo_row.official_code,3) IS DISTINCT FROM(SELECT official_code FROM public.ontology_terms WHERE id=geo_row.parent_id)) THEN RAISE EXCEPTION 'Canonical geography mismatch';END IF;
 END LOOP;
 WITH canonical_visibility AS MATERIALIZED (SELECT id,twuanis_remates_private.publication_visibility(id) value FROM twuanis_remates_private.listings), canonical_public AS MATERIALIZED (SELECT l.id,
    l.revision::text AS revision,
    l.offering_id,
    i.id AS institution_id,
    i.legal_name AS institution,
    COALESCE(fe.mechanism, 'UNKNOWN'::text) AS mechanism,
    l.state,
    vis.value ->> 'label'::text AS visibility_label,
        CASE
            WHEN COALESCE(( SELECT d.publication_model
               FROM twuanis_remates_private.independent_source_decisions d
              WHERE d.source_id = s.id
              ORDER BY d.revision DESC
             LIMIT 1), 'REVIEWED_SOURCE_CONTENT'::text) = 'FACTUAL_ONLY'::text THEN ''::text
            ELSE COALESCE(( SELECT "left"(f.raw_value, 256) AS "left"
               FROM twuanis_remates_private.observation_fields f
              WHERE f.observation_id = ob.id AND f.field_path = 'title'::text AND f.validation = 'VALID'::text
              ORDER BY f.ordinal
             LIMIT 1), ''::text)
        END AS title,
    s.namespace AS source_name,
        CASE
            WHEN ob.source_url ~~ 'https://%'::text AND twuanis_remates_private.valid_evidence_locator(s.id, ob.source_url) THEN ob.source_url
            ELSE NULL::text
        END AS source_url,
    fv.amount::text AS amount,
    fv.currency,
    fv.kind AS financial_kind,
    fv.original_label AS financial_label,
    fv.round_key AS auction_round,
    pub.recorded_at AS published_at,
    ( SELECT jsonb_agg(jsonb_build_object('id', p.id, 'terms', ( SELECT COALESCE(jsonb_agg(jsonb_build_object('id', t.id::text, 'type', t.term_type, 'parent', t.parent_id::text, 'en', COALESCE(to_jsonb(t.*) ->> 'term_name_en'::text, t.term_name), 'es', COALESCE(to_jsonb(t.*) ->> 'term_name_es'::text, t.term_name)) ORDER BY t.id), '[]'::jsonb) AS "coalesce"
                   FROM twuanis_remates_private.property_terms pt
                     JOIN public.ontology_terms t ON t.id = pt.term_id
                  WHERE pt.classification_id = c.id AND pt.selected AND (t.term_type = ANY (ARRAY['province'::text, 'canton'::text, 'district'::text, 'property_type'::text]))), 'area', ( SELECT property_facts.exact_value::text AS exact_value
                   FROM twuanis_remates_private.property_facts
                  WHERE property_facts.classification_id = c.id AND property_facts.dimension = 'property_area'::text AND property_facts.kind = 'exact'::text), 'construction_area', ( SELECT pf.exact_value::text AS exact_value
                   FROM twuanis_remates_private.property_facts pf
                  WHERE pf.classification_id = c.id AND pf.dimension = 'construction_area'::text AND pf.kind = 'exact'::text AND pf.exact_value > 0::numeric), 'images',
                CASE
                    WHEN s.namespace = 'bp-inventory'::text AND s.origin_host = 'srv.bancopopular.fi.cr'::text AND twuanis_remates_private.independent_source_allowed(s.id) AND COALESCE(( SELECT d.public_image_display
                       FROM twuanis_remates_private.independent_source_decisions d
                      WHERE d.source_id = s.id
                      ORDER BY d.revision DESC
                     LIMIT 1), false) AND (( SELECT count(*) AS count
                       FROM twuanis_remates_private.offering_properties single_property
                      WHERE single_property.offering_id = o.id)) = 1 THEN COALESCE(( SELECT jsonb_agg(ref.source_url ORDER BY ref.ordinal, ref.id) AS jsonb_agg
                       FROM ( SELECT a.id,
                                a.ordinal,
                                a.source_url
                               FROM twuanis_remates_private.media_assets a
                                 JOIN LATERAL ( SELECT ml.state
                                       FROM twuanis_remates_private.media_links ml
                                      WHERE ml.asset_id = a.id
                                      ORDER BY ml.revision DESC
                                     LIMIT 1) link ON true
                                 JOIN twuanis_remates_private.observation_fields field ON field.observation_id = a.observation_id AND field.field_path = a.field_path AND field.ordinal = a.ordinal
                              WHERE a.offering_id = o.id AND a.source_id = s.id AND a.observation_id = ob.id AND a.kind = 'SOURCE_REFERENCE'::text AND link.state = 'STAGED'::text AND a.field_path = 'csv.image_url'::text AND field.validation = 'VALID'::text AND field.raw_value = a.source_url AND a.source_url ~* '^https://srv[.]bancopopular[.]fi[.]cr/(?!.*([?#[:space:]]|[.][.]))[^?#[:space:]]+[.](jpg|jpeg|png|webp)$'::text
                              ORDER BY a.ordinal, a.id
                             LIMIT 32) ref), '[]'::jsonb)
                    ELSE '[]'::jsonb
                END)) AS jsonb_agg
           FROM twuanis_remates_private.offering_properties op
             JOIN twuanis_remates_private.properties p ON p.id = op.property_id
             JOIN LATERAL ( SELECT cc.id,
                    cc.institution_id,
                    cc.property_id,
                    cc.property_revision,
                    cc.source_id,
                    cc.observation_id,
                    cc.binding_id,
                    cc.revision,
                    cc.prior_id,
                    cc.actor_id,
                    cc.receipt_id,
                    cc.reason,
                    cc.snapshot,
                    cc.minimum_ready,
                    cc.recorded_at
                   FROM twuanis_remates_private.classification_versions cc
                  WHERE cc.property_id = p.id
                  ORDER BY cc.revision DESC
                 LIMIT 1) c ON true
          WHERE op.offering_id = o.id) AS properties
   FROM twuanis_remates_private.listings l JOIN canonical_visibility vis ON vis.id=l.id
     JOIN twuanis_remates_private.offerings o ON o.id = l.offering_id
     JOIN twuanis_remates_private.institutions i ON i.id = o.institution_id
     JOIN twuanis_remates_private.sources s ON s.id = o.source_id
     JOIN LATERAL ( SELECT e.id,
            e.institution_id,
            e.source_id,
            e.listing_id,
            e.offering_id,
            e.revision,
            e.prior_id,
            e.state,
            e.operation,
            e.policy_id,
            e.ingestion_id,
            e.financial_event_id,
            e.verification_id,
            e.actor_id,
            e.receipt_id,
            e.reason,
            e.evidence,
            e.transaction_id,
            e.recorded_at
           FROM twuanis_remates_private.publication_events e
          WHERE e.listing_id = l.id
          ORDER BY e.revision DESC
         LIMIT 1) pub ON true
     LEFT JOIN twuanis_remates_private.ingestion_results ir ON ir.id = pub.ingestion_id
     LEFT JOIN twuanis_remates_private.observations ob ON ob.id = ir.observation_id
     LEFT JOIN twuanis_remates_private.offering_events fe ON fe.id = pub.financial_event_id
     LEFT JOIN twuanis_remates_private.financial_values fv ON fv.id = fe.selected_value_id AND (fv.kind = ANY (ARRAY['SELLING_PRICE'::text, 'AUCTION_BASE'::text]))
  WHERE COALESCE(( SELECT delivery_versions.enabled
           FROM twuanis_remates_private.delivery_versions
          ORDER BY delivery_versions.revision DESC
         LIMIT 1), false) AND (vis.value -> 'visible'::text) = 'true'::jsonb), canonical_scope AS MATERIALIZED (SELECT v.id listing_id,p.id property_id,c.id classification_id,s.id source_id,ob.id observation_id,array_remove(ARRAY[
 CASE WHEN p_scope->>'transaction'<>'sale' OR v.mechanism IS DISTINCT FROM 'DIRECT_SALE' OR (CASE WHEN ob.parse_status='PARSED' AND ob.raw_text LIKE '{%' THEN ob.raw_text::jsonb->>'transaction_type' ELSE NULL END) IS DISTINCT FROM 'sale' THEN 'TRANSACTION_IDENTITY_UNRESOLVED' END,
 CASE WHEN EXISTS(SELECT 1 FROM jsonb_each_text((p_scope->'geography')||jsonb_build_object('property_type',p_scope->>'propertyType')) g WHERE g.value IS NOT NULL AND NOT EXISTS(SELECT 1 FROM twuanis_remates_private.property_terms pt JOIN public.ontology_terms t ON t.id=pt.term_id WHERE pt.classification_id=c.id AND pt.selected AND t.term_type=g.key AND t.id::text=g.value)) THEN 'SCOPE_MISMATCH' END
 ],NULL) reasons FROM canonical_public v
 JOIN twuanis_remates_private.offerings off ON off.id=v.offering_id
 JOIN twuanis_remates_private.sources s ON s.id=off.source_id
 JOIN twuanis_remates_private.offering_properties op ON op.offering_id=off.id
 JOIN twuanis_remates_private.properties p ON p.id=op.property_id AND p.identity_status='CONFIRMED'
 JOIN LATERAL(SELECT cc.* FROM twuanis_remates_private.classification_versions cc WHERE cc.property_id=p.id ORDER BY cc.revision DESC LIMIT 1)c ON twuanis_remates_private.classification_minimum_valid(c.id) AND c.source_id=s.id
 JOIN twuanis_remates_private.source_bindings b ON b.id=c.binding_id AND b.source_id=s.id AND b.offering_id=off.id
 JOIN twuanis_remates_private.ingestion_results ir ON ir.id=twuanis_remates_private.current_ingestion(off.id)
 JOIN twuanis_remates_private.observations ob ON ob.id=ir.observation_id AND ob.source_id=s.id
 JOIN LATERAL(SELECT x.* FROM twuanis_remates_private.source_lifecycle_policies x WHERE x.source_id=s.id ORDER BY x.revision DESC LIMIT 1)pol ON pol.source_revision=s.revision
 JOIN LATERAL(SELECT x.* FROM twuanis_remates_private.offering_events x WHERE x.offering_id=off.id ORDER BY x.revision DESC LIMIT 1)fe ON true
 LEFT JOIN twuanis_remates_private.financial_values fv ON fv.id=fe.selected_value_id
 WHERE v.state='PUBLISHED'
 AND (SELECT count(*) FROM twuanis_remates_private.offering_properties one WHERE one.offering_id=off.id)=1
), scope_manifest AS (SELECT jsonb_build_object('schema','bank-scoped-population-v1','scope',p_scope,'members',coalesce(jsonb_agg(jsonb_build_object('listingId',listing_id,'propertyId',property_id,'classificationId',classification_id,'sourceId',source_id,'observationId',observation_id) ORDER BY listing_id,property_id) FILTER(WHERE cardinality(reasons)=0),'[]'),'excluded',coalesce(jsonb_agg(jsonb_build_object('listingId',listing_id,'propertyId',property_id,'classificationId',classification_id,'sourceId',source_id,'observationId',observation_id,'reasons',reasons) ORDER BY listing_id,property_id) FILTER(WHERE cardinality(reasons)>0),'[]')) manifest FROM canonical_scope) SELECT jsonb_build_object('scopeEvidence',(SELECT manifest FROM scope_manifest),'items',coalesce(jsonb_agg(item ORDER BY listing_id,property_id),'[]'),'dataRevision',
 (SELECT md5(jsonb_build_object('public',coalesce(jsonb_agg(v ORDER BY v.id),'[]'),
 'classes',(SELECT coalesce(jsonb_agg(cc.id ORDER BY cc.id),'[]') FROM twuanis_remates_private.classification_versions cc JOIN twuanis_remates_private.offering_properties op ON op.property_id=cc.property_id JOIN canonical_public vp ON vp.offering_id=op.offering_id),
 'financial',(SELECT coalesce(jsonb_agg(fe.id ORDER BY fe.id),'[]') FROM twuanis_remates_private.offering_events fe JOIN canonical_public vp ON vp.offering_id=fe.offering_id),
 'policies',(SELECT coalesce(jsonb_agg(pol.id ORDER BY pol.id),'[]') FROM twuanis_remates_private.source_lifecycle_policies pol JOIN twuanis_remates_private.offerings off ON off.source_id=pol.source_id JOIN canonical_public vp ON vp.offering_id=off.id))::text) FROM canonical_public v)) INTO rows FROM (
 SELECT v.id listing_id,p.id property_id,jsonb_build_object(
 'population','BANK','listingId',v.id,'propertyId',p.id,'offeringId',v.offering_id,'sourceId',s.id,'sourceNamespace',s.namespace,
 'sourceRevision',s.revision::text,'recordKey',b.record_key,'bindingId',b.id,'bindingRevision',b.revision::text,
 'publicationRevision',v.revision,'publicationStatus',v.state,'classificationId',c.id,'classificationRevision',c.revision::text,
 'observationId',ob.id,'observedAt',ob.retrieved_at,'contentHash',ob.content_sha256,'policyId',pol.id,'policyRevision',pol.revision::text,
 'freshSeconds',pol.fresh_seconds::text,'lifecycle',twuanis_remates_private.lifecycle_eligibility(v.offering_id),
 'mechanism',v.mechanism,'transactionEvidence',CASE WHEN ob.raw_text LIKE '{%' AND ob.parse_status='PARSED' THEN jsonb_build_array(jsonb_build_object('value',ob.raw_text::jsonb->>'transaction_type','path','raw.transaction_type','ordinal',0,'validation','RETAINED_RAW')) ELSE '[]'::jsonb END,
 'financial',jsonb_build_object('id',fv.id,'eventId',fe.id,'eventRevision',fe.revision::text,'kind',fv.kind,'status',fv.status,'amount',fv.amount::text,'currency',fv.currency,'observationId',fv.observation_id,'sourceId',fv.source_id,'offeringId',fv.offering_id,'fieldPath',fv.field_path,'ordinal',fv.ordinal,'selectionValid',twuanis_remates_private.financial_selection_valid(fe.id)),
 'terms',(SELECT jsonb_agg(jsonb_build_object('id',t.id::text,'parent_id',t.parent_id::text,'term_type',t.term_type,'level',t.level,'official_code',t.official_code,'slug',t.slug,'term_name',t.term_name,'term_name_en',to_jsonb(t)->>'term_name_en','term_name_es',to_jsonb(t)->>'term_name_es','slug_en',to_jsonb(t)->>'slug_en','slug_es',to_jsonb(t)->>'slug_es')) FROM twuanis_remates_private.property_terms pt JOIN public.ontology_terms t ON t.id=pt.term_id WHERE pt.classification_id=c.id AND pt.selected AND t.term_type IN('province','canton','district','property_type')),
 'measurements',(SELECT coalesce(jsonb_agg(jsonb_build_object('dimension',f.dimension,'kind',f.kind,'value',f.exact_value::text,'observationId',f.evidence_id,'fieldPath',f.field_path,'ordinal',f.ordinal,'unit',ef.unit,'validation',ef.validation,'fieldValue',ef.raw_value,'observedAt',eo.retrieved_at,'sourceId',eo.source_id,'recordKey',eo.record_key,'contentHash',eo.content_sha256,'page',ef.document_page,'selector',ef.selector)), '[]') FROM twuanis_remates_private.property_facts f JOIN twuanis_remates_private.observation_fields ef ON (ef.observation_id,ef.field_path,ef.ordinal)=(f.evidence_id,f.field_path,f.ordinal) JOIN twuanis_remates_private.observations eo ON eo.id=f.evidence_id WHERE f.classification_id=c.id AND f.dimension IN('property_area','construction_area')),
 'registryMeasurements',(SELECT coalesce(jsonb_agg(jsonb_build_object('value',f.raw_value,'observationId',f.observation_id,'fieldPath',f.field_path,'ordinal',f.ordinal,'unit',f.unit,'validation',f.validation,'page',f.document_page,'selector',f.selector)), '[]') FROM twuanis_remates_private.observation_fields f WHERE f.observation_id=c.observation_id AND f.field_path='pdf.normalized_registry_area'),
 'otherFacts',(SELECT coalesce(jsonb_agg(jsonb_build_object('dimension',f.dimension,'kind',f.kind,'exactValue',f.exact_value::text,'categoryTermId',f.category_term_id::text,'rangeLower',f.range_lower::text,'rangeUpper',f.range_upper::text,'lowerInclusive',f.lower_inclusive,'upperInclusive',f.upper_inclusive,'observationId',f.evidence_id,'fieldPath',f.field_path,'ordinal',f.ordinal)), '[]') FROM twuanis_remates_private.property_facts f WHERE f.classification_id=c.id AND f.dimension NOT IN('property_area','construction_area')),
 'semantics',(SELECT coalesce(jsonb_agg(jsonb_build_object('dimension',pt.dimension,'termId',pt.term_id::text,'observationId',pt.evidence_id)), '[]') FROM twuanis_remates_private.property_terms pt WHERE pt.classification_id=c.id AND pt.selected AND pt.dimension IN('property_type','utility','environment','terrain','accessibility','legal_status')),
 'areaSelection',(SELECT CASE WHEN eo.raw_text LIKE '{%' AND eo.raw_text::jsonb->>'format'='bp-reviewed-factual-areas-v1' THEN eo.raw_text::jsonb->'selection' ELSE NULL END FROM twuanis_remates_private.observations eo WHERE eo.id=c.observation_id)
 ) item
 FROM canonical_public v
 JOIN twuanis_remates_private.offerings off ON off.id=v.offering_id
 JOIN twuanis_remates_private.sources s ON s.id=off.source_id
 JOIN twuanis_remates_private.offering_properties op ON op.offering_id=off.id
 JOIN twuanis_remates_private.properties p ON p.id=op.property_id AND p.identity_status='CONFIRMED'
 JOIN LATERAL(SELECT cc.* FROM twuanis_remates_private.classification_versions cc WHERE cc.property_id=p.id ORDER BY cc.revision DESC LIMIT 1)c ON twuanis_remates_private.classification_minimum_valid(c.id) AND c.source_id=s.id
 JOIN twuanis_remates_private.source_bindings b ON b.id=c.binding_id AND b.source_id=s.id AND b.offering_id=off.id
 JOIN twuanis_remates_private.ingestion_results ir ON ir.id=twuanis_remates_private.current_ingestion(off.id)
 JOIN twuanis_remates_private.observations ob ON ob.id=ir.observation_id AND ob.source_id=s.id
 JOIN LATERAL(SELECT x.* FROM twuanis_remates_private.source_lifecycle_policies x WHERE x.source_id=s.id ORDER BY x.revision DESC LIMIT 1)pol ON pol.source_revision=s.revision
 JOIN LATERAL(SELECT x.* FROM twuanis_remates_private.offering_events x WHERE x.offering_id=off.id ORDER BY x.revision DESC LIMIT 1)fe ON true
 LEFT JOIN twuanis_remates_private.financial_values fv ON fv.id=fe.selected_value_id
 WHERE v.state='PUBLISHED' AND (p_after IS NULL OR v.id>p_after)
 AND (SELECT count(*) FROM twuanis_remates_private.offering_properties one WHERE one.offering_id=off.id)=1
 AND EXISTS(SELECT 1 FROM canonical_scope cs WHERE cs.listing_id=v.id AND cs.property_id=p.id AND cardinality(cs.reasons)=0)
 ORDER BY v.id,p.id LIMIT 101
 ) bounded;

 RETURN rows;
END$scope$;
REVOKE ALL ON FUNCTION twuanis_canonical_private.orchestrator_bank_scope_page(jsonb,uuid) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.read_orchestrator_bank_evidence(p_claims jsonb, p_orchestrator text, p_capability text, p_population text, p_scope jsonb, p_after uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE a uuid;grant_value jsonb;authority jsonb;rows jsonb;terms jsonb;
BEGIN
 a:=twuanis_canonical_private.execution_credit_bridge(p_claims);
 grant_value:=twuanis_canonical_private.execution_credit_authority(p_orchestrator,p_population);
 IF p_population NOT IN('BANK','COMBINED') OR NOT(grant_value->'capabilities'?p_capability) THEN RAISE EXCEPTION 'Registered orchestrator population/capability required' USING ERRCODE='42501';END IF;
 terms:=CASE WHEN grant_value->>'kind'='OWNER_UNMETERED' THEN '[]'::jsonb ELSE twuanis_canonical_private.bank_analytical_grant_terms(a,p_capability) END;
 IF terms IS NULL THEN RAISE EXCEPTION 'Same-term Bank authority required' USING ERRCODE='42501';END IF;
 authority:=jsonb_build_object('accountId',a,'capability',p_capability,'population',p_population,'terms',terms);
 rows:=twuanis_canonical_private.orchestrator_bank_scope_page(p_scope,p_after);
 RETURN rows||jsonb_build_object('authority',authority);
END$function$;
REVOKE ALL ON FUNCTION public.read_orchestrator_bank_evidence(jsonb,text,text,text,jsonb,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.read_orchestrator_bank_evidence(jsonb,text,text,text,jsonb,uuid) TO service_role;

CREATE FUNCTION twuanis_canonical_private.evidence_v2_bank_scope(body jsonb) RETURNS void LANGUAGE plpgsql VOLATILE SET search_path=pg_catalog AS $verify$
DECLARE scope jsonb;page jsonb;manifest jsonb;revision text;after_id uuid;raws jsonb:='{}';v jsonb;r record;root text;raw jsonb;profiles text[];expected_ids text[];actual_ids text[];phase text;profile text;BEGIN
 IF body->>'population'='PRIVATE' OR NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.orchestrator_methodology_releases mr WHERE mr.id=body->>'methodologyRelease' AND mr.manifest->>'acquisitionContract'='canonical-scoped-acquisition-v1') THEN RETURN;END IF;
 scope:=jsonb_build_object('transaction',body#>>'{request,scope,transaction}','geography',body#>'{request,scope,geography}','propertyType',body#>>'{request,scope,propertyType}');
 LOOP
 page:=twuanis_canonical_private.orchestrator_bank_scope_page(scope,after_id);
 IF manifest IS NULL THEN manifest:=page->'scopeEvidence';revision:=page->>'dataRevision';ELSIF manifest IS DISTINCT FROM page->'scopeEvidence' OR revision IS DISTINCT FROM page->>'dataRevision' THEN RAISE EXCEPTION 'BANK_SCOPE_REVISION_CHANGED';END IF;
 FOR raw IN SELECT value FROM jsonb_array_elements(page->'items') WITH ORDINALITY e(value,n) WHERE n<=100 LOOP
 IF raws?(raw->>'listingId') THEN RAISE EXCEPTION 'BANK_SCOPE_DUPLICATE';END IF;
 raws:=raws||jsonb_build_object(raw->>'listingId',raw);after_id:=(raw->>'listingId')::uuid;
 END LOOP;
 EXIT WHEN jsonb_array_length(page->'items')<=100;
 END LOOP;
 SELECT coalesce(array_agg(value ORDER BY value),ARRAY[]::text[]) INTO expected_ids FROM jsonb_object_keys(raws)value;
 DROP TABLE IF EXISTS pg_temp.twuanis_bank_scope_records;
 CREATE TEMP TABLE pg_temp.twuanis_bank_scope_records(kind text,payload jsonb)ON COMMIT DROP;
 REVOKE ALL ON pg_temp.twuanis_bank_scope_records FROM PUBLIC,anon,authenticated,service_role;
 INSERT INTO pg_temp.twuanis_bank_scope_records SELECT DISTINCT value->>'kind',twuanis_canonical_private.evidence_v2_decode_indexed(value->>'contentId') FROM jsonb_array_elements(body#>'{immutableEvidence,records}')value WHERE value->>'kind' IN('bank-scope-evidence','bank-acquisition-decision') OR value->>'kind' LIKE '%/bank-scope-evidence' OR value->>'kind' LIKE '%/bank-acquisition-decision';
 FOR v IN SELECT payload FROM pg_temp.twuanis_bank_scope_records WHERE kind LIKE '%bank-scope-evidence' LOOP
 IF v->'manifest' IS DISTINCT FROM manifest OR v->>'dataRevision' IS DISTINCT FROM revision OR v#>>'{authority,accountId}' IS DISTINCT FROM body->>'accountId' OR v#>>'{authority,population}' IS DISTINCT FROM body->>'population' OR jsonb_build_object('transaction',v#>>'{request,transaction}','geography',v#>'{request,geography}','propertyType',v#>>'{request,propertyType}') IS DISTINCT FROM scope THEN RAISE EXCEPTION 'BANK_SCOPE_ATTESTATION_MISMATCH';END IF;
 END LOOP;
 FOR v IN SELECT payload FROM pg_temp.twuanis_bank_scope_records WHERE kind LIKE '%bank-acquisition-decision' LOOP
 IF v->'raw' IS DISTINCT FROM raws->(v#>>'{raw,listingId}') THEN RAISE EXCEPTION 'BANK_SCOPE_RAW_MISMATCH';END IF;
 END LOOP;
 SELECT array_agg(DISTINCT value#>>'{result,eligibilityProfile}') INTO profiles FROM jsonb_array_elements(body->'engines')value;
 FOREACH phase IN ARRAY ARRAY['execution','freshness'] LOOP
 FOREACH profile IN ARRAY profiles LOOP
 IF NOT EXISTS(SELECT 1 FROM pg_temp.twuanis_bank_scope_records WHERE kind LIKE '%bank-scope-evidence' AND payload->>'phase'=phase AND payload#>>'{request,profile}'=profile) THEN RAISE EXCEPTION 'BANK_SCOPE_PHASE_REQUIRED';END IF;
 SELECT coalesce(array_agg(DISTINCT payload#>>'{raw,listingId}' ORDER BY payload#>>'{raw,listingId}'),ARRAY[]::text[]) INTO actual_ids FROM pg_temp.twuanis_bank_scope_records WHERE kind LIKE '%bank-acquisition-decision' AND payload->>'phase'=phase AND payload#>>'{request,profile}'=profile;
 IF actual_ids IS DISTINCT FROM expected_ids THEN RAISE EXCEPTION 'BANK_SCOPE_COMPLETE_MEMBERSHIP_REQUIRED';END IF;
 END LOOP;END LOOP;
END$verify$;
REVOKE ALL ON FUNCTION twuanis_canonical_private.evidence_v2_bank_scope(jsonb) FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION twuanis_canonical_private.evidence_v2_validate(body jsonb, execution uuid, report uuid, account uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE ev jsonb;nodes jsonb;n jsonb;rec jsonb;entry record;kind text;item jsonb;refs text[];ref text;engine jsonb;decoded jsonb;ids text[];cnt integer;request_ref text;rows_ref text;checked_rows text[]:=ARRAY[]::text[];BEGIN
 ev:=body->'immutableEvidence';nodes:=ev->'nodes';
 IF body->>'format' IS DISTINCT FROM 'twuanis-orchestrator-evidence-v2' OR body->>'executionId' IS DISTINCT FROM execution::text OR body->>'reportId' IS DISTINCT FROM report::text OR body->>'accountId' IS DISTINCT FROM account::text OR ev->>'schema' IS DISTINCT FROM 'twuanis-analytical-evidence-v2' OR ev->>'encoding' IS DISTINCT FROM 'ordered-content-graph-binary64-v1' OR jsonb_typeof(nodes) IS DISTINCT FROM 'object' OR jsonb_typeof(ev->'records') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Complete V2 identity and schema required';END IF;
 -- Experimental ceiling: not a production-qualified budget. Scope remains fail closed.
 IF octet_length(body::text)>33554432 OR jsonb_array_length(ev->'records')>40000 OR (SELECT count(*) FROM jsonb_object_keys(nodes))>100000 THEN RAISE EXCEPTION 'V2 qualification resource ceiling exceeded';END IF;
 -- Rebuild a private, transaction-local lookup; never trust a caller-created cache.
 DROP TABLE IF EXISTS pg_temp.twuanis_evidence_validation_nodes;
 CREATE TEMP TABLE pg_temp.twuanis_evidence_validation_nodes(node_id text PRIMARY KEY,node jsonb NOT NULL,decoded jsonb,decoded_ready boolean NOT NULL DEFAULT false,decoded_height integer)ON COMMIT DROP;
 REVOKE ALL ON pg_temp.twuanis_evidence_validation_nodes FROM PUBLIC,anon,authenticated,service_role;
 INSERT INTO pg_temp.twuanis_evidence_validation_nodes(node_id,node) SELECT key,value FROM jsonb_each(nodes);
 ANALYZE pg_temp.twuanis_evidence_validation_nodes;
 DROP TABLE IF EXISTS pg_temp.twuanis_evidence_validation_records;
 CREATE TEMP TABLE pg_temp.twuanis_evidence_validation_records ON COMMIT DROP AS SELECT value->>'kind' kind,value->>'contentId' content_id FROM jsonb_array_elements(ev->'records');
 REVOKE ALL ON pg_temp.twuanis_evidence_validation_records FROM PUBLIC,anon,authenticated,service_role;
 CREATE INDEX ON pg_temp.twuanis_evidence_validation_records(kind);
 ANALYZE pg_temp.twuanis_evidence_validation_records;
 PERFORM twuanis_canonical_private.evidence_v2_call_relationships(body);
 FOR entry IN SELECT * FROM jsonb_each(nodes) LOOP
  n:=entry.value;kind:=n->>0;refs:=ARRAY[]::text[];
  IF entry.key!~'^[0-9a-f]{64}$' OR encode(sha256(convert_to(twuanis_canonical_private.evidence_v2_json(n),'UTF8')),'hex')<>entry.key OR jsonb_typeof(n)<>'array' THEN RAISE EXCEPTION 'Evidence content hash mismatch';END IF;
  IF kind='scalar' THEN IF jsonb_array_length(n)<>2 OR jsonb_typeof(n->1) NOT IN('string','null','boolean') THEN RAISE EXCEPTION 'Invalid scalar evidence';END IF;
  ELSIF kind='binary64' THEN IF jsonb_array_length(n)<>3 OR n->>1!~'^[0-9a-f]{16}$' OR n->>2!~'^-?([0-9]+(\.[0-9]+)?)(e[+-]?[0-9]+)?$' OR encode(float8send((n->>2)::double precision),'hex')<>n->>1 THEN RAISE EXCEPTION 'Invalid numerical evidence';END IF;
  ELSIF kind='bigint' THEN IF jsonb_array_length(n)<>2 OR n->>1!~'^-?[0-9]+$' THEN RAISE EXCEPTION 'Invalid integer evidence';END IF;
  ELSIF kind='undefined' THEN IF jsonb_array_length(n)<>1 THEN RAISE EXCEPTION 'Invalid undefined value';END IF;
  ELSIF kind IN('array','set') THEN IF jsonb_array_length(n)<>2 OR jsonb_typeof(n->1)<>'array' THEN RAISE EXCEPTION 'Invalid sequence';END IF;SELECT coalesce(array_agg(value),ARRAY[]::text[]) INTO refs FROM jsonb_array_elements_text(n->1);
  ELSIF kind IN('object','map') THEN
   IF jsonb_array_length(n)<>(CASE WHEN kind='map' THEN 3 ELSE 2 END) OR jsonb_typeof(n->1)<>'array' THEN RAISE EXCEPTION 'Invalid keyed evidence';END IF;
   FOR item IN SELECT value FROM jsonb_array_elements(n->1) LOOP IF jsonb_typeof(item)<>'array' OR jsonb_array_length(item)<>2 OR jsonb_typeof(item->0)<>'string' OR jsonb_typeof(item->1)<>'string' THEN RAISE EXCEPTION 'Invalid keyed pair';END IF;refs:=array_append(refs,item->>1);IF kind='map' THEN refs:=array_append(refs,item->>0);END IF;END LOOP;
   IF kind='object' AND (SELECT count(*)<>count(DISTINCT value->>0) FROM jsonb_array_elements(n->1)) THEN RAISE EXCEPTION 'Duplicate evidence key';END IF;
   IF kind='map' THEN IF jsonb_typeof(n->2)<>'array' THEN RAISE EXCEPTION 'Invalid map properties';END IF;FOR item IN SELECT value FROM jsonb_array_elements(n->2) LOOP refs:=array_append(refs,item->>1);END LOOP;END IF;
  ELSIF kind='archive-callback' THEN IF jsonb_array_length(n)<>2 OR jsonb_typeof(n->1)<>'string' THEN RAISE EXCEPTION 'Invalid callback identity';END IF;
  ELSE RAISE EXCEPTION 'Unsupported evidence tag';END IF;
  FOREACH ref IN ARRAY refs LOOP IF ref IS NULL OR ref!~'^[0-9a-f]{64}$' OR NOT nodes?ref THEN RAISE EXCEPTION 'Incomplete evidence reference';END IF;END LOOP;
 END LOOP;
 FOR rec IN SELECT value FROM jsonb_array_elements(ev->'records') LOOP IF jsonb_typeof(rec)<>'object' OR jsonb_typeof(rec->'kind') IS DISTINCT FROM 'string' OR NOT nodes?(rec->>'contentId') THEN RAISE EXCEPTION 'Incomplete evidence root';END IF;END LOOP;
 UPDATE pg_temp.twuanis_evidence_validation_nodes SET decoded=CASE node->>0 WHEN 'binary64' THEN(node->>2)::jsonb WHEN 'undefined' THEN 'null'::jsonb ELSE node->1 END,decoded_ready=true,decoded_height=0 WHERE node->>0 IN('scalar','binary64','undefined','bigint');
 FOR engine IN SELECT value FROM jsonb_array_elements(body->'engines') LOOP
  SELECT count(*),min(content_id) INTO cnt,ref FROM pg_temp.twuanis_evidence_validation_records r WHERE r.kind=engine->>'id'||'/engine-output';IF cnt<>1 THEN RAISE EXCEPTION 'Unique engine evidence required';END IF;
  decoded:=twuanis_canonical_private.evidence_v2_decode_indexed(ref);IF decoded IS DISTINCT FROM engine->'result' THEN RAISE EXCEPTION 'Engine output binding mismatch';END IF;
  SELECT count(*),min(content_id) INTO cnt,ref FROM pg_temp.twuanis_evidence_validation_records r WHERE r.kind=engine->>'id'||'/resolved-input';IF cnt<>1 THEN RAISE EXCEPTION 'Complete engine inputs required';END IF;
  SELECT pair->>1 INTO request_ref FROM pg_temp.twuanis_evidence_validation_nodes n CROSS JOIN LATERAL jsonb_array_elements(n.node->1)pair WHERE n.node_id=ref AND pair->>0='request';
  decoded:=twuanis_canonical_private.evidence_v2_decode_indexed(request_ref);
  IF decoded->>'engine' IS DISTINCT FROM engine->>'id' OR decoded#>>'{scope,population}' IS DISTINCT FROM body->>'population' OR decoded->'scope' IS DISTINCT FROM ((body#>'{request,scope}')||jsonb_build_object('population',body->>'population')) OR decoded->'filters' IS DISTINCT FROM body#>'{request,filters}' THEN RAISE EXCEPTION 'Engine input request binding mismatch';END IF;
  SELECT pair->>1 INTO rows_ref FROM pg_temp.twuanis_evidence_validation_nodes n CROSS JOIN LATERAL jsonb_array_elements(n.node->1)pair WHERE n.node_id=ref AND pair->>0='rows';
  IF NOT(rows_ref=ANY(checked_rows)) THEN
  SELECT array_agg(identity_node.node->>1) INTO ids FROM jsonb_array_elements_text(nodes->rows_ref->1)v LEFT JOIN pg_temp.twuanis_evidence_validation_nodes row_node ON row_node.node_id=v LEFT JOIN LATERAL(SELECT pair->>1 id FROM jsonb_array_elements(row_node.node->1)pair WHERE pair->>0='id')identity_ref ON true LEFT JOIN pg_temp.twuanis_evidence_validation_nodes identity_node ON identity_node.node_id=identity_ref.id;
  IF cardinality(ids)<>(SELECT count(DISTINCT v)FROM unnest(ids)v) OR EXISTS(SELECT 1 FROM unnest(ids)v WHERE v!~'^(PRIVATE|BANK):[0-9a-f-]{36}$' OR body->>'population'<>'COMBINED' AND split_part(v,':',1)<>body->>'population') THEN RAISE EXCEPTION 'Population identity or qualification limit mismatch';END IF;
  checked_rows:=array_append(checked_rows,rows_ref);END IF;
 END LOOP;
 IF body#>>'{evidence,methodology,sourceDigest}' IS NULL THEN RAISE EXCEPTION 'Methodology reference required';END IF;
 PERFORM twuanis_canonical_private.evidence_v2_bank_scope(body);
END$function$
;

CREATE OR REPLACE FUNCTION twuanis_canonical_private.evidence_v2_private_sources(body jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE nodes jsonb:=body#>'{immutableEvidence,nodes}';root text;v jsonb;source jsonb;current_value jsonb;BEGIN
 -- This function follows immutable-witness equality in report commitment.
 -- Rebuild the private lookup; never reuse a caller-created cache.
 DROP TABLE IF EXISTS pg_temp.twuanis_evidence_validation_nodes;
 CREATE TEMP TABLE pg_temp.twuanis_evidence_validation_nodes(node_id text PRIMARY KEY,node jsonb NOT NULL,decoded jsonb,decoded_ready boolean NOT NULL DEFAULT false,decoded_height integer)ON COMMIT DROP;
 REVOKE ALL ON pg_temp.twuanis_evidence_validation_nodes FROM PUBLIC,anon,authenticated,service_role;
 INSERT INTO pg_temp.twuanis_evidence_validation_nodes(node_id,node) SELECT key,value FROM jsonb_each(nodes);
 ANALYZE pg_temp.twuanis_evidence_validation_nodes;
 FOR root IN SELECT DISTINCT value->>'contentId' FROM jsonb_array_elements(body#>'{immutableEvidence,records}') WHERE value->>'kind'='private-scalar-source' OR value->>'kind' LIKE '%/private-scalar-source' LOOP
  v:=twuanis_canonical_private.evidence_v2_decode_indexed(root);source:=v->'source';
  SELECT jsonb_build_object('id',l.id,'canonical_domain_version',l.canonical_domain_version,'listing_status',l.listing_status,'transaction_type',l.transaction_type,'currency',l.currency,'created_at',l.created_at,'evidence_current_price',l.current_price::text,'evidence_monthly_price',l.monthly_price::text,'evidence_property_area',l.property_area::text,'evidence_construction_area',l.construction_area::text) INTO current_value FROM public.listings l WHERE l.id=(source->>'id')::uuid;
  IF current_value IS NULL OR source->>'evidence_current_price' IS DISTINCT FROM current_value->>'evidence_current_price' OR source->>'evidence_monthly_price' IS DISTINCT FROM current_value->>'evidence_monthly_price' OR source->>'evidence_property_area' IS DISTINCT FROM current_value->>'evidence_property_area' OR source->>'evidence_construction_area' IS DISTINCT FROM current_value->>'evidence_construction_area' OR source->>'currency' IS DISTINCT FROM current_value->>'currency' OR source->>'listing_status' IS DISTINCT FROM current_value->>'listing_status' OR source->>'transaction_type' IS DISTINCT FROM current_value->>'transaction_type' THEN RAISE EXCEPTION 'Original Private evidence changed or tampered';END IF;
 END LOOP;
 PERFORM twuanis_canonical_private.evidence_v2_bank_scope(body);
END$function$
;


-- 110_orchestrator_classification_plan_cache.sql SHA256 adbcf0c6af6e2c34ecb9bc4a589cb3904ccc82ca07b1f26eb8f9e17a1cf3e7e7

-- ORCH-FINAL-01: cache the unchanged classification query plan. No predicate or privilege changes.
DO $$BEGIN IF encode(sha256(convert_to(pg_get_functiondef('twuanis_remates_private.classification_minimum_valid(uuid)'::regprocedure),'UTF8')),'hex')<>'7b19ca996fbdb2088d930468c1292ea04962fb614545d5ebf4967099654f0f44' THEN RAISE EXCEPTION 'Unreviewed classification predecessor';END IF;END$$;
CREATE OR REPLACE FUNCTION twuanis_remates_private.classification_minimum_valid(cid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'pg_catalog'
AS $function$BEGIN RETURN (SELECT EXISTS(SELECT 1 FROM twuanis_remates_private.classification_versions v
JOIN twuanis_remates_private.properties prop ON prop.id=v.property_id
JOIN twuanis_remates_private.source_bindings b ON b.id=v.binding_id
JOIN twuanis_remates_private.sources s ON s.id=v.source_id
JOIN twuanis_remates_private.offerings o ON o.id=b.offering_id
WHERE (s.namespace<>'bp-inventory' OR EXISTS(SELECT 1 FROM twuanis_remates_private.property_facts area WHERE area.classification_id=v.id AND area.dimension IN('property_area','construction_area') AND area.kind='exact' AND area.exact_value>0)) AND v.id=cid AND v.minimum_ready AND prop.identity_status='CONFIRMED' AND prop.revision=v.property_revision AND s.institution_id=v.institution_id AND b.source_id=v.source_id AND o.institution_id=v.institution_id
AND NOT EXISTS(SELECT 1 FROM twuanis_remates_private.classification_versions n WHERE n.institution_id=v.institution_id AND n.property_id=v.property_id AND n.revision>v.revision)
AND NOT EXISTS(SELECT 1 FROM twuanis_remates_private.source_bindings n WHERE n.source_id=b.source_id AND n.record_key=b.record_key AND n.revision>b.revision)
AND EXISTS(SELECT 1 FROM twuanis_remates_private.property_terms pp JOIN public.ontology_terms p ON p.id=pp.term_id
JOIN twuanis_remates_private.property_terms cc ON cc.classification_id=pp.classification_id AND cc.dimension='geography' AND cc.selected JOIN public.ontology_terms c ON c.id=cc.term_id
WHERE pp.classification_id=v.id AND pp.dimension='geography' AND pp.selected AND p.term_type='province' AND p.level=1 AND p.parent_id=9 AND p.official_code ~ '^[0-9]$' AND p.term_name IS NOT NULL
AND c.term_type='canton' AND c.level=2 AND c.parent_id=p.id AND c.official_code ~ '^[0-9]{3}$' AND left(c.official_code,1)=p.official_code AND c.term_name IS NOT NULL
AND NOT EXISTS(SELECT 1 FROM twuanis_remates_private.property_terms dd JOIN public.ontology_terms d ON d.id=dd.term_id WHERE dd.classification_id=v.id AND dd.dimension='geography' AND dd.selected AND d.id NOT IN(p.id,c.id) AND(d.term_type IS DISTINCT FROM 'district' OR d.level IS DISTINCT FROM 3 OR d.parent_id IS DISTINCT FROM c.id OR d.official_code IS NULL OR d.official_code !~ '^[0-9]{5}$' OR left(d.official_code,3) IS DISTINCT FROM c.official_code OR d.term_name IS NULL)))
AND EXISTS(SELECT 1 FROM public.ontology_terms WHERE id=9 AND term_type='country' AND level=0 AND parent_id=1 AND EXISTS(SELECT 1 FROM public.ontology_terms root WHERE root.id=1 AND root.term_type='root' AND root.level=0 AND root.parent_id IS NULL))
AND EXISTS(SELECT 1 FROM twuanis_remates_private.property_terms pt JOIN public.ontology_terms t ON t.id=pt.term_id WHERE pt.classification_id=v.id AND pt.dimension='property_type' AND pt.selected AND t.term_type='property_type' AND t.level=1 AND t.term_name IS NOT NULL))); END$function$
;

-- 111_orchestrator_indexed_graph_traversal.sql SHA256 bbb9f215f4c6b47c0576ebb9af1482b4b4cda85b541f3cf88502d552fa269e9a

-- ORCH-FINAL-01: use the existing transaction-local indexed evidence graph for traversal.
DO $$BEGIN IF encode(sha256(convert_to(pg_get_functiondef('twuanis_canonical_private.evidence_v2_validate(jsonb,uuid,uuid,uuid)'::regprocedure),'UTF8')),'hex')<>'f39ae0349f66aae17fa365e0aa6299f27746a5c7d1a67d097520976159198da7' THEN RAISE EXCEPTION 'Unreviewed validator predecessor';END IF;END$$;
CREATE OR REPLACE FUNCTION twuanis_canonical_private.evidence_v2_validate(body jsonb, execution uuid, report uuid, account uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE ev jsonb;nodes jsonb;n jsonb;rec jsonb;entry record;kind text;item jsonb;refs text[];ref text;engine jsonb;decoded jsonb;ids text[];cnt integer;request_ref text;rows_ref text;checked_rows text[]:=ARRAY[]::text[];BEGIN
 ev:=body->'immutableEvidence';nodes:=ev->'nodes';
 IF body->>'format' IS DISTINCT FROM 'twuanis-orchestrator-evidence-v2' OR body->>'executionId' IS DISTINCT FROM execution::text OR body->>'reportId' IS DISTINCT FROM report::text OR body->>'accountId' IS DISTINCT FROM account::text OR ev->>'schema' IS DISTINCT FROM 'twuanis-analytical-evidence-v2' OR ev->>'encoding' IS DISTINCT FROM 'ordered-content-graph-binary64-v1' OR jsonb_typeof(nodes) IS DISTINCT FROM 'object' OR jsonb_typeof(ev->'records') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Complete V2 identity and schema required';END IF;
 -- Experimental ceiling: not a production-qualified budget. Scope remains fail closed.
 IF octet_length(body::text)>33554432 OR jsonb_array_length(ev->'records')>40000 OR (SELECT count(*) FROM jsonb_object_keys(nodes))>100000 THEN RAISE EXCEPTION 'V2 qualification resource ceiling exceeded';END IF;
 -- Rebuild a private, transaction-local lookup; never trust a caller-created cache.
 DROP TABLE IF EXISTS pg_temp.twuanis_evidence_validation_nodes;
 CREATE TEMP TABLE pg_temp.twuanis_evidence_validation_nodes(node_id text PRIMARY KEY,node jsonb NOT NULL,decoded jsonb,decoded_ready boolean NOT NULL DEFAULT false,decoded_height integer)ON COMMIT DROP;
 REVOKE ALL ON pg_temp.twuanis_evidence_validation_nodes FROM PUBLIC,anon,authenticated,service_role;
 INSERT INTO pg_temp.twuanis_evidence_validation_nodes(node_id,node) SELECT key,value FROM jsonb_each(nodes);
 ANALYZE pg_temp.twuanis_evidence_validation_nodes;
 DROP TABLE IF EXISTS pg_temp.twuanis_evidence_validation_records;
 CREATE TEMP TABLE pg_temp.twuanis_evidence_validation_records ON COMMIT DROP AS SELECT value->>'kind' kind,value->>'contentId' content_id FROM jsonb_array_elements(ev->'records');
 REVOKE ALL ON pg_temp.twuanis_evidence_validation_records FROM PUBLIC,anon,authenticated,service_role;
 CREATE INDEX ON pg_temp.twuanis_evidence_validation_records(kind);
 ANALYZE pg_temp.twuanis_evidence_validation_records;
 PERFORM twuanis_canonical_private.evidence_v2_call_relationships(body);
 -- Release duplicate graph variables before traversal; authoritative nodes remain indexed.
 nodes:=NULL;ev:=NULL;
 FOR entry IN SELECT node_id AS key,node AS value FROM pg_temp.twuanis_evidence_validation_nodes LOOP
  n:=entry.value;kind:=n->>0;refs:=ARRAY[]::text[];
  IF entry.key!~'^[0-9a-f]{64}$' OR encode(sha256(convert_to(twuanis_canonical_private.evidence_v2_json(n),'UTF8')),'hex')<>entry.key OR jsonb_typeof(n)<>'array' THEN RAISE EXCEPTION 'Evidence content hash mismatch';END IF;
  IF kind='scalar' THEN IF jsonb_array_length(n)<>2 OR jsonb_typeof(n->1) NOT IN('string','null','boolean') THEN RAISE EXCEPTION 'Invalid scalar evidence';END IF;
  ELSIF kind='binary64' THEN IF jsonb_array_length(n)<>3 OR n->>1!~'^[0-9a-f]{16}$' OR n->>2!~'^-?([0-9]+(\.[0-9]+)?)(e[+-]?[0-9]+)?$' OR encode(float8send((n->>2)::double precision),'hex')<>n->>1 THEN RAISE EXCEPTION 'Invalid numerical evidence';END IF;
  ELSIF kind='bigint' THEN IF jsonb_array_length(n)<>2 OR n->>1!~'^-?[0-9]+$' THEN RAISE EXCEPTION 'Invalid integer evidence';END IF;
  ELSIF kind='undefined' THEN IF jsonb_array_length(n)<>1 THEN RAISE EXCEPTION 'Invalid undefined value';END IF;
  ELSIF kind IN('array','set') THEN IF jsonb_array_length(n)<>2 OR jsonb_typeof(n->1)<>'array' THEN RAISE EXCEPTION 'Invalid sequence';END IF;SELECT coalesce(array_agg(value),ARRAY[]::text[]) INTO refs FROM jsonb_array_elements_text(n->1);
  ELSIF kind IN('object','map') THEN
   IF jsonb_array_length(n)<>(CASE WHEN kind='map' THEN 3 ELSE 2 END) OR jsonb_typeof(n->1)<>'array' THEN RAISE EXCEPTION 'Invalid keyed evidence';END IF;
   FOR item IN SELECT value FROM jsonb_array_elements(n->1) LOOP IF jsonb_typeof(item)<>'array' OR jsonb_array_length(item)<>2 OR jsonb_typeof(item->0)<>'string' OR jsonb_typeof(item->1)<>'string' THEN RAISE EXCEPTION 'Invalid keyed pair';END IF;refs:=array_append(refs,item->>1);IF kind='map' THEN refs:=array_append(refs,item->>0);END IF;END LOOP;
   IF kind='object' AND (SELECT count(*)<>count(DISTINCT value->>0) FROM jsonb_array_elements(n->1)) THEN RAISE EXCEPTION 'Duplicate evidence key';END IF;
   IF kind='map' THEN IF jsonb_typeof(n->2)<>'array' THEN RAISE EXCEPTION 'Invalid map properties';END IF;FOR item IN SELECT value FROM jsonb_array_elements(n->2) LOOP refs:=array_append(refs,item->>1);END LOOP;END IF;
  ELSIF kind='archive-callback' THEN IF jsonb_array_length(n)<>2 OR jsonb_typeof(n->1)<>'string' THEN RAISE EXCEPTION 'Invalid callback identity';END IF;
  ELSE RAISE EXCEPTION 'Unsupported evidence tag';END IF;
  FOREACH ref IN ARRAY refs LOOP IF ref IS NULL OR ref!~'^[0-9a-f]{64}$' OR NOT EXISTS(SELECT 1 FROM pg_temp.twuanis_evidence_validation_nodes lookup WHERE lookup.node_id=ref) THEN RAISE EXCEPTION 'Incomplete evidence reference';END IF;END LOOP;
 END LOOP;
 FOR rec IN SELECT value FROM jsonb_array_elements(body#>'{immutableEvidence,records}') LOOP IF jsonb_typeof(rec)<>'object' OR jsonb_typeof(rec->'kind') IS DISTINCT FROM 'string' OR NOT EXISTS(SELECT 1 FROM pg_temp.twuanis_evidence_validation_nodes lookup WHERE lookup.node_id=rec->>'contentId') THEN RAISE EXCEPTION 'Incomplete evidence root';END IF;END LOOP;
 UPDATE pg_temp.twuanis_evidence_validation_nodes SET decoded=CASE node->>0 WHEN 'binary64' THEN(node->>2)::jsonb WHEN 'undefined' THEN 'null'::jsonb ELSE node->1 END,decoded_ready=true,decoded_height=0 WHERE node->>0 IN('scalar','binary64','undefined','bigint');
 FOR engine IN SELECT value FROM jsonb_array_elements(body->'engines') LOOP
  SELECT count(*),min(content_id) INTO cnt,ref FROM pg_temp.twuanis_evidence_validation_records r WHERE r.kind=engine->>'id'||'/engine-output';IF cnt<>1 THEN RAISE EXCEPTION 'Unique engine evidence required';END IF;
  decoded:=twuanis_canonical_private.evidence_v2_decode_indexed(ref);IF decoded IS DISTINCT FROM engine->'result' THEN RAISE EXCEPTION 'Engine output binding mismatch';END IF;
  SELECT count(*),min(content_id) INTO cnt,ref FROM pg_temp.twuanis_evidence_validation_records r WHERE r.kind=engine->>'id'||'/resolved-input';IF cnt<>1 THEN RAISE EXCEPTION 'Complete engine inputs required';END IF;
  SELECT pair->>1 INTO request_ref FROM pg_temp.twuanis_evidence_validation_nodes n CROSS JOIN LATERAL jsonb_array_elements(n.node->1)pair WHERE n.node_id=ref AND pair->>0='request';
  decoded:=twuanis_canonical_private.evidence_v2_decode_indexed(request_ref);
  IF decoded->>'engine' IS DISTINCT FROM engine->>'id' OR decoded#>>'{scope,population}' IS DISTINCT FROM body->>'population' OR decoded->'scope' IS DISTINCT FROM ((body#>'{request,scope}')||jsonb_build_object('population',body->>'population')) OR decoded->'filters' IS DISTINCT FROM body#>'{request,filters}' THEN RAISE EXCEPTION 'Engine input request binding mismatch';END IF;
  SELECT pair->>1 INTO rows_ref FROM pg_temp.twuanis_evidence_validation_nodes n CROSS JOIN LATERAL jsonb_array_elements(n.node->1)pair WHERE n.node_id=ref AND pair->>0='rows';
  IF NOT(rows_ref=ANY(checked_rows)) THEN
  SELECT array_agg(identity_node.node->>1) INTO ids FROM jsonb_array_elements_text((SELECT node->1 FROM pg_temp.twuanis_evidence_validation_nodes WHERE node_id=rows_ref))v LEFT JOIN pg_temp.twuanis_evidence_validation_nodes row_node ON row_node.node_id=v LEFT JOIN LATERAL(SELECT pair->>1 id FROM jsonb_array_elements(row_node.node->1)pair WHERE pair->>0='id')identity_ref ON true LEFT JOIN pg_temp.twuanis_evidence_validation_nodes identity_node ON identity_node.node_id=identity_ref.id;
  IF cardinality(ids)<>(SELECT count(DISTINCT v)FROM unnest(ids)v) OR EXISTS(SELECT 1 FROM unnest(ids)v WHERE v!~'^(PRIVATE|BANK):[0-9a-f-]{36}$' OR body->>'population'<>'COMBINED' AND split_part(v,':',1)<>body->>'population') THEN RAISE EXCEPTION 'Population identity or qualification limit mismatch';END IF;
  checked_rows:=array_append(checked_rows,rows_ref);END IF;
 END LOOP;
 IF body#>>'{evidence,methodology,sourceDigest}' IS NULL THEN RAISE EXCEPTION 'Methodology reference required';END IF;
 PERFORM twuanis_canonical_private.evidence_v2_bank_scope(body);
END$function$
;

-- 112_orchestrator_expired_reservation_replay.sql SHA256 e6f753654eb998f01b433fdcea9552a9387f3c4c0c398b53352ff7c69ad792c2

-- ORCH-FINAL-01: release the existing expired reservation through canonical maintenance.
DO $$BEGIN IF encode(sha256(convert_to(pg_get_functiondef('public.orchestrator_execution_claim(jsonb,uuid,uuid,text,text,jsonb,uuid)'::regprocedure),'UTF8')),'hex')<>'7141531f2462c865dccab8c5dfb5008462eb3ac9660fdc6e95bb179cca646ab0' THEN RAISE EXCEPTION 'Unreviewed execution claim predecessor';END IF;END$$;
CREATE OR REPLACE FUNCTION public.orchestrator_execution_claim(p_claims jsonb, p_request uuid, p_execution uuid, p_orchestrator text, p_population text, p_question jsonb, p_worker uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE transport text:=current_setting('request.jwt.claims',true);a uuid;authority jsonb;x twuanis_canonical_private.execution_credit_executions%ROWTYPE;j twuanis_canonical_private.orchestrator_execution_claims%ROWTYPE;r jsonb;rid uuid;
BEGIN
 a:=twuanis_canonical_private.execution_credit_bridge(p_claims);
 authority:=twuanis_canonical_private.execution_credit_authority(p_orchestrator,p_population);
 IF p_worker IS NULL THEN RAISE EXCEPTION 'Trusted worker required';END IF;
 -- Account lock comes from the existing bridge. Bound active work independently
 -- of token quantity; retries of the same reserved execution remain admissible.
 IF NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.execution_credit_executions WHERE id=p_execution AND account_id=a)
 AND (SELECT count(*) FROM twuanis_canonical_private.orchestrator_execution_claims claim_row JOIN twuanis_canonical_private.execution_credit_executions ex ON ex.id=claim_row.execution_id WHERE ex.account_id=a AND claim_row.lease_until>clock_timestamp() AND twuanis_canonical_private.execution_credit_execution_state(ex.id)='RESERVED')>=2
 THEN RAISE EXCEPTION 'Two active orchestrator executions per account maximum' USING ERRCODE='54000';END IF;
 PERFORM set_config('request.jwt.claims',transport,true);
 r:=public.execution_credit_service(p_claims,p_request,jsonb_build_object('operation','reserve','execution',p_execution,'orchestrator',p_orchestrator,'population',p_population,'request',p_question));
 SELECT * INTO STRICT x FROM twuanis_canonical_private.execution_credit_executions WHERE id=p_execution AND account_id=a;
 IF x.authority IS DISTINCT FROM authority THEN RAISE EXCEPTION 'Execution authority changed' USING ERRCODE='42501';END IF;
 SELECT id INTO rid FROM twuanis_canonical_private.execution_credit_reports WHERE execution_id=x.id;
 IF rid IS NOT NULL THEN RETURN r||jsonb_build_object('state',twuanis_canonical_private.execution_credit_execution_state(x.id),'report',rid,'reason',(SELECT metadata->>'reason' FROM twuanis_canonical_private.execution_credit_events WHERE execution_id=x.id AND kind='RESERVATION_RELEASED'),'resumeCommit',true);END IF;
 IF twuanis_canonical_private.execution_credit_execution_state(x.id)<>'RESERVED' OR x.lease_until<=clock_timestamp() THEN
  -- A replayed reserve receipt must not leave an expired hold in the ledger.
  -- Reuse canonical maintenance under the existing account advisory lock.
  PERFORM twuanis_canonical_private.execution_credit_maintain(a,p_request);
  RETURN r||jsonb_build_object('state','RELEASED');
 END IF;
 SELECT * INTO j FROM twuanis_canonical_private.orchestrator_execution_claims WHERE execution_id=x.id FOR UPDATE;
 IF FOUND THEN
  IF j.lease_until>clock_timestamp() THEN RETURN jsonb_build_object('state','WORKING','execution',x.id);END IF;
  IF j.attempt>=3 THEN RAISE EXCEPTION 'Execution retry limit reached';END IF;
  UPDATE twuanis_canonical_private.orchestrator_execution_claims SET worker=p_worker,lease_until=least(clock_timestamp()+interval'3 minutes',x.lease_until),attempt=attempt+1 WHERE execution_id=x.id;
 ELSE INSERT INTO twuanis_canonical_private.orchestrator_execution_claims(execution_id,worker,lease_until)VALUES(x.id,p_worker,least(clock_timestamp()+interval'3 minutes',x.lease_until));END IF;
 RETURN jsonb_build_object('state','CLAIMED','execution',x.id,'authority',authority,'createdAt',x.reserved_at);
END$function$
;

-- Exact approved methodology release registration.
INSERT INTO twuanis_canonical_private.orchestrator_methodology_releases(id,manifest,archive_sha256) VALUES('b6e2e5578a14a13e2e0db58096a03001c51c0407f353f53f4dabe684b6c4080b','{"schema": "twuanis-methodology-release-v1", "acquisitionContract": "canonical-scoped-acquisition-v1", "methodology": {"sourceDigest": "a74b366b9aed2502719ce50ced487cfb9984dac2b73b01502b52eeb9e38870fc", "sourceHashes": {"lib/price-meter-comparable-evidence.ts": "c28eb641aa7d4eb15c74efdc9bfadc9512c96ed9efd2c7b1cb789b8463e623b2", "lib/price-meter-comparison-evidence.ts": "530d2cbffe9dd5189c13fb50d34e06f6f72a27880bfda96f6195516d87bfd2c0", "lib/price-meter-comparable-population-trail.ts": "b113332b4f8fc133f5068556c0ba8aa7aaee8be2931d5d8d53fd3760d6ddf626", "lib/price-meter-cross-dimensional-action.ts": "d69bf87235277f186e55cf46f0789aa8824c96f597e553a56dab4847aac79364", "lib/price-meter-discovery-engine.ts": "24c5a80fa0df6e671b037c545fd9b7e3683e4e22b15ad4582de4c7996298f735", "lib/price-meter-size-relationship-math.ts": "694ee5fe0c962585fbaf11a7d256cb566feb595583baabc6a8b687988042e0e3", "lib/price-meter-identity.ts": "317a9c819f7c924f839fb1976f92bcbc2fb8db34a06002ff1bd2c5572750f905", "lib/phase14-comparative-discovery.ts": "0f567172e6240421f3a42635958a1b45a45e166c3fde515edbadf1ac6fe258ca", "lib/price-meter-property-position-execution.ts": "a00788ddbe3ab7eaa0ff7722d6dcd5492dd4ec40915a68868f7ff1b8772dcc15", "lib/price-meter-property-difference-context-acquisition.ts": "b05711e83838804128625a0951b4d400dede2df59f3235522c819ad11b70045a", "lib/price-meter-comparison-candidate-loader.ts": "5585654c9908014aa34e207d98c491af1fbb03bb561867091572a1cc899241f3", "lib/price-meter-construction-land-statistics.ts": "c18c81b6c82035594a05b8179231635499f0f29db83edfdbb6b7657b1513c5d4", "lib/market-scarcity-engine.ts": "c216bf5840c1cb257f94ef5536d8d3c9df148838200f7f92b172f45db2da0a69", "lib/price-meter-property-position-tail.ts": "b09616015165f814a79aff926c75dab8656507ae8c6d5c458d259100fdad6bb5", "lib/price-meter-property-position-server.ts": "79da9cc5f50dcd1624835a0b8c9ed3fac2d9b18a70afba5899fd572ff9ff90c8", "lib/price-meter-comparison-orchestrator.ts": "2af0c46a22dee963893a87b6407444af01e9c2269928a0f35b638f5739386b30", "lib/price-meter-authorization.ts": "af0aa86bcf80becf3e4d86592e112c077d7e7b077a55001d03e54a75f7768bf8", "lib/price-meter-property-difference-context-characteristic.ts": "2f259fe2aa5575c2d85d3f33229bf098b1887bdd12d7fc57db5d6964e01f7959", "lib/price-meter-discovery-population.ts": "dd98491f0cae087c916c070011563856fc03857a127891b3fc2223a3d8d37c82", "lib/price-meter-property-position-evidence.ts": "3ecbb36840599b5d5621af5c140e966c96c40225e20536a3b6d36f62b72faf45", "lib/price-meter-property-position-identity.ts": "c0004dfe7a335a743f326134188041475468fe519b0f8e6c9a86cded8e12435e", "lib/price-meter-apply-contract.ts": "9a1857d139cdaf054856daa9e75dc9e0647d10c20ed1a7632402125a712e906e", "lib/price-meter-construction-land.ts": "4809e17b695ec4eeba6d74b69d087e42dc6f6d184bac33333d432cf0c14e0096", "lib/asking-area-ratio-math.ts": "af35474b8d1c0cf8b9e901a058b53cbdd820a108190ec92160d6cab9cbf42819", "lib/price-meter-discovery-request.ts": "be898694e8906dee94ae8230ad1393890691c9f8e1191100f236bd6240079730", "lib/price-meter-geographic-command.ts": "8d19b08159fb1a3b4258aea651a8855a61c0d8039240c40962b70c6acf49fb48", "lib/price-meter-characteristic-relationship.ts": "201dd289db75281a363b124ee27e2e3b9f4c994488d8b9569c3fa83ebcf51c5d", "lib/canonical-market-prevalence.ts": "87b40faa9c9fc36633c72375046b025d0d41433f77c25db4818eedc0ef05d837", "lib/price-meter-construction-land-distribution.ts": "c4b80dc61e6eed68395407c943afb4b16dd83aeac2a3a1c59d5f2526c7e4cd47", "lib/price-meter-selected-engine.ts": "567f015f82010fb6874349c4468596f58ccfc1d61718bc246a548921b78c87c0", "lib/price-meter-discovery-loader.ts": "a18b55864762f293b8c8bbcb56079ba774db2bb635695f64b91fd2300f2e596e", "lib/price-meter-comparable-dto.ts": "b1b37f3b7b4957ad3161ec6c02a6f256a415196bbc6a5f4abf04a3c2b1df4325", "lib/price-meter-property-position-result-contract.ts": "d7e4c171a91d6000072ef43bc39548be1e96995db0446e3a9910411496bba741", "lib/price-meter-property-price-vs-median.ts": "a50fcda35876e44d74846ff1bbb587cd17e7fc538a8902365773973261e61817", "lib/price-meter-characteristic-identity.ts": "80100c8dc0c3b3c664e072fc4382207c2a88138ad697de405fc7bf90d24ef5ab", "lib/price-meter-comparison-permit.ts": "968750775021ec2e7d0a66ae58adef73e1ef46388877bfc467a3a5fc13675241", "lib/population-engine-registry.ts": "a92536cbc011d7916bdec741c9bea7052c0f766ff44ac228a8eacb539e6ded40", "lib/price-meter-property-position-request.ts": "0e8ad528827a069f82045819e6b69777fb5a37f86058fe0489e002a8f4a9ef86", "lib/price-meter-property-difference-context-presentation.ts": "51d4b96cd34c657d43c88d1fdf0577693f3805aed315803f0ff516cf8e51fccb", "lib/price-meter-cross-dimensional-analyzer.ts": "3d2939dd5bc80185b725c031230471cffc1ffc57ba54db5c78b7f0551eb73769", "lib/price-meter-property-position-browser-contract.ts": "2ee75dde09ad2c8bd44194bf7ded77fccb4c37379f64f7f27c27634e33fe8417", "lib/price-meter-cross-dimensional-synthesis.ts": "97698b250a699a2459aa06e4b7c25db1c6c10a20fcf11dd5f37c00dc472c57fe", "lib/price-meter-browser-result.ts": "f9e4230b45f400d0287211b48dd9785e07d7038af48489a347cbe4b43315b77e", "lib/price-meter-comparable-server.ts": "9cabe77f135cf75998822a82f19be16b6b7cdc3e08282a7f27ecf98f344ff720", "lib/price-meter-property-difference-context-construction-land.ts": "04fdae9ced6138fddc6d6c695f7b356423b7fe1053dad092950ef6555f34f103", "lib/price-meter-comparison-analytical-cohort.ts": "d249a97ea99a4539acaf98a029f8c048f46e827f4e2c58835d83b0ff97fe799d", "lib/canonical-market-preferences.ts": "f00e0c44e7ec5ac5f6c46fd0936200a412a3ac7060d365b34f6bff3d1b1a495f", "lib/price-meter-cross-dimensional-question.ts": "bae3704d02564437cef176c1534f981010b8104e5eba5b3284dedec7eee1f5f7", "lib/price-meter-property-position-language.ts": "4ce57978778ec392acee028a9da344c5f5490ac2f5f824040bb2a4bde9d5567f", "lib/price-meter-transaction-cohort.ts": "6b5387150d7002bc8b0e1ba613f086c7172866d5c8af7e82bb2342504d952c73", "lib/price-meter-year-built-cohorts.ts": "4ecb6f15ce0af659ecdcacea6a2194764239450f3494f7fe545a6fc1a1c40c3a", "lib/price-meter-construction-land-selected.ts": "50a7908c5a03ee471a77a256ccf39b1caffbb010a88ed43f3c554dad7f5f5ae7", "lib/weighted-price-math.ts": "5a44416ccdf688ddc014e3dc859d3b9f309c15671f41c2f58c936748997458a1", "lib/price-meter-property-position-population.ts": "d2cf548f0149ae1ac1d35777f089dde70525fd0558a066db5b70ff5b810c8922", "lib/price-meter-comparison-engine.ts": "b081d5303f16d3d4e1255692419cc95bd9d27302e86f7dec5a699144ca002dd3", "lib/price-meter-construction-land-relationship.ts": "f93348296086ead59c8cee42f338a368db19d54b8b0fc264646d2b387c19a10f", "lib/price-meter-apply-action.ts": "b3a7f25ca9709d52175985ff208d887df60d8be9f1d5f472c406bcc7cf473ea9", "lib/price-meter-property-difference-context-browser-contract.ts": "c8cab2b497621efb9876a67dfe30ea561855e6c4b2da9cf866af1d7de7fa0b38", "lib/numerical-distribution.ts": "8654be466f574d0b9d7eb5219ef201e687da73b59e7feaf08168b84dc3afc081", "lib/price-meter-discovery-criterion.ts": "8a88974154daf1d06745451b47ae55f014ae0da5e8ff557d33ef21f6ff154c0b", "lib/price-meter-property-difference-context-size.ts": "098da97a53bc612529766b722fef5f07cab0b6606667c5b90d20b4b3e82e9238", "lib/price-meter-characteristic-distribution.ts": "0759fb991696bf9dea0da0d2185a725652fdbc54d3c951a88b9755760f621488", "lib/price-meter-property-difference-context-result-contract.ts": "397d962c3138f8ef8e26c99bd704d1175c943c76bce0a90cdb5038e91491a509", "lib/price-meter-comparable-request.ts": "c82f0cc9f6d99bbe5bd0c754f87e1bb4fbb9fcf55d723f25d1728152e85f749b", "lib/price-meter-cohort-action.ts": "4a4925c9c307dfd28deaf88653ee0089474c2381fccb693bb2beb5640de1ec15", "lib/price-meter-comparison-cohort-population.ts": "6da3715e40466db975a17417103f36500fe68a7c001b6af4e55cd47b93becf0a", "lib/price-meter-size-relationship.ts": "f6565ee62c454f591d10116eea7a5e5461d600ecefacb046951c9e4823b242a3", "lib/price-meter-construction-land-population.ts": "e822430723fea62b4fe91f76eaf326f5aa6b668ec86da999c47ac73ff19868d9", "lib/price-meter-comparable-population.ts": "1a7fd1746e5ac81b4fa13ab6cc35438096f8ceea59f7be5f084882c3f2bc9179", "lib/price-meter-cross-dimensional-execution.ts": "c8a562176ba8a972114a5ad7c31eb61d826cb67ec8b7c806c310dfff112f7ee2", "lib/price-meter-cross-dimensional-outcomes.ts": "7e3120e18f715ae75fd2fe30a4b2aaa36ad20d40c3b47424b73d1e93818f3a95", "lib/price-meter-construction-land-cohorts.ts": "adb364247ce32599b4d889016ce3503b440c908a39af035e172283782418b08c", "lib/price-meter-geographic-distribution.ts": "0dcbfbb7d55a1acbdc8a092d12c3c17a820ec9b14a7203db7a1db3bb5fa8bfdf", "lib/price-meter-comparable-presentation.ts": "0dc3111e085dc010c2f34b6404abb9f14b9d86dcedafcfe4591fde87be4df0eb", "lib/price-meter-property-position-presentation.ts": "d80017030c96f11cc033f2f24e8c0c1a106395f4264bc5cca336a214aa732e01", "lib/price-meter-property-position-median.ts": "dbfa81fd4e91b6ab0af38416cd3b439d9e82ad3e753def6d94d43ce01c1753fe", "lib/price-meter-construction-land-analysis.ts": "1add1e4cfced61d60fd4120a31df351aa8e5350726c7b8770f0a7d6e47cf710e", "lib/price-meter-cross-dimensional-secondary-cohort.ts": "6714f2501a343b0da26eee0c89482e333475324522e8598b1a7b276faca67beb", "lib/price-meter-property-position-loader.ts": "b2e6d428ccdc51c7f8677c11a9b4b26c2fb2d586ad121b951d34076b34c549b6", "lib/price-meter-cross-dimensional-presentation.ts": "9f30a573ac302a14f6d0b7a8e6ea7db3ff1d787019b2565316863aed302f77f5", "lib/price-meter-apply-permit.ts": "edf7ab2cfc407bb26c50ae706f24eac65a887e03720575e93d618c7304dc89fa", "lib/price-meter-comparable-base-cohort.ts": "32a0c76df443fa520a88d32cef23a329025d0684e9222fd90431a43ed1f5f274", "lib/price-meter-distribution.ts": "9e2a0d2a5102ecc8733e028b571ca599d1c5511d8a621a1ee530de098ea829cb", "lib/price-meter-geographic-conclusions.ts": "73504e230b29576529773a22c446d490cce6e5038b2fa9cce333b464acf6735d", "lib/price-meter-comparable-subject-identity.ts": "80b3bcd4967beee4a35eb7826634ff0e31f2871acad0522131276ab6b8da65fd", "lib/price-meter-comparable-browser-contract.ts": "61af1a876da8e6dc3e3031abef659e52e7aca1df7ce0b1f95b87635c7fd05322", "lib/price-meter-construction-land-command.ts": "e0312ffbf89d44b1521fdff135e1c40a3cc3ede35e212cc1926987378a5e5ed5", "lib/market-intelligence-area-ranges.ts": "040f8b05afb06cebf71f2ff0a8643a0617e3a757e5b2ee9df7db592f97969d4e", "lib/population-engine-execution.ts": "71cadcb342837900360743f98a9ca35c97101246125217cff7d5d7ccb8affc79", "lib/price-meter-analytical-cohort.ts": "46c2edbd7fa3d839b75d9298656e011cc696aca3f72b29dd6c93d913eb777ff3", "lib/price-meter-observation-builder.ts": "4ed1e6fd4dd437a3a81ec43e8b02a0cc8fefba1696e5f501704bc463a9b06175", "lib/price-meter-geographic-scope.ts": "b2339111e2dbf7638ef6c573fdb747644f706f33f760756aa0df76e6ce8099b2", "lib/price-meter-size-relationship-population.ts": "755870ad189c99f540f34800cabeb37736e93e2f2ce0682120e653ccb61f3900", "lib/price-meter-property-difference-context-adapter.ts": "d3983e48750a9e774400d5d504a7e73b9e338623ceab49d448559ef1295fcc7b", "lib/price-meter-property-difference-context-server.ts": "14e51a2cfe63cf02e961c37582bc1418ca2bf5b5278995511b8aa67863dc85eb", "lib/price-meter-comparison-analysis.ts": "bfe99ec528e044d1f5382864ea0eab3a9519a37ac220620817167a9d9a91dca0", "lib/market-inventory-engine.ts": "0b045df4d7581c79b81e0d6fcc690cca30f9576cc2cbfbb2a9855ce853966b85", "lib/price-meter-property-position-percentile.ts": "5e02d6632178e87fa5578694b589d154c9c2b02d6e92201f46e2828f86572cbe", "lib/price-meter-comparison-request.ts": "6c29dfc1e4c336934210d3d3ba25929912dbf29df3ccac7422b680c0bac634f8", "lib/price-meter-property-difference-context-dto.ts": "fc580bf9f64995a93c1d1d630c37118695d697f70b85a933f15284e0f35f7b28", "lib/price-meter-comparable-engine.ts": "753829d55a4cfdd227c6cc114aef49024ba9d2405c542295b333ec8bcd7b38ac", "lib/price-meter-property-position-dto.ts": "dad5d69e8cdcd3b40d20ff9c8d404baeb37d8ef26c0d2eea643443c73a87d9a6", "lib/price-meter-comparable-geography.ts": "713138238762864369f0be0d789682106b37a51191e5037b8e5d05b46318bc07", "lib/price-meter-comparison-cohort.ts": "9700a27c4ffb46daeecfd5051b5ec41b0da0bfe480b62ee8a85e268287dea5eb", "lib/price-meter-engine.ts": "2f8540e21d3342c6a33a2d495cdf5872f91f1df4ad395022a2cfbf1f62f4a266", "lib/price-meter-selected-contract.ts": "3b55ce30b3d1722645cbbbd26bd0c35e8174ac1cd508b42ca100c270f97b08b6", "lib/price-meter-geographic-statistics.ts": "c1811778721b32c32760d344c9d602b7ba3a1d7e10253cbe8700efdf2edd608b", "lib/price-meter-observation-loader.ts": "67df6b2cf4506766b380c84d7beaf8a789fa05d2a1c799b92370d3c975a5d9c3", "lib/price-meter-comparable-dimensions.ts": "ca44d7da3aa26a88890f6f9271f5afbfdf861f0cdd0de624309fc156b428d777", "lib/price-meter-property-difference-context-request.ts": "9db962121446dc0adcff08c9e190fb70ec4757e35f0b12d81682830589e8177a", "lib/price-meter-comparable-loader.ts": "aebd06babb90d8c9578a3bcfe52a663431d110f97e1f6c1820b996527ffb5d81", "lib/price-meter-comparison-request-parser.ts": "da2c8ee427203b81b803f44dc4bd16260353ac3231f7f92652a0166804955256", "lib/price-meter-cross-dimensional-population.ts": "2bd22799f631a0c9c34fbe3d6f71e25aeb8b5282b72df5022ee739f251d2762d", "lib/price-meter-ontology-membership.ts": "93a4b225be5082ad8a83e4522bc166ff0c6eb903685f9748a1fdc00bbe056d8b", "lib/price-meter-property-position-normalization.ts": "eb33b6b9d09aeca3e17a468a6d1255fb35bacc58b906dd9d44726d49cd961359", "lib/market-comparison-engine.ts": "2e69a0e3f80b3c69014ca7a7fc6315fe0453e4ae02d6be962d53ae20b335b705", "lib/price-meter-property-difference-context-geographic.ts": "98d606b3fc0b712db5ccb809265c880698d2e6c78cb35c1d5d028762c89a0b89", "lib/price-meter-cross-dimensional-evidence.ts": "22f1bc296a999a8945997650ea7ab47dc0c35f9225c68d15b478b9892331a998", "lib/price-meter-cross-dimensional-result-contract.ts": "5db2ca7c47329a00e74a810922588ed92c9254fa1372a199a6e615cb92c640ed", "lib/price-meter-cross-dimensional-identity.ts": "59088e52eb0eba6b656ceaa7c3988b6504c62e262fa4f9b921e3b8cf738932ca", "lib/price-meter-statistic-identity.ts": "28f5b0a66166a21f9cb2df53611213a55ab0f7d4d154c5181aa66a3875c217cc", "lib/price-meter-property-position-interval.ts": "1fcb52c412460aa5051ece33d4ac87a5022a089b82e7cedc8d066d2e2b689793", "lib/price-meter-distribution-interpretation.ts": "d4e9f443291e1301524ad1a86823cf8471b122a206a7eb0b94a59cb0a379b82a", "lib/price-meter-property-position-construction-land.ts": "cc0732c7482ca82c01fc884940c91ef9b16b76b449100326d54574778d9fe97e", "lib/price-meter-property-position-math.ts": "7b844d24cf4c208195a26595007d5a6fa1ba08f0b3b3dad243034ff6f0c75211", "lib/currency-conversion.ts": "4b90cf39e0123890de6006cbcf2f81063aaf61b03f91d751f50caa4127e23795"}}, "sourceHashes": {"lib/orchestrator-immutable-input.ts": "89bd2bce2598cd1fa034a76178c9bde253ff7239948150db3eab0fba90b7ba27", "lib/orchestrator-evidence-v2.ts": "090df3894a15ae661afbbd4fc4146721a7b118b0712e22c60730adb2c5cba22a", "lib/asking-area-ratio-contract.ts": "93d82e4a32e246c3b8bdfea7121813e48b71740d8057b44f8c74b18e947a0331", "lib/weighted-price-contract.ts": "fc781d834acf031bed773055b49519318d0a68090037fe866125e08908a25f6d", "/Users/cassidydaddy/twuanis/node_modules/@supabase/supabase-js/dist/tracingRegistry.mjs": "1682402eb4078c171f9b70e9a8e52c17eeefee593d94b167059c354ba74eac8f", "/Users/cassidydaddy/twuanis/node_modules/tslib/tslib.es6.mjs": "0929993220938091ede542d688b0fdb87dad99a7e77678e1983c32d18a503339", "/Users/cassidydaddy/twuanis/node_modules/@supabase/functions-js/dist/main/helper.js": "323d5529b134ddf92d2bce3ffb1c1707d483325f182fd2665d59564ca6bb933e", "/Users/cassidydaddy/twuanis/node_modules/@supabase/functions-js/dist/main/types.js": "c599ec73696bd9a251cc206407bdc5a9b2fbda1b12d97ceb9868b2a060dbb514", "/Users/cassidydaddy/twuanis/node_modules/@supabase/functions-js/dist/main/FunctionsClient.js": "905e201600578c69ac03137d69174a39e21cf46096fb9ce6acf2307bb6e2a2c0", "/Users/cassidydaddy/twuanis/node_modules/@supabase/functions-js/dist/main/index.js": "41f4ff1b0f36c0ccc0a0e0fbd6428f2654dafbe1fd3e3dd89a8736166ac5c4f5", "/Users/cassidydaddy/twuanis/node_modules/@supabase/postgrest-js/dist/index.mjs": "ae5ca8d925419e7cdce15a7e5773aab13f4cf2e8b2617e9632769cf9a5b62472", "/Users/cassidydaddy/twuanis/node_modules/@supabase/realtime-js/dist/main/lib/websocket-factory.js": "cb05e6f4ab46ee28118d7baecd0ff6c6116e1a538f4896bb7d4d1de1b60ab1a9", "/Users/cassidydaddy/twuanis/node_modules/@supabase/realtime-js/dist/main/lib/version.js": "8caff3203b48619bf1dec8d2863cbbd9d514b0ea1dcf4a241e975a14c958c285", "/Users/cassidydaddy/twuanis/node_modules/@supabase/realtime-js/dist/main/lib/constants.js": "4998f76316a28ee16dce3c3346845be0e9ddde85559f34eb6a3c307732fcca35", "/Users/cassidydaddy/twuanis/node_modules/@supabase/realtime-js/dist/main/lib/serializer.js": "d71a6f611f1fd578287b89f510a9e8a6b9dc7048085065e607769b7eed7f1945", "/Users/cassidydaddy/twuanis/node_modules/@supabase/realtime-js/dist/main/lib/transformers.js": "c6050fcfa7e19d3f5b7f0cc3e7e40e899aa753a75e10d268252be968e9fc7062", "/Users/cassidydaddy/twuanis/node_modules/@supabase/phoenix/priv/static/phoenix.cjs.js": "0b9d4a6280454132320c6ea886355f4d34059213ecc6697f43d7e836c98920aa", "/Users/cassidydaddy/twuanis/node_modules/@supabase/realtime-js/dist/main/phoenix/presenceAdapter.js": "568992f5fe7333a3a80ea4e13bfa147759e762f699d9e76b7aa5ee2a58ec981f", "/Users/cassidydaddy/twuanis/node_modules/@supabase/realtime-js/dist/main/RealtimePresence.js": "a2687fc9777849d24b7ec2b45b5191b7a2a06c4b19b4dc2ccb8c25f31679246d", "/Users/cassidydaddy/twuanis/node_modules/@supabase/realtime-js/dist/main/lib/normalizeChannelError.js": "fcea2bd55b4f6c749cc0f9daf956b4d0db126d096656ff8149bb517648475efa", "/Users/cassidydaddy/twuanis/node_modules/@supabase/realtime-js/dist/main/phoenix/channelAdapter.js": "07b9e487385763cfa10b923113e76872c0ff1b67b3542b7027261045edf0c875", "/Users/cassidydaddy/twuanis/node_modules/@supabase/realtime-js/dist/main/RealtimePostgresFilterBuilder.js": "87b125bf675a17e13e706d65a3d579c18633dccf5630abd0fde2ff09d5fed7de", "/Users/cassidydaddy/twuanis/node_modules/@supabase/realtime-js/dist/main/RealtimeChannel.js": "fe8bc4667cb634ba665b28b6ae9b1d966f40dcd6d726dd0849ccd1a8d0fb509d", "/Users/cassidydaddy/twuanis/node_modules/@supabase/realtime-js/dist/main/phoenix/socketAdapter.js": "7db2e3463f86fbaa76f347159403c053ba0ffce5e0c8553708698c2ea534c630", "/Users/cassidydaddy/twuanis/node_modules/@supabase/realtime-js/dist/main/RealtimeClient.js": "b88e1f2be859fed94b9f5c22bcdb2845ff28c5e14cb6e9ed6300124f899ab5ef", "/Users/cassidydaddy/twuanis/node_modules/@supabase/realtime-js/dist/main/index.js": "c9b62a4332542a15618a2d2442760c5d2d5ef59f494765f98a297baeb9335582", "/Users/cassidydaddy/twuanis/node_modules/iceberg-js/dist/index.mjs": "15ed0530ab67a7bfb541eb2cea764023c159312b7f1888e42c029840fafd381d", "/Users/cassidydaddy/twuanis/node_modules/@supabase/storage-js/dist/index.mjs": "b5ce0c2f8aafd44d1c1ddc9294f68751692c5c2813a540c0badee4e4a930793e", "/Users/cassidydaddy/twuanis/node_modules/@supabase/auth-js/dist/main/lib/version.js": "8caff3203b48619bf1dec8d2863cbbd9d514b0ea1dcf4a241e975a14c958c285", "/Users/cassidydaddy/twuanis/node_modules/@supabase/auth-js/dist/main/lib/constants.js": "9218c8a8da3825083fcb3b105a8c52c1c5a542a865f5abf2ab5185b7b4beabf9", "/Users/cassidydaddy/twuanis/node_modules/@supabase/auth-js/dist/main/lib/errors.js": "3cf62e517139e8e2092891eb990ea32b25b95678a52a63b4b911ec08e363f77a", "/Users/cassidydaddy/twuanis/node_modules/@supabase/auth-js/dist/main/lib/base64url.js": "1d97eac773480a5e06ba408f4d746e59b4269a6b8afd22aaad75f5773c7cf9d7", "/Users/cassidydaddy/twuanis/node_modules/@supabase/auth-js/dist/main/lib/helpers.js": "78266ba90acb338e0f7cadc112f6ee241b4feb1d76f162575a90eacd2898b2a5", "/Users/cassidydaddy/twuanis/node_modules/@supabase/auth-js/dist/main/lib/fetch.js": "50fa4e318e07a49de1179256e3fa3dc927a6a46664386f0baed30ef80f3c1d0b", "/Users/cassidydaddy/twuanis/node_modules/@supabase/auth-js/dist/main/lib/types.js": "24966642101c9436aba71c1df65f4b54cffaf2c8c62adea41328f884edca8e33", "/Users/cassidydaddy/twuanis/node_modules/@supabase/auth-js/dist/main/GoTrueAdminApi.js": "b2d62d61f2828c8b8f4f3033f885599774daf3e7fc65fdfaa6d0a9baa9ba997e", "/Users/cassidydaddy/twuanis/node_modules/@supabase/auth-js/dist/main/lib/local-storage.js": "a3c6841d8c4dc24a2c0ac1d238b42a278c7ac05d18a7571db91c3fc140e42d93", "/Users/cassidydaddy/twuanis/node_modules/@supabase/auth-js/dist/main/lib/locks.js": "d9ebad87448eb4aa3f1db2453f313377e19c6c144824f502154bcf3b0cd851c3", "/Users/cassidydaddy/twuanis/node_modules/@supabase/auth-js/dist/main/lib/polyfills.js": "0b5600e6e4cda1f029ec448d93857062731b850424d3b465fa7dae4e5921ae7e", "/Users/cassidydaddy/twuanis/node_modules/@supabase/auth-js/dist/main/lib/web3/ethereum.js": "839a33e8225db3da724f25bea5d1b127ba30cb4c272cab30dd9700232ada431d", "/Users/cassidydaddy/twuanis/node_modules/@supabase/auth-js/dist/main/lib/webauthn.errors.js": "40cb9a8d5f58c798e4b1ea47774ba29e59a9efb455c6edd4d05c8a38c762cd78", "/Users/cassidydaddy/twuanis/node_modules/@supabase/auth-js/dist/main/lib/webauthn.js": "016e06c91127c337b8d0536df280cd57c66c07ec236436a39b8b7083ac308db3", "/Users/cassidydaddy/twuanis/node_modules/@supabase/auth-js/dist/main/GoTrueClient.js": "e4d0e04b094882702e38c587ae783814f15f4a1d226867d0d4b6e493170097a9", "/Users/cassidydaddy/twuanis/node_modules/@supabase/auth-js/dist/main/AuthAdminApi.js": "8e879ad1a0f0ad11923dc1b7bedd7e522532a298025c3fae52669419d342421a", "/Users/cassidydaddy/twuanis/node_modules/@supabase/auth-js/dist/main/AuthClient.js": "f9dbb30bd5c6511db0c98a24f1f9b077aa2d080505427c93dea757d97d981568", "/Users/cassidydaddy/twuanis/node_modules/@supabase/auth-js/dist/main/index.js": "a43ea0c523b8f4f8b8d59bc3b16b9ec9158cad05de53ffc92238fceb26d8bcfd", "/Users/cassidydaddy/twuanis/node_modules/@supabase/supabase-js/dist/index.mjs": "bf6f0601dc40c99e7626d1b6d859fab5efefa29d3728ca11ca21c6cf53cf817e", "lib/staging-identity.ts": "231698c2a2578140c49f733b727bdc69365423b84657737702585c5c3225ced9", "lib/staging-supabase-client.ts": "64ae8b91dd4ae3cdb246277cb4a21460b53820d88b996780a61f830c9ff2dcae", "lib/supabase-admin.ts": "4311cc0f1863bfd73b9e228e073220a955d431e125b8e9fe16f98bfab67cc3b4", "lib/geography/dta-request.ts": "2d19094d3033c23d82f16b0bb235bbbd01009bcdf009e398c57e570aeed7dd34", "lib/geography/dta-identity.ts": "4fb6e70e448731efe598aec3dea1ae634963a29002d89ad76c8bb73b5e205530", "lib/canonical-listing-reader.ts": "dc7d64ff34e4fcd36c27ee3163d4c90a4e75a2ca6a79e0714fce14484b52925f", "lib/currency-conversion.ts": "4b90cf39e0123890de6006cbcf2f81063aaf61b03f91d751f50caa4127e23795", "lib/listing-monetary-value.ts": "e24534119827a911288f3f905fb311c0c1c4c58cb201b33047c8dd0bb1f1001a", "lib/price-meter-identity.ts": "317a9c819f7c924f839fb1976f92bcbc2fb8db34a06002ff1bd2c5572750f905", "lib/weighted-price-data.ts": "b747a31cf43de30758d14b30cbda52beca5c97b70a10166270006ef20631ec6e", "lib/orchestrator-execution-context.ts": "c449bd3010478681996b398c0158fbbeadad8779372b9936a4d79a8c323f251b", "lib/population-engine-registry.ts": "a92536cbc011d7916bdec741c9bea7052c0f766ff44ac228a8eacb539e6ded40", "lib/canonical-acquisition-plan.ts": "c34fd6799a73f5e70594b65febf7451b9a5c06788109e602bac60f1af2f53019", "/Users/cassidydaddy/twuanis/node_modules/@supabase/supabase-js/dist/tracingRegistry.cjs": "52e1680f1b10928a33a252df1a5e6a8756f6148b8f9c19697b2d6396cb4d8ae3", "/Users/cassidydaddy/twuanis/node_modules/@supabase/postgrest-js/dist/index.cjs": "79f298aae3c743347b87f19465f502eae42e9f5f67a1c963a996a61bd6b4e126", "/Users/cassidydaddy/twuanis/node_modules/iceberg-js/dist/index.cjs": "669b152b63f4655c394095a27401b6b78f776dcec68a6f62c692f0ff3cf1c79b", "/Users/cassidydaddy/twuanis/node_modules/@supabase/storage-js/dist/index.cjs": "f3d123f63d3c6b129a92ca531cac640817f124a52559ce485f12753759c5acc5", "/Users/cassidydaddy/twuanis/node_modules/@supabase/supabase-js/dist/index.cjs": "df957c70ef22a357fdae1412f50306c930f4af702b2fe24f1d91fae902d3accb", "/Users/cassidydaddy/twuanis/node_modules/cookie/dist/index.js": "b67c70355a2b0dbd2e78b479b94107f34d5340e54f1479dc0974224a2a5d69dd", "/Users/cassidydaddy/twuanis/node_modules/@supabase/ssr/dist/main/utils/helpers.js": "fb788af3f9c67b80df68557465059ba4fc6d076899af2f7620e8e398e4ac64f8", "/Users/cassidydaddy/twuanis/node_modules/@supabase/ssr/dist/main/utils/constants.js": "3885c4c74f5bfd111b96b3735bb03e994cace581acae34f380c443a1ab56cfe2", "/Users/cassidydaddy/twuanis/node_modules/@supabase/ssr/dist/main/utils/chunker.js": "f72a5fbf6a12150b8abb583ae548100016d58d850b8e89382d9df497493d7d4c", "/Users/cassidydaddy/twuanis/node_modules/@supabase/ssr/dist/main/utils/base64url.js": "b159c9a7599f6231340e071b9f8abb49d413ff510d53b86f8fadf55dabf5c4b8", "/Users/cassidydaddy/twuanis/node_modules/@supabase/ssr/dist/main/utils/index.js": "d7e51d9079f3e97207f2de66aa2fa3a79337ce37f1c5da068ce53a0c5657ef69", "/Users/cassidydaddy/twuanis/node_modules/@supabase/ssr/dist/main/cookies.js": "f9eb0fa61d0ab1ec5032152e1f36b63245dea7d582b29c810869be41119dc7ef", "/Users/cassidydaddy/twuanis/node_modules/@supabase/ssr/dist/main/version.js": "c9569627a08feda0a21273700f6684577902c3bcffd9e8c7da72332e978fe003", "/Users/cassidydaddy/twuanis/node_modules/@supabase/ssr/dist/main/warnOnce.js": "920d7b2fe1fdae89eef377494f3bc11eed1a1815fa33a409105d6ff7778f9d22", "/Users/cassidydaddy/twuanis/node_modules/@supabase/ssr/dist/main/warnDeprecatedPackage.js": "5276110905741b68f2daa3383f5e0d2dd0a353afd82edfe95986575fd71c5388", "/Users/cassidydaddy/twuanis/node_modules/@supabase/ssr/dist/main/createBrowserClient.js": "2cf61c5471a59eab146797affccf2cb38c6ac37f70a3bbbbcc5ccfc2b2c46bf0", "/Users/cassidydaddy/twuanis/node_modules/@supabase/ssr/dist/main/createServerClient.js": "61c432a18b3e7a91d3802f8acb834735206b20e84f2f65ebf0b9b5125385f497", "/Users/cassidydaddy/twuanis/node_modules/@supabase/ssr/dist/main/types.js": "b0d2bc4142d0c62d43f996aaeb64f22c4889ac853f8a3765758b505d972d0149", "/Users/cassidydaddy/twuanis/node_modules/@supabase/ssr/dist/main/clearAuthCookiesAtScopes.js": "c3d2a61171dbf9dc8ae4f58ab2bdb6050eb1fe4774e0ca3a378d3b0ec6cc9f55", "/Users/cassidydaddy/twuanis/node_modules/@supabase/ssr/dist/main/index.js": "262a50fb6ff1f29dc273628a3387d1abe27e97accf4c7990d4f83233a1bd2e36", "lib/staging-supabase-ssr.ts": "f8b631bdf85edd95ac54a42b005ec4c13a4c75069d28b4e1bd20becc41321416", "lib/supabase-server.ts": "1d6626e1197a55f404f4924f021701c01862bf04e65289b23cf6a7bc2c2d4557", "lib/package-capability-authorization.ts": "d68f74a395f9a81bd3669f3600a838c9f68fea28bea527de3afb496cdec3aa98", "lib/canonical-market-population.ts": "74e7b00794038e24354ab3f7be16e2d54a927e00eeaca975ed362cd69f2bb4c0", "lib/canonical-population-acquisition.ts": "705f5d7c4db3fc19a12f8ab329d80207a2acc855b9ffbb1b9bb6ddd6e5179072", "lib/analysis-date.ts": "1cdb9c49955f2d04659dafde80f61d5faf6a2c679750abfe4865da4e170ffefb", "lib/fx/bccr-provider.ts": "f6313ad6441f11f1586dd26333703bcc656d83a751baf413506ed4bc652a0050", "lib/fx/fx-registry.ts": "b63602211afeea09ca9f93881cb8edc50c5fef9259891a1e9c0f828d6faa728e", "lib/fx/fx-resolver.ts": "0e4d1504ab372407e8197e5f9fea22ab58c22c4f75e687fb9975e42e9d5de5c2", "lib/fx/fx-service.ts": "2ba19b7f56cb44f065146b8ba7df996483a2d4b620b9eba0de4f108aa3a85022", "lib/price-meter-observation-builder.ts": "4ed1e6fd4dd437a3a81ec43e8b02a0cc8fefba1696e5f501704bc463a9b06175", "lib/numerical-distribution.ts": "8654be466f574d0b9d7eb5219ef201e687da73b59e7feaf08168b84dc3afc081", "lib/price-meter-distribution.ts": "9e2a0d2a5102ecc8733e028b571ca599d1c5511d8a621a1ee530de098ea829cb", "lib/price-meter-transaction-cohort.ts": "6b5387150d7002bc8b0e1ba613f086c7172866d5c8af7e82bb2342504d952c73", "lib/price-meter-analytical-cohort.ts": "46c2edbd7fa3d839b75d9298656e011cc696aca3f72b29dd6c93d913eb777ff3", "lib/geography/resolve-dta-geography.ts": "86ba280c6afa89f490ca0cac76118afe6118cea0efe878ffc2d49c1ef8e7f36e", "lib/canonical-population.ts": "a7c6df5767db3c3b8067829908ca9fecd103a45f800c4bee918d0423dc4b5bee", "lib/market-intelligence-area-ranges.ts": "040f8b05afb06cebf71f2ff0a8643a0617e3a757e5b2ee9df7db592f97969d4e", "lib/market-year-built-options.ts": "40bfc621ae82a186c64e1cf19bfd10bac3ba713d58fbdd3d093b7e48691dd3c1", "lib/market-year-built-constraint.ts": "57a2689efbb2ba81c96cb9d29adb192a82db1350e0ae7a215291010d731b170c", "lib/canonical-customer-road-distance.ts": "52095082198e15a789e56b51ce53b260648aa42a16b7646553f605403725afe3", "lib/canonical-market-request.ts": "9df1a9acd84078f0e2739e03231e188bd100fb1207fee3ecd47d0e6acbc7a7f4", "lib/canonical-market-numerical-evidence.ts": "8bb10e2f4aa03b2d67ffe29ca22a200b139e962a1a9833ce0f6650a5172cf037", "lib/canonical-market-acquisition.ts": "3a7af7741b7ea949d57adc8c29863cf25dc5e10869be3dbbceacd059c3acabb5", "lib/canonical-market-prevalence.ts": "f586796434ad7b33273626a090cd98861ffecaebd73010b1bb2498b1ba2961e1", "lib/market-inventory-engine.ts": "0b045df4d7581c79b81e0d6fcc690cca30f9576cc2cbfbb2a9855ce853966b85", "lib/canonical-market-preferences.ts": "f00e0c44e7ec5ac5f6c46fd0936200a412a3ac7060d365b34f6bff3d1b1a495f", "lib/market-scarcity-engine.ts": "c216bf5840c1cb257f94ef5536d8d3c9df148838200f7f92b172f45db2da0a69", "lib/market-analytical-context.ts": "51348e9a10bcb62c21ff5240707f77d64984fb64f4e20ecd877ca43a717da74b", "lib/market-comparison-engine.ts": "2e69a0e3f80b3c69014ca7a7fc6315fe0453e4ae02d6be962d53ae20b335b705", "lib/price-meter-geographic-scope.ts": "b2339111e2dbf7638ef6c573fdb747644f706f33f760756aa0df76e6ce8099b2", "lib/price-meter-geographic-distribution.ts": "0dcbfbb7d55a1acbdc8a092d12c3c17a820ec9b14a7203db7a1db3bb5fa8bfdf", "lib/price-meter-geographic-statistics.ts": "c1811778721b32c32760d344c9d602b7ba3a1d7e10253cbe8700efdf2edd608b", "lib/price-meter-size-relationship.ts": "f6565ee62c454f591d10116eea7a5e5461d600ecefacb046951c9e4823b242a3", "lib/price-meter-size-relationship-population.ts": "755870ad189c99f540f34800cabeb37736e93e2f2ce0682120e653ccb61f3900", "lib/price-meter-size-relationship-math.ts": "694ee5fe0c962585fbaf11a7d256cb566feb595583baabc6a8b687988042e0e3", "lib/price-meter-construction-land.ts": "4809e17b695ec4eeba6d74b69d087e42dc6f6d184bac33333d432cf0c14e0096", "lib/price-meter-construction-land-cohorts.ts": "adb364247ce32599b4d889016ce3503b440c908a39af035e172283782418b08c", "lib/price-meter-construction-land-population.ts": "e822430723fea62b4fe91f76eaf326f5aa6b668ec86da999c47ac73ff19868d9", "lib/price-meter-construction-land-statistics.ts": "c18c81b6c82035594a05b8179231635499f0f29db83edfdbb6b7657b1513c5d4", "lib/price-meter-construction-land-relationship.ts": "f93348296086ead59c8cee42f338a368db19d54b8b0fc264646d2b387c19a10f", "lib/price-meter-construction-land-command.ts": "e0312ffbf89d44b1521fdff135e1c40a3cc3ede35e212cc1926987378a5e5ed5", "lib/price-meter-construction-land-selected.ts": "50a7908c5a03ee471a77a256ccf39b1caffbb010a88ed43f3c554dad7f5f5ae7", "lib/price-meter-comparison-cohort.ts": "9700a27c4ffb46daeecfd5051b5ec41b0da0bfe480b62ee8a85e268287dea5eb", "lib/price-meter-comparison-cohort-population.ts": "6da3715e40466db975a17417103f36500fe68a7c001b6af4e55cd47b93becf0a", "lib/price-meter-comparison-evidence.ts": "530d2cbffe9dd5189c13fb50d34e06f6f72a27880bfda96f6195516d87bfd2c0", "lib/price-meter-comparison-analysis.ts": "bfe99ec528e044d1f5382864ea0eab3a9519a37ac220620817167a9d9a91dca0", "lib/price-meter-cross-dimensional-question.ts": "bae3704d02564437cef176c1534f981010b8104e5eba5b3284dedec7eee1f5f7", "lib/price-meter-cross-dimensional-identity.ts": "59088e52eb0eba6b656ceaa7c3988b6504c62e262fa4f9b921e3b8cf738932ca", "lib/price-meter-cross-dimensional-secondary-cohort.ts": "6714f2501a343b0da26eee0c89482e333475324522e8598b1a7b276faca67beb", "lib/price-meter-cross-dimensional-population.ts": "2bd22799f631a0c9c34fbe3d6f71e25aeb8b5282b72df5022ee739f251d2762d", "lib/price-meter-cross-dimensional-analyzer.ts": "3d2939dd5bc80185b725c031230471cffc1ffc57ba54db5c78b7f0551eb73769", "lib/price-meter-authorization.ts": "af0aa86bcf80becf3e4d86592e112c077d7e7b077a55001d03e54a75f7768bf8", "lib/phase14-question.ts": "f790bb1adf115d984d98c169ba7901eba0cc686b59b4f2cdf780a4ba845b028d", "lib/phase14-question-commit.ts": "9168af3eed35ae99039f047aaa4fc607d3fedffb3730851d7e2b9708bd2cdea1", "lib/phase14-analytical-execution.ts": "ab7a4a9c5a45c4556cffac62808de5d72304958efe354705874f2e87e2cbef1e", "lib/phase14-geographic-population.ts": "9f74f4f31087b1cd5b76d0c1850e86b48a1e6876c5c86a369824f07dde05bd21", "lib/phase14-fundamental-population.ts": "4f49966857a20c96a622eee435dca0edb585fcb459b41d5775660db8c3075be7", "lib/phase14-membership-population.ts": "1ef68cc87038c0f8d7e29355d7f6856835439bff08853074ae6894bb9fae7bc6", "lib/phase14-fact-population.ts": "7e627117d33bd6d1a2be707273519ee0ee94822a910c8f07947d65123fb1526d", "lib/phase14-hydrated-population.ts": "20415d151a4989e4527ebbf70d7e8ab236ed1d2e9ae6c7822c4fb89e2b7a17b0", "lib/phase14-analytical-population.ts": "bf6aaafa206520463af26bacde4890c4857619109d14b15e59491e0146080c66", "lib/phase14-complete-analytical-population.ts": "276bec63d840db7ff8536a8d718c48002c2ab77713b3ebe58f07cfa395852b0c", "lib/population-midrank.ts": "bf535925d55a6ef8bac8e4d0c8c2acaefe194b5c4af27f48c0324050be3445f6", "lib/price-meter-property-position-math.ts": "7b844d24cf4c208195a26595007d5a6fa1ba08f0b3b3dad243034ff6f0c75211", "lib/phase14-comparative-discovery.ts": "0f567172e6240421f3a42635958a1b45a45e166c3fde515edbadf1ac6fe258ca", "lib/price-meter-property-position-identity.ts": "c0004dfe7a335a743f326134188041475468fe519b0f8e6c9a86cded8e12435e", "lib/price-meter-property-position-population.ts": "d2cf548f0149ae1ac1d35777f089dde70525fd0558a066db5b70ff5b810c8922", "lib/price-meter-property-position-percentile.ts": "5e02d6632178e87fa5578694b589d154c9c2b02d6e92201f46e2828f86572cbe", "lib/price-meter-property-position-median.ts": "dbfa81fd4e91b6ab0af38416cd3b439d9e82ad3e753def6d94d43ce01c1753fe", "lib/price-meter-property-position-interval.ts": "1fcb52c412460aa5051ece33d4ac87a5022a089b82e7cedc8d066d2e2b689793", "lib/price-meter-property-position-tail.ts": "b09616015165f814a79aff926c75dab8656507ae8c6d5c458d259100fdad6bb5", "lib/price-meter-property-position-construction-land.ts": "cc0732c7482ca82c01fc884940c91ef9b16b76b449100326d54574778d9fe97e", "lib/price-meter-property-position-evidence.ts": "3ecbb36840599b5d5621af5c140e966c96c40225e20536a3b6d36f62b72faf45", "lib/price-meter-comparable-dimensions.ts": "ca44d7da3aa26a88890f6f9271f5afbfdf861f0cdd0de624309fc156b428d777", "lib/price-meter-comparable-request.ts": "c82f0cc9f6d99bbe5bd0c754f87e1bb4fbb9fcf55d723f25d1728152e85f749b", "lib/price-meter-comparable-subject-identity.ts": "80b3bcd4967beee4a35eb7826634ff0e31f2871acad0522131276ab6b8da65fd", "lib/price-meter-comparable-geography.ts": "713138238762864369f0be0d789682106b37a51191e5037b8e5d05b46318bc07", "lib/structural-comparable-population.ts": "c2e609f0c3424c8084a48223e67ea4fb66f2b27b08db2bdaa651306b3b9cb08a", "lib/price-meter-comparable-base-cohort.ts": "32a0c76df443fa520a88d32cef23a329025d0684e9222fd90431a43ed1f5f274", "lib/price-meter-comparable-population-trail.ts": "b113332b4f8fc133f5068556c0ba8aa7aaee8be2931d5d8d53fd3760d6ddf626", "lib/price-meter-comparable-population.ts": "1a7fd1746e5ac81b4fa13ab6cc35438096f8ceea59f7be5f084882c3f2bc9179", "lib/price-meter-comparable-evidence.ts": "c28eb641aa7d4eb15c74efdc9bfadc9512c96ed9efd2c7b1cb789b8463e623b2", "lib/price-meter-comparable-engine.ts": "753829d55a4cfdd227c6cc114aef49024ba9d2405c542295b333ec8bcd7b38ac", "lib/asking-area-ratio-math.ts": "af35474b8d1c0cf8b9e901a058b53cbdd820a108190ec92160d6cab9cbf42819", "lib/weighted-price-math.ts": "5a44416ccdf688ddc014e3dc859d3b9f309c15671f41c2f58c936748997458a1", "lib/price-meter-characteristic-identity.ts": "80100c8dc0c3b3c664e072fc4382207c2a88138ad697de405fc7bf90d24ef5ab", "lib/population-engine-execution.ts": "e49777fe8d00636401c17ef59d4efc4c1be32957bb85eead80ee8a034c09c25f", "/private/tmp/twuanis-orch-acq-02/archive-entry.ts": "98aeab4e40bb5c7d5e37514bc880c5e064cf6dfb0f6965ab361039bd46af19ba", "lib/orchestrator-server.ts": "02663bb38520f18a45b5ddffa8d3189685024a21c6199833a0c06ae2f4e02584", "lib/orchestrator-execution-witness.ts": "7a0f3d6e029373823ea05ca515d7426b6c84671ee9e592fc2dddb366f0af00bb", "lib/orchestrator-contract.ts": "7482e5dbe2455d89b885d567503412df129a6bc867a41dbc42b308c982b6dcdd"}, "archiveSha256": "9aed567cf7dd7f32e68af625242bee8626f1e77b40d9e7a98adcc875540b3f26", "runtime": "v24.21.0", "precision": "IEEE754 binary64; original decimal strings retained", "ordering": "ordered argument arrays, Map/Set insertion order; monotonic invocationOrder", "reviewScope": "LOCAL QUALIFICATION ONLY; no production approval"}'::jsonb,'9aed567cf7dd7f32e68af625242bee8626f1e77b40d9e7a98adcc875540b3f26');
COMMIT;
