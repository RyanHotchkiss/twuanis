-- S7 explicit customer measurement CLEAR. Closed migration files remain unchanged.
-- Existing functions reproduced with only CLEAR validation/derivation changes.
BEGIN;
CREATE OR REPLACE FUNCTION twuanis_canonical_private.s4_domains(d jsonb,evidence_kind text) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path=pg_catalog,pg_temp AS $$
DECLARE x record; g text; k text; ids bigint[]; n integer:=0;
BEGIN
 IF octet_length(d::text)>65536 THEN RAISE EXCEPTION 'domain payload bound' USING ERRCODE='54000'; END IF;
 PERFORM twuanis_canonical_private.s3_keys(d,ARRAY['geography','semantics','facts','measurements','money','lifecycle']);
 IF evidence_kind NOT IN ('owner','source','manual') OR evidence_kind IS NULL THEN RAISE EXCEPTION 'internal evidence authority required' USING ERRCODE='22023'; END IF;
 IF d ? 'semantics' THEN
  PERFORM twuanis_canonical_private.s3_keys(d->'semantics',ARRAY['property_type','utility','environment','terrain','accessibility','legal_status']);
  FOR x IN SELECT key,value FROM jsonb_each(d->'semantics') LOOP
   ids:=twuanis_canonical_private.s3_term_ids(x.value);n:=n+cardinality(ids);
   d:=jsonb_set(d,ARRAY['semantics',x.key],coalesce((SELECT jsonb_agg(v::text ORDER BY v) FROM unnest(ids)v),'[]'));
  END LOOP;
  IF n>64 THEN RAISE EXCEPTION 'semantic command bound' USING ERRCODE='54000'; END IF;
 END IF;
 IF d ? 'facts' THEN
  PERFORM twuanis_canonical_private.s3_keys(d->'facts',ARRAY['bedrooms','bathrooms','parking','year_built','distance_to_paved_road']);
  FOR x IN SELECT key,value FROM jsonb_each(d->'facts') LOOP
   PERFORM twuanis_canonical_private.s3_keys(x.value,ARRAY['kind','value','term','lower','upper','lower_inclusive','upper_inclusive','reference'],ARRAY['kind']);
   IF x.value->>'kind'<>'clear' THEN d:=jsonb_set(d,ARRAY['facts',x.key,'source'],to_jsonb(evidence_kind)); END IF;
  END LOOP;
 END IF;
 IF d ? 'measurements' THEN
  PERFORM twuanis_canonical_private.s3_keys(d->'measurements',ARRAY['property_area','construction_area']);
  FOR x IN SELECT key,value FROM jsonb_each(d->'measurements') LOOP
   IF x.value='{"kind":"clear"}'::jsonb THEN
    IF evidence_kind<>'owner' THEN RAISE EXCEPTION 'measurement clear requires customer authority' USING ERRCODE='42501'; END IF;
   ELSE
    PERFORM twuanis_canonical_private.s3_keys(x.value,ARRAY['value'],ARRAY['value']);
   END IF;
  END LOOP;
 END IF;
 FOREACH g IN ARRAY ARRAY['facts','measurements'] LOOP
  FOR x IN SELECT key,value FROM jsonb_each(coalesce(d->g,'{}')) LOOP
   FOREACH k IN ARRAY ARRAY['value','lower','upper'] LOOP
    IF x.value ? k AND x.value->k<>'null'::jsonb THEN d:=jsonb_set(d,ARRAY[g,x.key,k],to_jsonb(trim_scale(twuanis_canonical_private.s3_decimal(x.value->k))::text)); END IF;
   END LOOP;
  END LOOP;
 END LOOP;
 IF d ? 'money' THEN
  PERFORM twuanis_canonical_private.s3_keys(d->'money',ARRAY['amount','currency','reason'],ARRAY['amount','currency']);
  d:=jsonb_set(d,'{money,amount}',to_jsonb(trim_scale(twuanis_canonical_private.s3_decimal(d->'money'->'amount'))::text));
 END IF;
 IF d ? 'geography' THEN
  PERFORM twuanis_canonical_private.s3_keys(d->'geography',ARRAY['province','canton','district'],ARRAY['province','canton']);
  d:=jsonb_set(d,'{geography}',jsonb_build_object('district',NULL)||(d->'geography'));
 END IF;
 RETURN d;
END $$;

CREATE OR REPLACE FUNCTION twuanis_canonical_private.s3_command(
 p_listing uuid,p_expected bigint,p_actor_kind text,p_actor_identity text,p_request uuid,p_domains jsonb,p_source jsonb DEFAULT NULL
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
   IF p_actor_kind<>'owner' THEN RAISE EXCEPTION 'measurement clear requires customer authority' USING ERRCODE='42501'; END IF;
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

CREATE OR REPLACE FUNCTION public.mutate_customer_canonical_listing(p_listing uuid,p_expected bigint,p_request uuid,p_domains jsonb) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); d jsonb; original jsonb; snapshot twuanis_canonical_private.customer_domain_edits%ROWTYPE;
 item record; sets uuid[]; group_name text; dim text; l public.listings%ROWTYPE;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'authenticated customer required' USING ERRCODE='42501'; END IF;
 IF p_request IS NULL OR p_expected IS NULL OR p_expected<1 THEN RAISE EXCEPTION 'explicit request/revision required' USING ERRCODE='22023'; END IF;
 d:=twuanis_canonical_private.s4_domains(p_domains,'owner'); original:=d;
 IF d ? 'lifecycle' THEN
  PERFORM twuanis_canonical_private.s3_keys(d->'lifecycle',ARRAY['event','reason'],ARRAY['event']);
  IF d->'lifecycle'->>'event' IN ('publish','renew') THEN RAISE EXCEPTION 'owner publication requires trusted duration policy' USING ERRCODE='0A000'; END IF;
 END IF;
 PERFORM twuanis_canonical_private.ensure_publisher_account(actor);
 PERFORM pg_advisory_xact_lock(3104,hashtext(jsonb_build_array('owner',actor::text,'domain_mutation',p_request)::text));
 SELECT * INTO snapshot FROM twuanis_canonical_private.customer_domain_edits WHERE owner_id=actor AND request_id=p_request;
 IF FOUND THEN
  IF snapshot.listing_id IS DISTINCT FROM p_listing OR snapshot.expected_revision IS DISTINCT FROM p_expected OR snapshot.input IS DISTINCT FROM original THEN RAISE EXCEPTION 'edit idempotency conflict' USING ERRCODE='22023'; END IF;
  d:=snapshot.derived;
 ELSE
  SELECT * INTO l FROM public.listings WHERE id=p_listing AND owner_id=actor FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'owner required' USING ERRCODE='42501'; END IF;
  IF l.canonical_domain_version IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'canonical listing required' USING ERRCODE='55000'; END IF;
  -- Receipts from before this migration retain their original payload semantics.
  IF NOT EXISTS(SELECT 1 FROM public.canonical_operation_receipts WHERE authority_kind='owner' AND authority_identity=actor::text AND operation_type='domain_mutation' AND request_id=p_request) THEN
  IF d->'facts'->'distance_to_paved_road'->>'kind'='range' AND EXISTS(SELECT 1 FROM public.listing_fact_evidence WHERE listing_id=p_listing AND dimension='distance_to_paved_road' AND kind='exact') THEN
   RAISE EXCEPTION 'Existing exact road-distance evidence cannot be replaced by a range' USING ERRCODE='22023';
  END IF;
   FOREACH group_name IN ARRAY ARRAY['facts','measurements'] LOOP
    FOR item IN SELECT key,value FROM jsonb_each(coalesce(d->group_name,'{}')) LOOP
     dim:=item.key;
     IF group_name='facts' AND item.value->>'kind' IS DISTINCT FROM 'exact' THEN CONTINUE; END IF;
     IF group_name='measurements' AND item.value='{"kind":"clear"}'::jsonb THEN CONTINUE; END IF;
     SELECT array_agg(DISTINCT r.rule_set_id) INTO sets FROM public.listing_membership_origins m JOIN public.listing_classification_rules r ON r.id=m.classification_rule_id WHERE m.listing_id=p_listing AND m.origin_domain=dim AND m.classification_rule_id IS NOT NULL;
     IF sets IS NOT NULL THEN
      IF cardinality(sets)<>1 OR NOT EXISTS(SELECT 1 FROM public.listing_classification_rule_sets r JOIN twuanis_canonical_private.classification_seals s ON s.rule_set_id=r.id WHERE r.id=sets[1] AND r.domain=dim) THEN RAISE EXCEPTION 'one recorded sealed typed rule required' USING ERRCODE='55000'; END IF;
      d:=jsonb_set(d,ARRAY[group_name,dim,'rule_set'],to_jsonb(sets[1]::text));
     END IF;
    END LOOP;
   END LOOP;
  END IF;
  INSERT INTO twuanis_canonical_private.customer_domain_edits VALUES(actor,p_request,p_listing,p_expected,original,d);
 END IF;
 RETURN twuanis_canonical_private.s3_command(p_listing,p_expected,'owner',actor::text,p_request,d,NULL)||jsonb_build_object('listing_id',p_listing::text);
END $$;

COMMIT;
