const SITE_URL = 'https://twuanis.com'

export type OntologyTerm = {
  level?: number | null
  id: string | number
  parent_id?: string | number | null
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

function clean(value?: string | null) {
  return value || undefined
}

export function ontologyId(term: OntologyTerm) {
  return `${SITE_URL}/id/ontology/${term.term_type}/${term.slug_en || term.slug}`
}

export function termSetId(termType: string) {
  return `${SITE_URL}/id/ontology/${termType}`
}

export function buildOntologyNode(
  term: OntologyTerm,
  lang: 'en' | 'es' = 'en'
) {
  return {
    '@type': 'DefinedTerm',
    '@id': ontologyId(term),
    name:
      lang === 'es'
        ? term.term_name_es || term.term_name
        : term.term_name_en || term.term_name,
    description: clean(term.description),
    inDefinedTermSet: {
      '@id': termSetId(term.term_type)
    }
  }
}

