import { NextResponse } from 'next/server'
import { rebuildMarketStatisticsCache } from '@/lib/aggregation-cache-engine'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const secret = searchParams.get('secret')

    if (secret !== process.env.MARKET_CACHE_REBUILD_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const limit = Number(searchParams.get('limit') || 100)
    const offset = Number(searchParams.get('offset') || 0)

    const result = await rebuildMarketStatisticsCache({
      limit,
      offset
    })

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      },
      { status: 500 }
    )
  }
}