-- Return the count of the entire filtered Admin Listings population with each
-- page.  The window expression is evaluated before the existing LIMIT 26.
BEGIN;

DO $migration$
DECLARE
  definition text;
  needle constant text := 'l.province,l.canton,l.district,l.property_type,l.updated_at';
  replacement constant text := 'count(*) OVER() AS matching_count,l.province,l.canton,l.district,l.property_type,l.updated_at';
BEGIN
  IF to_regprocedure('public.admin_listing_read(jsonb)') IS NULL THEN
    RAISE EXCEPTION 'admin_listing_read(jsonb) predecessor is required';
  END IF;

  SELECT pg_get_functiondef('public.admin_listing_read(jsonb)'::regprocedure) INTO definition;
  IF position(needle IN definition)=0 THEN
    RAISE EXCEPTION 'admin_listing_read(jsonb) predecessor shape is not recognized';
  END IF;
  IF position(replacement IN definition)>0 THEN
    RAISE EXCEPTION 'admin_listing_read(jsonb) already returns matching_count';
  END IF;

  EXECUTE replace(definition,needle,replacement);
END
$migration$;

COMMIT;
