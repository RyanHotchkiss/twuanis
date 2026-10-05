-- Step 3 local preparation only. Install after 026 under separately approved activation.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
-- A single shared implementation retains the unchanged seven-argument customer/source entry.
-- Only the audited administrative wrapper below calls its explicit extra authority parameter.
CREATE FUNCTION twuanis_canonical_private.s3_command_with_administrative_clear(
 p_listing uuid,p_expected bigint,p_actor_kind text,p_actor_identity text,p_request uuid,p_domains jsonb,p_source jsonb,p_administrative_clear boolean
) RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog,pg_temp AS $$
DECLARE
 l public.listings%ROWTYPE; before_l public.listings%ROWTYPE; own uuid; pub uuid; receipt public.canonical_operation_receipts%ROWTYPE;
 payload jsonb; fingerprint text; op text; rid uuid:=gen_random_uuid(); result jsonb; changed boolean:=false;
 item record; v jsonb; ids bigint[]; oldids bigint[]; dim text; labels text[]; tags text[]; termrow record;
 geo bigint[]; oldgeo jsonb; newgeo jsonb; q record; f public.listing_fact_evidence%ROWTYPE; oldf jsonb;
 amount numeric; oldamount numeric; newcurrency text; moneychanged boolean:=false; eventkind text;
 ev text; nextstate text; lifechanged boolean:=false; deadline timestamptz; observed timestamptz:=clock_timestamp();
 allowance bigint; used bigint; ruleset uuid; ruleid uuid; band bigint; total integer:=0;
 sourceobs public.listing_source_observations%ROWTYPE; sourceid uuid:=gen_random_uuid(); sourcefp text; sourcetime timestamptz;
 conflict boolean:=false; txconf boolean; geoconf boolean; oldrev bigint; finalrev bigint; group_name text; field_name text; normalized_geo jsonb;
BEGIN
 IF p_administrative_clear THEN
  IF p_actor_kind IS DISTINCT FROM 'trusted' OR p_source IS NOT NULL OR p_actor_identity IS DISTINCT FROM ('admin:'||twuanis_canonical_private.assert_administrative_permission('listings.manage')::text) THEN RAISE EXCEPTION 'administrative context required' USING ERRCODE='42501'; END IF;
 END IF;
 IF current_setting('transaction_isolation')<>'read committed' THEN RAISE EXCEPTION 'READ COMMITTED required' USING ERRCODE='0A000'; END IF;
 IF p_listing IS NULL OR p_request IS NULL OR p_expected IS NULL OR p_expected<0
 OR p_actor_kind IS NULL OR p_actor_kind NOT IN ('owner','trusted','system','migration')
 OR p_actor_identity IS NULL OR length(p_actor_identity) NOT BETWEEN 1 AND 256 OR p_actor_identity COLLATE "C" !~ '[^[:space:]]' THEN
  RAISE EXCEPTION 'explicit command identity required' USING ERRCODE='22023';
 END IF;
 PERFORM twuanis_canonical_private.s3_keys(p_domains,ARRAY['geography','semantics','facts','measurements','money','lifecycle']);
 -- Normalize sets before fingerprinting: order and duplicates are not semantic changes.
 IF p_domains ? 'semantics' THEN
  PERFORM twuanis_canonical_private.s3_keys(p_domains->'semantics',ARRAY['property_type','utility','environment','terrain','accessibility','legal_status']);
  FOR item IN SELECT key,value FROM jsonb_each(p_domains->'semantics') LOOP
   ids:=twuanis_canonical_private.s3_term_ids(item.value); total:=total+cardinality(ids);
   p_domains:=jsonb_set(p_domains,ARRAY['semantics',item.key],coalesce((SELECT jsonb_agg(x::text ORDER BY x) FROM unnest(ids)x),'[]'::jsonb));
  END LOOP;
  IF total>64 THEN RAISE EXCEPTION 'command semantic bound' USING ERRCODE='54000'; END IF;
 END IF;
 -- Numeric scale is representation, not semantic payload identity.
 IF p_domains ? 'money' AND p_domains->'money' ? 'amount' THEN
  p_domains:=jsonb_set(p_domains,'{money,amount}',to_jsonb(trim_scale(twuanis_canonical_private.s3_decimal(p_domains->'money'->'amount'))::text));
 END IF;
 IF p_domains ? 'lifecycle' AND p_domains->'lifecycle' ? 'duration_seconds' THEN
  p_domains:=jsonb_set(p_domains,'{lifecycle,duration_seconds}',to_jsonb(trim_scale(twuanis_canonical_private.s3_decimal(p_domains->'lifecycle'->'duration_seconds'))::text));
 END IF;
 FOREACH group_name IN ARRAY ARRAY['facts','measurements'] LOOP
  IF p_domains ? group_name THEN
   FOR item IN SELECT key,value FROM jsonb_each(p_domains->group_name) LOOP
    FOREACH field_name IN ARRAY ARRAY['value','lower','upper'] LOOP
     IF item.value ? field_name AND item.value->field_name<>'null'::jsonb THEN
      p_domains:=jsonb_set(p_domains,ARRAY[group_name,item.key,field_name],to_jsonb(trim_scale(twuanis_canonical_private.s3_decimal(item.value->field_name))::text));
     END IF;
    END LOOP;
   END LOOP;
  END IF;
 END LOOP;
 IF p_domains ? 'geography' THEN
  p_domains:=jsonb_set(p_domains,'{geography}',jsonb_build_object('district',NULL)||(p_domains->'geography'));
 END IF;
 IF p_source IS NOT NULL THEN
  PERFORM twuanis_canonical_private.s3_keys(p_source,ARRAY['source_name','source_listing_id','observation_id','observed_at','transaction','geography'],ARRAY['source_name','source_listing_id','observation_id','observed_at','transaction','geography']);
  normalized_geo:=jsonb_build_object('district',NULL)||(p_source->'geography');
  p_source:=jsonb_set(p_source,'{geography}',normalized_geo);
  IF p_domains ? 'geography' AND p_domains->'geography' IS DISTINCT FROM normalized_geo THEN RAISE EXCEPTION 'source geography disagrees with mutation' USING ERRCODE='22023'; END IF;
  p_domains:=jsonb_set(p_domains,'{geography}',normalized_geo);
  sourcetime:=(p_source->>'observed_at')::timestamptz;
  IF sourcetime IS NULL OR NOT isfinite(sourcetime) THEN RAISE EXCEPTION 'source observation time required' USING ERRCODE='22023'; END IF;
  p_source:=jsonb_set(p_source,'{observed_at}',to_jsonb(to_char(sourcetime AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')));
 END IF;
 op:=CASE WHEN p_source IS NULL THEN 'domain_mutation' ELSE 'source_observation' END;
 payload:=jsonb_build_object('listing',p_listing,'expected',p_expected,'domains',p_domains,'source',p_source);
 fingerprint:=encode(sha256(convert_to(payload::text,'UTF8')),'hex');
 -- Resolve immutable ownership before locking, then recheck after listing lock.
 SELECT owner_id,publisher_account_id INTO own,pub FROM public.listings WHERE id=p_listing;
 IF NOT FOUND THEN RAISE EXCEPTION 'listing missing' USING ERRCODE='P0002'; END IF;
 IF own IS NOT NULL THEN
  IF pub IS NULL THEN RAISE EXCEPTION 'canonical customer publisher missing' USING ERRCODE='55000'; END IF;
  IF twuanis_canonical_private.lock_publisher(pub) IS DISTINCT FROM own THEN RAISE EXCEPTION 'publisher ownership mismatch' USING ERRCODE='55000'; END IF;
 ELSE
  IF pub IS NOT NULL OR p_actor_kind='owner' THEN RAISE EXCEPTION 'invalid ownerless authority' USING ERRCODE='42501'; END IF;
  PERFORM twuanis_canonical_private.lock_capacity_policy(false);
 END IF;
 IF p_actor_kind='owner' AND p_actor_identity IS DISTINCT FROM own::text THEN RAISE EXCEPTION 'owner context mismatch' USING ERRCODE='42501'; END IF;
 IF p_source IS NOT NULL THEN
  IF p_actor_kind NOT IN ('trusted','system') THEN RAISE EXCEPTION 'source authority required' USING ERRCODE='42501'; END IF;
  PERFORM twuanis_canonical_private.s3_keys(p_source,ARRAY['source_name','source_listing_id','observation_id','observed_at','transaction','geography'],ARRAY['source_name','source_listing_id','observation_id','observed_at','transaction','geography']);
  IF jsonb_typeof(p_source->'source_name') IS DISTINCT FROM 'string' OR length(p_source->>'source_name') NOT BETWEEN 1 AND 128
   OR jsonb_typeof(p_source->'source_listing_id') IS DISTINCT FROM 'string' OR length(p_source->>'source_listing_id') NOT BETWEEN 1 AND 256
   OR jsonb_typeof(p_source->'observation_id') IS DISTINCT FROM 'string' OR length(p_source->>'observation_id') NOT BETWEEN 1 AND 256
   OR p_source->>'transaction' NOT IN ('sale','rent') THEN RAISE EXCEPTION 'invalid source identity' USING ERRCODE='22023'; END IF;
  sourcetime:=(p_source->>'observed_at')::timestamptz;
  IF sourcetime IS NULL OR NOT isfinite(sourcetime) THEN RAISE EXCEPTION 'source observation time required' USING ERRCODE='22023'; END IF;
  sourcefp:=encode(sha256(convert_to(jsonb_build_object('listing',p_listing,'source',p_source,'domains',p_domains)::text,'UTF8')),'hex');
  PERFORM pg_advisory_xact_lock(3103,hashtext(jsonb_build_array(p_source->>'source_name',p_source->>'source_listing_id')::text));
 END IF;
 PERFORM pg_advisory_xact_lock(3104,hashtext(jsonb_build_array(p_actor_kind,p_actor_identity,op,p_request)::text));
 SELECT * INTO receipt FROM public.canonical_operation_receipts WHERE authority_kind=p_actor_kind AND authority_identity=p_actor_identity AND operation_type=op AND request_id=p_request;
 IF FOUND THEN
  IF receipt.payload_fingerprint<>fingerprint OR receipt.listing_id IS DISTINCT FROM p_listing THEN RAISE EXCEPTION 'idempotency conflict' USING ERRCODE='22023'; END IF;
  RETURN jsonb_build_object('outcome',receipt.outcome,'revision',receipt.result_revision::text,'receipt_id',receipt.id::text,'replayed',true);
 END IF;
 SELECT * INTO STRICT l FROM public.listings WHERE id=p_listing FOR UPDATE;
 IF l.owner_id IS DISTINCT FROM own OR l.publisher_account_id IS DISTINCT FROM pub THEN RAISE EXCEPTION 'ownership changed' USING ERRCODE='40001'; END IF;
 IF l.canonical_domain_version IS DISTINCT FROM 1 OR l.transaction_type NOT IN ('sale','rent') OR l.listing_status IS NULL THEN RAISE EXCEPTION 'canonical listing required' USING ERRCODE='55000'; END IF;
 -- A source replay is observation-idempotent even with a new operation request ID.
 IF p_source IS NOT NULL THEN
  IF l.source_name IS DISTINCT FROM p_source->>'source_name' OR l.source_listing_id IS DISTINCT FROM p_source->>'source_listing_id' THEN RAISE EXCEPTION 'source appearance mismatch' USING ERRCODE='22023'; END IF;
  SELECT * INTO sourceobs FROM public.listing_source_observations WHERE source_name=l.source_name AND source_listing_id=l.source_listing_id AND source_observation_id=p_source->>'observation_id';
  IF FOUND THEN
   IF sourceobs.payload_fingerprint<>sourcefp OR sourceobs.listing_id IS DISTINCT FROM p_listing THEN RAISE EXCEPTION 'source observation conflict' USING ERRCODE='22023'; END IF;
   RETURN jsonb_build_object('outcome',sourceobs.outcome,'revision',sourceobs.result_revision::text,'observation_id',sourceobs.id::text,'replayed',true);
  END IF;
 END IF;
 IF l.canonical_revision<>p_expected THEN RAISE EXCEPTION 'stale canonical revision' USING ERRCODE='40001'; END IF;
 before_l:=l;oldrev:=l.canonical_revision;
 -- Canonical eligibility requires established P+C and exact projection provenance.
 SELECT jsonb_object_agg(t.term_type,t.official_code) INTO oldgeo FROM public.listing_membership_origins o JOIN public.ontology_terms t ON t.id=o.ontology_term_id WHERE o.listing_id=p_listing AND o.origin_domain='geography' AND t.term_type IN ('province','canton','district');
 geo:=twuanis_canonical_private.s3_geography(oldgeo);
 SELECT p.term_name AS province,c.term_name AS canton,d.term_name AS district INTO q
 FROM public.ontology_terms p JOIN public.ontology_terms c ON c.id=geo[2]
 LEFT JOIN public.ontology_terms d ON d.id=geo[3] WHERE p.id=geo[1];
 IF (l.province,l.canton,l.district,l.province_normalized,l.canton_normalized,l.district_normalized)
 IS DISTINCT FROM (q.province,q.canton,q.district,twuanis_private.normalize_geographic_projection(q.province),twuanis_private.normalize_geographic_projection(q.canton),twuanis_private.normalize_geographic_projection(q.district)) THEN
  RAISE EXCEPTION 'canonical geography projection disagreement' USING ERRCODE='55000';
 END IF;
 IF (SELECT count(*) FROM public.listing_semantic_selections WHERE listing_id=p_listing AND dimension='property_type')<>1 THEN
  RAISE EXCEPTION 'canonical property type missing' USING ERRCODE='55000';
 END IF;
 IF (SELECT count(*) FROM public.listing_membership_origins o JOIN public.ontology_terms t ON t.id=o.ontology_term_id WHERE o.listing_id=p_listing AND o.origin_domain='geography' AND t.term_type IN ('province','canton','district'))<>cardinality(geo)
 OR EXISTS(SELECT 1 FROM public.listing_membership_origins o WHERE o.listing_id=p_listing AND NOT EXISTS(SELECT 1 FROM public.listings_ontology_terms lot WHERE lot.listing_id=p_listing AND lot.ontology_term_id=o.ontology_term_id))
 OR EXISTS(SELECT 1 FROM public.listings_ontology_terms lot WHERE lot.listing_id=p_listing AND NOT EXISTS(SELECT 1 FROM public.listing_membership_origins o WHERE o.listing_id=p_listing AND o.ontology_term_id=lot.ontology_term_id)) THEN RAISE EXCEPTION 'canonical provenance incomplete' USING ERRCODE='55000'; END IF;
 IF p_source IS NOT NULL THEN
  newgeo:=p_source->'geography'; geo:=twuanis_canonical_private.s3_geography(newgeo);
  txconf:=l.transaction_type IS DISTINCT FROM p_source->>'transaction';
  geoconf:=oldgeo->>'province' IS DISTINCT FROM newgeo->>'province' OR oldgeo->>'canton' IS DISTINCT FROM newgeo->>'canton';
  conflict:=txconf OR geoconf;
  IF conflict THEN
   INSERT INTO public.listing_source_observations(id,source_name,source_listing_id,source_observation_id,listing_id,source_observed_at,outcome,payload_fingerprint,result_revision)
   VALUES(sourceid,l.source_name,l.source_listing_id,p_source->>'observation_id',p_listing,sourcetime,'conflict',sourcefp,oldrev);
   INSERT INTO public.source_identity_conflicts(listing_id,observation_id,source_name,source_listing_id,existing_transaction_type,observed_transaction_type,existing_province_code,existing_canton_code,observed_province_code,observed_canton_code,conflict_type)
   VALUES(p_listing,sourceid,l.source_name,l.source_listing_id,l.transaction_type,p_source->>'transaction',oldgeo->>'province',oldgeo->>'canton',newgeo->>'province',newgeo->>'canton',CASE WHEN txconf AND geoconf THEN 'transaction_and_geography' WHEN txconf THEN 'transaction' ELSE 'geography' END);
   INSERT INTO public.canonical_operation_receipts(id,authority_kind,authority_identity,operation_type,request_id,payload_fingerprint,outcome,listing_id,result_revision)
   VALUES(rid,p_actor_kind,p_actor_identity,op,p_request,fingerprint,'conflict',p_listing,oldrev);
   RETURN jsonb_build_object('outcome','conflict','revision',oldrev::text,'receipt_id',rid::text,'replayed',false);
  END IF;
  -- An older observation is durable evidence, never a stale overwrite.
  IF l.last_seen IS NOT NULL AND sourcetime<l.last_seen THEN
   INSERT INTO public.listing_source_observations(id,source_name,source_listing_id,source_observation_id,listing_id,source_observed_at,outcome,payload_fingerprint,result_revision)
   VALUES(sourceid,l.source_name,l.source_listing_id,p_source->>'observation_id',p_listing,sourcetime,'stale',sourcefp,oldrev);
   INSERT INTO public.canonical_operation_receipts(id,authority_kind,authority_identity,operation_type,request_id,payload_fingerprint,outcome,listing_id,result_revision)
   VALUES(rid,p_actor_kind,p_actor_identity,op,p_request,fingerprint,'stale',p_listing,oldrev);
   RETURN jsonb_build_object('outcome','stale','revision',oldrev::text,'receipt_id',rid::text,'replayed',false);
  END IF;
  IF p_domains ? 'geography' AND p_domains->'geography' IS DISTINCT FROM newgeo THEN RAISE EXCEPTION 'source geography disagrees with mutation' USING ERRCODE='22023'; END IF;
  p_domains:=jsonb_set(p_domains,'{geography}',newgeo);
 END IF;
 IF l.listing_status IN ('archived','deleted') AND (p_domains - 'lifecycle')<>'{}'::jsonb THEN RAISE EXCEPTION 'state does not permit evidence edit' USING ERRCODE='22023'; END IF;
 IF p_domains ? 'geography' THEN
  v:=p_domains->'geography';
  -- Source identity already resolved and locked the identical supplied geography.
  IF p_source IS NULL THEN geo:=twuanis_canonical_private.s3_geography(v); END IF;
  IF (oldgeo->>'province',oldgeo->>'canton',oldgeo->>'district') IS DISTINCT FROM (v->>'province',v->>'canton',v->>'district') THEN
   PERFORM twuanis_canonical_private.s3_origins(p_listing,'geography',geo);
   SELECT term_name INTO l.province FROM public.ontology_terms WHERE id=geo[1];
   SELECT term_name INTO l.canton FROM public.ontology_terms WHERE id=geo[2];
   SELECT term_name INTO l.district FROM public.ontology_terms WHERE id=geo[3];
   l.province_normalized:=twuanis_private.normalize_geographic_projection(l.province);
   l.canton_normalized:=twuanis_private.normalize_geographic_projection(l.canton);
   l.district_normalized:=twuanis_private.normalize_geographic_projection(l.district);changed:=true;
  END IF;
 END IF;
 FOR item IN SELECT key,value FROM jsonb_each(coalesce(p_domains->'semantics','{}')) ORDER BY key LOOP
  dim:=item.key;ids:=twuanis_canonical_private.s3_term_ids(item.value);
  IF (dim='property_type' AND cardinality(ids)<>1) OR (dim='legal_status' AND cardinality(ids)>1) THEN RAISE EXCEPTION 'semantic cardinality' USING ERRCODE='23514'; END IF;
  labels:='{}';
  FOR termrow IN SELECT * FROM public.ontology_terms WHERE id=ANY(ids) ORDER BY id FOR SHARE LOOP
   IF termrow.term_type IS DISTINCT FROM dim OR termrow.level IS DISTINCT FROM 1 OR termrow.term_name IS NULL THEN RAISE EXCEPTION 'semantic term type/level' USING ERRCODE='23514'; END IF;
   labels:=array_append(labels,termrow.term_name);
  END LOOP;
  IF cardinality(labels)<>cardinality(ids) THEN RAISE EXCEPTION 'unknown semantic term' USING ERRCODE='23514'; END IF;
  IF dim='accessibility' THEN
   PERFORM term_id FROM twuanis_canonical_private.accessibility_identity WHERE term_id=ANY(ids) ORDER BY term_id FOR SHARE;
   SELECT array_agg(code) INTO tags FROM twuanis_canonical_private.accessibility_identity WHERE term_id=ANY(ids);
   IF coalesce(cardinality(tags),0)<>cardinality(ids) OR ('boat'=ANY(tags) AND cardinality(tags)>1) OR ('4x4'=ANY(tags) AND tags && ARRAY['2wd','paved']) THEN RAISE EXCEPTION 'accessibility set incompatible or unmapped' USING ERRCODE='23514'; END IF;
  END IF;
  SELECT coalesce(array_agg(ontology_term_id ORDER BY ontology_term_id),'{}') INTO oldids FROM public.listing_semantic_selections WHERE listing_id=p_listing AND dimension=dim;
  IF oldids IS DISTINCT FROM ids THEN
   DELETE FROM public.listing_semantic_selections WHERE listing_id=p_listing AND dimension=dim;
   INSERT INTO public.listing_semantic_selections(listing_id,dimension,ontology_term_id) SELECT p_listing,dim,x FROM unnest(ids)x;
   PERFORM twuanis_canonical_private.s3_origins(p_listing,dim,ids);
   CASE dim WHEN 'property_type' THEN l.property_type:=labels[1]; WHEN 'utility' THEN l.utility:=labels;
    WHEN 'terrain' THEN l.terrain:=labels; WHEN 'environment' THEN l.environment:=array_to_string(labels,'|');
    WHEN 'accessibility' THEN l.accessibility:=array_to_string(labels,'|'); WHEN 'legal_status' THEN l.legal_status:=labels[1]; END CASE;
   changed:=true;
  END IF;
 END LOOP;
 IF p_domains ? 'facts' THEN PERFORM twuanis_canonical_private.s3_keys(p_domains->'facts',ARRAY['bedrooms','bathrooms','parking','year_built','distance_to_paved_road']); END IF;
 FOR item IN SELECT key,value FROM jsonb_each(coalesce(p_domains->'facts','{}')) ORDER BY key LOOP
  dim:=item.key;v:=item.value;ids:='{}';ruleid:=NULL;ruleset:=NULL;band:=NULL;
  PERFORM twuanis_canonical_private.s3_keys(v,ARRAY['kind','value','term','lower','upper','lower_inclusive','upper_inclusive','source','reference','rule_set'],ARRAY['kind']);
  SELECT to_jsonb(e)-ARRAY['recorded_at','observed_at'] INTO oldf FROM public.listing_fact_evidence e WHERE listing_id=p_listing AND dimension=dim;
  IF v->>'kind'='clear' THEN
   IF v<>'{"kind":"clear"}'::jsonb THEN RAISE EXCEPTION 'clear has no value' USING ERRCODE='22023'; END IF;
   f:=NULL;
  ELSE
   IF v->>'kind' NOT IN ('exact','category','range') OR v->>'kind' IS NULL THEN RAISE EXCEPTION 'invalid fact kind' USING ERRCODE='22023'; END IF;
   f:=NULL;f.listing_id:=p_listing;f.dimension:=dim;f.kind:=v->>'kind';f.evidence_source:=v->>'source';f.evidence_reference:=v->>'reference';
   IF f.kind='exact' THEN
    IF v ?| ARRAY['term','lower','upper','lower_inclusive','upper_inclusive'] THEN RAISE EXCEPTION 'exact fact payload' USING ERRCODE='22023'; END IF;
    f.exact_value:=twuanis_canonical_private.s3_decimal(v->'value');
   ELSIF f.kind='category' THEN
    IF v ?| ARRAY['value','lower','upper','lower_inclusive','upper_inclusive','rule_set'] THEN RAISE EXCEPTION 'category payload' USING ERRCODE='22023'; END IF;
    ids:=twuanis_canonical_private.s3_term_ids(jsonb_build_array(v->'term'));f.category_term_id:=ids[1];
   ELSE
    IF v ?| ARRAY['value','term','rule_set'] OR NOT v ?& ARRAY['lower','upper','lower_inclusive','upper_inclusive'] OR jsonb_typeof(v->'lower_inclusive')<>'boolean' OR jsonb_typeof(v->'upper_inclusive')<>'boolean' THEN RAISE EXCEPTION 'explicit range required' USING ERRCODE='22023'; END IF;
    f.range_lower:=CASE WHEN v->'lower'='null'::jsonb THEN NULL ELSE twuanis_canonical_private.s3_decimal(v->'lower') END;
    f.range_upper:=CASE WHEN v->'upper'='null'::jsonb THEN NULL ELSE twuanis_canonical_private.s3_decimal(v->'upper') END;
    f.lower_inclusive:=(v->>'lower_inclusive')::boolean;f.upper_inclusive:=(v->>'upper_inclusive')::boolean;
   END IF;
  END IF;
  IF v ? 'rule_set' THEN
   ruleset:=(v->>'rule_set')::uuid;
   PERFORM s.id FROM public.listing_classification_rule_sets s JOIN twuanis_canonical_private.classification_seals z ON z.rule_set_id=s.id WHERE s.id=ruleset AND s.domain=dim FOR SHARE OF s;
   IF NOT FOUND THEN RAISE EXCEPTION 'sealed typed classification required' USING ERRCODE='55000'; END IF;
   SELECT r.id,r.ontology_term_id INTO STRICT ruleid,band FROM public.listing_classification_rules r WHERE r.rule_set_id=ruleset AND r.bounds @> f.exact_value;
   ids:=ARRAY[band];
  END IF;
  IF oldf IS DISTINCT FROM (CASE WHEN f.kind IS NULL THEN NULL ELSE to_jsonb(f)-ARRAY['recorded_at','observed_at'] END)
   OR (SELECT array_agg(DISTINCT classification_rule_id) FILTER(WHERE classification_rule_id IS NOT NULL) FROM public.listing_membership_origins WHERE listing_id=p_listing AND origin_domain=dim) IS DISTINCT FROM (CASE WHEN ruleid IS NULL THEN NULL ELSE ARRAY[ruleid] END) THEN
   DELETE FROM public.listing_fact_evidence WHERE listing_id=p_listing AND dimension=dim;
   IF f.kind IS NOT NULL THEN
    INSERT INTO public.listing_fact_evidence(listing_id,dimension,kind,exact_value,category_term_id,range_lower,range_upper,lower_inclusive,upper_inclusive,evidence_source,evidence_reference)
    VALUES(p_listing,dim,f.kind,f.exact_value,f.category_term_id,f.range_lower,f.range_upper,f.lower_inclusive,f.upper_inclusive,f.evidence_source,f.evidence_reference);
   END IF;
   PERFORM twuanis_canonical_private.s3_origins(p_listing,dim,ids,ruleid);
   IF f.kind='category' THEN SELECT term_name INTO dim FROM public.ontology_terms WHERE id=f.category_term_id;
   ELSIF f.kind='exact' THEN dim:=f.exact_value::text;
   ELSIF f.kind='range' THEN dim:=(CASE WHEN f.lower_inclusive THEN '[' ELSE '(' END)||coalesce(f.range_lower::text,'')||','||coalesce(f.range_upper::text,'')||(CASE WHEN f.upper_inclusive THEN ']' ELSE ')' END);
   ELSE dim:=NULL; END IF;
   CASE item.key WHEN 'bedrooms' THEN l.bedrooms:=dim; WHEN 'bathrooms' THEN l.bathrooms:=dim; WHEN 'parking' THEN l.parking:=dim; WHEN 'year_built' THEN l.year_built_range:=dim; WHEN 'distance_to_paved_road' THEN l.distance_to_paved_road_range:=dim; END CASE;
   changed:=true;
  END IF;
 END LOOP;
 IF p_domains ? 'measurements' THEN PERFORM twuanis_canonical_private.s3_keys(p_domains->'measurements',ARRAY['property_area','construction_area']); END IF;
 FOR item IN SELECT key,value FROM jsonb_each(coalesce(p_domains->'measurements','{}')) ORDER BY key LOOP
  dim:=item.key;v:=item.value;ids:='{}';ruleid:=NULL;band:=NULL;
  IF v='{"kind":"clear"}'::jsonb THEN
   IF p_actor_kind<>'owner' AND NOT p_administrative_clear THEN RAISE EXCEPTION 'measurement clear requires customer authority' USING ERRCODE='42501'; END IF;
   amount:=CASE dim WHEN 'property_area' THEN l.property_area ELSE l.construction_area END;
   IF amount IS NOT NULL OR EXISTS(SELECT 1 FROM public.listing_membership_origins WHERE listing_id=p_listing AND origin_domain=dim) THEN
    IF dim='property_area' THEN l.property_area:=NULL; ELSE l.construction_area:=NULL; END IF;
    PERFORM twuanis_canonical_private.s3_origins(p_listing,dim,'{}'::bigint[],NULL);
    changed:=true;
   END IF;
   CONTINUE;
  END IF;
  PERFORM twuanis_canonical_private.s3_keys(v,ARRAY['value','rule_set'],ARRAY['value']);
  amount:=twuanis_canonical_private.s3_decimal(v->'value');
  IF amount<=0 THEN RAISE EXCEPTION 'positive exact measurement required' USING ERRCODE='23514'; END IF;
  IF v ? 'rule_set' THEN
   ruleset:=(v->>'rule_set')::uuid;
   PERFORM s.id FROM public.listing_classification_rule_sets s JOIN twuanis_canonical_private.classification_seals z ON z.rule_set_id=s.id WHERE s.id=ruleset AND s.domain=dim FOR SHARE OF s;
   IF NOT FOUND THEN RAISE EXCEPTION 'sealed typed classification required' USING ERRCODE='55000'; END IF;
   SELECT r.id,r.ontology_term_id INTO STRICT ruleid,band FROM public.listing_classification_rules r WHERE r.rule_set_id=ruleset AND r.bounds @> amount;ids:=ARRAY[band];
  END IF;
  IF amount IS DISTINCT FROM (CASE dim WHEN 'property_area' THEN l.property_area ELSE l.construction_area END)
   OR (SELECT array_agg(DISTINCT classification_rule_id) FILTER(WHERE classification_rule_id IS NOT NULL) FROM public.listing_membership_origins WHERE listing_id=p_listing AND origin_domain=dim) IS DISTINCT FROM (CASE WHEN ruleid IS NULL THEN NULL ELSE ARRAY[ruleid] END) THEN
   IF dim='property_area' THEN l.property_area:=amount; ELSE l.construction_area:=amount; END IF;
   PERFORM twuanis_canonical_private.s3_origins(p_listing,dim,ids,ruleid);changed:=true;
  END IF;
 END LOOP;
 IF p_domains ? 'money' THEN
  v:=p_domains->'money';PERFORM twuanis_canonical_private.s3_keys(v,ARRAY['amount','currency','reason'],ARRAY['amount','currency']);
  amount:=twuanis_canonical_private.s3_decimal(v->'amount');newcurrency:=v->>'currency';
  IF amount<=0 OR newcurrency IS NULL OR newcurrency NOT IN ('CRC','USD') THEN RAISE EXCEPTION 'positive original monetary pair required' USING ERRCODE='23514'; END IF;
  oldamount:=CASE l.transaction_type WHEN 'sale' THEN l.current_price ELSE l.monthly_price END;
  IF (oldamount,l.currency) IS DISTINCT FROM (amount,newcurrency) THEN
   moneychanged:=true;changed:=true;eventkind:=CASE WHEN oldamount IS NULL THEN 'initial_observation' ELSE 'change' END;
   IF l.transaction_type='sale' THEN l.current_price:=amount;ELSE l.monthly_price:=amount;END IF;
   l.currency:=newcurrency;
  END IF;
 END IF;
 IF p_domains ? 'lifecycle' THEN
  v:=p_domains->'lifecycle';PERFORM twuanis_canonical_private.s3_keys(v,ARRAY['event','duration_seconds','reason'],ARRAY['event']);ev:=v->>'event';nextstate:=NULL;
  CASE ev
   WHEN 'publish' THEN IF l.listing_status='draft' THEN nextstate:='active';END IF;
   WHEN 'renew' THEN IF l.listing_status IN ('active','expired') THEN nextstate:='active';END IF;
   WHEN 'unpublish' THEN IF l.listing_status='active' THEN nextstate:='draft';END IF;
   WHEN 'expire' THEN IF l.listing_status='active' THEN nextstate:='expired';END IF;
   WHEN 'archive' THEN IF l.listing_status IN ('draft','active','expired') THEN nextstate:='archived';END IF;
   WHEN 'restore' THEN IF l.listing_status IN ('archived','deleted') THEN nextstate:='draft';END IF;
   WHEN 'delete' THEN IF l.listing_status IN ('draft','active','expired','archived') THEN nextstate:='deleted';END IF;
   ELSE NULL;
  END CASE;
  IF nextstate IS NULL THEN RAISE EXCEPTION 'invalid lifecycle transition' USING ERRCODE='22023'; END IF;
  observed:=clock_timestamp();
  IF nextstate='active' THEN
   amount:=twuanis_canonical_private.s3_decimal(v->'duration_seconds');
   IF amount<=0 OR amount<>trunc(amount) OR amount>315576000 THEN RAISE EXCEPTION 'bounded trusted duration required' USING ERRCODE='22023'; END IF;
   IF coalesce(CASE l.transaction_type WHEN 'sale' THEN l.current_price ELSE l.monthly_price END,0)<=0 OR l.currency NOT IN ('CRC','USD') THEN RAISE EXCEPTION 'publication requires monetary evidence' USING ERRCODE='23514'; END IF;
   IF own IS NOT NULL THEN
    SELECT a.allowance INTO allowance FROM twuanis_canonical_private.publisher_allowance(pub,own)a;
    used:=twuanis_canonical_private.publisher_consumption(pub,own);
    IF allowance IS NOT NULL AND ((l.listing_status='active' AND used>allowance) OR (l.listing_status<>'active' AND used>=allowance)) THEN RAISE EXCEPTION 'publication capacity exceeded' USING ERRCODE='23514'; END IF;
   END IF;
   IF ev='renew' AND l.publication_expires_at IS NULL THEN RAISE EXCEPTION 'renewal requires established deadline' USING ERRCODE='55000'; END IF;
   deadline:=greatest(observed,CASE WHEN ev='renew' AND l.listing_status='active' THEN l.publication_expires_at ELSE observed END)+amount*interval '1 second';
   l.publication_expires_at:=deadline;
  ELSIF v ? 'duration_seconds' THEN RAISE EXCEPTION 'duration only for publication/renewal' USING ERRCODE='22023'; END IF;
  CASE ev WHEN 'publish' THEN l.published_at:=observed; WHEN 'renew' THEN l.renewed_at:=observed;
   WHEN 'expire' THEN l.expired_at:=observed; WHEN 'archive' THEN l.archived_at:=observed; WHEN 'delete' THEN l.deleted_at:=observed; ELSE NULL; END CASE;
  l.listing_status:=nextstate;lifechanged:=true;changed:=true;
 END IF;
 IF p_source IS NOT NULL THEN
  l.first_seen:=least(l.first_seen,sourcetime);l.last_seen:=greatest(l.last_seen,sourcetime);l.last_scraped:=clock_timestamp();l.times_scraped:=coalesce(l.times_scraped,0)+1;changed:=true;
 END IF;
 finalrev:=oldrev+CASE WHEN changed THEN 1 ELSE 0 END;
 INSERT INTO public.canonical_operation_receipts(id,authority_kind,authority_identity,operation_type,request_id,payload_fingerprint,outcome,listing_id,result_revision)
 VALUES(rid,p_actor_kind,p_actor_identity,op,p_request,fingerprint,CASE WHEN changed THEN 'succeeded' ELSE 'noop' END,p_listing,finalrev);
 IF p_source IS NOT NULL THEN
  INSERT INTO public.listing_source_observations(id,source_name,source_listing_id,source_observation_id,listing_id,source_observed_at,outcome,payload_fingerprint,result_revision)
  VALUES(sourceid,l.source_name,l.source_listing_id,p_source->>'observation_id',p_listing,sourcetime,'accepted',sourcefp,finalrev);
 END IF;
 IF moneychanged THEN
  INSERT INTO public.listing_monetary_events(listing_id,operation_id,listing_revision,transaction_type,event_kind,old_amount,old_currency,new_amount,new_currency,actor_kind,actor_identity,reason,source_observation_id,source_observed_at)
  VALUES(p_listing,rid,finalrev,l.transaction_type,eventkind,oldamount,CASE WHEN oldamount IS NULL THEN NULL ELSE before_l.currency END,CASE l.transaction_type WHEN 'sale' THEN l.current_price ELSE l.monthly_price END,l.currency,p_actor_kind,p_actor_identity,p_domains->'money'->>'reason',CASE WHEN p_source IS NOT NULL THEN sourceid END,sourcetime);
 END IF;
 IF lifechanged THEN
  INSERT INTO public.listing_lifecycle_events(listing_id,operation_id,listing_revision,event_type,previous_state,resulting_state,actor_kind,actor_identity,reason,publication_expires_at)
  VALUES(p_listing,rid,finalrev,ev,before_l.listing_status,l.listing_status,p_actor_kind,p_actor_identity,p_domains->'lifecycle'->>'reason',l.publication_expires_at);
 END IF;
 IF changed THEN
  UPDATE public.listings SET province=l.province,canton=l.canton,district=l.district,
   province_normalized=l.province_normalized,canton_normalized=l.canton_normalized,district_normalized=l.district_normalized,
   property_type=l.property_type,utility=l.utility,environment=l.environment,terrain=l.terrain,accessibility=l.accessibility,legal_status=l.legal_status,
   bedrooms=l.bedrooms,bathrooms=l.bathrooms,parking=l.parking,year_built_range=l.year_built_range,distance_to_paved_road_range=l.distance_to_paved_road_range,
   property_area=l.property_area,construction_area=l.construction_area,current_price=l.current_price,monthly_price=l.monthly_price,currency=l.currency,
   listing_status=l.listing_status,publication_expires_at=l.publication_expires_at,published_at=l.published_at,renewed_at=l.renewed_at,expired_at=l.expired_at,archived_at=l.archived_at,deleted_at=l.deleted_at,
   first_seen=l.first_seen,last_seen=l.last_seen,last_scraped=l.last_scraped,times_scraped=l.times_scraped,canonical_revision=finalrev,updated_at=clock_timestamp()
  WHERE id=p_listing;
 END IF;
 RETURN jsonb_build_object('outcome',CASE WHEN changed THEN 'succeeded' ELSE 'noop' END,'revision',finalrev::text,'receipt_id',rid::text,'replayed',false);
END $$;
CREATE OR REPLACE FUNCTION twuanis_canonical_private.s3_command(
 p_listing uuid,p_expected bigint,p_actor_kind text,p_actor_identity text,p_request uuid,p_domains jsonb,p_source jsonb DEFAULT NULL
) RETURNS jsonb LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path=pg_catalog,pg_temp AS $$
 SELECT twuanis_canonical_private.s3_command_with_administrative_clear(p_listing,p_expected,p_actor_kind,p_actor_identity,p_request,p_domains,p_source,false);
$$;
REVOKE ALL ON FUNCTION twuanis_canonical_private.s3_command_with_administrative_clear(uuid,bigint,text,text,uuid,jsonb,jsonb,boolean) FROM PUBLIC,anon,authenticated,service_role;
ALTER FUNCTION twuanis_canonical_private.s3_command_with_administrative_clear(uuid,bigint,text,text,uuid,jsonb,jsonb,boolean) OWNER TO postgres;

CREATE TABLE twuanis_canonical_private.administrative_listing_receipts(
 actor_id uuid NOT NULL,request_id uuid NOT NULL,input jsonb NOT NULL,result jsonb NOT NULL,
 PRIMARY KEY(actor_id,request_id)
);
ALTER TABLE twuanis_canonical_private.administrative_listing_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON twuanis_canonical_private.administrative_listing_receipts FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER administrative_listing_receipts_immutable BEFORE UPDATE OR DELETE ON twuanis_canonical_private.administrative_listing_receipts FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.administrative_immutable();
CREATE TRIGGER administrative_listing_receipts_no_truncate BEFORE TRUNCATE ON twuanis_canonical_private.administrative_listing_receipts FOR EACH STATEMENT EXECUTE FUNCTION twuanis_canonical_private.administrative_immutable();

CREATE FUNCTION twuanis_canonical_private.admin_listing_snapshot(p_listing uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $$
 SELECT jsonb_build_object('revision',l.canonical_revision,'status',l.listing_status,'property_area',l.property_area,'construction_area',l.construction_area,'owner',l.owner_id,'origin',l.listing_origin,'source_name',l.source_name,'source_listing_id',l.source_listing_id,'source_type',l.listing_source_type,
 'content',jsonb_build_object('title',l.title,'description',l.description,'whatsapp',l.whatsapp),
 'money',jsonb_build_object('transaction',l.transaction_type,'current_price',l.current_price,'monthly_price',l.monthly_price,'currency',l.currency),
 'geography',jsonb_build_object('province',l.province,'canton',l.canton,'district',l.district),
 'facts',(SELECT coalesce(jsonb_agg(to_jsonb(f)),'[]') FROM public.listing_fact_evidence f WHERE f.listing_id=l.id),
 'selections',(SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]') FROM public.listing_semantic_selections t WHERE t.listing_id=l.id))
 FROM public.listings l WHERE l.id=p_listing;
$$;
REVOKE ALL ON FUNCTION twuanis_canonical_private.admin_listing_snapshot(uuid) FROM PUBLIC,anon,authenticated,service_role;
ALTER FUNCTION twuanis_canonical_private.admin_listing_snapshot(uuid) OWNER TO postgres;

CREATE FUNCTION public.admin_listing_command(p_request uuid,p_command jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid; authority text; old twuanis_canonical_private.administrative_listing_receipts%ROWTYPE;
 l public.listings%ROWTYPE; result jsonb; d jsonb; clears jsonb:='{}'; content jsonb; item record; group_name text; sets uuid[];
 operation text; origin text; target uuid; customer uuid; source jsonb; expected bigint; prior timestamptz; reason text;
 before_state jsonb; after_state jsonb; event_id bigint; normalized jsonb;
BEGIN
 actor:=twuanis_canonical_private.assert_administrative_permission('listings.manage');
 authority:=CASE WHEN public.is_current_user_owner() THEN 'Owner' ELSE 'Administrator' END;
 IF p_request IS NULL OR p_command IS NULL OR jsonb_typeof(p_command)<>'object' OR octet_length(p_command::text)>98304 THEN RAISE EXCEPTION 'bounded command required' USING ERRCODE='22023'; END IF;
 PERFORM twuanis_canonical_private.s3_keys(p_command,ARRAY['operation','listing','expected','prior_updated_at','reason','origin','customer','source','input','domains','content'],ARRAY['operation']);
 operation:=p_command->>'operation';reason:=p_command->>'reason';
 IF operation IS NULL OR operation NOT IN ('create','edit','archive','restore','delete') THEN RAISE EXCEPTION 'invalid operation' USING ERRCODE='22023'; END IF;
 IF length(reason)>2000 OR (operation IN ('archive','delete') AND nullif(btrim(reason),'') IS NULL) THEN RAISE EXCEPTION 'bounded reason required' USING ERRCODE='22023'; END IF;
 SELECT * INTO old FROM twuanis_canonical_private.administrative_listing_receipts WHERE actor_id=actor AND request_id=p_request;
 IF FOUND THEN
  IF old.input IS DISTINCT FROM p_command THEN RAISE EXCEPTION 'request reuse mismatch' USING ERRCODE='22023'; END IF;
  RETURN old.result||'{"replayed":true}'::jsonb;
 END IF;
 IF operation='create' THEN
  PERFORM twuanis_canonical_private.s3_keys(p_command,ARRAY['operation','reason','origin','customer','source','input'],ARRAY['operation','origin','input']);
  origin:=p_command->>'origin';
  IF origin IS NULL OR origin NOT IN ('customer','system','imported') THEN RAISE EXCEPTION 'explicit origin required' USING ERRCODE='22023'; END IF;
  IF origin='customer' THEN
   customer:=(p_command->>'customer')::uuid;
   IF customer IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=customer) OR p_command ? 'source' THEN RAISE EXCEPTION 'explicit existing customer required' USING ERRCODE='22023'; END IF;
  ELSIF origin='imported' THEN
   source:=p_command->'source';
   IF source IS NULL OR jsonb_typeof(source)<>'object' OR p_command ? 'customer' THEN RAISE EXCEPTION 'explicit source required' USING ERRCODE='22023'; END IF;
  ELSIF p_command ? 'source' OR p_command ? 'customer' THEN RAISE EXCEPTION 'system origin has no owner or source' USING ERRCODE='22023'; END IF;
  -- A distinct internal request prevents cross-administrator request collisions in shared trusted scope.
  result:=twuanis_canonical_private.s4_create_core(customer,gen_random_uuid(),p_command->'input',source);
  target:=(result->>'listing_id')::uuid;
  IF origin='imported' THEN
   INSERT INTO twuanis_canonical_private.source_ingestion_state(source_name,source_listing_id,listing_id)
    VALUES(source->>'source_name',source->>'source_listing_id',target);
  END IF;
 ELSE
  PERFORM twuanis_canonical_private.s3_keys(p_command,ARRAY['operation','listing','expected','prior_updated_at','reason','domains','content'],ARRAY['operation','listing','expected','prior_updated_at']);
  target:=(p_command->>'listing')::uuid;expected:=(p_command->>'expected')::bigint;prior:=(p_command->>'prior_updated_at')::timestamptz;
  -- Use the same capacity/publisher-before-listing lock order as canonical domain execution.
  SELECT * INTO l FROM public.listings WHERE id=target;
  IF NOT FOUND THEN RAISE EXCEPTION 'listing unavailable' USING ERRCODE='P0002'; END IF;
  IF l.publisher_account_id IS NOT NULL THEN PERFORM twuanis_canonical_private.lock_publisher(l.publisher_account_id); ELSE PERFORM twuanis_canonical_private.lock_capacity_policy(false); END IF;
  SELECT * INTO l FROM public.listings WHERE id=target FOR UPDATE;
  IF l.canonical_domain_version IS DISTINCT FROM 1 OR expected IS DISTINCT FROM l.canonical_revision OR prior IS DISTINCT FROM l.updated_at THEN RAISE EXCEPTION 'stale or noncanonical listing' USING ERRCODE='40001'; END IF;
  before_state:=twuanis_canonical_private.admin_listing_snapshot(target);
  IF operation='delete' THEN
   -- Every canonical listing has immutable creation/history evidence. No physical deletion bypass.
   result:=jsonb_build_object('ok',false,'code','CANONICAL_HISTORY_PREVENTS_DELETE','listing_id',target);
  ELSE
   IF operation='edit' THEN
    d:=coalesce(p_command->'domains','{}');content:=coalesce(p_command->'content','{}');
    IF d ? 'lifecycle' THEN RAISE EXCEPTION 'separate lifecycle operation required' USING ERRCODE='22023'; END IF;
    -- Keep ordinary s4_domains customer/source CLEAR rejection unchanged.
    FOR item IN SELECT key,value FROM jsonb_each(coalesce(d->'measurements','{}')) LOOP
     IF item.value='{"kind":"clear"}'::jsonb THEN
      IF item.key NOT IN ('property_area','construction_area') THEN RAISE EXCEPTION 'unsupported clear'; END IF;
      clears:=clears||jsonb_build_object(item.key,item.value);d:=d#-ARRAY['measurements',item.key];
     END IF;
    END LOOP;
    d:=twuanis_canonical_private.s4_domains(d,'manual');
    IF clears<>'{}'::jsonb THEN d:=jsonb_set(d,'{measurements}',coalesce(d->'measurements','{}')||clears); END IF;
    FOREACH group_name IN ARRAY ARRAY['facts','measurements'] LOOP
     FOR item IN SELECT key,value FROM jsonb_each(coalesce(d->group_name,'{}')) LOOP
      IF item.value='{"kind":"clear"}'::jsonb OR (group_name='facts' AND item.value->>'kind'<>'exact') THEN CONTINUE; END IF;
      SELECT array_agg(DISTINCT r.rule_set_id) INTO sets FROM public.listing_membership_origins m JOIN public.listing_classification_rules r ON r.id=m.classification_rule_id WHERE m.listing_id=target AND m.origin_domain=item.key;
      IF sets IS NOT NULL THEN
       IF cardinality(sets)<>1 THEN RAISE EXCEPTION 'ambiguous recorded classification'; END IF;
       d:=jsonb_set(d,ARRAY[group_name,item.key,'rule_set'],to_jsonb(sets[1]::text));
      END IF;
     END LOOP;
    END LOOP;
    PERFORM twuanis_canonical_private.s3_keys(content,ARRAY['title','description','whatsapp']);
    FOR item IN SELECT key,value FROM jsonb_each(content) LOOP
     IF jsonb_typeof(item.value)<>'string' OR length(item.value#>>'{}')>(CASE item.key WHEN 'title' THEN 512 WHEN 'description' THEN 16000 ELSE 256 END) THEN RAISE EXCEPTION 'bounded content required'; END IF;
    END LOOP;
   ELSE
    IF p_command ? 'domains' OR p_command ? 'content' THEN RAISE EXCEPTION 'unexpected lifecycle payload'; END IF;
    content:='{}';d:=jsonb_build_object('lifecycle',jsonb_build_object('event',operation,'reason',reason));
   END IF;
   result:=twuanis_canonical_private.s3_command_with_administrative_clear(target,expected,'trusted','admin:'||actor::text,gen_random_uuid(),d,NULL,true)||jsonb_build_object('listing_id',target,'ok',true);
   IF operation='edit' AND content<>'{}'::jsonb THEN
    UPDATE public.listings SET title=CASE WHEN content?'title' THEN content->>'title' ELSE title END,description=CASE WHEN content?'description' THEN content->>'description' ELSE description END,whatsapp=CASE WHEN content?'whatsapp' THEN content->>'whatsapp' ELSE whatsapp END,updated_at=clock_timestamp() WHERE id=target;
   END IF;
  END IF;
 END IF;
 after_state:=twuanis_canonical_private.admin_listing_snapshot(target);
 event_id:=twuanis_canonical_private.append_administrative_event(actor,authority,'listings.manage','listing.'||operation,'listing',target,before_state,after_state,reason,p_request,CASE WHEN operation='delete' THEN 'denied' ELSE 'succeeded' END);
 result:=result||jsonb_build_object('eventId',event_id::text,'replayed',false);
 INSERT INTO twuanis_canonical_private.administrative_listing_receipts VALUES(actor,p_request,p_command,result);
 RETURN result;
END $$;
ALTER FUNCTION public.admin_listing_command(uuid,jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.admin_listing_command(uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.admin_listing_command(uuid,jsonb) TO authenticated;
COMMIT;
