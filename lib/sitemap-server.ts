import 'server-only'

import { knowledgeSitemapEntries } from '@/lib/knowledge-public/knowledge-page'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getPublicListingSitemapRows } from '@/lib/public-listings-server'
import { isStagingApplication } from '@/lib/staging-identity'

const SITE_URL = 'https://twuanis.com'
// 10,000 normal sitemap URLs remain comfortably below Google's 50,000 URL
// and 50 MB uncompressed limits, while allowing any additional inventory to
// continue in the next numbered query partition.
export const SITEMAP_URL_LIMIT = 10_000
export type SitemapLanguage = 'en' | 'es'
export type SitemapTransaction = 'sale' | 'rent'
export type SitemapEntry = { url: string; lastModified?: Date; changeFrequency?: string; priority?: number }

const escapeXml = (value: string) => value.replace(/[<>&'\"]/g, character => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[character] || character))
const xmlDate = (value?: Date) => value ? value.toISOString() : ''

export function sitemapXml(entries: SitemapEntry[]) {
  const body = entries.map(entry => `<url><loc>${escapeXml(entry.url)}</loc>${entry.lastModified ? `<lastmod>${xmlDate(entry.lastModified)}</lastmod>` : ''}${entry.changeFrequency ? `<changefreq>${entry.changeFrequency}</changefreq>` : ''}${entry.priority !== undefined ? `<priority>${entry.priority}</priority>` : ''}</url>`).join('')
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`
}

export function sitemapIndexXml(urls: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url => `<sitemap><loc>${escapeXml(url)}</loc></sitemap>`).join('')}</sitemapindex>`
}

const page = (url: string, priority: number): SitemapEntry => ({ url: `${SITE_URL}${url}`, lastModified: new Date(), changeFrequency: 'weekly', priority })

export async function listingSitemapEntries(transaction: SitemapTransaction, language: SitemapLanguage) {
  if (isStagingApplication()) return []
  const listings = await getPublicListingSitemapRows(transaction)
  return listings.map(listing => {
    const rent = transaction === 'rent'
    return language === 'en'
      ? { url: `${SITE_URL}/en/${rent ? 'rent-lease' : 'buy'}/listing/${listing.id}`, changeFrequency: 'weekly', priority: 0.7 }
      : { url: `${SITE_URL}/es/${rent ? 'alquilar-arrendar' : 'comprar'}/anuncio/${listing.id}`, changeFrequency: 'weekly', priority: 0.7 }
  })
}

export async function pageSitemapEntries(language: SitemapLanguage) {
  if (isStagingApplication()) return []
  const localized = language === 'en'
    ? [page('', 1), page('/en', 0.8), page('/en/buy', 0.8), page('/en/rent-lease', 0.8)]
    : [page('/es', 0.8), page('/es/comprar', 0.8), page('/es/alquilar-arrendar', 0.8)]

  const { data: terms, error } = await supabaseAdmin.from('ontology_terms').select('term_type, slug, slug_en')
  if (error) throw new Error(`Sitemap ontology error: ${error.message}`)
  const entityUrls = language === 'en' ? (terms || []).flatMap(term => {
    const slug = term.slug_en || term.slug
    if (!slug) return []
    const prefix = term.term_type === 'province' ? '/province/' : term.term_type === 'canton' ? '/canton/' : term.term_type === 'district' ? '/district/' : term.term_type === 'property_type' ? '/property-type/' : null
    return prefix ? [page(`${prefix}${slug}`, term.term_type === 'district' ? 0.65 : term.term_type === 'canton' ? 0.7 : 0.75)] : []
  }) : []
  const knowledge = await knowledgeSitemapEntries()
  const knowledgeUrls = knowledge.filter(entry => new URL(entry.url).pathname.startsWith(`/${language}/`)).map(entry => ({ url: entry.url, lastModified: entry.lastModified ? new Date(entry.lastModified) : undefined, changeFrequency: entry.changeFrequency, priority: entry.priority }))
  return [...localized, ...entityUrls, ...knowledgeUrls]
}

export const sitemapPart = <T>(entries: T[], part: number) => entries.slice((part - 1) * SITEMAP_URL_LIMIT, part * SITEMAP_URL_LIMIT)
export const sitemapParts = (count: number) => Math.max(1, Math.ceil(count / SITEMAP_URL_LIMIT))
export const sitemapContentType = { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' }
