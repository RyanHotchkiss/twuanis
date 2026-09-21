-- CG-3B2B2-S4: dormant controlled authority and creation. NO application adapters.
-- Existing S1/S2/S3 artifacts are immutable. No production/cutover authorization.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';

-- Internal transport validation/normalization. The wrapper, never its JSON caller,
-- supplies evidence authority. No consumer can select a classification policy.
CREATE FUNCTION twuanis_canonical_private.s4_domains(d jsonb,evidence_kind text) RETURNS jsonb
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
   PERFORM twuanis_canonical_private.s3_keys(x.value,ARRAY['value'],ARRAY['value']);
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

CREATE FUNCTION twuanis_canonical_private.s4_create_core(p_owner uuid,p_request uuid,p_input jsonb,p_source jsonb DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog,pg_temp AS $$
DECLARE
 l public.listings%ROWTYPE; p_listing uuid:=gen_random_uuid(); pub uuid; actor text; kind text; op text; rid uuid:=gen_random_uuid(); obsid uuid:=gen_random_uuid();
 receipt public.canonical_operation_receipts%ROWTYPE; existing public.listings%ROWTYPE; previous_obs public.listing_source_observations%ROWTYPE;
 p_domains jsonb; body jsonb; content jsonb; fingerprint text; sourcefp text; sourcectx jsonb; observed timestamptz; geo bigint[];
 item record; termrow record; v jsonb; dim text; ids bigint[]; oldids bigint[]; labels text[]; tags text[];
 f public.listing_fact_evidence%ROWTYPE; oldf jsonb; ruleid uuid; ruleset uuid; band bigint; amount numeric; oldamount numeric; newcurrency text;
 changed boolean:=false; moneychanged boolean:=false; eventkind text; c text;
BEGIN
 IF current_setting('transaction_isolation')<>'read committed' THEN RAISE EXCEPTION 'READ COMMITTED required' USING ERRCODE='0A000'; END IF;
 IF octet_length(p_input::text)>65536 OR octet_length(p_source::text)>8192 THEN RAISE EXCEPTION 'creation payload bound' USING ERRCODE='54000'; END IF;
 IF p_request IS NULL THEN RAISE EXCEPTION 'request identity required' USING ERRCODE='22023'; END IF;
 PERFORM twuanis_canonical_private.s3_keys(p_input,ARRAY['transaction','geography','semantics','facts','measurements','money','content'],ARRAY['transaction','geography','semantics']);
 IF jsonb_typeof(p_input->'transaction') IS DISTINCT FROM 'string' OR p_input->>'transaction' NOT IN ('sale','rent') THEN RAISE EXCEPTION 'explicit sale/rent required' USING ERRCODE='22023'; END IF;
 p_domains:=twuanis_canonical_private.s4_domains(p_input-ARRAY['transaction','content'],CASE WHEN p_owner IS NOT NULL THEN 'owner' WHEN p_source IS NOT NULL THEN 'source' ELSE 'manual' END);
 IF NOT (p_domains->'semantics') ? 'property_type' OR cardinality(twuanis_canonical_private.s3_term_ids(p_domains->'semantics'->'property_type'))<>1 THEN RAISE EXCEPTION 'exactly one property type required' USING ERRCODE='23514'; END IF;
 content:=coalesce(p_input->'content','{}');PERFORM twuanis_canonical_private.s3_keys(content,ARRAY['title','description','whatsapp']);
 FOREACH c IN ARRAY ARRAY['title','description','whatsapp'] LOOP
  IF content ? c AND (jsonb_typeof(content->c) IS DISTINCT FROM 'string' OR length(content->>c)>CASE c WHEN 'title' THEN 512 WHEN 'description' THEN 16000 ELSE 256 END) THEN RAISE EXCEPTION 'bounded text content required' USING ERRCODE='22023'; END IF;
 END LOOP;
 IF p_owner IS NOT NULL THEN
  IF p_source IS NOT NULL THEN RAISE EXCEPTION 'customer cannot establish source authority' USING ERRCODE='42501'; END IF;
  kind:='owner';actor:=p_owner::text;op:='create_customer';pub:=twuanis_canonical_private.ensure_publisher_account(p_owner);
 ELSE
  kind:='trusted';actor:='service_role';op:='create_trusted';PERFORM twuanis_canonical_private.lock_capacity_policy(false);
 END IF;
 IF p_source IS NOT NULL THEN
  PERFORM twuanis_canonical_private.s3_keys(p_source,ARRAY['source_name','source_listing_id','observation_id','observed_at','source_type'],ARRAY['source_name','source_listing_id','observation_id','observed_at','source_type']);
  FOREACH c IN ARRAY ARRAY['source_name','source_listing_id','observation_id'] LOOP
   IF jsonb_typeof(p_source->c) IS DISTINCT FROM 'string' OR length(p_source->>c) NOT BETWEEN 1 AND (CASE WHEN c='source_name' THEN 128 ELSE 256 END) OR (p_source->>c) COLLATE "C" !~ '[^[:space:]]' THEN RAISE EXCEPTION 'opaque source identity invalid' USING ERRCODE='22023'; END IF;
  END LOOP;
  IF p_source->>'source_type' IS NULL OR p_source->>'source_type' NOT IN ('realtor','bank_remate','developer','brokerage','government','owner_direct','unknown') THEN RAISE EXCEPTION 'trusted source type required' USING ERRCODE='22023'; END IF;
  observed:=(p_source->>'observed_at')::timestamptz;
  IF observed IS NULL OR NOT isfinite(observed) THEN RAISE EXCEPTION 'observation time required' USING ERRCODE='22023'; END IF;
  p_source:=jsonb_set(p_source,'{observed_at}',to_jsonb(to_char(observed AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')));
  PERFORM pg_advisory_xact_lock(3103,hashtext(jsonb_build_array(p_source->>'source_name',p_source->>'source_listing_id')::text));
 END IF;
 body:=jsonb_build_object('transaction',p_input->'transaction','domains',p_domains,'content',content,'source',p_source);
 fingerprint:=encode(sha256(convert_to(body::text,'UTF8')),'hex');
 PERFORM pg_advisory_xact_lock(3104,hashtext(jsonb_build_array(kind,actor,op,p_request)::text));
 SELECT * INTO receipt FROM public.canonical_operation_receipts WHERE authority_kind=kind AND authority_identity=actor AND operation_type=op AND request_id=p_request;
 IF FOUND THEN
  IF receipt.payload_fingerprint<>fingerprint THEN RAISE EXCEPTION 'creation idempotency conflict' USING ERRCODE='22023'; END IF;
  RETURN jsonb_build_object('listing_id',receipt.listing_id::text,'revision',receipt.result_revision::text,'receipt_id',receipt.id::text,'replayed',true);
 END IF;
 IF p_source IS NOT NULL THEN
  SELECT * INTO existing FROM public.listings WHERE source_name=p_source->>'source_name' AND source_listing_id=p_source->>'source_listing_id';
  IF FOUND THEN
   IF existing.canonical_domain_version IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'existing source requires reconciliation' USING ERRCODE='55000'; END IF;
   SELECT * INTO previous_obs FROM public.listing_source_observations WHERE source_name=existing.source_name AND source_listing_id=existing.source_listing_id AND source_observation_id=p_source->>'observation_id';
   IF NOT FOUND THEN RAISE EXCEPTION 'existing source: use controlled source mutation' USING ERRCODE='55000'; END IF;
   SELECT r.* INTO STRICT receipt FROM public.canonical_operation_receipts r
    JOIN public.listing_lifecycle_events e ON e.operation_id=r.id AND e.listing_id=r.listing_id AND e.event_type='create'
    WHERE r.listing_id=existing.id AND r.operation_type='create_trusted' AND r.authority_kind='trusted' AND r.authority_identity=actor;
   IF receipt.payload_fingerprint<>fingerprint THEN RAISE EXCEPTION 'source creation identity/payload conflict' USING ERRCODE='22023'; END IF;
   -- Bind this new operation identity even when source identity already proves
   -- replay. Otherwise it could later be reused for a materially different create.
   INSERT INTO public.canonical_operation_receipts(id,authority_kind,authority_identity,operation_type,request_id,payload_fingerprint,outcome,listing_id,result_revision)
   VALUES(rid,kind,actor,op,p_request,fingerprint,'succeeded',existing.id,receipt.result_revision);
   RETURN jsonb_build_object('listing_id',existing.id::text,'revision',receipt.result_revision::text,'receipt_id',rid::text,'replayed',true);
  END IF;
 END IF;
 -- Explicit draft and transaction. CRC without any amount is a storage placeholder
 -- required by the existing NOT NULL column, never a monetary observation/history.
 INSERT INTO public.listings(id,owner_id,publisher_account_id,transaction_type,listing_status,currency,listing_origin,listing_source_type,
  canonical_revision,canonical_domain_version,title,description,whatsapp,source_name,source_listing_id,current_price,monthly_price)
 VALUES(p_listing,p_owner,pub,p_input->>'transaction','draft',coalesce(p_domains->'money'->>'currency','CRC'),
  CASE WHEN p_owner IS NOT NULL THEN 'customer' WHEN p_source IS NOT NULL THEN 'imported' ELSE 'system' END,
  CASE WHEN p_owner IS NOT NULL THEN 'customer' WHEN p_source IS NOT NULL THEN p_source->>'source_type' ELSE 'unknown' END,
  0,NULL,content->>'title',content->>'description',content->>'whatsapp',p_source->>'source_name',p_source->>'source_listing_id',NULL,NULL)
 RETURNING * INTO l;
 geo:=twuanis_canonical_private.s3_geography(p_domains->'geography');
 PERFORM twuanis_canonical_private.s3_origins(p_listing,'geography',geo);
 SELECT term_name INTO l.province FROM public.ontology_terms WHERE id=geo[1];
 SELECT term_name INTO l.canton FROM public.ontology_terms WHERE id=geo[2];
 SELECT term_name INTO l.district FROM public.ontology_terms WHERE id=geo[3];
 l.province_normalized:=twuanis_private.normalize_geographic_projection(l.province);
 l.canton_normalized:=twuanis_private.normalize_geographic_projection(l.canton);
 l.district_normalized:=twuanis_private.normalize_geographic_projection(l.district);
 -- Creation-specific population below mirrors the closed S3 domain validation,
 -- using its pure validators/origin helper and S1 constraints. It does not invoke
 -- s3_command on a prematurely eligible row or rewrite that closed command.
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
 INSERT INTO public.canonical_operation_receipts(id,authority_kind,authority_identity,operation_type,request_id,payload_fingerprint,outcome,listing_id,result_revision)
 VALUES(rid,kind,actor,op,p_request,fingerprint,'succeeded',p_listing,1);
 IF p_source IS NOT NULL THEN
  sourcectx:=(p_source-'source_type')||jsonb_build_object('transaction',l.transaction_type,'geography',p_domains->'geography');
  sourcefp:=encode(sha256(convert_to(jsonb_build_object('listing',p_listing,'source',sourcectx,'domains',p_domains)::text,'UTF8')),'hex');
  INSERT INTO public.listing_source_observations(id,source_name,source_listing_id,source_observation_id,listing_id,source_observed_at,outcome,payload_fingerprint,result_revision)
  VALUES(obsid,l.source_name,l.source_listing_id,p_source->>'observation_id',p_listing,observed,'accepted',sourcefp,1);
  l.first_seen:=observed;l.last_seen:=observed;l.last_scraped:=clock_timestamp();l.times_scraped:=1;
 END IF;
 INSERT INTO public.listing_lifecycle_events(listing_id,operation_id,listing_revision,event_type,previous_state,resulting_state,actor_kind,actor_identity)
 VALUES(p_listing,rid,1,'create',NULL,'draft',kind,actor);
 IF moneychanged THEN
  INSERT INTO public.listing_monetary_events(listing_id,operation_id,listing_revision,transaction_type,event_kind,old_amount,old_currency,new_amount,new_currency,actor_kind,actor_identity,reason,source_observation_id,source_observed_at)
  VALUES(p_listing,rid,1,l.transaction_type,'initial_observation',NULL,NULL,CASE l.transaction_type WHEN 'sale' THEN l.current_price ELSE l.monthly_price END,l.currency,kind,actor,p_domains->'money'->>'reason',CASE WHEN p_source IS NOT NULL THEN obsid END,observed);
 END IF;
 -- Eligibility and coherent projections are established in the final row write,
 -- after required semantic/fact/member/history/receipt work, all in one transaction.
 UPDATE public.listings SET province=l.province,canton=l.canton,district=l.district,
  province_normalized=l.province_normalized,canton_normalized=l.canton_normalized,district_normalized=l.district_normalized,
  property_type=l.property_type,utility=l.utility,environment=l.environment,terrain=l.terrain,accessibility=l.accessibility,legal_status=l.legal_status,
  bedrooms=l.bedrooms,bathrooms=l.bathrooms,parking=l.parking,year_built_range=l.year_built_range,distance_to_paved_road_range=l.distance_to_paved_road_range,
  property_area=l.property_area,construction_area=l.construction_area,current_price=l.current_price,monthly_price=l.monthly_price,currency=l.currency,
  first_seen=l.first_seen,last_seen=l.last_seen,last_scraped=l.last_scraped,times_scraped=coalesce(l.times_scraped,0),
  canonical_revision=1,canonical_domain_version=1,updated_at=clock_timestamp() WHERE id=p_listing;
 RETURN jsonb_build_object('listing_id',p_listing::text,'revision','1','receipt_id',rid::text,'replayed',false);
END $$;

CREATE FUNCTION public.create_customer_canonical_listing(p_request uuid,p_input jsonb) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=auth.uid();
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'authenticated customer required' USING ERRCODE='42501'; END IF;
 RETURN twuanis_canonical_private.s4_create_core(actor,p_request,p_input,NULL);
END $$;
CREATE FUNCTION public.create_trusted_canonical_listing(p_request uuid,p_input jsonb,p_source jsonb DEFAULT NULL) RETURNS jsonb
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
 SELECT twuanis_canonical_private.s4_create_core(NULL,p_request,p_input,p_source);
$$;
CREATE FUNCTION public.mutate_customer_canonical_listing(p_listing uuid,p_expected bigint,p_request uuid,p_domains jsonb) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=auth.uid();d jsonb;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'authenticated customer required' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.listings WHERE id=p_listing AND owner_id=actor) THEN RAISE EXCEPTION 'owner required' USING ERRCODE='42501'; END IF;
 d:=twuanis_canonical_private.s4_domains(p_domains,'owner');
 IF d ? 'lifecycle' THEN
  PERFORM twuanis_canonical_private.s3_keys(d->'lifecycle',ARRAY['event','reason'],ARRAY['event']);
  IF d->'lifecycle'->>'event' IN ('publish','renew') THEN RAISE EXCEPTION 'owner publication requires future trusted duration policy' USING ERRCODE='0A000'; END IF;
 END IF;
 RETURN twuanis_canonical_private.s3_command(p_listing,p_expected,'owner',actor::text,p_request,d,NULL)||jsonb_build_object('listing_id',p_listing::text);
END $$;
CREATE FUNCTION public.mutate_trusted_canonical_listing(p_listing uuid,p_expected bigint,p_request uuid,p_domains jsonb,p_source jsonb DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE d jsonb;source_name text;
BEGIN
 IF octet_length(p_source::text)>8192 THEN RAISE EXCEPTION 'source payload bound' USING ERRCODE='54000'; END IF;
 SELECT l.source_name INTO source_name FROM public.listings l WHERE l.id=p_listing;
 IF NOT FOUND THEN RAISE EXCEPTION 'listing missing' USING ERRCODE='P0002'; END IF;
 IF source_name IS NOT NULL AND p_source IS NULL THEN RAISE EXCEPTION 'source-backed mutation requires observation evidence' USING ERRCODE='22023'; END IF;
 d:=twuanis_canonical_private.s4_domains(p_domains,CASE WHEN p_source IS NULL THEN 'manual' ELSE 'source' END);
 RETURN twuanis_canonical_private.s3_command(p_listing,p_expected,'trusted','service_role',p_request,d,p_source)||jsonb_build_object('listing_id',p_listing::text);
END $$;

ALTER FUNCTION twuanis_canonical_private.s4_domains(jsonb,text) OWNER TO postgres;
ALTER FUNCTION twuanis_canonical_private.s4_create_core(uuid,uuid,jsonb,jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION twuanis_canonical_private.s4_domains(jsonb,text),twuanis_canonical_private.s4_create_core(uuid,uuid,jsonb,jsonb) FROM PUBLIC,anon,authenticated,service_role;
ALTER FUNCTION public.create_customer_canonical_listing(uuid,jsonb) OWNER TO postgres;
ALTER FUNCTION public.create_trusted_canonical_listing(uuid,jsonb,jsonb) OWNER TO postgres;
ALTER FUNCTION public.mutate_customer_canonical_listing(uuid,bigint,uuid,jsonb) OWNER TO postgres;
ALTER FUNCTION public.mutate_trusted_canonical_listing(uuid,bigint,uuid,jsonb,jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.create_customer_canonical_listing(uuid,jsonb),public.create_trusted_canonical_listing(uuid,jsonb,jsonb),public.mutate_customer_canonical_listing(uuid,bigint,uuid,jsonb),public.mutate_trusted_canonical_listing(uuid,bigint,uuid,jsonb,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.create_customer_canonical_listing(uuid,jsonb),public.mutate_customer_canonical_listing(uuid,bigint,uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_trusted_canonical_listing(uuid,jsonb,jsonb),public.mutate_trusted_canonical_listing(uuid,bigint,uuid,jsonb,jsonb) TO service_role;
COMMIT;
