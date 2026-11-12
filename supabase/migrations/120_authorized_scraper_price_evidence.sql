BEGIN;

DO $migration$
DECLARE
  definition text;
  predecessor constant text := 'd31707a5805948b3f5e148db4b97f731';
  declaration constant text := 'structured_authority boolean:=false; text_reasons text[];';
  declaration_replacement constant text := 'structured_authority boolean:=false; scraper_price_valid boolean:=false; price_evidence jsonb; text_reasons text[];';
  anchor constant text := 'text_reasons:=twuanis_canonical_private.price_integrity_texts(texts,l.transaction_type,amount,l.currency);';
  replacement constant text := $replacement$
-- A trusted scraper observation remains subject to the retained identity,
-- eligibility, transaction, amount, currency, and textual-consistency gates.
-- It can establish structured price authority when the original source URL and
-- observation timestamp are bound to the retained exact price pair.
BEGIN
 price_evidence:=(raw->>'raw_price_evidence')::jsonb;
EXCEPTION WHEN invalid_text_representation THEN
 price_evidence:=NULL;
END;
IF jsonb_typeof(price_evidence)='object'
   AND price_evidence->>'source_url'=raw->>'source_url'
   AND price_evidence->>'observed_at'=raw->>'observed_at'
   AND jsonb_typeof(price_evidence->'flight_price')='object'
   AND coalesce(price_evidence->'flight_price'->>'source_label','')<>''
   AND coalesce(price_evidence->'flight_price'->>'source_value','')<>'' THEN
 n:=twuanis_canonical_private.price_integrity_number(price_evidence#>>'{flight_price,amount,value}');
 c:=twuanis_canonical_private.price_integrity_currency(price_evidence->'flight_price'->'currency');
 IF n IS NOT NULL AND c IS NOT NULL AND n=amount AND c=l.currency THEN
  scraper_price_valid:=true;
  reasons:=array_remove(reasons,'PRICE_STRUCTURED_EVIDENCE_REQUIRED');
  structured_authority:=true;
 ELSE
  reasons:=array_append(reasons,'PRICE_SOURCE_PAIR_CONTRADICTION');
 END IF;
ELSE
 reasons:=array_append(reasons,'PRICE_SOURCE_PAIR_INVALID');
END IF;
text_reasons:=twuanis_canonical_private.price_integrity_texts(texts,l.transaction_type,amount,l.currency);
$replacement$;
BEGIN
  SELECT pg_get_functiondef('twuanis_canonical_private.decide_listing_price(public.listings)'::regprocedure)
    INTO definition;
  IF md5(definition) <> predecessor THEN
    RAISE EXCEPTION 'Price-integrity predecessor drift';
  END IF;
  definition := replace(definition, declaration, declaration_replacement);
  IF definition = pg_get_functiondef('twuanis_canonical_private.decide_listing_price(public.listings)'::regprocedure) THEN
    RAISE EXCEPTION 'Price-integrity declaration anchor missing';
  END IF;
  definition := replace(definition, anchor, replacement);
  IF position('scraper_price_valid:=true' IN definition)=0 THEN
    RAISE EXCEPTION 'Price-integrity evidence anchor missing';
  END IF;
  EXECUTE definition;
END $migration$;

ALTER FUNCTION twuanis_canonical_private.decide_listing_price(public.listings) OWNER TO postgres;

COMMIT;
