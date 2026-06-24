import { NextResponse } from 'next/server'

import {
  getCachedMarketStatistics
} from '@/lib/statistics-engine'

export async function GET() {
  const data = await getCachedMarketStatistics(
    'canton',
    'santa-ana'
  )

  return NextResponse.json(data)
}