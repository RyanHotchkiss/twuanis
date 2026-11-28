import { pageSitemapEntries, sitemapContentType, sitemapPart, sitemapXml } from '@/lib/sitemap-server'
export const dynamic = 'force-dynamic'
export async function GET(request: Request) { const part = Math.max(1, Number(new URL(request.url).searchParams.get('part') || 1)); return new Response(sitemapXml(sitemapPart(await pageSitemapEntries('es'), part)), { headers: sitemapContentType }) }
