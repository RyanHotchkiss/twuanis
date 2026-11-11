/*
 * ---------------------------------------------------------
 * PRICE / M² PROPERTY POSITION IDENTITY
 * ---------------------------------------------------------
 *
 * Phase 12 — Property Price / m² Position
 *
 * Purpose:
 *
 * Establish the canonical analytical identity of one
 * individual Price / m² observation before property-position
 * mathematics occur.
 *
 * Property Position answers:
 *
 * WHERE DOES THIS PROPERTY'S LISTING PRICE / M² FALL WITHIN
 * THIS EXPLICITLY DEFINED MARKET POPULATION?
 *
 * This layer consumes an already-canonical
 * PriceMeterObservation.
 *
 * It DOES NOT independently resolve:
 *
 * - Transaction Type
 * - Property Basis
 * - Normalization Basis
 * - Geography
 * - Analytical price
 * - Normalization area
 * - Price / m²
 *
 * Those identities are established upstream and remain
 * authoritative.
 *
 * This layer DOES NOT:
 *
 * - load market observations
 * - create comparison populations
 * - calculate distributions
 * - calculate percentile position
 * - calculate median differences
 * - calculate percentage differences
 * - calculate confidence
 * - classify market position
 * - generate user-facing presentation
 * - prescribe a real-estate decision
 */

import type {
  PriceMeterObservation
} from '@/lib/price-meter-observation-builder'

import type {
  PriceMeterAnalyticalCurrency
} from '@/lib/price-meter-identity'

import {
  resolvePriceMeterConstructionLandIdentity,
  type PriceMeterConstructionLandIdentity
} from '@/lib/price-meter-construction-land'


export type PriceMeterPropertyPositionIdentity = {
  listingId:
    string

  transactionType:
    PriceMeterObservation['transactionType']

  propertyBasis:
    PriceMeterObservation['propertyBasis']

  normalizationBasis:
    PriceMeterObservation['normalizationBasis']

  geography:
    PriceMeterObservation['geography']

  analyticalCurrency:
    PriceMeterAnalyticalCurrency

  analyticalPrice:
    number

  normalizationAreaM2:
    number

  propertyPricePerM2:
    number

  constructionToLandIdentity:
    PriceMeterConstructionLandIdentity | null
}


/*
 * ---------------------------------------------------------
 * PROPERTY POSITION IDENTITY RESOLUTION
 * ---------------------------------------------------------
 *
 * Phase 12 positions one identifiable property observation.
 *
 * The supplied observation must already have passed the
 * canonical Price / m² analytical identity and observation
 * boundaries.
 *
 * This resolver verifies the invariants required by
 * Property Position and preserves the established identity.
 */

export function resolvePriceMeterPropertyPositionIdentity(
  observation:
    PriceMeterObservation
): PriceMeterPropertyPositionIdentity {

  /*
   * Property Position concerns one identifiable listing.
   *
   * A canonical Price / m² observation may exist without a
   * listing ID for other analytical purposes, but Phase 12
   * cannot establish an individual Property Position without
   * an identifiable subject property.
   */

  if (
    observation.listingId ===
      null
  ) {
    throw new Error(
      'Price / m² Property Position requires an identifiable listing.'
    )
  }


  /*
   * Defensive upstream identity invariant.
   *
   * Phase 12 must never admit an observation whose canonical
   * analytical identity is no longer eligible.
   */

  if (
    !observation
      .analyticalIdentity
      .eligibility
      .eligible
  ) {
    throw new Error(
      'Price / m² Property Position requires an eligible canonical analytical identity.'
    )
  }


  /*
   * Transaction identity must agree with the canonical
   * analytical identity.
   */

  if (
    observation.transactionType !==
      observation
        .analyticalIdentity
        .transactionType
  ) {
    throw new Error(
      'Price / m² Property Position transaction identity is inconsistent.'
    )
  }


  /*
   * Property Basis must agree with the canonical analytical
   * identity.
   */

  if (
    observation.propertyBasis !==
      observation
        .analyticalIdentity
        .propertyBasis
  ) {
    throw new Error(
      'Price / m² Property Position property-basis identity is inconsistent.'
    )
  }


  /*
   * The observation's normalization basis must remain one
   * of the bases authorized by the canonical analytical
   * identity.
   */

  if (
    !observation
      .analyticalIdentity
      .availableNormalizationBases
      .includes(
        observation.normalizationBasis
      )
  ) {
    throw new Error(
      'Price / m² Property Position normalization basis is not authorized by the canonical analytical identity.'
    )
  }


  /*
   * Vacant Land can never participate in Construction-
   * normalized Price / m² intelligence.
   */

  if (
    observation.propertyBasis ===
      'land_only' &&
    observation.normalizationBasis ===
      'construction'
  ) {
    throw new Error(
      'Land Only Property Position cannot use Construction normalization.'
    )
  }


  /*
   * Property Position requires the exact normalization area
   * already carried by the canonical observation.
   *
   * No midpoint, range, tolerance, nearest-band assignment,
   * estimation, or imputation is permitted.
   */

  if (
    !Number.isFinite(
      observation.areaM2
    ) ||
    observation.areaM2 <=
      0
  ) {
    throw new Error(
      'Price / m² Property Position requires an exact positive normalization area.'
    )
  }


  /*
   * Analytical price must be finite and positive.
   */

  if (
    !Number.isFinite(
      observation.analyticalPrice
    ) ||
    observation.analyticalPrice <=
      0
  ) {
    throw new Error(
      'Price / m² Property Position requires a positive canonical analytical price.'
    )
  }


  /*
   * Price / m² must already exist as a finite positive
   * canonical observation.
   */

  if (
    !Number.isFinite(
      observation.pricePerM2
    ) ||
    observation.pricePerM2 <=
      0
  ) {
    throw new Error(
      'Price / m² Property Position requires a positive canonical Price / m² observation.'
    )
  }


  /*
   * Defensive arithmetic invariant.
   *
   * Phase 12 does not recalculate Price / m² as analytical
   * work. This check verifies that the canonical observation
   * remains internally coherent.
   */

  const expectedPricePerM2 =
    observation.analyticalPrice /
    observation.areaM2


  if (
    !Number.isFinite(
      expectedPricePerM2
    ) ||
    Math.abs(
      expectedPricePerM2 -
      observation.pricePerM2
    ) >
      Number.EPSILON *
      Math.max(
        1,
        Math.abs(
          expectedPricePerM2
        ),
        Math.abs(
          observation.pricePerM2
        )
      ) *
      16
  ) {
    throw new Error(
      'Price / m² Property Position observation contains inconsistent Price / m² arithmetic.'
    )
  }


  /*
   * Construction-to-Land identity is contextual evidence.
   *
   * It is resolved only from the already-canonical analytical
   * identity and remains null where the Phase 9 identity
   * requirements are not satisfied.
   *
   * Construction-to-Land identity does not alter percentile
   * mathematics or independently redefine the comparison
   * population.
   */

  const constructionToLandIdentity =
    resolvePriceMeterConstructionLandIdentity(
      observation.analyticalIdentity
    )


  return {
    listingId:
      observation.listingId,

    transactionType:
      observation.transactionType,

    propertyBasis:
      observation.propertyBasis,

    normalizationBasis:
      observation.normalizationBasis,

    geography:
      observation.geography,

    analyticalCurrency:
      observation
        .analyticalIdentity
        .analyticalCurrency,

    analyticalPrice:
      observation.analyticalPrice,

    normalizationAreaM2:
      observation.areaM2,

    propertyPricePerM2:
      observation.pricePerM2,

    constructionToLandIdentity
  }
}