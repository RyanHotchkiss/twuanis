-- Step 5 private paid customer batch primitives. No public fulfillment grant.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
-- Reuse the exact installed fact CHECK expressions, not a parallel numerical policy.
DO $$ DECLARE expression text; BEGIN
 SELECT string_agg('('||pg_get_expr(conbin,conrelid)||') IS NOT FALSE',' AND ' ORDER BY conname) INTO expression
 FROM pg_constraint WHERE conrelid='public.listing_fact_evidence'::regclass AND contype='c';
 IF expression IS NULL THEN RAISE EXCEPTION 'canonical fact constraints missing'; END IF;
 EXECUTE 'CREATE FUNCTION twuanis_canonical_private.addon_validate_fact_record(v jsonb) RETURNS boolean LANGUAGE sql STABLE SET search_path=pg_catalog AS '||quote_literal('SELECT '||expression||' FROM jsonb_populate_record(NULL::public.listing_fact_evidence,v) f');
END $$;

-- Shared bounded membership validation used by both creation and preflight.
CREATE FUNCTION twuanis_canonical_private.canonical_origin_ids(dim text,ids bigint[]) RETURNS bigint[]
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog,pg_temp AS $$
DECLARE expanded bigint[]:=ids;x record;parent record;edge_count integer:=0;
BEGIN
 IF cardinality(ids)>32 THEN RAISE EXCEPTION 'membership set too large' USING ERRCODE='22023'; END IF;
 IF dim<>'geography' THEN
  FOR x IN SELECT id,parent_id FROM public.ontology_terms WHERE id=ANY(ids) ORDER BY id LOOP
   IF x.parent_id IS NOT NULL THEN
    SELECT * INTO STRICT parent FROM public.ontology_terms WHERE id=x.parent_id FOR SHARE;
    IF parent.level IS DISTINCT FROM 0 OR parent.parent_id IS NOT NULL THEN RAISE EXCEPTION 'unsupported non-flat canonical root' USING ERRCODE='23514'; END IF;
    expanded:=array_append(expanded,parent.id);
   END IF;
  END LOOP;
  FOR x IN SELECT target_term_id FROM public.ontology_relationships WHERE source_term_id=ANY(ids) AND relationship_type='is_part_of' LIMIT 65 LOOP
   edge_count:=edge_count+1;
   IF edge_count>64 OR cardinality(expanded)>=96 THEN RAISE EXCEPTION 'membership expansion bound' USING ERRCODE='54000'; END IF;
   SELECT * INTO STRICT parent FROM public.ontology_terms WHERE id=x.target_term_id FOR SHARE;
   IF parent.level IS DISTINCT FROM 0 OR parent.parent_id IS NOT NULL THEN RAISE EXCEPTION 'unsupported non-flat relationship root' USING ERRCODE='23514'; END IF;
   expanded:=array_append(expanded,parent.id);
  END LOOP;
 ELSE
  -- Fixed Costa Rica context, not a user-selectable semantic dimension.
  PERFORM id FROM public.ontology_terms WHERE id=9 AND term_type='country' AND level=0 FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Costa Rica context missing' USING ERRCODE='23514'; END IF;
  expanded:=array_append(expanded,9);
 END IF;
 RETURN expanded;
END $$;
DO $patch$ DECLARE definition text;needle text:=$needle$ IF cardinality(ids)>32 THEN RAISE EXCEPTION 'membership set too large' USING ERRCODE='22023'; END IF;
 IF dim<>'geography' THEN
  FOR x IN SELECT id,parent_id FROM public.ontology_terms WHERE id=ANY(ids) ORDER BY id LOOP
   IF x.parent_id IS NOT NULL THEN
    SELECT * INTO STRICT parent FROM public.ontology_terms WHERE id=x.parent_id FOR SHARE;
    IF parent.level IS DISTINCT FROM 0 OR parent.parent_id IS NOT NULL THEN RAISE EXCEPTION 'unsupported non-flat canonical root' USING ERRCODE='23514'; END IF;
    expanded:=array_append(expanded,parent.id);
   END IF;
  END LOOP;
  FOR x IN SELECT target_term_id FROM public.ontology_relationships WHERE source_term_id=ANY(ids) AND relationship_type='is_part_of' LIMIT 65 LOOP
   edge_count:=edge_count+1;
   IF edge_count>64 OR cardinality(expanded)>=96 THEN RAISE EXCEPTION 'membership expansion bound' USING ERRCODE='54000'; END IF;
   SELECT * INTO STRICT parent FROM public.ontology_terms WHERE id=x.target_term_id FOR SHARE;
   IF parent.level IS DISTINCT FROM 0 OR parent.parent_id IS NOT NULL THEN RAISE EXCEPTION 'unsupported non-flat relationship root' USING ERRCODE='23514'; END IF;
   expanded:=array_append(expanded,parent.id);
  END LOOP;
 ELSE
  -- Fixed Costa Rica context, not a user-selectable semantic dimension.
  PERFORM id FROM public.ontology_terms WHERE id=9 AND term_type='country' AND level=0 FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Costa Rica context missing' USING ERRCODE='23514'; END IF;
  expanded:=array_append(expanded,9);
 END IF;
$needle$;
BEGIN
 SELECT pg_get_functiondef('twuanis_canonical_private.s3_origins(uuid,text,bigint[],uuid)'::regprocedure) INTO definition;
 IF (length(definition)-length(replace(definition,needle,'')))/length(needle)<>1 THEN RAISE EXCEPTION 'unexpected canonical origins definition'; END IF;
 EXECUTE replace(definition,needle,' expanded:=twuanis_canonical_private.canonical_origin_ids(dim,ids);'||chr(10));
END $patch$;
CREATE FUNCTION twuanis_canonical_private.addon_customer_input(p_input jsonb) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE d jsonb;content jsonb;geo bigint[];x record;t record;ids bigint[];tags text[];v jsonb;f jsonb;kind text;n numeric;c text;
BEGIN
 PERFORM twuanis_canonical_private.s3_keys(p_input,ARRAY['transaction','geography','semantics','facts','measurements','money','content'],ARRAY['transaction','geography','semantics']);
 IF jsonb_typeof(p_input->'transaction') IS DISTINCT FROM 'string' OR p_input->>'transaction' NOT IN ('sale','rent') THEN RAISE EXCEPTION 'explicit sale/rent required'; END IF;
 d:=twuanis_canonical_private.s4_domains(p_input-ARRAY['transaction','content'],'owner');
 IF NOT (d->'semantics') ? 'property_type' OR cardinality(twuanis_canonical_private.s3_term_ids(d->'semantics'->'property_type'))<>1 THEN RAISE EXCEPTION 'exactly one property type required'; END IF;
 content:=coalesce(p_input->'content','{}');PERFORM twuanis_canonical_private.s3_keys(content,ARRAY['title','description','whatsapp']);
 FOREACH c IN ARRAY ARRAY['title','description','whatsapp'] LOOP
  IF content ? c AND (jsonb_typeof(content->c) IS DISTINCT FROM 'string' OR length(content->>c)>(CASE c WHEN 'title' THEN 512 WHEN 'description' THEN 16000 ELSE 256 END)) THEN RAISE EXCEPTION 'bounded text content required'; END IF;
 END LOOP;
 geo:=twuanis_canonical_private.s3_geography(d->'geography');
 PERFORM twuanis_canonical_private.canonical_origin_ids('geography',geo);
 FOR x IN SELECT key,value FROM jsonb_each(d->'semantics') ORDER BY key LOOP
  ids:=twuanis_canonical_private.s3_term_ids(x.value);
  IF (x.key='property_type' AND cardinality(ids)<>1) OR (x.key='legal_status' AND cardinality(ids)>1) THEN RAISE EXCEPTION 'semantic cardinality'; END IF;
  FOR t IN SELECT id,term_type,level,term_name FROM public.ontology_terms WHERE id=ANY(ids) ORDER BY id FOR SHARE LOOP
   IF t.term_type IS DISTINCT FROM x.key OR t.level IS DISTINCT FROM 1 OR t.term_name IS NULL THEN RAISE EXCEPTION 'semantic type/level'; END IF;
  END LOOP;
  IF (SELECT count(*) FROM public.ontology_terms WHERE id=ANY(ids))<>cardinality(ids) THEN RAISE EXCEPTION 'unknown semantic identity'; END IF;
  IF x.key='accessibility' THEN
   PERFORM term_id FROM twuanis_canonical_private.accessibility_identity WHERE term_id=ANY(ids) ORDER BY term_id FOR SHARE;
   SELECT array_agg(code) INTO tags FROM twuanis_canonical_private.accessibility_identity WHERE term_id=ANY(ids);
   IF coalesce(cardinality(tags),0)<>cardinality(ids) OR ('boat'=ANY(tags) AND cardinality(tags)>1) OR ('4x4'=ANY(tags) AND tags && ARRAY['2wd','paved']) THEN RAISE EXCEPTION 'accessibility incompatible'; END IF;
  END IF;
  PERFORM twuanis_canonical_private.canonical_origin_ids(x.key,ids);
 END LOOP;
 FOR x IN SELECT key,value FROM jsonb_each(coalesce(d->'facts','{}')) LOOP
  v:=x.value;kind:=v->>'kind';ids:='{}';
  PERFORM twuanis_canonical_private.s3_keys(v,ARRAY['kind','value','term','lower','upper','lower_inclusive','upper_inclusive','source','reference'],ARRAY['kind']);
  IF kind='clear' THEN IF v<>'{"kind":"clear"}'::jsonb THEN RAISE EXCEPTION 'clear has no value'; END IF;CONTINUE; END IF;
  f:=jsonb_build_object('dimension',x.key,'kind',kind,'evidence_source','owner','evidence_reference',v->'reference');
  IF kind='exact' THEN
   IF v ?| ARRAY['term','lower','upper','lower_inclusive','upper_inclusive'] THEN RAISE EXCEPTION 'exact fact shape'; END IF;
   f:=f||jsonb_build_object('exact_value',twuanis_canonical_private.s3_decimal(v->'value'));
  ELSIF kind='category' THEN
   IF v ?| ARRAY['value','lower','upper','lower_inclusive','upper_inclusive'] THEN RAISE EXCEPTION 'category fact shape'; END IF;
   ids:=twuanis_canonical_private.s3_term_ids(jsonb_build_array(v->'term'));
   SELECT * INTO STRICT t FROM public.ontology_terms WHERE id=ids[1] FOR SHARE;
   IF t.term_type IS DISTINCT FROM x.key OR t.level IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'fact category type'; END IF;
   f:=f||jsonb_build_object('category_term_id',ids[1]);
  ELSIF kind='range' THEN
   IF v ?| ARRAY['value','term'] OR NOT v ?& ARRAY['lower','upper','lower_inclusive','upper_inclusive'] OR jsonb_typeof(v->'lower_inclusive') IS DISTINCT FROM 'boolean' OR jsonb_typeof(v->'upper_inclusive') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'explicit range required'; END IF;
   f:=f||jsonb_build_object('range_lower',CASE WHEN v->'lower'='null' THEN NULL ELSE twuanis_canonical_private.s3_decimal(v->'lower') END,'range_upper',CASE WHEN v->'upper'='null' THEN NULL ELSE twuanis_canonical_private.s3_decimal(v->'upper') END,'lower_inclusive',v->'lower_inclusive','upper_inclusive',v->'upper_inclusive');
  ELSE RAISE EXCEPTION 'invalid fact kind'; END IF;
  IF NOT twuanis_canonical_private.addon_validate_fact_record(f) THEN RAISE EXCEPTION 'canonical fact constraint'; END IF;
  PERFORM twuanis_canonical_private.canonical_origin_ids(x.key,ids);
 END LOOP;
 FOR x IN SELECT key,value FROM jsonb_each(coalesce(d->'measurements','{}')) LOOP
  PERFORM twuanis_canonical_private.s3_keys(x.value,ARRAY['value'],ARRAY['value']);
  n:=twuanis_canonical_private.s3_decimal(x.value->'value');IF n<=0 THEN RAISE EXCEPTION 'positive exact measurement required'; END IF;
 END LOOP;
 -- Successful bulk fulfillment includes publication, so original monetary evidence is required.
 IF NOT d ? 'money' THEN RAISE EXCEPTION 'publication requires monetary evidence'; END IF;
 n:=twuanis_canonical_private.s3_decimal(d->'money'->'amount');
 IF n<=0 OR d->'money'->>'currency' IS NULL OR d->'money'->>'currency' NOT IN ('USD','CRC') THEN RAISE EXCEPTION 'positive original monetary pair required'; END IF;
 RETURN p_input;
END $$;

CREATE FUNCTION twuanis_canonical_private.customer_publication_allowance(p_owner uuid)
RETURNS TABLE(subscription_id uuid,package_id uuid,allowance bigint,unlimited boolean,effective_start timestamptz,effective_end timestamptz,observed_at timestamptz)
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog,pg_temp AS $f$
DECLARE v_owner uuid:=p_owner;s record;n integer:=0;v_limit integer;v_at timestamptz;
BEGIN
 IF p_owner IS NULL THEN RAISE EXCEPTION 'customer identity required'; END IF;
 PERFORM twuanis_canonical_private.lock_capacity_policy(false);
 -- Observe time after waiting; a transaction-start timestamp may already be stale.
 v_at:=clock_timestamp();
 FOR s IN SELECT u.id,u.package_id,u.current_period_start,u.current_period_end
  FROM public.user_subscriptions u WHERE u.user_id=v_owner AND u.status='active' LIMIT 2
 LOOP
  n:=n+1;
  subscription_id:=s.id; package_id:=s.package_id;
  effective_start:=s.current_period_start; effective_end:=s.current_period_end;
 END LOOP;
 IF n<>1 THEN RAISE EXCEPTION 'one authoritative active subscription required' USING ERRCODE='55000'; END IF;
 IF (effective_start IS NOT NULL AND effective_start>v_at)
  OR (effective_end IS NOT NULL AND effective_end<=v_at)
  OR (effective_start IS NOT NULL AND effective_end IS NOT NULL AND effective_end<=effective_start) THEN
  RAISE EXCEPTION 'subscription not effective' USING ERRCODE='55000';
 END IF;
 PERFORM p.id FROM public.packages p WHERE p.id=package_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'subscription package missing' USING ERRCODE='55000'; END IF;
 SELECT l.listing_limit INTO v_limit FROM public.package_limits l WHERE l.package_id=customer_publication_allowance.package_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'publication limit missing' USING ERRCODE='55000'; END IF;
 IF v_limit<0 THEN RAISE EXCEPTION 'negative publication limit' USING ERRCODE='22023'; END IF;
 allowance:=v_limit::bigint; unlimited:=v_limit IS NULL; observed_at:=v_at;
 RETURN NEXT;
END $f$;
CREATE OR REPLACE FUNCTION twuanis_canonical_private.publisher_allowance(p_publisher uuid,p_owner uuid)
RETURNS TABLE(subscription_id uuid,package_id uuid,allowance bigint,unlimited boolean,effective_start timestamptz,effective_end timestamptz,observed_at timestamptz)
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog,pg_temp AS $f$
BEGIN
 IF p_owner IS DISTINCT FROM twuanis_canonical_private.lock_publisher(p_publisher) THEN RAISE EXCEPTION 'publisher/customer mismatch' USING ERRCODE='22023'; END IF;
 RETURN QUERY SELECT * FROM twuanis_canonical_private.customer_publication_allowance(p_owner);
END $f$;
CREATE FUNCTION twuanis_canonical_private.customer_publication_core(p_actor uuid,p_listing uuid,p_expected bigint,p_request uuid,p_event text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=p_actor;publisher uuid;governing record;c twuanis_canonical_private.customer_publication_commands%ROWTYPE;seconds bigint;result jsonb;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'authenticated customer required' USING ERRCODE='42501'; END IF;
 IF p_request IS NULL OR p_listing IS NULL OR p_expected IS NULL OR p_expected<0 OR p_event IS NULL OR p_event NOT IN ('publish','renew')
 THEN RAISE EXCEPTION 'explicit bounded publication command required' USING ERRCODE='22023'; END IF;
 publisher:=twuanis_canonical_private.resolve_publisher(actor);
 IF NOT EXISTS(SELECT 1 FROM public.listings WHERE id=p_listing AND owner_id=actor AND publisher_account_id=publisher AND canonical_domain_version=1)
 THEN RAISE EXCEPTION 'owned canonical listing required' USING ERRCODE='42501'; END IF;
 -- Same operation lock as S3, after the established policy/publisher lock order.
 PERFORM pg_advisory_xact_lock(3104,hashtext(jsonb_build_array('owner',actor::text,'domain_mutation',p_request)::text));
 SELECT * INTO c FROM twuanis_canonical_private.customer_publication_commands WHERE owner_id=actor AND request_id=p_request;
 IF FOUND THEN
  IF (c.listing_id,c.expected_revision,c.event) IS DISTINCT FROM (p_listing,p_expected,p_event)
  THEN RAISE EXCEPTION 'publication retry payload conflict' USING ERRCODE='22023'; END IF;
  seconds:=c.duration_seconds;
 ELSE
  SELECT * INTO STRICT governing FROM twuanis_canonical_private.publisher_allowance(publisher,actor);
  SELECT publication_duration_seconds INTO seconds FROM public.package_limits WHERE package_id=governing.package_id;
  IF seconds IS NULL OR seconds<=0 OR seconds>315576000 THEN RAISE EXCEPTION 'valid package publication entitlement required' USING ERRCODE='55000'; END IF;
  INSERT INTO twuanis_canonical_private.customer_publication_commands(owner_id,request_id,listing_id,expected_revision,event,duration_seconds,package_id)
  VALUES(actor,p_request,p_listing,p_expected,p_event,seconds,governing.package_id);
 END IF;
 result:=twuanis_canonical_private.s3_command(p_listing,p_expected,'owner',actor::text,p_request,
 jsonb_build_object('lifecycle',jsonb_build_object('event',p_event,'duration_seconds',seconds::text)),NULL);
 RETURN result||jsonb_build_object('listing_id',p_listing::text);
END $$;
CREATE OR REPLACE FUNCTION public.publish_customer_canonical_listing(p_listing uuid,p_expected bigint,p_request uuid,p_event text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 RETURN twuanis_canonical_private.customer_publication_core(auth.uid(),p_listing,p_expected,p_request,p_event);
END $$;
CREATE FUNCTION twuanis_canonical_private.addon_publication_capacity(p_owner uuid,p_quantity integer) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE pub uuid;a record;used bigint:=0;seconds bigint;
BEGIN
 IF p_quantity IS NULL OR p_quantity<1 THEN RAISE EXCEPTION 'positive batch count required'; END IF;
 PERFORM twuanis_canonical_private.lock_capacity_policy(false);
 SELECT id INTO pub FROM public.publisher_accounts WHERE owner_user_id=p_owner FOR UPDATE;
 IF pub IS NOT NULL THEN used:=twuanis_canonical_private.publisher_consumption(pub,p_owner); END IF;
 SELECT * INTO STRICT a FROM twuanis_canonical_private.customer_publication_allowance(p_owner);
 SELECT publication_duration_seconds INTO seconds FROM public.package_limits WHERE package_id=a.package_id;
 IF seconds IS NULL OR seconds NOT BETWEEN 1 AND 315576000 THEN RAISE EXCEPTION 'publication duration authority unavailable'; END IF;
 IF NOT a.unlimited AND a.allowance-used<p_quantity THEN RAISE EXCEPTION 'whole-job publication allowance insufficient'; END IF;
 RETURN jsonb_build_object('subscriptionId',a.subscription_id,'packageId',a.package_id,'allowance',a.allowance,'consumption',used,'durationSeconds',seconds,'observedAt',a.observed_at);
END $$;
CREATE TABLE twuanis_canonical_private.addon_import_jobs(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),account_id uuid NOT NULL REFERENCES auth.users(id),request_id uuid NOT NULL,
 configuration_id uuid NOT NULL REFERENCES twuanis_canonical_private.addon_configurations(id),
 submitted_count integer NOT NULL,accepted_count integer NOT NULL CHECK(accepted_count>0),
 input_fingerprint text NOT NULL,validator_version text NOT NULL,accepted_rows jsonb NOT NULL,rejected_rows jsonb NOT NULL,
 publication_evidence jsonb NOT NULL,currency text NOT NULL CHECK(currency='USD'),unit_rate numeric,total numeric,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),UNIQUE(account_id,request_id),CHECK(accepted_count<=submitted_count),
 CHECK((unit_rate IS NULL AND total IS NULL) OR (unit_rate>0 AND total=accepted_count*unit_rate))
);
CREATE TABLE twuanis_canonical_private.addon_import_results(
 job_id uuid PRIMARY KEY REFERENCES twuanis_canonical_private.addon_import_jobs(id),purchase_id uuid NOT NULL UNIQUE,
 verified_payment_id uuid NOT NULL,result jsonb NOT NULL,completed_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE FUNCTION public.prepare_customer_addon_import(p_request uuid,p_rows jsonb) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=auth.uid();c uuid;fp text;j twuanis_canonical_private.addon_import_jobs%ROWTYPE;x record;accepted jsonb:='[]';rejected jsonb:='[]';evidence jsonb;rate numeric;err text;
BEGIN
 IF actor IS NULL OR auth.jwt()->>'role' IS DISTINCT FROM 'authenticated' THEN RAISE EXCEPTION 'authenticated customer required'; END IF;
 -- Transport bounds are operational limits, not pricing tiers.
 IF p_request IS NULL OR jsonb_typeof(p_rows) IS DISTINCT FROM 'array' OR jsonb_array_length(p_rows) NOT BETWEEN 1 AND 2048 OR octet_length(p_rows::text)>2097152 THEN RAISE EXCEPTION 'bounded batch required'; END IF;
 fp:=encode(sha256(convert_to(p_rows::text,'UTF8')),'hex');
 PERFORM pg_advisory_xact_lock(3152,hashtext(jsonb_build_array(actor,p_request)::text));
 SELECT * INTO j FROM twuanis_canonical_private.addon_import_jobs WHERE account_id=actor AND request_id=p_request;
 IF FOUND THEN IF j.input_fingerprint<>fp THEN RAISE EXCEPTION 'immutable job request conflict'; END IF;
  RETURN jsonb_build_object('jobId',j.id,'submitted',j.submitted_count,'accepted',j.accepted_count,'rejected',j.rejected_rows,'currency',j.currency,'unitRate',j.unit_rate::text,'total',j.total::text,'quotable',j.total IS NOT NULL,'acquisitionAvailable',false,'replayed',true); END IF;
 SELECT current_configuration_id INTO STRICT c FROM twuanis_canonical_private.addon_products WHERE id='addon-bulk-listing-import' AND state='active' FOR SHARE;
 FOR x IN SELECT value,ordinality FROM jsonb_array_elements(p_rows) WITH ORDINALITY LOOP
  BEGIN
   PERFORM twuanis_canonical_private.addon_customer_input(x.value);
   accepted:=accepted||jsonb_build_array(jsonb_build_object('rowId',gen_random_uuid(),'publicationRequest',gen_random_uuid(),'input',x.value,'row',x.ordinality));
  EXCEPTION WHEN SQLSTATE 'P0001' OR SQLSTATE 'P0002' OR SQLSTATE 'P0003' OR SQLSTATE '22023' OR SQLSTATE '23514' OR SQLSTATE '22003' OR SQLSTATE '22000' THEN
   GET STACKED DIAGNOSTICS err=MESSAGE_TEXT;
   rejected:=rejected||jsonb_build_array(jsonb_build_object('row',x.ordinality,'code','canonical_input_rejected'));
  END;
 END LOOP;
 IF jsonb_array_length(accepted)=0 THEN RAISE EXCEPTION 'no accepted rows'; END IF;
 evidence:=twuanis_canonical_private.addon_publication_capacity(actor,jsonb_array_length(accepted));
 SELECT unit_rate INTO rate FROM twuanis_canonical_private.addon_quantity_tiers WHERE configuration_id=c AND jsonb_array_length(accepted) BETWEEN lower_quantity AND upper_quantity AND currency='USD';
 INSERT INTO twuanis_canonical_private.addon_import_jobs(account_id,request_id,configuration_id,submitted_count,accepted_count,input_fingerprint,validator_version,accepted_rows,rejected_rows,publication_evidence,currency,unit_rate,total)
 VALUES(actor,p_request,c,jsonb_array_length(p_rows),jsonb_array_length(accepted),fp,'canonical-customer-v1',accepted,rejected,evidence,'USD',rate,rate*jsonb_array_length(accepted)) RETURNING * INTO j;
 RETURN jsonb_build_object('jobId',j.id,'submitted',j.submitted_count,'accepted',j.accepted_count,'rejected',j.rejected_rows,'currency',j.currency,'unitRate',j.unit_rate::text,'total',j.total::text,'quotable',j.total IS NOT NULL,'acquisitionAvailable',false,'replayed',false);
END $$;
CREATE FUNCTION twuanis_canonical_private.fulfill_customer_addon_import(p_job uuid,p_purchase uuid,p_verified_payment uuid) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE j twuanis_canonical_private.addon_import_jobs%ROWTYPE;r twuanis_canonical_private.addon_import_results%ROWTYPE;x jsonb;created jsonb;published jsonb;result jsonb:='[]';
BEGIN
 IF p_purchase IS NULL OR p_verified_payment IS NULL THEN RAISE EXCEPTION 'trusted purchased terms and verified payment identities required'; END IF;
 -- Only a future trusted payment orchestrator may call this private primitive.
 SELECT * INTO STRICT j FROM twuanis_canonical_private.addon_import_jobs WHERE id=p_job;
 PERFORM twuanis_canonical_private.lock_capacity_policy(false);
 PERFORM id FROM public.publisher_accounts WHERE owner_user_id=j.account_id FOR UPDATE;
 PERFORM id FROM twuanis_canonical_private.addon_import_jobs WHERE id=p_job FOR UPDATE;
 SELECT * INTO r FROM twuanis_canonical_private.addon_import_results WHERE job_id=p_job;
 IF FOUND THEN IF (r.purchase_id,r.verified_payment_id) IS DISTINCT FROM (p_purchase,p_verified_payment) THEN RAISE EXCEPTION 'fulfillment identity conflict'; END IF;RETURN r.result; END IF;
 IF j.total IS NULL OR j.validator_version<>'canonical-customer-v1' THEN RAISE EXCEPTION 'job unpriced or validator unavailable'; END IF;
 -- Lock reference relations through validation and mutation; prevent root-edge phantom changes.
 LOCK TABLE public.ontology_terms,public.ontology_relationships,twuanis_canonical_private.accessibility_identity IN SHARE MODE;
 FOR x IN SELECT value FROM jsonb_array_elements(j.accepted_rows) LOOP PERFORM twuanis_canonical_private.addon_customer_input(x->'input'); END LOOP;
 PERFORM twuanis_canonical_private.addon_publication_capacity(j.account_id,j.accepted_count);
 -- First publisher creation, if needed, happens only after complete job validation.
 PERFORM twuanis_canonical_private.ensure_publisher_account(j.account_id);
 -- Recheck after unique publisher creation contention before the first listing mutation.
 PERFORM twuanis_canonical_private.addon_publication_capacity(j.account_id,j.accepted_count);
 FOR x IN SELECT value FROM jsonb_array_elements(j.accepted_rows) LOOP
  created:=twuanis_canonical_private.s4_create_core(j.account_id,(x->>'rowId')::uuid,x->'input',NULL);
  published:=twuanis_canonical_private.customer_publication_core(j.account_id,(created->>'listing_id')::uuid,(created->>'revision')::bigint,(x->>'publicationRequest')::uuid,'publish');
  IF published->>'outcome' IS NOT NULL AND published->>'outcome' NOT IN ('succeeded','noop') THEN RAISE EXCEPTION 'publication did not succeed'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.listings WHERE id=(created->>'listing_id')::uuid AND owner_id=j.account_id AND listing_status='active' AND canonical_domain_version=1) THEN RAISE EXCEPTION 'batch publication invariant'; END IF;
  result:=result||jsonb_build_array(jsonb_build_object('rowId',x->>'rowId','listingId',created->>'listing_id'));
 END LOOP;
 INSERT INTO twuanis_canonical_private.addon_import_results(job_id,purchase_id,verified_payment_id,result) VALUES(p_job,p_purchase,p_verified_payment,result);
 RETURN result;
END $$;
CREATE TRIGGER addon_jobs_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON twuanis_canonical_private.addon_import_jobs FOR EACH STATEMENT EXECUTE FUNCTION twuanis_canonical_private.administrative_immutable();
CREATE TRIGGER addon_results_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON twuanis_canonical_private.addon_import_results FOR EACH STATEMENT EXECUTE FUNCTION twuanis_canonical_private.administrative_immutable();
DO $$ DECLARE t text;f regprocedure;BEGIN
 FOREACH t IN ARRAY ARRAY['addon_import_jobs','addon_import_results'] LOOP
  EXECUTE format('ALTER TABLE twuanis_canonical_private.%I OWNER TO postgres',t);
  EXECUTE format('ALTER TABLE twuanis_canonical_private.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON TABLE twuanis_canonical_private.%I FROM PUBLIC,anon,authenticated,service_role',t);
 END LOOP;
 FOREACH f IN ARRAY ARRAY['twuanis_canonical_private.addon_validate_fact_record(jsonb)'::regprocedure,'twuanis_canonical_private.canonical_origin_ids(text,bigint[])'::regprocedure,'twuanis_canonical_private.addon_customer_input(jsonb)'::regprocedure,'twuanis_canonical_private.customer_publication_allowance(uuid)'::regprocedure,'twuanis_canonical_private.customer_publication_core(uuid,uuid,bigint,uuid,text)'::regprocedure,'twuanis_canonical_private.addon_publication_capacity(uuid,integer)'::regprocedure,'public.prepare_customer_addon_import(uuid,jsonb)'::regprocedure,'twuanis_canonical_private.fulfill_customer_addon_import(uuid,uuid,uuid)'::regprocedure] LOOP
  EXECUTE format('ALTER FUNCTION %s OWNER TO postgres',f);
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',f);
 END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION public.prepare_customer_addon_import(uuid,jsonb) TO authenticated;
COMMIT;
