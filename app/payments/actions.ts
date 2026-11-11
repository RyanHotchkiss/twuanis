"use server"
import {supabaseAdmin} from '@/lib/supabase-admin'
import {onvoAutomationEnabled} from '@/lib/providers/onvo-automation'
import {createServerSupabaseClient} from '@/lib/supabase-server'
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export async function readMySinpe(order:string){try{if(process.env.TWUANIS_SINPE_PAYMENTS!=='canonical'||!uuid.test(order))return{ok:false as const};const db=await createServerSupabaseClient();const {data:user,error}=await db.auth.getUser();if(error||!user.user)return{ok:false as const};const r=await db.rpc('read_order_sinpe',{p_order:order});return r.error?{ok:false as const}:{ok:true as const,data:r.data}}catch{return{ok:false as const}}}
export async function submitMySinpe(order:string,request:string,account:string,evidence:Record<string,string>){try{if(process.env.TWUANIS_SINPE_PAYMENTS!=='canonical'||![order,request,account].every(x=>uuid.test(x)))return{ok:false as const};const db=await createServerSupabaseClient();const {data:user,error}=await db.auth.getUser();if(error||!user.user)return{ok:false as const};const r=await db.rpc('submit_order_sinpe',{p_order:order,p_request:request,p_account:account,p_evidence:evidence});return r.error?{ok:false as const}:{ok:true as const,id:r.data}}catch{return{ok:false as const}}}

export async function readMyOnvoPayment(order:string){
 try{
  if(!uuid.test(order))throw Error()
  const db=await createServerSupabaseClient(),auth=await db.auth.getUser();if(auth.error||!auth.data.user)throw Error()
  let r=await db.rpc('read_my_onvo_payment',{p_order:order});if(r.error||!r.data||r.data.orderId!==order.toLowerCase())throw Error()
  if(r.data.kind==='addon'&&r.data.onvoAcknowledged===true&&r.data.fulfillment==='PENDING'&&onvoAutomationEnabled()){
   // Retry an already verified, owned payment through the same issuer. The job row
   // enforces its existing retry interval under lock; no new payment is initiated.
   await supabaseAdmin.rpc('onvo_service_command',{p_operation:'fulfill',p_command:{orderId:order,accountId:auth.data.user.id,customerRetry:true}})
   r=await db.rpc('read_my_onvo_payment',{p_order:order});if(r.error||!r.data||r.data.orderId!==order.toLowerCase())throw Error()
  }
  const state=r.data.kind==='addon'&&r.data.canonicalPaid===true?{...r.data,payment:'APPROVED'}:r.data
  return {ok:true as const,data:state}
 }catch{return {ok:false as const}}
}

// Display current Bank coverage through the existing entitlement predicate, never a browser selection.
export async function readMyPaymentCoverage(order:string){
 try{
  if(!uuid.test(order))return null
  const db=await createServerSupabaseClient(),auth=await db.auth.getUser();if(auth.error||!auth.data.user)return null
  const detail=await db.rpc('read_customer_commercial',{p_area:'orders',p_id:order,p_after:null,p_listing:null,p_history:false})
  const row=detail.data?.[0];if(detail.error||!row?.paid||!row?.fulfilled||row.kind!=='package')return null
  const catalog=await db.rpc('read_intelligence_package_catalog',{});if(catalog.error||!Array.isArray(catalog.data)||catalog.data.length>26)return null
  const product=catalog.data.find((p:any)=>p.id===row.product),caps=product?.capabilities
  if(!Array.isArray(caps)||caps.length<1||caps.length>32||caps.some((c:unknown)=>typeof c!=='string'))return null
  const coverage=await Promise.all(caps.map((cap:string)=>db.rpc('current_account_has_population_capability',{p_capability:cap,p_population:'BANK'})))
  if(coverage.some(r=>r.error))return null
  return {bankAccess:coverage.every(r=>r.data===true)}
 }catch{return null}
}
