-- Step11 authorized presentation-only Spanish canonical Package copy.
-- LOCAL PREPARATION ONLY. No execution against production in this task.
-- Existing bilingual columns are the sole runtime authority; no React translation registry.
BEGIN;
SET LOCAL lock_timeout='5s';
DO $$
DECLARE x record;p twuanis_canonical_private.intelligence_packages%ROWTYPE;
BEGIN
 IF current_user<>'postgres' THEN RAISE EXCEPTION 'reviewed administrative installation required';END IF;
 FOR x IN SELECT * FROM (VALUES
 ('pkg-geographic-distribution-price-range','Property Listings Geographic Distribution and Price Range Package','What is the geographic-area listing count, how are the property characteristics distributed among the listings in that defined market area, and what are the distribution and range of asking prices for those listings?','Paquete de distribución geográfica de anuncios inmobiliarios y rango de precios','¿Cuántos anuncios hay en el área geográfica, cómo se distribuyen las características de las propiedades entre los anuncios de esa área de mercado definida y cuáles son la distribución y el rango de los precios solicitados de esos anuncios?'),
 ('pkg-matching-market-comparison','Characteristics-to-Property Matching and Market Price Comparisons Package','Which properties match the selected property characteristics within a defined Costa Rican real estate market, and how do the matched properties and selected markets compare with respect to asking-price evidence and Price / m² across the relevant geographic areas?','Paquete de correspondencia entre características y propiedades y de comparaciones de precios de mercado','¿Qué propiedades coinciden con las características seleccionadas dentro de un mercado inmobiliario costarricense definido y cómo se comparan las propiedades coincidentes y los mercados seleccionados en cuanto a la evidencia de precios solicitados y al Precio / m² en las áreas geográficas pertinentes?'),
 ('pkg-pricing-position-relationships','Property Pricing, Market Position & Property-Price Relationships Package','How is Price / m² distributed within a defined Costa Rican real estate market; how common or uncommon is a selected property configuration within its eligible market population; how does Price / m² vary in relation to property size and the relationship between construction area and property area; where does a selected property''s Price / m² fall within its established reference population; which properties satisfy a user-defined comparable cohort and how do explicitly defined cohorts compare with respect to Price / m²; what pricing patterns, differences, ordering, magnitudes, reversals, consistency, and ranges appear when Price / m² is analyzed across selected dimensions; what relationship exists between construction-area Price / m² and property-area Price / m² as construction area and property area vary; and what is the property''s weighted Price / m² under the explicitly defined weighting question?','Paquete de precios de propiedades, posición en el mercado y relaciones entre propiedades y precios','¿Cómo se distribuye el Precio / m² dentro de un mercado inmobiliario costarricense definido; qué tan común o poco común es una configuración de propiedad seleccionada dentro de su población de mercado elegible; cómo varía el Precio / m² en relación con el tamaño de la propiedad y la relación entre el área de construcción y el área del terreno; dónde se sitúa el Precio / m² de una propiedad seleccionada dentro de su población de referencia establecida; qué propiedades cumplen los criterios de una cohorte de comparables definida por el usuario y cómo se comparan las cohortes definidas explícitamente en cuanto al Precio / m²; qué patrones de precios, diferencias, ordenamientos, magnitudes, inversiones, consistencia y rangos aparecen al analizar el Precio / m² en las dimensiones seleccionadas; qué relación existe entre el precio solicitado por m² de área de construcción y el precio solicitado por m² de área del terreno a medida que varían el área de construcción y el área del terreno; y cuál es el Precio / m² ponderado de la propiedad según la pregunta de ponderación definida explícitamente?')
 ) AS copy(id,name_en,question_en,name_es,question_es) LOOP
  SELECT * INTO STRICT p FROM twuanis_canonical_private.intelligence_packages WHERE id=x.id FOR UPDATE;
  IF p.name_en IS DISTINCT FROM x.name_en OR p.question_en IS DISTINCT FROM x.question_en THEN
   RAISE EXCEPTION 'canonical English copy differs from reviewed translation anchor: %',x.id;
  END IF;
  IF (p.name_es IS NOT NULL AND p.name_es IS DISTINCT FROM x.name_es)
   OR (p.question_es IS NOT NULL AND p.question_es IS DISTINCT FROM x.question_es) THEN
   RAISE EXCEPTION 'existing Spanish copy requires review: %',x.id;
  END IF;
  IF p.name_es IS DISTINCT FROM x.name_es OR p.question_es IS DISTINCT FROM x.question_es THEN
   UPDATE twuanis_canonical_private.intelligence_packages
   SET name_es=x.name_es,question_es=x.question_es,revision=revision+1,updated_at=clock_timestamp()
   WHERE id=x.id;
  END IF;
 END LOOP;
END$$;
-- The copy concurrency revision advances; configuration identity/version, terms,
-- capabilities, prices, Offer relationships and entitlement authority do not change.
COMMIT;
