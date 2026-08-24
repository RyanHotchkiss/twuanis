/*
 * ---------------------------------------------------------
 * PRICE / M² SIZE-RELATIONSHIP IDENTITY
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Establish the canonical analytical identity of a
 * Price / m² size relationship before relationship
 * mathematics occur.
 *
 * Two size relationships are analytically valid:
 *
 * 1. Construction area
 *    → construction-normalized total-price ratio
 *
 * 2. Property area
 *    → land-normalized total-price ratio
 *
 * This layer prevents area / denominator identity mismatch.
 *
 * It DOES NOT:
 *
 * - calculate Spearman correlation
 * - calculate regression
 * - calculate modeled area change
 * - calculate R²
 * - calculate distributions
 * - create size cohorts
 * - generate user-facing synthesis
 */

import type {
  PriceMeterAnalyticalCurrency,
  PriceMeterAnalyticalIdentity,
  PriceMeterNormalizationBasis,
  PriceMeterPropertyBasis,
  PriceMeterTransactionType
} from '@/lib/price-meter-identity'

export type PriceMeterSizeRelationshipKind =
  | 'construction_area_to_construction_normalized_ratio'
  | 'property_area_to_land_normalized_ratio'

export type PriceMeterSizeAreaBasis =
| 'construction'
| 'property'

export type PriceMeterSizeRelationshipIdentity = {
  relationshipKind:
    PriceMeterSizeRelationshipKind

  areaBasis:
    PriceMeterSizeAreaBasis

  normalizationBasis:
    PriceMeterNormalizationBasis

  transactionType:
    PriceMeterTransactionType

  propertyBasis:
    PriceMeterPropertyBasis

  geography:
    PriceMeterAnalyticalIdentity['geography']

  analyticalCurrency:
    PriceMeterAnalyticalCurrency

  areaM2:
    number

  eligible:
    true
}

const SIZE_RELATIONSHIP_DEFINITIONS = {
  construction_area_to_construction_normalized_ratio: {
    areaBasis:
      'construction',

    normalizationBasis:
      'construction'
  },

  property_area_to_land_normalized_ratio: {
    areaBasis:
      'property',

    normalizationBasis:
      'land'
  }
} as const satisfies Record<
  PriceMeterSizeRelationshipKind,
  {
    areaBasis:
      PriceMeterSizeAreaBasis

    normalizationBasis:
      PriceMeterNormalizationBasis
  }
>

export function getPriceMeterSizeRelationshipDefinition(
  relationshipKind:
    PriceMeterSizeRelationshipKind
) {

  return SIZE_RELATIONSHIP_DEFINITIONS[
    relationshipKind
  ]
}

export function resolvePriceMeterSizeRelationshipIdentity({
  analyticalIdentity,
  relationshipKind
}: {
  analyticalIdentity:
    PriceMeterAnalyticalIdentity

  relationshipKind:
    PriceMeterSizeRelationshipKind
}): PriceMeterSizeRelationshipIdentity | null {

  if (
    !analyticalIdentity
      .eligibility
      .eligible
  ) {

    return null
  }


  if (
    analyticalIdentity
      .transactionType ===
      null
  ) {

    return null
  }


  if (
    analyticalIdentity
      .propertyBasis ===
      'unknown'
  ) {

    return null
  }


  const definition =
    getPriceMeterSizeRelationshipDefinition(
      relationshipKind
    )


  if (
    !analyticalIdentity
      .availableNormalizationBases
      .includes(
        definition
          .normalizationBasis
      )
  ) {

    return null
  }


  const areaM2 =
    definition.areaBasis ===
      'construction'
      ? analyticalIdentity
          .constructionAreaM2
      : analyticalIdentity
          .propertyAreaM2


  if (
    areaM2 ===
      null ||
    !Number.isFinite(
      areaM2
    ) ||
    areaM2 <=
      0
  ) {

    return null
  }


  return {
    relationshipKind,

    areaBasis:
      definition.areaBasis,

    normalizationBasis:
      definition
        .normalizationBasis,

    transactionType:
      analyticalIdentity
        .transactionType,

    propertyBasis:
      analyticalIdentity
        .propertyBasis,

    geography:
      analyticalIdentity
        .geography,

    analyticalCurrency:
      analyticalIdentity
        .analyticalCurrency,

    areaM2,

    eligible:
      true
  }
}