import { supabase } from '@/lib/supabase'

import {
  resolveCanonicalGeography,
  type CanonicalGeographyTerm
} from '@/lib/geography/canonical-geography'

function normalize(value: any): string {
  return String(value || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
}

export async function resolveListingOntology(
  listingData: any
) {

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

    ...(
      typeof listingData.environment ===
        'string'
        ? listingData.environment
            .split('|')
            .map(
              (value: string) =>
                value.trim()
            )
            .filter(Boolean)
        : []
    ),

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
              slug_es,
              official_code
            `)

        if (error) {

          console.error(
            'ONTOLOGY QUERY ERROR',
            error
          )

          return []

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

          return []

        }

        if (!ontologyTerms?.length) {
          return []
        }

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
        const geographyTerms =
          ontologyTerms.filter(
            term =>
              term.term_type === 'province' ||
              term.term_type === 'canton' ||
              term.term_type === 'district'
          ) as CanonicalGeographyTerm[]


        const geography =
          resolveCanonicalGeography({
            province:
              listingData.province ??
              null,

            canton:
              listingData.canton ??
              null,

            district:
              listingData.district ??
              null,

            terms:
              geographyTerms
          })


        if (geography.province) {
          matchedTerms.set(
            geography.province.id,
            geography.province
          )
        }


        if (geography.canton) {
          matchedTerms.set(
            geography.canton.id,
            geography.canton
          )
        }


        if (geography.district) {
          matchedTerms.set(
            geography.district.id,
            geography.district
          )
        }


        console.log(
          'CANONICAL GEOGRAPHY',
          {
            source:
              geography.source,

            province:
              geography.province
                ? {
                    id:
                      geography.province.id,
                    name:
                      geography.province.term_name,
                    officialCode:
                      geography.province.official_code
                  }
                : null,

            canton:
              geography.canton
                ? {
                    id:
                      geography.canton.id,
                    name:
                      geography.canton.term_name,
                    officialCode:
                      geography.canton.official_code
                  }
                : null,

            district:
              geography.district
                ? {
                    id:
                      geography.district.id,
                    name:
                      geography.district.term_name,
                    officialCode:
                      geography.district.official_code
                  }
                : null,

            reasons:
              geography.reasons,

            complete:
              geography.complete
          }
        )



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

    return []

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

      return Array.from(
        expandedTerms.values()
      )

}

export async function assignListingOntology(
  listingId: string,
  listingData: any
) {

  console.log(
    'ASSIGN ONTOLOGY CALLED',
    listingId
  )

  const resolvedTerms =
    await resolveListingOntology(
      listingData
    )

  if (!resolvedTerms?.length) {

    console.log(
      'NO ONTOLOGY TERMS TO ASSIGN',
      listingId
    )

    return

  }

  const inserts =
    resolvedTerms.map(
      term => ({
        listing_id: listingId,
        ontology_term_id: term.id
      })
    )

  console.log(
    'MATCHED TERMS',
    resolvedTerms
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