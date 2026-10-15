import { isStagingApplication } from '@/lib/staging-identity'
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  if (isStagingApplication()) return { rules: { userAgent: '*', disallow: '/' } }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/en/orchestrators', '/es/orquestadores', '/en/orchestrator-status', '/es/estado-orquestadores']
    },
    sitemap: 'https://twuanis.com/sitemap.xml'
  }
} 