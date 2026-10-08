import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { completeTokenCreation } from '@/lib/token-canonical-creation'
export const runtime='nodejs'
export const dynamic='force-dynamic'
export async function POST(request:NextRequest) {
 try {
  const accessToken=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1]
  if(!accessToken)return NextResponse.json({success:false,error:'Authentication required.'},{status:401})
  const customer=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{global:{headers:{Authorization:`Bearer ${accessToken}`}},auth:{persistSession:false,autoRefreshToken:false}})
  const {data:{user},error}=await customer.auth.getUser(accessToken)
  if(error||!user)return NextResponse.json({success:false,error:'Authentication required.'},{status:401})
  const body=await request.json()
  if(typeof body.token!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(body.token)||Object.keys(body).some(k=>!['token','phase'].includes(k))||(body.phase!==undefined&&!['prepare','publish'].includes(body.phase)))throw Error('Only the original publishing token is accepted.')
  const commerce=process.env.TWUANIS_SINPE_PAYMENTS==='canonical'&&process.env.TWUANIS_PACKAGE_ENFORCEMENT==='canonical'
  const result=await completeTokenCreation(supabaseAdmin,customer,user.id,body.token,commerce&&body.phase==='prepare')
  return NextResponse.json(result,{status:result.success?200:409})
 }catch(error){return NextResponse.json({success:false,error:error instanceof Error?error.message:'Publication not confirmed. Retry the same token.'},{status:409})}
}
