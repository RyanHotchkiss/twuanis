import 'server-only'
import {validateDistributionIdentity,type PriceMeterDistributionIdentity} from './price-meter-selected-contract'
import {
  loadCanonicalMarketObservationRows
} from '@/lib/canonical-market-observation-rows'

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

import { loadLegacyGeographyDictionary } from '@/lib/canonical-population'

import {
  resolveCanonicalGeography
} from '@/lib/geography/canonical-geography'





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


function decoratePriceMeterListing(listing:any, context:{analyticalDate:string;fxIdentity:PriceMeterFxIdentity|null}) {
  return {...listing,analyticalIdentity:resolvePriceMeterAnalyticalIdentity(listing,context)}
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
    PriceMeterMarketFilters,
  selectedIdentity?: PriceMeterDistributionIdentity
): Promise<PriceMeterObservationLoadResult> {

  /*
   * -------------------------------------------------------
   * BOUND FIRST
   * -------------------------------------------------------
   *
   * Market filters are applied before Price / m²
   * observations are constructed.
   */

  const scope=selectedIdentity===undefined?undefined:validateDistributionIdentity(selectedIdentity)

  const listings =
    await loadCanonicalMarketObservationRows(filters)


  /*
   * -------------------------------------------------------
   * CANONICAL GEOGRAPHY
   * -------------------------------------------------------
   */

  const canonicalGeographyTerms = await loadLegacyGeographyDictionary(
    listings.filter(listing=>listing.canonical_domain_version!==1).map(listing=>listing.id)
  )


  const listingsWithCanonicalGeography =
    listings.map(
      listing => {
        if (listing.canonical_domain_version === 1) {
          if (!listing.canonicalGeography) throw new Error('Missing canonical geography evidence.')
          return listing
        }
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
      scope?decoratedListings.filter(listing=>listing.analyticalIdentity.propertyBasis===scope.propertyBasis):decoratedListings,
      scope?.normalizationBasis
    )


  return {
    analyticalDate,
    fxIdentity,
    observations,
    listings:
      decoratedListings
  }
}