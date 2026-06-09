import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendWhatsApp } from '@/lib/whatsapp'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {

    const {
      phone,
      listingData
    } = await req.json()

    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          error: 'Phone required'
        },
        {
          status: 400
        }
      )
    }

    const token = crypto.randomUUID()

    const tokenInsert = await supabase
      .from('listing_publish_tokens')
      .insert({
        phone,
        token,
        listing_data: listingData || {},
        verified: false
      })
      .select()

    console.log(
      'TOKEN INSERT RESULT:',
      JSON.stringify(
        tokenInsert,
        null,
        2
      )
    )

    await sendWhatsApp({
      to: phone,
      body: token
    })

    console.log(
      'TOKEN CREATED:',
      token
    )

    return NextResponse.json({
      success: true
    })

  } catch (error) {

    console.error(error)

    return NextResponse.json(
      {
        success: false,
        error: 'Server error'
      },
      {
        status: 500
      }
    )

  }
}  