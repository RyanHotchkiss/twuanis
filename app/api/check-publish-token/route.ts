import {

  NextRequest,

  NextResponse

} from 'next/server'

import {

  supabaseAdmin

} from '@/lib/supabase-admin'

export async function POST(

  req: NextRequest

) {

  const {

    token

  } =

    await req.json()

  const {

    data,

    error

  } =

    await supabaseAdmin

      .from(

        'listing_publish_tokens'

      )

      .select(`

        verified,

        claimed_at,

        published_at,

        published_listing_id

      `)

      .eq(

        'token',

        token

      )

      .maybeSingle()

  if (

    error ||

    !data

  ) {

    return NextResponse.json(

      {

        exists:

          false,

        published:

          false,

        claimed:

          false

      }

    )

  }

  return NextResponse.json({

    exists:

      true,

    published:

      Boolean(

        data.published_at &&

        data.published_listing_id

      ),

    claimed:

      Boolean(

        data.claimed_at

      ),

    listingId:

      data.published_listing_id

  })

}