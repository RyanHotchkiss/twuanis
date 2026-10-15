BEGIN;
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
COMMIT;
