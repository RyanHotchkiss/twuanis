import type {
  SupabaseClient
} from '@supabase/supabase-js'

import {
  CommercialProviderError,
  normalizeProviderMetadata,
  type CommercialProvider,
  type CommercialProviderMetadata,
  type CommercialProviderRequest,
  type CommercialProviderResult
} from '@/lib/commercial-provider'


/*
 * ============================================================
 * SINPE PROVIDER
 * ============================================================
 *
 * SINPE is an adapter.
 *
 * It does not own:
 *
 * - Purchase creation
 * - Product pricing
 * - Purchase approval
 * - Subscription creation
 * - Entitlement creation
 * - Activation
 *
 * Its responsibility is:
 *
 * CommercialProviderRequest
 *          ↓
 * SINPE payment record
 *          ↓
 * CommercialProviderResult
 */


export const SINPE_PROVIDER_ID =
  'sinpe'


export type SinpeSubmissionMetadata = {
  sinpeReference:
    string

  senderName:
    string

  senderPhone?:
    string | null

  paymentDate:
    string
}


type DatabaseSinpePayment = {
  id:
    string

  purchase_request_id:
    string | null

  user_id:
    string

  amount:
    number | string

  currency:
    string

  sinpe_reference:
    string

  sender_name:
    string

  sender_phone:
    string | null

  payment_date:
    string

  status:
    string

  created_at:
    string
}


function readRequiredString({
  metadata,
  key,
  label
}: {
  metadata:
    CommercialProviderMetadata

  key:
    string

  label:
    string
}): string {

  const value =
    metadata[key]

  if (
    typeof value !==
      'string' ||
    !value.trim()
  ) {
    throw new CommercialProviderError({
      code:
        'PROVIDER_REQUEST_FAILED',

      providerId:
        SINPE_PROVIDER_ID,

      message:
        `${label} is required for a SINPE submission.`
    })
  }

  return value.trim()
}


function readOptionalString({
  metadata,
  key
}: {
  metadata:
    CommercialProviderMetadata

  key:
    string
}): string | null {

  const value =
    metadata[key]

  if (
    value === null ||
    value === undefined
  ) {
    return null
  }

  if (
    typeof value !==
      'string'
  ) {
    throw new CommercialProviderError({
      code:
        'PROVIDER_REQUEST_FAILED',

      providerId:
        SINPE_PROVIDER_ID,

      message:
        `${key} must be a string when provided.`
    })
  }

  const normalized =
    value.trim()

  return normalized || null
}


function parseSinpeMetadata(
  metadata:
    CommercialProviderMetadata
): SinpeSubmissionMetadata {

  const normalizedMetadata =
    normalizeProviderMetadata(
      metadata
    )

  const sinpeReference =
    readRequiredString({
      metadata:
        normalizedMetadata,

      key:
        'sinpeReference',

      label:
        'SINPE reference'
    })

  const senderName =
    readRequiredString({
      metadata:
        normalizedMetadata,

      key:
        'senderName',

      label:
        'Sender name'
    })

  const paymentDate =
    readRequiredString({
      metadata:
        normalizedMetadata,

      key:
        'paymentDate',

      label:
        'Payment date'
    })

  const senderPhone =
    readOptionalString({
      metadata:
        normalizedMetadata,

      key:
        'senderPhone'
    })

  const parsedPaymentDate =
    new Date(
      paymentDate
    )

  if (
    Number.isNaN(
      parsedPaymentDate.getTime()
    )
  ) {
    throw new CommercialProviderError({
      code:
        'PROVIDER_REQUEST_FAILED',

      providerId:
        SINPE_PROVIDER_ID,

      message:
        'The SINPE payment date is invalid.'
    })
  }

  return {
    sinpeReference,
    senderName,
    senderPhone,
    paymentDate:
      parsedPaymentDate
        .toISOString()
  }
}


function normalizeAmount(
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
    throw new CommercialProviderError({
      code:
        'PROVIDER_REQUEST_FAILED',

      providerId:
        SINPE_PROVIDER_ID,

      message:
        'The SINPE payment amount could not be resolved.'
    })
  }

  return amount
}


export function createSinpeProvider({
  supabase
}: {
  supabase:
    SupabaseClient
}): CommercialProvider {

  return {
    id:
      SINPE_PROVIDER_ID,

    name:
      'SINPE',

    supportedCountries: [
      'CR'
    ],

    supportedCurrencies: [
      'CRC',
      'USD'
    ],


    async submitPurchase(
      request:
        CommercialProviderRequest
    ): Promise<CommercialProviderResult> {

      /*
       * Defense in depth.
       *
       * commercial-submission.ts already verifies these
       * conditions before invoking the adapter.
       *
       * The adapter still validates its own contract.
       */

      if (
        request.providerId !==
          SINPE_PROVIDER_ID
      ) {
        throw new CommercialProviderError({
          code:
            'PROVIDER_REQUEST_FAILED',

          providerId:
            SINPE_PROVIDER_ID,

          message:
            'The commercial request was submitted to the wrong provider.'
        })
      }


      if (
        request.country
          .toUpperCase() !==
        'CR'
      ) {
        throw new CommercialProviderError({
          code:
            'PROVIDER_UNSUPPORTED_COUNTRY',

          providerId:
            SINPE_PROVIDER_ID,

          message:
            'SINPE currently supports Costa Rica only.'
        })
      }


      const currency =
        request.currency
          .trim()
          .toUpperCase()


      if (
        ![
          'CRC',
          'USD'
        ].includes(
          currency
        )
      ) {
        throw new CommercialProviderError({
          code:
            'PROVIDER_UNSUPPORTED_CURRENCY',

          providerId:
            SINPE_PROVIDER_ID,

          message:
            `SINPE does not support currency ${currency}.`
        })
      }


      if (
        request.purchase.id ===
          '' ||
        request.purchase.ownerId ===
          ''
      ) {
        throw new CommercialProviderError({
          code:
            'PURCHASE_NOT_ELIGIBLE',

          providerId:
            SINPE_PROVIDER_ID,

          message:
            'The canonical purchase is incomplete.'
        })
      }


      if (
        !request.purchase.isPending
      ) {
        throw new CommercialProviderError({
          code:
            'PURCHASE_NOT_ELIGIBLE',

          providerId:
            SINPE_PROVIDER_ID,

          message:
            'Only pending purchases can be submitted through SINPE.'
        })
      }


      if (
        request.amount !==
          request.purchase.amount
      ) {
        throw new CommercialProviderError({
          code:
            'PROVIDER_REQUEST_FAILED',

          providerId:
            SINPE_PROVIDER_ID,

          message:
            'The SINPE request amount does not match the canonical purchase amount.'
        })
      }


      if (
        currency !==
          request.purchase.currency
            .trim()
            .toUpperCase()
      ) {
        throw new CommercialProviderError({
          code:
            'PROVIDER_REQUEST_FAILED',

          providerId:
            SINPE_PROVIDER_ID,

          message:
            'The SINPE request currency does not match the canonical purchase currency.'
        })
      }


      const sinpeMetadata =
        parseSinpeMetadata(
          request.metadata
        )


      /*
       * Prevent duplicate submissions even before relying
       * on the database unique index.
       */

      const {
        data: existingPayment,
        error: existingPaymentError
      } =
        await supabase
          .from(
            'sinpe_payments'
          )
          .select(`
            id,
            purchase_request_id,
            user_id,
            amount,
            currency,
            sinpe_reference,
            sender_name,
            sender_phone,
            payment_date,
            status,
            created_at
          `)
          .eq(
            'purchase_request_id',
            request.purchase.id
          )
          .maybeSingle()


      if (existingPaymentError) {
        throw new CommercialProviderError({
          code:
            'PROVIDER_REQUEST_FAILED',

          providerId:
            SINPE_PROVIDER_ID,

          message:
            existingPaymentError.message
        })
      }


      if (existingPayment) {
        throw new CommercialProviderError({
          code:
            'PURCHASE_NOT_ELIGIBLE',

          providerId:
            SINPE_PROVIDER_ID,

          metadata: {
            paymentId:
              existingPayment.id
          },

          message:
            'This purchase has already been submitted through SINPE.'
        })
      }


      /*
       * Create provider fact.
       *
       * Notice what is deliberately absent:
       *
       * subscription_id
       * subscription creation
       * entitlement creation
       * purchase approval
       * activation
       */

      const {
        data,
        error
      } =
        await supabase
          .from(
            'sinpe_payments'
          )
          .insert({
            user_id:
              request.purchase.ownerId,

            purchase_request_id:
              request.purchase.id,

            subscription_id:
              null,

            amount:
              request.purchase.amount,

            currency,

            sinpe_reference:
              sinpeMetadata
                .sinpeReference,

            sender_name:
              sinpeMetadata
                .senderName,

            sender_phone:
              sinpeMetadata
                .senderPhone,

            payment_date:
              sinpeMetadata
                .paymentDate,

            status:
              'submitted'
          })
          .select(`
            id,
            purchase_request_id,
            user_id,
            amount,
            currency,
            sinpe_reference,
            sender_name,
            sender_phone,
            payment_date,
            status,
            created_at
          `)
          .single()


      if (
        error ||
        !data
      ) {
        throw new CommercialProviderError({
          code:
            'PROVIDER_REQUEST_FAILED',

          providerId:
            SINPE_PROVIDER_ID,

          message:
            error?.message ??
            'The SINPE payment could not be created.'
        })
      }


      const payment =
        data as
          DatabaseSinpePayment


      /*
       * Return canonical provider language.
       *
       * SINPE-specific information remains isolated inside
       * provider metadata.
       */

      return {
        providerId:
          SINPE_PROVIDER_ID,

        purchaseId:
          request.purchase.id,

        providerReference:
          payment.sinpe_reference,

        status:
          'submitted',

        amount:
          normalizeAmount(
            payment.amount
          ),

        currency:
          payment.currency,

        metadata: {
          paymentId:
            payment.id,

          sinpeReference:
            payment.sinpe_reference,

          senderName:
            payment.sender_name,

          senderPhone:
            payment.sender_phone,

          paymentDate:
            payment.payment_date,

          submittedAt:
            payment.created_at
        },

        occurredAt:
          payment.created_at
      }
    }
  }
}