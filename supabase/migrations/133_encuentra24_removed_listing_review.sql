BEGIN;

CREATE TABLE twuanis_canonical_private.encuentra24_removed_listing_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE RESTRICT,
  transaction_type text NOT NULL CHECK (transaction_type IN ('sale','rent')), run_id uuid NOT NULL,
  source_listing_id text NOT NULL, source_url text NOT NULL, last_observed_at timestamptz,
  flagged_at timestamptz NOT NULL DEFAULT clock_timestamp(), status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','REVIEW_LATER','KEPT_ACTIVE','ARCHIVED')),
  completion jsonb NOT NULL, reason text NOT NULL DEFAULT 'Not observed in a verified complete Encuentra24 inventory',
  decision_reason text, decided_at timestamptz, decided_by uuid,
  UNIQUE (listing_id,run_id)
);
CREATE UNIQUE INDEX encuentra24_removed_listing_reviews_open_listing
  ON twuanis_canonical_private.encuentra24_removed_listing_reviews(listing_id)
  WHERE status IN ('PENDING','REVIEW_LATER');

CREATE OR REPLACE FUNCTION public.record_encuentra24_removed_listing_candidates(
  p_transaction text,p_run uuid,p_started_at timestamptz,p_completion jsonb,p_observed_ids jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE v_created integer:=0; v_pending integer:=0;
BEGIN
 IF p_transaction NOT IN ('sale','rent') OR p_run IS NULL OR p_started_at IS NULL OR jsonb_typeof(p_observed_ids)<>'array'
    OR coalesce((p_completion->>'inventory_complete')::boolean,false) IS DISTINCT FROM true
    OR coalesce(p_completion->>'status','') <> 'COMPLETE' THEN
   RETURN jsonb_build_object('status','skipped','created',0,'pending',0,'inconclusive',0,'reason','INVENTORY_NOT_VERIFIED_COMPLETE');
 END IF;
 INSERT INTO twuanis_canonical_private.encuentra24_removed_listing_reviews(listing_id,transaction_type,run_id,source_listing_id,source_url,last_observed_at,completion)
 SELECT l.id,p_transaction,p_run,s.source_listing_id,coalesce(l.source_url,''),s.positive_at,p_completion
 FROM twuanis_canonical_private.source_ingestion_state s JOIN public.listings l ON l.id=s.listing_id
 WHERE s.source_name='encuentra24' AND l.transaction_type=p_transaction AND l.listing_origin='imported'
   AND l.owner_id IS NULL AND l.listing_status IN ('active','draft','expired') AND s.positive_at<p_started_at
   AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(p_observed_ids) x WHERE x.value=s.source_listing_id)
   AND NOT EXISTS (SELECT 1 FROM twuanis_canonical_private.encuentra24_removed_listing_reviews r WHERE r.listing_id=l.id AND r.status IN ('PENDING','REVIEW_LATER'))
 ON CONFLICT (listing_id,run_id) DO NOTHING;
 GET DIAGNOSTICS v_created=ROW_COUNT;
 SELECT count(*) INTO v_pending FROM twuanis_canonical_private.encuentra24_removed_listing_reviews WHERE status IN ('PENDING','REVIEW_LATER');
 RETURN jsonb_build_object('status','recorded','created',v_created,'pending',v_pending,'inconclusive',0);
END $$;
REVOKE ALL ON FUNCTION public.record_encuentra24_removed_listing_candidates(text,uuid,timestamptz,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_encuentra24_removed_listing_candidates(text,uuid,timestamptz,jsonb,jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.read_owner_encuentra24_removed_listing_reviews() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
BEGIN
 IF auth.uid() IS NULL OR auth.jwt()->>'role' IS DISTINCT FROM 'authenticated' OR NOT public.is_current_user_owner() THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501'; END IF;
 RETURN (SELECT jsonb_build_object('pending',count(*) FILTER (WHERE r.status IN ('PENDING','REVIEW_LATER')),'items',coalesce(jsonb_agg(jsonb_build_object(
  'id',r.id,'listing_id',r.listing_id,'transaction_type',r.transaction_type,'source_listing_id',r.source_listing_id,'source_url',r.source_url,
  'last_observed_at',r.last_observed_at,'flagged_at',r.flagged_at,'status',r.status,'reason',r.reason,'completion',r.completion,
  'title',l.title,'listing_status',l.listing_status,'canonical_revision',l.canonical_revision::text,'updated_at',l.updated_at
 ) ORDER BY r.flagged_at DESC),'[]'::jsonb)) FROM twuanis_canonical_private.encuentra24_removed_listing_reviews r JOIN public.listings l ON l.id=r.listing_id);
END $$;
GRANT EXECUTE ON FUNCTION public.read_owner_encuentra24_removed_listing_reviews() TO authenticated;

CREATE OR REPLACE FUNCTION public.command_owner_encuentra24_removed_listing_review(p_request uuid,p_review uuid,p_decision text,p_reason text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE r twuanis_canonical_private.encuentra24_removed_listing_reviews%ROWTYPE; l public.listings%ROWTYPE; result jsonb;
BEGIN
 IF auth.uid() IS NULL OR auth.jwt()->>'role' IS DISTINCT FROM 'authenticated' OR NOT public.is_current_user_owner() THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501'; END IF;
 IF p_request IS NULL OR p_review IS NULL OR p_decision NOT IN ('ARCHIVE','KEEP_ACTIVE','REVIEW_LATER') OR nullif(btrim(p_reason),'') IS NULL THEN RAISE EXCEPTION 'bounded review decision required' USING ERRCODE='22023'; END IF;
 SELECT * INTO r FROM twuanis_canonical_private.encuentra24_removed_listing_reviews WHERE id=p_review FOR UPDATE;
 IF NOT FOUND OR r.status IN ('ARCHIVED','KEPT_ACTIVE') THEN RAISE EXCEPTION 'review unavailable' USING ERRCODE='P0002'; END IF;
 IF p_decision='ARCHIVE' THEN
   SELECT * INTO l FROM public.listings WHERE id=r.listing_id;
   result:=public.admin_listing_command(p_request,jsonb_build_object('operation','archive','listing',l.id,'expected',l.canonical_revision::text,'prior_updated_at',l.updated_at,'reason',p_reason));
   IF coalesce((result->>'ok')::boolean,false) IS DISTINCT FROM true THEN RAISE EXCEPTION 'canonical archive was not completed'; END IF;
   UPDATE twuanis_canonical_private.encuentra24_removed_listing_reviews SET status='ARCHIVED',decision_reason=p_reason,decided_at=clock_timestamp(),decided_by=auth.uid() WHERE id=r.id;
 ELSE
   UPDATE twuanis_canonical_private.encuentra24_removed_listing_reviews SET status=CASE WHEN p_decision='KEEP_ACTIVE' THEN 'KEPT_ACTIVE' ELSE 'REVIEW_LATER' END,decision_reason=p_reason,decided_at=clock_timestamp(),decided_by=auth.uid() WHERE id=r.id;
 END IF;
 RETURN jsonb_build_object('ok',true,'decision',p_decision,'listing_id',r.listing_id);
END $$;
GRANT EXECUTE ON FUNCTION public.command_owner_encuentra24_removed_listing_review(uuid,uuid,text,text) TO authenticated;
COMMIT;
