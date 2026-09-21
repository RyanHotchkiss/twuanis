import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ingestCsvObservation } from '@/lib/csv-source-ingestion'
export const runtime='nodejs'
export const dynamic='force-dynamic'
export async function POST(request:NextRequest) {
 try {
  const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1]
  if(!token)return NextResponse.json({success:false,error:'Authentication required.'},{status:401})
  const customer=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}})
  const {data:{user},error}=await customer.auth.getUser(token)
  if(error||!user)return NextResponse.json({success:false,error:'Authentication required.'},{status:401})
  const operator=await customer.rpc('is_current_user_import_operator')
  if(operator.error||operator.data!==true)return NextResponse.json({success:false,error:'Import-operator authority required.'},{status:403})
  const reader=request.body?.getReader();if(!reader)throw Error('One source observation required.')
  let size=0,text='';const decoder=new TextDecoder()
  try {while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>524288){await reader.cancel();throw Error('CSV observation exceeds bound.')}text+=decoder.decode(part.value,{stream:true})}}finally{reader.releaseLock()}
  text+=decoder.decode()
  const row=JSON.parse(text)
  if(!row||typeof row!=='object'||Array.isArray(row))throw Error('One source observation object required.')
  const result=await ingestCsvObservation(supabaseAdmin,row)
  return NextResponse.json(result,{status:result.success?200:422})
 }catch(error){return NextResponse.json({success:false,error:error instanceof Error?error.message:'Import not confirmed; retry same observation.'},{status:409})}
}
