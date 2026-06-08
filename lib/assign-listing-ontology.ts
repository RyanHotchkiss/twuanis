import { supabase } from '@/lib/supabase'

export async function assignListingOntology(
  listingId: string,
  listingData: any
) {

  console.log(
    'ASSIGN ONTOLOGY CALLED',
    listingId
  )

  console.log(
    'LISTING DATA',
    listingData
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

  const { data: ontologyTerms } =
    await supabase
      .from('ontology_terms')
      .select('id, term_name_en')

      console.log(
        'ONTOLOGY TERMS FOUND',
        ontologyTerms?.length
        )

  if (!ontologyTerms) {
    return
  }

console.log(
  'ONTOLOGY TERM COUNT:',
  ontologyTerms?.length
)

  const inserts = ontologyTerms
    .filter(term =>
      valuesToMatch.includes(term.term_name_en)
    )
    .map(term => ({
      listing_id: listingId,
      ontology_term_id: term.id
    }))

  if (inserts.length === 0) {

    console.log(
      'NO ONTOLOGY TERMS FOUND',
      valuesToMatch
    )

    return
  }

console.log(
  'INSERTS',
  inserts
)

  const response =
    await supabase
      .from('listings_ontology_terms')
      .insert(inserts)

  console.log(
  'ONTOLOGY INSERT FULL:',
  JSON.stringify(response, null, 2)
)

console.log(
  'ONTOLOGY ERROR:',
  response.error
)

}