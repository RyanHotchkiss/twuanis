/**
 * ---------------------------------------------------------
 * Approval Engine
 * ---------------------------------------------------------
 *
 * The Approval Engine is the only component authorized
 * to transition purchases from a pending commercial state
 * into a terminal commercial state.
 *
 * Responsibilities:
 *
 * • Approve purchases
 * • Reject purchases
 * • Cancel purchases
 * • Expire purchases
 *
 * Explicitly NOT responsible for:
 *
 * • Subscription activation
 * • Listing entitlements
 * • Promotions
 * • Notifications
 * • Commercial providers
 *
 * Those responsibilities belong to the
 * Activation Engine.
 *
 */

import type {
  SupabaseClient
} from '@supabase/supabase-js'

import {
  resolvePurchase,
  type PurchaseStatus,
  type ResolvedPurchase,
  PurchaseEngineError
} from '@/lib/purchase-engine'

export type PurchaseDecision =
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'expired'

  export const TERMINAL_PURCHASE_DECISIONS = [

  'approved',

  'rejected',

  'cancelled',

  'expired'

] as const

export type PurchaseDecisionMetadata =
  Record<
    string,
    unknown
  >
export type PurchaseHistoryEntry = {

    eventId: string

    decision: PurchaseDecision

    previousStatus:
    PurchaseStatus | null

    resultingStatus:
    PurchaseStatus | null

    reviewerId: string | null

    occurredAt: string

    notes: string | null

    providerEvidence:
    PurchaseDecisionMetadata | null

    metadata:
        PurchaseDecisionMetadata
    }

    export type PurchaseHistory = {

    purchaseId: string

    entries:
        PurchaseHistoryEntry[]
    }

export type PurchaseDecisionInput = {
  supabase:
    SupabaseClient

  purchaseId:
    string

  reviewerId?:
    string | null

  notes?:
    string | null

  metadata?:
    PurchaseDecisionMetadata
}

type CommitPurchaseDecisionInput =
  PurchaseDecisionInput & {

    decision:
      PurchaseDecision
  }

const VALID_PURCHASE_TRANSITIONS: Record<
  PurchaseStatus,
  readonly PurchaseDecision[]
> = {

  pending: [

    'approved',

    'rejected',

    'cancelled',

    'expired'
  ],

  approved: [],

  rejected: [],

  cancelled: [],

  expired: []
}

export class ApprovalEngineError
  extends Error {

  code:
    | 'PURCHASE_NOT_PENDING'
    | 'PURCHASE_ALREADY_TERMINAL'
    | 'PROVIDER_EVIDENCE_REQUIRED'
    | 'INVALID_STATE_TRANSITION'
    | 'STATE_TRANSITION_FAILED'

  purchaseId:
    string | null

  constructor({
    code,
    purchaseId = null,
    message
  }: {
    code:
      ApprovalEngineError['code']

    purchaseId?:
      string | null

    message:
      string
  }) {

    super(
      message
    )

    this.name =
      'ApprovalEngineError'

    this.code =
      code

    this.purchaseId =
      purchaseId
  }
}
function assertValidTransition(
  purchase: ResolvedPurchase,
  decision: PurchaseDecision
): void {

  const currentStatus =
    purchase.purchase.status

  const allowedTransitions =
    VALID_PURCHASE_TRANSITIONS[
      currentStatus
    ]

  if (
    currentStatus === decision
  ) {
    throw new ApprovalEngineError({

      code:
        'PURCHASE_ALREADY_TERMINAL',

      purchaseId:
        purchase.purchase.id,

      message:
        `Purchase is already "${decision}".`
    })
  }

  if (
    allowedTransitions.length === 0
  ) {
    throw new ApprovalEngineError({

      code:
        'PURCHASE_ALREADY_TERMINAL',

      purchaseId:
        purchase.purchase.id,

      message:
        `Purchase is already in terminal state "${currentStatus}".`
    })
  }

  if (
    !allowedTransitions.includes(
      decision
    )
  ) {
    throw new ApprovalEngineError({

      code:
        'INVALID_STATE_TRANSITION',

      purchaseId:
        purchase.purchase.id,

      message:
        `Cannot transition purchase from "${currentStatus}" to "${decision}".`
    })
  }
}

function assertProviderEvidence(
  purchase:
    ResolvedPurchase
): void {

  const hasEvidence =
    purchase.events.some(
      event =>

        event.eventType
          .startsWith(
            'provider_'
          )
    )

  if (
    !hasEvidence
  ) {
    throw new ApprovalEngineError({

      code:
        'PROVIDER_EVIDENCE_REQUIRED',

      purchaseId:
        purchase.purchase.id,

      message:
        'Provider evidence must exist before a purchase can be decided.'
    })
  }
}

function buildPurchaseHistory(
  purchase: ResolvedPurchase
    ): PurchaseHistory {

    return {

        purchaseId:
        purchase.purchase.id,

        entries:

        purchase.events.map(

            event => ({

            eventId:
                event.id,

            decision:
                event.resultingStatus as PurchaseDecision,

            previousStatus:
                event.previousStatus,

            resultingStatus:
                event.resultingStatus,

            reviewerId:
                event.actorId,

            occurredAt:
                event.createdAt,

            notes:
                typeof event.metadata?.notes === 'string'
                    ? event.metadata.notes
                    : null,

            providerEvidence: (() => {

                const evidence =
                    event.metadata?.providerEvidence

                return (
                    evidence &&
                    typeof evidence === 'object'
                )
                    ? evidence as PurchaseDecisionMetadata
                    : null

                })(),

            metadata:
                event.metadata ?? {}
            })
        )
    }
    }

    export function getPurchaseHistory(
    purchase: ResolvedPurchase
    ): PurchaseHistory {

    return buildPurchaseHistory(
        purchase
    )
    }

    export function getPurchaseTimeline(
    purchase: ResolvedPurchase
    ): PurchaseHistoryEntry[] {

    return buildPurchaseHistory(
        purchase
    ).entries
    }

async function commitPurchaseDecision({
  supabase,
  purchaseId,
  reviewerId = null,
  notes = null,
  metadata = {},
  decision
}: CommitPurchaseDecisionInput): Promise<ResolvedPurchase> {

  const purchase =
    await resolvePurchase({
      supabase,
      purchaseId
    })

  assertValidTransition(
    purchase,
    decision
    )

  assertProviderEvidence(
    purchase
  )

  const previousStatus =
    purchase.purchase.status

  const now =
    new Date()
      .toISOString()

  const purchaseUpdate:
    Record<
      string,
      unknown
    > = {

    status:
      decision,

    updated_at:
      now
  }

  switch (
    decision
  ) {

    case 'approved':

      purchaseUpdate.approved_at =
        now

      purchaseUpdate.approved_by =
        reviewerId

      break

    case 'rejected':

      purchaseUpdate.rejected_at =
        now

      purchaseUpdate.rejected_by =
        reviewerId

      break

    case 'cancelled':

      purchaseUpdate.cancelled_at =
        now

      purchaseUpdate.cancelled_by =
        reviewerId

      break

    case 'expired':

      purchaseUpdate.expired_at =
        now

      break

    default:

      throw new ApprovalEngineError({

        code:
          'INVALID_STATE_TRANSITION',

        purchaseId,

        message:
          `Unsupported purchase decision "${decision}".`
      })
  }

  const {
    error:
      updateError
  } =
    await supabase

      .from(
        'purchase_requests'
      )

      .update(
        purchaseUpdate
      )

      .eq(
        'id',
        purchaseId
      )

  if (
    updateError
  ) {

    throw new ApprovalEngineError({

      code:
        'STATE_TRANSITION_FAILED',

      purchaseId,

      message:
        updateError.message
    })
  }

  const {
    error:
      eventError
  } =
    await supabase

      .from(
        'purchase_request_events'
      )

      .insert({

        purchase_request_id:
          purchaseId,

        event_type:
          `purchase_${decision}`,

        previous_status:
          previousStatus,

        resulting_status:
          decision,

        actor_id:
          reviewerId,

        metadata: {

          notes,

          ...metadata
        }
      })

  if (
    eventError
  ) {

    throw new ApprovalEngineError({

      code:
        'STATE_TRANSITION_FAILED',

      purchaseId,

      message:
        eventError.message
    })
  }

  return resolvePurchase({

    supabase,

    purchaseId
  })
}

      export async function approvePurchase({
  supabase,
  purchaseId,
  reviewerId = null,
  notes = null,
  metadata = {}
}: PurchaseDecisionInput): Promise<ResolvedPurchase> {

  return commitPurchaseDecision({

    supabase,

    purchaseId,

    reviewerId,

    notes,

    metadata,

    decision:
      'approved'
  })
}

export async function rejectPurchase({
  supabase,
  purchaseId,
  reviewerId = null,
  notes = null,
  metadata = {}
}: PurchaseDecisionInput): Promise<ResolvedPurchase> {

  return commitPurchaseDecision({

    supabase,

    purchaseId,

    reviewerId,

    notes,

    metadata,

    decision:
      'rejected'
  })
}

export async function cancelPurchase({
  supabase,
  purchaseId,
  reviewerId = null,
  notes = null,
  metadata = {}
}: PurchaseDecisionInput): Promise<ResolvedPurchase> {

  return commitPurchaseDecision({

    supabase,

    purchaseId,

    reviewerId,

    notes,

    metadata,

    decision:
      'cancelled'
  })
}

export async function expirePurchase({
  supabase,
  purchaseId,
  reviewerId = null,
  notes = null,
  metadata = {}
}: PurchaseDecisionInput): Promise<ResolvedPurchase> {

  return commitPurchaseDecision({

    supabase,

    purchaseId,

    reviewerId,

    notes,

    metadata,

    decision:
      'expired'
  })
}