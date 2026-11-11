import {
  NextResponse
} from 'next/server'

import {
  processSavedSearchAlerts
} from '@/lib/saved-search-alerts'

export const runtime =
  'nodejs'

export const dynamic =
  'force-dynamic'

export const maxDuration =
  300

export async function GET(
  request: Request
) {
  const authorization =
    request.headers.get(
      'authorization'
    )

  const cronSecret =
    process.env.CRON_SECRET

  if (!cronSecret) {
    console.error(
      'CRON_SECRET is not configured.'
    )

    return NextResponse.json(
      {
        success: false,
        error:
          'Cron configuration error'
      },
      {
        status: 500
      }
    )
  }

  if (
    authorization !==
    `Bearer ${cronSecret}`
  ) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Unauthorized'
      },
      {
        status: 401
      }
    )
  }

  try {
    await processSavedSearchAlerts()

    return NextResponse.json({
      success: true,
      processedAt:
        new Date().toISOString()
    })
  } catch (error) {
    console.error(
      'Saved-search cron failed:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        error:
          'Saved-search processing failed'
      },
      {
        status: 500
      }
    )
  }
}