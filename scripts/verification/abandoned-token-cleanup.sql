\set ON_ERROR_STOP on
DO $$BEGIN IF inet_server_addr() IS NOT NULL OR current_database()<>'s7_upload' THEN RAISE EXCEPTION 'disposable only';END IF;END$$;
-- Signature fixture only; closed token machinery is not re-run.
CREATE TABLE public.listing_publish_tokens(id uuid PRIMARY KEY,token text UNIQUE,verified boolean,listing_data jsonb,created_at timestamptz);
CREATE TABLE twuanis_canonical_private.token_creation_commands(token text PRIMARY KEY);
\ir ../../supabase/migrations/022_abandoned_token_cleanup.sql
BEGIN;
CREATE TEMP TABLE checks(label text);
CREATE FUNCTION pg_temp.ok(v boolean,t text) RETURNS void LANGUAGE plpgsql AS $$BEGIN IF v IS NOT TRUE THEN RAISE EXCEPTION 'FAIL %',t;END IF;INSERT INTO checks VALUES(t);END$$;
INSERT INTO listing_publish_tokens VALUES('10000000-0000-0000-0000-000000000022','pending',false,'{}',now()-interval '2 days'),('10000000-0000-0000-0000-000000000023','abandoned',false,'{}',now()-interval '2 days'),('10000000-0000-0000-0000-000000000024','verified',true,'{}',now()-interval '2 days'),('10000000-0000-0000-0000-000000000025','young',false,'{}',now());
INSERT INTO twuanis_canonical_private.token_creation_commands VALUES('pending');
SELECT pg_temp.ok(claim_abandoned_listing_token('10000000-0000-0000-0000-000000000022') IS NULL,'pending canonical retry excluded');
SELECT pg_temp.ok(claim_abandoned_listing_token('10000000-0000-0000-0000-000000000024') IS NULL,'verified excluded');
SELECT pg_temp.ok(claim_abandoned_listing_token('10000000-0000-0000-0000-000000000025') IS NULL,'under24hours excluded');
SELECT pg_temp.ok(claim_abandoned_listing_token('10000000-0000-0000-0000-000000000023')->>'token'='abandoned','eligible claim returns exact server token');
SELECT pg_temp.ok(NOT EXISTS(SELECT 1 FROM listing_publish_tokens WHERE token='abandoned'),'claim deletes before storage');
SELECT pg_temp.ok(claim_abandoned_listing_token('10000000-0000-0000-0000-000000000023') IS NULL,'repeated claim no second deletion');
SELECT pg_temp.ok(NOT has_function_privilege('authenticated','public.claim_abandoned_listing_token(uuid)','EXECUTE'),'browser claim denied');
SELECT 'ABANDONED TOKEN ASSERTIONS '||count(*) FROM checks;
ROLLBACK;
