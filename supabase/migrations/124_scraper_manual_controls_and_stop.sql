BEGIN;

-- Extend the existing command authority in place.  Command history remains in
-- the same table; no command or source evidence is deleted or rewritten.
DO $$
DECLARE constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'twuanis_scraper_private.commands'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%scrapers%';
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE twuanis_scraper_private.commands DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;
ALTER TABLE twuanis_scraper_private.commands
  ADD CONSTRAINT commands_supported_scrapers_check CHECK (
    cardinality(scrapers) BETWEEN 1 AND 2
    AND scrapers <@ ARRAY['encuentra24-sale','encuentra24-rent','helcor-sale','helcor-rent']::text[]
  );

CREATE OR REPLACE FUNCTION public.scraper_admin_request(p_request uuid,p_scrapers text[])
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=auth.uid(); existing twuanis_scraper_private.commands%ROWTYPE; cmd uuid:=coalesce(p_request,gen_random_uuid()); normalized text[];
BEGIN
 IF NOT public.is_current_user_owner() OR actor IS NULL THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501'; END IF;
 SELECT array_agg(DISTINCT x ORDER BY x) INTO normalized FROM unnest(coalesce(p_scrapers,'{}'::text[]))x;
 IF normalized IS NULL OR cardinality(normalized) NOT BETWEEN 1 AND 2 OR NOT(normalized <@ ARRAY['encuentra24-sale','encuentra24-rent','helcor-sale','helcor-rent']::text[]) THEN RAISE EXCEPTION 'Supported scraper selection required' USING ERRCODE='22023'; END IF;
 SELECT * INTO existing FROM twuanis_scraper_private.commands WHERE id=cmd;
 IF FOUND THEN
   IF existing.requested_by<>actor OR existing.scrapers IS DISTINCT FROM normalized THEN RAISE EXCEPTION 'Request conflict' USING ERRCODE='23505'; END IF;
   RETURN jsonb_build_object('id',existing.id,'state',existing.state,'replayed',true);
 END IF;
 IF EXISTS(SELECT 1 FROM twuanis_scraper_private.commands WHERE state IN('requested','accepted','running') AND expires_at>clock_timestamp()) THEN RAISE EXCEPTION 'Scraper execution already reserved' USING ERRCODE='PT409'; END IF;
 INSERT INTO twuanis_scraper_private.commands(id,requested_by,expires_at,state,scrapers) VALUES(cmd,actor,clock_timestamp()+interval '10 minutes','requested',normalized);
 RETURN jsonb_build_object('id',cmd,'state','requested','replayed',false);
END $$;

-- An Owner's Stop request is durable and visible to the listener.  The
-- listener keeps the ordinary terminal state model and records the stop in
-- summary, preserving historical command semantics.
CREATE OR REPLACE FUNCTION public.scraper_admin_stop(p_command uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=auth.uid(); command_row twuanis_scraper_private.commands%ROWTYPE;
BEGIN
 IF NOT public.is_current_user_owner() OR actor IS NULL THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501'; END IF;
 SELECT * INTO command_row FROM twuanis_scraper_private.commands WHERE id=p_command FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Command not found' USING ERRCODE='P0002'; END IF;
 IF command_row.state NOT IN('accepted','running') THEN RETURN jsonb_build_object('id',command_row.id,'state',command_row.state,'stopRequested',coalesce((command_row.summary->>'stopRequested')::boolean,false)); END IF;
 UPDATE twuanis_scraper_private.commands SET summary=command_row.summary || jsonb_build_object('stopRequested',true,'stopRequestedAt',clock_timestamp(),'stopRequestedBy',actor) WHERE id=p_command;
 RETURN jsonb_build_object('id',p_command,'state',command_row.state,'stopRequested',true);
END $$;

CREATE OR REPLACE FUNCTION public.scraper_worker_stop_requested(p_command uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 RETURN EXISTS(
   SELECT 1 FROM twuanis_scraper_private.commands
   WHERE id=p_command AND claimed_by='local-imac' AND state IN('accepted','running')
     AND coalesce((summary->>'stopRequested')::boolean,false)
 );
END $$;

REVOKE ALL ON FUNCTION public.scraper_admin_request(uuid,text[]),public.scraper_admin_stop(uuid),public.scraper_worker_stop_requested(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.scraper_admin_request(uuid,text[]),public.scraper_admin_stop(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.scraper_worker_stop_requested(uuid) TO service_role;
COMMIT;
