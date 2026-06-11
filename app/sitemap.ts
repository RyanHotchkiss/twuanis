import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

const SITE_URL = 'https://twuanis.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    '',
    '/en',
    '/es',
    '/en/buy',
    '/en/rent',
    '/es/comprar',
    '/es/alquilar'
  ]

  const staticUrls = staticRoutes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8
  }))

  const { data: listings, error: listingsError } = await supabase
    .from('listings')
    .select('id, created_at')

  if (listingsError) {
    console.error('Sitemap listings error:', listingsError)
  }

  const listingUrls =
    listings?.flatMap((listing) => [
      {
        url: `${SITE_URL}/en/buy/listing/${listing.id}`,
        lastModified: listing.created_at
          ? new Date(listing.created_at)
          : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7
      },
      {
        url: `${SITE_URL}/es/comprar/anuncio/${listing.id}`,
        lastModified: listing.created_at
          ? new Date(listing.created_at)
          : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7
      }
    ]) ?? []

  const { data: terms, error: termsError } = await supabase
    .from('ontology_terms')
    .select('term_type, slug, slug_en, slug_es, created_at')

  if (termsError) {
    console.error('Sitemap ontology error:', termsError)
  }

  const entityUrls =
    terms?.flatMap((term) => {
      const slugEn = term.slug_en || term.slug
      const slugEs = term.slug_es || term.slug

      if (!slugEn && !slugEs) return []

      if (term.term_type === 'province') {
        return [
          {
            url: `${SITE_URL}/province/${slugEn}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.75
          }
        ]
      }

      if (term.term_type === 'canton') {
        return [
          {
            url: `${SITE_URL}/canton/${slugEn}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.7
          }
        ]
      }

      if (term.term_type === 'district') {
        return [
          {
            url: `${SITE_URL}/district/${slugEn}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.65
          }
        ]
      }

      if (term.term_type === 'property_type') {
        return [
          {
            url: `${SITE_URL}/property-type/${slugEn}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.7
          }
        ]
      }

      return []
    }) ?? []

  return [...staticUrls, ...listingUrls, ...entityUrls]
}