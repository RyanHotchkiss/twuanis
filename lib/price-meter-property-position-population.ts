/*
 * ---------------------------------------------------------
 * PRICE / M² PROPERTY POSITION POPULATION
 * ---------------------------------------------------------
 *
 * Phase 12 — Property Price / m² Position
 *
 * Purpose:
 *
 * Construct the canonical comparison population within
 * which one individual property's Price / m² position will
 * later be calculated.
 *
 * The market itself MUST already have been bounded upstream.
 *
 * This layer receives:
 *
 * - one canonical Property Position identity
 * - one already-bounded Price / m² observation population
 *
 * It then isolates exactly one compatible analytical
 * universe:
 *
 * Transaction Type
 * +
 * Property Basis
 * +
 * Normalization Basis
 *
 * This layer DOES NOT:
 *
 * - fetch listings
 * - query Supabase
 * - resolve geography
 * - apply market filters
 * - perform FX conversion
 * - calculate Price / m²
 * - calculate distributions
 * - calculate percentile position
 * - calculate median differences
 * - calculate confidence
 * - classify market position
 * - generate presentation
 *
 * Geography and explicit market filters remain upstream
 * population boundaries.
 */

import type {
  PriceMeterObservation
} from '@/lib/price-meter-observation-builder'

import type {
  PriceMeterPropertyPositionIdentity
} from '@/lib/price-meter-property-position-identity'


export type PriceMeterPropertyPositionPopulationExclusionReason =
  | 'transaction_type_mismatch'
  | 'property_basis_mismatch'
  | 'normalization_basis_mismatch'
  | 'analytical_identity_ineligible'
  | 'analytical_identity_mismatch'
  | 'missing_listing_id'


export type PriceMeterPropertyPositionPopulationExclusion = {
  listingId:
    string | null

  reason:
    PriceMeterPropertyPositionPopulationExclusionReason
}


export type PriceMeterPropertyPositionPopulation = {
  subject:
    PriceMeterPropertyPositionIdentity

  transactionType:
    PriceMeterPropertyPositionIdentity['transactionType']

  propertyBasis:
    PriceMeterPropertyPositionIdentity['propertyBasis']

  normalizationBasis:
    PriceMeterPropertyPositionIdentity['normalizationBasis']

  observations:
    PriceMeterObservation[]

  comparisonPopulationCount:
    number

  inputObservationCount:
    number

  excludedObservationCount:
    number

  exclusions:
    PriceMeterPropertyPositionPopulationExclusion[]
}


/*
 * ---------------------------------------------------------
 * ANALYTICAL IDENTITY CONSISTENCY
 * ---------------------------------------------------------
 *
 * The PriceMeterObservation already contains canonical
 * analytical identity.
 *
 * This helper verifies that the observation's flattened
 * analytical identity still agrees with that canonical
 * source.
 */

function hasConsistentAnalyticalIdentity(
  observation:
    PriceMeterObservation
): boolean {

  return (
    observation.transactionType ===
      observation
        .analyticalIdentity
        .transactionType &&
    observation.propertyBasis ===
      observation
        .analyticalIdentity
        .propertyBasis &&
    observation
      .analyticalIdentity
      .availableNormalizationBases
      .includes(
        observation.normalizationBasis
      )
  )
}


/*
 * ---------------------------------------------------------
 * CANONICAL OBSERVATION KEY
 * ---------------------------------------------------------
 *
 * Improved Property may legitimately have two observations
 * for the same listing:
 *
 * - Land-normalized
 * - Construction-normalized
 *
 * Therefore listing ID alone is NOT a unique Price / m²
 * observation identity.
 *
 * Within one Property Position population, however,
 * Normalization Basis is fixed. The explicit composite key
 * preserves that analytical distinction.
 */

function getObservationIdentityKey(
  observation:
    PriceMeterObservation
): string | null {

  if (
    observation.listingId ===
      null
  ) {
    return null
  }


  return [
    observation.listingId,
    observation.transactionType,
    observation.propertyBasis,
    observation.normalizationBasis
  ].join('::')
}


/*
 * ---------------------------------------------------------
 * PROPERTY POSITION POPULATION BUILDER
 * ---------------------------------------------------------
 */

export function buildPriceMeterPropertyPositionPopulation({
  subject,
  observations
}: {
  subject:
    PriceMeterPropertyPositionIdentity

  observations:
    PriceMeterObservation[]
}): PriceMeterPropertyPositionPopulation {

  const includedObservations:
    PriceMeterObservation[] =
      []

  const exclusions:
    PriceMeterPropertyPositionPopulationExclusion[] =
      []

  const includedObservationKeys =
    new Set<string>()


  /*
   * -------------------------------------------------------
   * ONE PASS THROUGH THE ALREADY-BOUNDED POPULATION
   * -------------------------------------------------------
   *
   * This layer does not create a market.
   *
   * It partitions the population already bounded by the
   * canonical Price / m² observation loader.
   */

  for (
    const observation of
      observations
  ) {

    /*
     * Sale and Rent are separate analytical universes.
     */

    if (
      observation.transactionType !==
        subject.transactionType
    ) {
      exclusions.push({
        listingId:
          observation.listingId,

        reason:
          'transaction_type_mismatch'
      })

      continue
    }


    /*
     * Land Only and Improved Property are separate
     * analytical universes.
     */

    if (
      observation.propertyBasis !==
        subject.propertyBasis
    ) {
      exclusions.push({
        listingId:
          observation.listingId,

        reason:
          'property_basis_mismatch'
      })

      continue
    }


    /*
     * Land-normalized and Construction-normalized
     * observations are separate analytical universes.
     */

    if (
      observation.normalizationBasis !==
        subject.normalizationBasis
    ) {
      exclusions.push({
        listingId:
          observation.listingId,

        reason:
          'normalization_basis_mismatch'
      })

      continue
    }


    /*
     * Every included observation must remain eligible under
     * its canonical upstream analytical identity.
     */

    if (
      !observation
        .analyticalIdentity
        .eligibility
        .eligible
    ) {
      exclusions.push({
        listingId:
          observation.listingId,

        reason:
          'analytical_identity_ineligible'
      })

      continue
    }


    /*
     * Defensive flattened/canonical identity invariant.
     */

    if (
      !hasConsistentAnalyticalIdentity(
        observation
      )
    ) {
      exclusions.push({
        listingId:
          observation.listingId,

        reason:
          'analytical_identity_mismatch'
      })

      continue
    }


    /*
     * Phase 12 positions identifiable properties.
     *
     * A comparison observation without a listing ID cannot
     * participate in this population because population
     * accounting and subject membership must remain
     * auditable at the property level.
     */

    const observationKey =
      getObservationIdentityKey(
        observation
      )


    if (
      observationKey ===
        null
    ) {
      exclusions.push({
        listingId:
          null,

        reason:
          'missing_listing_id'
      })

      continue
    }


    /*
     * Prevent duplicate analytical observations from
     * altering percentile position or population counts.
     *
     * This does NOT collapse a legitimate Land-normalized
     * observation with a Construction-normalized
     * observation because Normalization Basis forms part of
     * the canonical observation key.
     */

        if (
      includedObservationKeys.has(
        observationKey
      )
    ) {
      throw new Error(
        'Price / m² Property Position population contains a duplicate canonical analytical observation.'
      )
    }


    includedObservationKeys.add(
      observationKey
    )

    includedObservations.push(
      observation
    )
  }


  /*
   * -------------------------------------------------------
   * SUBJECT MEMBERSHIP
   * -------------------------------------------------------
   *
   * The subject property must itself exist inside the
   * comparison population.
   *
   * Phase 12 does not position an external property against
   * a population from which that property was excluded.
   */

  const subjectObservation =
    includedObservations.find(
      observation =>
        observation.listingId ===
          subject.listingId &&
        observation.transactionType ===
          subject.transactionType &&
        observation.propertyBasis ===
          subject.propertyBasis &&
        observation.normalizationBasis ===
          subject.normalizationBasis
    )


  if (
    !subjectObservation
  ) {
    throw new Error(
      'Price / m² Property Position subject is not represented in the canonical comparison population.'
    )
  }


  /*
   * -------------------------------------------------------
   * SUBJECT OBSERVATION CONSISTENCY
   * -------------------------------------------------------
   *
   * The observation found inside the population must be the
   * same canonical Price / m² observation represented by
   * the Property Position identity.
   */

  if (
    subjectObservation.pricePerM2 !==
      subject.propertyPricePerM2 ||
    subjectObservation.areaM2 !==
      subject.normalizationAreaM2 ||
    subjectObservation.analyticalPrice !==
      subject.analyticalPrice
  ) {
    throw new Error(
      'Price / m² Property Position subject identity does not match its canonical population observation.'
    )
  }


  /*
   * -------------------------------------------------------
   * FINAL POPULATION INVARIANT
   * -------------------------------------------------------
   */

  if (
    includedObservations.length +
      exclusions.length !==
    observations.length
  ) {
    throw new Error(
      'Price / m² Property Position population accounting is inconsistent.'
    )
  }


  return {
    subject,

    transactionType:
      subject.transactionType,

    propertyBasis:
      subject.propertyBasis,

    normalizationBasis:
      subject.normalizationBasis,

    observations:
      includedObservations,

    comparisonPopulationCount:
      includedObservations.length,

    inputObservationCount:
      observations.length,

    excludedObservationCount:
      exclusions.length,

    exclusions
  }
}