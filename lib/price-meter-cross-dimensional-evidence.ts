/*
 * ---------------------------------------------------------
 * PRICE / M² CROSS-DIMENSIONAL EVIDENCE
 * ---------------------------------------------------------
 *
 * Phase 11 — Cross-Dimensional Price / m² Analysis
 *
 * Purpose:
 *
 * Define the numerical evidence contract produced when one
 * owning-phase analytical question is reconstructed inside
 * one secondary cohort.
 *
 * This file defines evidence shapes only.
 *
 * It DOES NOT:
 *
 * - construct populations
 * - calculate distributions
 * - calculate statistics
 * - determine Persistence
 * - determine Variation
 * - determine Reversal
 * - determine Non-establishment
 * - generate synthesis
 *
 * Every result reports the population that produced it.
 */


/*
 * ---------------------------------------------------------
 * COMMON EVIDENCE
 * ---------------------------------------------------------
 */

export type PriceMeterCrossDimensionalEvidenceStatus =
  | 'established'
  | 'not_established'


export type PriceMeterCrossDimensionalEvidenceBase = {
  secondaryCohortKey:
    string

  secondaryCohortLabel:
    string

  representedObservationCount:
    number

  status:
    PriceMeterCrossDimensionalEvidenceStatus
}


/*
 * ---------------------------------------------------------
 * PHASE 7 — GEOGRAPHIC EVIDENCE
 * ---------------------------------------------------------
 *
 * Reconstructs the canonical Phase 7 geographic comparison
 * inside one secondary population.
 *
 * Median remains the canonical geographic statistic.
 */

export type PriceMeterCrossDimensionalGeographicCohortStatistic = {
  geographyKey:
    string

  geographyLabel:
    string

  rank:
    number

  sampleSize:
    number

  medianPricePerM2:
    number | null

  medianDifferenceFromSelectedMarket:
    number | null

  medianPercentAboveOrBelowSelectedMarket:
    number | null
}


export type PriceMeterCrossDimensionalGeographicEvidence =
  PriceMeterCrossDimensionalEvidenceBase & {
    kind:
      'geographic'

    selectedMarketSampleSize:
      number

    selectedMarketMedianPricePerM2:
      number | null

    comparisonGeographyCount:
      number

    geographicStatistics:
      PriceMeterCrossDimensionalGeographicCohortStatistic[]
  }


/*
 * ---------------------------------------------------------
 * PHASE 8 — SIZE-RELATIONSHIP EVIDENCE
 * ---------------------------------------------------------
 *
 * Applies to:
 *
 * Property Area
 *   → Land-normalized Price / m²
 *
 * Construction Area
 *   → Construction-normalized Price / m²
 *
 * Numerical requirements remain explicit.
 */

export type PriceMeterCrossDimensionalSizeCoordinate = {
  areaM2:
    number

  normalizedPricePerM2:
    number

  observationCount:
    number
}


export type PriceMeterCrossDimensionalSizeEvidence = {
  secondaryCohortKey:
    string

  secondaryCohortLabel:
    string

  kind:
    'size_relationship'

  relationshipKind:
    | 'property_area_to_land_normalized_ratio'
    | 'construction_area_to_construction_normalized_ratio'

  representedObservationCount:
    number

  populatedBandCount:
    number

  requiredPopulatedBandCount:
    number

  hasRequiredPopulatedBands:
    boolean

  coordinates:
    PriceMeterCrossDimensionalSizeCoordinate[]

  spearmanRho:
    number | null

  logLogSlope:
    number | null

  modeledTenPercentAreaChangePercent:
    number | null

  rSquared:
    number | null

  modeledStatisticsAuthorization:
    | 'authorized'
    | 'withheld_mathematical_coupling'

  modeledStatisticsWithheldReason:
    | 'property_area_construction_to_land_coupling'
    | 'construction_area_construction_to_land_coupling'
    | null

  status:
    PriceMeterCrossDimensionalEvidenceStatus
}


/*
 * ---------------------------------------------------------
 * PHASE 9 — CONSTRUCTION-TO-LAND EVIDENCE
 * ---------------------------------------------------------
 *
 * Phase 9 restrictions travel intact into Phase 11.
 *
 * Spearman may be calculated only when the canonical
 * Phase 9 cohort and represented-observation requirements
 * are met.
 *
 * Regression, modeled percentage change, and R² remain
 * withheld because of mathematical coupling.
 */

export type PriceMeterCrossDimensionalConstructionLandCoordinate = {
  constructionToLandRatio:
    number

  normalizedPricePerM2:
    number

  observationCount:
    number
}


export type PriceMeterCrossDimensionalConstructionLandEvidence = {
  secondaryCohortKey:
    string

  secondaryCohortLabel:
    string

  kind:
    'construction_to_land_relationship'

  normalizationBasis:
    'land' | 'construction'

  representedObservationCount:
    number

  populatedCohortCount:
    number

  requiredPopulatedCohortCount:
    3

  requiredObservationCount:
    12

  hasRequiredPopulatedCohorts:
    boolean

  hasRequiredObservations:
    boolean

  coordinates:
    PriceMeterCrossDimensionalConstructionLandCoordinate[]

  spearmanRho:
    number | null

  regression:
    null

  rSquared:
    null

  modeledTenPercentChangePercent:
    null

  regressionWithheldReason:
    | 'shared_property_area_mathematical_coupling'
    | 'shared_construction_area_mathematical_coupling'

  status:
    PriceMeterCrossDimensionalEvidenceStatus
}


/*
 * ---------------------------------------------------------
 * CROSS-DIMENSIONAL EVIDENCE UNION
 * ---------------------------------------------------------
 *
 * One secondary cohort produces exactly one owning-phase
 * evidence object.
 */

export type PriceMeterCrossDimensionalEvidence =
  | PriceMeterCrossDimensionalGeographicEvidence
  | PriceMeterCrossDimensionalSizeEvidence
  | PriceMeterCrossDimensionalConstructionLandEvidence


/*
 * ---------------------------------------------------------
 * COMPLETE EVIDENCE SET
 * ---------------------------------------------------------
 *
 * One explicit Cross-Dimensional question produces one
 * evidence set containing the results for its applicable
 * secondary populations.
 *
 * No other Cross-Dimensional question is represented here.
 */

export type PriceMeterCrossDimensionalEvidenceSet = {
  questionKey:
    string

  inputObservationCount:
    number

  representedObservationCount:
    number

  excludedObservationCount:
    number

  secondaryCohortCount:
    number

  populatedSecondaryCohortCount:
    number

  establishedSecondaryCohortCount:
    number

  nonEstablishedSecondaryCohortCount:
    number

  evidence:
    PriceMeterCrossDimensionalEvidence[]
}