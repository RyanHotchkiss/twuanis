/*
 * ---------------------------------------------------------
 * PRICE / M² USER-DEFINED COMPARABLE BROWSER CONTRACT
 * ---------------------------------------------------------
 *
 * Phase 12A
 *
 * Browser-safe serialized contract only.
 *
 * This file contains:
 *
 * - no server-only import
 * - no analytical engine imports
 * - no ontology identities
 * - no raw observations
 * - no peer listing IDs
 * - no proprietary cohort machinery
 *
 * Crown Jewel analytical machinery must never enter a
 * "use client" import graph.
 */


export type PriceMeterComparableBrowserLanguage =
  | 'en'
  | 'es'


export type PriceMeterComparableBrowserGeographyLevel =
  | 'province'
  | 'canton'
  | 'district'


export type PriceMeterComparableBrowserNormalizationBasis =
  | 'land'
  | 'construction'


export type PriceMeterComparableBrowserDimension =
  | 'bedrooms'
  | 'bathrooms'
  | 'parking'
  | 'year_built'
  | 'construction_land'
  | 'environment'
  | 'terrain'
  | 'utility'
  | 'accessibility'
  | 'legal_status'


export type PriceMeterComparableBrowserText = {
  en:
    string

  es:
    string
}


export type PriceMeterComparableBrowserPopulationTrail = {
  basePopulationCount:
    number

  steps:
    Array<{
      dimension:
        PriceMeterComparableBrowserDimension

      beforeCount:
        number

      afterCount:
        number

      removedCount:
        number
    }>

  finalPopulationCount:
    number
}


export type PriceMeterComparableBrowserPresentation = {
  listingId:
    string

  transactionType:
    'sale' | 'rent'

  propertyBasis:
    'land_only' | 'improved_property'

  geographyOptions:
    Array<{
      level:
        PriceMeterComparableBrowserGeographyLevel

      label:
        PriceMeterComparableBrowserText
    }>

  normalizationOptions:
    Array<{
      basis:
        PriceMeterComparableBrowserNormalizationBasis

      label:
        PriceMeterComparableBrowserText
    }>

  baseCohort: {
    propertyType:
      PriceMeterComparableBrowserText

    propertyAreaRange:
      string

    constructionAreaRange:
      string | null
  }

  optionalDimensions:
    Array<{
      dimension:
        PriceMeterComparableBrowserDimension

      label:
        PriceMeterComparableBrowserText

      value:
        PriceMeterComparableBrowserText
    }>
}


export type PriceMeterComparableBrowserGeography = {
  level:
    PriceMeterComparableBrowserGeographyLevel

  province:
    string | null

  canton:
    string | null

  district:
    string | null
}


export type PriceMeterComparableBrowserConfidence = {
  score:
    number
}


export type PriceMeterComparableBrowserDistribution = {
  minimum:
    number

  p10:
    number

  p25:
    number

  median:
    number

  p75:
    number

  p90:
    number

  maximum:
    number

  iqr:
    number
}


export type PriceMeterComparableBrowserPercentile = {
  position:
    number

  method:
    'midrank'

  belowCount:
    number

  equalCount:
    number

  aboveCount:
    number
}


export type PriceMeterComparableBrowserMedianPosition = {
  difference:
    number

  percentDifference:
    number

  percentageReference:
    'selected_population_median'
}


export type PriceMeterComparableBrowserDistributionInterval =
  | 'below_p10'
  | 'p10_to_p25'
  | 'p25_to_median'
  | 'at_median'
  | 'median_to_p75'
  | 'p75_to_p90'
  | 'above_p90'


export type PriceMeterComparableBrowserTail = {
  side:
    'below_p10' | 'above_p90'

  threshold:
    number

  difference:
    number

  percentDifference:
    number
} | null


export type PriceMeterComparableBrowserConstructionToLandContext = {
  ratio:
    number

  cohortKey:
    string

  cohortLabel:
    string
} | null


type PriceMeterComparableBrowserEvidenceCommon = {
  listingId:
    string

  transactionType:
    'sale' | 'rent'

  propertyBasis:
    'land_only' | 'improved_property'

  normalizationBasis:
    PriceMeterComparableBrowserNormalizationBasis

  geography:
    PriceMeterComparableBrowserGeography

  analyticalCurrency:
    'CRC'

  activeDimensions:
    PriceMeterComparableBrowserDimension[]

  propertyPricePerM2:
    number

  comparisonPopulationCount:
    number

  subjectExcluded:
    true

  populationTrail:
    PriceMeterComparableBrowserPopulationTrail
}


export type PriceMeterComparableBrowserSuccessEvidence =
  PriceMeterComparableBrowserEvidenceCommon & {
    status:
      'ok'

    confidence:
      PriceMeterComparableBrowserConfidence

    distribution:
      PriceMeterComparableBrowserDistribution

    percentile:
      PriceMeterComparableBrowserPercentile

    medianPosition:
      PriceMeterComparableBrowserMedianPosition

    distributionInterval:
      PriceMeterComparableBrowserDistributionInterval

    tail:
      PriceMeterComparableBrowserTail

    constructionToLandContext:
      PriceMeterComparableBrowserConstructionToLandContext
  }


export type PriceMeterComparableBrowserNoPeersEvidence =
  PriceMeterComparableBrowserEvidenceCommon & {
    status:
      'no_peers'
  }


export type PriceMeterComparableBrowserEvidence =
  | PriceMeterComparableBrowserSuccessEvidence
  | PriceMeterComparableBrowserNoPeersEvidence


export type PriceMeterComparableBrowserConfigurationResponse = {
  presentation:
    PriceMeterComparableBrowserPresentation
}


export type PriceMeterComparableBrowserAnalysisResponse = {
  evidence:
    PriceMeterComparableBrowserEvidence

  presentation:
    PriceMeterComparableBrowserPresentation
}