BEGIN;
-- ORCH-FINAL-01: release the existing expired reservation through canonical maintenance.
DO $$BEGIN IF encode(sha256(convert_to(pg_get_functiondef('public.orchestrator_execution_claim(jsonb,uuid,uuid,text,text,jsonb,uuid)'::regprocedure),'UTF8')),'hex')<>'7141531f2462c865dccab8c5dfb5008462eb3ac9660fdc6e95bb179cca646ab0' THEN RAISE EXCEPTION 'Unreviewed execution claim predecessor';END IF;END$$;
CREATE OR REPLACE FUNCTION public.orchestrator_execution_claim(p_claims jsonb, p_request uuid, p_execution uuid, p_orchestrator text, p_population text, p_question jsonb, p_worker uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
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
 IF twuanis_canonical_private.execution_credit_execution_state(x.id)<>'RESERVED' OR x.lease_until<=clock_timestamp() THEN
  -- A replayed reserve receipt must not leave an expired hold in the ledger.
  -- Reuse canonical maintenance under the existing account advisory lock.
  PERFORM twuanis_canonical_private.execution_credit_maintain(a,p_request);
  RETURN r||jsonb_build_object('state','RELEASED');
 END IF;
 SELECT * INTO j FROM twuanis_canonical_private.orchestrator_execution_claims WHERE execution_id=x.id FOR UPDATE;
 IF FOUND THEN
  IF j.lease_until>clock_timestamp() THEN RETURN jsonb_build_object('state','WORKING','execution',x.id);END IF;
  IF j.attempt>=3 THEN RAISE EXCEPTION 'Execution retry limit reached';END IF;
  UPDATE twuanis_canonical_private.orchestrator_execution_claims SET worker=p_worker,lease_until=least(clock_timestamp()+interval'3 minutes',x.lease_until),attempt=attempt+1 WHERE execution_id=x.id;
 ELSE INSERT INTO twuanis_canonical_private.orchestrator_execution_claims(execution_id,worker,lease_until)VALUES(x.id,p_worker,least(clock_timestamp()+interval'3 minutes',x.lease_until));END IF;
 RETURN jsonb_build_object('state','CLAIMED','execution',x.id,'authority',authority,'createdAt',x.reserved_at);
END$function$
;
COMMIT;
