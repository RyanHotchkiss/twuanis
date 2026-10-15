-- Forward-only saved-result authorization. Preserve rows and canonical authority.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $$ BEGIN
 IF current_user<>'postgres' THEN RAISE EXCEPTION 'postgres installation authority required'; END IF;
 IF md5(pg_get_functiondef('public.current_account_has_capability(text)'::regprocedure))<>'c9d2708032056ce58e50b5b555460081' OR md5(pg_get_functiondef('public.is_live_account()'::regprocedure))<>'59293fa8a21740a345a2f2edb0fe94e7' THEN RAISE EXCEPTION 'canonical authorization predecessor drift'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_class WHERE oid='public.saved_analyses'::regclass AND relrowsecurity) OR NOT EXISTS(SELECT 1 FROM pg_policy WHERE polrelid='public.saved_analyses'::regclass AND polname='account_live_identity_required' AND NOT polpermissive) THEN RAISE EXCEPTION 'saved analysis ownership/live identity prerequisites missing'; END IF;
END $$;
CREATE FUNCTION public.saved_analysis_required_capability(p_engine text,p_filters jsonb) RETURNS text
LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path=pg_catalog AS $$
 SELECT CASE WHEN jsonb_typeof(p_filters)='object' THEN CASE
 WHEN p_engine='explorer' THEN CASE p_filters->>'analysis_question'
  WHEN 'summary' THEN 'cap-market-summary' WHEN 'composition' THEN 'cap-market-composition' END
 WHEN p_engine='matching' AND coalesce(p_filters->>'analysis_question','matching')='matching' THEN 'cap-property-matching'
 WHEN p_engine='comparison' AND coalesce(p_filters->>'analysis_question','comparison')='comparison' THEN 'cap-market-comparison'
 WHEN p_engine='scarcity' AND coalesce(p_filters->>'analysis_question','configuration')='configuration' THEN 'cap-property-configuration-frequency'
 WHEN p_engine='price-meter' THEN CASE p_filters->>'analysis_question'
  WHEN 'distribution' THEN 'cap-price-m2-distribution'
  WHEN 'geography' THEN 'cap-geographic-price-m2-comparison'
  WHEN 'property-area' THEN 'cap-size-price-m2'
  WHEN 'construction-area' THEN 'cap-size-price-m2'
  WHEN 'construction-land' THEN 'cap-construction-land-price-m2'
  WHEN 'cohort-comparison' THEN 'cap-user-defined-cohort-price-m2-comparison'
  WHEN 'cross-dimensional' THEN 'cap-cross-dimensional-analysis'
  WHEN 'discovery' THEN 'cap-comparative-price-m2-discovery'
  WHEN 'position' THEN 'cap-property-price-m2-position'
  WHEN 'comparables' THEN 'cap-user-defined-comparable-cohort'
  WHEN 'asking-area-ratio' THEN 'cap-asking-area-coefficient-ratio'
  WHEN 'weighted-price' THEN 'cap-weighted-price-m2' END
 END END
$$;
-- No supplied account identity, roles, clients, or entitlement overrides.
CREATE FUNCTION public.can_access_saved_analysis(p_engine text,p_filters jsonb) RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $$
 SELECT coalesce(public.is_live_account() AND public.current_account_has_capability(public.saved_analysis_required_capability(p_engine,p_filters)),false)
$$;
REVOKE ALL ON FUNCTION public.saved_analysis_required_capability(text,jsonb),public.can_access_saved_analysis(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.saved_analysis_required_capability(text,jsonb),public.can_access_saved_analysis(text,jsonb) TO authenticated;
CREATE POLICY saved_analysis_current_capability_required ON public.saved_analyses AS RESTRICTIVE FOR ALL TO authenticated
 USING(user_id=auth.uid() AND public.can_access_saved_analysis(engine_type,filters))
 WITH CHECK(user_id=auth.uid() AND public.can_access_saved_analysis(engine_type,filters));
CREATE FUNCTION public.protect_saved_analysis_evidence() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$ BEGIN
 IF (NEW.id,NEW.user_id,NEW.engine_type,NEW.language,NEW.filters,NEW.result,NEW.schema_version,NEW.created_at) IS DISTINCT FROM (OLD.id,OLD.user_id,OLD.engine_type,OLD.language,OLD.filters,OLD.result,OLD.schema_version,OLD.created_at) THEN RAISE EXCEPTION 'Saved analytical evidence and authorization identity are immutable' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.protect_saved_analysis_evidence() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER saved_analysis_evidence_immutable BEFORE UPDATE ON public.saved_analyses FOR EACH ROW EXECUTE FUNCTION public.protect_saved_analysis_evidence();
ALTER TABLE public.saved_analyses ENABLE ALWAYS TRIGGER saved_analysis_evidence_immutable;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_proc WHERE oid IN ('public.saved_analysis_required_capability(text,jsonb)'::regprocedure,'public.can_access_saved_analysis(text,jsonb)'::regprocedure,'public.protect_saved_analysis_evidence()'::regprocedure) AND (prosecdef OR pg_get_userbyid(proowner)<>'postgres')) THEN RAISE EXCEPTION 'saved analysis helper authority drift'; END IF;
 IF has_function_privilege('anon','public.can_access_saved_analysis(text,jsonb)','EXECUTE') OR NOT has_function_privilege('authenticated','public.can_access_saved_analysis(text,jsonb)','EXECUTE') THEN RAISE EXCEPTION 'saved analysis function ACL drift'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_policy WHERE polrelid='public.saved_analyses'::regclass AND polname='saved_analysis_current_capability_required' AND NOT polpermissive AND polcmd='*') OR NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.saved_analyses'::regclass AND tgname='saved_analysis_evidence_immutable' AND tgenabled='A') THEN RAISE EXCEPTION 'saved analysis boundary protections missing'; END IF;
END $$;
COMMIT;
