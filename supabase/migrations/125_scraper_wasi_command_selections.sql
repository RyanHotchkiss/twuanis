BEGIN;
DO $$
DECLARE constraint_name text;
BEGIN
  SELECT conname INTO constraint_name FROM pg_constraint
  WHERE conrelid='twuanis_scraper_private.commands'::regclass AND contype='c' AND pg_get_constraintdef(oid) LIKE '%scrapers%';
  IF constraint_name IS NOT NULL THEN EXECUTE format('ALTER TABLE twuanis_scraper_private.commands DROP CONSTRAINT %I',constraint_name); END IF;
END $$;
ALTER TABLE twuanis_scraper_private.commands ADD CONSTRAINT commands_supported_scrapers_check CHECK (cardinality(scrapers) BETWEEN 1 AND 2 AND scrapers <@ ARRAY['encuentra24-sale','encuentra24-rent','helcor-sale','helcor-rent','remax-central-sale','remax-central-rent','devop-sale']::text[]);
CREATE OR REPLACE FUNCTION public.scraper_admin_request(p_request uuid,p_scrapers text[]) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=auth.uid(); existing twuanis_scraper_private.commands%ROWTYPE; cmd uuid:=coalesce(p_request,gen_random_uuid()); normalized text[];
BEGIN
 IF NOT public.is_current_user_owner() OR actor IS NULL THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501'; END IF;
 SELECT array_agg(DISTINCT x ORDER BY x) INTO normalized FROM unnest(coalesce(p_scrapers,'{}'::text[]))x;
 IF normalized IS NULL OR cardinality(normalized) NOT BETWEEN 1 AND 2 OR NOT(normalized <@ ARRAY['encuentra24-sale','encuentra24-rent','helcor-sale','helcor-rent','remax-central-sale','remax-central-rent','devop-sale']::text[]) THEN RAISE EXCEPTION 'Supported scraper selection required' USING ERRCODE='22023'; END IF;
 IF cardinality(normalized)>1 AND (normalized && ARRAY['encuentra24-sale','encuentra24-rent']::text[]) AND NOT(normalized <@ ARRAY['encuentra24-sale','encuentra24-rent']::text[]) THEN RAISE EXCEPTION 'One scraper website per command' USING ERRCODE='22023'; END IF;
 SELECT * INTO existing FROM twuanis_scraper_private.commands WHERE id=cmd;
 IF FOUND THEN IF existing.requested_by<>actor OR existing.scrapers IS DISTINCT FROM normalized THEN RAISE EXCEPTION 'Request conflict' USING ERRCODE='23505'; END IF; RETURN jsonb_build_object('id',existing.id,'state',existing.state,'replayed',true); END IF;
 IF EXISTS(SELECT 1 FROM twuanis_scraper_private.commands WHERE state IN('requested','accepted','running') AND expires_at>clock_timestamp()) THEN RAISE EXCEPTION 'Scraper execution already reserved' USING ERRCODE='PT409'; END IF;
 INSERT INTO twuanis_scraper_private.commands(id,requested_by,expires_at,state,scrapers) VALUES(cmd,actor,clock_timestamp()+interval '10 minutes','requested',normalized);
 RETURN jsonb_build_object('id',cmd,'state','requested','replayed',false);
END $$;
REVOKE ALL ON FUNCTION public.scraper_admin_request(uuid,text[]) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.scraper_admin_request(uuid,text[]) TO authenticated;
COMMIT;
