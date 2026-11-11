import type {
  PurchaseMetadata,
  PurchaseRecord,
  PurchaseStatus
} from '@/lib/purchase-engine'


/*
 * ============================================================
 * CANONICAL PROVIDER IDENTITY
 * ============================================================
 */

export type CommercialProviderId =
  string

export type CommercialProviderCountry =
  string

export type CommercialProviderCurrency =
  string


/*
 * ============================================================
 * CANONICAL PROVIDER STATUS
 * ============================================================
 *
 * These are provider-facing commercial states.
 *
 * They are intentionally NOT PurchaseStatus.
 *
 * A provider may still be processing payment while the
 * canonical purchase remains pending.
 */

export type CommercialProviderStatus =
  | 'pending'
  | 'submitted'
  | 'processing'
  | 'approved'
  | 'rejected'
  | 'failed'
  | 'cancelled'
  | 'expired'


/*
 * ============================================================
 * PROVIDER METADATA
 * ============================================================
 *
 * Provider-specific facts may live here without leaking
 * provider-specific schema into the rest of Twuanis.
 *
 * Examples:
 *
 * SINPE:
 * - sinpeReference
 * - senderName
 *
 * Stripe:
 * - paymentIntentId
 * - checkoutSessionId
 *
 * PayPal:
 * - orderId
 *
 * The Commercial Platform treats all of those as metadata.
 */

export type CommercialProviderMetadata =
  Record<
    string,
    unknown
  >


/*
 * ============================================================
 * CANONICAL COMMERCIAL REQUEST
 * ============================================================
 *
 * This is what Twuanis sends TO any commercial provider.
 *
 * Providers receive the canonical purchase.
 *
 * They do not determine:
 *
 * - product price
 * - product eligibility
 * - ownership
 * - entitlement state
 *
 * Those belong to Twuanis.
 */

export type CommercialProviderRequest = {
  purchase:
    PurchaseRecord

  providerId:
    CommercialProviderId

  country:
    CommercialProviderCountry

  currency:
    CommercialProviderCurrency

  amount:
    number

  metadata:
    CommercialProviderMetadata
}


/*
 * ============================================================
 * CANONICAL PROVIDER RESULT
 * ============================================================
 *
 * Every provider returns this shape.
 */

export type CommercialProviderResult = {
  providerId:
    CommercialProviderId

  purchaseId:
    string

  providerReference:
    string | null

  status:
    CommercialProviderStatus

  amount:
    number

  currency:
    CommercialProviderCurrency

  metadata:
    CommercialProviderMetadata

  occurredAt:
    string
}


/*
 * ============================================================
 * PROVIDER CALLBACK
 * ============================================================
 *
 * Used when an external provider calls Twuanis asynchronously.
 *
 * Examples:
 *
 * Stripe webhook
 * PayPal webhook
 * future banking callback
 */

export type CommercialProviderCallback = {
  providerId:
    CommercialProviderId

  providerReference:
    string

  eventType:
    string

  status:
    CommercialProviderStatus

  amount:
    number | null

  currency:
    CommercialProviderCurrency | null

  metadata:
    CommercialProviderMetadata

  occurredAt:
    string
}


/*
 * ============================================================
 * PROVIDER APPROVAL
 * ============================================================
 */

export type CommercialProviderApproval = {
  providerId:
    CommercialProviderId

  purchaseId:
    string

  providerReference:
    string | null

  approvedAt:
    string

  approvedBy:
    string | null

  metadata:
    CommercialProviderMetadata
}


/*
 * ============================================================
 * PROVIDER REJECTION
 * ============================================================
 */

export type CommercialProviderRejection = {
  providerId:
    CommercialProviderId

  purchaseId:
    string

  providerReference:
    string | null

  reason:
    string

  rejectedAt:
    string

  rejectedBy:
    string | null

  metadata:
    CommercialProviderMetadata
}


/*
 * ============================================================
 * PROVIDER CANCELLATION
 * ============================================================
 */

export type CommercialProviderCancellation = {
  providerId:
    CommercialProviderId

  purchaseId:
    string

  providerReference:
    string | null

  reason:
    string | null

  cancelledAt:
    string

  cancelledBy:
    string | null

  metadata:
    CommercialProviderMetadata
}


/*
 * ============================================================
 * PROVIDER EXPIRATION
 * ============================================================
 */

export type CommercialProviderExpiration = {
  providerId:
    CommercialProviderId

  purchaseId:
    string

  providerReference:
    string | null

  expiredAt:
    string

  metadata:
    CommercialProviderMetadata
}


/*
 * ============================================================
 * PROVIDER ERROR
 * ============================================================
 */

export type CommercialProviderErrorCode =
  | 'PROVIDER_NOT_AVAILABLE'
  | 'PROVIDER_UNSUPPORTED_COUNTRY'
  | 'PROVIDER_UNSUPPORTED_CURRENCY'
  | 'PROVIDER_REQUEST_FAILED'
  | 'PROVIDER_CALLBACK_INVALID'
  | 'PROVIDER_APPROVAL_FAILED'
  | 'PROVIDER_REJECTION_FAILED'
  | 'PROVIDER_CANCELLATION_FAILED'
  | 'PROVIDER_EXPIRATION_FAILED'
  | 'PROVIDER_REFERENCE_REQUIRED'
  | 'PURCHASE_NOT_ELIGIBLE'

export class CommercialProviderError
  extends Error {

  providerId:
    CommercialProviderId | null

  code:
    CommercialProviderErrorCode

  metadata:
    CommercialProviderMetadata

  constructor({
    code,
    message,
    providerId = null,
    metadata = {}
  }: {
    code:
      CommercialProviderErrorCode

    message:
      string

    providerId?:
      CommercialProviderId | null

    metadata?:
      CommercialProviderMetadata
  }) {
    super(
      message
    )

    this.name =
      'CommercialProviderError'

    this.code =
      code

    this.providerId =
      providerId

    this.metadata =
      metadata
  }
}


/*
 * ============================================================
 * CANONICAL PROVIDER CONTRACT
 * ============================================================
 *
 * Every commercial provider must implement this interface.
 *
 * SINPE.
 * Stripe.
 * PayPal.
 * Bank Transfer.
 * Future providers.
 *
 * Twuanis speaks only this interface.
 */

export interface CommercialProvider {

  /*
   * Canonical provider identity.
   */
  id:
    CommercialProviderId

  /*
   * Human-readable provider name.
   */
  name:
    string

  /*
   * Markets currently supported by this adapter.
   *
   * Examples:
   *
   * CR
   * US
   * CO
   */
  supportedCountries:
    CommercialProviderCountry[]

  /*
   * Currencies currently supported by this adapter.
   */
  supportedCurrencies:
    CommercialProviderCurrency[]


  /*
   * Submit the canonical purchase to the provider.
   */
  submitPurchase(
    request:
      CommercialProviderRequest
  ):
    Promise<
      CommercialProviderResult
    >


  /*
   * Normalize an asynchronous provider callback.
   *
   * The adapter may verify signatures, webhook secrets,
   * provider tokens, etc. internally.
   *
   * Nothing outside the adapter should interpret raw
   * provider callbacks.
   */
  handleCallback?(
    payload:
      unknown
  ):
    Promise<
      CommercialProviderCallback
    >


  /*
   * Provider-side approval.
   *
   * Important:
   *
   * This does NOT activate a Twuanis purchase.
   *
   * It only reports provider approval.
   *
   * The future Approval Engine owns the transition of
   * the canonical Purchase.
   */
  approve?(
    approval:
      CommercialProviderApproval
  ):
    Promise<
      CommercialProviderResult
    >


  /*
   * Provider-side rejection.
   */
  reject?(
    rejection:
      CommercialProviderRejection
  ):
    Promise<
      CommercialProviderResult
    >


  /*
   * Provider-side cancellation.
   */
  cancel?(
    cancellation:
      CommercialProviderCancellation
  ):
    Promise<
      CommercialProviderResult
    >


  /*
   * Provider-side expiration.
   */
  expire?(
    expiration:
      CommercialProviderExpiration
  ):
    Promise<
      CommercialProviderResult
    >
}


/*
 * ============================================================
 * CANONICAL PROVIDER HELPERS
 * ============================================================
 */

export function normalizeProviderStatus(
  value:
    string
): CommercialProviderStatus {

  switch (
    value
      .trim()
      .toLowerCase()
  ) {

    case 'pending':
      return 'pending'

    case 'submitted':
      return 'submitted'

    case 'processing':
    case 'under_review':
      return 'processing'

    case 'approved':
    case 'paid':
    case 'completed':
    case 'succeeded':
      return 'approved'

    case 'rejected':
    case 'declined':
      return 'rejected'

    case 'failed':
    case 'error':
      return 'failed'

    case 'cancelled':
    case 'canceled':
      return 'cancelled'

    case 'expired':
      return 'expired'

    default:
      throw new CommercialProviderError({
        code:
          'PROVIDER_REQUEST_FAILED',

        message:
          `Unsupported provider status: ${value}`
      })
  }
}


export function providerSupportsCountry(
  provider:
    CommercialProvider,

  country:
    CommercialProviderCountry
): boolean {

  const normalizedCountry =
    country
      .trim()
      .toUpperCase()

  return provider
    .supportedCountries
    .some(
      supportedCountry =>
        supportedCountry
          .toUpperCase() ===
        normalizedCountry
    )
}


export function providerSupportsCurrency(
  provider:
    CommercialProvider,

  currency:
    CommercialProviderCurrency
): boolean {

  const normalizedCurrency =
    currency
      .trim()
      .toUpperCase()

  return provider
    .supportedCurrencies
    .some(
      supportedCurrency =>
        supportedCurrency
          .toUpperCase() ===
        normalizedCurrency
    )
}


export function createCommercialProviderRequest({
  purchase,
  providerId,
  country,
  metadata = {}
}: {
  purchase:
    PurchaseRecord

  providerId:
    CommercialProviderId

  country:
    CommercialProviderCountry

  metadata?:
    CommercialProviderMetadata
}): CommercialProviderRequest {

  if (
    purchase.status !==
      'pending'
  ) {
    throw new CommercialProviderError({
      code:
        'PURCHASE_NOT_ELIGIBLE',

      providerId,

      message:
        'Only pending purchases can be submitted to a commercial provider.'
    })
  }

  return {
    purchase,

    providerId,

    country:
      country
        .trim()
        .toUpperCase(),

    currency:
      purchase.currency
        .trim()
        .toUpperCase(),

    amount:
      purchase.amount,

    metadata
  }
}


/*
 * ============================================================
 * PURCHASE / PROVIDER STATE BOUNDARY
 * ============================================================
 *
 * Provider state and purchase state are deliberately
 * separate.
 *
 * This helper describes the only terminal provider states
 * that may eventually produce a canonical purchase-state
 * transition.
 *
 * The future Approval Engine performs that transition.
 */

export function mapProviderStatusToPurchaseStatus(
  providerStatus:
    CommercialProviderStatus
): PurchaseStatus | null {

  switch (
    providerStatus
  ) {

    case 'approved':
      return 'approved'

    case 'rejected':
      return 'rejected'

    case 'cancelled':
      return 'cancelled'

    case 'expired':
      return 'expired'

    case 'failed':
    case 'pending':
    case 'submitted':
    case 'processing':
      return null
  }
}


/*
 * ============================================================
 * PROVIDER METADATA NORMALIZATION
 * ============================================================
 */

export function normalizeProviderMetadata(
  metadata:
    CommercialProviderMetadata | null | undefined
): CommercialProviderMetadata {

  return metadata ?? {}
}


/*
 * ============================================================
 * COMMERCIAL METADATA BRIDGE
 * ============================================================
 *
 * PurchaseMetadata and CommercialProviderMetadata are both
 * generic domain metadata today.
 *
 * Keeping this function explicit preserves the boundary in
 * case their schemas diverge later.
 */

export function purchaseMetadataToProviderMetadata(
  metadata:
    PurchaseMetadata
): CommercialProviderMetadata {

  return {
    ...metadata
  }
}