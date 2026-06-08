import {
  buildCountryNode,
  buildProvinceNode,
  buildCantonNode,
  buildDistrictNode
} from './schema/buildPlaceNode'


import { buildRelationshipNode }
from '@/lib/schema/buildRelationshipNode'


const SITE_URL = 'https://twuanis.com'

type OntologyTerm = {
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

type Listing = {
  id: string
  title?: string | null
  description?: string | null
  price_millions?: number | string | null
  province?: string | null
  canton?: string | null
  district?: string | null
  property_type?: string | null
  bedrooms?: string | null
  bathrooms?: string | null
  parking?: string | null
  construction_area?: string | null
  year_built_range?: string | null
  images?: string | null
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

function slugify(value?: string | null) {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
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
    termCode: String(term.id),
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

export function buildListingSchema({
  listing,
  ontologyTerms,
  neighborTerms,
  graphRows,
  lang,
  mode
}: {
  listing: Listing
  ontologyTerms: OntologyTerm[]
  neighborTerms: OntologyTerm[]
  graphRows: any[]
  lang: 'en' | 'es'
  mode: 'buy' | 'rent'
}) 


{
  const url = listingUrl(listing.id, lang, mode)

console.log(
  'BUILD SCHEMA',
  {
    lang,
    mode,
    url
  }
)

  const allTerms = ontologyTerms

    const termLookup =
    new Map(
      allTerms.map(
        term => [term.id, term]
      )
    )

  const listingTermIds =
  new Set(
    ontologyTerms.map(
      term => term.id
    )
  )

const relationshipNodes =
  (graphRows || [])
    .filter(row =>

      listingTermIds.has(
        row.source_term_id
      )

      &&

      listingTermIds.has(
        row.target_term_id
      )

    )
    .map(row => {

      const sourceTerm =
        termLookup.get(
          row.source_term_id
        )

      const targetTerm =
        termLookup.get(
          row.target_term_id
        )

      if (!sourceTerm || !targetTerm) {
        return null
      }

      return buildRelationshipNode(
        sourceTerm,
        targetTerm,
        row.relationship_type
      )

    })
    .filter(Boolean)

  const provinceSlug = slugify(listing.province)

  const cantonSlug = slugify(listing.canton)

  const districtSlug = slugify(listing.district)

  const images =
  Array.isArray(listing.images)
    ? listing.images
    : []

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'RealEstateListing',
        '@id': listingId(listing.id),
        url,
        name: clean(listing.title),
        description: clean(listing.description),
        image: images,
        about: ontologyTerms.map(term => ({
          '@id': ontologyId(term)
        })),
        itemOffered: {
          '@type': 'Residence',
          name: clean(listing.property_type),
          numberOfBedrooms: clean(listing.bedrooms),
          numberOfBathroomsTotal: clean(listing.bathrooms),
          floorSize: clean(listing.construction_area),
          additionalProperty: ontologyTerms.map(term => ({
            '@type': 'PropertyValue',
            name: term.term_type,
            value: lang === 'es'
              ? term.term_name_es || term.term_name
              : term.term_name_en || term.term_name,
            propertyID: ontologyId(term)
          }))
        },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'CRC',
          price: listing.price_millions
            ? Number(listing.price_millions) * 1000000
            : undefined,
          availability: 'https://schema.org/InStock',
          url
        },
        address: {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'CR',
            addressRegion: clean(listing.province),
            addressLocality: clean(listing.canton),
            addressSubLocality: clean(listing.district)
          }
        }
      },

      buildCountryNode(),

      ...(listing.province
        ? [
            buildProvinceNode(
              provinceSlug,
              listing.province
            )
          ]
        : []),

      ...(listing.canton
        ? [
            buildCantonNode(
              cantonSlug,
              listing.canton,
              provinceSlug
            )
          ]
        : []),

      ...(listing.district
        ? [
            buildDistrictNode(
              districtSlug,
              listing.district,
              cantonSlug
            )
          ]
        : []),

      ...allTerms.map(
        term => buildDefinedTerm(term, lang)
      ),
      ...relationshipNodes,

      ...Array.from(
        new Set(
          allTerms.map(
            term => term.term_type
          )
        )
      )
      .map(termType => buildDefinedTermSet(termType)),

      buildBreadcrumbList([
        {
          name: lang === 'es' ? 'Inicio' : 'Home',
          url: lang === 'es' ? `${SITE_URL}/es` : `${SITE_URL}/en`
        },
        {
          name: mode === 'buy'
            ? lang === 'es' ? 'Comprar' : 'Buy'
            : lang === 'es' ? 'Alquilar / Arrendar' : 'Rent / Lease',
          url: mode === 'buy'
            ? lang === 'es' ? `${SITE_URL}/es/comprar` : `${SITE_URL}/en/buy`
            : lang === 'es' ? `${SITE_URL}/es/alquilar-arrendar` : `${SITE_URL}/en/rent-lease`
        },
        {
          name: listing.title || 'Listing',
          url
        }
      ])
    ]
  }
}

export function buildEntitySchema({
  entityTerm,
  listings,
  lang,
  mode,
  pageUrl
}: {
  entityTerm: OntologyTerm
  listings: Listing[]
  lang: 'en' | 'es'
  mode: 'buy' | 'rent'
  pageUrl: string
}) {
  const isGeo = ['country', 'province', 'canton', 'district'].includes(entityTerm.term_type)

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${pageUrl}#collection-page`,
        url: pageUrl,
        name: lang === 'es'
          ? entityTerm.term_name_es || entityTerm.term_name
          : entityTerm.term_name_en || entityTerm.term_name,
        about: {
          '@id': ontologyId(entityTerm)
        },
        mainEntity: {
          '@id': `${pageUrl}#item-list`
        }
      },

      {
        ...(isGeo
          ? {
              '@type': 'AdministrativeArea',
              '@id': `${SITE_URL}/id/${entityTerm.term_type}/${entityTerm.slug_en || entityTerm.slug}`,
              name: entityTerm.term_name
            }
          : buildDefinedTerm(entityTerm, lang))
      },

      {
        ...buildItemList(listings, lang, mode),
        '@id': `${pageUrl}#item-list`
      },

      buildDefinedTermSet(entityTerm.term_type),

      buildBreadcrumbList([
        {
          name: lang === 'es' ? 'Inicio' : 'Home',
          url: lang === 'es' ? `${SITE_URL}/es` : `${SITE_URL}/en`
        },
        {
          name: entityTerm.term_type.replaceAll('_', ' '),
          url: `${SITE_URL}/${entityTerm.term_type.replaceAll('_', '-')}`
        },
        {
          name: lang === 'es'
            ? entityTerm.term_name_es || entityTerm.term_name
            : entityTerm.term_name_en || entityTerm.term_name,
          url: pageUrl
        }
      ])
    ]
  }
}