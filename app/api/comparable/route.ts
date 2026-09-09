
import {
  NextResponse
} from 'next/server'

import {
  executePriceMeterComparableAnalysis,
  executePriceMeterComparableConfiguration,
  PriceMeterComparableAuthenticationError,
  PriceMeterComparableAuthorizationError
} from '@/lib/price-meter-comparable-server'

import {
  toPriceMeterComparableEvidenceDTO
} from '@/lib/price-meter-comparable-dto'

import type {
  PriceMeterComparableRequest
} from '@/lib/price-meter-comparable-request'


/*
 * ---------------------------------------------------------
 * PRICE / M² USER-DEFINED COMPARABLE API
 * ---------------------------------------------------------
 *
 * Phase 12A
 *
 * REQUEST FIRST.
 * AUTHORIZE SECOND.
 * RETURN MINIMUM THIRD.
 *
 * Crown Jewel analytical machinery remains server-only.
 * The browser receives only the explicit evidence DTO.
 */


export const runtime =
  'nodejs'


function isRecord(
  value:
    unknown
): value is Record<string, unknown> {

  return (
    typeof value ===
      'object' &&
    value !==
      null &&
    !Array.isArray(
      value
    )
  )
}


function parseComparableRequest(
  value:
    unknown
): PriceMeterComparableRequest {

  if (
    !isRecord(
      value
    )
  ) {
    throw new Error(
      'Invalid Price / m² comparable request.'
    )
  }


  return {
    subjectListingId:
      value.subjectListingId as string,

    geographyLevel:
      value.geographyLevel as
        PriceMeterComparableRequest[
          'geographyLevel'
        ],

    normalizationBasis:
      value.normalizationBasis as
        PriceMeterComparableRequest[
          'normalizationBasis'
        ],

    activeDimensions:
      value.activeDimensions as
        PriceMeterComparableRequest[
          'activeDimensions'
        ]
  }
}

export async function GET(
  request:
    Request
) {

  try {
    const url =
      new URL(
        request.url
      )


    const subjectListingId =
      url.searchParams.get(
        'subjectListingId'
      ) ??
      ''


    const {
      presentation
    } =
      await executePriceMeterComparableConfiguration(
        subjectListingId
      )


    return NextResponse.json(
      {
        presentation
      },
      {
        status:
          200
      }
    )
  } catch (error) {

    if (
      error instanceof
        PriceMeterComparableAuthenticationError
    ) {
      return NextResponse.json(
        {
          error:
            'Authentication required.'
        },
        {
          status:
            401
        }
      )
    }


    if (
      error instanceof
        PriceMeterComparableAuthorizationError
    ) {
      return NextResponse.json(
        {
          error:
            'Price / m² Market Intelligence entitlement required.'
        },
        {
          status:
            403
        }
      )
    }


    if (
      error instanceof
        Error &&
      error.message.startsWith(
        'Phase 12A configuration requires'
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid Price / m² comparable configuration request.'
        },
        {
          status:
            400
        }
      )
    }


    console.error(
      'Price / m² comparable configuration failed.',
      error
    )


    return NextResponse.json(
      {
        error:
          'Unable to load Price / m² comparable configuration.'
      },
      {
        status:
          500
      }
    )
  }
}

export async function POST(
  request:
    Request
) {

  try {
    let body:
      unknown


    try {
      body =
        await request.json()
    } catch {
      return NextResponse.json(
        {
          error:
            'Invalid JSON request body.'
        },
        {
          status:
            400
        }
      )
    }


    const comparableRequest =
      parseComparableRequest(
        body
      )


    /*
     * Authentication and commercial entitlement occur
     * inside the server boundary before bounded loading
     * and before Crown Jewel analytical execution.
     */

  const {
      analysis,
      presentation
    } =
      await executePriceMeterComparableAnalysis(
        comparableRequest
      )


    /*
     * Never serialize `analysis` directly.
     *
     * The DTO mapper is the explicit browser boundary.
     */

    const response =
      toPriceMeterComparableEvidenceDTO(
        analysis
      )


    return NextResponse.json(
      {
        evidence:
          response,

        presentation
      },
      {
        status:
          200
      }
    )
  } catch (error) {

    if (
      error instanceof
        PriceMeterComparableAuthenticationError
    ) {
      return NextResponse.json(
        {
          error:
            'Authentication required.'
        },
        {
          status:
            401
        }
      )
    }


    if (
      error instanceof
        PriceMeterComparableAuthorizationError
    ) {
      return NextResponse.json(
        {
          error:
            'Price / m² Market Intelligence entitlement required.'
        },
        {
          status:
            403
        }
      )
    }


    /*
     * Request-validation errors currently originate from
     * the canonical Phase 12A request validator as Error.
     *
     * Keep internal analytical/database details out of the
     * browser response.
     */

    if (
      error instanceof
        Error &&
            (
        error.message.startsWith(
          'Phase 12A request'
        ) ||
        error.message.startsWith(
          'Phase 12A requires'
        ) ||
        error.message.startsWith(
          'Invalid Price / m² comparable request'
        )
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid Price / m² comparable request.'
        },
        {
          status:
            400
        }
      )
    }


    console.error(
      'Price / m² comparable analysis failed.',
      error
    )


    return NextResponse.json(
      {
        error:
          'Unable to complete Price / m² comparable analysis.'
      },
      {
        status:
          500
      }
    )
  }
}