-- Step12 local forward repair only. Separate production authorization required.
-- Preserve legacy records/review; gate new customer intake through existing control.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
DO $repair$
DECLARE definition text;
BEGIN
 IF current_user<>'postgres' THEN RAISE EXCEPTION 'reviewed administrative installation required';END IF;
 SELECT pg_get_functiondef('public.create_subscription_upgrade_request(uuid,text,text,text,text,timestamptz)'::regprocedure) INTO definition;
 IF md5(definition)='bf24e546698aaced6d728565237583b0' THEN
  EXECUTE $definition$CREATE OR REPLACE FUNCTION public.create_subscription_upgrade_request(p_package_id uuid, p_currency text, p_sinpe_reference text, p_sender_name text, p_sender_phone text DEFAULT NULL::text, p_payment_date timestamp with time zone DEFAULT now())
 RETURNS TABLE(subscription_id uuid, payment_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
 v_user_id uuid;
 v_package public.packages%rowtype;
 v_subscription_id uuid;
 v_payment_id uuid;
 v_amount numeric;
 v_billing_cycle text;
begin
 if NOT public.customer_commerce_ready() then
  raise exception 'customer commerce unavailable';
 end if;
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
$function$
$definition$;
 ELSIF md5(definition)<>'c86809efcf3d175ff06f7c90264d36b7' THEN
  RAISE EXCEPTION 'legacy intake function differs from reviewed anchor';
 END IF;
 IF EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sinpe_payments' AND policyname='legacy_sinpe_customer_intake_gate') THEN
  IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sinpe_payments' AND policyname='legacy_sinpe_customer_intake_gate'
   AND permissive='RESTRICTIVE' AND cmd='INSERT' AND roles=ARRAY['authenticated']::name[] AND qual IS NULL AND with_check='customer_commerce_ready()') THEN
   RAISE EXCEPTION 'existing legacy intake policy differs from review';
  END IF;
 ELSE
  CREATE POLICY legacy_sinpe_customer_intake_gate ON public.sinpe_payments AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(public.customer_commerce_ready());
 END IF;
END$repair$;
COMMIT;
