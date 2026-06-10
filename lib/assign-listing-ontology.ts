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

  const {
          data: ontologyTerms,
          error
        } =
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

        const {
          data: relationships,
          error: relationshipError
        } =
          await supabase
            .from('ontology_relationships')
            .select(`
              source_term_id,
              target_term_id,
              relationship_type
            `)

        if (relationshipError) {

          console.error(
            'RELATIONSHIP QUERY ERROR',
            relationshipError
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

                const matchedProvince =
                  ontologyTerms.find(
                    term =>
                      term.term_type === 'province'
                      &&
                      normalize(
                        term.term_name_en ||
                        term.term_name
                      ) === normalize(
                        listingData.province
                      )
                  )

                if (matchedProvince) {

                  matchedTerms.set(
                    matchedProvince.id,
                    matchedProvince
                  )

                }


console.log('MATCHED PROVINCE', matchedProvince)


                const matchedCanton =
                  ontologyTerms.find(
                    term =>
                      term.term_type === 'canton'
                      &&
                      matchedProvince
                      &&
                      term.parent_id === matchedProvince.id
                      &&
                      normalize(
                        term.term_name_en ||
                        term.term_name
                      ) === normalize(
                        listingData.canton
                      )
                  )

                if (matchedCanton) {

                  matchedTerms.set(
                    matchedCanton.id,
                    matchedCanton
                  )

                }

console.log('MATCHED CANTON', matchedCanton)


                  const matchedDistrict =
                    ontologyTerms.find(
                      term =>
                        term.term_type === 'district'
                        &&
                        matchedCanton
                        &&
                        term.parent_id === matchedCanton.id
                        &&
                        normalize(
                          term.term_name_en ||
                          term.term_name
                        ) === normalize(
                          listingData.district
                        )
                    )

                  if (matchedDistrict) {

                    matchedTerms.set(
                      matchedDistrict.id,
                      matchedDistrict
                    )

                  }

console.log('MATCHED DISTRICT', matchedDistrict) 



                for (const value of valuesToMatch) {

                  if (
                      value === listingData.province
                      ||
                      value === listingData.canton
                      ||
                      value === listingData.district
                    ) {
                      continue
                    }

                  const match =
                    termMap.get(
                      normalize(value)
                    )

                  if (
                    match
                    &&
                    match.term_type !== 'province'
                    &&
                    match.term_type !== 'canton'
                    &&
                    match.term_type !== 'district'
                  ) {

                    matchedTerms.set(
                      match.id,
                      match
                    )
                    console.log(
                      'GENERIC MATCH',
                      value,
                      match.id,
                      match.term_name,
                      match.term_type
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

console.log(
  'MATCHED TERM IDS BEFORE EXPANSION',
  Array.from(
    matchedTerms.values()
  ).map(
    term => ({
      id: term.id,
      name: term.term_name,
      type: term.term_type
    })
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

    let changed = true

      while (changed) {

        changed = false

        const currentIds =
          Array.from(
            expandedTerms.keys()
          )

        for (
          const relationship
          of (relationships || [])
        ) {

          if (
              relationship.relationship_type === 'is_part_of'
              &&
              currentIds.includes(
                relationship.source_term_id
              )
            ) {

            const relatedTerm =
              ontologyById.get(
                relationship.target_term_id
              )

            if (
              relatedTerm &&
              !expandedTerms.has(
                relatedTerm.id
              )
            ) {

console.log(
  'RELATIONSHIP EXPANSION',
  relationship.source_term_id,
  '->',
  relationship.target_term_id,
  relationship.relationship_type,
  relatedTerm.term_name,
  relatedTerm.term_type
)

              expandedTerms.set(
                relatedTerm.id,
                relatedTerm
              )

              changed = true

            }

          }

        }

      }

console.log(
  'EXPANDED TERM IDS',
  Array.from(
    expandedTerms.keys()
  )
)

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

  const deleteResponse =
          await supabase
            .from('listings_ontology_terms')
            .delete()
            .eq(
              'listing_id',
              listingId
            )

        if (deleteResponse.error) {

          console.error(
            'DELETE ERROR',
            deleteResponse.error
          )

          return

        }

  const response =
    await supabase
      .from('listings_ontology_terms')
      .insert(
          inserts
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