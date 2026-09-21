-- LOCAL DISPOSABLE ONLY. Synthetic prerequisites, not a target schema replacement.
CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;CREATE EXTENSION unaccent WITH SCHEMA public;
CREATE TABLE public.listings(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 transaction_type text NOT NULL DEFAULT 'buy',
 listing_status text DEFAULT 'active' CHECK(listing_status IN ('draft','active','expired','archived','deleted')),
 currency text NOT NULL DEFAULT 'CRC', current_price numeric, price_millions numeric,
 monthly_price bigint, property_area numeric, construction_area numeric,
 title text, images text, published_at timestamptz, updated_at timestamptz DEFAULT now(),
 expired_at timestamptz, deleted_at timestamptz, renewed_at timestamptz, archived_at timestamptz,
 listing_origin text NOT NULL, listing_source_type text NOT NULL,
 source_name text,source_listing_id text,
 UNIQUE(source_name,source_listing_id)
);
CREATE TABLE public.ontology_terms(
 id bigint PRIMARY KEY,term_type text NOT NULL,level integer,parent_id bigint,
 term_name text,official_code text
);
CREATE TABLE public.listings_ontology_terms(
 listing_id uuid REFERENCES public.listings ON DELETE CASCADE,
 ontology_term_id bigint REFERENCES public.ontology_terms ON DELETE CASCADE,
 PRIMARY KEY(listing_id,ontology_term_id)
);
ALTER TABLE public.listings
 ADD COLUMN province text,ADD COLUMN canton text,ADD COLUMN district text,
 ADD COLUMN province_normalized text,ADD COLUMN canton_normalized text,ADD COLUMN district_normalized text,
 ADD COLUMN property_type text,ADD COLUMN utility text[],ADD COLUMN environment text,ADD COLUMN terrain text[],ADD COLUMN accessibility text,ADD COLUMN legal_status text,
 ADD COLUMN bedrooms text,ADD COLUMN bathrooms text,ADD COLUMN parking text,ADD COLUMN year_built_range text,ADD COLUMN distance_to_paved_road_range text,
 ADD COLUMN first_seen timestamptz,ADD COLUMN last_seen timestamptz,ADD COLUMN last_scraped timestamptz,ADD COLUMN times_scraped integer;
CREATE TABLE public.ontology_relationships(source_term_id bigint REFERENCES public.ontology_terms,target_term_id bigint REFERENCES public.ontology_terms,relationship_type text,PRIMARY KEY(source_term_id,target_term_id,relationship_type));
ALTER TABLE listings ADD COLUMN description text,ADD COLUMN whatsapp text, ADD COLUMN source_url text;
ALTER TABLE ontology_terms ADD COLUMN term_name_en text, ADD COLUMN term_name_es text;
CREATE TABLE public.packages(id uuid PRIMARY KEY,slug text NOT NULL UNIQUE);
CREATE TABLE public.package_limits(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),package_id uuid NOT NULL UNIQUE REFERENCES public.packages ON DELETE CASCADE,
 listing_limit integer CONSTRAINT fixture_limit_nonnegative CHECK(listing_limit IS NULL OR listing_limit>=0),
 featured_listing_limit integer,storage_limit_mb integer,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.user_subscriptions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
 package_id uuid NOT NULL REFERENCES public.packages ON DELETE RESTRICT,
 status text NOT NULL CHECK(status IN ('active','pending_payment','cancelled','expired')),
 billing_cycle text NOT NULL,started_at timestamptz,current_period_start timestamptz,current_period_end timestamptz,
 cancelled_at timestamptz,expired_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),purchase_request_id uuid UNIQUE,
 CHECK(current_period_end IS NULL OR current_period_start IS NULL OR current_period_end>current_period_start));
CREATE UNIQUE INDEX fixture_one_active_subscription ON public.user_subscriptions(user_id) WHERE status='active';
CREATE UNIQUE INDEX fixture_one_pending_subscription ON public.user_subscriptions(user_id) WHERE status='pending_payment';

ALTER TABLE public.packages ADD COLUMN billing_interval text NOT NULL DEFAULT 'monthly',ADD COLUMN is_active boolean NOT NULL DEFAULT true,ADD COLUMN price_crc numeric DEFAULT 1000,ADD COLUMN price_usd numeric DEFAULT 2;
CREATE TABLE public.purchase_requests(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),owner_id uuid NOT NULL REFERENCES auth.users,product_type text NOT NULL,status text NOT NULL,package_id uuid REFERENCES public.packages,add_on_product_id uuid,listing_id uuid,quantity integer DEFAULT 1);
CREATE TABLE public.purchase_request_events(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),purchase_request_id uuid REFERENCES public.purchase_requests,event_type text,previous_status text,resulting_status text,actor_id uuid,metadata jsonb);
CREATE TABLE public.sinpe_payments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES auth.users,subscription_id uuid REFERENCES public.user_subscriptions,purchase_request_id uuid,amount numeric,currency text,sinpe_reference text,sender_name text,sender_phone text,payment_date timestamptz,status text,reviewed_by uuid,reviewed_at timestamptz,approved_at timestamptz,rejected_at timestamptz,rejection_reason text,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
CREATE TABLE public.add_on_products(id uuid PRIMARY KEY,product_type text,slug text,is_active boolean,target_type text,is_stackable boolean,maximum_quantity integer,requires_manual_approval boolean,duration_type text,duration_days integer);
CREATE TABLE public.listing_entitlements(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),listing_id uuid,product_id uuid,owner_id uuid,status text,source_type text,starts_at timestamptz,expires_at timestamptz,purchase_request_id uuid UNIQUE,assigned_by uuid);
CREATE TABLE public.promotion_events(listing_id uuid,entitlement_id uuid,purchase_request_id uuid,product_id uuid,promotion_slug text,event_type text,previous_state text,resulting_state text,starts_at timestamptz,expires_at timestamptz,metadata jsonb,actor_id uuid,actor_type text,occurred_at timestamptz);

CREATE TABLE listing_publish_tokens(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),token text UNIQUE,phone text,verified boolean DEFAULT false,listing_data jsonb,created_at timestamptz DEFAULT now(),published_at timestamptz,published_listing_id uuid REFERENCES listings,claimed_at timestamptz);
CREATE TABLE entitlements(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),slug text);
CREATE TABLE package_entitlements(package_id uuid REFERENCES packages,entitlement_id uuid REFERENCES entitlements);
CREATE TABLE saved_analyses(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES auth.users);
CREATE TABLE payment_reviewers(user_id uuid REFERENCES auth.users,active boolean);
CREATE TABLE listing_measurement_provenance(listing_id uuid REFERENCES listings,field_name text,measurement_value numeric,source_url text,source_name text,source_listing_id text,recovery_method text);
GRANT USAGE ON SCHEMA public,auth TO anon,authenticated,service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon,authenticated,service_role;
INSERT INTO packages(id,slug,billing_interval,is_active) VALUES('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','market-explorer','free',true);
INSERT INTO package_limits(package_id,listing_limit) VALUES('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',10);
INSERT INTO auth.users VALUES('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
INSERT INTO ontology_terms(id,term_type,level,parent_id,term_name,official_code) VALUES
(9,'country',0,NULL,'Costa Rica',NULL),(1,'property_type',1,NULL,'House',NULL),
(1001,'province',1,9,'Cartago','3'),(1002,'canton',2,1001,'Jiménez','304'),
(1172,'accessibility',1,NULL,'2WD Accessible',NULL),(1173,'accessibility',1,NULL,'Paved Road',NULL),
(1174,'accessibility',1,NULL,'4x4 Required',NULL),(1175,'accessibility',1,NULL,'Walkable',NULL),(1176,'accessibility',1,NULL,'Boat Access Only',NULL);

CREATE OR REPLACE FUNCTION public.activate_purchase(p_purchase_id uuid)
 RETURNS TABLE(purchase_id uuid, owner_id uuid, product_type text, activation_type text, activation_id uuid, activated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$declare
  v_purchase public.purchase_requests%rowtype;

  v_now timestamptz :=
    now();

  v_activation_id uuid;

  v_activation_type text;

  v_existing_activation_id uuid;

  v_package public.packages%rowtype;

  v_existing_subscription_id uuid;

  v_period_end timestamptz;

  v_add_on public.add_on_products%rowtype;

  v_listing_owner_id uuid;

  v_existing_entitlement_ids uuid[];

  v_existing_entitlement_count integer;

  v_entitlement_status text;

  v_entitlement_starts_at timestamptz;

  v_entitlement_expires_at timestamptz;

begin

  /*
   * -------------------------------------------------------
   * 1. LOCK CANONICAL PURCHASE
   * -------------------------------------------------------
   */

  select *
  into v_purchase
  from public.purchase_requests
  where id = p_purchase_id
  for update;

  if not found then
    raise exception
      'PURCHASE_NOT_FOUND';
  end if;


  /*
   * -------------------------------------------------------
   * 2. REVALIDATE APPROVAL
   * -------------------------------------------------------
   */

  if v_purchase.status <> 'approved' then
    raise exception
      'PURCHASE_NOT_APPROVED';
  end if;


  /*
   * -------------------------------------------------------
   * 3. PREVENT DUPLICATE ACTIVATION
   * -------------------------------------------------------
   */

  if v_purchase.product_type = 'package' then

    select id
    into v_existing_activation_id
    from public.user_subscriptions
    where purchase_request_id =
      v_purchase.id
    limit 1;

  elsif v_purchase.product_type = 'add_on' then

    select id
    into v_existing_activation_id
    from public.listing_entitlements
    where purchase_request_id =
      v_purchase.id
    limit 1;

  else
    raise exception
      'UNSUPPORTED_PRODUCT_TYPE';
  end if;

  if v_existing_activation_id is not null then
    raise exception
      'PURCHASE_ALREADY_ACTIVATED';
  end if;


  /*
   * -------------------------------------------------------
   * 4. PACKAGE ACTIVATION
   * -------------------------------------------------------
   */

  if v_purchase.product_type = 'package' then

    if v_purchase.package_id is null then
      raise exception
        'PACKAGE_NOT_FOUND';
    end if;

    select *
    into v_package
    from public.packages
    where
      id =
        v_purchase.package_id
      and is_active =
        true;

    if not found then
      raise exception
        'PACKAGE_NOT_FOUND_OR_INACTIVE';
    end if;


    /*
     * Resolve canonical billing period.
     */

    if v_package.billing_interval = 'free' then

      v_period_end :=
        null;

    elsif v_package.billing_interval = 'monthly' then

      v_period_end :=
        v_now +
        interval '1 month';

    elsif v_package.billing_interval = 'annual' then

      v_period_end :=
        v_now +
        interval '1 year';

    else
      raise exception
        'UNSUPPORTED_BILLING_INTERVAL';
    end if;


    /*
     * Expire replaced active subscription.
     *
     * History is preserved.
     */

    select id
    into v_existing_subscription_id
    from public.user_subscriptions
    where
      user_id =
        v_purchase.owner_id
      and status =
        'active'
    order by created_at desc
    limit 1
    for update;

    if v_existing_subscription_id is not null then

      update public.user_subscriptions
      set
        status =
          'expired',

        expired_at =
          v_now

      where id =
        v_existing_subscription_id;

    end if;


    /*
     * Create authoritative active subscription.
     */

    insert into public.user_subscriptions (
      user_id,
      package_id,
      status,
      billing_cycle,
      started_at,
      current_period_start,
      current_period_end,
      cancelled_at,
      expired_at,
      purchase_request_id
    )
    values (
      v_purchase.owner_id,
      v_package.id,
      'active',
      v_package.billing_interval,
      v_now,
      v_now,
      v_period_end,
      null,
      null,
      v_purchase.id
    )
    returning id
    into v_activation_id;

    v_activation_type :=
      'subscription';


  /*
   * -------------------------------------------------------
   * 5. ADD-ON ACTIVATION
   * -------------------------------------------------------
   */

  elsif v_purchase.product_type = 'add_on' then

    if v_purchase.add_on_product_id is null then
      raise exception
        'ADD_ON_NOT_FOUND';
    end if;

    if v_purchase.listing_id is null then
      raise exception
        'LISTING_TARGET_REQUIRED';
    end if;

    if v_purchase.quantity <> 1 then
      raise exception
        'INVALID_ADD_ON_QUANTITY';
    end if;

    select *
    into v_add_on
    from public.add_on_products
    where
      id =
        v_purchase.add_on_product_id
      and is_active =
        true;

    if not found then
      raise exception
        'ADD_ON_NOT_FOUND_OR_INACTIVE';
    end if;

    if v_add_on.target_type <> 'listing' then
      raise exception
        'ADD_ON_TARGET_UNSUPPORTED';
    end if;


    /*
     * Verify listing ownership.
     */

    select
      l.owner_id
    into
      v_listing_owner_id
    from public.listings as l
    where
      l.id = v_purchase.listing_id;

    if not found then
      raise exception
        'LISTING_NOT_FOUND';
    end if;

    if v_listing_owner_id is null then
      raise exception
        'LISTING_OWNER_NOT_FOUND';
    end if;

    if v_listing_owner_id <>
       v_purchase.owner_id then
      raise exception
        'LISTING_OWNER_MISMATCH';
    end if;


    /*
     * Resolve current operational entitlement count.
     */

    select
      count(*),
      array_agg(id)
    into
      v_existing_entitlement_count,
      v_existing_entitlement_ids
    from public.listing_entitlements
    where
      listing_id =
        v_purchase.listing_id
      and product_id =
        v_add_on.id
      and status in (
        'active',
        'scheduled'
      );


    /*
     * Stackable maximum.
     */

    if
      v_add_on.is_stackable = true
      and v_add_on.maximum_quantity is not null
      and v_existing_entitlement_count >=
        v_add_on.maximum_quantity
    then
      raise exception
        'ENTITLEMENT_LIMIT_REACHED';
    end if;


    /*
     * Non-stackable replacement.
     */

    if
      v_add_on.is_stackable = false
      and v_existing_entitlement_count > 0
    then

      /*
      * If the replaced capability is a promotion,
      * record its expiration before mutating the
      * entitlement row.
      *
      * This insert and the entitlement update live
      * inside the same PostgreSQL transaction.
      *
      * If either operation fails, both roll back.
      */

      if
        v_add_on.product_type = 'promotion'
      then

        insert into public.promotion_events (
          listing_id,
          entitlement_id,
          purchase_request_id,
          product_id,
          promotion_slug,
          event_type,
          previous_state,
          resulting_state,
          starts_at,
          expires_at,
          metadata,
          actor_id,
          actor_type,
          occurred_at
        )
        select
          le.listing_id,
          le.id,
          le.purchase_request_id,
          le.product_id,
          v_add_on.slug,
          'promotion_expired',
          le.status,
          'expired',
          le.starts_at,
          v_now,
          jsonb_build_object(
            'reason',
            'replaced_by_new_entitlement',

            'replacement_purchase_request_id',
            v_purchase.id,

            'source',
            'activate_purchase'
          ),
          null,
          'system',
          v_now
        from public.listing_entitlements as le
        where
          le.id =
            any(
              v_existing_entitlement_ids
            );

      end if;


      update public.listing_entitlements
      set
        status =
          'expired',

        expires_at =
          v_now

      where id =
        any(
          v_existing_entitlement_ids
        );

    end if;


    /*
     * Create canonical entitlement.
     *
     * The validate_listing_entitlement trigger resolves
     * starts_at / expires_at where appropriate and rechecks
     * ownership / product constraints.
     */

    insert into public.listing_entitlements (
      listing_id,
      product_id,
      owner_id,
      status,
      source_type,
      starts_at,
      expires_at,
      purchase_request_id,
      assigned_by
    )
    values (
      v_purchase.listing_id,
      v_add_on.id,
      v_purchase.owner_id,

      case
        when v_add_on.requires_manual_approval
          then 'pending'
        else 'active'
      end,

      'purchase',

      case
        when v_add_on.requires_manual_approval
          then null
        else v_now
      end,

      case
        when
          v_add_on.requires_manual_approval
        then null

        when
          v_add_on.duration_type =
            'days'
          and
          v_add_on.duration_days
            is not null
        then
          v_now +
          make_interval(
            days =>
              v_add_on.duration_days
          )

        else
          null
      end,

      v_purchase.id,

      null
    )
      returning
        id,
        status,
        starts_at,
        expires_at
      into
        v_activation_id,
        v_entitlement_status,
        v_entitlement_starts_at,
        v_entitlement_expires_at;

    /*
 * -------------------------------------------------------
 * RECORD INITIAL PROMOTION OPERATION
 * -------------------------------------------------------
 *
 * Only promotional products create Promotion History.
 *
 * Pending capability approval is not yet operational
 * promotion behavior, so no promotion event is fabricated.
 */


if
  v_add_on.product_type = 'promotion'
  and
  v_entitlement_status in (
    'active',
    'scheduled'
  )
then

  insert into public.promotion_events (
    listing_id,
    entitlement_id,
    purchase_request_id,
    product_id,
    promotion_slug,
    event_type,
    previous_state,
    resulting_state,
    starts_at,
    expires_at,
    metadata,
    actor_id,
    actor_type,
    occurred_at
  )
  values (
    v_purchase.listing_id,
    v_activation_id,
    v_purchase.id,
    v_add_on.id,
    v_add_on.slug,

    case
      when v_entitlement_status =
        'scheduled'
      then
        'promotion_scheduled'
      else
        'promotion_activated'
    end,

    null,
    v_entitlement_status,
    v_entitlement_starts_at,
    v_entitlement_expires_at,

    jsonb_build_object(
      'source',
      'activate_purchase',

      'activation_type',
      'listing_entitlement'
    ),

    null,
    'system',
    v_now
  );

end if;


v_activation_type :=
  'listing_entitlement';

end if;


  /*
   * -------------------------------------------------------
   * 6. RECORD IMMUTABLE ACTIVATION EVENT
   * -------------------------------------------------------
   */

  insert into public.purchase_request_events (
    purchase_request_id,
    event_type,
    previous_status,
    resulting_status,
    actor_id,
    metadata
  )
  values (
    v_purchase.id,
    'purchase_activated',
    v_purchase.status,
    v_purchase.status,
    null,
    jsonb_build_object(
      'activation_type',
      v_activation_type,
      'activation_id',
      v_activation_id
    )
  );


  /*
   * -------------------------------------------------------
   * 7. RETURN CANONICAL ACTIVATION FACTS
   * -------------------------------------------------------
   */

  return query
  select
    v_purchase.id,
    v_purchase.owner_id,
    v_purchase.product_type,
    v_activation_type,
    v_activation_id,
    v_now;

end;$function$

CREATE OR REPLACE FUNCTION public.approve_sinpe_payment(p_payment_id uuid)
 RETURNS TABLE(payment_id uuid, subscription_id uuid, previous_subscription_id uuid, user_id uuid, package_id uuid, payment_status text, subscription_status text, period_start timestamp with time zone, period_end timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
    v_reviewer_id uuid;

    v_payment public.sinpe_payments%rowtype;

    v_pending_subscription
        public.user_subscriptions%rowtype;

    v_active_subscription
        public.user_subscriptions%rowtype;

    v_period_start timestamptz;
    v_period_end timestamptz;
begin
    -- ========================================================
    -- 1. VERIFY REVIEWER
    -- ========================================================

    perform public.require_payment_reviewer();

    v_reviewer_id := auth.uid();

    -- ========================================================
    -- 2. LOCK PAYMENT
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
            'Only submitted or under-review payments can be approved.';
    end if;

    -- ========================================================
    -- 3. LOCK PENDING SUBSCRIPTION
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

    if (
        v_pending_subscription.user_id <>
        v_payment.user_id
    ) then
        raise exception
            'Payment and subscription users do not match.';
    end if;

    if (
        v_pending_subscription.status <>
        'pending_payment'
    ) then
        raise exception
            'The target subscription is not pending payment.';
    end if;

    -- ========================================================
    -- 4. LOCK CURRENT ACTIVE SUBSCRIPTION
    -- ========================================================

    select *
    into v_active_subscription
    from public.user_subscriptions
    where user_id =
        v_pending_subscription.user_id
      and status = 'active'
      and id <>
        v_pending_subscription.id
    order by created_at desc
    limit 1
    for update;

    -- ========================================================
    -- 5. CALCULATE NEW SUBSCRIPTION PERIOD
    -- ========================================================

    v_period_start := now();

    v_period_end :=
        case
            when
                v_pending_subscription.billing_cycle =
                'annual'
            then
                v_period_start +
                interval '1 year'

            when
                v_pending_subscription.billing_cycle =
                'monthly'
            then
                v_period_start +
                interval '1 month'

            else
                null
        end;

    -- ========================================================
    -- 6. DEACTIVATE PREVIOUS SUBSCRIPTION
    -- ========================================================

    if v_active_subscription.id is not null then
        update public.user_subscriptions
        set
            status = 'cancelled',
            cancelled_at = now(),
            current_period_end =
                least(
                    coalesce(
                        current_period_end,
                        now()
                    ),
                    now()
                ),
            updated_at = now()
        where id =
            v_active_subscription.id;
    end if;

    -- ========================================================
    -- 7. ACTIVATE UPGRADED SUBSCRIPTION
    -- ========================================================

    update public.user_subscriptions
    set
        status = 'active',
        started_at = v_period_start,
        current_period_start =
            v_period_start,
        current_period_end =
            v_period_end,
        cancelled_at = null,
        expired_at = null,
        updated_at = now()
    where id =
        v_pending_subscription.id;

    -- ========================================================
    -- 8. APPROVE SINPE PAYMENT
    -- ========================================================

    update public.sinpe_payments
    set
        status = 'approved',
        reviewed_by = v_reviewer_id,
        reviewed_at = now(),
        approved_at = now(),
        rejected_at = null,
        rejection_reason = null,
        updated_at = now()
    where id = v_payment.id;

    -- ========================================================
    -- 9. RETURN RESULT
    -- ========================================================

    return query
    select
        v_payment.id,
        v_pending_subscription.id,
        v_active_subscription.id,
        v_pending_subscription.user_id,
        v_pending_subscription.package_id,
        'approved'::text,
        'active'::text,
        v_period_start,
        v_period_end;
end;
$function$

CREATE OR REPLACE FUNCTION public.assign_default_market_package()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
    default_package_id uuid;
begin
    select id
    into default_package_id
    from public.packages
    where slug = 'market-explorer'
      and is_active = true
    limit 1;

    if default_package_id is null then
        raise exception
            'Default Market Explorer package was not found.';
    end if;

    insert into public.user_subscriptions (
        user_id,
        package_id,
        status,
        billing_cycle,
        started_at,
        current_period_start
    )
    values (
        new.id,
        default_package_id,
        'active',
        'free',
        now(),
        now()
    )
    on conflict do nothing;

    return new;
end;
$function$

CREATE OR REPLACE FUNCTION public.is_payment_reviewer(p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    select exists (
        select 1
        from public.payment_reviewers pr
        where pr.user_id = p_user_id
          and pr.active = true
    );
$function$

CREATE OR REPLACE FUNCTION public.recover_listing_measurement(p_listing_id uuid, p_field_name text, p_measurement_value numeric, p_recovery_method text, p_source_url text DEFAULT NULL::text, p_source_name text DEFAULT NULL::text, p_source_listing_id text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN

  -- Only canonical exact-area fields may be recovered.
  IF p_field_name NOT IN (
    'property_area',
    'construction_area'
  ) THEN
    RAISE EXCEPTION
      'Invalid measurement field: %',
      p_field_name;
  END IF;

  -- Exact measurements must be positive numeric observations.
  IF p_measurement_value IS NULL
     OR p_measurement_value <= 0 THEN
    RAISE EXCEPTION
      'Measurement value must be greater than zero';
  END IF;

  -- Recovery method must use the canonical provenance vocabulary.
  IF p_recovery_method NOT IN (
    'source_recovery',
    'manual_verification'
  ) THEN
    RAISE EXCEPTION
      'Invalid recovery method: %',
      p_recovery_method;
  END IF;

  -- The listing must actually exist.
  IF NOT EXISTS (
    SELECT 1
    FROM public.listings
    WHERE id = p_listing_id
  ) THEN
    RAISE EXCEPTION
      'Listing does not exist: %',
      p_listing_id;
  END IF;

  -- Record the evidence first.
  INSERT INTO public.listing_measurement_provenance (
    listing_id,
    field_name,
    measurement_value,
    source_url,
    source_name,
    source_listing_id,
    recovery_method
  )
  VALUES (
    p_listing_id,
    p_field_name,
    p_measurement_value,
    p_source_url,
    p_source_name,
    p_source_listing_id,
    p_recovery_method
  );

  -- Promote the recovered exact observation into the canonical column.
  IF p_field_name = 'property_area' THEN

    UPDATE public.listings
    SET property_area = p_measurement_value
    WHERE id = p_listing_id;

  ELSIF p_field_name = 'construction_area' THEN

    UPDATE public.listings
    SET construction_area = p_measurement_value
    WHERE id = p_listing_id;

  END IF;

END;
$function$

CREATE OR REPLACE FUNCTION public.require_payment_reviewer()
 RETURNS void
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
    if auth.uid() is null then
        raise exception
            'Authentication required.';
    end if;

    if not public.is_payment_reviewer(
        auth.uid()
    ) then
        raise exception
            'Payment reviewer authorization required.';
    end if;
end;
$function$

CREATE TRIGGER assign_default_market_package_on_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.assign_default_market_package();