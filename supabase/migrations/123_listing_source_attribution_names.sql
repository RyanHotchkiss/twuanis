BEGIN;

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS agency_name text,
  ADD COLUMN IF NOT EXISTS listing_agent_name text;

GRANT UPDATE (agency_logo_url, agency_name, listing_agent_photo_url, listing_agent_name)
  ON TABLE public.listings TO service_role;

COMMIT;
