BEGIN;

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS agency_logo_url text,
  ADD COLUMN IF NOT EXISTS listing_agent_photo_url text;

ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_agency_logo_url_https,
  DROP CONSTRAINT IF EXISTS listings_listing_agent_photo_url_https;

ALTER TABLE public.listings
  ADD CONSTRAINT listings_agency_logo_url_https
    CHECK (agency_logo_url IS NULL OR agency_logo_url ~ '^https://[^[:space:]]+$'),
  ADD CONSTRAINT listings_listing_agent_photo_url_https
    CHECK (listing_agent_photo_url IS NULL OR listing_agent_photo_url ~ '^https://[^[:space:]]+$');

COMMIT;
