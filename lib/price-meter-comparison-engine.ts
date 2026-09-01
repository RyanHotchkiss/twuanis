import {
  getCurrentAnalyticalDate
} from '@/lib/analysis-date'

import {
  getHistoricalUsdToCrcRate
} from '@/lib/fx/fx-service'

import {
  resolvePriceMeterAnalyticalIdentity
} from '@/lib/price-meter-identity'

import type {
  PriceMeterFxIdentity
} from '@/lib/price-meter-identity'

import {
  buildPriceMeterObservations
} from '@/lib/price-meter-observation-builder'

import {
  buildPriceMeterTransactionCohorts
} from '@/lib/price-meter-transaction-cohort'

import {
  buildPriceMeterAnalyticalCohort
} from '@/lib/price-meter-analytical-cohort'

import {
  loadCanonicalGeographyTerms
} from '@/lib/geography/resolve-listing-geography'

import {
  resolveCanonicalGeography
} from '@/lib/geography/canonical-geography'

import {
  loadPriceMeterComparisonCandidates
} from '@/lib/price-meter-comparison-candidate-loader'

import {
  buildPriceMeterComparison
} from '@/lib/price-meter-comparison-orchestrator'

import {
  validatePriceMeterComparisonRequest
} from '@/lib/price-meter-comparison-request'

import type {
  PriceMeterComparisonRequest
} from '@/lib/price-meter-comparison-request'

import type {
  PriceMeterConfidenceLanguage
} from '@/lib/price-meter-confidence'

import { supabase } from '@/lib/supabase'


export async function getPriceMeterComparisonAnalysis({
  request,
  language = 'en'
}: {
  request:
    PriceMeterComparisonRequest

  language?:
    PriceMeterConfidenceLanguage
}) {
  validatePriceMeterComparisonRequest(
    request
  )

  const candidates =
    await loadPriceMeterComparisonCandidates(
      request
    )

  const analyticalDate =
    getCurrentAnalyticalDate()

  const containsUsdListings =
    candidates.some(
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
        resolvedFx.analyticalDate,

      baseCurrency:
        'USD',

      quoteCurrency:
        'CRC',

      rate:
        resolvedFx.rate,

      rateType:
        'reference_sale',

      effectiveDate:
        resolvedFx.effectiveDate,

      source:
        'BCCR',

      resolutionMode:
        resolvedFx.resolutionMode
    }
  }

  const canonicalGeographyTerms =
    await loadCanonicalGeographyTerms(
      supabase
    )

  const analyticallyDecoratedCandidates =
    candidates.map(
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

        const analyticalIdentity =
          resolvePriceMeterAnalyticalIdentity(
            listing,
            {
              analyticalDate,
              fxIdentity
            }
          )

        return {
          ...listing,
          canonicalGeography,
          analyticalIdentity
        }
      }
    )

  const observations =
    buildPriceMeterObservations(
      analyticallyDecoratedCandidates
    )

  const transactionCohorts =
    buildPriceMeterTransactionCohorts(
      observations
    )

  const transactionCohort =
    transactionCohorts[
      request.transactionType
    ]

  const analyticalCohort =
    buildPriceMeterAnalyticalCohort({
      transactionCohort,

      propertyBasis:
        request.propertyBasis,

      normalizationBasis:
        request.normalizationBasis
    })

  const comparison =
    await buildPriceMeterComparison({
      analyticalCohort,

      cohortA:
        request.cohortA,

      cohortB:
        request.cohortB,

      referenceCohort:
        request.referenceCohort,

      language
    })

  return {
    request,

    analyticalIdentity: {
      transactionType:
        request.transactionType,

      propertyBasis:
        request.propertyBasis,

      normalizationBasis:
        request.normalizationBasis,

      analyticalCurrency:
        'CRC' as const,

      analyticalDate
    },

    candidateListingCount:
      candidates.length,

    analyticalObservationCount:
      analyticalCohort
        .observations
        .length,

    comparison
  }
}