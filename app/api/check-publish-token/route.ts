import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  req: NextRequest
) {

  const { token } =
    await req.json()

  const { data } =
    await supabase
      .from('listing_publish_tokens')
      .select('verified')
      .eq('token', token)
      .single()

  return NextResponse.json({

    verified:
      data?.verified || false

  })

}