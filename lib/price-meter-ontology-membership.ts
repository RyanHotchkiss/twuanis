/*
 * ---------------------------------------------------------
 * PRICE / M² ONTOLOGY MEMBERSHIP
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Retrieve positive canonical ontology membership for a
 * bounded set of listing IDs.
 *
 * This layer answers:
 *
 * Which canonical ontology terms are explicitly assigned
 * to each requested listing?
 *
 * This layer DOES NOT:
 *
 * - build Price / m² observations
 * - establish analytical compatibility
 * - define comparison cohorts
 * - resolve comparison-cohort populations
 * - calculate distributions
 * - calculate statistics
 * - infer negative membership from absence
 *
 * Missing membership means only that positive membership
 * was not established.
 */


import { supabase } from '@/lib/supabase'

import {
  isPriceMeterCharacteristicType,
  type PriceMeterCharacteristicIdentity
} from '@/lib/price-meter-characteristic-identity'


export type PriceMeterOntologyMembership = {
  listingId:
    string

  characteristics:
    PriceMeterCharacteristicIdentity[]

  ontologyTermIds:
    number[]
}


type ListingOntologyAssignmentRow = {
  listing_id:
    string

  ontology_terms:
    | {
        id:
          number

        term_name:
          string

        term_name_en:
          string | null

        term_name_es:
          string | null

        term_type:
          string

        slug:
          string

        slug_en:
          string | null

        slug_es:
          string | null
      }
    | Array<{
        id:
          number

        term_name:
          string

        term_name_en:
          string | null

        term_name_es:
          string | null

        term_type:
          string

        slug:
          string

        slug_en:
          string | null

        slug_es:
          string | null
      }>
    | null
}

function resolveOntologyTerm(
  row:
    ListingOntologyAssignmentRow
) {

  if (
    Array.isArray(
      row.ontology_terms
    )
  ) {
    return (
      row.ontology_terms[0] ??
      null
    )
  }


  return row.ontology_terms
}


export async function loadPriceMeterOntologyMemberships(
  listingIds:
    string[]
): Promise<
  PriceMeterOntologyMembership[]
> {

  /*
   * -------------------------------------------------------
   * BOUNDED LISTING POPULATION
   * -------------------------------------------------------
   *
   * This loader never discovers listings.
   *
   * It retrieves ontology membership only for listing IDs
   * explicitly supplied by an upstream analytical
   * population.
   */

  const uniqueListingIds =
    Array.from(
      new Set(
        listingIds.filter(
          listingId =>
            Boolean(
              listingId
            )
        )
      )
    )


  if (
    !uniqueListingIds.length
  ) {
    return []
  }


  /*
   * -------------------------------------------------------
   * CANONICAL ONTOLOGY ASSIGNMENTS
   * -------------------------------------------------------
   */

  const {
    data,
    error
  } = await supabase
    .from(
      'listings_ontology_terms'
    )
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
      uniqueListingIds
    )


  if (
    error
  ) {
    throw error
  }


  /*
   * -------------------------------------------------------
   * LISTING → CHARACTERISTIC MEMBERSHIP
   * -------------------------------------------------------
   *
   * Preserve positive canonical ontology identity.
   *
   * Terms outside the Price / m² characteristic universe
   * are deliberately ignored here.
   */

  const membershipMap =
    new Map<
      string,
      Map<
        number,
        PriceMeterCharacteristicIdentity
      >
    >()


  for (
    const listingId of
      uniqueListingIds
  ) {
    membershipMap.set(
      listingId,
      new Map()
    )
  }


  for (
    const rawRow of
      data || []
  ) {

    const row =
      rawRow as
        ListingOntologyAssignmentRow


    const term =
      resolveOntologyTerm(
        row
      )


    if (
      !term
    ) {
      continue
    }


    if (
      !isPriceMeterCharacteristicType(
        term.term_type
      )
    ) {
      continue
    }


    const listingMembership =
      membershipMap.get(
        row.listing_id
      )


    if (
      !listingMembership
    ) {
      continue
    }


    listingMembership.set(
      term.id,
      {
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
      }
    )
  }


  /*
   * -------------------------------------------------------
   * CANONICAL RESULT
   * -------------------------------------------------------
   *
   * Every requested listing survives structurally even if
   * it has zero qualifying characteristic memberships.
   *
   * An empty characteristics array means:
   *
   * no positive qualifying membership was established.
   *
   * It does NOT mean the listing possesses the opposite
   * characteristics.
   */

  return uniqueListingIds.map(
    listingId => {

      const characteristics =
        Array.from(
          membershipMap
            .get(
              listingId
            )
            ?.values() ??
          []
        )


      return {
        listingId,

        characteristics,

        ontologyTermIds:
          characteristics.map(
            characteristic =>
              characteristic
                .ontologyTermId
          )
      }
    }
  )
}