-- Step 4 LOCAL PREPARATION ONLY. Requires 026. No legacy catalog/access cutover.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
DO $$ BEGIN IF current_user<>'postgres' THEN RAISE EXCEPTION 'postgres installation required'; END IF; END $$;
CREATE TABLE twuanis_canonical_private.intelligence_capabilities(
 id text PRIMARY KEY CHECK(id ~ '^cap-[a-z0-9-]+$'), name_en text NOT NULL, name_es text NOT NULL
);
CREATE TABLE twuanis_canonical_private.intelligence_packages(
 id text PRIMARY KEY CHECK(id ~ '^pkg-[a-z0-9-]+$'),
 name_en text NOT NULL CHECK(length(btrim(name_en)) BETWEEN 1 AND 300),
 name_es text CHECK(length(btrim(name_es)) BETWEEN 1 AND 300),
 question_en text NOT NULL CHECK(length(btrim(question_en)) BETWEEN 1 AND 4000),
 question_es text CHECK(length(btrim(question_es)) BETWEEN 1 AND 4000),
 state text NOT NULL CHECK(state IN ('draft','active','inactive','archived')),
 trial_eligible boolean NOT NULL DEFAULT true,
 revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
 current_configuration_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE twuanis_canonical_private.intelligence_package_configurations(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 package_id text NOT NULL REFERENCES twuanis_canonical_private.intelligence_packages(id),
 version bigint NOT NULL CHECK(version>0),
 term_quantity integer NOT NULL CHECK(term_quantity BETWEEN 1 AND 120),
 term_unit text NOT NULL CHECK(term_unit='month'),
 capabilities text[] NOT NULL CHECK(cardinality(capabilities) BETWEEN 0 AND 17),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(package_id,version), UNIQUE(package_id,id)
);
ALTER TABLE twuanis_canonical_private.intelligence_packages ADD CONSTRAINT intelligence_package_current_configuration
 FOREIGN KEY(id,current_configuration_id) REFERENCES twuanis_canonical_private.intelligence_package_configurations(package_id,id) DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE twuanis_canonical_private.intelligence_package_prices(
 package_id text NOT NULL REFERENCES twuanis_canonical_private.intelligence_packages(id),
 currency text NOT NULL CHECK(currency IN ('USD','CRC')),
 amount numeric NOT NULL CHECK(amount>0 AND amount<1000000000000 AND scale(amount)<=2),
 PRIMARY KEY(package_id,currency)
);
-- Minimal purchased-right storage/reader; NO runtime grant/fulfillment API in Step 4.
CREATE TABLE twuanis_canonical_private.intelligence_package_rights(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),account_id uuid NOT NULL REFERENCES auth.users(id),
 package_id text NOT NULL,configuration_id uuid NOT NULL,
 starts_at timestamptz NOT NULL,ends_at timestamptz NOT NULL,
 revoked_at timestamptz,provenance text NOT NULL CHECK(length(btrim(provenance)) BETWEEN 1 AND 500),
 FOREIGN KEY(package_id,configuration_id) REFERENCES twuanis_canonical_private.intelligence_package_configurations(package_id,id),
 CHECK(isfinite(starts_at) AND isfinite(ends_at) AND ends_at>starts_at)
);
CREATE INDEX intelligence_package_rights_account ON twuanis_canonical_private.intelligence_package_rights(account_id,ends_at) WHERE revoked_at IS NULL;
CREATE FUNCTION twuanis_canonical_private.validate_package_configuration() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF NEW.capabilities IS DISTINCT FROM (SELECT coalesce(array_agg(DISTINCT c ORDER BY c),'{}'::text[]) FROM unnest(NEW.capabilities)c)
 OR EXISTS(SELECT 1 FROM unnest(NEW.capabilities)c WHERE NOT EXISTS(SELECT 1 FROM twuanis_canonical_private.intelligence_capabilities WHERE id=c)) THEN RAISE EXCEPTION 'invalid capability set'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER intelligence_configuration_validate BEFORE INSERT ON twuanis_canonical_private.intelligence_package_configurations FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.validate_package_configuration();
CREATE TRIGGER intelligence_configuration_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON twuanis_canonical_private.intelligence_package_configurations FOR EACH STATEMENT EXECUTE FUNCTION twuanis_canonical_private.administrative_immutable();
CREATE FUNCTION twuanis_canonical_private.validate_package_catalog() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 IF EXISTS(SELECT c FROM twuanis_canonical_private.intelligence_packages p JOIN twuanis_canonical_private.intelligence_package_configurations v ON v.id=p.current_configuration_id CROSS JOIN LATERAL unnest(v.capabilities)c WHERE p.state<>'archived' GROUP BY c HAVING count(*)>1) THEN RAISE EXCEPTION 'capability already assigned to another current package'; END IF;
 IF EXISTS(SELECT 1 FROM twuanis_canonical_private.intelligence_packages p JOIN twuanis_canonical_private.intelligence_package_configurations v ON v.id=p.current_configuration_id WHERE p.state='active' AND (cardinality(v.capabilities)=0 OR (SELECT count(*) FROM twuanis_canonical_private.intelligence_package_prices s WHERE s.package_id=p.id)<>2)) THEN RAISE EXCEPTION 'active package incomplete'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER intelligence_catalog_valid AFTER INSERT OR UPDATE ON twuanis_canonical_private.intelligence_packages DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION twuanis_canonical_private.validate_package_catalog();
CREATE FUNCTION twuanis_canonical_private.package_projection(p_id text) RETURNS jsonb
LANGUAGE sql STABLE SET search_path=pg_catalog AS $$
 SELECT jsonb_build_object('id',p.id,'name_en',p.name_en,'name_es',p.name_es,'question_en',p.question_en,'question_es',p.question_es,'state',p.state,'trialEligible',p.trial_eligible,'revision',p.revision::text,'configurationId',v.id,'version',v.version::text,'termQuantity',v.term_quantity,'termUnit',v.term_unit,'capabilities',v.capabilities,'standardPrices',coalesce((SELECT jsonb_object_agg(currency,amount::text) FROM twuanis_canonical_private.intelligence_package_prices WHERE package_id=p.id),'{}'::jsonb),'acquisitionAvailable',false,'acquisitionState','fulfillment_not_activated')
 FROM twuanis_canonical_private.intelligence_packages p JOIN twuanis_canonical_private.intelligence_package_configurations v ON v.package_id=p.id AND v.id=p.current_configuration_id WHERE p.id=p_id
$$;
CREATE FUNCTION public.admin_package_read(p_after text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE a uuid; v jsonb;
BEGIN
 a:=twuanis_canonical_private.assert_administrative_permission('packages.read');
 IF length(p_after)>150 THEN RAISE EXCEPTION 'invalid cursor'; END IF;
 SELECT coalesce(jsonb_agg(twuanis_canonical_private.package_projection(id) ORDER BY id),'[]') INTO v FROM (SELECT id FROM twuanis_canonical_private.intelligence_packages WHERE p_after IS NULL OR id>p_after ORDER BY id LIMIT 26)q;
 RETURN jsonb_build_object('packages',v,'capabilities',(SELECT jsonb_agg(jsonb_build_object('id',id,'en',name_en,'es',name_es) ORDER BY id) FROM twuanis_canonical_private.intelligence_capabilities));
END $$;
-- Public catalog is an explicit bounded allowlist, never an access grant.
CREATE FUNCTION public.read_intelligence_package_catalog(p_after text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE result jsonb;
BEGIN
 IF length(p_after)>150 THEN RAISE EXCEPTION 'invalid cursor'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object(
 'id',q.id,'name_en',q.name_en,'name_es',q.name_es,'question_en',q.question_en,'question_es',q.question_es,
 'termQuantity',v.term_quantity,'termUnit',v.term_unit,'trialEligible',q.trial_eligible,'capabilities',v.capabilities,
 'standardPrices',(SELECT jsonb_object_agg(currency,amount::text) FROM twuanis_canonical_private.intelligence_package_prices WHERE package_id=q.id),
 'acquisitionAvailable',false,'acquisitionState','fulfillment_not_activated') ORDER BY q.id),'[]') INTO result
 FROM (SELECT * FROM twuanis_canonical_private.intelligence_packages WHERE state='active' AND (p_after IS NULL OR id>p_after) ORDER BY id LIMIT 26)q
 JOIN twuanis_canonical_private.intelligence_package_configurations v ON v.id=q.current_configuration_id;
 RETURN result;
END $$;
CREATE FUNCTION public.current_account_has_capability(p_capability text) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE a uuid:=auth.uid();
BEGIN
 IF a IS NULL OR auth.jwt()->>'role' IS DISTINCT FROM 'authenticated' THEN RETURN false; END IF;
 RETURN EXISTS(SELECT 1 FROM twuanis_canonical_private.intelligence_package_rights r JOIN twuanis_canonical_private.intelligence_package_configurations v ON v.id=r.configuration_id AND v.package_id=r.package_id
 WHERE r.account_id=a AND r.revoked_at IS NULL AND r.starts_at<=statement_timestamp() AND r.ends_at>statement_timestamp() AND p_capability=ANY(v.capabilities));
END $$;
CREATE FUNCTION public.admin_package_command(p_request uuid,p_command jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE a uuid; p twuanis_canonical_private.intelligence_packages%ROWTYPE; v twuanis_canonical_private.intelligence_package_configurations%ROWTYPE;
 prior twuanis_canonical_private.administrative_receipts%ROWTYPE; before_data jsonb; after_data jsonb; op text; pid text; caps text[]; quantity integer; next_id uuid; e bigint; new_amount numeric; authority text;
BEGIN
 a:=twuanis_canonical_private.assert_administrative_permission('packages.manage');
 IF p_request IS NULL OR p_command IS NULL OR jsonb_typeof(p_command)<>'object' OR octet_length(p_command::text)>16000 THEN RAISE EXCEPTION 'bounded command required'; END IF;

 IF p_command->>'operation'='create' THEN
  IF EXISTS(SELECT 1 FROM jsonb_object_keys(p_command) k WHERE k<>ALL(ARRAY['operation','name_en','question_en','reason']))
   OR jsonb_typeof(p_command->'name_en') IS DISTINCT FROM 'string' OR jsonb_typeof(p_command->'question_en') IS DISTINCT FROM 'string'
   OR length(coalesce(p_command->>'reason',''))>2000 THEN RAISE EXCEPTION 'invalid create input'; END IF;
  SELECT * INTO prior FROM twuanis_canonical_private.administrative_receipts WHERE actor_id=a AND request_id=p_request;
  IF FOUND THEN
   IF prior.command IS DISTINCT FROM jsonb_build_object('domain','packages','command',p_command) THEN RAISE EXCEPTION 'request conflict'; END IF;
   SELECT after_state INTO after_data FROM twuanis_canonical_private.administrative_events WHERE id=prior.event_id;
   RETURN jsonb_build_object('ok',true,'packageId',after_data->>'id','configurationId',after_data->>'configurationId','eventId',prior.event_id::text,'replayed',true);
  END IF;
  pid:='pkg-'||gen_random_uuid()::text;next_id:=gen_random_uuid();
  INSERT INTO twuanis_canonical_private.intelligence_packages(id,name_en,question_en,state,trial_eligible,current_configuration_id)
   VALUES(pid,p_command->>'name_en',p_command->>'question_en','draft',false,next_id);
  INSERT INTO twuanis_canonical_private.intelligence_package_configurations(id,package_id,version,term_quantity,term_unit,capabilities)
   VALUES(next_id,pid,1,1,'month','{}'::text[]);
  after_data:=twuanis_canonical_private.package_projection(pid);
  authority:=CASE WHEN EXISTS(SELECT 1 FROM twuanis_canonical_private.owner_access_grants WHERE user_id=a AND revoked_at IS NULL) THEN 'owner' ELSE 'scoped_administrator' END;
  e:=twuanis_canonical_private.append_administrative_event(a,authority,'packages.manage','package.create','package',NULL,NULL,after_data,p_command->>'reason',p_request);
  INSERT INTO twuanis_canonical_private.administrative_receipts VALUES(a,p_request,jsonb_build_object('domain','packages','command',p_command),e);
  RETURN jsonb_build_object('ok',true,'packageId',pid,'configurationId',next_id,'eventId',e::text,'replayed',false);
 END IF;
 op:=p_command->>'operation';pid:=p_command->>'package';
 IF op IS NULL OR op NOT IN ('copy','price','configuration','lifecycle') OR pid IS NULL OR length(pid)>150 OR p_command->>'expected' IS NULL OR length(coalesce(p_command->>'reason',''))>2000
 OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_command)k WHERE k<>ALL(ARRAY['operation','package','expected','reason']||CASE op WHEN 'copy' THEN ARRAY['name_en','name_es','question_en','question_es'] WHEN 'price' THEN ARRAY['currency','amount'] WHEN 'configuration' THEN ARRAY['capabilities','termQuantity'] ELSE ARRAY['state'] END)) THEN RAISE EXCEPTION 'invalid command'; END IF;
 SELECT * INTO prior FROM twuanis_canonical_private.administrative_receipts WHERE actor_id=a AND request_id=p_request;
 IF FOUND THEN
  IF prior.command IS DISTINCT FROM jsonb_build_object('domain','packages','command',p_command) THEN RAISE EXCEPTION 'request conflict'; END IF;
  RETURN jsonb_build_object('ok',true,'eventId',prior.event_id::text,'replayed',true);
 END IF;
 SELECT * INTO STRICT p FROM twuanis_canonical_private.intelligence_packages WHERE id=pid FOR UPDATE;
 IF p.revision::text IS DISTINCT FROM p_command->>'expected' THEN RAISE EXCEPTION 'stale package revision' USING ERRCODE='40001'; END IF;
 IF p.state='archived' THEN RAISE EXCEPTION 'archived package is read only'; END IF;
 SELECT * INTO STRICT v FROM twuanis_canonical_private.intelligence_package_configurations WHERE id=p.current_configuration_id;
 before_data:=twuanis_canonical_private.package_projection(pid);
 IF op='copy' THEN
  IF jsonb_typeof(p_command->'name_en') IS DISTINCT FROM 'string' OR jsonb_typeof(p_command->'question_en') IS DISTINCT FROM 'string'
  OR (p_command ? 'name_es' AND jsonb_typeof(p_command->'name_es') NOT IN ('string','null')) OR (p_command ? 'question_es' AND jsonb_typeof(p_command->'question_es') NOT IN ('string','null')) THEN RAISE EXCEPTION 'invalid copy'; END IF;
  UPDATE twuanis_canonical_private.intelligence_packages SET name_en=p_command->>'name_en',question_en=p_command->>'question_en',name_es=CASE WHEN p_command ? 'name_es' THEN p_command->>'name_es' ELSE name_es END,question_es=CASE WHEN p_command ? 'question_es' THEN p_command->>'question_es' ELSE question_es END WHERE id=pid;
 ELSIF op='price' THEN
  IF p_command->>'currency' IS NULL OR p_command->>'currency' NOT IN ('USD','CRC') OR jsonb_typeof(p_command->'amount') IS DISTINCT FROM 'string' OR (p_command->>'amount') !~ '^[0-9]+(\.[0-9]{1,2})?$' THEN RAISE EXCEPTION 'invalid price'; END IF;
  new_amount:=(p_command->>'amount')::numeric;
  INSERT INTO twuanis_canonical_private.intelligence_package_prices(package_id,currency,amount) VALUES(pid,p_command->>'currency',new_amount) ON CONFLICT(package_id,currency) DO UPDATE SET amount=EXCLUDED.amount;
 ELSIF op='configuration' THEN
  caps:=v.capabilities;quantity:=v.term_quantity;
  IF p_command ? 'capabilities' THEN
   IF jsonb_typeof(p_command->'capabilities') IS DISTINCT FROM 'array' OR jsonb_array_length(p_command->'capabilities')>17 OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_command->'capabilities')c WHERE jsonb_typeof(c)<>'string') THEN RAISE EXCEPTION 'invalid capabilities'; END IF;
   SELECT coalesce(array_agg(c ORDER BY c),'{}'::text[]) INTO caps FROM jsonb_array_elements_text(p_command->'capabilities')c;
  END IF;
  IF p_command ? 'termQuantity' THEN
   IF jsonb_typeof(p_command->'termQuantity') IS DISTINCT FROM 'number' OR (p_command->>'termQuantity') !~ '^[1-9][0-9]*$' THEN RAISE EXCEPTION 'invalid typed month quantity'; END IF;
   quantity:=(p_command->>'termQuantity')::integer;
  END IF;
  IF caps IS NOT DISTINCT FROM v.capabilities AND quantity=v.term_quantity THEN RAISE EXCEPTION 'no configuration change'; END IF;
  next_id:=gen_random_uuid();
  INSERT INTO twuanis_canonical_private.intelligence_package_configurations(id,package_id,version,term_quantity,term_unit,capabilities) VALUES(next_id,pid,v.version+1,quantity,'month',caps);
  UPDATE twuanis_canonical_private.intelligence_packages SET current_configuration_id=next_id WHERE id=pid;
 ELSE
  IF p_command->>'state' IS NULL OR NOT ((p.state='draft' AND p_command->>'state' IN ('active','inactive','archived')) OR (p.state='active' AND p_command->>'state' IN ('inactive','archived')) OR (p.state='inactive' AND p_command->>'state' IN ('active','archived'))) THEN RAISE EXCEPTION 'invalid lifecycle transition'; END IF;
  IF p_command->>'state'='archived' AND nullif(btrim(p_command->>'reason'),'') IS NULL THEN RAISE EXCEPTION 'archive reason required'; END IF;
  UPDATE twuanis_canonical_private.intelligence_packages SET state=p_command->>'state' WHERE id=pid;
 END IF;
 UPDATE twuanis_canonical_private.intelligence_packages SET revision=revision+1,updated_at=clock_timestamp() WHERE id=pid;
 -- Validate before writing the successful audit/receipt, and again at commit.
 IF EXISTS(SELECT c FROM twuanis_canonical_private.intelligence_packages x JOIN twuanis_canonical_private.intelligence_package_configurations y ON y.id=x.current_configuration_id CROSS JOIN LATERAL unnest(y.capabilities)c WHERE x.state<>'archived' GROUP BY c HAVING count(*)>1) THEN RAISE EXCEPTION 'capability already assigned'; END IF;
 after_data:=twuanis_canonical_private.package_projection(pid);
 authority:=CASE WHEN EXISTS(SELECT 1 FROM twuanis_canonical_private.owner_access_grants WHERE user_id=a AND revoked_at IS NULL) THEN 'owner' ELSE 'scoped_administrator' END;
 e:=twuanis_canonical_private.append_administrative_event(a,authority,'packages.manage','package.'||op,'package',NULL,before_data,after_data,p_command->>'reason',p_request);
 INSERT INTO twuanis_canonical_private.administrative_receipts VALUES(a,p_request,jsonb_build_object('domain','packages','command',p_command),e);
 RETURN jsonb_build_object('ok',true,'eventId',e::text,'replayed',false,'revision',(p.revision+1)::text);
END $$;

INSERT INTO twuanis_canonical_private.intelligence_capabilities VALUES('cap-market-summary','Market Summary','Resumen del mercado');
INSERT INTO twuanis_canonical_private.intelligence_capabilities VALUES('cap-market-composition','Market Composition','Composición del mercado');
INSERT INTO twuanis_canonical_private.intelligence_capabilities VALUES('cap-market-asking-price-distribution','Market Asking Price Distribution','Distribución de precios de oferta del mercado');
INSERT INTO twuanis_canonical_private.intelligence_capabilities VALUES('cap-property-matching','Property Matching','Coincidencia de Propiedades');
INSERT INTO twuanis_canonical_private.intelligence_capabilities VALUES('cap-market-comparison','Market Comparison','Comparación de Mercados');
INSERT INTO twuanis_canonical_private.intelligence_capabilities VALUES('cap-property-configuration-frequency','Property Configuration Frequency','Frecuencia de configuración de propiedades');
INSERT INTO twuanis_canonical_private.intelligence_capabilities VALUES('cap-price-m2-distribution','Price / m² Distribution','Distribución del precio por m²');
INSERT INTO twuanis_canonical_private.intelligence_capabilities VALUES('cap-geographic-price-m2-comparison','Geographic Price / m² Comparison','Comparación geográfica del precio por m²');
INSERT INTO twuanis_canonical_private.intelligence_capabilities VALUES('cap-size-price-m2','Size → Price / m²','Tamaño → Precio por m²');
INSERT INTO twuanis_canonical_private.intelligence_capabilities VALUES('cap-construction-land-price-m2','Construction-to-Land → Price / m²','Construcción/terreno → Precio por m²');
INSERT INTO twuanis_canonical_private.intelligence_capabilities VALUES('cap-user-defined-cohort-price-m2-comparison','User-Defined Cohort Price / m² Comparison','Comparación de precio por m² entre cohortes definidas por el usuario');
INSERT INTO twuanis_canonical_private.intelligence_capabilities VALUES('cap-cross-dimensional-analysis','Cross-Dimensional Analysis','Análisis multidimensional');
INSERT INTO twuanis_canonical_private.intelligence_capabilities VALUES('cap-comparative-price-m2-discovery','Comparative Price / m² Discovery','Descubrimiento comparativo de precio / m²');
INSERT INTO twuanis_canonical_private.intelligence_capabilities VALUES('cap-property-price-m2-position','Property Price / m² Position','Posición del precio por m² de una propiedad');
INSERT INTO twuanis_canonical_private.intelligence_capabilities VALUES('cap-user-defined-comparable-cohort','User-Defined Comparable Cohort','Cohorte comparable definida por el usuario');
INSERT INTO twuanis_canonical_private.intelligence_capabilities VALUES('cap-asking-area-coefficient-ratio','Construction Area-to-Property Area Asking-Price Relationship Ratio','Relación entre los coeficientes del precio de oferta por m² de área de construcción y de área del terreno');
INSERT INTO twuanis_canonical_private.intelligence_capabilities VALUES('cap-weighted-price-m2','Weighted Price / m²','Precio ponderado por m²');
INSERT INTO twuanis_canonical_private.intelligence_packages(id,name_en,name_es,question_en,question_es,state,current_configuration_id) VALUES('pkg-geographic-distribution-price-range','Property Listings Geographic Distribution and Price Range Package',NULL,'What is the geographic-area listing count, how are the property characteristics distributed among the listings in that defined market area, and what are the distribution and range of asking prices for those listings?',NULL,'active','04000000-0000-4000-8000-000000000001');
INSERT INTO twuanis_canonical_private.intelligence_package_configurations(id,package_id,version,term_quantity,term_unit,capabilities) VALUES('04000000-0000-4000-8000-000000000001','pkg-geographic-distribution-price-range',1,1,'month',ARRAY['cap-market-asking-price-distribution','cap-market-composition','cap-market-summary']);
INSERT INTO twuanis_canonical_private.intelligence_package_prices VALUES('pkg-geographic-distribution-price-range','USD',10);
INSERT INTO twuanis_canonical_private.intelligence_package_prices VALUES('pkg-geographic-distribution-price-range','CRC',5000);
INSERT INTO twuanis_canonical_private.intelligence_packages(id,name_en,name_es,question_en,question_es,state,current_configuration_id) VALUES('pkg-matching-market-comparison','Characteristics-to-Property Matching and Market Price Comparisons Package',NULL,'Which properties match the selected property characteristics within a defined Costa Rican real estate market, and how do the matched properties and selected markets compare with respect to asking-price evidence and Price / m² across the relevant geographic areas?',NULL,'active','04000000-0000-4000-8000-000000000002');
INSERT INTO twuanis_canonical_private.intelligence_package_configurations(id,package_id,version,term_quantity,term_unit,capabilities) VALUES('04000000-0000-4000-8000-000000000002','pkg-matching-market-comparison',1,1,'month',ARRAY['cap-comparative-price-m2-discovery','cap-geographic-price-m2-comparison','cap-market-comparison','cap-property-matching']);
INSERT INTO twuanis_canonical_private.intelligence_package_prices VALUES('pkg-matching-market-comparison','USD',50);
INSERT INTO twuanis_canonical_private.intelligence_package_prices VALUES('pkg-matching-market-comparison','CRC',25000);
INSERT INTO twuanis_canonical_private.intelligence_packages(id,name_en,name_es,question_en,question_es,state,current_configuration_id) VALUES('pkg-pricing-position-relationships','Property Pricing, Market Position & Property-Price Relationships Package',NULL,'How is Price / m² distributed within a defined Costa Rican real estate market; how common or uncommon is a selected property configuration within its eligible market population; how does Price / m² vary in relation to property size and the relationship between construction area and property area; where does a selected property''s Price / m² fall within its established reference population; which properties satisfy a user-defined comparable cohort and how do explicitly defined cohorts compare with respect to Price / m²; what pricing patterns, differences, ordering, magnitudes, reversals, consistency, and ranges appear when Price / m² is analyzed across selected dimensions; what relationship exists between construction-area Price / m² and property-area Price / m² as construction area and property area vary; and what is the property''s weighted Price / m² under the explicitly defined weighting question?',NULL,'active','04000000-0000-4000-8000-000000000003');
INSERT INTO twuanis_canonical_private.intelligence_package_configurations(id,package_id,version,term_quantity,term_unit,capabilities) VALUES('04000000-0000-4000-8000-000000000003','pkg-pricing-position-relationships',1,1,'month',ARRAY['cap-asking-area-coefficient-ratio','cap-construction-land-price-m2','cap-cross-dimensional-analysis','cap-price-m2-distribution','cap-property-configuration-frequency','cap-property-price-m2-position','cap-size-price-m2','cap-user-defined-cohort-price-m2-comparison','cap-user-defined-comparable-cohort','cap-weighted-price-m2']);
INSERT INTO twuanis_canonical_private.intelligence_package_prices VALUES('pkg-pricing-position-relationships','USD',100);
INSERT INTO twuanis_canonical_private.intelligence_package_prices VALUES('pkg-pricing-position-relationships','CRC',50000);
SET CONSTRAINTS ALL IMMEDIATE;
DO $$ DECLARE t text; f regprocedure; BEGIN
 FOREACH t IN ARRAY ARRAY['intelligence_capabilities','intelligence_packages','intelligence_package_configurations','intelligence_package_prices','intelligence_package_rights'] LOOP
  EXECUTE format('ALTER TABLE twuanis_canonical_private.%I OWNER TO postgres',t);
  EXECUTE format('ALTER TABLE twuanis_canonical_private.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON TABLE twuanis_canonical_private.%I FROM PUBLIC,anon,authenticated,service_role',t);
 END LOOP;
 FOR f IN SELECT p.oid::regprocedure FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE (n.nspname='twuanis_canonical_private' AND p.proname IN ('validate_package_configuration','validate_package_catalog','package_projection')) OR (n.nspname='public' AND p.proname IN ('admin_package_read','admin_package_command','current_account_has_capability','read_intelligence_package_catalog')) LOOP
  EXECUTE format('ALTER FUNCTION %s OWNER TO postgres',f);
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',f);
 END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_package_read(text),public.admin_package_command(uuid,jsonb),public.current_account_has_capability(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.read_intelligence_package_catalog(text) TO anon,authenticated,service_role;
COMMIT;
