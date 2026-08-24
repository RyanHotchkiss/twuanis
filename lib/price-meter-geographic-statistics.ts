import type {
  PriceMeterTransactionType
} from '@/lib/price-meter-transaction-cohort'

import type {
  PriceMeterDistribution
} from '@/lib/price-meter-distribution'

import type {
  PriceMeterGeographicDistribution,
  PriceMeterGeographicIdentity,
  PriceMeterGeographyLevel
} from '@/lib/price-meter-geographic-distribution'


export type PriceMeterGeographicConfidence = {
  score:
    number

  label:
    | 'very_low'
    | 'low'
    | 'moderate'
    | 'high'
}


export type PriceMeterGeographicStatistic<
  T extends PriceMeterTransactionType
> = {
  rank:
    number

  level:
    PriceMeterGeographyLevel

  geography:
    PriceMeterGeographicIdentity

  distribution:
    PriceMeterDistribution<T>

  confidence:
    PriceMeterGeographicConfidence

  averageDifferenceFromSelectedMarket:
    number | null

  averagePercentAboveOrBelowSelectedMarket:
    number | null
}


/*
 * ---------------------------------------------------------
 * CONFIDENCE
 * ---------------------------------------------------------
 *
 * Geographic confidence is based on the number of valid
 * Price / m² observations inside the geographic cohort.
 *
 * This intentionally uses the same sample-size thresholds
 * currently used by the Price / m² engine:
 *
 * 25+ = high
 * 15+ = moderate
 * 8+  = low
 * <8  = very low
 */


function resolveGeographicConfidence(
  sampleSize:
    number
): PriceMeterGeographicConfidence {

  if (
    sampleSize >=
      25
  ) {

    return {
      score:
        90,

      label:
        'high'
    }
  }


  if (
    sampleSize >=
      15
  ) {

    return {
      score:
        75,

      label:
        'moderate'
    }
  }


  if (
    sampleSize >=
      8
  ) {

    return {
      score:
        60,

      label:
        'low'
    }
  }


  return {
    score:
      35,

    label:
      'very_low'
  }
}


/*
 * ---------------------------------------------------------
 * DIFFERENCE FROM SELECTED MARKET
 * ---------------------------------------------------------
 *
 * This compares the child's average Price / m² against
 * the average Price / m² of the selected market.
 *
 * Positive:
 *   child geography is above selected-market average.
 *
 * Negative:
 *   child geography is below selected-market average.
 *
 * Zero:
 *   child geography equals selected-market average.
 */


function calculateAverageDifference({
  childAverage,
  selectedMarketAverage
}: {
  childAverage:
    number | null

  selectedMarketAverage:
    number | null
}): {
  absolute:
    number | null

  percent:
    number | null
} {

  if (
    childAverage ===
      null ||
    selectedMarketAverage ===
      null ||
    !Number.isFinite(
      childAverage
    ) ||
    !Number.isFinite(
      selectedMarketAverage
    ) ||
    selectedMarketAverage <=
      0
  ) {

    return {
      absolute:
        null,

      percent:
        null
    }
  }


  const absolute =
    childAverage -
    selectedMarketAverage


  const percent =
    (
      absolute /
      selectedMarketAverage
    ) *
    100


  return {
    absolute,

    percent
  }
}


/*
 * ---------------------------------------------------------
 * GEOGRAPHIC STATISTICS
 * ---------------------------------------------------------
 *
 * The selected-market distribution and every child
 * geographic distribution MUST already belong to the same
 * analytical cohort.
 *
 * Therefore this layer never combines:
 *
 * Sale + Rent
 * Vacant Land + Improved Property
 * Land-normalized + Construction-normalized
 *
 * It consumes distributions already produced inside those
 * analytical boundaries.
 */


export function buildPriceMeterGeographicStatistics<
  T extends PriceMeterTransactionType
>({
  selectedMarketDistribution,
  geographicDistributions,
  comparisonLevel
}: {
  selectedMarketDistribution:
    PriceMeterDistribution<T>

  geographicDistributions:
    PriceMeterGeographicDistribution<T>[]

  comparisonLevel:
    PriceMeterGeographyLevel
}):
  PriceMeterGeographicStatistic<T>[] {

  /*
   * Defensive transaction invariant.
   */

  if (
    geographicDistributions.some(
      geographicDistribution =>
        geographicDistribution
          .distribution
          .transactionType !==
        selectedMarketDistribution
          .transactionType
    )
  ) {

    throw new Error(
      'Price / m² geographic statistics contain mixed Sale/Rent distributions.'
    )
  }


  /*
   * Defensive geographic-level invariant.
   */

  if (
    geographicDistributions.some(
      geographicDistribution =>
        geographicDistribution.level !==
          comparisonLevel
    )
  ) {

    throw new Error(
      'Price / m² geographic statistics contain an unexpected geographic comparison level.'
    )
  }


  const statistics =
    geographicDistributions.map(
      geographicDistribution => {

        const difference =
          calculateAverageDifference({
            childAverage:
              geographicDistribution
                .distribution
                .average,

            selectedMarketAverage:
              selectedMarketDistribution
                .average
          })


        return {
          rank:
            0,

          level:
            geographicDistribution
              .level,

          geography:
            geographicDistribution
              .geography,

          distribution:
            geographicDistribution
              .distribution,

          confidence:
            resolveGeographicConfidence(
              geographicDistribution
                .distribution
                .sampleSize
            ),

          averageDifferenceFromSelectedMarket:
            difference.absolute,

          averagePercentAboveOrBelowSelectedMarket:
            difference.percent
        }
      }
    )


  /*
   * -------------------------------------------------------
   * GEOGRAPHIC RANKING
   * -------------------------------------------------------
   *
   * Rank geographic cohorts by average Price / m²,
   * highest first.
   *
   * Null averages sort last.
   *
   * Ranking uses the same statistic as the above/below
   * selected-market comparison so the relationship and
   * ordering cannot contradict one another.
   */


  statistics.sort(
    (a, b) => {

      const aAverage =
        a.distribution.average

      const bAverage =
        b.distribution.average


      if (
        aAverage ===
          null &&
        bAverage ===
          null
      ) {

        return 0
      }


      if (
        aAverage ===
          null
      ) {

        return 1
      }


      if (
        bAverage ===
          null
      ) {

        return -1
      }


      return (
        bAverage -
        aAverage
      )
    }
  )


  return statistics.map(
    (
      statistic,
      index
    ) => ({
      ...statistic,

      rank:
        index + 1
    })
  )
}
