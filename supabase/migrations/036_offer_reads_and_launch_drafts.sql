-- Local Step6 reads and nonapplicable launch drafts. No production activation.
BEGIN;
CREATE FUNCTION public.admin_offer_read(p_after uuid DEFAULT NULL,p_status text DEFAULT NULL,p_kind text DEFAULT NULL,p_target text DEFAULT NULL,p_currency text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE v jsonb;at_time timestamptz:=statement_timestamp();
BEGIN
 PERFORM twuanis_canonical_private.assert_administrative_permission('offers.read');
 IF (p_status IS NOT NULL AND p_status NOT IN ('draft','scheduled','active','ended','archived')) OR (p_kind IS NOT NULL AND p_kind NOT IN ('package','addon')) OR length(p_target)>150 OR (p_currency IS NOT NULL AND p_currency NOT IN ('USD','CRC')) THEN RAISE EXCEPTION 'invalid filter'; END IF;
 SELECT coalesce(jsonb_agg(twuanis_canonical_private.offer_projection(q.id,at_time) ORDER BY q.id),'[]') INTO v FROM (
 SELECT o.id FROM twuanis_canonical_private.offers o JOIN twuanis_canonical_private.offer_configurations c ON c.id=o.current_configuration_id
 WHERE (p_after IS NULL OR o.id>p_after) AND (p_status IS NULL OR twuanis_canonical_private.offer_status(o.state,c.starts_at,c.ends_at,at_time)=p_status)
 AND (p_kind IS NULL OR (p_kind='package')=(o.package_id IS NOT NULL)) AND (p_target IS NULL OR coalesce(o.package_id,o.addon_id)=p_target)
 AND (p_currency IS NULL OR EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_scalar_prices WHERE configuration_id=c.id AND currency=p_currency) OR EXISTS(SELECT 1 FROM twuanis_canonical_private.offer_quantity_tiers WHERE configuration_id=c.id AND currency=p_currency))
 ORDER BY o.id LIMIT 26)q;
 RETURN jsonb_build_object('offers',v,'observedAt',at_time);
END $$;
CREATE FUNCTION public.admin_offer_targets(p_kind text,p_after text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE v jsonb;
BEGIN
 PERFORM twuanis_canonical_private.assert_administrative_permission('offers.read');
 IF length(p_after)>150 OR p_kind IS NULL OR p_kind NOT IN ('package','addon') THEN RAISE EXCEPTION 'invalid target filter'; END IF;
 IF p_kind='package' THEN
  SELECT coalesce(jsonb_agg(twuanis_canonical_private.package_projection(q.id) ORDER BY q.id),'[]') INTO v FROM (SELECT id FROM twuanis_canonical_private.intelligence_packages WHERE state='active' AND (p_after IS NULL OR id>p_after) ORDER BY id LIMIT 26)q;
 ELSE
  SELECT coalesce(jsonb_agg(twuanis_canonical_private.addon_projection(q.id) ORDER BY q.id),'[]') INTO v FROM (SELECT id FROM twuanis_canonical_private.addon_products WHERE state='active' AND term_kind<>'unconfigured' AND (p_after IS NULL OR id>p_after) ORDER BY id LIMIT 26)q;
 END IF;
 RETURN v;
END $$;
CREATE FUNCTION public.read_offer_prices(p_kind text,p_products text[],p_currency text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE v jsonb:='[]';pid text;r jsonb;at_time timestamptz:=statement_timestamp();tier record;projected_tiers jsonb;
BEGIN
 IF p_kind IS NULL OR p_kind NOT IN ('package','addon') OR p_currency IS NULL OR p_currency NOT IN ('USD','CRC') OR p_products IS NULL OR cardinality(p_products)>25 OR array_ndims(p_products)>1 THEN RAISE EXCEPTION 'bounded catalog request required'; END IF;
 FOR pid IN SELECT DISTINCT unnest(p_products) LOOP
  IF pid IS NULL OR length(pid)>150 THEN RAISE EXCEPTION 'invalid product identity'; END IF;
  -- A public catalog cannot supply authoritative accepted Bulk Import quantity.
  IF p_kind='addon' AND pid='addon-bulk-listing-import' THEN
   projected_tiers:='[]';
   FOR tier IN SELECT t.lower_quantity,t.upper_quantity FROM twuanis_canonical_private.addon_products p JOIN twuanis_canonical_private.addon_quantity_tiers t ON t.configuration_id=p.current_configuration_id WHERE p.id=pid AND p.state='active' AND t.currency=p_currency ORDER BY t.lower_quantity LOOP
    r:=twuanis_canonical_private.resolve_offer_price(p_kind,pid,p_currency,tier.lower_quantity,at_time);
    projected_tiers:=projected_tiers||jsonb_build_array(jsonb_build_object('min',tier.lower_quantity,'max',tier.upper_quantity,'standardRate',r->'standardRate','effectiveRate',r->'effectiveRate','source',r->'source','offerEnd',r->'offerEnd'));
   END LOOP;
   v:=v||jsonb_build_array(jsonb_build_object('productId',pid,'currency',p_currency,'available',jsonb_array_length(projected_tiers)>0,'tiers',projected_tiers,'checkoutAvailable',false));
   CONTINUE;
  END IF;
  r:=twuanis_canonical_private.resolve_offer_price(p_kind,pid,p_currency,1,at_time);
  v:=v||jsonb_build_array(jsonb_build_object('productId',pid,'available',r->'available','reason',r->'reason','currency',p_currency,'standardPrice',r->'standardRate','effectivePrice',r->'effectiveRate','source',r->'source','offerEnd',r->'offerEnd','name_en',r->'name_en','name_es',r->'name_es','checkoutAvailable',false));
 END LOOP;
 RETURN v;
END $$;
REVOKE ALL ON FUNCTION public.admin_offer_read(uuid,text,text,text,text),public.admin_offer_targets(text,text),public.read_offer_prices(text,text[],text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.admin_offer_read(uuid,text,text,text,text),public.admin_offer_targets(text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.read_offer_prices(text,text[],text) TO anon,authenticated,service_role;
-- Draft seeds have no executable pricing authority. Actual general start is set at later approved activation.
DO $$ DECLARE x record;oid uuid;cid uuid;en text;es text; BEGIN
 FOR x IN SELECT * FROM (VALUES
 ('package','pkg-geographic-distribution-price-range','1','500'),
 ('package','pkg-matching-market-comparison','20','10000'),
 ('package','pkg-pricing-position-relationships','40','20000'),
 ('addon','addon-featured-listing','3','1500'),
 ('addon','addon-listing-boost','1.25','625'),
 ('addon','addon-homepage-exposure','8.75','4375'),
 ('addon','addon-province-exposure','4.50','2250'),
 ('addon','addon-property-type-exposure','4.50','2250'),
 ('addon','addon-2026-founding-membership','200',NULL),
 ('addon','addon-bulk-listing-import',NULL,NULL)) AS seed(kind,pid,usd,crc) LOOP
  oid:=gen_random_uuid();cid:=gen_random_uuid();
  IF x.kind='package' THEN SELECT name_en,coalesce(name_es,name_en) INTO en,es FROM twuanis_canonical_private.intelligence_packages WHERE id=x.pid;
  ELSE SELECT name_en,coalesce(name_es,name_en) INTO en,es FROM twuanis_canonical_private.addon_products WHERE id=x.pid; END IF;
  INSERT INTO twuanis_canonical_private.offers(id,package_id,addon_id,current_configuration_id)
  VALUES(oid,CASE WHEN x.kind='package' THEN x.pid END,CASE WHEN x.kind='addon' THEN x.pid END,cid);
  INSERT INTO twuanis_canonical_private.offer_configurations(id,offer_id,version,name_en,name_es,starts_at,ends_at,price_shape)
  VALUES(cid,oid,1,'2026 Introductory Offer: '||en,'Oferta introductoria 2026: '||es,
  '2026-10-10 00:00:00 America/Costa_Rica',CASE WHEN x.pid='addon-2026-founding-membership' THEN '2027-04-10 23:59:59 America/Costa_Rica'::timestamptz ELSE '2026-12-31 23:59:59 America/Costa_Rica'::timestamptz END,
  CASE WHEN x.pid='addon-bulk-listing-import' THEN 'whole_job' ELSE 'scalar' END);
  IF x.usd IS NOT NULL THEN INSERT INTO twuanis_canonical_private.offer_scalar_prices VALUES(cid,'USD',x.usd::numeric); END IF;
  IF x.crc IS NOT NULL THEN INSERT INTO twuanis_canonical_private.offer_scalar_prices VALUES(cid,'CRC',x.crc::numeric); END IF;
  IF x.pid='addon-bulk-listing-import' THEN INSERT INTO twuanis_canonical_private.offer_quantity_tiers VALUES(cid,'USD',1,25,.25),(cid,'USD',26,100,.12),(cid,'USD',101,500,.05); END IF;
 END LOOP;
END $$;
COMMIT;
