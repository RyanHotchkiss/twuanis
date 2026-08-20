import { getMarketStatistics } from '@/lib/statistics-engine'

import {
  resolvePriceMeterAnalyticalIdentity
} from '@/lib/price-meter-identity'

import {
  getCurrentAnalyticalDate
} from '@/lib/analysis-date'

import {
  getHistoricalUsdToCrcRate
} from '@/lib/fx/fx-service'

import type {
  PriceMeterAnalyticalIdentity,
  PriceMeterFxIdentity
} from '@/lib/price-meter-identity'

import {
  buildPriceMeterObservations,
  type PriceMeterObservation
} from '@/lib/price-meter-observation-builder'

import {
  buildPriceMeterTransactionCohorts
} from '@/lib/price-meter-transaction-cohort'

import {
  buildPriceMeterAnalyticalCohort
} from '@/lib/price-meter-analytical-cohort'

import {
  buildPriceMeterDistribution
} from '@/lib/price-meter-distribution'

import {
  buildPriceMeterGeographicDistributions
} from '@/lib/price-meter-geographic-distribution'

import {
  createPriceMeterStatistic,
  type PriceMeterStatisticMonetaryIdentity
} from '@/lib/price-meter-statistic-identity'

import {
  resolveListingImages
} from '@/app/utils/resolveListingImages'

type PriceMeterLanguage = 'en' | 'es'

type MarketFilters = {
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

const SQM_TO_SQFT = 10.7639

function formatCRC(value: number | null, suffix = '') {
  if (value === null || Number.isNaN(value)) return null

  return `₡${Math.round(value).toLocaleString()}${suffix}`
}

function formatUSD(value: number | null, suffix = '') {
  if (value === null || Number.isNaN(value)) return null

  return `$${Math.round(value).toLocaleString()}${suffix}`
}

function average(values: number[]) {
  if (!values.length) return null

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function median(values: number[]) {
  if (!values.length) return null

  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2
  }

  return sorted[middle]
}

function lowest(values: number[]) {
  if (!values.length) return null

  return Math.min(...values)
}

function highest(values: number[]) {
  if (!values.length) return null

  return Math.max(...values)
}

function pricePerFt2(value: number | null) {
  if (value === null || Number.isNaN(value)) return null

  return value / SQM_TO_SQFT
}

function formatStatisticM2(
  statistic: {
    value:
      number | null
  }
) {
  return formatCRC(
    statistic.value,
    ' / m²'
  )
}


function formatStatisticFt2(
  statistic: {
    value:
      number | null
  }
) {
  return formatCRC(
    pricePerFt2(
      statistic.value
    ),
    ' / ft²'
  )
}

function getConfidence(
  sampleSize: number,
  language: PriceMeterLanguage
) {
  if (sampleSize >= 25) {
    return {
      score: 90,
      label:
        language === 'es'
          ? 'Confianza Alta'
          : 'High Confidence'
    }
  }

  if (sampleSize >= 15) {
    return {
      score: 75,
      label:
        language === 'es'
          ? 'Confianza Moderada'
          : 'Moderate Confidence'
    }
  }

  if (sampleSize >= 8) {
    return {
      score: 60,
      label:
        language === 'es'
          ? 'Confianza Baja'
          : 'Low Confidence'
    }
  }

  return {
    score: 35,
    label:
      language === 'es'
        ? 'Confianza Muy Baja'
        : 'Very Low Confidence'
  }
}

function decorateListing(
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

    price && propertyArea
      ? price / propertyArea
      : null

  const pricePerConstructionM2 =
    price && constructionArea
      ? price / constructionArea
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
            .originalAmount !== null
            ? analyticalIdentity
                .price
                .originalCurrency === 'USD'
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
      formatCRC(pricePerLandM2, ' / m²'),

    pricePerLandFt2:
      formatCRC(pricePerFt2(pricePerLandM2), ' / ft²'),

    pricePerConstructionM2:
      formatCRC(pricePerConstructionM2, ' / m²'),

    pricePerConstructionFt2:
      formatCRC(pricePerFt2(pricePerConstructionM2), ' / ft²')
  }
}

function resolveStatisticMonetaryIdentity(
  observations:
    PriceMeterObservation[],

  analyticalDate:
    string
): PriceMeterStatisticMonetaryIdentity {

  const uniqueFxObservations =
    new Map<
      string,
      PriceMeterStatisticMonetaryIdentity[
        'fxObservations'
      ][number]
    >()


  for (
    const observation
    of observations
  ) {

    const fx =
      observation.fx


    /*
     * Native CRC requires no external FX observation.
     */

    if (
      !fx ||
      fx.conversionApplied ===
        false
    ) {
      continue
    }


    const key =
      [
        fx.baseCurrency,
        fx.quoteCurrency,
        fx.rateType,
        fx.effectiveDate,
        fx.source,
        fx.rate
      ].join('|')


    if (
      !uniqueFxObservations.has(
        key
      )
    ) {

      uniqueFxObservations.set(
        key,
        {
          baseCurrency:
            'USD',

          quoteCurrency:
            'CRC',

          rate:
            fx.rate,

          rateType:
            'reference_sale',

          effectiveDate:
            fx.effectiveDate,

          source:
            'BCCR'
        }
      )
    }
  }


  return {
    analyticalDate,

    analyticalCurrency:
      'CRC',

    fxObservations:
      Array.from(
        uniqueFxObservations.values()
      )
  }
}

export async function getPriceMeterAnalysis(
  filters: MarketFilters,
  language: PriceMeterLanguage = 'en'
) {
  const market =
    await getMarketStatistics(
      filters
    )


  const listings =
    market.listings ||
    []


  const analyticalDate =
    getCurrentAnalyticalDate()


  const containsUsdListings =
    listings.some(
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


  const decoratedListings =
    listings.map(
      listing =>
        decorateListing(
          listing,
          {
            analyticalDate,
            fxIdentity
          }
        )
    )


   const observations =
    buildPriceMeterObservations(
      decoratedListings
    )

    const transactionCohorts =
      buildPriceMeterTransactionCohorts(
        observations
      )


    const saleVacantLandCohort =
      buildPriceMeterAnalyticalCohort({
        transactionCohort:
          transactionCohorts.sale,

        propertyBasis:
          'land_only',

        normalizationBasis:
          'land'
      })


    const saleImprovedLandCohort =
      buildPriceMeterAnalyticalCohort({
        transactionCohort:
          transactionCohorts.sale,

        propertyBasis:
          'improved_property',

        normalizationBasis:
          'land'
      })


    const saleImprovedConstructionCohort =
      buildPriceMeterAnalyticalCohort({
        transactionCohort:
          transactionCohorts.sale,

        propertyBasis:
          'improved_property',

        normalizationBasis:
          'construction'
      })

    const saleVacantLandDistribution =
      buildPriceMeterDistribution(
        saleVacantLandCohort
      )


    const saleImprovedLandDistribution =
      buildPriceMeterDistribution(
        saleImprovedLandCohort
      )


    const saleImprovedConstructionDistribution =
      buildPriceMeterDistribution(
        saleImprovedConstructionCohort
      )

    const saleVacantLandGeography =
      buildPriceMeterGeographicDistributions({
        observations:
          saleVacantLandCohort.observations,

        transactionType:
          'sale'
      })


    const saleImprovedLandGeography =
      buildPriceMeterGeographicDistributions({
        observations:
          saleImprovedLandCohort.observations,

        transactionType:
          'sale'
      })


    const saleImprovedConstructionGeography =
      buildPriceMeterGeographicDistributions({
        observations:
          saleImprovedConstructionCohort.observations,

        transactionType:
          'sale'
      })

    const rentVacantLandCohort =
      buildPriceMeterAnalyticalCohort({
        transactionCohort:
          transactionCohorts.rent,

        propertyBasis:
          'land_only',

        normalizationBasis:
          'land'
      })


    const rentImprovedLandCohort =
      buildPriceMeterAnalyticalCohort({
        transactionCohort:
          transactionCohorts.rent,

        propertyBasis:
          'improved_property',

        normalizationBasis:
          'land'
      })


    const rentImprovedConstructionCohort =
      buildPriceMeterAnalyticalCohort({
        transactionCohort:
          transactionCohorts.rent,

        propertyBasis:
          'improved_property',

        normalizationBasis:
          'construction'
      })


    const saleVacantLandObservations =
      saleVacantLandCohort.observations


    const saleImprovedLandObservations =
      saleImprovedLandCohort.observations


    const saleImprovedConstructionObservations =
      saleImprovedConstructionCohort.observations


    const rentVacantLandObservations =
      rentVacantLandCohort.observations


    const rentImprovedLandObservations =
      rentImprovedLandCohort.observations


    const rentImprovedConstructionObservations =
      rentImprovedConstructionCohort.observations

    const saleVacantLandPrices =
    saleVacantLandObservations.map(
      observation =>
        observation.pricePerM2
    )


  const saleImprovedLandPrices =
    saleImprovedLandObservations.map(
      observation =>
        observation.pricePerM2
    )


  const saleImprovedConstructionPrices =
    saleImprovedConstructionObservations.map(
      observation =>
        observation.pricePerM2
    )


  const rentVacantLandPrices =
    rentVacantLandObservations.map(
      observation =>
        observation.pricePerM2
    )


  const rentImprovedLandPrices =
    rentImprovedLandObservations.map(
      observation =>
        observation.pricePerM2
    )


  const rentImprovedConstructionPrices =
    rentImprovedConstructionObservations.map(
      observation =>
        observation.pricePerM2
    )

  /*
   * -------------------------------------------------------
   * TEMPORARY LEGACY SUMMARY BRIDGE
   * -------------------------------------------------------
   *
   * The existing result component expects one land
   * population and one construction population.
   *
   * Until the result shape is redesigned, choose the
   * population matching the selected transaction filter.
   *
   * IMPORTANT:
   * Sale and Rent are NEVER combined.
   */

  const selectedTransactionType =
  filters.transaction_type === 'sale'
    ? 'sale'
    : filters.transaction_type === 'rent'
      ? 'rent'
      : null

      if (
      selectedTransactionType ===
        null
    ) {
      throw new Error(
        'Price / m² analysis requires an explicit Sale or Rent transaction type.'
      )
    }

    const selectedGeography = {
    province:
      filters.province ??
      null,

    canton:
      filters.canton ??
      null,

    district:
      filters.district ??
      null
  }

    const landPrices =
    selectedTransactionType === 'rent'
      ? rentImprovedLandPrices
      : saleImprovedLandPrices


  const constructionPrices =
    selectedTransactionType === 'rent'
      ? rentImprovedConstructionPrices
      : saleImprovedConstructionPrices


  const averageLandM2 =
    average(
      landPrices
    )


  const medianLandM2 =
    median(
      landPrices
    )


  const averageConstructionM2 =
    average(
      constructionPrices
    )


  const medianConstructionM2 =
    median(
      constructionPrices
    )


  const lowestLandM2 =
    lowest(
      landPrices
    )


  const highestLandM2 =
    highest(
      landPrices
    )


  const lowestConstructionM2 =
    lowest(
      constructionPrices
    )


  const highestConstructionM2 =
    highest(
      constructionPrices
    )


    const selectedLandObservations =
    selectedTransactionType === 'rent'
      ? rentImprovedLandObservations
      : saleImprovedLandObservations


  const selectedConstructionObservations =
    selectedTransactionType === 'rent'
      ? rentImprovedConstructionObservations
      : saleImprovedConstructionObservations


  const sampleListingIds =
    new Set(
      [
        ...selectedLandObservations,
        ...selectedConstructionObservations
      ]
        .map(
          observation =>
            observation.listingId
        )
        .filter(
          (
            listingId
          ): listingId is string =>
            listingId !== null
        )
    )


  const sampleSize =
    sampleListingIds.size

  const landConfidence =
    getConfidence(
      selectedLandObservations.length,
      language
    )


  const constructionConfidence =
    getConfidence(
      selectedConstructionObservations.length,
      language
    )

  const landMonetaryIdentity =
  resolveStatisticMonetaryIdentity(
    selectedLandObservations,
    analyticalDate
  )


const constructionMonetaryIdentity =
  resolveStatisticMonetaryIdentity(
    selectedConstructionObservations,
    analyticalDate
  )

  const landStatistics = {
    average:
      createPriceMeterStatistic({
        statistic:
          'average',

        value:
          averageLandM2,

        transactionType:
          selectedTransactionType,

        propertyBasis:
          'improved_property',

        normalizationBasis:
          'land',

        geography:
          selectedGeography,

        monetary:
          landMonetaryIdentity,

        sampleSize:
          selectedLandObservations.length,

        confidence:
          landConfidence
      }),

    median:
      createPriceMeterStatistic({
        statistic:
          'median',

        value:
          medianLandM2,

        transactionType:
          selectedTransactionType,

        propertyBasis:
          'improved_property',

        normalizationBasis:
          'land',

        geography:
          selectedGeography,

        monetary:
          landMonetaryIdentity,

        sampleSize:
          selectedLandObservations.length,

        confidence:
          landConfidence
      }),

    lowest:
      createPriceMeterStatistic({
        statistic:
          'lowest',

        value:
          lowestLandM2,

        transactionType:
          selectedTransactionType,

        propertyBasis:
          'improved_property',

        normalizationBasis:
          'land',

        geography:
          selectedGeography,

        monetary:
          landMonetaryIdentity,

        sampleSize:
          selectedLandObservations.length,

        confidence:
          landConfidence
      }),

    highest:
      createPriceMeterStatistic({
        statistic:
          'highest',

        value:
          highestLandM2,

        transactionType:
          selectedTransactionType,

        propertyBasis:
          'improved_property',

        normalizationBasis:
          'land',

        geography:
          selectedGeography,

        monetary:
          landMonetaryIdentity,

        sampleSize:
          selectedLandObservations.length,

        confidence:
          landConfidence
      })
  }


  const constructionStatistics = {
    average:
      createPriceMeterStatistic({
        statistic:
          'average',

        value:
          averageConstructionM2,

        transactionType:
          selectedTransactionType,

        propertyBasis:
          'improved_property',

        normalizationBasis:
          'construction',

        geography:
          selectedGeography,

        monetary:
          constructionMonetaryIdentity,

        sampleSize:
          selectedConstructionObservations.length,

        confidence:
          constructionConfidence
      }),

    median:
      createPriceMeterStatistic({
        statistic:
          'median',

        value:
          medianConstructionM2,

        transactionType:
          selectedTransactionType,

        propertyBasis:
          'improved_property',

        normalizationBasis:
          'construction',

        geography:
          selectedGeography,

        monetary:
          constructionMonetaryIdentity,

        sampleSize:
          selectedConstructionObservations.length,

        confidence:
          constructionConfidence
      }),

    lowest:
      createPriceMeterStatistic({
        statistic:
          'lowest',

        value:
          lowestConstructionM2,

        transactionType:
          selectedTransactionType,

        propertyBasis:
          'improved_property',

        normalizationBasis:
          'construction',

        geography:
          selectedGeography,

        monetary:
          constructionMonetaryIdentity,

        sampleSize:
          selectedConstructionObservations.length,

        confidence:
          constructionConfidence
      }),

    highest:
      createPriceMeterStatistic({
        statistic:
          'highest',

        value:
          highestConstructionM2,

        transactionType:
          selectedTransactionType,

        propertyBasis:
          'improved_property',

        normalizationBasis:
          'construction',

        geography:
          selectedGeography,

        monetary:
          constructionMonetaryIdentity,

        sampleSize:
          selectedConstructionObservations.length,

        confidence:
          constructionConfidence
      })
  }

  return {
    filters,

    saleIntelligence: {
      distributions: {
        vacantLandLandNormalized:
          saleVacantLandDistribution,

        improvedLandNormalized:
          saleImprovedLandDistribution,

        improvedConstructionNormalized:
          saleImprovedConstructionDistribution
      },

      geography: {
        vacantLandLandNormalized:
          saleVacantLandGeography,

        improvedLandNormalized:
          saleImprovedLandGeography,

        improvedConstructionNormalized:
          saleImprovedConstructionGeography
      }
    },

    summary: {
      /*
      * PRESENTATION COMPATIBILITY VIEW
      *
      * These fields are retained only because the existing
      * Price / m² result components consume this shape.
      *
      * They MUST NOT perform or own analytical calculations.
      * Every displayed statistic is projected from the
      * canonical identified statistic above.
      */

      averagePricePerLandM2:
        formatStatisticM2(
          landStatistics.average
        ),

      averagePricePerLandFt2:
        formatStatisticFt2(
          landStatistics.average
        ),

      medianPricePerLandM2:
        formatStatisticM2(
          landStatistics.median
        ),

      medianPricePerLandFt2:
        formatStatisticFt2(
          landStatistics.median
        ),

      averagePricePerConstructionM2:
        formatStatisticM2(
          constructionStatistics.average
        ),

      averagePricePerConstructionFt2:
        formatStatisticFt2(
          constructionStatistics.average
        ),

      medianPricePerConstructionM2:
        formatStatisticM2(
          constructionStatistics.median
        ),

      medianPricePerConstructionFt2:
        formatStatisticFt2(
          constructionStatistics.median
        ),

      averageMixedPricePerLandM2:
        null,

      averageMixedPricePerLandFt2:
        null,

      medianMixedPricePerLandM2:
        null,

      medianMixedPricePerLandFt2:
        null,

      averageMixedPricePerConstructionM2:
        null,

      averageMixedPricePerConstructionFt2:
        null,

      medianMixedPricePerConstructionM2:
        null,

      medianMixedPricePerConstructionFt2:
        null,

      averageMixedConstructionToLandRatio:
        null,

      medianMixedConstructionToLandRatio:
        null,

      landOnlySampleSize:
        landStatistics.median
          .identity
          .sampleSize,

      constructionOnlySampleSize:
        constructionStatistics.median
          .identity
          .sampleSize,

      mixedSampleSize:
        0
    },

    breakdown: {
      /*
      * PRESENTATION COMPATIBILITY VIEW
      *
      * Lowest/highest values are projections of canonical
      * PriceMeterStatistic objects and therefore cannot
      * bypass Statistic Identity.
      */

      lowestPricePerLandM2:
        formatStatisticM2(
          landStatistics.lowest
        ),

      lowestPricePerLandFt2:
        formatStatisticFt2(
          landStatistics.lowest
        ),

      highestPricePerLandM2:
        formatStatisticM2(
          landStatistics.highest
        ),

      highestPricePerLandFt2:
        formatStatisticFt2(
          landStatistics.highest
        ),

      lowestPricePerConstructionM2:
        formatStatisticM2(
          constructionStatistics.lowest
        ),

      lowestPricePerConstructionFt2:
        formatStatisticFt2(
          constructionStatistics.lowest
        ),

      highestPricePerConstructionM2:
        formatStatisticM2(
          constructionStatistics.highest
        ),

      highestPricePerConstructionFt2:
        formatStatisticFt2(
          constructionStatistics.highest
        ),

      lowestMixedPricePerLandM2:
        null,

      lowestMixedPricePerLandFt2:
        null,

      highestMixedPricePerLandM2:
        null,

      highestMixedPricePerLandFt2:
        null,

      lowestMixedPricePerConstructionM2:
        null,

      lowestMixedPricePerConstructionFt2:
        null,

      highestMixedPricePerConstructionM2:
        null,

      highestMixedPricePerConstructionFt2:
        null
    },

    confidence:
      landStatistics.median
        .identity
        .confidence,

    sampleSize:
      sampleListingIds.size,

    statistics: {
      land:
        landStatistics,

      construction:
        constructionStatistics
    },

    observations,

    listings:
      decoratedListings
  }
}