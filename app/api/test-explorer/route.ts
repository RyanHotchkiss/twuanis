import { NextResponse } from 'next/server'

import {
  exploreMarket
} from '@/lib/explorer-engine'

export async function GET() {
  const result =
    await exploreMarket({
      canton: 'santa-ana',
      property_type: 'condo'
    })

  return NextResponse.json(result)
}