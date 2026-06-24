import { NextResponse } from 'next/server'
import { getMarketIntelligence } from '@/lib/market-engine'

export async function GET() {
  const data = await getMarketIntelligence({
    canton: 'santa-ana',
    property_type: 'condo'
  })

  return NextResponse.json(data)
}