import {publicationAccount} from '@/lib/token-canonical-creation'
import {
  NextRequest,
  NextResponse
} from 'next/server'

import {
  supabaseAdmin
} from '@/lib/supabase-admin'

export async function POST(
  request: NextRequest
) {
  try {
    const account=await publicationAccount(request)
    if(!account)return NextResponse.json({success:false,error:"Sign in with your confirmed account email before publishing."},{status:401})
    const {
      phone,
      requestId,
      listingData,
      language
    } =
      await request.json()

    if (
      typeof phone !== 'string' ||
      !phone.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Phone required.'
        },
        {
          status: 400
        }
      )
    }

    if (
      !listingData ||
      typeof listingData !==
        'object' ||
      Array.isArray(listingData)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Listing data required.'
        },
        {
          status: 400
        }
      )
    }

    if(typeof requestId!=='string'||!/^[0-9a-f-]{36}$/i.test(requestId))return NextResponse.json({success:false,error:'Stable submission request required.'},{status:400})
    let token = ''

    const normalizedListingData = {
      ...listingData,
      publication_delivery:{account_id:account.user.id,language:language==='es'?'es':'en'},

      /*
       * The temporary uploader will populate
       * these fields after the token exists.
       */
      images: [],
      temporary_images: []
    }

    const prepared=await supabaseAdmin.rpc('prepare_listing_submission_token',{p_owner:account.user.id,p_request:requestId,p_phone:phone.trim(),p_payload:normalizedListingData})
    let error=prepared.error
    token=prepared.data?.token||''
    // Source-first installation compatibility: only an explicitly absent RPC uses the existing token writer.
    // Network, validation and permission failures never select this path.
    if(error?.code==='PGRST202'&&error.message.includes('prepare_listing_submission_token')){
      token=crypto.randomUUID()
      const previous=await supabaseAdmin.from('listing_publish_tokens').insert({phone:phone.trim(),token,listing_data:normalizedListingData,verified:false})
      error=previous.error
    }

    if (error) {
      console.error(
        'CREATE PUBLISH TOKEN ERROR:',
        error
      )

      return NextResponse.json(
        {
          success: false,
          error:
            'The publishing session could not be created.'
        },
        {
          status: 500
        }
      )
    }

    return NextResponse.json({
      success: true,
      token
    })
  } catch (error) {
    console.error(
      'CREATE PUBLISH TOKEN ROUTE ERROR:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        error:
          'The publishing session could not be created.'
      },
      {
        status: 500
      }
    )
  }
}