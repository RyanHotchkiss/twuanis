import { supabase } from '@/lib/supabase'

import type {
  PriceMeterComparisonRequest
} from '@/lib/price-meter-comparison-request'


type PriceMeterComparisonCandidateListing = {
  id: string
  title: string | null
  images: unknown
  transaction_type: string | null
  currency: string | null
  monthly_price: number | null
  property_area: number | null
  construction_area: number | null
  province: string | null
  canton: string | null
  district: string | null
  property_type: string | null
  bedrooms: string | null
  bathrooms: string | null
  parking: string | null
  price_millions: number | null
  current_price: number | null
  created_at: string | null
}


function intersectListingIdSets(
  sets: Set<string>[]
): string[] {
  if (!sets.length) {
    return []
  }

  const [
    first,
    ...rest
  ] = sets

  return Array.from(first).filter(
    listingId =>
      rest.every(
        set =>
          set.has(listingId)
      )
  )
}


async function loadCohortCandidateListingIds(
  request:
    PriceMeterComparisonRequest,

  side:
    'A' | 'B'
): Promise<string[]> {
  const cohort =
    side === 'A'
      ? request.cohortA
      : request.cohortB

  const requiredOntologyTermIds = [
    cohort.propertyType.ontologyTermId,
    ...cohort.characteristics.map(
      characteristic =>
        characteristic.ontologyTermId
    )
  ]

  const {
    data,
    error
  } = await supabase
    .from('listings_ontology_terms')
    .select(`
      listing_id,
      ontology_term_id
    `)
    .in(
      'ontology_term_id',
      requiredOntologyTermIds
    )

  if (error) {
    throw error
  }

  const listingIdsByTerm =
    new Map<
      number,
      Set<string>
    >()

  for (
    const ontologyTermId
    of requiredOntologyTermIds
  ) {
    listingIdsByTerm.set(
      ontologyTermId,
      new Set<string>()
    )
  }

  for (
    const row
    of data || []
  ) {
    const listingIds =
      listingIdsByTerm.get(
        row.ontology_term_id
      )

    if (!listingIds) {
      continue
    }

    listingIds.add(
      row.listing_id
    )
  }

  const ontologyIntersection =
    intersectListingIdSets(
      Array.from(
        listingIdsByTerm.values()
      )
    )

  if (!ontologyIntersection.length) {
    return []
  }

  const geographyTermId =
    cohort.geography.id

  const {
    data: geographyRows,
    error: geographyError
  } = await supabase
    .from('listings_ontology_terms')
    .select('listing_id')
    .eq(
      'ontology_term_id',
      geographyTermId
    )
    .in(
      'listing_id',
      ontologyIntersection
    )

  if (geographyError) {
    throw geographyError
  }

  const geographyListingIds =
    new Set(
      (geographyRows || []).map(
        row =>
          row.listing_id
      )
    )

  return ontologyIntersection.filter(
    listingId =>
      geographyListingIds.has(
        listingId
      )
  )
}


export async function loadPriceMeterComparisonCandidates(
  request:
    PriceMeterComparisonRequest
): Promise<
  PriceMeterComparisonCandidateListing[]
> {
  const [
    cohortAListingIds,
    cohortBListingIds
  ] = await Promise.all([
    loadCohortCandidateListingIds(
      request,
      'A'
    ),

    loadCohortCandidateListingIds(
      request,
      'B'
    )
  ])

  const candidateListingIds =
    Array.from(
      new Set([
        ...cohortAListingIds,
        ...cohortBListingIds
      ])
    )

  if (!candidateListingIds.length) {
    return []
  }

  const {
    data,
    error
  } = await supabase
    .from('listings')
    .select(`
      id,
      title,
      images,
      transaction_type,
      currency,
      monthly_price,
      property_area,
      construction_area,
      province,
      canton,
      district,
      property_type,
      bedrooms,
      bathrooms,
      parking,
      price_millions,
      current_price,
      created_at
    `)
    .in(
      'id',
      candidateListingIds
    )
    .eq(
      'listing_status',
      'active'
    )

  if (error) {
    throw error
  }

  return (
    data || []
  ) as PriceMeterComparisonCandidateListing[]
}