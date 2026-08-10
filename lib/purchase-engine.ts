import type {
  SupabaseClient
} from '@supabase/supabase-js'

export type PurchaseStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'cancelled'

export type PurchaseProductType =
  | 'package'
  | 'add_on'

export type PurchaseTargetType =
  | 'account'
  | 'listing'

export type PurchaseCurrency =
  string

export type PurchaseMetadata =
  Record<
    string,
    unknown
  >

export type PurchaseRecord = {
  id:
    string

  ownerId:
    string

  productType:
    PurchaseProductType

  packageId:
    string | null

  addOnProductId:
    string | null

  targetType:
    PurchaseTargetType

  listingId:
    string | null

  quantity:
    number

  unitAmount:
    number

  amount:
    number

  currency:
    PurchaseCurrency

  status:
    PurchaseStatus

  expiresAt:
    string | null

  approvedAt:
    string | null

  approvedBy:
    string | null

  rejectedAt:
    string | null

  rejectedBy:
    string | null

  rejectionReason:
    string | null

  cancelledAt:
    string | null

  cancelledBy:
    string | null

  cancellationReason:
    string | null

  expiredAt:
    string | null

  metadata:
    PurchaseMetadata

  createdAt:
    string

  updatedAt:
    string

  isPending:
    boolean

  isApproved:
    boolean

  isRejected:
    boolean

  isExpired:
    boolean

  isCancelled:
    boolean

  isTerminal:
    boolean
}

export type PurchaseEventRecord = {
  id:
    string

  purchaseRequestId:
    string

  eventType:
    string

  previousStatus:
    PurchaseStatus | null

  resultingStatus:
    PurchaseStatus | null

  actorId:
    string | null

  metadata:
    PurchaseMetadata

  createdAt:
    string
}

export type ResolvedPurchase = {
  purchase:
    PurchaseRecord

  events:
    PurchaseEventRecord[]

  resolvedAt:
    string
}

type DatabasePurchaseRequest = {
  id:
    string

  owner_id:
    string

  product_type:
    PurchaseProductType

  package_id:
    string | null

  add_on_product_id:
    string | null

  target_type:
    PurchaseTargetType

  listing_id:
    string | null

  quantity:
    number

  unit_amount:
    number | string

  amount:
    number | string

  currency:
    string

  status:
    PurchaseStatus

  expires_at:
    string | null

  approved_at:
    string | null

  approved_by:
    string | null

  rejected_at:
    string | null

  rejected_by:
    string | null

  rejection_reason:
    string | null

  cancelled_at:
    string | null

  cancelled_by:
    string | null

  cancellation_reason:
    string | null

  expired_at:
    string | null

  metadata:
    PurchaseMetadata

  created_at:
    string

  updated_at:
    string
}

type DatabasePurchaseRequestEvent = {
  id:
    string

  purchase_request_id:
    string

  event_type:
    string

  previous_status:
    PurchaseStatus | null

  resulting_status:
    PurchaseStatus | null

  actor_id:
    string | null

  metadata:
    PurchaseMetadata

  created_at:
    string
}

export type CreatePurchaseRequestInput = {
  supabase:
    SupabaseClient

  ownerId:
    string

  productType:
    PurchaseProductType

  packageId?:
    string

  addOnProductId?:
    string

  targetType:
    PurchaseTargetType

  listingId?:
    string

  quantity?:
    number

  currency:
    string

  expiresAt?:
    string | null

  metadata?:
    PurchaseMetadata
}

type DatabasePurchasePackage = {
  id:
    string

  price_usd:
    number | string

  price_crc:
    number | string

  is_active:
    boolean
}

type DatabasePurchaseAddOn = {
  id:
    string

  target_type:
    PurchaseTargetType

  price_usd:
    number | string

  price_crc:
    number | string

  is_active:
    boolean
}

export class PurchaseEngineError
  extends Error {
    code:
        | 'PURCHASE_ID_REQUIRED'
        | 'PURCHASE_NOT_FOUND'
        | 'PURCHASE_OWNER_MISMATCH'
        | 'PURCHASE_LOAD_FAILED'
        | 'PURCHASE_EVENTS_LOAD_FAILED'
        | 'INVALID_PURCHASE_AMOUNT'
        | 'OWNER_ID_REQUIRED'
        | 'PRODUCT_TYPE_REQUIRED'
        | 'PRODUCT_NOT_FOUND'
        | 'PRODUCT_INACTIVE'
        | 'TARGET_TYPE_REQUIRED'
        | 'TARGET_REQUIRED'
        | 'TARGET_MISMATCH'
        | 'INVALID_QUANTITY'
        | 'UNSUPPORTED_CURRENCY'
        | 'PURCHASE_CREATE_FAILED'

  constructor(
    code:
      PurchaseEngineError['code'],
    message:
      string
  ) {
    super(
      message
    )

    this.name =
      'PurchaseEngineError'

    this.code =
      code
  }
}

function parseAmount(
  value:
    number | string
): number {
  const amount =
    typeof value ===
      'number'
      ? value
      : Number(
          value
        )

  if (
    !Number.isFinite(
      amount
    )
  ) {
    throw new PurchaseEngineError(
      'INVALID_PURCHASE_AMOUNT',
      'The purchase amount could not be resolved.'
    )
  }

  return amount
}

function resolvePurchaseState(
  status:
    PurchaseStatus
) {
  const isPending =
    status ===
      'pending'

  const isApproved =
    status ===
      'approved'

  const isRejected =
    status ===
      'rejected'

  const isExpired =
    status ===
      'expired'

  const isCancelled =
    status ===
      'cancelled'

  return {
    isPending,

    isApproved,

    isRejected,

    isExpired,

    isCancelled,

    isTerminal:
      !isPending
  }
}

function normalizePurchase(
  row:
    DatabasePurchaseRequest
): PurchaseRecord {
  return {
    id:
      row.id,

    ownerId:
      row.owner_id,

    productType:
      row.product_type,

    packageId:
      row.package_id,

    addOnProductId:
      row.add_on_product_id,

    targetType:
      row.target_type,

    listingId:
      row.listing_id,

    quantity:
      row.quantity,

    unitAmount:
      parseAmount(
        row.unit_amount
      ),

    amount:
      parseAmount(
        row.amount
      ),

    currency:
      row.currency,

    status:
      row.status,

    expiresAt:
      row.expires_at,

    approvedAt:
      row.approved_at,

    approvedBy:
      row.approved_by,

    rejectedAt:
      row.rejected_at,

    rejectedBy:
      row.rejected_by,

    rejectionReason:
      row.rejection_reason,

    cancelledAt:
      row.cancelled_at,

    cancelledBy:
      row.cancelled_by,

    cancellationReason:
      row.cancellation_reason,

    expiredAt:
      row.expired_at,

    metadata:
      row.metadata ??
      {},

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

    ...resolvePurchaseState(
      row.status
    )
  }
}

function normalizePurchaseEvent(
  row:
    DatabasePurchaseRequestEvent
): PurchaseEventRecord {
  return {
    id:
      row.id,

    purchaseRequestId:
      row.purchase_request_id,

    eventType:
      row.event_type,

    previousStatus:
      row.previous_status,

    resultingStatus:
      row.resulting_status,

    actorId:
      row.actor_id,

    metadata:
      row.metadata ??
      {},

    createdAt:
      row.created_at
  }
}

function resolveProductPrice({
  currency,
  priceUsd,
  priceCrc
}: {
  currency:
    string

  priceUsd:
    number | string

  priceCrc:
    number | string
}): number {

  switch (
    currency.toUpperCase()
  ) {

    case 'USD':
      return parseAmount(
        priceUsd
      )

    case 'CRC':
      return parseAmount(
        priceCrc
      )

    default:
      throw new PurchaseEngineError(
        'UNSUPPORTED_CURRENCY',
        `Currency ${currency} is not currently configured for this product.`
      )
  }
}

export async function resolvePurchase({
  supabase,
  purchaseId,
  ownerId
}: {
  supabase:
    SupabaseClient

  purchaseId:
    string

  /*
   * Optional authenticated-owner assertion.
   *
   * Server routes resolving a customer's
   * purchase should provide this.
   *
   * Internal Commercial Platform processes
   * may omit it when operating through trusted
   * server infrastructure.
   */
  ownerId?:
    string
}): Promise<ResolvedPurchase> {

  if (!purchaseId) {
    throw new PurchaseEngineError(
      'PURCHASE_ID_REQUIRED',
      'A purchase ID is required to resolve a purchase.'
    )
  }

  const {
    data: purchaseData,
    error: purchaseError
  } =
    await supabase
      .from(
        'purchase_requests'
      )
      .select(`
        id,
        owner_id,
        product_type,
        package_id,
        add_on_product_id,
        target_type,
        listing_id,
        quantity,
        unit_amount,
        amount,
        currency,
        status,
        expires_at,
        approved_at,
        approved_by,
        rejected_at,
        rejected_by,
        rejection_reason,
        cancelled_at,
        cancelled_by,
        cancellation_reason,
        expired_at,
        metadata,
        created_at,
        updated_at
      `)
      .eq(
        'id',
        purchaseId
      )
      .maybeSingle()

  if (purchaseError) {
    throw new PurchaseEngineError(
      'PURCHASE_LOAD_FAILED',
      purchaseError.message
    )
  }

  if (!purchaseData) {
    throw new PurchaseEngineError(
      'PURCHASE_NOT_FOUND',
      'The requested purchase does not exist.'
    )
  }

  const purchase =
    normalizePurchase(
      purchaseData as
        DatabasePurchaseRequest
    )

  if (
    ownerId &&
    purchase.ownerId !==
      ownerId
  ) {
    throw new PurchaseEngineError(
      'PURCHASE_OWNER_MISMATCH',
      'The authenticated user does not own this purchase.'
    )
  }

  const {
    data: eventData,
    error: eventError
  } =
    await supabase
      .from(
        'purchase_request_events'
      )
      .select(`
        id,
        purchase_request_id,
        event_type,
        previous_status,
        resulting_status,
        actor_id,
        metadata,
        created_at
      `)
      .eq(
        'purchase_request_id',
        purchase.id
      )
      .order(
        'created_at',
        {
          ascending:
            true
        }
      )

  if (eventError) {
    throw new PurchaseEngineError(
      'PURCHASE_EVENTS_LOAD_FAILED',
      eventError.message
    )
  }

  const events =
    (
      eventData ?? []
    ).map(
      row =>
        normalizePurchaseEvent(
          row as
            DatabasePurchaseRequestEvent
        )
    )

  return {
    purchase,

    events,

    resolvedAt:
      new Date()
        .toISOString()
  }
}

export async function createPurchaseRequest({
  supabase,
  ownerId,
  productType,
  packageId,
  addOnProductId,
  targetType,
  listingId,
  quantity = 1,
  currency,
  expiresAt = null,
  metadata = {}
}: CreatePurchaseRequestInput):
  Promise<ResolvedPurchase> {

  if (!ownerId) {
    throw new PurchaseEngineError(
      'OWNER_ID_REQUIRED',
      'An owner ID is required to create a purchase request.'
    )
  }

  if (!productType) {
    throw new PurchaseEngineError(
      'PRODUCT_TYPE_REQUIRED',
      'A product type is required to create a purchase request.'
    )
  }

  if (!targetType) {
    throw new PurchaseEngineError(
      'TARGET_TYPE_REQUIRED',
      'A target type is required to create a purchase request.'
    )
  }

  if (
    !Number.isInteger(
      quantity
    ) ||
    quantity <= 0
  ) {
    throw new PurchaseEngineError(
      'INVALID_QUANTITY',
      'Purchase quantity must be a positive integer.'
    )
  }

  const normalizedCurrency =
    currency
      .trim()
      .toUpperCase()

  if (
    normalizedCurrency.length !== 3
  ) {
    throw new PurchaseEngineError(
      'UNSUPPORTED_CURRENCY',
      'Purchase currency must be a three-letter currency code.'
    )
  }

  let resolvedPackageId:
    string | null =
      null

  let resolvedAddOnProductId:
    string | null =
      null

  let resolvedUnitAmount:
    number

  /*
   * PACKAGE PURCHASE
   */
  if (
    productType ===
      'package'
  ) {
    if (!packageId) {
      throw new PurchaseEngineError(
        'PRODUCT_NOT_FOUND',
        'A package ID is required for a package purchase.'
      )
    }

    if (
      targetType !==
        'account'
    ) {
      throw new PurchaseEngineError(
        'TARGET_MISMATCH',
        'Package purchases must target an account.'
      )
    }

    const {
      data,
      error
    } =
      await supabase
        .from(
          'packages'
        )
        .select(`
          id,
          price_usd,
          price_crc,
          is_active
        `)
        .eq(
          'id',
          packageId
        )
        .maybeSingle()

    if (error) {
      throw new PurchaseEngineError(
        'PURCHASE_LOAD_FAILED',
        error.message
      )
    }

    if (!data) {
      throw new PurchaseEngineError(
        'PRODUCT_NOT_FOUND',
        'The selected package does not exist.'
      )
    }

    const product =
      data as
        DatabasePurchasePackage

    if (
      !product.is_active
    ) {
      throw new PurchaseEngineError(
        'PRODUCT_INACTIVE',
        'The selected package is not currently available for purchase.'
      )
    }

    resolvedPackageId =
      product.id

    resolvedUnitAmount =
      resolveProductPrice({
        currency:
          normalizedCurrency,

        priceUsd:
          product.price_usd,

        priceCrc:
          product.price_crc
      })
  }

  /*
   * ADD-ON PURCHASE
   */
  else if (
    productType ===
      'add_on'
  ) {
    if (!addOnProductId) {
      throw new PurchaseEngineError(
        'PRODUCT_NOT_FOUND',
        'An add-on product ID is required for an add-on purchase.'
      )
    }

    const {
      data,
      error
    } =
      await supabase
        .from(
          'add_on_products'
        )
        .select(`
          id,
          target_type,
          price_usd,
          price_crc,
          is_active
        `)
        .eq(
          'id',
          addOnProductId
        )
        .maybeSingle()

    if (error) {
      throw new PurchaseEngineError(
        'PURCHASE_LOAD_FAILED',
        error.message
      )
    }

    if (!data) {
      throw new PurchaseEngineError(
        'PRODUCT_NOT_FOUND',
        'The selected add-on product does not exist.'
      )
    }

    const product =
      data as
        DatabasePurchaseAddOn

    if (
      !product.is_active
    ) {
      throw new PurchaseEngineError(
        'PRODUCT_INACTIVE',
        'The selected add-on product is not currently available for purchase.'
      )
    }

    if (
      product.target_type !==
        targetType
    ) {
      throw new PurchaseEngineError(
        'TARGET_MISMATCH',
        'The purchase target does not match the selected add-on product.'
      )
    }

    if (
      targetType ===
        'listing' &&
      !listingId
    ) {
      throw new PurchaseEngineError(
        'TARGET_REQUIRED',
        'A listing ID is required for a listing-targeted purchase.'
      )
    }

    if (
      targetType ===
        'account' &&
      listingId
    ) {
      throw new PurchaseEngineError(
        'TARGET_MISMATCH',
        'Account-targeted purchases cannot identify a listing.'
      )
    }

    resolvedAddOnProductId =
      product.id

    resolvedUnitAmount =
      resolveProductPrice({
        currency:
          normalizedCurrency,

        priceUsd:
          product.price_usd,

        priceCrc:
          product.price_crc
      })
  }

  else {
    throw new PurchaseEngineError(
      'PRODUCT_TYPE_REQUIRED',
      'The selected product type is not supported.'
    )
  }

  const totalAmount =
    resolvedUnitAmount *
    quantity

  const {
    data,
    error
  } =
    await supabase
      .from(
        'purchase_requests'
      )
      .insert({
        owner_id:
          ownerId,

        product_type:
          productType,

        package_id:
          resolvedPackageId,

        add_on_product_id:
          resolvedAddOnProductId,

        target_type:
          targetType,

        listing_id:
          listingId ??
          null,

        quantity,

        unit_amount:
          resolvedUnitAmount,

        amount:
          totalAmount,

        currency:
          normalizedCurrency,

        status:
          'pending',

        expires_at:
          expiresAt,

        metadata
      })
      .select(`
        id
      `)
      .single()

  if (
    error ||
    !data
  ) {
    throw new PurchaseEngineError(
      'PURCHASE_CREATE_FAILED',
      error?.message ??
      'The purchase request could not be created.'
    )
  }

  return resolvePurchase({
    supabase,

    purchaseId:
      data.id,

    ownerId
  })
}