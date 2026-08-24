import type {
  PriceMeterTransactionType
} from '@/lib/price-meter-transaction-cohort'

import type {
  PriceMeterGeographicStatistic
} from '@/lib/price-meter-geographic-statistics'

import type {
  PriceMeterGeographicScope
} from '@/lib/price-meter-geographic-scope'

import type {
  CanonicalGeographyTerm
} from '@/lib/geography/canonical-geography'


export type PriceMeterGeographicConclusionLanguage =
  | 'en'
  | 'es'


export type PriceMeterGeographicConclusion<
  T extends PriceMeterTransactionType
> = {
  scope:
    PriceMeterGeographicScope

  highestPriceGeography:
    PriceMeterGeographicStatistic<T> | null

  lowestPriceGeography:
    PriceMeterGeographicStatistic<T> | null

  largestPercentAboveSelectedMarketAverage:
    PriceMeterGeographicStatistic<T> | null

  largestPercentBelowSelectedMarketAverage:
    PriceMeterGeographicStatistic<T> | null

  explanation:
    string | null
}


/*
 * ---------------------------------------------------------
 * CANONICAL TERM DISPLAY NAME
 * ---------------------------------------------------------
 *
 * Geographic names come only from canonical geography.
 *
 * Slugs and raw filter strings are never used as
 * presentation names.
 */


function canonicalTermDisplayName({
  term,
  language
}: {
  term:
    CanonicalGeographyTerm | null

  language:
    PriceMeterGeographicConclusionLanguage
}): string | null {

  if (
    !term
  ) {

    return null
  }


  if (
    language ===
      'es'
  ) {

    return (
      term.term_name_es ??
      term.term_name ??
      term.term_name_en ??
      null
    )
  }


  return (
    term.term_name_en ??
    term.term_name ??
    term.term_name_es ??
    null
  )
}


/*
 * ---------------------------------------------------------
 * GEOGRAPHY DISPLAY NAME
 * ---------------------------------------------------------
 *
 * Geographic identity remains canonical.
 *
 * This helper selects only the display name appropriate
 * for the requested language.
 */


function geographyDisplayName<
  T extends PriceMeterTransactionType
>({
  statistic,
  language
}: {
  statistic:
    PriceMeterGeographicStatistic<T>

  language:
    PriceMeterGeographicConclusionLanguage
}): string {

  const term =
    statistic.geography.district ??
    statistic.geography.canton ??
    statistic.geography.province


  return (
    canonicalTermDisplayName({
      term,
      language
    }) ??
    (
      language ===
        'es'
        ? 'Geografía desconocida'
        : 'Unknown geography'
    )
  )
}


/*
 * ---------------------------------------------------------
 * SELECTED MARKET DESCRIPTION
 * ---------------------------------------------------------
 *
 * The selected market is derived from the canonical
 * geographic ancestry already preserved by Step 2.
 *
 * National → Province comparison:
 *   selected market = national
 *
 * Province → Canton comparison:
 *   selected market = canonical Province
 *
 * Canton → District comparison:
 *   selected market = canonical Canton
 *
 * No slug beautification or raw filter strings are used.
 */


function selectedMarketDescription<
  T extends PriceMeterTransactionType
>({
  scope,
  statistics,
  language
}: {
  scope:
    PriceMeterGeographicScope

  statistics:
    PriceMeterGeographicStatistic<T>[]

  language:
    PriceMeterGeographicConclusionLanguage
}): string {

  if (
    scope.selectedLevel ===
      'national'
  ) {

    return language ===
      'es'
      ? 'mercado nacional seleccionado'
      : 'selected national market'
  }


  const firstStatistic =
    statistics[0]


  if (
    !firstStatistic
  ) {

    return language ===
      'es'
      ? 'mercado seleccionado'
      : 'selected market'
  }


  if (
    scope.selectedLevel ===
      'province'
  ) {

    const provinceName =
      canonicalTermDisplayName({
        term:
          firstStatistic
            .geography
            .province,

        language
      })


    if (
      provinceName
    ) {

      return language ===
        'es'
        ? `mercado seleccionado de la provincia de ${provinceName}`
        : `selected ${provinceName} Province market`
    }
  }


  if (
    scope.selectedLevel ===
      'canton'
  ) {

    const cantonName =
      canonicalTermDisplayName({
        term:
          firstStatistic
            .geography
            .canton,

        language
      })


    if (
      cantonName
    ) {

      return language ===
        'es'
        ? `mercado seleccionado del cantón de ${cantonName}`
        : `selected ${cantonName} Canton market`
    }
  }


  if (
    scope.selectedLevel ===
      'district'
  ) {

    const districtName =
      canonicalTermDisplayName({
        term:
          firstStatistic
            .geography
            .district,

        language
      })


    if (
      districtName
    ) {

      return language ===
        'es'
        ? `mercado seleccionado del distrito de ${districtName}`
        : `selected ${districtName} District market`
    }
  }


  return language ===
    'es'
    ? 'mercado seleccionado'
    : 'selected market'
}


/*
 * ---------------------------------------------------------
 * COMPARISON LEVEL LABEL
 * ---------------------------------------------------------
 */


function comparisonLevelLabel({
  scope,
  language
}: {
  scope:
    PriceMeterGeographicScope

  language:
    PriceMeterGeographicConclusionLanguage
}): string {

  if (
    scope.comparisonLevel ===
      'province'
  ) {

    return language ===
      'es'
      ? 'provincias'
      : 'provinces'
  }


  if (
    scope.comparisonLevel ===
      'canton'
  ) {

    return language ===
      'es'
      ? 'cantones'
      : 'cantons'
  }


  return language ===
    'es'
    ? 'distritos'
    : 'districts'
}


/*
 * ---------------------------------------------------------
 * PERCENT FORMATTER
 * ---------------------------------------------------------
 *
 * Presentation-only rounding.
 *
 * Analytical values remain untouched.
 */


function formatPercent(
  value:
    number
): string {

  return Math.abs(
    value
  ).toFixed(
    1
  )
}


/*
 * ---------------------------------------------------------
 * GEOGRAPHIC CONCLUSIONS
 * ---------------------------------------------------------
 *
 * This layer performs NO Price / m² calculations.
 *
 * It consumes the already-established geographic
 * statistics produced by Step 2.
 *
 * Highest/lowest geography:
 *   determined by the existing geographic ranking.
 *
 * Largest above/below:
 *   determined from the already-calculated signed
 *   percentage relationship to the selected-market
 *   average.
 *
 * Geographic presentation names are derived only from
 * canonical geographic identity.
 */


export function buildPriceMeterGeographicConclusions<
  T extends PriceMeterTransactionType
>({
  statistics,
  scope,
  language
}: {
  statistics:
    PriceMeterGeographicStatistic<T>[]

  scope:
    PriceMeterGeographicScope

  language:
    PriceMeterGeographicConclusionLanguage
}): PriceMeterGeographicConclusion<T> {

  /*
   * A District has no child administrative geography.
   *
   * Likewise, an empty statistical population cannot
   * support a geographic conclusion.
   */

  if (
    scope.comparisonLevel ===
      null ||
    statistics.length ===
      0
  ) {

    return {
      scope,

      highestPriceGeography:
        null,

      lowestPriceGeography:
        null,

      largestPercentAboveSelectedMarketAverage:
        null,

      largestPercentBelowSelectedMarketAverage:
        null,

      explanation:
        null
    }
  }


  /*
   * Step 2 ranks geographic statistics by average
   * Price / m² from highest to lowest.
   *
   * We consume that established ordering rather than
   * recalculating Price / m² here.
   */


  const rankedStatistics =
    statistics
      .filter(
        statistic =>
          statistic.distribution.average !==
            null
      )
      .sort(
        (a, b) =>
          a.rank -
          b.rank
      )


  const highestPriceGeography =
    rankedStatistics[0] ??
    null


  const lowestPriceGeography =
    rankedStatistics.length >
      0
      ? rankedStatistics[
          rankedStatistics.length - 1
        ]
      : null


  /*
   * Find the largest already-calculated positive and
   * negative relationships to the selected-market average.
   */


  const aboveSelectedMarket =
    statistics
      .filter(
        statistic => {

          const percent =
            statistic
              .averagePercentAboveOrBelowSelectedMarket


          return (
            percent !==
              null &&
            percent >
              0
          )
        }
      )
      .sort(
        (a, b) =>
          (
            b.averagePercentAboveOrBelowSelectedMarket ??
            0
          ) -
          (
            a.averagePercentAboveOrBelowSelectedMarket ??
            0
          )
      )


  const belowSelectedMarket =
    statistics
      .filter(
        statistic => {

          const percent =
            statistic
              .averagePercentAboveOrBelowSelectedMarket


          return (
            percent !==
              null &&
            percent <
              0
          )
        }
      )
      .sort(
        (a, b) =>
          (
            a.averagePercentAboveOrBelowSelectedMarket ??
            0
          ) -
          (
            b.averagePercentAboveOrBelowSelectedMarket ??
            0
          )
      )


  const largestPercentAboveSelectedMarketAverage =
    aboveSelectedMarket[0] ??
    null


  const largestPercentBelowSelectedMarketAverage =
    belowSelectedMarket[0] ??
    null


  /*
   * -------------------------------------------------------
   * MARKET-SCOPED EXPLANATION
   * -------------------------------------------------------
   *
   * The explanation is deliberately observational.
   *
   * It does not claim that a geography is inherently or
   * permanently more expensive. It describes what the
   * current selected analytical cohort supports.
   */


  const marketDescription =
    selectedMarketDescription({
      scope,
      statistics,
      language
    })


  const comparisonLabel =
    comparisonLevelLabel({
      scope,
      language
    })


  const explanationParts:
    string[] =
    []


  if (
    language ===
      'es'
  ) {

    if (
      highestPriceGeography
    ) {

      explanationParts.push(
        `${geographyDisplayName({
          statistic:
            highestPriceGeography,

          language
        })} tiene el Precio / m² promedio más alto entre los ${comparisonLabel} observados en el ${marketDescription}.`
      )
    }


    if (
      largestPercentAboveSelectedMarketAverage
    ) {

      const percent =
        largestPercentAboveSelectedMarketAverage
          .averagePercentAboveOrBelowSelectedMarket


      if (
        percent !==
          null
      ) {

        explanationParts.push(
          `${geographyDisplayName({
            statistic:
              largestPercentAboveSelectedMarketAverage,

            language
          })} está ${formatPercent(
            percent
          )}% por encima del promedio del mercado seleccionado.`
        )
      }
    }


    if (
      lowestPriceGeography
    ) {

      explanationParts.push(
        `${geographyDisplayName({
          statistic:
            lowestPriceGeography,

          language
        })} tiene el Precio / m² promedio más bajo entre los ${comparisonLabel} observados.`
      )
    }

        if (
      largestPercentBelowSelectedMarketAverage
    ) {

      const percent =
        largestPercentBelowSelectedMarketAverage
          .averagePercentAboveOrBelowSelectedMarket


      if (
        percent !==
          null
      ) {

        explanationParts.push(
          `${geographyDisplayName({
            statistic:
              largestPercentBelowSelectedMarketAverage,

            language
          })} está ${formatPercent(
            percent
          )}% por debajo del promedio del mercado seleccionado.`
        )
      }
    }
  } else {

    if (
      highestPriceGeography
    ) {

      explanationParts.push(
        `${geographyDisplayName({
          statistic:
            highestPriceGeography,

          language
        })} has the highest average Price / m² among the observed ${comparisonLabel} in the ${marketDescription}.`
      )
    }


    if (
      largestPercentAboveSelectedMarketAverage
    ) {

      const percent =
        largestPercentAboveSelectedMarketAverage
          .averagePercentAboveOrBelowSelectedMarket


      if (
        percent !==
          null
      ) {

        explanationParts.push(
          `${geographyDisplayName({
            statistic:
              largestPercentAboveSelectedMarketAverage,

            language
          })} is ${formatPercent(
            percent
          )}% above the selected-market average.`
        )
      }
    }


    if (
      lowestPriceGeography
    ) {

      explanationParts.push(
        `${geographyDisplayName({
          statistic:
            lowestPriceGeography,

          language
        })} has the lowest average Price / m² among the observed ${comparisonLabel}.`
      )
    }


    if (
            largestPercentBelowSelectedMarketAverage
            ) {

            const percent =
                largestPercentBelowSelectedMarketAverage
                .averagePercentAboveOrBelowSelectedMarket


            if (
                percent !==
                null
            ) {

                explanationParts.push(
                `${geographyDisplayName({
                    statistic:
                    largestPercentBelowSelectedMarketAverage,

                    language
                })} is ${formatPercent(
                    percent
                )}% below the selected-market average.`
                )
            }
            }
        }


        return {
            scope,

            highestPriceGeography,

            lowestPriceGeography,

            largestPercentAboveSelectedMarketAverage,

            largestPercentBelowSelectedMarketAverage,

            explanation:
            explanationParts.length >
                0
                ? explanationParts.join(
                    ' '
                )
                : null
        }
        }