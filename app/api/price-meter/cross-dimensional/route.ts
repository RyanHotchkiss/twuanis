import { evaluatePriceMeterCrossDimensionalOutcomes } from '@/lib/price-meter-cross-dimensional-outcomes'
import { buildPriceMeterCrossDimensionalSynthesis } from '@/lib/price-meter-cross-dimensional-synthesis'
import type { PriceMeterCrossDimensionalResult } from '@/lib/price-meter-cross-dimensional-result-contract'
import { authorizePriceMeterIntelligenceExecution, PriceMeterComparableAuthenticationError, PriceMeterComparableAuthorizationError } from '@/lib/price-meter-authorization'
import { validatePriceMeterApply } from '@/lib/price-meter-apply-contract'
import {
  NextRequest,
  NextResponse
} from 'next/server'

import {
  loadPriceMeterObservations
} from '@/lib/price-meter-observation-loader'

import {
  buildPriceMeterTransactionCohorts
} from '@/lib/price-meter-transaction-cohort'

import {
  buildPriceMeterAnalyticalCohort
} from '@/lib/price-meter-analytical-cohort'

import {
  resolvePriceMeterGeographicScope
} from '@/lib/price-meter-geographic-scope'

import {
  resolvePriceMeterCrossDimensionalIdentity
} from '@/lib/price-meter-cross-dimensional-identity'

import {
  analyzePriceMeterCrossDimensionalRelationship
} from '@/lib/price-meter-cross-dimensional-analyzer'

import {
  getPriceMeterCrossDimensionalQuestion,
  type PriceMeterCrossDimensionalQuestionKey
} from '@/lib/price-meter-cross-dimensional-question'


type RequestBody = {
  questionKey?:
    string

  filters?:
    Record<
      string,
      string | undefined
    >

  cohortKey?:
    | 'vacantLandLandNormalized'
    | 'improvedLandNormalized'
    | 'improvedConstructionNormalized'
}

export async function POST(
  request:
    NextRequest
) {
  try {
    await authorizePriceMeterIntelligenceExecution()
  } catch (error) {
    return NextResponse.json({ error: 'Price / m² authorization is required.' }, {
      status: error instanceof PriceMeterComparableAuthenticationError ? 401 :
        error instanceof PriceMeterComparableAuthorizationError ? 403 : 503
    })
  }
  try {
    const body =
      await request.json() as
        RequestBody


    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid Cross-Dimensional request.' }, { status: 400 })
    }
        if (
      !body.questionKey
    ) {
      return NextResponse.json(
        {
          error:
            'An authorized Cross-Dimensional question is required.'
        },
        {
          status:
            400
        }
      )
    }


    let questionKey:
      PriceMeterCrossDimensionalQuestionKey

    let question:
      ReturnType<
        typeof getPriceMeterCrossDimensionalQuestion
      >


        try {
          questionKey =
            body.questionKey as
              PriceMeterCrossDimensionalQuestionKey

          question =
            getPriceMeterCrossDimensionalQuestion(
              questionKey
            )
        }
    catch {
      return NextResponse.json(
        {
          error:
            'An authorized Cross-Dimensional question is required.'
        },
        {
          status:
            400
        }
      )
    }


    if (
      !body.filters
    ) {
      return NextResponse.json(
        {
          error:
            'The bounded Price / m² market filters are required.'
        },
        {
          status:
            400
        }
      )
    }


    // This child action uses the applied ordinary PPM2 market identity supplied by its owning presentation.
    let filters: ReturnType<typeof validatePriceMeterApply>
    try { filters = validatePriceMeterApply(body.filters) }
    catch { return NextResponse.json({ error: 'A complete bounded PPM2 market identity is required.' }, { status: 400 }) }
    const transactionType = filters.transaction_type


    if (
      transactionType !==
        'sale' &&
      transactionType !==
        'rent'
    ) {
      return NextResponse.json(
        {
          error:
            'Cross-Dimensional analysis requires an explicit Sale or Rent transaction type.'
        },
        {
          status:
            400
        }
      )
    }


    /*
     * -----------------------------------------------------
     * QUESTION AUTHORIZATION
     * -----------------------------------------------------
     *
     * Resolve exactly one canonical Phase 11 question.
     *
     * No alternative questions are calculated here.
     */

          /*
     * The canonical question was resolved above before
     * any market loading occurred.
     *
     * Invalid questions therefore fail before the
     * computational boundary is crossed.
     */

        /*
     * -----------------------------------------------------
     * LOAD THE EXISTING BOUNDED MARKET
     * -----------------------------------------------------
     *
     * This executes only after the explicit POST generated
     * by a user selection.
     *
     * The canonical Price / m² observation loader applies
     * the bounded market filters, canonical geography,
     * analytical date, FX identity, analytical identity,
     * and observation construction.
     *
     * It does NOT execute the ordinary Phase 6–10
     * analytical pipeline.
     */

    /*
     * -----------------------------------------------------
     * OWNING-PHASE CANONICAL COHORT
     * -----------------------------------------------------
     *
     * Phase 7 can legitimately operate on any of its three
     * existing analytical cohorts. The exact displayed
     * cohort therefore travels explicitly from the owning
     * Phase 7 presentation.
     *
     * Phase 8 and Phase 9 derive their analytical identity
     * directly from the owning relationship.
     */

    let propertyBasis:
      'land_only' |
      'improved_property'

    let normalizationBasis:
      'land' |
      'construction'


    if (
      question.owningPhase ===
        'phase_7_geography'
    ) {
      if (
        body.cohortKey ===
          'vacantLandLandNormalized'
      ) {
        propertyBasis =
          'land_only'

        normalizationBasis =
          'land'
      }
      else if (
        body.cohortKey ===
          'improvedLandNormalized'
      ) {
        propertyBasis =
          'improved_property'

        normalizationBasis =
          'land'
      }
      else if (
        body.cohortKey ===
          'improvedConstructionNormalized'
      ) {
        propertyBasis =
          'improved_property'

        normalizationBasis =
          'construction'
      }
      else {
        return NextResponse.json(
          {
            error:
              'Geographic Cross-Dimensional analysis requires an explicit canonical analytical cohort.'
          },
          {
            status:
              400
          }
        )
      }
    }
    else if (
      question.owningPhase ===
        'phase_8_property_area'
    ) {
      propertyBasis =
        'improved_property'

      normalizationBasis =
        'land'
    }
    else if (
      question.owningPhase ===
        'phase_8_construction_area'
    ) {
      propertyBasis =
        'improved_property'

      normalizationBasis =
        'construction'
    }
    else {
      /*
       * Phase 9 contains two analytically distinct
       * normalization relationships.
       *
       * The caller must identify which displayed Phase 9
       * relationship owns this Cross-Dimensional request.
       */

      if (
        body.cohortKey ===
          'improvedLandNormalized'
      ) {
        propertyBasis =
          'improved_property'

        normalizationBasis =
          'land'
      }
      else if (
        body.cohortKey ===
          'improvedConstructionNormalized'
      ) {
        propertyBasis =
          'improved_property'

        normalizationBasis =
          'construction'
      }
      else {
        return NextResponse.json(
          {
            error:
              'Construction-to-Land Cross-Dimensional analysis requires an explicit normalization relationship.'
          },
          {
            status:
              400
          }
        )
      }
    }


        const {
      observations
    } =
      await loadPriceMeterObservations(
        filters
      )


    /*
     * -----------------------------------------------------
     * TRANSACTION BOUNDARY
     * -----------------------------------------------------
     */

    const transactionCohorts =
      buildPriceMeterTransactionCohorts(
        observations
      )


    const transactionCohort =
      transactionType ===
        'sale'
        ? transactionCohorts.sale
        : transactionCohorts.rent



    const analyticalCohort =
      buildPriceMeterAnalyticalCohort({
        transactionCohort,
        propertyBasis,
        normalizationBasis
      })


    /*
     * -----------------------------------------------------
     * GEOGRAPHIC SCOPE
     * -----------------------------------------------------
     */

    const geographicScope =
      resolvePriceMeterGeographicScope({
        province:
          filters.province,

        canton:
          filters.canton,

        district:
          filters.district
      })


    /*
     * -----------------------------------------------------
     * CROSS-DIMENSIONAL IDENTITY
     * -----------------------------------------------------
     */

    const identity =
      resolvePriceMeterCrossDimensionalIdentity({
        questionKey,

        cohort:
          analyticalCohort,

        geographicScope
      })


    /*
     * -----------------------------------------------------
     * ONE QUESTION → ONE ANALYSIS
     * -----------------------------------------------------
     */

    const evidence =
      analyzePriceMeterCrossDimensionalRelationship({
        identity,

        observations:
          analyticalCohort
            .observations
      })


    const outcomes = evaluatePriceMeterCrossDimensionalOutcomes(evidence)
    const synthesis = buildPriceMeterCrossDimensionalSynthesis({ question, evidenceSet: evidence, outcomes })

    return NextResponse.json(projectCompletedResult({
      question,
      context: { transactionType: identity.transactionType, propertyBasis: identity.propertyBasis, normalizationBasis: identity.normalizationBasis },
      evidence, outcomes, synthesis
    }))
  }
  catch (
    error
  ) {
    console.error(
      'Price / m² Cross-Dimensional analysis failed:',
      error
    )


    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Cross-Dimensional analysis failed.'
      },
      {
        status:
          500
      }
    )
  }
}
// Allowlisted presentation projection; no analytical calculation.
function projectCompletedResult(value: PriceMeterCrossDimensionalResult): PriceMeterCrossDimensionalResult {
    return {
        question: {
            key: value.question.key,
            definition: value.question.definition,
            question: value.question.question,
            reports: value.question.reports.map(item1 => (item1))
        },
        context: {
            transactionType: value.context.transactionType,
            propertyBasis: value.context.propertyBasis,
            normalizationBasis: value.context.normalizationBasis
        },
        evidence: {
            inputObservationCount: value.evidence.inputObservationCount,
            representedObservationCount: value.evidence.representedObservationCount,
            excludedObservationCount: value.evidence.excludedObservationCount,
            populatedSecondaryCohortCount: value.evidence.populatedSecondaryCohortCount,
            evidence: value.evidence.evidence.map(item2 => (item2.kind === 'geographic' ? ({
                secondaryCohortKey: item2.secondaryCohortKey,
                secondaryCohortLabel: item2.secondaryCohortLabel,
                representedObservationCount: item2.representedObservationCount,
                status: item2.status,
                kind: item2.kind,
                selectedMarketSampleSize: item2.selectedMarketSampleSize,
                selectedMarketMedianPricePerM2: item2.selectedMarketMedianPricePerM2,
                comparisonGeographyCount: item2.comparisonGeographyCount,
                geographicStatistics: item2.geographicStatistics.map(item3 => ({
                    geographyKey: item3.geographyKey,
                    geographyLabel: item3.geographyLabel,
                    rank: item3.rank,
                    sampleSize: item3.sampleSize,
                    medianPricePerM2: item3.medianPricePerM2,
                    medianDifferenceFromSelectedMarket: item3.medianDifferenceFromSelectedMarket,
                    medianPercentAboveOrBelowSelectedMarket: item3.medianPercentAboveOrBelowSelectedMarket
                }))
            }) : item2.kind === 'size_relationship' ? ({
                secondaryCohortKey: item2.secondaryCohortKey,
                secondaryCohortLabel: item2.secondaryCohortLabel,
                kind: item2.kind,
                representedObservationCount: item2.representedObservationCount,
                populatedBandCount: item2.populatedBandCount,
                requiredPopulatedBandCount: item2.requiredPopulatedBandCount,
                coordinates: item2.coordinates.map(item4 => ({
                    areaM2: item4.areaM2,
                    normalizedPricePerM2: item4.normalizedPricePerM2,
                    observationCount: item4.observationCount
                })),
                spearmanRho: item2.spearmanRho,
                logLogSlope: item2.logLogSlope,
                modeledTenPercentAreaChangePercent: item2.modeledTenPercentAreaChangePercent,
                rSquared: item2.rSquared,
                modeledStatisticsAuthorization: item2.modeledStatisticsAuthorization,
                modeledStatisticsWithheldReason: item2.modeledStatisticsWithheldReason,
                status: item2.status
            }) : ({
                secondaryCohortKey: item2.secondaryCohortKey,
                secondaryCohortLabel: item2.secondaryCohortLabel,
                kind: item2.kind,
                normalizationBasis: item2.normalizationBasis,
                representedObservationCount: item2.representedObservationCount,
                populatedCohortCount: item2.populatedCohortCount,
                requiredPopulatedCohortCount: item2.requiredPopulatedCohortCount,
                requiredObservationCount: item2.requiredObservationCount,
                coordinates: item2.coordinates.map(item5 => ({
                    constructionToLandRatio: item5.constructionToLandRatio,
                    normalizedPricePerM2: item5.normalizedPricePerM2,
                    observationCount: item5.observationCount
                })),
                spearmanRho: item2.spearmanRho,
                regressionWithheldReason: item2.regressionWithheldReason,
                status: item2.status
            })))
        },
        outcomes: {
            persistence: {
                examinedSecondaryCohortCount: value.outcomes.persistence.examinedSecondaryCohortCount,
                establishedSecondaryCohortCount: value.outcomes.persistence.establishedSecondaryCohortCount,
                nonEstablishedSecondaryCohortCount: value.outcomes.persistence.nonEstablishedSecondaryCohortCount,
                persistenceRatePercent: value.outcomes.persistence.persistenceRatePercent,
                representedObservationCount: value.outcomes.persistence.representedObservationCount,
                establishedObservationCount: value.outcomes.persistence.establishedObservationCount
            },
            variation: value.outcomes.variation === null ? null : (value.outcomes.variation.kind === 'geographic' ? ({
                kind: value.outcomes.variation.kind,
                establishedSecondaryCohortCount: value.outcomes.variation.establishedSecondaryCohortCount,
                observedMedianDifferenceMinimum: value.outcomes.variation.observedMedianDifferenceMinimum,
                observedMedianDifferenceMaximum: value.outcomes.variation.observedMedianDifferenceMaximum,
                observedMedianDifferenceRange: value.outcomes.variation.observedMedianDifferenceRange,
                observedPercentDifferenceMinimum: value.outcomes.variation.observedPercentDifferenceMinimum,
                observedPercentDifferenceMaximum: value.outcomes.variation.observedPercentDifferenceMaximum,
                observedPercentDifferenceRange: value.outcomes.variation.observedPercentDifferenceRange
            }) : value.outcomes.variation.kind === 'size_relationship' ? ({
                kind: value.outcomes.variation.kind,
                establishedSecondaryCohortCount: value.outcomes.variation.establishedSecondaryCohortCount,
                spearmanRhoMinimum: value.outcomes.variation.spearmanRhoMinimum,
                spearmanRhoMaximum: value.outcomes.variation.spearmanRhoMaximum,
                spearmanRhoRange: value.outcomes.variation.spearmanRhoRange,
                logLogSlopeMinimum: value.outcomes.variation.logLogSlopeMinimum,
                logLogSlopeMaximum: value.outcomes.variation.logLogSlopeMaximum,
                logLogSlopeRange: value.outcomes.variation.logLogSlopeRange,
                modeledTenPercentAreaChangeMinimum: value.outcomes.variation.modeledTenPercentAreaChangeMinimum,
                modeledTenPercentAreaChangeMaximum: value.outcomes.variation.modeledTenPercentAreaChangeMaximum,
                modeledTenPercentAreaChangeRange: value.outcomes.variation.modeledTenPercentAreaChangeRange,
                rSquaredMinimum: value.outcomes.variation.rSquaredMinimum,
                rSquaredMaximum: value.outcomes.variation.rSquaredMaximum,
                rSquaredRange: value.outcomes.variation.rSquaredRange
            }) : ({
                kind: value.outcomes.variation.kind,
                establishedSecondaryCohortCount: value.outcomes.variation.establishedSecondaryCohortCount,
                spearmanRhoMinimum: value.outcomes.variation.spearmanRhoMinimum,
                spearmanRhoMaximum: value.outcomes.variation.spearmanRhoMaximum,
                spearmanRhoRange: value.outcomes.variation.spearmanRhoRange
            })),
            reversals: value.outcomes.reversals.map(item6 => (item6.kind === 'directional' ? ({
                kind: item6.kind,
                firstSecondaryCohortKey: item6.firstSecondaryCohortKey,
                firstSecondaryCohortLabel: item6.firstSecondaryCohortLabel,
                secondSecondaryCohortKey: item6.secondSecondaryCohortKey,
                secondSecondaryCohortLabel: item6.secondSecondaryCohortLabel,
                firstDirection: item6.firstDirection,
                secondDirection: item6.secondDirection,
                firstSpearmanRho: item6.firstSpearmanRho,
                secondSpearmanRho: item6.secondSpearmanRho
            }) : ({
                kind: item6.kind,
                firstSecondaryCohortKey: item6.firstSecondaryCohortKey,
                firstSecondaryCohortLabel: item6.firstSecondaryCohortLabel,
                secondSecondaryCohortKey: item6.secondSecondaryCohortKey,
                secondSecondaryCohortLabel: item6.secondSecondaryCohortLabel,
                firstCohortFirstGeography: {
                    geographyKey: item6.firstCohortFirstGeography.geographyKey,
                    geographyLabel: item6.firstCohortFirstGeography.geographyLabel,
                    medianPricePerM2: item6.firstCohortFirstGeography.medianPricePerM2,
                    sampleSize: item6.firstCohortFirstGeography.sampleSize
                },
                firstCohortSecondGeography: {
                    geographyKey: item6.firstCohortSecondGeography.geographyKey,
                    geographyLabel: item6.firstCohortSecondGeography.geographyLabel,
                    medianPricePerM2: item6.firstCohortSecondGeography.medianPricePerM2,
                    sampleSize: item6.firstCohortSecondGeography.sampleSize
                },
                secondCohortFirstGeography: {
                    geographyKey: item6.secondCohortFirstGeography.geographyKey,
                    geographyLabel: item6.secondCohortFirstGeography.geographyLabel,
                    medianPricePerM2: item6.secondCohortFirstGeography.medianPricePerM2,
                    sampleSize: item6.secondCohortFirstGeography.sampleSize
                },
                secondCohortSecondGeography: {
                    geographyKey: item6.secondCohortSecondGeography.geographyKey,
                    geographyLabel: item6.secondCohortSecondGeography.geographyLabel,
                    medianPricePerM2: item6.secondCohortSecondGeography.medianPricePerM2,
                    sampleSize: item6.secondCohortSecondGeography.sampleSize
                }
            }))),
            nonEstablishment: value.outcomes.nonEstablishment.map(item7 => ({
                secondaryCohortKey: item7.secondaryCohortKey,
                secondaryCohortLabel: item7.secondaryCohortLabel,
                reason: item7.reason.kind === 'geographic_relationship_not_established' ? ({
                    kind: item7.reason.kind,
                    representedObservationCount: item7.reason.representedObservationCount,
                    comparisonGeographyCount: item7.reason.comparisonGeographyCount,
                    requiredComparisonGeographyCount: item7.reason.requiredComparisonGeographyCount
                }) : item7.reason.kind === 'size_relationship_not_established' ? ({
                    kind: item7.reason.kind,
                    representedObservationCount: item7.reason.representedObservationCount,
                    populatedBandCount: item7.reason.populatedBandCount,
                    requiredPopulatedBandCount: item7.reason.requiredPopulatedBandCount
                }) : ({
                    kind: item7.reason.kind,
                    representedObservationCount: item7.reason.representedObservationCount,
                    populatedCohortCount: item7.reason.populatedCohortCount,
                    requiredPopulatedCohortCount: item7.reason.requiredPopulatedCohortCount,
                    requiredObservationCount: item7.reason.requiredObservationCount
                })
            }))
        },
        synthesis: {
            representedObservationCount: value.synthesis.representedObservationCount,
            examinedSecondaryCohortCount: value.synthesis.examinedSecondaryCohortCount,
            establishedSecondaryCohortCount: value.synthesis.establishedSecondaryCohortCount,
            establishedObservationCount: value.synthesis.establishedObservationCount,
            variation: value.synthesis.variation === null ? null : (value.synthesis.variation.kind === 'geographic' ? ({
                kind: value.synthesis.variation.kind,
                establishedSecondaryCohortCount: value.synthesis.variation.establishedSecondaryCohortCount,
                observedMedianDifferenceMinimum: value.synthesis.variation.observedMedianDifferenceMinimum,
                observedMedianDifferenceMaximum: value.synthesis.variation.observedMedianDifferenceMaximum,
                observedMedianDifferenceRange: value.synthesis.variation.observedMedianDifferenceRange,
                observedPercentDifferenceMinimum: value.synthesis.variation.observedPercentDifferenceMinimum,
                observedPercentDifferenceMaximum: value.synthesis.variation.observedPercentDifferenceMaximum,
                observedPercentDifferenceRange: value.synthesis.variation.observedPercentDifferenceRange
            }) : value.synthesis.variation.kind === 'size_relationship' ? ({
                kind: value.synthesis.variation.kind,
                establishedSecondaryCohortCount: value.synthesis.variation.establishedSecondaryCohortCount,
                spearmanRhoMinimum: value.synthesis.variation.spearmanRhoMinimum,
                spearmanRhoMaximum: value.synthesis.variation.spearmanRhoMaximum,
                spearmanRhoRange: value.synthesis.variation.spearmanRhoRange,
                logLogSlopeMinimum: value.synthesis.variation.logLogSlopeMinimum,
                logLogSlopeMaximum: value.synthesis.variation.logLogSlopeMaximum,
                logLogSlopeRange: value.synthesis.variation.logLogSlopeRange,
                modeledTenPercentAreaChangeMinimum: value.synthesis.variation.modeledTenPercentAreaChangeMinimum,
                modeledTenPercentAreaChangeMaximum: value.synthesis.variation.modeledTenPercentAreaChangeMaximum,
                modeledTenPercentAreaChangeRange: value.synthesis.variation.modeledTenPercentAreaChangeRange,
                rSquaredMinimum: value.synthesis.variation.rSquaredMinimum,
                rSquaredMaximum: value.synthesis.variation.rSquaredMaximum,
                rSquaredRange: value.synthesis.variation.rSquaredRange
            }) : ({
                kind: value.synthesis.variation.kind,
                establishedSecondaryCohortCount: value.synthesis.variation.establishedSecondaryCohortCount,
                spearmanRhoMinimum: value.synthesis.variation.spearmanRhoMinimum,
                spearmanRhoMaximum: value.synthesis.variation.spearmanRhoMaximum,
                spearmanRhoRange: value.synthesis.variation.spearmanRhoRange
            })),
            reversalCount: value.synthesis.reversalCount,
            nonEstablishmentCount: value.synthesis.nonEstablishmentCount,
            hasReversal: value.synthesis.hasReversal,
            hasNonEstablishment: value.synthesis.hasNonEstablishment
        }
    };
}
