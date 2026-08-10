import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

import {
  createClient
} from '@supabase/supabase-js'

import {
  createPurchaseRequest,
  resolvePurchase
} from '@/lib/purchase-engine'

import {
  submitPurchaseToProvider
} from '@/lib/commercial-submission'

import {
  createSinpeProvider
} from '@/lib/providers/sinpe-provider'

import {
  createBankTransferProvider
} from '@/lib/providers/bank-transfer-provider'

import type {
  CommercialProvider
} from '@/lib/commercial-provider'


const TEST_USER_ID =
  'd81064bc-1b4a-478f-8f6a-b263c4779bc1'

const TEST_PACKAGE_ID =
  '7f20e503-274a-4a71-89d1-e2f81a601df6'

const TEST_COUNTRY =
  'CR'

const TEST_CURRENCY =
  'CRC'


type ProviderName =
  | 'sinpe'
  | 'bank-transfer'


type VerificationAssertion = {
  name:
    string

  passed:
    boolean

  details?:
    string
}


type VerificationReport = {
  provider:
    ProviderName

  purchaseId:
    string | null

  providerPaymentId:
    string | null

  assertions:
    VerificationAssertion[]

  passed:
    boolean
}


function requireEnvironmentVariable(
  name:
    string
): string {

  const value =
    process.env[name]

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`
    )
  }

  return value
}


function createAdminClient() {

  const supabaseUrl =
    requireEnvironmentVariable(
      'NEXT_PUBLIC_SUPABASE_URL'
    )

  const serviceRoleKey =
    requireEnvironmentVariable(
      'SUPABASE_SERVICE_ROLE_KEY'
    )

  return createClient(
    supabaseUrl,
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


function resolveProviderArgument():
  ProviderName {

  const providerArgument =
    process.argv[2]
      ?.trim()
      .toLowerCase()

  if (
    providerArgument ===
      'sinpe'
  ) {
    return 'sinpe'
  }

  if (
    providerArgument ===
      'bank-transfer' ||
    providerArgument ===
      'bank'
  ) {
    return 'bank-transfer'
  }

  throw new Error(
    'Provider argument is required. Use "sinpe" or "bank-transfer".'
  )
}


function createProvider({
  providerName,
  supabase
}: {
  providerName:
    ProviderName

  supabase:
    ReturnType<
      typeof createAdminClient
    >
}): CommercialProvider {

  switch (
    providerName
  ) {

    case 'sinpe':
      return createSinpeProvider({
        supabase
      })

    case 'bank-transfer':
      return createBankTransferProvider({
        supabase
      })
  }
}


function createProviderMetadata({
  providerName
}: {
  providerName:
    ProviderName
}) {

  const timestamp =
    Date.now()

  if (
    providerName ===
      'sinpe'
  ) {
    return {
      sinpeReference:
        `VERIFY-SINPE-${timestamp}`,

      senderName:
        'Twuanis Provider Verification',

      senderPhone:
        '88888888',

      paymentDate:
        new Date()
          .toISOString()
    }
  }

  return {
    bankName:
      'Twuanis Verification Bank',

    accountReference:
      'VERIFY-ACCOUNT',

    transferReference:
      `VERIFY-BANK-${timestamp}`,

    senderName:
      'Twuanis Provider Verification',

    senderAccountLast4:
      '1234',

    paymentDate:
      new Date()
        .toISOString()
  }
}


function recordAssertion({
  assertions,
  name,
  passed,
  details
}: {
  assertions:
    VerificationAssertion[]

  name:
    string

  passed:
    boolean

  details?:
    string
}) {

  assertions.push({
    name,
    passed,
    details
  })

  const marker =
    passed
      ? '✓'
      : '✗'

  console.log(
    `${marker} ${name}${
      details
        ? ` — ${details}`
        : ''
    }`
  )
}


async function countSubscriptions({
  supabase
}: {
  supabase:
    ReturnType<
      typeof createAdminClient
    >
}) {

  const {
    count,
    error
  } =
    await supabase
      .from(
        'user_subscriptions'
      )
      .select(
        'id',
        {
          count:
            'exact',

          head:
            true
        }
      )
      .eq(
        'user_id',
        TEST_USER_ID
      )

  if (error) {
    throw error
  }

  return count ?? 0
}


async function countEntitlements({
  supabase
}: {
  supabase:
    ReturnType<
      typeof createAdminClient
    >
}) {

  const {
    count,
    error
  } =
    await supabase
      .from(
        'listing_entitlements'
      )
      .select(
        'id',
        {
          count:
            'exact',

          head:
            true
        }
      )
      .eq(
        'owner_id',
        TEST_USER_ID
      )

  if (error) {
    throw error
  }

  return count ?? 0
}


async function loadProviderPayment({
  providerName,
  purchaseId,
  supabase
}: {
  providerName:
    ProviderName

  purchaseId:
    string

  supabase:
    ReturnType<
      typeof createAdminClient
    >
}) {

  const table =
    providerName ===
      'sinpe'
      ? 'sinpe_payments'
      : 'bank_transfer_payments'

  const {
    data,
    error
  } =
    await supabase
      .from(
        table
      )
      .select(`
        id,
        purchase_request_id,
        amount,
        currency,
        status,
        created_at
      `)
      .eq(
        'purchase_request_id',
        purchaseId
      )
      .maybeSingle()

  if (error) {
    throw error
  }

  return data
}


async function verifyCommercialProvider():
  Promise<VerificationReport> {

  const providerName =
    resolveProviderArgument()

  const supabase =
    createAdminClient()

  const provider =
    createProvider({
      providerName,
      supabase
    })

  const assertions:
    VerificationAssertion[] =
      []

  let purchaseId:
    string | null =
      null

  let providerPaymentId:
    string | null =
      null


  console.log('')
  console.log(
    'TWUANIS COMMERCIAL PROVIDER VERIFICATION'
  )
  console.log(
    '========================================'
  )
  console.log(
    `Provider: ${providerName}`
  )
  console.log('')


  /*
   * ========================================================
   * SNAPSHOT PRE-SUBMISSION STATE
   * ========================================================
   */

  const subscriptionsBefore =
    await countSubscriptions({
      supabase
    })

  const entitlementsBefore =
    await countEntitlements({
      supabase
    })


  /*
   * ========================================================
   * CREATE CANONICAL PURCHASE
   * ========================================================
   */

  const createdPurchase =
    await createPurchaseRequest({
      supabase,

      ownerId:
        TEST_USER_ID,

      productType:
        'package',

      packageId:
        TEST_PACKAGE_ID,

      targetType:
        'account',

      quantity:
        1,

      currency:
        TEST_CURRENCY,

      metadata: {
        source:
          'provider_verification',

        verificationProvider:
          providerName
      }
    })


  purchaseId =
    createdPurchase
      .purchase
      .id


  recordAssertion({
    assertions,

    name:
      'Canonical purchase created',

    passed:
      Boolean(
        purchaseId
      ),

    details:
      purchaseId
  })


  recordAssertion({
    assertions,

    name:
      'Purchase begins pending',

    passed:
      createdPurchase
        .purchase
        .status ===
      'pending',

    details:
      createdPurchase
        .purchase
        .status
  })


  /*
   * ========================================================
   * SUBMIT THROUGH CANONICAL SUBMISSION ENGINE
   * ========================================================
   */

  const submission =
    await submitPurchaseToProvider({
      supabase,

      purchaseId,

      ownerId:
        TEST_USER_ID,

      providerPreference:
        provider.id,

      country:
        TEST_COUNTRY,

      metadata:
        createProviderMetadata({
          providerName
        })
    })


  recordAssertion({
    assertions,

    name:
      'Canonical provider result returned',

    passed:
      Boolean(
        submission
          .providerResult
      )
  })


  recordAssertion({
    assertions,

    name:
      'Provider identity preserved',

    passed:
      submission
        .providerResult
        .providerId ===
      provider.id,

    details:
      submission
        .providerResult
        .providerId
  })


  recordAssertion({
    assertions,

    name:
      'Purchase identity preserved',

    passed:
      submission
        .providerResult
        .purchaseId ===
      purchaseId,

    details:
      submission
        .providerResult
        .purchaseId
  })


  recordAssertion({
    assertions,

    name:
      'Provider reports submitted state',

    passed:
      submission
        .providerResult
        .status ===
      'submitted',

    details:
      submission
        .providerResult
        .status
  })


  recordAssertion({
    assertions,

    name:
      'Provider reference returned',

    passed:
      Boolean(
        submission
          .providerResult
          .providerReference
      ),

    details:
      submission
        .providerResult
        .providerReference ??
      undefined
  })


  recordAssertion({
    assertions,

    name:
      'Amount preserved',

    passed:
      submission
        .providerResult
        .amount ===
      createdPurchase
        .purchase
        .amount,

    details:
      String(
        submission
          .providerResult
          .amount
      )
  })


  recordAssertion({
    assertions,

    name:
      'Currency preserved',

    passed:
      submission
        .providerResult
        .currency ===
      createdPurchase
        .purchase
        .currency,

    details:
      submission
        .providerResult
        .currency
  })


  /*
   * ========================================================
   * VERIFY PROVIDER DATABASE FACT
   * ========================================================
   */

  const providerPayment =
    await loadProviderPayment({
      providerName,
      purchaseId,
      supabase
    })


  providerPaymentId =
    providerPayment?.id ??
    null


  recordAssertion({
    assertions,

    name:
      'Provider payment record created',

    passed:
      Boolean(
        providerPayment
      ),

    details:
      providerPaymentId ??
      undefined
  })


  recordAssertion({
    assertions,

    name:
      'Provider payment references purchase',

    passed:
      providerPayment
        ?.purchase_request_id ===
      purchaseId,

    details:
      providerPayment
        ?.purchase_request_id ??
      undefined
  })


  recordAssertion({
    assertions,

    name:
      'Provider payment remains submitted',

    passed:
      providerPayment
        ?.status ===
      'submitted',

    details:
      providerPayment
        ?.status
  })


  /*
   * ========================================================
   * VERIFY PURCHASE WAS NOT MUTATED
   * ========================================================
   */

  const purchaseAfterSubmission =
    await resolvePurchase({
      supabase,

      purchaseId,

      ownerId:
        TEST_USER_ID
    })


  recordAssertion({
    assertions,

    name:
      'Purchase remains pending after provider submission',

    passed:
      purchaseAfterSubmission
        .purchase
        .status ===
      'pending',

    details:
      purchaseAfterSubmission
        .purchase
        .status
  })


  /*
   * ========================================================
   * VERIFY NO DOWNSTREAM ACTIVATION OCCURRED
   * ========================================================
   */

  const subscriptionsAfter =
    await countSubscriptions({
      supabase
    })

  const entitlementsAfter =
    await countEntitlements({
      supabase
    })


  recordAssertion({
    assertions,

    name:
      'Provider created no subscription',

    passed:
      subscriptionsAfter ===
      subscriptionsBefore,

    details:
      `${subscriptionsBefore} → ${subscriptionsAfter}`
  })


  recordAssertion({
    assertions,

    name:
      'Provider created no entitlement',

    passed:
      entitlementsAfter ===
      entitlementsBefore,

    details:
      `${entitlementsBefore} → ${entitlementsAfter}`
  })


  /*
   * ========================================================
   * VERIFY PURCHASE AUDIT TRAIL
   * ========================================================
   */

  recordAssertion({
    assertions,

    name:
      'Purchase audit trail exists',

    passed:
      purchaseAfterSubmission
        .events
        .length >
      0,

    details:
      `${purchaseAfterSubmission.events.length} event(s)`
  })


  const passed =
    assertions.every(
      assertion =>
        assertion.passed
    )


  console.log('')
  console.log(
    passed
      ? 'COMMERCIAL PROVIDER VERIFICATION PASSED'
      : 'COMMERCIAL PROVIDER VERIFICATION FAILED'
  )

  console.log('')


  return {
    provider:
      providerName,

    purchaseId,

    providerPaymentId,

    assertions,

    passed
  }
}


verifyCommercialProvider()
  .then(
    report => {

      if (
        !report.passed
      ) {
        process.exitCode =
          1
      }
    }
  )
  .catch(
    error => {

      console.error('')
      console.error(
        'COMMERCIAL PROVIDER VERIFICATION ERROR'
      )

      console.error(
        error
      )

      process.exitCode =
        1
    }
  )