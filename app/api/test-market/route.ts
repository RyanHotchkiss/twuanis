import { NextResponse } from 'next/server'
import {
  getMarketStatistics,
  saveMarketStatistics
} from '@/lib/statistics-engine'

export async function GET() {
  try {
    const data = await getMarketStatistics({
      canton: 'Santa Ana'
    })

    const saved = await saveMarketStatistics(
      'canton',
      'santa-ana',
      data
    )

    return NextResponse.json({
      saved,
      data
    })
  } catch (error: any) {
    console.error('TEST MARKET ERROR:', error)

    return NextResponse.json(
      {
        message: error?.message ?? null,
        details: error?.details ?? null,
        hint: error?.hint ?? null,
        code: error?.code ?? null,
        raw: error
      },
      { status: 500 }
    )
  }
}