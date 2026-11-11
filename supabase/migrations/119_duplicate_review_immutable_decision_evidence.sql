BEGIN;

DO $guard$
DECLARE deferred boolean;
BEGIN
  IF md5(pg_get_functiondef('public.command_owner_listing_duplicate(uuid,uuid,bigint,text,text)'::regprocedure)) <> '821afe58bba9aaae66c2c1fbb5a0e196' THEN
    RAISE EXCEPTION 'Duplicate Review predecessor drift';
  END IF;
  SELECT condeferrable INTO deferred
  FROM pg_constraint
  WHERE conname='listing_duplicate_exceptions_decision_id_fkey'
    AND conrelid='twuanis_canonical_private.listing_duplicate_exceptions'::regclass
    AND confrelid='twuanis_canonical_private.listing_duplicate_decisions'::regclass;
  IF deferred IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'Duplicate exception predecessor constraint drift';
  END IF;
END $guard$;

-- The reference remains mandatory.  Deferral is used only within the one
-- atomic owner-decision transaction, so duplicate exceptions can be visible
-- to admission before their immutable decision record is inserted.
ALTER TABLE twuanis_canonical_private.listing_duplicate_exceptions
  DROP CONSTRAINT listing_duplicate_exceptions_decision_id_fkey;
ALTER TABLE twuanis_canonical_private.listing_duplicate_exceptions
  ADD CONSTRAINT listing_duplicate_exceptions_decision_id_fkey
  FOREIGN KEY (decision_id)
  REFERENCES twuanis_canonical_private.listing_duplicate_decisions(id)
  DEFERRABLE INITIALLY IMMEDIATE;

CREATE OR REPLACE FUNCTION public.command_owner_listing_duplicate(p_request uuid,p_case uuid,p_expected bigint,p_decision text,p_reason text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $function$
DECLARE u uuid; c record; previous record; pair jsonb; event uuid; cmd jsonb; result jsonb; before_content jsonb; reference public.listings%ROWTYPE; failure_message text; failure_state text;
BEGIN
 u:=twuanis_canonical_private.duplicate_owner();
 IF p_request IS NULL OR p_case IS NULL OR p_expected IS NULL OR p_expected<1 THEN RAISE EXCEPTION 'Explicit request, case and review version required' USING ERRCODE='22023'; END IF;
 IF p_decision NOT IN('CONFIRM_DUPLICATE','DIFFERENT_PROPERTIES','UNRESOLVED') OR length(btrim(p_reason)) NOT BETWEEN 3 AND 2000 THEN RAISE EXCEPTION 'Decision and reason required'; END IF;
 SELECT * INTO previous FROM twuanis_canonical_private.listing_duplicate_decisions WHERE request_id=p_request;
 IF FOUND THEN
  IF previous.case_id<>p_case OR previous.decision<>p_decision OR previous.reason<>p_reason OR previous.actor<>u THEN RAISE EXCEPTION 'Decision request conflict'; END IF;
  RETURN jsonb_build_object('ok',true,'replayed',true,'decision',previous.decision,'publication',previous.evidence->'publication');
 END IF;
 SELECT d.*,s.version,s.status INTO c FROM twuanis_canonical_private.listing_admission_decisions d JOIN twuanis_canonical_private.listing_duplicate_cases s ON s.current_admission_id=d.id WHERE s.id=p_case FOR UPDATE OF s;
 IF NOT FOUND OR c.version<>p_expected THEN RAISE EXCEPTION 'Stale review version; reload' USING ERRCODE='40001'; END IF;
 IF NOT pg_try_advisory_xact_lock(3147,hashtext(twuanis_canonical_private.duplicate_signature(c.proposed)::text)) THEN RAISE EXCEPTION 'Concurrent admission; retry' USING ERRCODE='40001'; END IF;
 IF p_decision='UNRESOLVED' THEN
  SELECT * INTO reference FROM public.listings WHERE id=c.listing_id FOR UPDATE;
  cmd:=c.proposed->'__command'; IF cmd IS NOT NULL THEN cmd:=cmd||jsonb_build_object('before',jsonb_build_object('title',reference.title,'description',reference.description,'whatsapp',reference.whatsapp,'images',to_jsonb(reference)->'images')); END IF;
  result:=twuanis_canonical_private.decide_listing_admission((CASE WHEN reference.listing_status='draft' THEN twuanis_canonical_private.duplicate_snapshot(to_jsonb(reference))||jsonb_build_object('__command',cmd) ELSE c.proposed||jsonb_build_object('__command',cmd) END)||(CASE WHEN c.proposed?'__intent' THEN jsonb_build_object('__intent',c.proposed->'__intent')ELSE '{}'::jsonb END)||jsonb_build_object('__refresh',true,'canonical_revision',reference.canonical_revision),p_request,'owner-review:'||u::text,true);
  INSERT INTO twuanis_canonical_private.listing_duplicate_decisions(case_id,request_id,actor,decision,reason,evidence) VALUES(p_case,p_request,u,p_decision,p_reason,result);
  UPDATE twuanis_canonical_private.listing_duplicate_cases SET status=CASE WHEN result->>'admission'='AUTOMATIC_REJECTION' THEN 'AUTOMATIC_REJECTION' ELSE 'UNRESOLVED' END,version=version+1,updated_at=clock_timestamp() WHERE id=p_case;
  PERFORM twuanis_canonical_private.append_administrative_event(u,'Owner','listings.manage','listing.duplicate.UNRESOLVED','listing',c.listing_id,jsonb_build_object('case',p_case,'version',c.version),result,p_reason,p_request);
  RETURN jsonb_build_object('ok',true,'decision','UNRESOLVED','evidenceRefresh',result);
 END IF;
 SELECT jsonb_build_object('title',l.title,'description',l.description,'whatsapp',l.whatsapp,'images',to_jsonb(l)->'images') INTO before_content FROM public.listings l WHERE l.id=c.listing_id;
 IF c.proposed->'__command'?'before' AND before_content IS DISTINCT FROM c.proposed->'__command'->'before' THEN RAISE EXCEPTION 'Proposed content changed; use unresolved to refresh evidence' USING ERRCODE='40001'; END IF;
 IF (SELECT canonical_revision FROM public.listings WHERE id=c.listing_id)<>c.revision THEN RAISE EXCEPTION 'Proposed listing changed; refresh evidence' USING ERRCODE='40001'; END IF;
 FOR pair IN SELECT value FROM jsonb_array_elements(c.candidates) LOOP
  SELECT * INTO reference FROM public.listings WHERE id=(pair->'reference'->>'id')::uuid FOR UPDATE;
  IF reference.canonical_revision<>(pair->'reference'->>'canonical_revision')::bigint THEN RAISE EXCEPTION 'Reference changed; refresh review evidence' USING ERRCODE='40001'; END IF;
 END LOOP;
 IF p_decision='DIFFERENT_PROPERTIES' THEN
  -- The exceptions must participate in the same transaction before Gate C
  -- evaluates the ordinary publication command.  The deferred FK is checked
  -- at commit after the one immutable decision insert below.
  event:=gen_random_uuid();
  SET CONSTRAINTS twuanis_canonical_private.listing_duplicate_exceptions_decision_id_fkey DEFERRED;
  FOR pair IN SELECT value FROM jsonb_array_elements(c.candidates) LOOP
   INSERT INTO twuanis_canonical_private.listing_duplicate_exceptions(listing_id,reference_id,proposed,reference,decision_id) VALUES(c.listing_id,(pair->'reference'->>'id')::uuid,c.proposed,pair->'reference',event) ON CONFLICT(listing_id,reference_id) DO UPDATE SET proposed=EXCLUDED.proposed,reference=EXCLUDED.reference,decision_id=EXCLUDED.decision_id;
  END LOOP;
  cmd:=c.proposed->'__command';
  IF cmd IS NULL THEN
   result:=jsonb_build_object('outcome','publication_command_missing','publicationCompleted',false,'retryRequired',false,'restriction','No retained ordinary-admission command exists for this decision.');
  ELSE
   BEGIN
    result:=twuanis_canonical_private.s3_admission_command(c.listing_id,c.revision,cmd->>'kind',cmd->>'actor',(cmd->>'request')::uuid,cmd->'domains',NULLIF(cmd->'source','null'::jsonb),(cmd->>'clear')::boolean,NULLIF(cmd->'content','null'::jsonb));
    IF result->>'admission' IS NULL AND NULLIF(cmd->'content','null'::jsonb) IS NOT NULL THEN UPDATE public.listings SET title=coalesce(cmd->'content'->>'title',title),description=coalesce(cmd->'content'->>'description',description),whatsapp=coalesce(cmd->'content'->>'whatsapp',whatsapp) WHERE id=c.listing_id; END IF;
    IF result->>'outcome' IN('succeeded','noop') AND EXISTS(SELECT 1 FROM public.listings WHERE id=c.listing_id AND listing_status='active') THEN
     result:=result||jsonb_build_object('listing_id',c.listing_id,'publicationCompleted',true);
     UPDATE twuanis_canonical_private.token_creation_commands SET publication_result=result WHERE listing_id=c.listing_id AND publication_request=(cmd->>'request')::uuid;
     UPDATE public.listing_publish_tokens pt SET published_listing_id=c.listing_id,published_at=(SELECT published_at FROM public.listings WHERE id=c.listing_id),verified=true,claimed_at=NULL FROM twuanis_canonical_private.token_creation_commands tc WHERE tc.token=pt.token AND tc.listing_id=c.listing_id AND tc.publication_request=(cmd->>'request')::uuid;
     UPDATE twuanis_canonical_private.source_ingestion_results sr SET result=jsonb_build_object('listing_id',c.listing_id,'outcome','accepted','ownerReleased',true) WHERE sr.evidence_id IN(SELECT cr.request_id FROM twuanis_canonical_private.csv_initial_publication ip JOIN public.canonical_operation_receipts cr ON cr.id=ip.creation_receipt WHERE ip.listing_id=c.listing_id AND ip.publication_request=(cmd->>'request')::uuid);
    ELSE
     result:=coalesce(result,'{}'::jsonb)||jsonb_build_object('publicationCompleted',false,'retryRequired',false,'restriction',coalesce(result->>'admission',result->>'outcome','Listing did not reach active publication.'));
    END IF;
   EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS failure_message=MESSAGE_TEXT,failure_state=RETURNED_SQLSTATE;
    result:=jsonb_build_object('outcome','ordinary_admission_not_completed','publicationCompleted',false,'retryRequired',true,'error',failure_message,'sqlstate',failure_state);
   END;
  END IF;
  INSERT INTO twuanis_canonical_private.listing_duplicate_decisions(id,case_id,request_id,actor,decision,reason,evidence) VALUES(event,p_case,p_request,u,p_decision,p_reason,jsonb_build_object('proposed',c.proposed,'candidates',c.candidates,'publication',result));
 ELSE
  INSERT INTO twuanis_canonical_private.listing_duplicate_decisions(case_id,request_id,actor,decision,reason,evidence) VALUES(p_case,p_request,u,p_decision,p_reason,jsonb_build_object('proposed',c.proposed,'candidates',c.candidates));
 END IF;
 UPDATE twuanis_canonical_private.listing_duplicate_cases SET status=p_decision,version=version+1,updated_at=clock_timestamp() WHERE id=p_case;
 PERFORM twuanis_canonical_private.append_administrative_event(u,'Owner','listings.manage','listing.duplicate.'||p_decision,'listing',c.listing_id,jsonb_build_object('case',p_case,'version',c.version),jsonb_build_object('decision',p_decision,'publication',result),p_reason,p_request);
 RETURN jsonb_build_object('ok',true,'decision',p_decision,'publication',result);
END $function$;

REVOKE ALL ON FUNCTION public.command_owner_listing_duplicate(uuid,uuid,bigint,text,text) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.command_owner_listing_duplicate(uuid,uuid,bigint,text,text) TO authenticated;
ALTER FUNCTION public.command_owner_listing_duplicate(uuid,uuid,bigint,text,text) OWNER TO postgres;
COMMIT;
