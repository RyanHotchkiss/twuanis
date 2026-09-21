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


    medianDifferenceFromSelectedMarket:
    number | null

  medianPercentAboveOrBelowSelectedMarket:
    number | null
}








/*
 * ---------------------------------------------------------
 * DIFFERENCE FROM SELECTED MARKET
 * ---------------------------------------------------------
 *
 * This compares the child's median Price / m² against
 * the median Price / m² of the selected market.
 *
 * Positive:
 *   child geography is above selected-market median.
 *
 * Negative:
 *   child geography is below selected-market median.
 *
 * Zero:
 *   child geography equals selected-market median.
 */


function calculateMedianDifference({
  childMedian,
  selectedMarketMedian
}: {
  childMedian:
    number | null

  selectedMarketMedian:
    number | null
}): {
  absolute:
    number | null

  percent:
    number | null
} {

  if (
    childMedian ===
      null ||
    selectedMarketMedian ===
      null ||
    !Number.isFinite(
      childMedian
    ) ||
    !Number.isFinite(
      selectedMarketMedian
    ) ||
    selectedMarketMedian <=
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
    childMedian -
    selectedMarketMedian


  const percent =
    (
      absolute /
      selectedMarketMedian
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
          calculateMedianDifference({
            childMedian:
              geographicDistribution
                .distribution
                .median,

            selectedMarketMedian:
              selectedMarketDistribution
                .median
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


          medianDifferenceFromSelectedMarket:
            difference.absolute,

          medianPercentAboveOrBelowSelectedMarket:
            difference.percent
        }
      }
    )


    /*
   * -------------------------------------------------------
   * GEOGRAPHIC RANKING
   * -------------------------------------------------------
   *
   * Rank geographic cohorts by median Price / m²,
   * highest first.
   *
   * Null medians sort last.
   *
   * Ranking uses the same statistic as the above/below
   * selected-market comparison so the relationship and
   * ordering cannot contradict one another.
   */


  statistics.sort(
    (a, b) => {

      const aMedian =
        a.distribution.median

      const bMedian =
        b.distribution.median


      if (
        aMedian ===
          null &&
        bMedian ===
          null
      ) {

        return 0
      }


      if (
        aMedian ===
          null
      ) {

        return 1
      }


      if (
        bMedian ===
          null
      ) {

        return -1
      }


      return (
        bMedian -
        aMedian
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
