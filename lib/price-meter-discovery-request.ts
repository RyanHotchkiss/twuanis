/*
 * ---------------------------------------------------------
 * COMPARATIVE PRICE / M² DISCOVERY REQUEST
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Define and validate the canonical analytical question for
 * Comparative Price / m² Discovery.
 *
 * Comparative Discovery is market-centric.
 *
 * One validated request establishes:
 *
 * - one canonical Province
 * - one canonical Canton
 * - one canonical District
 * - one Transaction Type
 * - one canonical Property Type
 * - one Property Basis
 * - one Normalization Basis
 * - one canonical Property Area cohort
 * - one canonical Construction Area cohort when applicable
 * - one Price / m² distribution criterion
 *
 * The same non-geographic analytical identity is used for
 * both geographic evidence populations:
 *
 * 1. District
 * 2. Canton
 *
 * District and Canton remain separate analytical
 * populations and receive separate Price / m²
 * distributions downstream.
 *
 * ---------------------------------------------------------
 * CRITICAL BOUNDARY
 * ---------------------------------------------------------
 *
 * Ordinary Intelligence Hub filters DO NOT belong to this
 * analytical request.
 *
 * Bedrooms, bathrooms, parking, year built, environment,
 * terrain, utilities, accessibility, legal status, asking
 * price and similar viewing preferences may reduce which
 * qualifying properties are displayed downstream.
 *
 * They MUST NOT redefine the Price / m² comparison
 * population.
 *
 * This file therefore deliberately contains no generic
 * filter bag and no spreadable "all filters" structure.
 *
 * ---------------------------------------------------------
 * THIS LAYER DOES NOT
 * ---------------------------------------------------------
 *
 * - query Supabase
 * - load listings
 * - load ontology membership
 * - build Price / m² observations
 * - build District or Canton populations
 * - calculate distributions
 * - calculate percentiles
 * - apply ordinary viewing filters
 * - broaden geography
 * - relax analytical requirements
 * - infer missing identity
 */


import type {
  CanonicalGeographyTerm
} from '@/lib/geography/canonical-geography'

import type {
  PriceMeterCharacteristicIdentity
} from '@/lib/price-meter-characteristic-identity'

import type {
  PriceMeterNormalizationBasis,
  PriceMeterPropertyBasis,
  PriceMeterTransactionType
} from '@/lib/price-meter-identity'

import {
  resolveConstructionAreaConstraint,
  resolvePropertyAreaConstraint
} from '@/lib/market-intelligence-area-ranges'


/*
 * ---------------------------------------------------------
 * DISTRIBUTION CRITERION
 * ---------------------------------------------------------
 *
 * These values identify the user-selected Price / m²
 * distribution condition.
 *
 * Exact numerical qualification belongs downstream after
 * the applicable geographic distribution has been built.
 *
 * District criteria are evaluated against the District
 * distribution.
 *
 * Canton criteria are evaluated against the Canton
 * distribution.
 */


export const PRICE_METER_DISCOVERY_CRITERIA = [
  'at_or_below_p10',
  'at_or_below_p25',
  'below_median',
  'above_median',
  'at_or_above_p75',
  'at_or_above_p90'
] as const


export type PriceMeterDiscoveryCriterion =
  typeof PRICE_METER_DISCOVERY_CRITERIA[number]


export function isPriceMeterDiscoveryCriterion(
  value:
    unknown
): value is PriceMeterDiscoveryCriterion {

  return (
    typeof value ===
      'string' &&
    (
      PRICE_METER_DISCOVERY_CRITERIA as
        readonly string[]
    ).includes(
      value
    )
  )
}


/*
 * ---------------------------------------------------------
 * COMPARISON DEFINITION
 * ---------------------------------------------------------
 *
 * This is the analytical identity of one Comparative
 * Discovery question.
 *
 * Geography is explicit at all three levels because:
 *
 * - Province establishes the canonical parent boundary.
 * - Canton establishes the bounded working geography.
 * - District establishes the default narrower evidence
 *   population.
 *
 * Property Type is canonical ontology identity.
 *
 * Area ranges are canonical range keys resolved through
 * market-intelligence-area-ranges.ts.
 */


export type PriceMeterDiscoveryComparisonDefinition = {
  province:
    CanonicalGeographyTerm

  canton:
    CanonicalGeographyTerm

  district:
    CanonicalGeographyTerm

  transactionType:
    PriceMeterTransactionType

  propertyType:
    PriceMeterCharacteristicIdentity

  propertyBasis:
    Exclude<
      PriceMeterPropertyBasis,
      'unknown'
    >

  normalizationBasis:
    PriceMeterNormalizationBasis

  propertyAreaRange:
    string

  constructionAreaRange:
    string | null
}


/*
 * ---------------------------------------------------------
 * REQUEST
 * ---------------------------------------------------------
 *
 * The criterion is deliberately separate from comparison
 * identity.
 *
 * The comparison definition establishes WHO belongs to the
 * analytical population.
 *
 * The criterion establishes WHICH members of that
 * population qualify after its Price / m² distribution is
 * calculated.
 */


export type PriceMeterDiscoveryRequest = {
  comparison:
    PriceMeterDiscoveryComparisonDefinition

  criterion:
    PriceMeterDiscoveryCriterion
}


/*
 * ---------------------------------------------------------
 * VALIDATION
 * ---------------------------------------------------------
 */


export type PriceMeterDiscoveryRequestValidationReason =
  | 'invalid_province'
  | 'invalid_canton'
  | 'invalid_district'
  | 'canton_province_hierarchy_conflict'
  | 'district_canton_hierarchy_conflict'
  | 'invalid_transaction_type'
  | 'invalid_property_type'
  | 'invalid_property_basis'
  | 'invalid_normalization_basis'
  | 'land_only_requires_land_normalization'
  | 'invalid_property_area_range'
  | 'land_only_cannot_have_construction_area_range'
  | 'improved_property_requires_construction_area_range'
  | 'invalid_construction_area_range'
  | 'construction_normalization_requires_improved_property'
  | 'invalid_criterion'


export type PriceMeterDiscoveryRequestValidation = {
  valid:
    boolean

  reasons:
    PriceMeterDiscoveryRequestValidationReason[]
}


/*
 * ---------------------------------------------------------
 * GEOGRAPHY VALIDATION
 * ---------------------------------------------------------
 *
 * Comparative Discovery requires a complete canonical
 * Province → Canton → District hierarchy.
 *
 * No automatic geography relaxation occurs here.
 */


function validateDiscoveryGeography(
  comparison:
    PriceMeterDiscoveryComparisonDefinition,

  reasons:
    PriceMeterDiscoveryRequestValidationReason[]
): void {

  const {
    province,
    canton,
    district
  } = comparison


  if (
    !province ||
    province.term_type !==
      'province'
  ) {
    reasons.push(
      'invalid_province'
    )
  }


  if (
    !canton ||
    canton.term_type !==
      'canton'
  ) {
    reasons.push(
      'invalid_canton'
    )
  }


  if (
    !district ||
    district.term_type !==
      'district'
  ) {
    reasons.push(
      'invalid_district'
    )
  }


  if (
    province &&
    province.term_type ===
      'province' &&
    canton &&
    canton.term_type ===
      'canton' &&
    canton.parent_id !==
      province.id
  ) {
    reasons.push(
      'canton_province_hierarchy_conflict'
    )
  }


  if (
    canton &&
    canton.term_type ===
      'canton' &&
    district &&
    district.term_type ===
      'district' &&
    district.parent_id !==
      canton.id
  ) {
    reasons.push(
      'district_canton_hierarchy_conflict'
    )
  }
}


/*
 * ---------------------------------------------------------
 * ANALYTICAL IDENTITY VALIDATION
 * ---------------------------------------------------------
 */


function validateDiscoveryAnalyticalIdentity(
  comparison:
    PriceMeterDiscoveryComparisonDefinition,

  reasons:
    PriceMeterDiscoveryRequestValidationReason[]
): void {

  /*
   * Transaction universes remain sovereign.
   */

  if (
    comparison.transactionType !==
      'sale' &&
    comparison.transactionType !==
      'rent'
  ) {
    reasons.push(
      'invalid_transaction_type'
    )
  }


  /*
   * Property Type must be positive canonical ontology
   * identity.
   */

  if (
    !comparison.propertyType ||
    comparison.propertyType.termType !==
      'property_type' ||
    !Number.isInteger(
      comparison.propertyType
        .ontologyTermId
    ) ||
    comparison.propertyType
      .ontologyTermId <=
        0
  ) {
    reasons.push(
      'invalid_property_type'
    )
  }


  /*
   * Unknown Property Basis is structurally excluded from
   * Comparative Discovery.
   */

  if (
    comparison.propertyBasis !==
      'land_only' &&
    comparison.propertyBasis !==
      'improved_property'
  ) {
    reasons.push(
      'invalid_property_basis'
    )
  }


  if (
    comparison.normalizationBasis !==
      'land' &&
    comparison.normalizationBasis !==
      'construction'
  ) {
    reasons.push(
      'invalid_normalization_basis'
    )
  }


  /*
   * Vacant/Land Only property can never use construction
   * normalization.
   */

  if (
    comparison.propertyBasis ===
      'land_only' &&
    comparison.normalizationBasis !==
      'land'
  ) {
    reasons.push(
      'land_only_requires_land_normalization'
    )
  }


  /*
   * Construction normalization is available only to
   * Improved Property.
   */

  if (
    comparison.normalizationBasis ===
      'construction' &&
    comparison.propertyBasis !==
      'improved_property'
  ) {
    reasons.push(
      'construction_normalization_requires_improved_property'
    )
  }
}


/*
 * ---------------------------------------------------------
 * AREA COHORT VALIDATION
 * ---------------------------------------------------------
 *
 * Comparative Discovery requires a canonical Property Area
 * cohort.
 *
 * Improved Property additionally requires a canonical
 * Construction Area cohort.
 *
 * Land Only structurally omits Construction Area.
 *
 * These are exact-measurement cohort classifications.
 * No midpoint, nearest range, tolerance or inferred exact
 * measurement is permitted here.
 */


function validateDiscoveryAreaCohorts(
  comparison:
    PriceMeterDiscoveryComparisonDefinition,

  reasons:
    PriceMeterDiscoveryRequestValidationReason[]
): void {

  if (
    !comparison.propertyAreaRange ||
    !resolvePropertyAreaConstraint(
      comparison.propertyAreaRange
    )
  ) {
    reasons.push(
      'invalid_property_area_range'
    )
  }


  if (
    comparison.propertyBasis ===
      'land_only'
  ) {

    if (
      comparison.constructionAreaRange !==
        null
    ) {
      reasons.push(
        'land_only_cannot_have_construction_area_range'
      )
    }


    return
  }


  if (
    comparison.propertyBasis ===
      'improved_property'
  ) {

    if (
      !comparison.constructionAreaRange
    ) {
      reasons.push(
        'improved_property_requires_construction_area_range'
      )

      return
    }


    if (
      !resolveConstructionAreaConstraint(
        comparison.constructionAreaRange
      )
    ) {
      reasons.push(
        'invalid_construction_area_range'
      )
    }
  }
}


/*
 * ---------------------------------------------------------
 * CANONICAL REQUEST VALIDATOR
 * ---------------------------------------------------------
 */


export function validatePriceMeterDiscoveryRequest(
  request:
    PriceMeterDiscoveryRequest
): PriceMeterDiscoveryRequestValidation {

  const reasons:
    PriceMeterDiscoveryRequestValidationReason[] =
      []


  validateDiscoveryGeography(
    request.comparison,
    reasons
  )


  validateDiscoveryAnalyticalIdentity(
    request.comparison,
    reasons
  )


  validateDiscoveryAreaCohorts(
    request.comparison,
    reasons
  )


  if (
    !isPriceMeterDiscoveryCriterion(
      request.criterion
    )
  ) {
    reasons.push(
      'invalid_criterion'
    )
  }


  return {
    valid:
      reasons.length ===
        0,

    reasons
  }
}


/*
 * ---------------------------------------------------------
 * ASSERTION
 * ---------------------------------------------------------
 *
 * Downstream analytical machinery may use this assertion at
 * its boundary rather than repeating request validation.
 */


export function assertValidPriceMeterDiscoveryRequest(
  request:
    PriceMeterDiscoveryRequest
): void {

  const validation =
    validatePriceMeterDiscoveryRequest(
      request
    )


  if (
    validation.valid
  ) {
    return
  }


  throw new Error(
    `Invalid Comparative Price / m² Discovery request: ${
      validation.reasons.join(
        ', '
      )
    }.`
  )
}