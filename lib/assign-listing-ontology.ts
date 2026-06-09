import { supabase } from '@/lib/supabase'

function normalize(value: any): string {
  return String(value || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
}

export async function assignListingOntology(
  listingId: string,
  listingData: any
) {

  console.log(
    'ASSIGN ONTOLOGY CALLED',
    listingId
  )

  const valuesToMatch = [

    listingData.province,
    listingData.canton,
    listingData.district,

    listingData.property_type,

    listingData.bedrooms,
    listingData.bathrooms,
    listingData.parking,

    listingData.year_built_range,

    listingData.property_area,
    listingData.construction_area,

    listingData.environment,
    listingData.accessibility,
    listingData.legal_status,

    ...(listingData.utility || []),
    ...(listingData.terrain || [])

  ].filter(Boolean)

  console.log(
    'VALUES TO MATCH:',
    valuesToMatch
  )

  if (valuesToMatch.length === 0) {
    return
  }

  const { data: ontologyTerms, error } =
    await supabase
      .from('ontology_terms')
      .select(`
        id,
        parent_id,
        term_type,
        term_name,
        term_name_en,
        term_name_es,
        slug,
        slug_en,
        slug_es
      `)

  if (error) {

    console.error(
      'ONTOLOGY QUERY ERROR',
      error
    )

    return

  }

  if (!ontologyTerms?.length) {
    return
  }

  console.log(
    'ONTOLOGY TERMS FOUND',
    ontologyTerms.length
  )

  const termMap = new Map()

  for (const term of ontologyTerms) {

    const aliases = [

      term.term_name,
      term.term_name_en,
      term.term_name_es,
      term.slug,
      term.slug_en,
      term.slug_es

    ]

    for (const alias of aliases) {

      if (!alias) continue

      termMap.set(
        normalize(alias),
        term
      )

    }

  }

  const matchedTerms = new Map()

  for (const value of valuesToMatch) {

    const match =
      termMap.get(
        normalize(value)
      )

    if (match) {

      matchedTerms.set(
        match.id,
        match
      )

    }

  }

  if (matchedTerms.size === 0) {

    console.log(
      'NO ONTOLOGY TERMS FOUND',
      valuesToMatch
    )

    return

  }

  /*
    Parent Expansion
    Example:

    Santa Ana
      -> San José
      -> Costa Rica

    Condo
      -> Property Types

    Beachfront
      -> Environment
  */

  const ontologyById =
    new Map(
      ontologyTerms.map(
        term => [term.id, term]
      )
    )

  const expandedTerms =
    new Map(matchedTerms)

  for (const term of matchedTerms.values()) {

    let currentParentId =
      term.parent_id

    while (
      currentParentId
    ) {

      const parent =
        ontologyById.get(
          currentParentId
        )

      if (!parent) {
        break
      }

      expandedTerms.set(
        parent.id,
        parent
      )

      currentParentId =
        parent.parent_id

    }

  }

  const inserts =
    Array.from(
      expandedTerms.values()
    )
    .map(term => ({
      listing_id: listingId,
      ontology_term_id: term.id
    }))

  console.log(
    'MATCHED TERMS',
    Array.from(
      expandedTerms.values()
    )
  )

  console.log(
    'INSERT COUNT',
    inserts.length
  )

  const response =
    await supabase
      .from('listings_ontology_terms')
      .upsert(
        inserts,
        {
          onConflict:
            'listing_id,ontology_term_id',
          ignoreDuplicates: true
        }
      )

  console.log(
    'ONTOLOGY INSERT RESPONSE',
    response
  )

  if (response.error) {

    console.error(
      'ONTOLOGY INSERT ERROR',
      response.error
    )

  }

}