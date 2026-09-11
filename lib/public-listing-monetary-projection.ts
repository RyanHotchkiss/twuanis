import 'server-only'

import {
  resolveListingAmountCrc,
  resolveListingAmountUsd,
  resolveListingOriginalMonetaryValue
} from '@/lib/listing-monetary-value'

import type {
  MarketAnalyticalContext
} from '@/lib/market-analytical-context'

type PublicListingMonetaryInput = {
  transaction_type?: string | null
  currency?: string | null
  current_price?: number | string | null
  price_millions?: number | string | null
  monthly_price?: number | string | null
}

export function projectPublicListingMonetaryValue<
  T extends PublicListingMonetaryInput
>(
  listing: T,
  analyticalContext: MarketAnalyticalContext
) {
  const originalMonetaryValue =
    resolveListingOriginalMonetaryValue(
      listing
    )

  return {
    ...listing,

    marketplace_original_price:
      originalMonetaryValue?.amount ?? null,

    marketplace_original_currency:
      originalMonetaryValue?.currency ?? null,

    marketplace_price_crc:
        resolveListingAmountCrc(
            listing,
            analyticalContext.fx.rate
        ),

        marketplace_price_usd:
        resolveListingAmountUsd(
            listing,
            analyticalContext.fx.rate
        )
  }
}

export function projectPublicListingMonetaryValues<
  T extends PublicListingMonetaryInput
>(
  listings: T[],
  analyticalContext: MarketAnalyticalContext
) {
  return listings.map(listing =>
    projectPublicListingMonetaryValue(
      listing,
      analyticalContext
    )
  )
}