import json,pathlib,hashlib
P=pathlib.Path('/private/tmp/twuanis-orch-final-01');base={r[0]:r[1]for r in json.loads((P/'baseline-functions.json').read_text())};sig='twuanis_canonical_private.evidence_v2_validate(jsonb,uuid,uuid,uuid)';s=base[sig]
# Only the execution-local lookup representation changes. All integrity predicates remain.
s=s.replace(' PERFORM twuanis_canonical_private.evidence_v2_call_relationships(body);',' PERFORM twuanis_canonical_private.evidence_v2_call_relationships(body);\n -- Release duplicate graph variables before traversal; authoritative nodes remain indexed.\n nodes:=NULL;ev:=NULL;')
s=s.replace('FOR entry IN SELECT * FROM jsonb_each(nodes) LOOP','FOR entry IN SELECT node_id AS key,node AS value FROM pg_temp.twuanis_evidence_validation_nodes LOOP')
s=s.replace('OR NOT nodes?ref','OR NOT EXISTS(SELECT 1 FROM pg_temp.twuanis_evidence_validation_nodes lookup WHERE lookup.node_id=ref)')
s=s.replace(" FOR rec IN SELECT value FROM jsonb_array_elements(ev->'records') LOOP IF jsonb_typeof(rec)<>'object' OR jsonb_typeof(rec->'kind') IS DISTINCT FROM 'string' OR NOT nodes?(rec->>'contentId') THEN RAISE EXCEPTION 'Incomplete evidence root';END IF;END LOOP;", " FOR rec IN SELECT value FROM jsonb_array_elements(body#>'{immutableEvidence,records}') LOOP IF jsonb_typeof(rec)<>'object' OR jsonb_typeof(rec->'kind') IS DISTINCT FROM 'string' OR NOT EXISTS(SELECT 1 FROM pg_temp.twuanis_evidence_validation_nodes lookup WHERE lookup.node_id=rec->>'contentId') THEN RAISE EXCEPTION 'Incomplete evidence root';END IF;END LOOP;")
s=s.replace('jsonb_array_elements_text(nodes->rows_ref->1)v','jsonb_array_elements_text((SELECT node->1 FROM pg_temp.twuanis_evidence_validation_nodes WHERE node_id=rows_ref))v')
assert 'NOT nodes?' not in s and 'nodes->rows_ref'not in s
out="BEGIN;\n-- ORCH-FINAL-01: use the existing transaction-local indexed evidence graph for traversal.\nDO $$BEGIN IF encode(sha256(convert_to(pg_get_functiondef('"+sig+"'::regprocedure),'UTF8')),'hex')<>'"+hashlib.sha256(base[sig].encode()).hexdigest()+"' THEN RAISE EXCEPTION 'Unreviewed validator predecessor';END IF;END$$;\n"+s+";\nCOMMIT;\n"
(P/'candidate/supabase/migrations/111_orchestrator_indexed_graph_traversal.sql').write_text(out)
print('Prepared indexed-graph traversal candidate; limits unchanged.')
