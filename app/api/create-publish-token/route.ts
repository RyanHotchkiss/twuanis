import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

export async function POST(
  req: NextRequest
) {

  const {
    phone,
    listingData
  } = await req.json()

  const token =
    crypto.randomUUID()

  await supabase
    .from('listing_publish_tokens')
    .insert({

      phone,

      token,

      listing_data: listingData

    })

  return NextResponse.json({

    success: true,

    token

  })

}