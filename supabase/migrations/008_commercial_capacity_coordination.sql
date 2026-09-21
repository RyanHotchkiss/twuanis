-- S5: coordinate existing commercial writers; no listing lifecycle side effects.
-- Definitions based on cached A3 catalog evidence. No production refresh/deployment.
-- Existing upgrade-request and SINPE-rejection paths do not change effective allowance.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';

CREATE OR REPLACE FUNCTION public.assign_default_market_package()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path=pg_catalog,pg_temp
AS $function$
declare
    default_package_id uuid;
begin
    PERFORM twuanis_canonical_private.ensure_publisher_account(new.id);
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
$function$;

CREATE OR REPLACE FUNCTION public.approve_sinpe_payment(p_payment_id uuid)
 RETURNS TABLE(payment_id uuid, subscription_id uuid, previous_subscription_id uuid, user_id uuid, package_id uuid, payment_status text, subscription_status text, period_start timestamp with time zone, period_end timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path=pg_catalog,pg_temp
AS $function$
#variable_conflict use_column
declare
    v_capacity_owner uuid;
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
    -- Identity-only pre-read, without a commercial row lock. Revalidate after wait.
    SELECT p.user_id INTO v_capacity_owner FROM public.sinpe_payments p WHERE p.id=p_payment_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'SINPE payment not found.'; END IF;
    PERFORM twuanis_canonical_private.ensure_publisher_account(v_capacity_owner);

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

    IF v_payment.user_id IS DISTINCT FROM v_capacity_owner THEN RAISE EXCEPTION 'payment owner changed' USING ERRCODE='40001'; END IF;

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

    v_period_start := clock_timestamp();

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
            cancelled_at = v_period_start,
            current_period_end =
                least(
                    coalesce(
                        current_period_end,
                        v_period_start
                    ),
                    v_period_start
                ),
            updated_at = v_period_start
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
        updated_at = v_period_start
    where id =
        v_pending_subscription.id;

    -- ========================================================
    -- 8. APPROVE SINPE PAYMENT
    -- ========================================================

    update public.sinpe_payments
    set
        status = 'approved',
        reviewed_by = v_reviewer_id,
        reviewed_at = v_period_start,
        approved_at = v_period_start,
        rejected_at = null,
        rejection_reason = null,
        updated_at = v_period_start
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
$function$;

CREATE OR REPLACE FUNCTION public.activate_purchase(p_purchase_id uuid)
 RETURNS TABLE(purchase_id uuid, owner_id uuid, product_type text, activation_type text, activation_id uuid, activated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path=pg_catalog,pg_temp
AS $function$
#variable_conflict use_column
declare
  v_capacity_owner uuid;
  v_capacity_product text;
  v_purchase public.purchase_requests%rowtype;

  v_now timestamptz;

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
  SELECT p.owner_id,p.product_type INTO v_capacity_owner,v_capacity_product
  FROM public.purchase_requests p WHERE p.id=p_purchase_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'PURCHASE_NOT_FOUND'; END IF;
  IF v_capacity_product='package' THEN
    PERFORM twuanis_canonical_private.ensure_publisher_account(v_capacity_owner);
  END IF;

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

  IF v_purchase.owner_id IS DISTINCT FROM v_capacity_owner OR v_purchase.product_type IS DISTINCT FROM v_capacity_product THEN RAISE EXCEPTION 'purchase identity changed' USING ERRCODE='40001'; END IF;
  v_now:=clock_timestamp();

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

end;$function$;

ALTER FUNCTION public.assign_default_market_package() OWNER TO postgres;
ALTER FUNCTION public.approve_sinpe_payment(uuid) OWNER TO postgres;
ALTER FUNCTION public.activate_purchase(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.assign_default_market_package(),public.approve_sinpe_payment(uuid),public.activate_purchase(uuid) FROM PUBLIC,anon,authenticated,service_role;
-- Existing reviewer authentication remains mandatory inside SINPE approval.
GRANT EXECUTE ON FUNCTION public.approve_sinpe_payment(uuid) TO authenticated;
-- Activation is server authority, never customer-selected authority.
GRANT EXECUTE ON FUNCTION public.activate_purchase(uuid) TO service_role;
COMMIT;
