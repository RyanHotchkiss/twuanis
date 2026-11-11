import 'server-only'
import { consumePriceMeterComparisonPermit, type PriceMeterComparisonPermit } from '@/lib/price-meter-comparison-permit'
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





export async function getPriceMeterComparisonAnalysis({
  request,
  language = 'en',
  permit
}: {
  request:
    PriceMeterComparisonRequest

  language?:
    'en' | 'es'
  permit?: PriceMeterComparisonPermit
}) {
  consumePriceMeterComparisonPermit(permit, request, language)
  validatePriceMeterComparisonRequest(
    request
  )

  const { listings: candidates, memberships } =
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

  const analyticallyDecoratedCandidates = candidates.map(listing => {
        if (!listing.canonicalGeography) throw new Error('Missing canonical comparison geography.')
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
          canonicalGeography: listing.canonicalGeography,
          analyticalIdentity
        }
      }
    )

  const observations =
    buildPriceMeterObservations(
      analyticallyDecoratedCandidates.filter(listing =>
        listing.analyticalIdentity.transactionType === request.transactionType &&
        listing.analyticalIdentity.propertyBasis === request.propertyBasis
      ),
      request.normalizationBasis
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
      memberships,

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
    fxIdentity,

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
