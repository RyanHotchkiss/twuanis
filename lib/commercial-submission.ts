import type {
  SupabaseClient
} from '@supabase/supabase-js'

import {
  resolvePurchase,
  type ResolvedPurchase
} from '@/lib/purchase-engine'

import {
  createCommercialProviderRequest,
  CommercialProviderError,
  type CommercialProviderMetadata,
  type CommercialProviderResult
} from '@/lib/commercial-provider'

import {
  resolveCommercialProvider
} from '@/lib/commercial-provider-resolver'


export type SubmitPurchaseToProviderInput = {
  supabase:
    SupabaseClient

  purchaseId:
    string

  ownerId:
    string

  providerPreference?:
    string | null

  country:
    string

  metadata?:
    CommercialProviderMetadata
}


export type CommercialSubmissionResult = {
  purchase:
    ResolvedPurchase

  providerResult:
    CommercialProviderResult

  submittedAt:
    string
}


export class CommercialSubmissionError
  extends Error {

  code:
    | 'PURCHASE_ID_REQUIRED'
    | 'OWNER_ID_REQUIRED'
    | 'PROVIDER_REQUIRED'
    | 'COUNTRY_REQUIRED'
    | 'PURCHASE_NOT_PENDING'
    | 'PROVIDER_COUNTRY_UNSUPPORTED'
    | 'PROVIDER_CURRENCY_UNSUPPORTED'
    | 'PROVIDER_SUBMISSION_FAILED'

  providerId:
    string | null

  purchaseId:
    string | null

  constructor({
    code,
    message,
    providerId = null,
    purchaseId = null
  }: {
    code:
      CommercialSubmissionError['code']

    message:
      string

    providerId?:
      string | null

    purchaseId?:
      string | null
  }) {
    super(
      message
    )

    this.name =
      'CommercialSubmissionError'

    this.code =
      code

    this.providerId =
      providerId

    this.purchaseId =
      purchaseId
  }
}


function normalizeCountry(
  country:
    string
): string {

  return country
    .trim()
    .toUpperCase()
}


function assertPurchasePending(
  purchase:
    ResolvedPurchase
): void {

  if (
    !purchase.purchase.isPending
  ) {
    throw new CommercialSubmissionError({
      code:
        'PURCHASE_NOT_PENDING',

      purchaseId:
        purchase.purchase.id,

      message:
        'Only pending purchases can be submitted to a commercial provider.'
    })
  }
}

export async function submitPurchaseToProvider({
  supabase,
  purchaseId,
  ownerId,
  providerPreference = null,
  country,
  metadata = {}
}: SubmitPurchaseToProviderInput):
  Promise<CommercialSubmissionResult> {

  if (!ownerId) {
    throw new CommercialSubmissionError({
      code:
        'OWNER_ID_REQUIRED',

      purchaseId,

      message:
        'An owner ID is required to submit a purchase.'
    })
  }

  if (
      !country ||
      !country.trim()
    ) {
      throw new CommercialSubmissionError({
        code:
          'COUNTRY_REQUIRED',

        purchaseId,

        message:
          'A country is required to submit a purchase.'
      })
    }

  const normalizedCountry =
    normalizeCountry(
      country
    )

  /*
   * Resolve canonical commercial state first.
   *
   * The Submission Engine does not trust caller-supplied
   * purchase amount, currency, product, ownership, or status.
   */
  const purchase =
    await resolvePurchase({
      supabase,
      purchaseId,
      ownerId
    })

  assertPurchasePending(
      purchase
    )

    const provider =
    resolveCommercialProvider({

      country:
        normalizedCountry,

      currency:
        purchase.purchase.currency,

      productType:
        purchase.purchase.productType,

      providerPreference
    })

  /*
   * Convert Twuanis canonical purchase state into the one
   * request shape every provider adapter must understand.
   */
  const providerRequest =
    createCommercialProviderRequest({
      purchase:
        purchase.purchase,

      providerId:
        provider.id,

      country:
        normalizedCountry,

      metadata
    })

  let providerResult:
    CommercialProviderResult

  try {
    providerResult =
      await provider.submitPurchase(
        providerRequest
      )
  } catch (error) {

    if (
      error instanceof
        CommercialProviderError
    ) {
      throw error
    }

    throw new CommercialSubmissionError({
      code:
        'PROVIDER_SUBMISSION_FAILED',

      providerId:
        provider.id,

      purchaseId:
        purchase.purchase.id,

      message:
        error instanceof Error
          ? error.message
          : 'The purchase could not be submitted to the commercial provider.'
    })
  }

  /*
   * The provider result must belong to the purchase that
   * Twuanis submitted.
   *
   * A provider may report facts about the transaction.
   * It may not silently redirect the submission to another
   * canonical purchase.
   */
  if (
    providerResult.purchaseId !==
      purchase.purchase.id
  ) {
    throw new CommercialSubmissionError({
      code:
        'PROVIDER_SUBMISSION_FAILED',

      providerId:
        provider.id,

      purchaseId:
        purchase.purchase.id,

      message:
        'The commercial provider returned a result for a different purchase.'
    })
  }

  return {
    purchase,

    providerResult,

    submittedAt:
      new Date()
        .toISOString()
  }
}