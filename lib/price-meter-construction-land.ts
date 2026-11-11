/*
 * ---------------------------------------------------------
 * PRICE / M² CONSTRUCTION-TO-LAND IDENTITY
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Establish the canonical analytical identity of the
 * relationship between reported Construction Area and
 * Property Area before distribution, cohort, relationship,
 * or presentation mathematics occur.
 *
 * Construction-to-Land Ratio:
 *
 *   reported construction area / property area
 *
 * This is a numerical relationship between two canonical
 * listing measurements.
 *
 * It DOES NOT represent physical Site Coverage.
 *
 * This layer DOES NOT:
 *
 * - create Construction-to-Land cohorts
 * - calculate distributions
 * - calculate Price / m² differences
 * - calculate Spearman correlation
 * - calculate regression
 * - calculate R²
 * - infer physical building footprint
 * - generate user-facing synthesis
 */

import type {
  PriceMeterAnalyticalCurrency,
  PriceMeterAnalyticalIdentity,
  PriceMeterTransactionType
} from '@/lib/price-meter-identity'


export type PriceMeterConstructionLandIdentity = {
  transactionType:
    PriceMeterTransactionType

  propertyBasis:
    'improved_property'

  geography:
    PriceMeterAnalyticalIdentity['geography']

  analyticalCurrency:
    PriceMeterAnalyticalCurrency

    availableNormalizationBases:
    PriceMeterAnalyticalIdentity['availableNormalizationBases']

  originalCurrency:
    PriceMeterAnalyticalIdentity['originalCurrency']

  price:
    PriceMeterAnalyticalIdentity['price']

  priceIntegrity:
    PriceMeterAnalyticalIdentity['priceIntegrity']

  propertyAreaM2:
    number

  constructionAreaM2:
    number

  constructionToLandRatio:
    number

  eligible:
    true
}


export function resolvePriceMeterConstructionLandIdentity(
  analyticalIdentity:
    PriceMeterAnalyticalIdentity
): PriceMeterConstructionLandIdentity | null {

  /*
   * Construction-to-Land intelligence consumes only
   * canonically eligible Price / m² observations.
   */

  if (
    !analyticalIdentity
      .eligibility
      .eligible
  ) {
    return null
  }


  /*
   * Sale and Rent must remain explicitly identified.
   */

  if (
    analyticalIdentity
      .transactionType ===
      null
  ) {
    return null
  }


  /*
   * Construction-to-Land intelligence is defined only
   * for Improved Property.
   */

  if (
    analyticalIdentity
      .propertyBasis !==
      'improved_property'
  ) {
    return null
  }

    /*
   * Construction-to-Land intelligence requires access to
   * both canonical normalization bases.
   *
   * This preserves the ability to compare the same eligible
   * property using:
   *
   * - Land-normalized Price / m²
   * - Construction-normalized Price / m²
   */

  if (
    !analyticalIdentity
      .availableNormalizationBases
      .includes(
        'land'
      ) ||
    !analyticalIdentity
      .availableNormalizationBases
      .includes(
        'construction'
      )
  ) {
    return null
  }


  /*
   * Both canonical measurements must be exact,
   * positive, finite, and analytically usable.
   *
   * Missing or invalid measurements fail closed.
   */

  const propertyAreaM2 =
    analyticalIdentity
      .propertyArea
      .exactM2


  const constructionAreaM2 =
    analyticalIdentity
      .constructionArea
      .exactM2


  if (
    propertyAreaM2 ===
      null ||
    !analyticalIdentity
      .propertyArea
      .analyticallyUsable ||
    !Number.isFinite(
      propertyAreaM2
    ) ||
    propertyAreaM2 <=
      0
  ) {
    return null
  }


  if (
    constructionAreaM2 ===
      null ||
    !analyticalIdentity
      .constructionArea
      .analyticallyUsable ||
    !Number.isFinite(
      constructionAreaM2
    ) ||
    constructionAreaM2 <=
      0
  ) {
    return null
  }


  const constructionToLandRatio =
    constructionAreaM2 /
    propertyAreaM2


  if (
    !Number.isFinite(
      constructionToLandRatio
    ) ||
    constructionToLandRatio <=
      0
  ) {
    return null
  }


  return {
    transactionType:
      analyticalIdentity
        .transactionType,

    propertyBasis:
      'improved_property',

    geography:
      analyticalIdentity
        .geography,

    analyticalCurrency:
      analyticalIdentity
        .analyticalCurrency,

        availableNormalizationBases:
      analyticalIdentity
        .availableNormalizationBases,

    originalCurrency:
      analyticalIdentity
        .originalCurrency,

    price:
      analyticalIdentity
        .price,

    priceIntegrity:
      analyticalIdentity
        .priceIntegrity,

    propertyAreaM2,

    constructionAreaM2,

    constructionToLandRatio,

    eligible:
      true
  }
}
