import {NextRequest,NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase-admin'
import {publicationAccount,assertPublicationToken} from '@/lib/token-canonical-creation'
import {sendPublicationEmail} from '@/lib/email'
// Retain the existing route for callers; this sends the existing link, not a new OTP.
export async function POST(request:NextRequest){
 let es=false
 try{
  const account=await publicationAccount(request)
  if(!account)return NextResponse.json({success:false,error:'Sign in with your confirmed account email before publishing.'},{status:401})
  const {token}=await request.json()
  if(typeof token!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(token))return NextResponse.json({success:false,error:'Publish token required.'},{status:400})
  const {data:row,error}=await supabaseAdmin.from('listing_publish_tokens').select('created_at,verified,published_at,listing_data').eq('token',token).single()
  if(error||!row)return NextResponse.json({success:false,error:'Publishing session not found.'},{status:404})
  es=row.listing_data?.publication_delivery?.language==='es'
  // Legacy tokens retain their existing completion contract; new email delivery requires the server-bound owner.
  if(row.listing_data?.publication_delivery?.account_id!==account.user.id)return NextResponse.json({success:false,error:es?'Esta sesión pertenece a otra cuenta.':'This publishing session belongs to another account.'},{status:403})
  assertPublicationToken(row,account.user.id)
  if(row.verified||row.published_at)return NextResponse.json({success:false,error:es?'Este anuncio ya está publicado.':'This listing is already published.'},{status:409})
  await sendPublicationEmail({to:account.user.email!,token,language:es?'es':'en'})
  return NextResponse.json({success:true})
 }catch{return NextResponse.json({success:false,error:es?'No se pudo confirmar el envío del enlace. Su sesión se conserva; reintente.':'The publication email could not be confirmed. Your session is preserved; retry.'},{status:409})}
}
