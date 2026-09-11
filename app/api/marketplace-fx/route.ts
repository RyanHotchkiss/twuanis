import { NextResponse } from 'next/server'

import {
  resolveMarketAnalyticalContext
} from '@/lib/market-analytical-context'

export async function GET() {
  try {
    const analyticalContext =
      await resolveMarketAnalyticalContext()

    return NextResponse.json(
      {
        usdToCrcRate:
          analyticalContext.fx.rate,

        analyticalDate:
          analyticalContext.analyticalDate,

        effectiveDate:
          analyticalContext.fx.effectiveDate,

        source:
          analyticalContext.fx.source,

        rateType:
          analyticalContext.fx.rateType,

        resolutionMode:
          analyticalContext.fx.resolutionMode
      },
      {
        headers: {
          'Cache-Control':
            'private, max-age=60'
        }
      }
    )
  } catch (error) {
    console.error(
      'MARKETPLACE FX RESOLUTION ERROR:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Authoritative marketplace FX rate unavailable.'
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    )
  }
}