import { buildOntologyNode }
from '@/lib/schema/buildOntologyNode'

import { buildRelationshipNode }
from '@/lib/schema/buildRelationshipNode'

import {
  buildCountryNode
}
from '@/lib/schema/buildPlaceNode'

export type OntologyTerm = {
  id: number
  parent_id?: number | null
  term_name: string
  term_type: string
  slug: string
  description?: string | null
  official_code?: string | null
  term_name_en?: string | null
  term_name_es?: string | null
  slug_en?: string | null
  slug_es?: string | null
}

export type OntologyRelationship = {
  source_term_id: number
  target_term_id: number
  relationship_type: string
}

export function buildHomePageSchema({
  lang,
  ontologyTerms,
  ontologyRelationships
}: {
  lang: 'en' | 'es'
  ontologyTerms: OntologyTerm[]
  ontologyRelationships: OntologyRelationship[]
}) 

{  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://twuanis.com/#website',

    name: 'Twuanis',

    url:
      lang === 'en'
        ? 'https://twuanis.com/en'
        : 'https://twuanis.com/es'
  }
    const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://twuanis.com/#organization',

    name: 'Twuanis',

    url: 'https://twuanis.com'
  }

    const realEstateAgentSchema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': 'https://twuanis.com/#real-estate-agent',

    name: 'Twuanis',

    areaServed: {
      '@id':
        'https://twuanis.com/id/country/costa-rica'
    }
  }
    const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',

    '@id':
      lang === 'en'
        ? 'https://twuanis.com/en'
        : 'https://twuanis.com/es',

    name:
      lang === 'en'
        ? 'Costa Rica Real Estate'
        : 'Bienes Raíces Costa Rica'
  }
    const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',

    name:
      lang === 'en'
        ? 'Costa Rica Property Ontology'
        : 'Ontología Inmobiliaria Costa Rica'
  }

  console.log(
    'Building ontology nodes:',
    ontologyTerms.length
    )

    const countryNode =
    buildCountryNode()
      const ontologyNodes =
    ontologyTerms.map(term =>
      buildOntologyNode(
        term,
        lang
      )
    )
      const ontologyLookup =
    new Map(
      ontologyTerms.map(term => [
        term.id,
        term
      ])
    )
      const relationshipNodes =
    ontologyRelationships
      .map(rel => {

        const sourceTerm =
          ontologyLookup.get(
            rel.source_term_id
          )

        const targetTerm =
          ontologyLookup.get(
            rel.target_term_id
          )

        if (
          !sourceTerm ||
          !targetTerm
        ) {
          return null
        }

        return buildRelationshipNode(
          sourceTerm,
          targetTerm,
          rel.relationship_type
        )

      })
      .filter(Boolean)

console.log(
  'ontologyNodes built:',
  ontologyNodes.length
)

console.log(
  'first ontology node:',
  ontologyNodes[0]
)
console.log(
  'ontologyNodes built:',
  ontologyNodes.length
)

console.log(
  'first ontology node:',
  ontologyNodes[0]
)

console.log(
  'relationshipNodes built:',
  relationshipNodes.length
)

        return [

                websiteSchema,

                organizationSchema,

                realEstateAgentSchema,

                collectionPageSchema,

                itemListSchema,

                countryNode,

                ...ontologyNodes,

                ...relationshipNodes

            ]

}