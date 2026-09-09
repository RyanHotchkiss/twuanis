import 'server-only'

import type {
  PriceMeterCharacteristicType
} from '@/lib/price-meter-characteristic-identity'


/*
 * ---------------------------------------------------------
 * PRICE / M² COMPARABLE DIMENSIONS
 * ---------------------------------------------------------
 *
 * Canonical ordering for optional Phase 12A comparable
 * dimensions.
 *
 * The order controls deterministic presentation and
 * cumulative population-trail execution.
 *
 * It does NOT imply:
 *
 * - weighting
 * - analytical importance
 * - causal importance
 * - recommended comparability
 * - similarity scoring
 */


export const PRICE_METER_COMPARABLE_DIMENSION_ORDER = [
  'bedrooms',
  'bathrooms',
  'parking',
  'year_built',
  'construction_land',
  'environment',
  'terrain',
  'utility',
  'accessibility',
  'legal_status'
] as const


export type PriceMeterComparableDimension =
  typeof PRICE_METER_COMPARABLE_DIMENSION_ORDER[number]


export type PriceMeterComparableOntologyDimension =
  Exclude<
    PriceMeterComparableDimension,
    'year_built' |
    'construction_land'
  >


export const PRICE_METER_COMPARABLE_ONTOLOGY_DIMENSIONS:
  readonly PriceMeterComparableOntologyDimension[] = [
    'bedrooms',
    'bathrooms',
    'parking',
    'environment',
    'terrain',
    'utility',
    'accessibility',
    'legal_status'
  ]


export function isPriceMeterComparableDimension(
  value: unknown
): value is PriceMeterComparableDimension {
  return (
    typeof value === 'string' &&
    (
      PRICE_METER_COMPARABLE_DIMENSION_ORDER as
        readonly string[]
    ).includes(value)
  )
}


export function isPriceMeterComparableOntologyDimension(
  value: unknown
): value is PriceMeterComparableOntologyDimension {
  return (
    typeof value === 'string' &&
    (
      PRICE_METER_COMPARABLE_ONTOLOGY_DIMENSIONS as
        readonly string[]
    ).includes(value)
  )
}


export function toPriceMeterCharacteristicType(
  dimension: PriceMeterComparableOntologyDimension
): PriceMeterCharacteristicType {
  return dimension
}