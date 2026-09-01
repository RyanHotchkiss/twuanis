import {
  buildPriceMeterDistribution,
  type PriceMeterDistribution
} from '@/lib/price-meter-distribution'

import {
  loadPriceMeterOntologyMemberships
} from '@/lib/price-meter-ontology-membership'

import type {
  PriceMeterObservation
} from '@/lib/price-meter-observation-builder'

import type {
  PriceMeterTransactionType
} from '@/lib/price-meter-transaction-cohort'

import type {
  PriceMeterCharacteristicIdentity
} from '@/lib/price-meter-characteristic-identity'
export {
  PRICE_METER_CHARACTERISTIC_TYPES,
  isPriceMeterCharacteristicType
} from '@/lib/price-meter-characteristic-identity'

export type {
  PriceMeterCharacteristicType,
  PriceMeterCharacteristicIdentity
} from '@/lib/price-meter-characteristic-identity'
export type PriceMeterCharacteristicDistribution<
  T extends PriceMeterTransactionType
> = {
  characteristic:
    PriceMeterCharacteristicIdentity

  matchingListingIds:
    string[]

  sampleSize:
    number

  distribution:
    PriceMeterDistribution<T>
}

export async function buildPriceMeterCharacteristicDistributions<
  T extends PriceMeterTransactionType
>({
  observations,
  transactionType
}: {
  observations:
    PriceMeterObservation[]

  transactionType:
    T
}): Promise<
  PriceMeterCharacteristicDistribution<T>[]
> {
  if (!observations.length) {
    return []
  }

  if (
  observations.some(
    observation =>
      observation.transactionType !==
        transactionType
  )
) {
  throw new Error(
    'Price / m² characteristic distribution contains mixed Sale/Rent observations.'
  )
}

  /*
   * -------------------------------------------------------
   * CANONICAL ANALYTICAL POPULATION
   * -------------------------------------------------------
   *
   * The observations supplied here must already represent
   * one compatible Price / m² cohort.
   *
   * This function does not create or repair analytical
   * compatibility.
   *
   * Transaction Type, Property Basis and Normalization Basis
   * must already have been isolated upstream.
   */


  const observationsByListingId =
    new Map<
      string,
      PriceMeterObservation
    >()


  for (const observation of observations) {
    if (!observation.listingId) {
      continue
    }

    observationsByListingId.set(
      observation.listingId,
      observation
    )
  }


  const listingIds =
    Array.from(
      observationsByListingId.keys()
    )


  if (!listingIds.length) {
    return []
  }

    /*
   * -------------------------------------------------------
   * CANONICAL ONTOLOGY MEMBERSHIP
   * -------------------------------------------------------
   *
   * Ontology retrieval belongs to the dedicated Price / m²
   * ontology-membership layer.
   *
   * This distribution layer consumes canonical positive
   * membership. It does not query or reconstruct ontology
   * identity itself.
   */


  const memberships =
    await loadPriceMeterOntologyMemberships(
      listingIds
    )


  /*
   * -------------------------------------------------------
   * CHARACTERISTIC → LISTING MEMBERSHIP
   * -------------------------------------------------------
   */


  const characteristicMap =
    new Map<
      number,
      {
        characteristic:
          PriceMeterCharacteristicIdentity

        listingIds:
          Set<string>
      }
    >()


  for (
    const membership of
      memberships
  ) {

    for (
      const characteristic of
        membership.characteristics
    ) {

      const existing =
        characteristicMap.get(
          characteristic
            .ontologyTermId
        )


      if (
        existing
      ) {
        existing.listingIds.add(
          membership.listingId
        )

        continue
      }


      characteristicMap.set(
        characteristic
          .ontologyTermId,
        {
          characteristic,

          listingIds:
            new Set([
              membership.listingId
            ])
        }
      )
    }
  }

  /*
   * -------------------------------------------------------
   * CHARACTERISTIC PRICE / m² DISTRIBUTIONS
   * -------------------------------------------------------
   *
   * Billy receives the already-canonical observations.
   *
   * No monetary reconstruction happens here.
   * No FX conversion happens here.
   * No denominator reconstruction happens here.
   */


  const results:
    PriceMeterCharacteristicDistribution<T>[] =
        []


  for (
    const {
      characteristic,
      listingIds:
        characteristicListingIds
    }
    of characteristicMap.values()
  ) {
    const matchingObservations =
      Array.from(
        characteristicListingIds
      )
        .map(
          listingId =>
            observationsByListingId.get(
              listingId
            )
        )
        .filter(
          (
            observation
          ): observation is
            PriceMeterObservation =>
              observation !== undefined
        )


    if (!matchingObservations.length) {
      continue
    }


    const distribution =
        buildPriceMeterDistribution({
            transactionType,
            observations:
            matchingObservations
        })


    results.push({
      characteristic,

      matchingListingIds:
        Array.from(
          characteristicListingIds
        ),

      sampleSize:
        matchingObservations.length,

      distribution
    })
  }


  return results.sort(
    (left, right) => {
      if (
        left.characteristic.termType !==
        right.characteristic.termType
      ) {
        return (
          left.characteristic.termType
            .localeCompare(
              right.characteristic.termType
            )
        )
      }


      if (
        left.sampleSize !==
        right.sampleSize
      ) {
        return (
          right.sampleSize -
          left.sampleSize
        )
      }


      return (
        left.characteristic.termName
          .localeCompare(
            right.characteristic.termName
          )
      )
    }
  )
}