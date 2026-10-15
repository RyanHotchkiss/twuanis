-- Phase 5.3 local preparation: owned execution claims and historical report index.
BEGIN;
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
COMMIT;
