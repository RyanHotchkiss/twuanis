import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { customerEditDomains } from '@/lib/canonical-customer-edit'
export const runtime='nodejs'
export const dynamic='force-dynamic'
export async function POST(request: NextRequest) {
 try {
  const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1]
  if(!token)return NextResponse.json({error:'Authentication required.'},{status:401})
  const customer=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}})
  const {data:{user},error:authError}=await customer.auth.getUser(token)
  if(authError||!user)return NextResponse.json({error:'Authentication required.'},{status:401})
  const body=await request.json(),uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if(!uuid.test(body.listingId)||!uuid.test(body.requestId)||typeof body.expectedRevision!=='string'||!/^\d{1,19}$/.test(body.expectedRevision)||!body.changes||Array.isArray(body.changes)||typeof body.changes!=='object'||JSON.stringify(body.changes).length>65536)throw new Error('Explicit bounded edit required.')
  const {data:row,error}=await customer.from('listings').select('id,owner_id,canonical_domain_version,transaction_type,current_price::text,monthly_price::text,currency,province,canton,district').eq('id',body.listingId).eq('owner_id',user.id).maybeSingle()
  if(error||!row||row.owner_id!==user.id||row.canonical_domain_version!==1)throw new Error('Confirmed owned canonical listing required.')
  const {domains,content}=await customerEditDomains(customer,body.changes,row)
  const {data,error:writeError}=await customer.rpc('edit_customer_canonical_listing',{p_listing:body.listingId,p_expected:body.expectedRevision,p_request:body.requestId,p_domains:domains,p_content:content})
  if(writeError)throw new Error(writeError.message)
  if(data?.listing_id!==body.listingId)throw new Error('Edit result was not confirmed. Retry the same request.')
  return NextResponse.json({success:true,result:data})
 } catch(error) {return NextResponse.json({error:error instanceof Error?error.message:'Edit failed.'},{status:409})}
}
