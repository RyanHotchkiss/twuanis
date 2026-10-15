BEGIN;
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

COMMIT;
