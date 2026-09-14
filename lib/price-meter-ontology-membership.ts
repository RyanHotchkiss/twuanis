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

  // Client request budgets, not assumptions about the server response limit.
  const maxIdsPerChunk = 25
  const maxEncodedIdsLength = 1500
  const pageSize = 500
  const chunks: string[][] = []
  let chunk: string[] = []
  let encodedLength = 0

  for (const listingId of uniqueListingIds) {
    // Include conservative allowance for IN-list quoting and separators.
    const length = encodeURIComponent(JSON.stringify(listingId)).length + 3
    if (length > maxEncodedIdsLength) {
      throw new Error('PPM2 membership listing ID exceeds the request budget.')
    }
    if (chunk.length && (chunk.length >= maxIdsPerChunk ||
        encodedLength + length > maxEncodedIdsLength)) {
      chunks.push(chunk)
      chunk = []
      encodedLength = 0
    }
    chunk.push(listingId)
    encodedLength += length
  }
  if (chunk.length) chunks.push(chunk)

  const data: ListingOntologyAssignmentRow[] = []
  for (const listingIdChunk of chunks) {
    let offset = 0
    let expectedCount: number | null = null
    do {
      const { data: page, error, count } = await supabase
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
    `, { count: 'exact' })
        .in('listing_id', listingIdChunk)
        .order('listing_id', { ascending: true })
        .order('ontology_term_id', { ascending: true })
        .range(offset, offset + pageSize - 1)

      if (error) throw error
      if (count === null || !Number.isSafeInteger(count) || count < 0) {
        throw new Error('PPM2 membership completeness requires an exact row count.')
      }
      if (expectedCount !== null && count !== expectedCount) {
        throw new Error('PPM2 membership evidence changed during pagination.')
      }
      expectedCount = count
      const rows = (page ?? []) as ListingOntologyAssignmentRow[]
      if (offset + rows.length > count || (!rows.length && offset < count)) {
        throw new Error('PPM2 membership pagination returned incomplete evidence.')
      }
      data.push(...rows)
      // A server may return fewer than pageSize rows. Advance by rows received,
      // and finish only when the exact total has been acquired.
      offset += rows.length
    } while (offset < expectedCount)
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