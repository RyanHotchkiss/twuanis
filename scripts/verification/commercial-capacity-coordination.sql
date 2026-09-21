\set ON_ERROR_STOP on
-- Disposable-only S5 suite. Clone completed cg_s4_verification into cg_s5_verification.
-- Closed S1-S4 fixtures/artifacts are reused without modification or baseline reruns.
DO $$ BEGIN IF current_database()<>'cg_s5_verification' OR inet_server_addr() IS NOT NULL OR session_user<>'postgres' THEN RAISE EXCEPTION 'disposable S5 database required'; END IF; END $$;
ALTER TABLE public.packages ADD COLUMN billing_interval text NOT NULL DEFAULT 'monthly',ADD COLUMN is_active boolean NOT NULL DEFAULT true,ADD COLUMN price_crc numeric DEFAULT 1000,ADD COLUMN price_usd numeric DEFAULT 2;
CREATE TABLE public.purchase_requests(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),owner_id uuid NOT NULL REFERENCES auth.users,product_type text NOT NULL,status text NOT NULL,package_id uuid REFERENCES public.packages,add_on_product_id uuid,listing_id uuid,quantity integer DEFAULT 1);
CREATE TABLE public.purchase_request_events(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),purchase_request_id uuid REFERENCES public.purchase_requests,event_type text,previous_status text,resulting_status text,actor_id uuid,metadata jsonb);
CREATE TABLE public.sinpe_payments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES auth.users,subscription_id uuid REFERENCES public.user_subscriptions,purchase_request_id uuid,amount numeric,currency text,sinpe_reference text,sender_name text,sender_phone text,payment_date timestamptz,status text,reviewed_by uuid,reviewed_at timestamptz,approved_at timestamptz,rejected_at timestamptz,rejection_reason text,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
CREATE TABLE public.add_on_products(id uuid PRIMARY KEY,product_type text,slug text,is_active boolean,target_type text,is_stackable boolean,maximum_quantity integer,requires_manual_approval boolean,duration_type text,duration_days integer);
CREATE TABLE public.listing_entitlements(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),listing_id uuid,product_id uuid,owner_id uuid,status text,source_type text,starts_at timestamptz,expires_at timestamptz,purchase_request_id uuid UNIQUE,assigned_by uuid);
CREATE TABLE public.promotion_events(listing_id uuid,entitlement_id uuid,purchase_request_id uuid,product_id uuid,promotion_slug text,event_type text,previous_state text,resulting_state text,starts_at timestamptz,expires_at timestamptz,metadata jsonb,actor_id uuid,actor_type text,occurred_at timestamptz);
-- Representative authority dependency: S5 does NOT replace this production helper.
-- Fixture permits one reviewer so denied/allowed composition is exercised explicitly.
CREATE FUNCTION public.require_payment_reviewer() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$ BEGIN IF auth.uid() IS DISTINCT FROM '00000000-0000-0000-0000-000000000599'::uuid THEN RAISE EXCEPTION 'reviewer required' USING ERRCODE='42501'; END IF; END $$;

-- Cached existing control writer, not installed by migration 008.
CREATE OR REPLACE FUNCTION public.create_subscription_upgrade_request(p_package_id uuid, p_currency text, p_sinpe_reference text, p_sender_name text, p_sender_phone text DEFAULT NULL::text, p_payment_date timestamp with time zone DEFAULT now())
 RETURNS TABLE(subscription_id uuid, payment_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
#variable_conflict use_column
declare
    v_user_id uuid;
    v_package public.packages%rowtype;
    v_subscription_id uuid;
    v_payment_id uuid;
    v_amount numeric;
    v_billing_cycle text;
begin
    v_user_id := auth.uid();

    if v_user_id is null then
        raise exception
            'Authentication required.';
    end if;

    select *
    into v_package
    from public.packages
    where id = p_package_id
      and is_active = true;

    if not found then
        raise exception
            'Package not found or inactive.';
    end if;

    if exists (
        select 1
        from public.user_subscriptions
        where user_id = v_user_id
          and package_id = p_package_id
          and status = 'active'
    ) then
        raise exception
            'You are already subscribed to this package.';
    end if;

    if exists (
        select 1
        from public.user_subscriptions
        where user_id = v_user_id
          and status = 'pending_payment'
    ) then
        raise exception
            'You already have a pending subscription upgrade.';
    end if;

    if p_currency not in ('CRC', 'USD') then
        raise exception
            'Invalid currency.';
    end if;

    if trim(p_sinpe_reference) = '' then
        raise exception
            'SINPE reference is required.';
    end if;

    if trim(p_sender_name) = '' then
        raise exception
            'Sender name is required.';
    end if;

    if p_currency = 'CRC' then
        v_amount := v_package.price_crc;
    else
        v_amount := v_package.price_usd;
    end if;

    if v_amount <= 0 then
        raise exception
            'This package does not require a paid upgrade.';
    end if;

    v_billing_cycle :=
        case
            when v_package.billing_interval = 'annual'
                then 'annual'
            else 'monthly'
        end;

    insert into public.user_subscriptions (
        user_id,
        package_id,
        status,
        billing_cycle,
        started_at,
        current_period_start,
        current_period_end
    )
    values (
        v_user_id,
        v_package.id,
        'pending_payment',
        v_billing_cycle,
        null,
        null,
        null
    )
    returning id
    into v_subscription_id;

    insert into public.sinpe_payments (
        user_id,
        subscription_id,
        amount,
        currency,
        sinpe_reference,
        sender_name,
        sender_phone,
        payment_date,
        status
    )
    values (
        v_user_id,
        v_subscription_id,
        v_amount,
        p_currency,
        trim(p_sinpe_reference),
        trim(p_sender_name),
        nullif(trim(p_sender_phone), ''),
        p_payment_date,
        'submitted'
    )
    returning id
    into v_payment_id;

    return query
    select
        v_subscription_id,
        v_payment_id;
end;
$function$;


-- Cached existing control writer, not installed by migration 008.
CREATE OR REPLACE FUNCTION public.reject_sinpe_payment(p_payment_id uuid, p_rejection_reason text)
 RETURNS TABLE(payment_id uuid, subscription_id uuid, user_id uuid, package_id uuid, payment_status text, subscription_status text, rejection_reason text, rejected_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
#variable_conflict use_column
declare
    v_reviewer_id uuid;

    v_payment
        public.sinpe_payments%rowtype;

    v_pending_subscription
        public.user_subscriptions%rowtype;

    v_rejected_at timestamptz;
begin
    -- ========================================================
    -- 1. VERIFY REVIEWER
    -- ========================================================

    perform public.require_payment_reviewer();

    v_reviewer_id := auth.uid();

    -- ========================================================
    -- 2. VALIDATE REJECTION REASON
    -- ========================================================

    if
        p_rejection_reason is null
        or length(
            trim(
                p_rejection_reason
            )
        ) = 0
    then
        raise exception
            'A rejection reason is required.';
    end if;

    -- ========================================================
    -- 3. LOCK SINPE PAYMENT
    -- ========================================================

    select *
    into v_payment
    from public.sinpe_payments
    where id = p_payment_id
    for update;

    if not found then
        raise exception
            'SINPE payment not found.';
    end if;

    if v_payment.status not in (
        'submitted',
        'under_review'
    ) then
        raise exception
            'Only submitted or under-review payments can be rejected.';
    end if;

    -- ========================================================
    -- 4. LOCK PENDING SUBSCRIPTION
    -- ========================================================

    select *
    into v_pending_subscription
    from public.user_subscriptions
    where id = v_payment.subscription_id
    for update;

    if not found then
        raise exception
            'Pending subscription not found.';
    end if;

    if
        v_pending_subscription.user_id <>
        v_payment.user_id
    then
        raise exception
            'Payment and subscription users do not match.';
    end if;

    if
        v_pending_subscription.status <>
        'pending_payment'
    then
        raise exception
            'The target subscription is not pending payment.';
    end if;

    v_rejected_at := now();

    -- ========================================================
    -- 5. REJECT SINPE PAYMENT
    -- ========================================================

    update public.sinpe_payments
    set
        status = 'rejected',
        rejection_reason =
            trim(
                p_rejection_reason
            ),
        reviewed_by =
            v_reviewer_id,
        reviewed_at =
            v_rejected_at,
        rejected_at =
            v_rejected_at,
        approved_at =
            null,
        updated_at =
            v_rejected_at
    where id =
        v_payment.id;

    -- ========================================================
    -- 6. CANCEL PENDING SUBSCRIPTION
    -- ========================================================

    update public.user_subscriptions
    set
        status = 'cancelled',
        cancelled_at =
            v_rejected_at,
        started_at =
            null,
        current_period_start =
            null,
        current_period_end =
            null,
        expired_at =
            null,
        updated_at =
            v_rejected_at
    where id =
        v_pending_subscription.id;

    -- ========================================================
    -- 7. RETURN RESULT
    -- ========================================================

    return query
    select
        v_payment.id,
        v_pending_subscription.id,
        v_pending_subscription.user_id,
        v_pending_subscription.package_id,
        'rejected'::text,
        'cancelled'::text,
        trim(
            p_rejection_reason
        ),
        v_rejected_at;
end;
$function$;

\ir ../../supabase/migrations/008_commercial_capacity_coordination.sql
CREATE TRIGGER s5_fixture_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.assign_default_market_package();
INSERT INTO public.packages(id,slug,billing_interval) SELECT ('96000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,CASE n WHEN 1 THEN 'market-explorer' ELSE 's5-package-'||n END,CASE n WHEN 1 THEN 'free' WHEN 7 THEN 'annual' ELSE 'monthly' END FROM generate_series(1,7)n;
INSERT INTO public.package_limits(package_id,listing_limit) SELECT ('96000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,CASE n WHEN 1 THEN 1 WHEN 2 THEN 2 WHEN 3 THEN 3 WHEN 4 THEN 5 WHEN 5 THEN NULL WHEN 6 THEN 0 ELSE 5 END FROM generate_series(1,7)n;
CREATE TEMP TABLE assertions(label text PRIMARY KEY);
CREATE FUNCTION pg_temp.ok(v boolean,label text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF v IS NOT TRUE THEN RAISE EXCEPTION 'FAIL %',label; END IF; INSERT INTO assertions VALUES(label); END $$;
CREATE FUNCTION pg_temp.reject(q text,code text,label text) RETURNS void LANGUAGE plpgsql AS $$ DECLARE e text; BEGIN BEGIN EXECUTE q; EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS e=RETURNED_SQLSTATE; END; PERFORM pg_temp.ok(e IS NOT DISTINCT FROM code,label||' ['||coalesce(e,'success')||']'); END $$;
CREATE FUNCTION pg_temp.uid(n integer) RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT ('00000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid $$;
CREATE FUNCTION pg_temp.pkg(n integer) RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT ('96000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid $$;
CREATE FUNCTION pg_temp.purchase(owner integer,pkg integer) RETURNS uuid LANGUAGE plpgsql AS $$ DECLARE p uuid;BEGIN INSERT INTO public.purchase_requests(owner_id,product_type,status,package_id) VALUES(pg_temp.uid(owner),'package','approved',pg_temp.pkg(pkg)) RETURNING id INTO p;RETURN p;END $$;
CREATE FUNCTION pg_temp.change(owner integer,pkg integer) RETURNS uuid LANGUAGE plpgsql AS $$ DECLARE a uuid; BEGIN SELECT activation_id INTO a FROM public.activate_purchase(pg_temp.purchase(owner,pkg)); RETURN a; END $$;
CREATE FUNCTION pg_temp.draft(owner integer) RETURNS uuid LANGUAGE plpgsql AS $$ DECLARE r jsonb; BEGIN PERFORM set_config('request.jwt.claim.sub',pg_temp.uid(owner)::text,true);r:=public.create_customer_canonical_listing(gen_random_uuid(),'{"transaction":"sale","geography":{"province":"3","canton":"304","district":"30403"},"semantics":{"property_type":["1"]},"facts":{"bathrooms":{"kind":"exact","value":"0.5"}},"money":{"amount":"0.50","currency":"USD"}}'); RETURN (r->>'listing_id')::uuid; END $$;
CREATE FUNCTION pg_temp.life(lid uuid,ev text) RETURNS jsonb LANGUAGE plpgsql AS $$ DECLARE r bigint;d jsonb; BEGIN SELECT canonical_revision INTO r FROM public.listings WHERE id=lid;d:=jsonb_build_object('lifecycle',jsonb_build_object('event',ev));IF ev IN ('publish','renew') THEN d:=jsonb_set(d,'{lifecycle,duration_seconds}','"3600"');END IF;RETURN public.mutate_trusted_canonical_listing(lid,r,gen_random_uuid(),d);END $$;
CREATE FUNCTION pg_temp.cap(o integer) RETURNS jsonb LANGUAGE plpgsql AS $$ DECLARE p uuid;a bigint;c bigint; BEGIN p:=twuanis_canonical_private.resolve_publisher(pg_temp.uid(o));SELECT allowance INTO a FROM twuanis_canonical_private.publisher_allowance(p,pg_temp.uid(o));c:=twuanis_canonical_private.publisher_consumption(p,pg_temp.uid(o));RETURN (SELECT to_jsonb(x) FROM twuanis_canonical_private.capacity_state(a,c)x);END $$;
CREATE TEMP TABLE ids(label text PRIMARY KEY,id uuid);
BEGIN;
INSERT INTO auth.users(id) SELECT pg_temp.uid(n) FROM generate_series(501,510)n UNION ALL SELECT pg_temp.uid(599) ON CONFLICT DO NOTHING;
SELECT pg_temp.ok((SELECT count(*)=1 FROM publisher_accounts WHERE owner_user_id=pg_temp.uid(501)),'signup one publisher'),pg_temp.ok((SELECT count(*)=1 FROM user_subscriptions WHERE user_id=pg_temp.uid(501) AND status='active' AND billing_cycle='free' AND package_id=pg_temp.pkg(1)),'signup same free entitlement');
INSERT INTO ids VALUES('publisher',(SELECT id FROM publisher_accounts WHERE owner_user_id=pg_temp.uid(501))),('oldsub',(SELECT id FROM user_subscriptions WHERE user_id=pg_temp.uid(501) AND status='active'));
INSERT INTO ids VALUES('newsub',pg_temp.change(501,4));
SELECT pg_temp.ok((SELECT id FROM ids WHERE label='oldsub')<>(SELECT id FROM ids WHERE label='newsub'),'replacement new subscription identity');
SELECT pg_temp.ok((SELECT id FROM ids WHERE label='publisher')=(SELECT id FROM publisher_accounts WHERE owner_user_id=pg_temp.uid(501)),'publisher survives replacement');
SELECT pg_temp.ok((SELECT status='expired' AND expired_at IS NOT NULL FROM user_subscriptions WHERE id=(SELECT id FROM ids WHERE label='oldsub')),'purchase replacement expires prior subscription');
DO $$ DECLARE l uuid; BEGIN FOR n IN 1..5 LOOP l:=pg_temp.draft(501);PERFORM pg_temp.life(l,'publish');INSERT INTO ids VALUES('active'||n,l);END LOOP;END $$;
INSERT INTO ids VALUES('newdraft',pg_temp.draft(501));
SELECT pg_temp.ok(pg_temp.cap(501)->>'consumption'='5','five active before downgrade');
SELECT pg_temp.change(501,3);
SELECT pg_temp.ok(pg_temp.cap(501) @> '{"allowance":3,"consumption":5,"over_capacity":2}','downgrade permits overcapacity');
SELECT pg_temp.ok((SELECT count(*)=5 FROM listings WHERE owner_id=pg_temp.uid(501) AND listing_status='active'),'downgrade preserves all active');
SELECT pg_temp.reject($q$SELECT pg_temp.life((SELECT id FROM ids WHERE label='newdraft'),'publish')$q$,'23514','overcapacity new publication blocked');
SELECT pg_temp.reject($q$SELECT pg_temp.life((SELECT id FROM ids WHERE label='active1'),'renew')$q$,'23514','overcapacity active renewal blocked');
SELECT pg_temp.life(id,'expire') FROM ids WHERE label='active5';
SELECT pg_temp.reject($q$SELECT pg_temp.life((SELECT id FROM ids WHERE label='active5'),'renew')$q$,'23514','overcapacity expired renewal blocked');
SELECT pg_temp.life(id,'archive') FROM ids WHERE label='active4';
SELECT pg_temp.ok(pg_temp.cap(501) @> '{"allowance":3,"consumption":3}','canonical actions restore equality');
SELECT pg_temp.ok(pg_temp.life((SELECT id FROM ids WHERE label='active1'),'renew')->>'outcome'='succeeded','at-capacity active renewal allowed');
SELECT pg_temp.reject($q$SELECT pg_temp.life((SELECT id FROM ids WHERE label='newdraft'),'publish')$q$,'23514','equality new publication blocked');
-- Unlimited and zero remain distinct; commercial mutation never selects listings.
SELECT pg_temp.change(501,5);
SELECT pg_temp.ok(pg_temp.cap(501)->>'unlimited'='true','explicit unlimited');
SELECT pg_temp.life(id,'publish') FROM ids WHERE label='newdraft';
SELECT pg_temp.change(501,6);
SELECT pg_temp.ok(pg_temp.cap(501) @> '{"allowance":0,"consumption":4,"unlimited":false,"over_capacity":4}','zero is neither missing nor unlimited');
SELECT pg_temp.reject($q$SELECT pg_temp.life((SELECT id FROM ids WHERE label='active5'),'renew')$q$,'23514','zero expired renewal blocked');
SELECT pg_temp.reject($q$SELECT pg_temp.life(pg_temp.draft(501),'publish')$q$,'23514','zero new publication blocked');
-- Increase from 1 to 2.
INSERT INTO ids VALUES('inc1',pg_temp.draft(502)),('inc2',pg_temp.draft(502));
SELECT pg_temp.life(id,'publish') FROM ids WHERE label='inc1';
SELECT pg_temp.reject($q$SELECT pg_temp.life((SELECT id FROM ids WHERE label='inc2'),'publish')$q$,'23514','one slot full');
SELECT pg_temp.change(502,2);
SELECT pg_temp.life(id,'publish') FROM ids WHERE label='inc2';
SELECT pg_temp.ok(pg_temp.cap(502) @> '{"allowance":2,"consumption":2}','increase observed by next publication');
-- Duplicate activation retains existing rejection behavior.
INSERT INTO ids VALUES('purchase',pg_temp.purchase(503,7));
SELECT * FROM public.activate_purchase((SELECT id FROM ids WHERE label='purchase'));
SELECT pg_temp.reject($q$SELECT * FROM public.activate_purchase((SELECT id FROM ids WHERE label='purchase'))$q$,'P0001','duplicate activation rejected');
SELECT pg_temp.ok((SELECT count(*)=1 FROM user_subscriptions WHERE purchase_request_id=(SELECT id FROM ids WHERE label='purchase')),'purchase activates once');
SELECT pg_temp.ok((SELECT current_period_end=current_period_start+interval '1 year' FROM user_subscriptions WHERE purchase_request_id=(SELECT id FROM ids WHERE label='purchase')),'annual duration unchanged');
-- Pending request and rejection leave effective allowance alone.
SELECT set_config('request.jwt.claim.sub',pg_temp.uid(504)::text,true);
INSERT INTO ids SELECT 'payment',payment_id FROM public.create_subscription_upgrade_request(pg_temp.pkg(4),'CRC','S5REF','Sender');
SELECT pg_temp.ok(pg_temp.cap(504)->>'allowance'='1','upgrade request does not activate allowance');
SELECT set_config('request.jwt.claim.sub',pg_temp.uid(599)::text,true);
SELECT * FROM public.approve_sinpe_payment((SELECT id FROM ids WHERE label='payment'));
SELECT pg_temp.ok(pg_temp.cap(504)->>'allowance'='5','SINPE approval activates intended package');
SELECT pg_temp.ok((SELECT count(*)=1 FROM user_subscriptions WHERE user_id=pg_temp.uid(504) AND status='cancelled'),'SINPE prior subscription cancelled');
SELECT pg_temp.reject($q$SELECT * FROM public.approve_sinpe_payment((SELECT id FROM ids WHERE label='payment'))$q$,'P0001','repeated approval rejected');
SELECT set_config('request.jwt.claim.sub',pg_temp.uid(505)::text,true);
INSERT INTO ids SELECT 'rejected_payment',payment_id FROM public.create_subscription_upgrade_request(pg_temp.pkg(3),'USD','S5REJ','Sender');
SELECT set_config('request.jwt.claim.sub',pg_temp.uid(599)::text,true);
SELECT * FROM public.reject_sinpe_payment((SELECT id FROM ids WHERE label='rejected_payment'),'not verified');
SELECT pg_temp.ok(pg_temp.cap(505)->>'allowance'='1','SINPE rejection does not change allowance');
SELECT pg_temp.ok((SELECT status='rejected' FROM sinpe_payments WHERE id=(SELECT id FROM ids WHERE label='rejected_payment')),'same rejection result');
-- Effective role checks; reviewer dependency is preserved, not redefined by 008.
GRANT ALL ON assertions,ids TO anon,authenticated,service_role;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000504',true);
SELECT pg_temp.reject($q$SELECT * FROM public.activate_purchase((SELECT id FROM ids WHERE label='purchase'))$q$,'42501','customer cannot activate purchase');
SELECT pg_temp.reject($q$SELECT * FROM public.approve_sinpe_payment((SELECT id FROM ids WHERE label='payment'))$q$,'42501','ordinary customer cannot approve');
SELECT pg_temp.reject($q$SELECT twuanis_canonical_private.ensure_publisher_account(gen_random_uuid())$q$,'42501','customer cannot pick private publisher');
RESET ROLE;
SET LOCAL ROLE anon;
SELECT pg_temp.reject($q$SELECT * FROM public.approve_sinpe_payment(gen_random_uuid())$q$,'42501','anon approval denied');
SELECT pg_temp.reject($q$SELECT * FROM public.activate_purchase(gen_random_uuid())$q$,'42501','anon activation denied');
RESET ROLE;
INSERT INTO ids VALUES('service_purchase',pg_temp.purchase(506,2));
SET LOCAL ROLE service_role;
SELECT * FROM public.activate_purchase((SELECT id FROM ids WHERE label='service_purchase'));
SELECT pg_temp.reject($q$SELECT twuanis_canonical_private.ensure_publisher_account(gen_random_uuid())$q$,'42501','BYPASSRLS private helper denied');
SELECT pg_temp.reject($q$SELECT * FROM public.approve_sinpe_payment(gen_random_uuid())$q$,'42501','service cannot impersonate reviewer boundary');
RESET ROLE;
SELECT pg_temp.ok(pg_temp.cap(506)->>'allowance'='2','service controlled activation succeeds');
CREATE ROLE s5_public_only;
GRANT ALL ON assertions TO s5_public_only;
SET LOCAL ROLE s5_public_only;
SELECT pg_temp.reject($q$SELECT * FROM public.activate_purchase(gen_random_uuid())$q$,'42501','PUBLIC-only denied');
RESET ROLE;
SELECT pg_temp.ok((SELECT count(*)=3 AND bool_and(p.prosecdef AND p.proowner='postgres'::regrole AND p.proconfig=ARRAY['search_path=pg_catalog, pg_temp']) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('assign_default_market_package','approve_sinpe_payment','activate_purchase')),'exact safe definer signatures');
SELECT pg_temp.ok(NOT EXISTS(SELECT 1 FROM pg_proc p CROSS JOIN LATERAL aclexplode(p.proacl)a WHERE p.proname IN ('assign_default_market_package','approve_sinpe_payment','activate_purchase') AND a.grantee=0 AND a.privilege_type='EXECUTE'),'no PUBLIC overload leakage');
SELECT pg_temp.ok(NOT has_schema_privilege('service_role','twuanis_canonical_private','USAGE'),'private schema closed');
CREATE TEMP TABLE user_subscriptions(id uuid);
SET LOCAL search_path=pg_temp,public;
SELECT pg_temp.change(507,3);
SELECT pg_temp.ok((SELECT count(*)=0 FROM pg_temp.user_subscriptions),'temp shadow untouched');
DROP TABLE pg_temp.user_subscriptions;
SET LOCAL search_path=public;
-- Snapshot both commercial state and every listing to catch lifecycle side effects.
CREATE FUNCTION pg_temp.snapshot() RETURNS jsonb LANGUAGE sql AS $$ SELECT jsonb_build_array((SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM public.user_subscriptions t),(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM public.sinpe_payments t),(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM public.purchase_request_events t),(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM public.publisher_accounts t),(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM public.listings t)) $$;
CREATE FUNCTION pg_temp.inject() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'S5 failure injection' USING ERRCODE='ZX005'; END $$;
INSERT INTO ids VALUES('failure_purchase',pg_temp.purchase(508,4));
SELECT set_config('request.jwt.claim.sub',pg_temp.uid(509)::text,true);
INSERT INTO ids SELECT 'failure_payment',payment_id FROM public.create_subscription_upgrade_request(pg_temp.pkg(4),'CRC','FAIL','Sender');
SELECT set_config('request.jwt.claim.sub',pg_temp.uid(599)::text,true);
DO $$ DECLARE writer text;t text;ev text;q text;before jsonb;BEGIN
 FOREACH writer IN ARRAY ARRAY['purchase','approval'] LOOP
  FOREACH t IN ARRAY ARRAY['user_subscriptions','final'] LOOP
   FOREACH ev IN ARRAY ARRAY['UPDATE','INSERT'] LOOP
    IF t='final' AND ev='UPDATE' THEN CONTINUE; END IF;
    before:=pg_temp.snapshot();
    IF t='final' THEN
     IF writer='purchase' THEN EXECUTE 'CREATE TRIGGER s5_inject AFTER INSERT ON public.purchase_request_events FOR EACH ROW EXECUTE FUNCTION pg_temp.inject()';
     ELSE EXECUTE 'CREATE TRIGGER s5_inject AFTER UPDATE ON public.sinpe_payments FOR EACH ROW EXECUTE FUNCTION pg_temp.inject()'; END IF;
    ELSE
     IF writer='approval' AND ev='INSERT' THEN CONTINUE;END IF;
     EXECUTE format('CREATE TRIGGER s5_inject AFTER %s ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION pg_temp.inject()',ev);
    END IF;
    q:=CASE writer WHEN 'purchase' THEN 'SELECT * FROM public.activate_purchase((SELECT id FROM ids WHERE label=''failure_purchase''))' ELSE 'SELECT * FROM public.approve_sinpe_payment((SELECT id FROM ids WHERE label=''failure_payment''))' END;
    PERFORM pg_temp.reject(q,'ZX005',writer||' failure '||t||' '||ev);
    PERFORM pg_temp.ok(before=pg_temp.snapshot(),writer||' rollback including listings '||t||' '||ev);
    EXECUTE format('DROP TRIGGER s5_inject ON public.%I',CASE WHEN t<>'final' THEN t WHEN writer='purchase' THEN 'purchase_request_events' ELSE 'sinpe_payments' END);
   END LOOP;
  END LOOP;
 END LOOP;
END $$;
-- Fail after publisher provisioning via invalid package, and after purchase lock
-- through approval validation; neither must leave provisioning/commercial changes.
DELETE FROM publisher_accounts WHERE owner_user_id=pg_temp.uid(510);
INSERT INTO ids VALUES('invalid_purchase',pg_temp.purchase(510,4));
UPDATE purchase_requests SET status='pending' WHERE id=(SELECT id FROM ids WHERE label='invalid_purchase');
DO $$ DECLARE before jsonb:=pg_temp.snapshot();BEGIN PERFORM pg_temp.reject('SELECT * FROM public.activate_purchase((SELECT id FROM ids WHERE label=''invalid_purchase''))','P0001','failure after publisher and purchase lock');PERFORM pg_temp.ok(before=pg_temp.snapshot(),'new publisher rollback on invalid purchase');END $$;
UPDATE purchase_requests SET status='approved' WHERE id=(SELECT id FROM ids WHERE label='invalid_purchase');
UPDATE packages SET is_active=false WHERE id=pg_temp.pkg(4);
DO $$ DECLARE before jsonb:=pg_temp.snapshot();BEGIN PERFORM pg_temp.reject('SELECT * FROM public.activate_purchase((SELECT id FROM ids WHERE label=''invalid_purchase''))','P0001','failure at package resolution');PERFORM pg_temp.ok(before=pg_temp.snapshot(),'package resolution rollback');END $$;
UPDATE packages SET is_active=true WHERE id=pg_temp.pkg(4);
SELECT * FROM public.activate_purchase((SELECT id FROM ids WHERE label='invalid_purchase'));
SELECT pg_temp.ok(pg_temp.cap(510)->>'allowance'='5','failed activation retry succeeds');
-- Targeted S1-S4 invariants, without running historical suites.
SELECT pg_temp.ok((SELECT count(*)=count(DISTINCT owner_user_id) FROM publisher_accounts),'publisher uniqueness');
SELECT pg_temp.ok((SELECT bool_and(district='Pejivalle' AND current_price=.5) FROM listings WHERE owner_id=pg_temp.uid(501)),'P+C+D Sale below 1 preserved');
SELECT pg_temp.ok((SELECT bool_and(exact_value=.5) FROM listing_fact_evidence WHERE dimension='bathrooms' AND listing_id IN (SELECT id FROM listings WHERE owner_id=pg_temp.uid(501))),'fractional bathroom preserved');
UPDATE listings SET price_millions=77 WHERE id=(SELECT id FROM ids WHERE label='active1');
SELECT pg_temp.change(501,4);
SELECT pg_temp.ok((SELECT price_millions=77 FROM listings WHERE id=(SELECT id FROM ids WHERE label='active1')),'commercial change preserves legacy monetary evidence');
SELECT pg_temp.ok((SELECT remaining=-2 AND over_capacity=2 FROM twuanis_canonical_private.capacity_state(3,5)),'S2 capacity arithmetic');
SET LOCAL ROLE authenticated;
SELECT pg_temp.reject($q$SELECT public.mutate_trusted_canonical_listing(gen_random_uuid(),1,gen_random_uuid(),'{}')$q$,'42501','S4 trusted isolation');
SELECT pg_temp.reject($q$SELECT twuanis_canonical_private.s3_command(gen_random_uuid(),1,'owner','spoof',gen_random_uuid(),'{}',NULL)$q$,'42501','S3 raw isolation');
RESET ROLE;
-- Successful reviewer call runs with actual authenticated EXECUTE privileges.
SELECT set_config('request.jwt.claim.sub',pg_temp.uid(506)::text,true);
INSERT INTO ids SELECT 'role_review',payment_id FROM public.create_subscription_upgrade_request(pg_temp.pkg(3),'CRC','ROLE','Sender');
SELECT set_config('request.jwt.claim.sub',pg_temp.uid(599)::text,true);
SET LOCAL ROLE authenticated;
SELECT * FROM public.approve_sinpe_payment((SELECT id FROM ids WHERE label='role_review'));
RESET ROLE;
SELECT pg_temp.ok(pg_temp.cap(506)->>'allowance'='3','actual authenticated reviewer approval succeeds');
-- Inject failure after pending -> active, beyond cancellation of the prior row.
CREATE TRIGGER s5_inject AFTER UPDATE ON public.user_subscriptions FOR EACH ROW WHEN (NEW.status='active') EXECUTE FUNCTION pg_temp.inject();
DO $$ DECLARE before jsonb:=pg_temp.snapshot();BEGIN PERFORM pg_temp.reject('SELECT * FROM public.approve_sinpe_payment((SELECT id FROM ids WHERE label=''failure_payment''))','ZX005','approval failure after new active state');PERFORM pg_temp.ok(before=pg_temp.snapshot(),'activation-stage approval rollback');END $$;
DROP TRIGGER s5_inject ON public.user_subscriptions;
-- Signup and publisher provisioning are one transaction with free entitlement.
CREATE TRIGGER s5_inject AFTER INSERT ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION pg_temp.inject();
DO $$ DECLARE before jsonb:=pg_temp.snapshot();BEGIN PERFORM pg_temp.reject('INSERT INTO auth.users(id) VALUES(''00000000-0000-0000-0000-000000000590'')','ZX005','signup entitlement failure');PERFORM pg_temp.ok(before=pg_temp.snapshot() AND NOT EXISTS(SELECT 1 FROM auth.users WHERE id=pg_temp.uid(590)),'signup auth publisher entitlement rollback');END $$;
DROP TRIGGER s5_inject ON public.user_subscriptions;
-- Unchanged add-on branch is non-capacity-affecting and still returns entitlement.
INSERT INTO public.add_on_products VALUES('98000000-0000-0000-0000-000000000001','capability','fixture-addon',true,'listing',false,1,false,'days',3);
INSERT INTO ids VALUES('addon_listing',pg_temp.draft(503));
WITH x AS (INSERT INTO public.purchase_requests(owner_id,product_type,status,add_on_product_id,listing_id,quantity) VALUES(pg_temp.uid(503),'add_on','approved','98000000-0000-0000-0000-000000000001',(SELECT id FROM ids WHERE label='addon_listing'),1) RETURNING id) INSERT INTO ids SELECT 'addon_purchase',id FROM x;

INSERT INTO ids SELECT 'addon_before_sub',id FROM public.user_subscriptions WHERE user_id=pg_temp.uid(503) AND status='active';
SELECT * FROM public.activate_purchase((SELECT id FROM ids WHERE label='addon_purchase'));
SELECT pg_temp.ok((SELECT count(*)=1 AND bool_and(status='active' AND expires_at=starts_at+interval '3 days') FROM listing_entitlements WHERE purchase_request_id=(SELECT id FROM ids WHERE label='addon_purchase')),'add-on successful result preserved');
SELECT pg_temp.ok((SELECT id FROM ids WHERE label='addon_before_sub')=(SELECT id FROM public.user_subscriptions WHERE user_id=pg_temp.uid(503) AND status='active'),'add-on no subscription replacement');
SELECT pg_temp.reject($q$SELECT * FROM public.activate_purchase((SELECT id FROM ids WHERE label='addon_purchase'))$q$,'P0001','add-on duplicate rejected');
-- Existing-listing revision/idempotency survive commercial replacement unchanged.
DO $$ DECLARE l uuid:=(SELECT id FROM ids WHERE label='active1');r bigint;req uuid:=gen_random_uuid();a jsonb;b jsonb;BEGIN SELECT canonical_revision INTO r FROM public.listings WHERE id=l;a:=public.mutate_trusted_canonical_listing(l,r,req,'{"money":{"amount":"1","currency":"USD"}}');b:=public.mutate_trusted_canonical_listing(l,r,req,'{"money":{"amount":"1.00","currency":"USD"}}');PERFORM pg_temp.ok(a->>'revision'=(r+1)::text AND b->>'revision'=a->>'revision' AND b->>'replayed'='true','S3 revision normalized idempotency preserved');PERFORM pg_temp.ok((SELECT price_millions=77 FROM public.listings WHERE id=l),'S4 monetary write legacy preservation');END $$;

SELECT count(*) AS s5_assertions_passed FROM assertions;
ROLLBACK;
