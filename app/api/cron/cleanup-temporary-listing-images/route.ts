import {
  NextResponse
} from 'next/server'

import {
  supabaseAdmin
} from '@/lib/supabase-admin'

export const runtime =
  'nodejs'

export const dynamic =
  'force-dynamic'

export const maxDuration =
  300

const STORAGE_BUCKET =
  'listings-images'

const ABANDONED_AFTER_HOURS =
  24

const MAX_TOKENS_PER_RUN =
  100

type PublishTokenRow = {
  id: string
  token: string
  verified: boolean
  listing_data:
    Record<string, unknown> | null
  created_at: string
}

function getTemporaryImagePaths(
  row: PublishTokenRow
): string[] {
  const listingData =
    row.listing_data

  if (
    !listingData ||
    typeof listingData !==
      'object'
  ) {
    return []
  }

  const candidateValues = [
    listingData.temporary_images,
    listingData.images
  ]

  const paths =
    candidateValues.flatMap(
      value =>
        Array.isArray(value)
          ? value
          : []
    )

  return Array.from(
    new Set(
      paths.filter(
        (
          value
        ): value is string =>
          typeof value ===
            'string' &&
          value.startsWith(
            `temporary/${row.token}/`
          )
      )
    )
  )
}

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

  const cutoff =
    new Date(
      Date.now() -
      ABANDONED_AFTER_HOURS *
        60 *
        60 *
        1000
    ).toISOString()

  try {
    const {
      data,
      error
    } =
      await supabaseAdmin
        .from(
          'listing_publish_tokens'
        )
        .select(`
          id,
          token,
          verified,
          listing_data,
          created_at
        `)
        .eq(
          'verified',
          false
        )
        .lt(
          'created_at',
          cutoff
        )
        .order(
          'created_at',
          {
            ascending: true
          }
        )
        .limit(
          MAX_TOKENS_PER_RUN
        )

    if (error) {
      throw error
    }

    const abandonedTokens =
      (
        data || []
      ) as PublishTokenRow[]

    let deletedTokens =
      0

    let deletedFiles =
      0

    const failures: {
      tokenId: string
      token: string
      error: string
    }[] = []

    for (
      const abandonedToken
      of abandonedTokens
    ) {
      try {
        const temporaryPaths =
          getTemporaryImagePaths(
            abandonedToken
          )

        if (
          temporaryPaths.length >
          0
        ) {
          const {
            data:
              removedObjects,
            error:
              removeError
          } =
            await supabaseAdmin
              .storage
              .from(
                STORAGE_BUCKET
              )
              .remove(
                temporaryPaths
              )

          if (removeError) {
            throw removeError
          }

          deletedFiles +=
            removedObjects
              ?.length ??
            temporaryPaths.length
        }

        /*
         * Recheck verified=false while deleting
         * so a token published during this run
         * cannot be removed accidentally.
         */
        const {
          data:
            deletedTokenRows,
          error:
            deleteTokenError
        } =
          await supabaseAdmin
            .from(
              'listing_publish_tokens'
            )
            .delete()
            .eq(
              'id',
              abandonedToken.id
            )
            .eq(
              'verified',
              false
            )
            .select(
              'id'
            )

        if (deleteTokenError) {
          throw deleteTokenError
        }

        deletedTokens +=
          deletedTokenRows
            ?.length ?? 0
      } catch (tokenError) {
        console.error(
          'TEMPORARY LISTING CLEANUP ITEM ERROR:',
          {
            tokenId:
              abandonedToken.id,
            token:
              abandonedToken.token,
            error:
              tokenError
          }
        )

        failures.push({
          tokenId:
            abandonedToken.id,

          token:
            abandonedToken.token,

          error:
            tokenError instanceof
              Error
              ? tokenError.message
              : 'Unknown cleanup error'
        })
      }
    }

    return NextResponse.json({
      success:
        failures.length === 0,

      cutoff,

      scannedTokens:
        abandonedTokens.length,

      deletedTokens,

      deletedFiles,

      failedTokens:
        failures.length,

      failures,

      processedAt:
        new Date().toISOString()
    })
  } catch (error) {
    console.error(
      'Temporary listing-image cleanup failed:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        error:
          'Temporary listing-image cleanup failed'
      },
      {
        status: 500
      }
    )
  }
}