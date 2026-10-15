from pathlib import Path
import json,hashlib
P=Path('/private/tmp/twuanis-orch-final-01');rows=json.load(open(P/'baseline-functions.json'));sig,body,owner,acl=next(r for r in rows if r[0].startswith('orchestrator_execution_claim('));needle="IF twuanis_canonical_private.execution_credit_execution_state(x.id)<>'RESERVED' OR x.lease_until<=clock_timestamp() THEN RETURN r||jsonb_build_object('state','RELEASED');END IF;";assert body.count(needle)==1
replacement="""IF twuanis_canonical_private.execution_credit_execution_state(x.id)<>'RESERVED' OR x.lease_until<=clock_timestamp() THEN
  -- A replayed reserve receipt must not leave an expired hold in the ledger.
  -- Reuse canonical maintenance under the existing account advisory lock.
  PERFORM twuanis_canonical_private.execution_credit_maintain(a,p_request);
  RETURN r||jsonb_build_object('state','RELEASED');
 END IF;"""
new=body.replace(needle,replacement);out="BEGIN;\n-- ORCH-FINAL-01: settle the existing expired reservation through canonical maintenance.\nDO $$BEGIN IF encode(sha256(convert_to(pg_get_functiondef('public."+sig+"'::regprocedure),'UTF8')),'hex')<>'"+hashlib.sha256(body.encode()).hexdigest()+"' THEN RAISE EXCEPTION 'Unreviewed execution claim predecessor';END IF;END$$;\n"+new+";\nCOMMIT;\n";(P/'candidate/supabase/migrations/112_orchestrator_expired_reservation_replay.sql').write_text(out);print(sig)
