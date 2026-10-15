-- Phase 5.2. LOCAL ONLY: execution capacity, not a replacement analytical authority.
BEGIN;
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
COMMIT;
