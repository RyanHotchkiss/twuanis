-- Step12 authorized canonical Spanish Add-on names. Production installation requires separate authorization.
-- Presentation only: no new identity, description, configuration, price, term or runtime authority.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
DO $$
DECLARE x record;p twuanis_canonical_private.addon_products%ROWTYPE;
BEGIN
 IF current_user<>'postgres' THEN RAISE EXCEPTION 'reviewed administrative installation required';END IF;
 FOR x IN SELECT * FROM (VALUES
 ('addon-featured-listing','Featured Listing','Anuncio destacado'),
 ('addon-listing-boost','Listing Boost','Impulso del anuncio'),
 ('addon-homepage-exposure','Homepage Exposure','Exposición en la página de inicio'),
 ('addon-province-exposure','Province Exposure','Exposición por provincia'),
 ('addon-property-type-exposure','Property-Type Exposure','Exposición por tipo de propiedad'),
 ('addon-bulk-listing-import','Bulk Listing Import','Importación masiva de anuncios'),
 ('addon-2026-founding-membership','2026 Founding Membership','Membresía fundadora 2026'),
 ('addon-premium-listing-template','Premium Listing Template','Plantilla premium para anuncios')
 ) AS copy(id,name_en,name_es) ORDER BY id LOOP
  SELECT * INTO STRICT p FROM twuanis_canonical_private.addon_products WHERE id=x.id FOR UPDATE;
  IF p.name_en IS DISTINCT FROM x.name_en THEN
   RAISE EXCEPTION 'canonical English copy differs from reviewed translation anchor: %',x.id;
  END IF;
  IF p.name_es IS NOT NULL AND p.name_es IS DISTINCT FROM x.name_es THEN
   RAISE EXCEPTION 'existing Spanish copy requires review: %',x.id;
  END IF;
  IF p.name_es IS DISTINCT FROM x.name_es THEN
   UPDATE twuanis_canonical_private.addon_products
   SET name_es=x.name_es,revision=revision+1,updated_at=clock_timestamp()
   WHERE id=x.id;
  END IF;
 END LOOP;
END$$;
COMMIT;
