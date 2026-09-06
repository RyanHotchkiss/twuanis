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

    medianDifferenceFromSelectedMarket:
    number | null

  medianPercentAboveOrBelowSelectedMarket:
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

          confidence:
            resolveGeographicConfidence(
              geographicDistribution
                .distribution
                .sampleSize
            ),

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
