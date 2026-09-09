import {
  getMarketStatistics
} from '@/lib/statistics-engine'

import {
  resolvePriceMeterAnalyticalIdentity,
  type PriceMeterFxIdentity
} from '@/lib/price-meter-identity'

import {
  getCurrentAnalyticalDate
} from '@/lib/analysis-date'

import {
  getHistoricalUsdToCrcRate
} from '@/lib/fx/fx-service'

import {
  buildPriceMeterObservations,
  type PriceMeterObservation
} from '@/lib/price-meter-observation-builder'

import {
  loadCanonicalGeographyTerms
} from '@/lib/geography/resolve-listing-geography'

import {
  resolveCanonicalGeography
} from '@/lib/geography/canonical-geography'

import {
  resolveListingImages
} from '@/app/utils/resolveListingImages'

import {
  supabase
} from '@/lib/supabase'


export type PriceMeterMarketFilters = {
  transaction_type?: string
  province?: string
  canton?: string
  district?: string
  property_type?: string
  bedrooms?: string
  bathrooms?: string
  parking?: string
  year_built?: string
  property_area?: string
  construction_area?: string
  utility?: string
  environment?: string
  terrain?: string
  accessibility?: string
  legal_status?: string
  distance_to_paved_road_range?: string
}


function formatCRC(
  value:
    number | null,
  suffix =
    ''
) {
  if (
    value === null ||
    Number.isNaN(
      value
    )
  ) {
    return null
  }

  return `₡${Math.round(value).toLocaleString()}${suffix}`
}


function formatUSD(
  value:
    number | null,
  suffix =
    ''
) {
  if (
    value === null ||
    Number.isNaN(
      value
    )
  ) {
    return null
  }

  return `$${Math.round(value).toLocaleString()}${suffix}`
}


const SQM_TO_SQFT =
  10.7639


function pricePerFt2(
  value:
    number | null
) {
  if (
    value === null ||
    Number.isNaN(
      value
    )
  ) {
    return null
  }

  return value /
    SQM_TO_SQFT
}


function decoratePriceMeterListing(
  listing:
    any,

  context: {
    analyticalDate:
      string

    fxIdentity:
      PriceMeterFxIdentity | null
  }
) {
  const analyticalIdentity =
    resolvePriceMeterAnalyticalIdentity(
      listing,
      context
    )


  const price =
    analyticalIdentity
      .price
      .analyticalAmount


  const propertyArea =
    analyticalIdentity
      .propertyArea
      .exactM2


  const constructionArea =
    analyticalIdentity
      .constructionArea
      .exactM2


  const pricePerLandM2 =
    price &&
    propertyArea
      ? price /
        propertyArea
      : null


  const pricePerConstructionM2 =
    price &&
    constructionArea
      ? price /
        constructionArea
      : null


  return {
    ...listing,

    analyticalIdentity,

    images:
      resolveListingImages(
        listing.images
      ),

    formattedPrice:
      analyticalIdentity
        .price
        .originalAmount !==
        null
        ? analyticalIdentity
            .price
            .originalCurrency ===
          'USD'
          ? formatUSD(
              analyticalIdentity
                .price
                .originalAmount
            )
          : formatCRC(
              analyticalIdentity
                .price
                .originalAmount
            )
        : null,

    pricePerLandM2:
      formatCRC(
        pricePerLandM2,
        ' / m²'
      ),

    pricePerLandFt2:
      formatCRC(
        pricePerFt2(
          pricePerLandM2
        ),
        ' / ft²'
      ),

    pricePerConstructionM2:
      formatCRC(
        pricePerConstructionM2,
        ' / m²'
      ),

    pricePerConstructionFt2:
      formatCRC(
        pricePerFt2(
          pricePerConstructionM2
        ),
        ' / ft²'
      )
  }
}


export type PriceMeterObservationLoadResult = {
  analyticalDate:
    string

  fxIdentity:
    PriceMeterFxIdentity | null

  observations:
    PriceMeterObservation[]

  listings:
    any[]
}


export async function loadPriceMeterObservations(
  filters:
    PriceMeterMarketFilters
): Promise<PriceMeterObservationLoadResult> {

  /*
   * -------------------------------------------------------
   * BOUND FIRST
   * -------------------------------------------------------
   *
   * Market filters are applied before Price / m²
   * observations are constructed.
   */

  const market =
    await getMarketStatistics(
      filters
    )


  const listings =
    market.listings ||
    []


  /*
   * -------------------------------------------------------
   * CANONICAL GEOGRAPHY
   * -------------------------------------------------------
   */

  const canonicalGeographyTerms =
    await loadCanonicalGeographyTerms(
      supabase
    )


  const listingsWithCanonicalGeography =
    listings.map(
      listing => {
        const canonicalGeography =
          resolveCanonicalGeography({
            province:
              listing.province,

            canton:
              listing.canton,

            district:
              listing.district,

            terms:
              canonicalGeographyTerms
          })


        return {
          ...listing,

          canonicalGeography
        }
      }
    )


  /*
   * -------------------------------------------------------
   * CANONICAL ANALYTICAL DATE + FX
   * -------------------------------------------------------
   */

  const analyticalDate =
    getCurrentAnalyticalDate()


  const containsUsdListings =
    listingsWithCanonicalGeography
      .some(
        listing =>
          String(
            listing.currency ??
            ''
          )
            .trim()
            .toUpperCase() ===
          'USD'
      )


  let fxIdentity:
    PriceMeterFxIdentity | null =
      null


  if (
    containsUsdListings
  ) {
    const resolvedFx =
      await getHistoricalUsdToCrcRate(
        analyticalDate
      )


    fxIdentity = {
      conversionApplied:
        true,

      analyticalDate:
        resolvedFx
          .analyticalDate,

      baseCurrency:
        'USD',

      quoteCurrency:
        'CRC',

      rate:
        resolvedFx.rate,

      rateType:
        'reference_sale',

      effectiveDate:
        resolvedFx
          .effectiveDate,

      source:
        'BCCR',

      resolutionMode:
        resolvedFx
          .resolutionMode
    }
  }


  /*
   * -------------------------------------------------------
   * CANONICAL ANALYTICAL IDENTITIES
   * -------------------------------------------------------
   */

  const decoratedListings =
    listingsWithCanonicalGeography
      .map(
        listing =>
          decoratePriceMeterListing(
            listing,
            {
              analyticalDate,
              fxIdentity
            }
          )
      )


  /*
   * -------------------------------------------------------
   * CANONICAL PRICE / M² OBSERVATIONS
   * -------------------------------------------------------
   */

  const observations =
    buildPriceMeterObservations(
      decoratedListings
    )


  return {
    analyticalDate,
    fxIdentity,
    observations,
    listings:
      decoratedListings
  }
}