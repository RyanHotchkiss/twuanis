import {readPublishedKnowledge} from './knowledge-public/knowledge-page'
import {buildListingConcepts} from './schema/buildListingConcepts'
import {projectPublicListing} from './schema/public-listing-projection'
const SITE_URL = 'https://twuanis.com'

type OntologyTerm = {
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

type Listing = {
  id: string
  title?: string | null
  description?: string | null
  transaction_type?: string | null
  currency?: string | null
  current_price?: number | string | null
  price_millions?: number | string | null
  monthly_price?: number | string | null
  province?: string | null
  canton?: string | null
  district?: string | null
  property_type?: string | null
  bedrooms?: string | null
  bathrooms?: string | null
  parking?: string | null
  construction_area?: number | null
  year_built_range?: string | null
  images?: string | string[] | null
  whatsapp?: string | null
}

function clean(value?: string | null) {
  return value || undefined
}

function ontologyId(term: OntologyTerm) {
  return `${SITE_URL}/id/ontology/${term.term_type}/${term.slug_en || term.slug}`
}

function termSetId(termType: string) {
  return `${SITE_URL}/id/ontology/${termType}`
}

function listingId(id: string) {
  return `${SITE_URL}/id/listing/${id}`
}

function listingUrl(id: string, lang: 'en' | 'es', mode: 'buy' | 'rent') {
  if (lang === 'es') {
    return mode === 'buy'
      ? `${SITE_URL}/es/comprar/anuncio/${id}`
      : `${SITE_URL}/es/alquilar-arrendar/anuncio/${id}`
  }

  return mode === 'buy'
    ? `${SITE_URL}/en/buy/listing/${id}`
    : `${SITE_URL}/en/rent-lease/listing/${id}`
}

export function buildDefinedTerm(term: OntologyTerm, lang: 'en' | 'es' = 'en') {
  return {
    '@type': 'DefinedTerm',
    '@id': ontologyId(term),
    name: lang === 'es'
      ? term.term_name_es || term.term_name
      : term.term_name_en || term.term_name,
    description: clean(term.description),
    inDefinedTermSet: {
      '@id': termSetId(term.term_type)
    }
  }
}

export function buildDefinedTermSet(termType: string) {
  return {
    '@type': 'DefinedTermSet',
    '@id': termSetId(termType),
    name: termType.replaceAll('_', ' ')
  }
}

export function buildBreadcrumbList(items: { name: string; url: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }
}

export function buildItemList(listings: Listing[], lang: 'en' | 'es', mode: 'buy' | 'rent') {
  return {
    '@type': 'ItemList',
    itemListElement: listings.map((listing, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: listingUrl(listing.id, lang, mode),
      item: {
        '@id': listingId(listing.id)
      }
    }))
  }
}

export async function buildListingSchema({listing,lang,mode}: {listing: Listing & import('./schema/public-listing-projection').PublicListingInput;ontologyTerms:OntologyTerm[];neighborTerms:OntologyTerm[];graphRows:unknown[];lang:'en'|'es';mode:'buy'|'rent'}){
 const source=await readPublishedKnowledge()
 return projectPublicListing(listing,lang,mode,buildListingConcepts(listing.canonicalEvidence,source,lang))
}

export function buildEntitySchema({entityTerm,lang,pageUrl}: {entityTerm:OntologyTerm;listings:Listing[];lang:'en'|'es';mode:'buy'|'rent';pageUrl:string}){
 const term=buildDefinedTerm(entityTerm,lang)
 return {'@context':'https://schema.org','@graph':[
  {'@type':'CollectionPage',url:pageUrl,inLanguage:lang,name:term.name,about:{'@id':term['@id']}},
  term,buildDefinedTermSet(entityTerm.term_type),
  buildBreadcrumbList([{name:lang==='es'?'Inicio':'Home',url:`https://twuanis.com/${lang}`},{name:term.name,url:pageUrl}])
 ]}
}
