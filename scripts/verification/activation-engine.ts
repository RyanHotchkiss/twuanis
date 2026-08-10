import {
  loadEnvConfig
} from '@next/env'

import {
  createClient,
  type SupabaseClient
} from '@supabase/supabase-js'

import {
  createPurchaseRequest
} from '../../lib/purchase-engine'

import {
  approvePurchase
} from '../../lib/approval-engine'


loadEnvConfig(
  process.cwd()
)


const TEST_SUITE =
  'activation-verification'

const TEST_RUN_ID =
  crypto.randomUUID()


type ActivationRpcRow = {
  purchase_id:
    string

  owner_id:
    string

  product_type:
    'package' | 'add_on'

  activation_type:
    'subscription' | 'listing_entitlement'

  activation_id:
    string

  activated_at:
    string
}


type TestArtifacts = {
  purchaseIds:
    string[]

  subscriptionIds:
    string[]

  entitlementIds:
    string[]

  originalSubscription:
    OriginalSubscriptionSnapshot | null
}

type OriginalSubscriptionSnapshot = {
  id:
    string

  status:
    string

  expiredAt:
    string | null
}

const artifacts:
  TestArtifacts = {

  purchaseIds: [],

  subscriptionIds: [],

  entitlementIds: [],

  originalSubscription:
    null
}


function requireEnvironmentVariable(
  name:
    string
): string {

  const value =
    process.env[
      name
    ]

  if (
    !value ||
    !value.trim()
  ) {
    throw new Error(
      `Missing required environment variable: ${name}`
    )
  }

  return value.trim()
}


function createAdminClient():
  SupabaseClient {

  const url =
    requireEnvironmentVariable(
      'NEXT_PUBLIC_SUPABASE_URL'
    )

  const serviceRoleKey =
    requireEnvironmentVariable(
      'SUPABASE_SERVICE_ROLE_KEY'
    )

  return createClient(
    url,
    serviceRoleKey,
    {
      auth: {
        persistSession:
          false,

        autoRefreshToken:
          false
      }
    }
  )
}


function requireTestIdentity() {

  return {
    userId:
      requireEnvironmentVariable(
        'ACTIVATION_VERIFY_USER_ID'
      ),

    listingId:
      requireEnvironmentVariable(
        'ACTIVATION_VERIFY_LISTING_ID'
      )
  }
}


function testMetadata(
  extra:
    Record<
      string,
      unknown
    > = {}
) {

  return {
    testRecord:
      true,

    testSuite:
      TEST_SUITE,

    testRunId:
      TEST_RUN_ID,

    ...extra
  }
}


async function assertTestListingOwnership({
  supabase,
  userId,
  listingId
}: {
  supabase:
    SupabaseClient

  userId:
    string

  listingId:
    string
}) {

  const {
    data,
    error
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

  if (error) {
    throw new Error(
      `Could not verify test listing: ${error.message}`
    )
  }

  if (!data) {
    throw new Error(
      `Test listing ${listingId} does not exist.`
    )
  }

  if (
    data.owner_id !==
      userId
  ) {
    throw new Error(
      'ACTIVATION_VERIFY_LISTING_ID is not owned by ACTIVATION_VERIFY_USER_ID.'
    )
  }
}


async function captureOriginalSubscription({
  supabase,
  userId
}: {
  supabase:
    SupabaseClient

  userId:
    string
}): Promise<
  OriginalSubscriptionSnapshot
> {

  const {
    data,
    error
  } =
    await supabase
      .from(
        'user_subscriptions'
      )
      .select(`
        id,
        status,
        expired_at
      `)
      .eq(
        'user_id',
        userId
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

  if (error) {
    throw new Error(
      `Could not inspect original subscription: ${error.message}`
    )
  }

  if (!data) {
    throw new Error(
      `Test user ${userId} does not have the automatically provisioned active subscription expected by this verification harness.`
    )
  }

  const snapshot:
    OriginalSubscriptionSnapshot = {

    id:
      data.id,

    status:
      data.status,

    expiredAt:
      data.expired_at
  }

  artifacts.originalSubscription =
    snapshot

  return snapshot
}

async function resolveTestPackage({
  supabase
}: {
  supabase:
    SupabaseClient
}) {

  const explicitPackageId =
    process.env
      .ACTIVATION_VERIFY_PACKAGE_ID
      ?.trim()

  let query =
    supabase
      .from(
        'packages'
      )
      .select(`
        id,
        slug,
        billing_interval,
        is_active
      `)
      .eq(
        'is_active',
        true
      )

  if (
    explicitPackageId
  ) {
    query =
      query.eq(
        'id',
        explicitPackageId
      )
  }

  const {
    data,
    error
  } =
    await query
      .order(
        'display_order',
        {
          ascending:
            true
        }
      )
      .limit(1)
      .maybeSingle()

  if (error) {
    throw new Error(
      `Could not resolve verification package: ${error.message}`
    )
  }

  if (!data) {
    throw new Error(
      'No active package is available for activation verification.'
    )
  }

  return data
}


async function resolveTestAddOn({
  supabase,
  listingId
}: {
  supabase:
    SupabaseClient

  listingId:
    string
}) {

  const explicitAddOnId =
    process.env
      .ACTIVATION_VERIFY_ADD_ON_ID
      ?.trim()

  let query =
    supabase
      .from(
        'add_on_products'
      )
      .select(`
        id,
        slug,
        target_type,
        duration_type,
        is_stackable,
        maximum_quantity,
        requires_manual_approval,
        is_active
      `)
      .eq(
        'is_active',
        true
      )
      .eq(
        'target_type',
        'listing'
      )
      .in(
        'duration_type',
        [
          'days',
          'listing_lifetime',
          'permanent'
        ]
      )

  if (
    explicitAddOnId
  ) {
    query =
      query.eq(
        'id',
        explicitAddOnId
      )
  }

  const {
    data,
    error
  } =
    await query
      .order(
        'display_order',
        {
          ascending:
            true
        }
      )

  if (error) {
    throw new Error(
      `Could not resolve verification add-on: ${error.message}`
    )
  }

  for (
    const candidate
    of data ?? []
  ) {

    const {
      data:
        existingEntitlements,

      error:
        entitlementError
    } =
      await supabase
        .from(
          'listing_entitlements'
        )
        .select(`
          id
        `)
        .eq(
          'listing_id',
          listingId
        )
        .eq(
          'product_id',
          candidate.id
        )
        .in(
          'status',
          [
            'active',
            'scheduled'
          ]
        )

    if (
      entitlementError
    ) {
      throw new Error(
        `Could not inspect existing entitlements: ${entitlementError.message}`
      )
    }

    if (
      (
        existingEntitlements ??
        []
      ).length ===
        0
    ) {
      return candidate
    }
  }

  throw new Error(
    [
      'No safe listing-targeted add-on was found for verification.',
      'Every eligible add-on already has an active or scheduled entitlement on the test listing.'
    ].join(
      ' '
    )
  )
}


async function addSyntheticProviderEvidence({
  supabase,
  purchaseId,
  actorId
}: {
  supabase:
    SupabaseClient

  purchaseId:
    string

  actorId:
    string
}) {

  const {
    error
  } =
    await supabase
      .from(
        'purchase_request_events'
      )
      .insert({
        purchase_request_id:
          purchaseId,

        event_type:
          'provider_test_activation_verified',

        previous_status:
          'pending',

        resulting_status:
          'pending',

        actor_id:
          actorId,

        metadata:
          testMetadata({
            provider:
              'verification-harness',

            evidenceType:
              'synthetic-provider-evidence'
          })
      })

  if (error) {
    throw new Error(
      `Could not create synthetic provider evidence: ${error.message}`
    )
  }
}


async function approveVerificationPurchase({
  supabase,
  purchaseId,
  reviewerId
}: {
  supabase:
    SupabaseClient

  purchaseId:
    string

  reviewerId:
    string
}) {

  await addSyntheticProviderEvidence({
    supabase,
    purchaseId,
    actorId:
      reviewerId
  })

  const approved =
    await approvePurchase({
      supabase,

      purchaseId,

      reviewerId,

      notes:
        'Synthetic approval created by the Activation Engine verification harness.',

      metadata:
        testMetadata({
          decision:
            'test-activation-approved'
        })
    })

  if (
    approved.purchase.status !==
      'approved'
  ) {
    throw new Error(
      `Purchase ${purchaseId} did not resolve to approved state.`
    )
  }

  return approved
}


async function activateThroughRpc({
  supabase,
  purchaseId
}: {
  supabase:
    SupabaseClient

  purchaseId:
    string
}): Promise<
  ActivationRpcRow
> {

  const {
    data,
    error
  } =
    await supabase
      .rpc(
        'activate_purchase',
        {
          p_purchase_id:
            purchaseId
        }
      )

  if (error) {
    throw new Error(
      `Atomic activation failed: ${error.message}`
    )
  }

  const row =
    Array.isArray(data)
      ? data[0] as
          ActivationRpcRow | undefined
      : undefined

  if (!row) {
    throw new Error(
      'Atomic activation returned no canonical activation row.'
    )
  }

  return row
}

async function verifyDuplicateActivationRejected({
  supabase,
  purchaseId
}: {
  supabase:
    SupabaseClient

  purchaseId:
    string
}) {

  const {
    error
  } =
    await supabase
      .rpc(
        'activate_purchase',
        {
          p_purchase_id:
            purchaseId
        }
      )

  if (!error) {
    throw new Error(
      `Duplicate activation unexpectedly succeeded for purchase ${purchaseId}.`
    )
  }

  if (
    !error.message.includes(
      'PURCHASE_ALREADY_ACTIVATED'
    )
  ) {
    throw new Error(
      [
        'Duplicate activation failed, but not for the expected reason.',
        error.message
      ].join(
        ' '
      )
    )
  }
}


async function verifyPackageActivation({
  supabase,
  userId
}: {
  supabase:
    SupabaseClient

  userId:
    string
}) {

  console.log(
    '\nPACKAGE ACTIVATION VERIFICATION'
  )

  const originalSubscription =
    await captureOriginalSubscription({
        supabase,
        userId
    })

    console.log(
    'Original subscription:',
    originalSubscription.id
    )

  const packageRecord =
    await resolveTestPackage({
      supabase
    })

  console.log(
    'Package:',
    packageRecord.slug,
    packageRecord.id
  )

  const purchase =
    await createPurchaseRequest({
      supabase,

      ownerId:
        userId,

      productType:
        'package',

      packageId:
        packageRecord.id,

      targetType:
        'account',

      quantity:
        1,

      currency:
        'CRC',

      metadata:
        testMetadata({
          activationTest:
            'package'
        })
    })

  artifacts.purchaseIds.push(
    purchase.purchase.id
  )

  await approveVerificationPurchase({
    supabase,

    purchaseId:
      purchase.purchase.id,

    reviewerId:
      userId
  })

  const activation =
    await activateThroughRpc({
      supabase,

      purchaseId:
        purchase.purchase.id
    })

  if (
    activation.activation_type !==
      'subscription'
  ) {
    throw new Error(
      `Expected subscription activation, received ${activation.activation_type}.`
    )
  }

  artifacts.subscriptionIds.push(
    activation.activation_id
  )

  const {
    data:
      subscription,

    error:
      subscriptionError
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
        purchase_request_id
      `)
      .eq(
        'id',
        activation.activation_id
      )
      .maybeSingle()

  if (
    subscriptionError
  ) {
    throw new Error(
      subscriptionError.message
    )
  }

  if (
    !subscription ||
    subscription.user_id !==
      userId ||
    subscription.package_id !==
      packageRecord.id ||
    subscription.status !==
      'active' ||
    subscription.purchase_request_id !==
      purchase.purchase.id
  ) {
    throw new Error(
      'Package activation did not create the expected canonical subscription state.'
    )
  }

  const {
    data:
        replacedSubscription,

    error:
        replacedSubscriptionError
    } =
    await supabase
        .from(
        'user_subscriptions'
        )
        .select(`
        id,
        status,
        expired_at
        `)
        .eq(
        'id',
        originalSubscription.id
        )
        .maybeSingle()

    if (
    replacedSubscriptionError
    ) {
    throw new Error(
        replacedSubscriptionError.message
    )
    }

    if (
    !replacedSubscription ||
    replacedSubscription.status !==
        'expired' ||
    !replacedSubscription.expired_at
    ) {
    throw new Error(
        'Package activation did not expire the previously active subscription.'
    )
    }

  await verifyDuplicateActivationRejected({
    supabase,

    purchaseId:
      purchase.purchase.id
  })

  console.log(
    '✓ Package purchase created'
  )

  console.log(
    '✓ Package purchase approved'
  )

  console.log(
    '✓ Subscription activated atomically'
  )

  console.log(
    '✓ purchase_request_id linked'
  )

  console.log(
    '✓ Duplicate activation rejected'
  )
}


async function verifyAddOnActivation({
  supabase,
  userId,
  listingId
}: {
  supabase:
    SupabaseClient

  userId:
    string

  listingId:
    string
}) {

  console.log(
    '\nADD-ON ACTIVATION VERIFICATION'
  )

  const addOn =
    await resolveTestAddOn({
      supabase,
      listingId
    })

  console.log(
    'Add-on:',
    addOn.slug,
    addOn.id
  )

  const purchase =
    await createPurchaseRequest({
      supabase,

      ownerId:
        userId,

      productType:
        'add_on',

      addOnProductId:
        addOn.id,

      targetType:
        'listing',

      listingId,

      quantity:
        1,

      currency:
        'CRC',

      metadata:
        testMetadata({
          activationTest:
            'listing-entitlement'
        })
    })

  artifacts.purchaseIds.push(
    purchase.purchase.id
  )

  await approveVerificationPurchase({
    supabase,

    purchaseId:
      purchase.purchase.id,

    reviewerId:
      userId
  })

  const activation =
    await activateThroughRpc({
      supabase,

      purchaseId:
        purchase.purchase.id
    })

  if (
    activation.activation_type !==
      'listing_entitlement'
  ) {
    throw new Error(
      `Expected listing entitlement activation, received ${activation.activation_type}.`
    )
  }

  artifacts.entitlementIds.push(
    activation.activation_id
  )

  const {
    data:
      entitlement,

    error:
      entitlementError
  } =
    await supabase
      .from(
        'listing_entitlements'
      )
      .select(`
        id,
        listing_id,
        product_id,
        owner_id,
        status,
        source_type,
        purchase_request_id
      `)
      .eq(
        'id',
        activation.activation_id
      )
      .maybeSingle()

  if (
    entitlementError
  ) {
    throw new Error(
      entitlementError.message
    )
  }

  if (
    !entitlement ||
    entitlement.listing_id !==
      listingId ||
    entitlement.product_id !==
      addOn.id ||
    entitlement.owner_id !==
      userId ||
    entitlement.source_type !==
      'purchase' ||
    entitlement.purchase_request_id !==
      purchase.purchase.id
  ) {
    throw new Error(
      'Add-on activation did not create the expected canonical listing entitlement state.'
    )
  }

  await verifyDuplicateActivationRejected({
    supabase,

    purchaseId:
      purchase.purchase.id
  })

  console.log(
    '✓ Add-on purchase created'
  )

  console.log(
    '✓ Add-on purchase approved'
  )

  console.log(
    '✓ Listing entitlement activated atomically'
  )

  console.log(
    '✓ purchase_request_id linked'
  )

  console.log(
    '✓ Duplicate activation rejected'
  )
}


async function cleanupVerificationArtifacts({
  supabase
}: {
  supabase:
    SupabaseClient
}) {

  console.log(
    '\nCLEANUP'
  )

  if (
    artifacts.subscriptionIds.length >
      0
  ) {
    const {
      error
    } =
      await supabase
        .from(
          'user_subscriptions'
        )
        .delete()
        .in(
          'id',
          artifacts.subscriptionIds
        )

    if (error) {
      console.error(
        'Subscription cleanup failed:',
        error.message
      )
    }
  }

  if (
    artifacts.entitlementIds.length >
      0
  ) {
    const {
      error
    } =
      await supabase
        .from(
          'listing_entitlements'
        )
        .delete()
        .in(
          'id',
          artifacts.entitlementIds
        )

    if (error) {
      console.error(
        'Entitlement cleanup failed:',
        error.message
      )
    }
  }

    if (
        artifacts.purchaseIds.length >
        0
    ) {

        const {
        error:
            eventDeleteError
        } =
        await supabase
            .from(
            'purchase_request_events'
            )
            .delete()
            .in(
            'purchase_request_id',
            artifacts.purchaseIds
            )

        if (
        eventDeleteError
        ) {
        console.error(
            'Purchase event cleanup failed:',
            eventDeleteError.message
        )
        }

        const {
        error:
            purchaseDeleteError
        } =
        await supabase
            .from(
            'purchase_requests'
            )
            .delete()
            .in(
            'id',
            artifacts.purchaseIds
            )

        if (
        purchaseDeleteError
        ) {
        console.error(
            'Purchase cleanup failed:',
            purchaseDeleteError.message
        )
        }
    }

    if (
        artifacts.originalSubscription
    ) {

        const original =
        artifacts.originalSubscription

        const {
        error
        } =
        await supabase
            .from(
            'user_subscriptions'
            )
            .update({
            status:
                original.status,

            expired_at:
                original.expiredAt
            })
            .eq(
            'id',
            original.id
            )

        if (error) {
        console.error(
            'Original subscription restoration failed:',
            error.message
        )
        } else {
        console.log(
            'Original subscription restored:',
            original.id
        )
        }
    }

    console.log(
        'Cleanup attempted.'
    )
    }

async function verifyActivationEngine() {

  console.log(
    '========================================'
  )

  console.log(
    'ACTIVATION ENGINE VERIFICATION'
  )

  console.log(
    '========================================'
  )

  console.log(
    'Test suite:',
    TEST_SUITE
  )

  console.log(
    'Test run:',
    TEST_RUN_ID
  )

  const supabase =
    createAdminClient()

  const {
    userId,
    listingId
  } =
    requireTestIdentity()

  console.log(
    'Test user:',
    userId
  )

  console.log(
    'Test listing:',
    listingId
  )

  try {

    await assertTestListingOwnership({
      supabase,
      userId,
      listingId
    })

    await verifyPackageActivation({
      supabase,
      userId
    })

    await verifyAddOnActivation({
      supabase,
      userId,
      listingId
    })

    console.log(
      '\n========================================'
    )

    console.log(
      'ACTIVATION VERIFICATION PASSED'
    )

    console.log(
      '========================================'
    )

    console.log(
      '✓ Purchase creation'
    )

    console.log(
      '✓ Provider evidence'
    )

    console.log(
      '✓ Purchase approval'
    )

    console.log(
      '✓ Atomic package activation'
    )

    console.log(
      '✓ Atomic entitlement activation'
    )

    console.log(
      '✓ Canonical activation state'
    )

    console.log(
      '✓ Duplicate activation protection'
    )

  } finally {

    await cleanupVerificationArtifacts({
      supabase
    })
  }
}


verifyActivationEngine()
  .catch(error => {

    console.error(
      '\nACTIVATION ENGINE VERIFICATION FAILED'
    )

    console.error(
      error
    )

    process.exitCode =
      1
  })