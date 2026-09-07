/*
 * ---------------------------------------------------------
 * PRICE / M² CROSS-DIMENSIONAL OUTCOMES
 * ---------------------------------------------------------
 *
 * Phase 11 — Cross-Dimensional Price / m² Analysis
 *
 * Purpose:
 *
 * Define and evaluate the four canonical Cross-Dimensional
 * analytical outcomes:
 *
 * - Persistence
 * - Variation
 * - Reversal
 * - Non-establishment
 *
 * These outcomes describe what happens to one established
 * owning-phase relationship when it is reconstructed across
 * one authorized secondary dimension.
 *
 * This layer consumes completed numerical evidence.
 *
 * It DOES NOT:
 *
 * - fetch listings
 * - construct populations
 * - construct owning-phase evidence
 * - invent missing statistics
 * - override owning-phase mathematical restrictions
 * - assign causal meaning
 * - generate final user-facing prose
 */

import type {
  PriceMeterCrossDimensionalEvidence,
  PriceMeterCrossDimensionalEvidenceSet,
  PriceMeterCrossDimensionalGeographicEvidence,
  PriceMeterCrossDimensionalSizeEvidence,
  PriceMeterCrossDimensionalConstructionLandEvidence
} from '@/lib/price-meter-cross-dimensional-evidence'


/*
 * ---------------------------------------------------------
 * COMMON DIRECTION
 * ---------------------------------------------------------
 *
 * Direction is numerical sign only.
 *
 * No qualitative strength classification is introduced.
 */

export type PriceMeterCrossDimensionalDirection =
  | 'positive'
  | 'negative'
  | 'zero'


function resolveDirection(
  value:
    number
): PriceMeterCrossDimensionalDirection {

  if (
    value >
      0
  ) {
    return 'positive'
  }


  if (
    value <
      0
  ) {
    return 'negative'
  }


  return 'zero'
}


/*
 * ---------------------------------------------------------
 * RELATIONSHIP SIGNATURE
 * ---------------------------------------------------------
 *
 * A signature contains only the numerical structure needed
 * to compare the same owning-phase question across
 * secondary populations.
 */

type GeographicRelationshipSignature = {
  kind:
    'geographic'

  orderedGeographyKeys:
    string[]
}


type SizeRelationshipSignature = {
  kind:
    'size_relationship'

  direction:
    PriceMeterCrossDimensionalDirection

  spearmanRho:
    number

  logLogSlope:
    number | null

  modeledTenPercentAreaChangePercent:
    number | null

  rSquared:
    number | null
}


type ConstructionLandRelationshipSignature = {
  kind:
    'construction_to_land_relationship'

  direction:
    PriceMeterCrossDimensionalDirection

  spearmanRho:
    number
}


type PriceMeterCrossDimensionalRelationshipSignature =
  | GeographicRelationshipSignature
  | SizeRelationshipSignature
  | ConstructionLandRelationshipSignature


/*
 * ---------------------------------------------------------
 * SIGNATURE RESOLUTION
 * ---------------------------------------------------------
 *
 * Only established evidence can produce a relationship
 * signature.
 */

function resolveRelationshipSignature(
  evidence:
    PriceMeterCrossDimensionalEvidence
): PriceMeterCrossDimensionalRelationshipSignature | null {

  if (
    evidence.status !==
      'established'
  ) {
    return null
  }


  if (
    evidence.kind ===
      'geographic'
  ) {

    const orderedGeographyKeys =
      [...evidence.geographicStatistics]
        .sort(
          (a, b) =>
            a.rank -
            b.rank
        )
        .map(
          statistic =>
            statistic.geographyKey
        )


    if (
      orderedGeographyKeys.length ===
        0
    ) {
      return null
    }


    return {
      kind:
        'geographic',

      orderedGeographyKeys
    }
  }


  if (
    evidence.kind ===
      'size_relationship'
  ) {

    if (
      evidence.spearmanRho ===
        null
    ) {
      return null
    }


    return {
      kind:
        'size_relationship',

      direction:
        resolveDirection(
          evidence.spearmanRho
        ),

      spearmanRho:
        evidence.spearmanRho,

      logLogSlope:
        evidence.logLogSlope,

      modeledTenPercentAreaChangePercent:
        evidence
          .modeledTenPercentAreaChangePercent,

      rSquared:
        evidence.rSquared
    }
  }


  if (
    evidence.spearmanRho ===
      null
  ) {
    return null
  }


  return {
    kind:
      'construction_to_land_relationship',

    direction:
      resolveDirection(
        evidence.spearmanRho
      ),

    spearmanRho:
      evidence.spearmanRho
  }
}


/*
 * ---------------------------------------------------------
 * STEP 6 — PERSISTENCE
 * ---------------------------------------------------------
 *
 * Persistence reports whether the owning-phase relationship
 * remains observable across the examined secondary
 * populations.
 *
 * It is reported numerically:
 *
 * established secondary populations
 * /
 * examined secondary populations
 *
 * No qualitative persistence label is assigned.
 */

export type PriceMeterCrossDimensionalPersistence = {
  examinedSecondaryCohortCount:
    number

  establishedSecondaryCohortCount:
    number

  nonEstablishedSecondaryCohortCount:
    number

  persistenceRatePercent:
    number | null

  representedObservationCount:
    number

  establishedObservationCount:
    number
}


export function evaluatePriceMeterCrossDimensionalPersistence(
  evidenceSet:
    PriceMeterCrossDimensionalEvidenceSet
): PriceMeterCrossDimensionalPersistence {

  const examinedSecondaryCohortCount =
    evidenceSet
      .evidence
      .length


  const establishedEvidence =
    evidenceSet
      .evidence
      .filter(
        evidence =>
          evidence.status ===
            'established'
      )


  const establishedSecondaryCohortCount =
    establishedEvidence.length


  const nonEstablishedSecondaryCohortCount =
    examinedSecondaryCohortCount -
    establishedSecondaryCohortCount


  const persistenceRatePercent =
    examinedSecondaryCohortCount >
      0
      ? (
          establishedSecondaryCohortCount /
          examinedSecondaryCohortCount
        ) *
        100
      : null


  const establishedObservationCount =
    establishedEvidence.reduce(
      (
        total,
        evidence
      ) =>
        total +
        evidence
          .representedObservationCount,
      0
    )


  return {
    examinedSecondaryCohortCount,

    establishedSecondaryCohortCount,

    nonEstablishedSecondaryCohortCount,

    persistenceRatePercent,

    representedObservationCount:
      evidenceSet
        .representedObservationCount,

    establishedObservationCount
  }
}


/*
 * ---------------------------------------------------------
 * STEP 7 — VARIATION
 * ---------------------------------------------------------
 *
 * Variation reports how the numerical magnitude or
 * statistical form of the owning-phase relationship differs
 * across established secondary populations.
 *
 * No threshold converts numerical variation into a
 * qualitative classification.
 */

export type PriceMeterCrossDimensionalGeographicVariation = {
  kind:
    'geographic'

  establishedSecondaryCohortCount:
    number

  observedMedianDifferenceMinimum:
    number | null

  observedMedianDifferenceMaximum:
    number | null

  observedMedianDifferenceRange:
    number | null

  observedPercentDifferenceMinimum:
    number | null

  observedPercentDifferenceMaximum:
    number | null

  observedPercentDifferenceRange:
    number | null
}


export type PriceMeterCrossDimensionalSizeVariation = {
  kind:
    'size_relationship'

  establishedSecondaryCohortCount:
    number

  spearmanRhoMinimum:
    number | null

  spearmanRhoMaximum:
    number | null

  spearmanRhoRange:
    number | null

  logLogSlopeMinimum:
    number | null

  logLogSlopeMaximum:
    number | null

  logLogSlopeRange:
    number | null

  modeledTenPercentAreaChangeMinimum:
    number | null

  modeledTenPercentAreaChangeMaximum:
    number | null

  modeledTenPercentAreaChangeRange:
    number | null

  rSquaredMinimum:
    number | null

  rSquaredMaximum:
    number | null

  rSquaredRange:
    number | null
}


export type PriceMeterCrossDimensionalConstructionLandVariation = {
  kind:
    'construction_to_land_relationship'

  establishedSecondaryCohortCount:
    number

  spearmanRhoMinimum:
    number | null

  spearmanRhoMaximum:
    number | null

  spearmanRhoRange:
    number | null
}


export type PriceMeterCrossDimensionalVariation =
  | PriceMeterCrossDimensionalGeographicVariation
  | PriceMeterCrossDimensionalSizeVariation
  | PriceMeterCrossDimensionalConstructionLandVariation


function numericalRange(
  values:
    Array<number | null>
): {
  minimum:
    number | null

  maximum:
    number | null

  range:
    number | null
} {

  const finiteValues =
    values.filter(
      (
        value
      ): value is number =>
        value !==
          null &&
        Number.isFinite(
          value
        )
    )


  if (
    finiteValues.length ===
      0
  ) {
    return {
      minimum:
        null,

      maximum:
        null,

      range:
        null
    }
  }


  const minimum =
    Math.min(
      ...finiteValues
    )


  const maximum =
    Math.max(
      ...finiteValues
    )


  return {
    minimum,

    maximum,

    range:
      maximum -
      minimum
  }
}


export function evaluatePriceMeterCrossDimensionalVariation(
  evidenceSet:
    PriceMeterCrossDimensionalEvidenceSet
): PriceMeterCrossDimensionalVariation | null {

  const established =
    evidenceSet
      .evidence
      .filter(
        evidence =>
          evidence.status ===
            'established'
      )


  if (
    established.length ===
      0
  ) {
    return null
  }


  const first =
    established[0]


  if (
    first.kind ===
      'geographic'
  ) {

    const geographicEvidence =
      established.filter(
        (
          evidence
        ): evidence is PriceMeterCrossDimensionalGeographicEvidence =>
          evidence.kind ===
            'geographic'
      )


    const absoluteDifferences =
      geographicEvidence.flatMap(
        evidence =>
          evidence
            .geographicStatistics
            .map(
              statistic =>
                statistic
                  .medianDifferenceFromSelectedMarket
            )
      )


    const percentDifferences =
      geographicEvidence.flatMap(
        evidence =>
          evidence
            .geographicStatistics
            .map(
              statistic =>
                statistic
                  .medianPercentAboveOrBelowSelectedMarket
            )
      )


    const absoluteRange =
      numericalRange(
        absoluteDifferences
      )


    const percentRange =
      numericalRange(
        percentDifferences
      )


    return {
      kind:
        'geographic',

      establishedSecondaryCohortCount:
        geographicEvidence.length,

      observedMedianDifferenceMinimum:
        absoluteRange.minimum,

      observedMedianDifferenceMaximum:
        absoluteRange.maximum,

      observedMedianDifferenceRange:
        absoluteRange.range,

      observedPercentDifferenceMinimum:
        percentRange.minimum,

      observedPercentDifferenceMaximum:
        percentRange.maximum,

      observedPercentDifferenceRange:
        percentRange.range
    }
  }


  if (
    first.kind ===
      'size_relationship'
  ) {

    const sizeEvidence =
      established.filter(
        (
          evidence
        ): evidence is PriceMeterCrossDimensionalSizeEvidence =>
          evidence.kind ===
            'size_relationship'
      )


    const rhoRange =
      numericalRange(
        sizeEvidence.map(
          evidence =>
            evidence.spearmanRho
        )
      )


    const slopeRange =
      numericalRange(
        sizeEvidence.map(
          evidence =>
            evidence.logLogSlope
        )
      )


    const modeledChangeRange =
      numericalRange(
        sizeEvidence.map(
          evidence =>
            evidence
              .modeledTenPercentAreaChangePercent
        )
      )


    const rSquaredRange =
      numericalRange(
        sizeEvidence.map(
          evidence =>
            evidence.rSquared
        )
      )


    return {
      kind:
        'size_relationship',

      establishedSecondaryCohortCount:
        sizeEvidence.length,

      spearmanRhoMinimum:
        rhoRange.minimum,

      spearmanRhoMaximum:
        rhoRange.maximum,

      spearmanRhoRange:
        rhoRange.range,

      logLogSlopeMinimum:
        slopeRange.minimum,

      logLogSlopeMaximum:
        slopeRange.maximum,

      logLogSlopeRange:
        slopeRange.range,

      modeledTenPercentAreaChangeMinimum:
        modeledChangeRange.minimum,

      modeledTenPercentAreaChangeMaximum:
        modeledChangeRange.maximum,

      modeledTenPercentAreaChangeRange:
        modeledChangeRange.range,

      rSquaredMinimum:
        rSquaredRange.minimum,

      rSquaredMaximum:
        rSquaredRange.maximum,

      rSquaredRange:
        rSquaredRange.range
    }
  }


  const constructionLandEvidence =
    established.filter(
      (
        evidence
      ): evidence is PriceMeterCrossDimensionalConstructionLandEvidence =>
        evidence.kind ===
          'construction_to_land_relationship'
    )


  const rhoRange =
    numericalRange(
      constructionLandEvidence.map(
        evidence =>
          evidence.spearmanRho
      )
    )


  return {
    kind:
      'construction_to_land_relationship',

    establishedSecondaryCohortCount:
      constructionLandEvidence.length,

    spearmanRhoMinimum:
      rhoRange.minimum,

    spearmanRhoMaximum:
      rhoRange.maximum,

    spearmanRhoRange:
      rhoRange.range
  }
}


/*
 * ---------------------------------------------------------
 * STEP 8 — REVERSAL
 * ---------------------------------------------------------
 *
 * Reversal is evaluated only between established secondary
 * populations.
 *
 * Size and Construction-to-Land:
 *   reversal = sign of Spearman rho changes.
 *
 * Geography:
 *   reversal = relative ordering of the same two canonical
 *   geographic entities changes between secondary cohorts.
 *
 * No magnitude threshold is applied.
 */

export type PriceMeterCrossDimensionalDirectionalReversal = {
  kind:
    'directional'

  firstSecondaryCohortKey:
    string

  firstSecondaryCohortLabel:
    string

  secondSecondaryCohortKey:
    string

  secondSecondaryCohortLabel:
    string

  firstDirection:
    PriceMeterCrossDimensionalDirection

  secondDirection:
    PriceMeterCrossDimensionalDirection

  firstSpearmanRho:
    number

  secondSpearmanRho:
    number
}


export type PriceMeterCrossDimensionalGeographicReversal = {
  kind:
    'geographic_ordering'

  firstSecondaryCohortKey:
    string

  firstSecondaryCohortLabel:
    string

  secondSecondaryCohortKey:
    string

  secondSecondaryCohortLabel:
    string

  firstGeographyKey:
    string

  secondGeographyKey:
    string

  firstCohortOrdering:
    [
      string,
      string
    ]

  secondCohortOrdering:
    [
      string,
      string
    ]
}


export type PriceMeterCrossDimensionalReversal =
  | PriceMeterCrossDimensionalDirectionalReversal
  | PriceMeterCrossDimensionalGeographicReversal


function directionalReversalExists(
  first:
    PriceMeterCrossDimensionalDirection,
  second:
    PriceMeterCrossDimensionalDirection
): boolean {

  return (
    (
      first ===
        'positive' &&
      second ===
        'negative'
    ) ||
    (
      first ===
        'negative' &&
      second ===
        'positive'
    )
  )
}


function evaluateDirectionalReversals(
  evidence:
    Array<
      | PriceMeterCrossDimensionalSizeEvidence
      | PriceMeterCrossDimensionalConstructionLandEvidence
    >
): PriceMeterCrossDimensionalDirectionalReversal[] {

  const reversals:
    PriceMeterCrossDimensionalDirectionalReversal[] =
    []


  for (
    let firstIndex = 0;
    firstIndex <
      evidence.length;
    firstIndex += 1
  ) {

    const first =
      evidence[
        firstIndex
      ]


    if (
      first.spearmanRho ===
        null
    ) {
      continue
    }


    const firstDirection =
      resolveDirection(
        first.spearmanRho
      )


    for (
      let secondIndex =
        firstIndex + 1;
      secondIndex <
        evidence.length;
      secondIndex += 1
    ) {

      const second =
        evidence[
          secondIndex
        ]


      if (
        second.spearmanRho ===
          null
      ) {
        continue
      }


      const secondDirection =
        resolveDirection(
          second.spearmanRho
        )


      if (
        !directionalReversalExists(
          firstDirection,
          secondDirection
        )
      ) {
        continue
      }


      reversals.push({
        kind:
          'directional',

        firstSecondaryCohortKey:
          first.secondaryCohortKey,

        firstSecondaryCohortLabel:
          first.secondaryCohortLabel,

        secondSecondaryCohortKey:
          second.secondaryCohortKey,

        secondSecondaryCohortLabel:
          second.secondaryCohortLabel,

        firstDirection,

        secondDirection,

        firstSpearmanRho:
          first.spearmanRho,

        secondSpearmanRho:
          second.spearmanRho
      })
    }
  }


  return reversals
}


function evaluateGeographicReversals(
  evidence:
    PriceMeterCrossDimensionalGeographicEvidence[]
): PriceMeterCrossDimensionalGeographicReversal[] {

  const reversals:
    PriceMeterCrossDimensionalGeographicReversal[] =
    []


  /*
   * -------------------------------------------------------
   * GEOGRAPHIC REVERSAL
   * -------------------------------------------------------
   *
   * A geographic reversal exists only when the observed
   * median ordering of the same two canonical geographic
   * entities changes between two established secondary
   * populations.
   *
   * Rank is deliberately NOT used here.
   *
   * Equal medians in either secondary population do not
   * constitute a reversal.
   */

  for (
    let firstIndex = 0;
    firstIndex <
      evidence.length;
    firstIndex += 1
  ) {

    const first =
      evidence[
        firstIndex
      ]


    for (
      let secondIndex =
        firstIndex + 1;
      secondIndex <
        evidence.length;
      secondIndex += 1
    ) {

      const second =
        evidence[
          secondIndex
        ]


      const firstStatisticsByKey =
        new Map(
          first
            .geographicStatistics
            .map(
              statistic => [
                statistic.geographyKey,
                statistic
              ] as const
            )
        )


      const secondStatisticsByKey =
        new Map(
          second
            .geographicStatistics
            .map(
              statistic => [
                statistic.geographyKey,
                statistic
              ] as const
            )
        )


      const sharedKeys =
        [
          ...firstStatisticsByKey.keys()
        ]
          .filter(
            key =>
              secondStatisticsByKey.has(
                key
              )
          )


      for (
        let a = 0;
        a <
          sharedKeys.length;
        a += 1
      ) {

        for (
          let b =
            a + 1;
          b <
            sharedKeys.length;
          b += 1
        ) {

          const firstKey =
            sharedKeys[a]

          const secondKey =
            sharedKeys[b]


          const firstA =
            firstStatisticsByKey.get(
              firstKey
            )

          const firstB =
            firstStatisticsByKey.get(
              secondKey
            )

          const secondA =
            secondStatisticsByKey.get(
              firstKey
            )

          const secondB =
            secondStatisticsByKey.get(
              secondKey
            )


          if (
            firstA ===
              undefined ||
            firstB ===
              undefined ||
            secondA ===
              undefined ||
            secondB ===
              undefined
          ) {
            continue
          }


          const firstAMedian =
            firstA
              .medianPricePerM2

          const firstBMedian =
            firstB
              .medianPricePerM2

          const secondAMedian =
            secondA
              .medianPricePerM2

          const secondBMedian =
            secondB
              .medianPricePerM2


          if (
            firstAMedian ===
              null ||
            firstBMedian ===
              null ||
            secondAMedian ===
              null ||
            secondBMedian ===
              null
          ) {
            continue
          }


          /*
           * Equal observed medians establish no ordering.
           *
           * Therefore an equality in either secondary
           * population cannot produce a reversal.
           */

          if (
            firstAMedian ===
              firstBMedian ||
            secondAMedian ===
              secondBMedian
          ) {
            continue
          }


          const firstAAboveB =
            firstAMedian >
            firstBMedian


          const secondAAboveB =
            secondAMedian >
            secondBMedian


          if (
            firstAAboveB ===
              secondAAboveB
          ) {
            continue
          }


          reversals.push({
            kind:
              'geographic_ordering',

            firstSecondaryCohortKey:
              first
                .secondaryCohortKey,

            firstSecondaryCohortLabel:
              first
                .secondaryCohortLabel,

            secondSecondaryCohortKey:
              second
                .secondaryCohortKey,

            secondSecondaryCohortLabel:
              second
                .secondaryCohortLabel,

            firstGeographyKey:
              firstKey,

            secondGeographyKey:
              secondKey,

            firstCohortOrdering:
              firstAAboveB
                ? [
                    firstKey,
                    secondKey
                  ]
                : [
                    secondKey,
                    firstKey
                  ],

            secondCohortOrdering:
              secondAAboveB
                ? [
                    firstKey,
                    secondKey
                  ]
                : [
                    secondKey,
                    firstKey
                  ]
          })
        }
      }
    }
  }


  return reversals
}


export function evaluatePriceMeterCrossDimensionalReversals(
  evidenceSet:
    PriceMeterCrossDimensionalEvidenceSet
): PriceMeterCrossDimensionalReversal[] {

  const established =
    evidenceSet
      .evidence
      .filter(
        evidence =>
          evidence.status ===
            'established'
      )


  const geographic =
    established.filter(
      (
        evidence
      ): evidence is PriceMeterCrossDimensionalGeographicEvidence =>
        evidence.kind ===
          'geographic'
    )


  if (
    geographic.length ===
      established.length
  ) {
    return evaluateGeographicReversals(
      geographic
    )
  }


  const directional =
    established.filter(
      (
        evidence
      ):
        evidence is
          | PriceMeterCrossDimensionalSizeEvidence
          | PriceMeterCrossDimensionalConstructionLandEvidence =>
        evidence.kind ===
          'size_relationship' ||
        evidence.kind ===
          'construction_to_land_relationship'
    )


  return evaluateDirectionalReversals(
    directional
  )
}


/*
 * ---------------------------------------------------------
 * STEP 9 — NON-ESTABLISHMENT
 * ---------------------------------------------------------
 *
 * Non-establishment records where the owning-phase
 * relationship could not be established because the
 * applicable numerical calculation requirements were not
 * met.
 *
 * It reports actual populations and requirements.
 *
 * It does NOT use a qualitative "insufficient evidence"
 * label.
 */

export type PriceMeterCrossDimensionalNonEstablishmentReason =
  | {
      kind:
        'geographic_relationship_not_established'

      representedObservationCount:
        number

      comparisonGeographyCount:
        number
    }
  | {
      kind:
        'size_relationship_not_established'

      representedObservationCount:
        number

      populatedBandCount:
        number

      requiredPopulatedBandCount:
        number
    }
  | {
      kind:
        'construction_to_land_relationship_not_established'

      representedObservationCount:
        number

      populatedCohortCount:
        number

      requiredPopulatedCohortCount:
        number

      requiredObservationCount:
        number
    }


export type PriceMeterCrossDimensionalNonEstablishment = {
  secondaryCohortKey:
    string

  secondaryCohortLabel:
    string

  reason:
    PriceMeterCrossDimensionalNonEstablishmentReason
}


export function evaluatePriceMeterCrossDimensionalNonEstablishment(
  evidenceSet:
    PriceMeterCrossDimensionalEvidenceSet
): PriceMeterCrossDimensionalNonEstablishment[] {

  return evidenceSet
    .evidence
    .filter(
      evidence =>
        evidence.status ===
          'not_established'
    )
    .map(
      evidence => {

        if (
          evidence.kind ===
            'geographic'
        ) {
          return {
            secondaryCohortKey:
              evidence.secondaryCohortKey,

            secondaryCohortLabel:
              evidence.secondaryCohortLabel,

            reason: {
              kind:
                'geographic_relationship_not_established' as const,

              representedObservationCount:
                evidence
                  .representedObservationCount,

              comparisonGeographyCount:
                evidence
                  .comparisonGeographyCount
            }
          }
        }


        if (
          evidence.kind ===
            'size_relationship'
        ) {
          return {
            secondaryCohortKey:
              evidence.secondaryCohortKey,

            secondaryCohortLabel:
              evidence.secondaryCohortLabel,

            reason: {
              kind:
                'size_relationship_not_established' as const,

              representedObservationCount:
                evidence
                  .representedObservationCount,

              populatedBandCount:
                evidence
                  .populatedBandCount,

              requiredPopulatedBandCount:
                evidence
                  .requiredPopulatedBandCount
            }
          }
        }


        return {
          secondaryCohortKey:
            evidence.secondaryCohortKey,

          secondaryCohortLabel:
            evidence.secondaryCohortLabel,

          reason: {
            kind:
              'construction_to_land_relationship_not_established' as const,

            representedObservationCount:
              evidence
                .representedObservationCount,

            populatedCohortCount:
              evidence
                .populatedCohortCount,

            requiredPopulatedCohortCount:
              evidence
                .requiredPopulatedCohortCount,

            requiredObservationCount:
              evidence
                .requiredObservationCount
          }
        }
      }
    )
}


/*
 * ---------------------------------------------------------
 * COMPLETE OUTCOME SET
 * ---------------------------------------------------------
 */

export type PriceMeterCrossDimensionalOutcomes = {
  persistence:
    PriceMeterCrossDimensionalPersistence

  variation:
    PriceMeterCrossDimensionalVariation | null

  reversals:
    PriceMeterCrossDimensionalReversal[]

  nonEstablishment:
    PriceMeterCrossDimensionalNonEstablishment[]
}


export function evaluatePriceMeterCrossDimensionalOutcomes(
  evidenceSet:
    PriceMeterCrossDimensionalEvidenceSet
): PriceMeterCrossDimensionalOutcomes {

  return {
    persistence:
      evaluatePriceMeterCrossDimensionalPersistence(
        evidenceSet
      ),

    variation:
      evaluatePriceMeterCrossDimensionalVariation(
        evidenceSet
      ),

    reversals:
      evaluatePriceMeterCrossDimensionalReversals(
        evidenceSet
      ),

    nonEstablishment:
      evaluatePriceMeterCrossDimensionalNonEstablishment(
        evidenceSet
      )
  }
}