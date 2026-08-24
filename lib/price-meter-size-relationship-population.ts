import type {
  PriceMeterAnalyticalCohort
} from '@/lib/price-meter-analytical-cohort'

import type {
  PriceMeterTransactionType
} from '@/lib/price-meter-transaction-cohort'

import {
  PROPERTY_AREA_RANGE_OPTIONS,
  CONSTRUCTION_AREA_RANGE_OPTIONS,
  matchesPropertyAreaConstraint,
  matchesConstructionAreaConstraint
} from '@/lib/market-intelligence-area-ranges'

import {
  getPriceMeterSizeRelationshipDefinition,
  type PriceMeterSizeRelationshipKind
} from '@/lib/price-meter-size-relationship'

import {
  buildPriceMeterDistribution
} from '@/lib/price-meter-distribution'

import type {
  PriceMeterSizeRelationshipCoordinate
} from '@/lib/price-meter-size-relationship-math'


export type PriceMeterSizeRelationshipBand = {
  range:
    string

  label:
    string

  observationCount:
    number

  medianExactArea:
    number | null

  medianNormalizedRatio:
    number | null
}


export type PriceMeterSizeRelationshipPopulation = {
  relationshipKind:
    PriceMeterSizeRelationshipKind

  bands:
    PriceMeterSizeRelationshipBand[]

  populatedBands:
    PriceMeterSizeRelationshipBand[]

  coordinates:
    PriceMeterSizeRelationshipCoordinate[]

  representedObservationCount:
    number
}


function median(
  values:
    number[]
): number | null {

  if (
    values.length === 0
  ) {
    return null
  }


  const sorted =
    [...values]
      .sort(
        (a, b) =>
          a - b
      )


  const middle =
    Math.floor(
      sorted.length / 2
    )


  if (
    sorted.length %
      2 ===
      0
  ) {

    return (
      sorted[
        middle - 1
      ] +
      sorted[
        middle
      ]
    ) / 2
  }


  return sorted[
    middle
  ]
}


export function buildPriceMeterSizeRelationshipPopulation<
  T extends PriceMeterTransactionType
>({
  cohort,
  relationshipKind
}: {
  cohort:
    PriceMeterAnalyticalCohort<T>

  relationshipKind:
    PriceMeterSizeRelationshipKind
}): PriceMeterSizeRelationshipPopulation {

  const definition =
    getPriceMeterSizeRelationshipDefinition(
      relationshipKind
    )


  /*
   * -------------------------------------------------------
   * SEMANTIC INVARIANT
   * -------------------------------------------------------
   *
   * Observation.areaM2 is normalization-aware:
   *
   * land normalization
   *   → exact property area
   *
   * construction normalization
   *   → exact construction area
   *
   * Therefore the analytical cohort normalization MUST
   * match the relationship definition before areaM2 can
   * be used as the relationship coordinate.
   */

  if (
    cohort.normalizationBasis !==
      definition.normalizationBasis
  ) {
    throw new Error(
      'Price / m² size relationship cohort normalization does not match relationship identity.'
    )
  }


  if (
    cohort.propertyBasis !==
      'improved_property'
  ) {
    throw new Error(
      'Price / m² size relationships require an Improved Property analytical cohort.'
    )
  }


  const rangeOptions =
    definition.areaBasis ===
      'construction'
      ? CONSTRUCTION_AREA_RANGE_OPTIONS
      : PROPERTY_AREA_RANGE_OPTIONS


  const bands =
    rangeOptions.map(
      option => {

        const observations =
          cohort
            .observations
            .filter(
              observation =>
                definition.areaBasis ===
                  'construction'
                  ? matchesConstructionAreaConstraint(
                      observation.areaM2,
                      option.value
                    )
                  : matchesPropertyAreaConstraint(
                      observation.areaM2,
                      option.value
                    )
            )


        /*
         * Preserve the complete analytical cohort identity
         * while calculating this band's distribution.
         */

        const bandCohort:
          PriceMeterAnalyticalCohort<T> = {
            transactionType:
              cohort.transactionType,

            propertyBasis:
              cohort.propertyBasis,

            normalizationBasis:
              cohort.normalizationBasis,

            observations
          }


        const distribution =
          buildPriceMeterDistribution(
            bandCohort
          )


        const medianExactArea =
          median(
            observations.map(
              observation =>
                observation.areaM2
            )
          )


        return {
          range:
            option.value,

          label:
            option.label,

          observationCount:
            observations.length,

          medianExactArea,

          medianNormalizedRatio:
            distribution.median
        }
      }
    )


  const populatedBands =
    bands.filter(
      band =>
        band.observationCount >
          0 &&
        band.medianExactArea !==
          null &&
        band.medianNormalizedRatio !==
          null
    )


  const coordinates =
    populatedBands.map(
      band => ({
        area:
          band.medianExactArea as number,

        ratio:
          band.medianNormalizedRatio as number
      })
    )


  const representedObservationCount =
    populatedBands.reduce(
      (
        total,
        band
      ) =>
        total +
        band.observationCount,
      0
    )


  return {
    relationshipKind,

    bands,

    populatedBands,

    coordinates,

    representedObservationCount
  }
}
