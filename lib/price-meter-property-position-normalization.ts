import type { PriceMeterObservation } from './price-meter-observation-builder'
import type {
  PriceMeterPropertyPositionIdentity,
} from './price-meter-property-position-identity'

export type PriceMeterPropertyPositionNormalizationLens = {
  normalizationBasis: PriceMeterObservation['normalizationBasis']
  subject: PriceMeterPropertyPositionIdentity
}

export type PriceMeterPropertyPositionNormalization = {
  listingId: string
  propertyBasis: PriceMeterObservation['propertyBasis']

  land: PriceMeterPropertyPositionNormalizationLens | null
  construction: PriceMeterPropertyPositionNormalizationLens | null

  availableNormalizationCount: number
}

/**
 * Resolves the canonical Phase 12 normalization lenses available
 * for one subject listing.
 *
 * Improved Property may legitimately expose:
 *
 *   Land-normalized Price / m² Position
 *   Construction-normalized Price / m² Position
 *
 * Each remains an independent analytical question.
 *
 * Vacant Land may expose only:
 *
 *   Land-normalized Price / m² Position
 *
 * This function:
 * - consumes already-resolved canonical property-position identities
 * - does not create or repair analytical identities
 * - does not convert one normalization basis into another
 * - does not blend Land and Construction observations
 * - does not build comparison populations
 * - does not calculate distributions
 * - does not calculate percentiles
 * - does not calculate median differences
 * - does not calculate confidence
 */
export function buildPriceMeterPropertyPositionNormalization({
  identities,
}: {
  identities: PriceMeterPropertyPositionIdentity[]
}): PriceMeterPropertyPositionNormalization {
  if (identities.length === 0) {
    throw new Error(
      'Cannot resolve property Price / m² normalization without at least one canonical subject identity.',
    )
  }

  const listingId = identities[0].listingId
  const propertyBasis = identities[0].propertyBasis
  const transactionType = identities[0].transactionType

  let land: PriceMeterPropertyPositionNormalizationLens | null = null
  let construction: PriceMeterPropertyPositionNormalizationLens | null = null

  for (const identity of identities) {
    if (identity.listingId !== listingId) {
      throw new Error(
        'Property Price / m² normalization identities do not represent one subject listing.',
      )
    }

    if (identity.propertyBasis !== propertyBasis) {
      throw new Error(
        'Property Price / m² normalization identities do not preserve one canonical Property Basis.',
      )
    }

    if (identity.transactionType !== transactionType) {
      throw new Error(
        'Property Price / m² normalization identities do not preserve one canonical Transaction Type.',
      )
    }

    if (identity.normalizationBasis === 'land') {
      if (land !== null) {
        throw new Error(
          'Property Price / m² normalization contains duplicate Land-normalized subject identities.',
        )
      }

      land = {
        normalizationBasis: 'land',
        subject: identity,
      }

      continue
    }

    if (identity.normalizationBasis === 'construction') {
      if (construction !== null) {
        throw new Error(
          'Property Price / m² normalization contains duplicate Construction-normalized subject identities.',
        )
      }

      construction = {
        normalizationBasis: 'construction',
        subject: identity,
      }

      continue
    }

    throw new Error(
      'Property Price / m² normalization contains an unsupported Normalization Basis.',
    )
  }

  if (propertyBasis === 'land_only' && construction !== null) {
    throw new Error(
      'Vacant Land cannot have a Construction-normalized Price / m² position.',
    )
  }

  if (propertyBasis === 'land_only' && land === null) {
    throw new Error(
      'Vacant Land requires a canonical Land-normalized Price / m² identity.',
    )
  }

  const availableNormalizationCount =
    (land === null ? 0 : 1) +
    (construction === null ? 0 : 1)

  if (availableNormalizationCount === 0) {
    throw new Error(
      'Subject property has no canonical Price / m² normalization available for Property Position.',
    )
  }

  return {
    listingId,
    propertyBasis,

    land,
    construction,

    availableNormalizationCount,
  }
}