import { supabase } from '@/lib/supabase'

import {
  buildPriceMeterDistribution,
  type PriceMeterDistribution
} from '@/lib/price-meter-distribution'

import type {
  PriceMeterObservation
} from '@/lib/price-meter-observation-builder'

import type {
  PriceMeterTransactionType
} from '@/lib/price-meter-transaction-cohort'

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
  ontologyTermId: number
  termType: PriceMeterCharacteristicType

  termName: string
  termNameEn: string | null
  termNameEs: string | null

  slug: string
  slugEn: string | null
  slugEs: string | null
}


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


type ListingOntologyAssignmentRow = {
  listing_id: string

  ontology_terms:
    | {
        id: number
        term_name: string
        term_name_en: string | null
        term_name_es: string | null
        term_type: string
        slug: string
        slug_en: string | null
        slug_es: string | null
      }
    | Array<{
        id: number
        term_name: string
        term_name_en: string | null
        term_name_es: string | null
        term_type: string
        slug: string
        slug_en: string | null
        slug_es: string | null
      }>
    | null
}


function isPriceMeterCharacteristicType(
  value: string
): value is PriceMeterCharacteristicType {
  return (
    PRICE_METER_CHARACTERISTIC_TYPES as
      readonly string[]
  ).includes(value)
}


function resolveOntologyTerm(
  row: ListingOntologyAssignmentRow
) {
  if (Array.isArray(row.ontology_terms)) {
    return row.ontology_terms[0] ?? null
  }

  return row.ontology_terms
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
   * ONTOLOGY MEMBERSHIP
   * -------------------------------------------------------
   *
   * Twuanis already knows which listings instantiate which
   * canonical ontology concepts through
   * listings_ontology_terms.
   *
   * Preserve that identity here. Do not recreate
   * characteristic meaning from raw listing strings.
   */


  const {
    data,
    error
  } = await supabase
    .from('listings_ontology_terms')
    .select(`
      listing_id,
      ontology_terms (
        id,
        term_name,
        term_name_en,
        term_name_es,
        term_type,
        slug,
        slug_en,
        slug_es
      )
    `)
    .in(
      'listing_id',
      listingIds
    )


  if (error) {
    throw error
  }


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
    const rawRow of
      (data || [])
  ) {
    const row =
      rawRow as
        ListingOntologyAssignmentRow

    const term =
      resolveOntologyTerm(row)


    if (!term) {
      continue
    }


    if (
      !isPriceMeterCharacteristicType(
        term.term_type
      )
    ) {
      continue
    }


    if (
      !observationsByListingId.has(
        row.listing_id
      )
    ) {
      continue
    }


    const existing =
      characteristicMap.get(
        term.id
      )


    if (existing) {
      existing.listingIds.add(
        row.listing_id
      )

      continue
    }


    characteristicMap.set(
      term.id,
      {
        characteristic: {
          ontologyTermId:
            term.id,

          termType:
            term.term_type,

          termName:
            term.term_name,

          termNameEn:
            term.term_name_en,

          termNameEs:
            term.term_name_es,

          slug:
            term.slug,

          slugEn:
            term.slug_en,

          slugEs:
            term.slug_es
        },

        listingIds:
          new Set([
            row.listing_id
          ])
      }
    )
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