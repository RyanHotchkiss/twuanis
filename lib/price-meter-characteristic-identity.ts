/*
 * ---------------------------------------------------------
 * PRICE / M² CHARACTERISTIC IDENTITY
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Define the canonical ontology-backed characteristic
 * identities recognized by Price / m² intelligence.
 *
 * This layer answers:
 *
 * What kinds of canonical characteristics can Price / m²
 * reason about, and what identity does one characteristic
 * carry?
 *
 * This layer DOES NOT:
 *
 * - query ontology membership
 * - build Price / m² observations
 * - define comparison cohorts
 * - resolve populations
 * - calculate distributions
 * - calculate relationships
 * - calculate statistics
 */


export const PRICE_METER_CHARACTERISTIC_TYPES = [
  'property_type',
  'bedrooms',
  'bathrooms',
  'parking',
  'year_built',
  'utility',
  'environment',
  'terrain',
  'accessibility',
  'legal_status'
] as const


export type PriceMeterCharacteristicType =
  typeof PRICE_METER_CHARACTERISTIC_TYPES[number]


export type PriceMeterCharacteristicIdentity = {
  ontologyTermId:
    number

  termType:
    PriceMeterCharacteristicType

  termName:
    string

  termNameEn:
    string | null

  termNameEs:
    string | null

  slug:
    string

  slugEn:
    string | null

  slugEs:
    string | null
}


export function isPriceMeterCharacteristicType(
  value:
    string
): value is PriceMeterCharacteristicType {

  return (
    PRICE_METER_CHARACTERISTIC_TYPES as
      readonly string[]
  ).includes(
    value
  )
}