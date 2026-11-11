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


export const BANK_TRANSFER_PROVIDER_ID =
  'bank-transfer'


export type BankTransferSubmissionMetadata = {
  bankName:
    string

  accountReference:
    string

  transferReference:
    string

  senderName:
    string

  senderAccountLast4?:
    string | null

  paymentDate:
    string
}


type DatabaseBankTransferPayment = {
  id:
    string

  purchase_request_id:
    string

  user_id:
    string

  amount:
    number | string

  currency:
    string

  bank_name:
    string

  account_reference:
    string

  transfer_reference:
    string

  sender_name:
    string

  sender_account_last4:
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
        BANK_TRANSFER_PROVIDER_ID,

      message:
        `${label} is required for a bank transfer submission.`
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
        BANK_TRANSFER_PROVIDER_ID,

      message:
        `${key} must be a string when provided.`
    })
  }

  const normalized =
    value.trim()

  return normalized || null
}


function parseBankTransferMetadata(
  metadata:
    CommercialProviderMetadata
): BankTransferSubmissionMetadata {

  const normalizedMetadata =
    normalizeProviderMetadata(
      metadata
    )

  const bankName =
    readRequiredString({
      metadata:
        normalizedMetadata,

      key:
        'bankName',

      label:
        'Bank name'
    })

  const accountReference =
    readRequiredString({
      metadata:
        normalizedMetadata,

      key:
        'accountReference',

      label:
        'Account reference'
    })

  const transferReference =
    readRequiredString({
      metadata:
        normalizedMetadata,

      key:
        'transferReference',

      label:
        'Transfer reference'
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

  const senderAccountLast4 =
    readOptionalString({
      metadata:
        normalizedMetadata,

      key:
        'senderAccountLast4'
    })

  if (
    senderAccountLast4 &&
    !/^[0-9A-Za-z]{4}$/.test(
      senderAccountLast4
    )
  ) {
    throw new CommercialProviderError({
      code:
        'PROVIDER_REQUEST_FAILED',

      providerId:
        BANK_TRANSFER_PROVIDER_ID,

      message:
        'Sender account last four must contain exactly four letters or numbers.'
    })
  }

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
        BANK_TRANSFER_PROVIDER_ID,

      message:
        'The bank transfer payment date is invalid.'
    })
  }

  return {
    bankName,
    accountReference,
    transferReference,
    senderName,
    senderAccountLast4,
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
        BANK_TRANSFER_PROVIDER_ID,

      message:
        'The bank transfer amount could not be resolved.'
    })
  }

  return amount
}


export function createBankTransferProvider({
  supabase
}: {
  supabase:
    SupabaseClient
}): CommercialProvider {

  return {
    id:
      BANK_TRANSFER_PROVIDER_ID,

    name:
      'Bank Transfer',

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

      if (
        request.providerId !==
          BANK_TRANSFER_PROVIDER_ID
      ) {
        throw new CommercialProviderError({
          code:
            'PROVIDER_REQUEST_FAILED',

          providerId:
            BANK_TRANSFER_PROVIDER_ID,

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
            BANK_TRANSFER_PROVIDER_ID,

          message:
            'Bank Transfer currently supports Costa Rica only.'
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
            BANK_TRANSFER_PROVIDER_ID,

          message:
            `Bank Transfer does not support currency ${currency}.`
        })
      }


      if (
        !request.purchase.id ||
        !request.purchase.ownerId
      ) {
        throw new CommercialProviderError({
          code:
            'PURCHASE_NOT_ELIGIBLE',

          providerId:
            BANK_TRANSFER_PROVIDER_ID,

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
            BANK_TRANSFER_PROVIDER_ID,

          message:
            'Only pending purchases can be submitted through Bank Transfer.'
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
            BANK_TRANSFER_PROVIDER_ID,

          message:
            'The bank transfer amount does not match the canonical purchase amount.'
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
            BANK_TRANSFER_PROVIDER_ID,

          message:
            'The bank transfer currency does not match the canonical purchase currency.'
        })
      }


      const transferMetadata =
        parseBankTransferMetadata(
          request.metadata
        )


      const {
        data: existingPayment,
        error: existingPaymentError
      } =
        await supabase
          .from(
            'bank_transfer_payments'
          )
          .select(`
            id
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
            BANK_TRANSFER_PROVIDER_ID,

          message:
            existingPaymentError.message
        })
      }


      if (existingPayment) {
        throw new CommercialProviderError({
          code:
            'PURCHASE_NOT_ELIGIBLE',

          providerId:
            BANK_TRANSFER_PROVIDER_ID,

          metadata: {
            paymentId:
              existingPayment.id
          },

          message:
            'This purchase has already been submitted through Bank Transfer.'
        })
      }


      const {
        data,
        error
      } =
        await supabase
          .from(
            'bank_transfer_payments'
          )
          .insert({
            purchase_request_id:
              request.purchase.id,

            user_id:
              request.purchase.ownerId,

            amount:
              request.purchase.amount,

            currency,

            bank_name:
              transferMetadata
                .bankName,

            account_reference:
              transferMetadata
                .accountReference,

            transfer_reference:
              transferMetadata
                .transferReference,

            sender_name:
              transferMetadata
                .senderName,

            sender_account_last4:
              transferMetadata
                .senderAccountLast4,

            payment_date:
              transferMetadata
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
            bank_name,
            account_reference,
            transfer_reference,
            sender_name,
            sender_account_last4,
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
            BANK_TRANSFER_PROVIDER_ID,

          message:
            error?.message ??
            'The bank transfer payment could not be created.'
        })
      }


      const payment =
        data as
          DatabaseBankTransferPayment


      return {
        providerId:
          BANK_TRANSFER_PROVIDER_ID,

        purchaseId:
          request.purchase.id,

        providerReference:
          payment
            .transfer_reference,

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

          bankName:
            payment.bank_name,

          accountReference:
            payment.account_reference,

          transferReference:
            payment.transfer_reference,

          senderName:
            payment.sender_name,

          senderAccountLast4:
            payment
              .sender_account_last4,

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