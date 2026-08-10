/**
 * ---------------------------------------------------------
 * Activation Engine
 * ---------------------------------------------------------
 *
 * The Activation Engine transforms an approved canonical
 * purchase into operational Twuanis commercial state.
 *
 * Responsibilities:
 *
 * • Resolve the canonical purchase
 * • Verify approved purchase state
 * • Prevent duplicate activation
 * • Resolve activation route by product type
 * • Route package purchases
 * • Route add-on purchases
 * • Return canonical activation state
 *
 * Explicitly NOT responsible for:
 *
 * • Purchase creation
 * • Commercial provider selection
 * • Provider communication
 * • Purchase approval
 * • Purchase rejection
 * • Purchase cancellation
 * • Purchase expiration
 *
 * Approval decides.
 * Activation executes.
 */

import type {
  SupabaseClient
} from '@supabase/supabase-js'

import {
  resolvePurchase,
  type PurchaseProductType,
  type ResolvedPurchase
} from '@/lib/purchase-engine'


export type CommercialActivationType =
  | 'subscription'
  | 'listing_entitlement'


export type CommercialActivationStatus =
  | 'activated'


export type CommercialActivationResult = {
  purchase:
    ResolvedPurchase

  purchaseId:
    string

  ownerId:
    string

  productType:
    PurchaseProductType

  activationType:
    CommercialActivationType

  activationId:
    string

  status:
    CommercialActivationStatus

  activatedAt:
    string
}


export type ActivatePurchaseInput = {
  supabase:
    SupabaseClient

  purchaseId:
    string

  /*
   * Optional ownership assertion.
   *
   * Customer-facing server routes should provide this.
   *
   * Trusted internal Commercial Platform processes may
   * omit it.
   */
  ownerId?:
    string
}


type ExistingActivation = {
  activationType:
    CommercialActivationType

  activationId:
    string
}

type SubscriptionBillingCycle =
  | 'free'
  | 'monthly'
  | 'annual'


type DatabaseActivationPackage = {
  id:
    string

  billing_interval:
    SubscriptionBillingCycle

  is_active:
    boolean
}


type DatabaseActiveSubscription = {
  id:
    string

  user_id:
    string

  package_id:
    string

  status:
    string

  billing_cycle:
    SubscriptionBillingCycle

  started_at:
    string | null

  current_period_start:
    string | null

  current_period_end:
    string | null

  created_at:
    string
}

type DatabaseActivationAddOn = {
  id:
    string

  target_type:
    'listing' | 'account'

  duration_type:
    'days'
    | 'listing_lifetime'
    | 'permanent'
    | 'single_use'

  duration_days:
    number | null

  is_stackable:
    boolean

  maximum_quantity:
    number | null

  requires_manual_approval:
    boolean

  is_active:
    boolean
}


type DatabaseActivationListing = {
  id:
    string

  owner_id:
    string | null
}


type DatabaseExistingEntitlement = {
  id:
    string

  status:
    string

  starts_at:
    string | null

  expires_at:
    string | null
}

type DatabaseActivationRpcResult = {
  purchase_id:
    string

  owner_id:
    string

  product_type:
    PurchaseProductType

  activation_type:
    CommercialActivationType

  activation_id:
    string

  activated_at:
    string
}

export class ActivationEngineError
  extends Error {

  code:
    | 'PURCHASE_ID_REQUIRED'
    | 'PURCHASE_NOT_APPROVED'
    | 'PURCHASE_ALREADY_ACTIVATED'
    | 'UNSUPPORTED_PRODUCT_TYPE'
    | 'ACTIVATION_LOOKUP_FAILED'
    | 'PACKAGE_ACTIVATION_NOT_IMPLEMENTED'
    | 'ADD_ON_ACTIVATION_NOT_IMPLEMENTED'
    | 'PACKAGE_NOT_FOUND'
    | 'PACKAGE_INACTIVE'
    | 'PACKAGE_LOAD_FAILED'
    | 'SUBSCRIPTION_LOAD_FAILED'
    | 'SUBSCRIPTION_REPLACEMENT_FAILED'
    | 'SUBSCRIPTION_CREATE_FAILED'
    | 'ADD_ON_NOT_FOUND'
    | 'ADD_ON_INACTIVE'
    | 'ADD_ON_LOAD_FAILED'
    | 'ADD_ON_TARGET_UNSUPPORTED'
    | 'INVALID_ADD_ON_QUANTITY'
    | 'LISTING_TARGET_REQUIRED'
    | 'LISTING_LOAD_FAILED'
    | 'LISTING_NOT_FOUND'
    | 'LISTING_OWNER_MISMATCH'
    | 'ENTITLEMENT_LOAD_FAILED'
    | 'ENTITLEMENT_LIMIT_REACHED'
    | 'ENTITLEMENT_REPLACEMENT_FAILED'
    | 'ENTITLEMENT_CREATE_FAILED'
    | 'ACTIVATION_TRANSACTION_FAILED'

  purchaseId:
    string | null

  activationId:
    string | null

  constructor({
    code,
    message,
    purchaseId = null,
    activationId = null
  }: {
    code:
      ActivationEngineError['code']

    message:
      string

    purchaseId?:
      string | null

    activationId?:
      string | null
  }) {

    super(
      message
    )

    this.name =
      'ActivationEngineError'

    this.code =
      code

    this.purchaseId =
      purchaseId

    this.activationId =
      activationId
  }
}


function assertPurchaseApproved(
  purchase:
    ResolvedPurchase
): void {

  if (
    !purchase.purchase.isApproved ||
    purchase.purchase.status !==
      'approved'
  ) {

    throw new ActivationEngineError({

      code:
        'PURCHASE_NOT_APPROVED',

      purchaseId:
        purchase.purchase.id,

      message:
        'Only approved purchases can be activated.'
    })
  }
}


async function findExistingPackageActivation({
  supabase,
  purchaseId
}: {
  supabase:
    SupabaseClient

  purchaseId:
    string
}): Promise<ExistingActivation | null> {

  const {
    data,
    error
  } =
    await supabase
      .from(
        'user_subscriptions'
      )
      .select(`
        id
      `)
      .eq(
        'purchase_request_id',
        purchaseId
      )
      .limit(1)
      .maybeSingle()

  if (error) {

    throw new ActivationEngineError({

      code:
        'ACTIVATION_LOOKUP_FAILED',

      purchaseId,

      message:
        error.message
    })
  }

  if (!data) {
    return null
  }

  return {

    activationType:
      'subscription',

    activationId:
      data.id
  }
}


async function findExistingAddOnActivation({
  supabase,
  purchaseId
}: {
  supabase:
    SupabaseClient

  purchaseId:
    string
}): Promise<ExistingActivation | null> {

  const {
    data,
    error
  } =
    await supabase
      .from(
        'listing_entitlements'
      )
      .select(`
        id
      `)
      .eq(
        'purchase_request_id',
        purchaseId
      )
      .limit(1)
      .maybeSingle()

  if (error) {

    throw new ActivationEngineError({

      code:
        'ACTIVATION_LOOKUP_FAILED',

      purchaseId,

      message:
        error.message
    })
  }

  if (!data) {
    return null
  }

  return {

    activationType:
      'listing_entitlement',

    activationId:
      data.id
  }
}


async function findExistingActivation({
  supabase,
  purchase
}: {
  supabase:
    SupabaseClient

  purchase:
    ResolvedPurchase
}): Promise<ExistingActivation | null> {

  /*
 * Product routing.
 *
 * The Activation Engine determines WHAT operational
 * activator owns the approved purchase.
 *
 * Individual product activators determine HOW that state
 * is created.
 */

switch (
    purchase.purchase.productType
  ) {


      case 'package':

        return activatePackagePurchase({

            supabase,

            purchase
        })


      case 'add_on':

        return activateAddOnPurchase({

          supabase,

          purchase
        })


    default:

      throw new ActivationEngineError({

        code:
          'UNSUPPORTED_PRODUCT_TYPE',

        purchaseId:
          purchase.purchase.id,

        message:
          `Purchase product type "${purchase.purchase.productType}" is not supported by the Activation Engine.`
      })
  }
}


function assertNotAlreadyActivated({
  purchase,
  existingActivation
}: {
  purchase:
    ResolvedPurchase

  existingActivation:
    ExistingActivation | null
}): void {

  if (!existingActivation) {
    return
  }

  throw new ActivationEngineError({

    code:
      'PURCHASE_ALREADY_ACTIVATED',

    purchaseId:
      purchase.purchase.id,

    activationId:
      existingActivation.activationId,

    message:
      `Purchase ${purchase.purchase.id} has already been activated as ${existingActivation.activationType} ${existingActivation.activationId}.`
  })
}

async function activatePurchaseAtomically({
  supabase,
  purchase
}: {
  supabase:
    SupabaseClient

  purchase:
    ResolvedPurchase
}): Promise<CommercialActivationResult> {

  const {
    data,
    error
  } =
    await supabase
      .rpc(
        'activate_purchase',
        {
          p_purchase_id:
            purchase.purchase.id
        }
      )

  if (error) {
    throw new ActivationEngineError({
      code:
        'ACTIVATION_TRANSACTION_FAILED',

      purchaseId:
        purchase.purchase.id,

      message:
        error.message
    })
  }

  const activation =
    Array.isArray(data)
      ? data[0] as
          DatabaseActivationRpcResult | undefined
      : undefined

  if (!activation) {
    throw new ActivationEngineError({
      code:
        'ACTIVATION_TRANSACTION_FAILED',

      purchaseId:
        purchase.purchase.id,

      message:
        'The atomic activation transaction returned no canonical activation state.'
    })
  }

  const result:
    CommercialActivationResult = {

    purchase,

    purchaseId:
      activation.purchase_id,

    ownerId:
      activation.owner_id,

    productType:
      activation.product_type,

    activationType:
      activation.activation_type,

    activationId:
      activation.activation_id,

    status:
      'activated',

    activatedAt:
      activation.activated_at
  }

  /*
  * Activity is secondary to commercial activation.
  *
  * The RPC has already committed authoritative state.
  * Activity failure must never invalidate activation.
  */

  try {

    const {
      error:
        activityError
    } =
      await supabase
        .from(
          'activity_events'
        )
        .insert({
          user_id:
            result.ownerId,

          event_category:
            'account',

          event_type:
            'commercial_activation_completed',

          entity_type:
            result.activationType,

          entity_id:
            result.activationId,

          metadata: {
            purchaseId:
              result.purchaseId,

            productType:
              result.productType,

            activationType:
              result.activationType,

            activatedAt:
              result.activatedAt
          }
        })

    if (activityError) {
      console.error(
        'COMMERCIAL ACTIVATION ACTIVITY ERROR:',
        activityError
      )
    }

  } catch (
    activityError
  ) {

    console.error(
      'COMMERCIAL ACTIVATION ACTIVITY ERROR:',
      activityError
    )
  }

  return result }

/*
 * ---------------------------------------------------------
 * PRODUCT ACTIVATION ROUTES
 * ---------------------------------------------------------
 *
 * Shot 4A establishes the canonical activation router.
 *
 * Actual subscription persistence belongs to Shot 4B.
 *
 * Actual listing-entitlement persistence belongs to
 * Shot 4C.
 *
 * These functions intentionally fail closed until those
 * canonical product activators exist.
 */

function resolveSubscriptionPeriod({
  billingCycle,
  startsAt
}: {
  billingCycle:
    SubscriptionBillingCycle

  startsAt:
    Date
}): {
  periodStart:
    string

  periodEnd:
    string | null
} {

  const periodStart =
    startsAt.toISOString()

  if (
    billingCycle ===
      'free'
  ) {
    return {
      periodStart,
      periodEnd:
        null
    }
  }

  const end =
    new Date(
      startsAt.getTime()
    )

  if (
    billingCycle ===
      'monthly'
  ) {
    end.setUTCMonth(
      end.getUTCMonth() + 1
    )

    return {
      periodStart,

      periodEnd:
        end.toISOString()
    }
  }

  if (
    billingCycle ===
      'annual'
  ) {
    end.setUTCFullYear(
      end.getUTCFullYear() + 1
    )

    return {
      periodStart,

      periodEnd:
        end.toISOString()
    }
  }

  throw new ActivationEngineError({
    code:
      'UNSUPPORTED_PRODUCT_TYPE',

    message:
      `Unsupported subscription billing cycle "${billingCycle}".`
  })
}

async function activatePackagePurchase({
  supabase,
  purchase
}: {
  supabase:
    SupabaseClient

  purchase:
    ResolvedPurchase
}): Promise<CommercialActivationResult> {

  const {
    packageId,
    ownerId
  } =
    purchase.purchase


  /*
   * A package purchase must identify the canonical package
   * that was approved.
   */

  if (!packageId) {
    throw new ActivationEngineError({

      code:
        'PACKAGE_NOT_FOUND',

      purchaseId:
        purchase.purchase.id,

      message:
        'The approved package purchase does not identify a package.'
    })
  }

  /*
   * Resolve the package again at activation time.
   *
   * We trust the purchase for its commercial snapshot,
   * but operational activation still requires the package
   * itself to exist.
   */

  const {
    data: packageData,
    error: packageError
  } =
    await supabase
      .from(
        'packages'
      )
      .select(`
        id,
        billing_interval,
        is_active
      `)
      .eq(
        'id',
        packageId
      )
      .maybeSingle()


  if (packageError) {
    throw new ActivationEngineError({

      code:
        'PACKAGE_LOAD_FAILED',

      purchaseId:
        purchase.purchase.id,

      message:
        packageError.message
    })
  }


  if (!packageData) {
    throw new ActivationEngineError({

      code:
        'PACKAGE_NOT_FOUND',

      purchaseId:
        purchase.purchase.id,

      message:
        'The package referenced by the approved purchase no longer exists.'
    })
  }


  const packageRecord =
    packageData as
      DatabaseActivationPackage


  if (
    !packageRecord.is_active
  ) {
    throw new ActivationEngineError({

      code:
        'PACKAGE_INACTIVE',

      purchaseId:
        purchase.purchase.id,

      message:
        'The package referenced by the approved purchase is no longer active.'
    })
  }


  /*
   * Resolve the user's current active subscription.
   *
   * This is the state that will be replaced.
   */

  const {
    data: currentSubscriptionData,
    error: currentSubscriptionError
  } =
    await supabase
      .from(
        'user_subscriptions'
      )
      .select(`
        id,
        user_id,
        package_id,
        status,
        billing_cycle,
        started_at,
        current_period_start,
        current_period_end,
        created_at
      `)
      .eq(
        'user_id',
        ownerId
      )
      .eq(
        'status',
        'active'
      )
      .order(
        'created_at',
        {
          ascending:
            false
        }
      )
      .limit(1)
      .maybeSingle()


  if (currentSubscriptionError) {
    throw new ActivationEngineError({

      code:
        'SUBSCRIPTION_LOAD_FAILED',

      purchaseId:
        purchase.purchase.id,

      message:
        currentSubscriptionError.message
    })
  }


  const currentSubscription =
    currentSubscriptionData
      ? currentSubscriptionData as
          DatabaseActiveSubscription
      : null


  const now =
    new Date()

  const activatedAt =
    now.toISOString()


  const {
    periodStart,
    periodEnd
  } =
    resolveSubscriptionPeriod({

      billingCycle:
        packageRecord
          .billing_interval,

      startsAt:
        now
    })


  /*
   * Preserve subscription history.
   *
   * We do NOT delete or overwrite the old subscription.
   *
   * It becomes historical state.
   */

  if (currentSubscription) {

    const {
      error:
        expirationError
    } =
      await supabase
        .from(
          'user_subscriptions'
        )
        .update({

          status:
            'expired',

          expired_at:
            activatedAt
        })
        .eq(
          'id',
          currentSubscription.id
        )
        .eq(
          'status',
          'active'
        )


    if (expirationError) {
      throw new ActivationEngineError({

        code:
          'SUBSCRIPTION_REPLACEMENT_FAILED',

        purchaseId:
          purchase.purchase.id,

        activationId:
          currentSubscription.id,

        message:
          expirationError.message
      })
    }
  }


  /*
   * Create the new authoritative subscription.
   *
   * Notice what does NOT exist here:
   *
   * pending_payment
   *
   * The purchase has already been commercially approved.
   * Activation creates operational ACTIVE state.
   */

  const {
    data: subscriptionData,
    error: subscriptionError
  } =
    await supabase
      .from(
        'user_subscriptions'
      )
      .insert({

        user_id:
          ownerId,

        package_id:
          packageRecord.id,

        status:
          'active',

        billing_cycle:
          packageRecord
            .billing_interval,

        started_at:
          activatedAt,

        current_period_start:
          periodStart,

        current_period_end:
          periodEnd,

        cancelled_at:
          null,

        expired_at:
          null,

        purchase_request_id:
          purchase.purchase.id
      })
      .select(`
        id
      `)
      .single()


  if (
    subscriptionError ||
    !subscriptionData
  ) {
    throw new ActivationEngineError({

      code:
        'SUBSCRIPTION_CREATE_FAILED',

      purchaseId:
        purchase.purchase.id,

      message:
        subscriptionError?.message ??
        'The approved package purchase could not be activated.'
    })
  }


  /*
   * Return canonical operational state.
   */

  return {

    purchase,

    purchaseId:
      purchase.purchase.id,

    ownerId:
      purchase.purchase.ownerId,

    productType:
      purchase.purchase.productType,

    activationType:
      'subscription',

    activationId:
      subscriptionData.id,

    status:
      'activated',

    activatedAt
  }
}

function resolveEntitlementDates({
  durationType,
  durationDays,
  startsAt
}: {
  durationType:
    DatabaseActivationAddOn['duration_type']

  durationDays:
    number | null

  startsAt:
    Date
}): {
  startsAt:
    string

  expiresAt:
    string | null
} {

  const start =
    startsAt.toISOString()

  if (
    durationType ===
      'listing_lifetime' ||
    durationType ===
      'permanent'
  ) {
    return {
      startsAt:
        start,

      expiresAt:
        null
    }
  }

  if (
    durationType ===
      'days'
  ) {

    if (
      !durationDays ||
      durationDays <= 0
    ) {
      throw new ActivationEngineError({
        code:
          'ENTITLEMENT_CREATE_FAILED',

        message:
          'A day-based add-on must define a positive duration.'
      })
    }

    const expiration =
      new Date(
        startsAt.getTime()
      )

    expiration.setUTCDate(
      expiration.getUTCDate() +
      durationDays
    )

    return {
      startsAt:
        start,

      expiresAt:
        expiration.toISOString()
    }
  }

  /*
   * single_use currently has no separate consumption
   * infrastructure. Fail closed instead of inventing
   * lifecycle semantics.
   */

  throw new ActivationEngineError({
    code:
      'ADD_ON_TARGET_UNSUPPORTED',

    message:
      `Add-on duration type "${durationType}" does not yet have an activation strategy.`
  })
}

async function activateAddOnPurchase({
  supabase,
  purchase
}: {
  supabase:
    SupabaseClient

  purchase:
    ResolvedPurchase
}): Promise<CommercialActivationResult> {

  const {
    addOnProductId,
    listingId,
    ownerId,
    quantity
  } =
    purchase.purchase


  if (!addOnProductId) {
    throw new ActivationEngineError({
      code:
        'ADD_ON_NOT_FOUND',

      purchaseId:
        purchase.purchase.id,

      message:
        'The approved add-on purchase does not identify an add-on product.'
    })
  }


  /*
   * listing_entitlements currently represents one
   * entitlement per purchase/product/listing.
   *
   * Do not silently pretend quantity > 1 is supported.
   */

  if (
    quantity !== 1
  ) {
    throw new ActivationEngineError({
      code:
        'INVALID_ADD_ON_QUANTITY',

      purchaseId:
        purchase.purchase.id,

      message:
        'Listing add-on activation currently requires purchase quantity 1.'
    })
  }


  const {
    data: productData,
    error: productError
  } =
    await supabase
      .from(
        'add_on_products'
      )
      .select(`
        id,
        target_type,
        duration_type,
        duration_days,
        is_stackable,
        maximum_quantity,
        requires_manual_approval,
        is_active
      `)
      .eq(
        'id',
        addOnProductId
      )
      .maybeSingle()


  if (productError) {
    throw new ActivationEngineError({
      code:
        'ADD_ON_LOAD_FAILED',

      purchaseId:
        purchase.purchase.id,

      message:
        productError.message
    })
  }


  if (!productData) {
    throw new ActivationEngineError({
      code:
        'ADD_ON_NOT_FOUND',

      purchaseId:
        purchase.purchase.id,

      message:
        'The add-on product referenced by the purchase does not exist.'
    })
  }


  const product =
    productData as
      DatabaseActivationAddOn


  if (!product.is_active) {
    throw new ActivationEngineError({
      code:
        'ADD_ON_INACTIVE',

      purchaseId:
        purchase.purchase.id,

      message:
        'The purchased add-on is no longer active.'
    })
  }


  /*
   * Shot 4C owns listing entitlements.
   *
   * Account-targeted capabilities will receive their own
   * activator later.
   */

  if (
    product.target_type !==
      'listing'
  ) {
    throw new ActivationEngineError({
      code:
        'ADD_ON_TARGET_UNSUPPORTED',

      purchaseId:
        purchase.purchase.id,

      message:
        `Add-on target type "${product.target_type}" is not supported by the listing entitlement activator.`
    })
  }


  if (!listingId) {
    throw new ActivationEngineError({
      code:
        'LISTING_TARGET_REQUIRED',

      purchaseId:
        purchase.purchase.id,

      message:
        'A listing-targeted add-on purchase must identify a listing.'
    })
  }


  /*
   * Verify canonical listing ownership before attempting
   * entitlement creation.
   *
   * The database trigger verifies this again.
   */

  const {
    data: listingData,
    error: listingError
  } =
    await supabase
      .from(
        'listings'
      )
      .select(`
        id,
        owner_id
      `)
      .eq(
        'id',
        listingId
      )
      .maybeSingle()


  if (listingError) {
    throw new ActivationEngineError({
      code:
        'LISTING_LOAD_FAILED',

      purchaseId:
        purchase.purchase.id,

      message:
        listingError.message
    })
  }


  if (!listingData) {
    throw new ActivationEngineError({
      code:
        'LISTING_NOT_FOUND',

      purchaseId:
        purchase.purchase.id,

      message:
        'The listing targeted by this purchase does not exist.'
    })
  }


  const listing =
    listingData as
      DatabaseActivationListing


  if (
    !listing.owner_id ||
    listing.owner_id !==
      ownerId
  ) {
    throw new ActivationEngineError({
      code:
        'LISTING_OWNER_MISMATCH',

      purchaseId:
        purchase.purchase.id,

      message:
        'The purchase owner does not own the targeted listing.'
    })
  }


  /*
   * Resolve currently operational entitlements for the same
   * listing/product.
   */

  const {
    data: existingData,
    error: existingError
  } =
    await supabase
      .from(
        'listing_entitlements'
      )
      .select(`
        id,
        status,
        starts_at,
        expires_at
      `)
      .eq(
        'listing_id',
        listingId
      )
      .eq(
        'product_id',
        product.id
      )
      .in(
        'status',
        [
          'active',
          'scheduled'
        ]
      )


  if (existingError) {
    throw new ActivationEngineError({
      code:
        'ENTITLEMENT_LOAD_FAILED',

      purchaseId:
        purchase.purchase.id,

      message:
        existingError.message
    })
  }


  const existingEntitlements =
    (
      existingData ?? []
    ) as DatabaseExistingEntitlement[]


  /*
   * STACKABLE PRODUCTS
   *
   * maximum_quantity is enforced by the Activation Engine.
   */

  if (
    product.is_stackable &&
    product.maximum_quantity !==
      null &&
    existingEntitlements.length >=
      product.maximum_quantity
  ) {
    throw new ActivationEngineError({
      code:
        'ENTITLEMENT_LIMIT_REACHED',

      purchaseId:
        purchase.purchase.id,

      message:
        'The maximum active or scheduled quantity for this add-on has been reached.'
    })
  }


  const now =
    new Date()

  const activatedAt =
    now.toISOString()


  /*
   * NON-STACKABLE PRODUCTS
   *
   * A newly purchased entitlement replaces existing
   * operational entitlement state.
   *
   * History is preserved by expiring the old rows.
   */

  if (
    !product.is_stackable &&
    existingEntitlements.length > 0
  ) {

    const existingIds =
      existingEntitlements.map(
        entitlement =>
          entitlement.id
      )


    const {
      error:
        replacementError
    } =
      await supabase
        .from(
          'listing_entitlements'
        )
        .update({
          status:
            'expired',

          expires_at:
            activatedAt
        })
        .in(
          'id',
          existingIds
        )


    if (replacementError) {
      throw new ActivationEngineError({
        code:
          'ENTITLEMENT_REPLACEMENT_FAILED',

        purchaseId:
          purchase.purchase.id,

        message:
          replacementError.message
      })
    }
  }


  const entitlementDates =
    resolveEntitlementDates({
      durationType:
        product.duration_type,

      durationDays:
        product.duration_days,

      startsAt:
        now
    })


  /*
   * Commercial approval and capability approval are
   * intentionally separate concepts.
   *
   * Products requiring manual capability approval become
   * pending entitlements.
   *
   * Everything else becomes immediately active.
   */

  const entitlementStatus =
    product.requires_manual_approval
      ? 'pending'
      : 'active'


  const {
    data: entitlementData,
    error: entitlementError
  } =
    await supabase
      .from(
        'listing_entitlements'
      )
      .insert({
        listing_id:
          listingId,

        product_id:
          product.id,

        owner_id:
          ownerId,

        status:
          entitlementStatus,

        source_type:
          'purchase',

        starts_at:
          product.requires_manual_approval
            ? null
            : entitlementDates.startsAt,

        expires_at:
          product.requires_manual_approval
            ? null
            : entitlementDates.expiresAt,

        purchase_request_id:
          purchase.purchase.id,

        assigned_by:
          null
      })
      .select(`
        id,
        status,
        starts_at,
        expires_at
      `)
      .single()


  if (
    entitlementError ||
    !entitlementData
  ) {
    throw new ActivationEngineError({
      code:
        'ENTITLEMENT_CREATE_FAILED',

      purchaseId:
        purchase.purchase.id,

      message:
        entitlementError?.message ??
        'The approved add-on purchase could not be activated.'
    })
  }


  return {
    purchase,

    purchaseId:
      purchase.purchase.id,

    ownerId:
      purchase.purchase.ownerId,

    productType:
      purchase.purchase.productType,

    activationType:
      'listing_entitlement',

    activationId:
      entitlementData.id,

    status:
      'activated',

    activatedAt
  }
}


/*
 * ---------------------------------------------------------
 * CANONICAL ACTIVATION ENTRY POINT
 * ---------------------------------------------------------
 */


export async function activatePurchase({
  supabase,
  purchaseId,
  ownerId
}: ActivatePurchaseInput):
  Promise<CommercialActivationResult> {

  if (!purchaseId) {

    throw new ActivationEngineError({

      code:
        'PURCHASE_ID_REQUIRED',

      message:
        'A purchase ID is required to activate a purchase.'
    })
  }


  /*
   * Resolve canonical commercial intent.
   *
   * Ownership validation is delegated to the Purchase Engine,
   * which already owns canonical purchase ownership.
   */

  const purchase =
    await resolvePurchase({

      supabase,

      purchaseId,

      ownerId
    })


  /*
   * Activation trusts the Purchase Decision Engine.
   *
   * It does not inspect payment providers or re-decide the
   * commercial transaction.
   */

  assertPurchaseApproved(
    purchase
  )


  /*
   * Duplicate activation is forbidden.
   *
   * The canonical purchase_request_id relationship lets us
   * identify whether this approved purchase has already
   * produced operational state.
   */

  const existingActivation =
    await findExistingActivation({

      supabase,

      purchase
    })


  assertNotAlreadyActivated({

    purchase,

    existingActivation
  })

return activatePurchaseAtomically({
  supabase,
  purchase
})

}