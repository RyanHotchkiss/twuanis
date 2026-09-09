/*
 * ---------------------------------------------------------
 * PRICE / M² USER-DEFINED COMPARABLE BROWSER CONTRACT
 * ---------------------------------------------------------
 *
 * Phase 12A
 *
 * Browser-safe serialized contract only.
 *
 * Crown Jewel analytical machinery is server-only.
 * It must never use or enter a "use client" import graph.
 *
 * Client/browser code receives only authorized minimum
 * evidence/results, not proprietary analytical machinery.
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


export type PriceMeterComparableBrowserConfidence = {
  score:
    90 | 75 | 60 | 35
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
  propertyPricePerM2:
    number

  comparisonPopulationCount:
    number

  percentilePosition:
    number

  tail:
    'below_p10' | 'above_p90'

  thresholdPercentile:
    10 | 90

  thresholdPricePerM2:
    number

  differenceFromThreshold:
    number

  percentDifferenceFromThreshold:
    number

  percentageReference:
    | 'selected_population_p10'
    | 'selected_population_p90'
} | null


/*
 * Browser C:L context deliberately exposes only the
 * quantitative physical evidence required for presentation.
 *
 * The nested canonical Construction-to-Land identity is
 * server-only and is NOT serialized.
 */

export type PriceMeterComparableBrowserConstructionToLandContext = {
  propertyAreaM2:
    number

  constructionAreaM2:
    number

  constructionToLandRatio:
    number
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