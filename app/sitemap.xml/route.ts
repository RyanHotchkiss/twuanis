import { listingSitemapEntries, pageSitemapEntries, sitemapContentType, sitemapIndexXml, sitemapParts } from '@/lib/sitemap-server'

export const dynamic = 'force-dynamic'

const SITE = 'https://twuanis.com'
const family = (path: string, parts: number) => Array.from({ length: parts }, (_, index) => `${SITE}/${path}${index ? `?part=${index + 1}` : ''}`)

export async function GET() {
  const [sale, rent, enPages, esPages] = await Promise.all([
    listingSitemapEntries('sale', 'en'), listingSitemapEntries('rent', 'en'), pageSitemapEntries('en'), pageSitemapEntries('es')
  ])
  return new Response(sitemapIndexXml([
    ...family('sitemap-sale-en.xml', sitemapParts(sale.length)),
    ...family('sitemap-sale-es.xml', sitemapParts(sale.length)),
    ...family('sitemap-rent-en.xml', sitemapParts(rent.length)),
    ...family('sitemap-rent-es.xml', sitemapParts(rent.length)),
    ...family('sitemap-pages-en.xml', sitemapParts(enPages.length)),
    ...family('sitemap-pages-es.xml', sitemapParts(esPages.length))
  ]), { headers: sitemapContentType })
}
