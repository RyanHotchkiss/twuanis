\set ON_ERROR_STOP on
DO $$BEGIN IF inet_server_addr() IS NOT NULL OR current_setting('port')<>'55442' OR current_database()<>'s7_upload' THEN RAISE EXCEPTION 'disposable s7_upload only';END IF;END$$;
CREATE SCHEMA twuanis_canonical_private;
CREATE TABLE public.listings(id uuid PRIMARY KEY,owner_id uuid,images text,listing_status text,canonical_domain_version integer,canonical_revision bigint DEFAULT 5,publication_expires_at timestamptz DEFAULT '2030-01-01',updated_at timestamptz);
