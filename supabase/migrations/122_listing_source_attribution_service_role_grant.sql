BEGIN;

-- The ingestion/refresh worker needs only the two source-observed attribution
-- fields. It cannot modify listing identity, lifecycle, pricing, or content.
GRANT UPDATE (agency_logo_url, listing_agent_photo_url)
  ON TABLE public.listings TO service_role;

COMMIT;
