import 'server-only'

import type {
  PriceMeterComparableDimension
} from '@/lib/price-meter-comparable-dimensions'


/*
 * ---------------------------------------------------------
 * PRICE / M² COMPARABLE POPULATION TRAIL
 * ---------------------------------------------------------
 *
 * Records the numerical population consequence of each
 * active Phase 12A tightening dimension.
 *
 * Example:
 *
 * Bedrooms
 * 47 → 31 listings
 *
 * Bathrooms
 * 31 → 22 listings
 *
 * This layer reports evidence only.
 */


export type PriceMeterComparablePopulationTrailStep = {
  dimension:
    PriceMeterComparableDimension

  beforeCount:
    number

  afterCount:
    number

  removedCount:
    number
}


export type PriceMeterComparablePopulationTrail = {
  basePopulationCount:
    number

  steps:
    PriceMeterComparablePopulationTrailStep[]

  finalPopulationCount:
    number
}


export function buildPriceMeterComparablePopulationTrail({
  basePopulationCount,
  steps
}: {
  basePopulationCount:
    number

  steps:
    Array<{
      dimension:
        PriceMeterComparableDimension

      beforeCount:
        number

      afterCount:
        number
    }>
}): PriceMeterComparablePopulationTrail {

  if (
    !Number.isInteger(
      basePopulationCount
    ) ||
    basePopulationCount <
      0
  ) {
    throw new Error(
      'Phase 12A base population count must be a non-negative integer.'
    )
  }


    let expectedBeforeCount =
    basePopulationCount


  const seenDimensions =
    new Set<
      PriceMeterComparableDimension
    >()


  const normalizedSteps =
    steps.map(
      step => {

                if (
          seenDimensions.has(
            step.dimension
          )
        ) {
          throw new Error(
            `Phase 12A population trail contains duplicate dimension: ${step.dimension}.`
          )
        }


        seenDimensions.add(
          step.dimension
        )

        if (
          !Number.isInteger(
            step.beforeCount
          ) ||
          !Number.isInteger(
            step.afterCount
          ) ||
          step.beforeCount <
            0 ||
          step.afterCount <
            0
        ) {
          throw new Error(
            'Phase 12A population trail counts must be non-negative integers.'
          )
        }


        if (
          step.beforeCount !==
            expectedBeforeCount
        ) {
          throw new Error(
            'Phase 12A population trail is not sequential.'
          )
        }


        if (
          step.afterCount >
            step.beforeCount
        ) {
          throw new Error(
            'A Phase 12A tightening dimension cannot increase population.'
          )
        }


        const normalizedStep:
          PriceMeterComparablePopulationTrailStep = {
            dimension:
              step.dimension,

            beforeCount:
              step.beforeCount,

            afterCount:
              step.afterCount,

            removedCount:
              step.beforeCount -
              step.afterCount
          }


        expectedBeforeCount =
          step.afterCount


        return normalizedStep
      }
    )


  return {
    basePopulationCount,

    steps:
      normalizedSteps,

    finalPopulationCount:
      expectedBeforeCount
  }
}