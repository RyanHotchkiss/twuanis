BEGIN;
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
END$function$

COMMIT;
