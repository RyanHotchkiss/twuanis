'use server'
import {invalidatePublicListingRepresentations} from '@/lib/semantic-invalidation'
import {createServerSupabaseClient} from '@/lib/supabase-server'
import {customerEditDomains} from '@/lib/canonical-customer-edit'
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export async function prepareBulkAddon(request:string,rows:Record<string,unknown>[],provider:'existing'|'stripe'='existing'){
 try{
  if(!uuid.test(request)||!Array.isArray(rows)||rows.length<1||rows.length>500||Buffer.byteLength(JSON.stringify(rows))>2097152)throw Error()
  const db=await createServerSupabaseClient(),auth=await db.auth.getUser();if(auth.error||!auth.data.user?.email_confirmed_at)return {ok:false as const,reason:'authentication'}
  // Existing explicit customer edit resolver owns geography, ontology and numeric validation.
  const inputs=[]
  for(const row of rows){
   try{
    if(!row||Array.isArray(row)||!['sale','rent'].includes(String(row.transaction)))throw Error()
    const {transaction,...changes}=row
    for(const field of ['property_area','construction_area'])if(typeof changes[field]==='string'&&changes[field]!=='')changes[field]={kind:'set',value:changes[field]}
    const mapped=await customerEditDomains(db,changes,{transaction_type:transaction,district:null})
    inputs.push({transaction,...mapped.domains,...(Object.keys(mapped.content).length?{content:mapped.content}:{})})
   }catch{inputs.push({transaction:'invalid',unresolved:row})}
  }
  const prepared=await db.rpc('prepare_customer_addon_import',{p_request:request,p_rows:inputs,p_currency:provider==='stripe'?'USD':'CRC'});if(prepared.error||!uuid.test(prepared.data?.jobId))throw Error()
  const quote=await db.rpc('read_customer_addon_job',{p_job:prepared.data.jobId});if(quote.error||!quote.data)throw Error()
  return {ok:true as const,job:quote.data}
 }catch{return {ok:false as const,reason:'canonical_input_rejected'}}
}
export async function readBulkAddonJobs(job?:string,after?:string){
 try{
  if((job!==undefined&&!uuid.test(job))||(after!==undefined&&!uuid.test(after))||(job!==undefined&&after!==undefined))throw Error()
  const db=await createServerSupabaseClient(),auth=await db.auth.getUser();if(auth.error||!auth.data.user)return {ok:false as const}
  const result=job?await db.rpc('read_customer_addon_job',{p_job:job}):await db.rpc('read_customer_addon_jobs',{p_after:after??null})
  if(result.error)throw Error();return {ok:true as const,data:result.data}
 }catch{return {ok:false as const}}
}
export async function readFounderAddonAcquisition(){
 try{
  const db=await createServerSupabaseClient(),auth=await db.auth.getUser();if(auth.error||!auth.data.user)return {ok:false as const}
  const r=await db.rpc('read_customer_founder_acquisition');if(r.error)throw Error();return {ok:true as const,data:r.data}
 }catch{return {ok:false as const}}
}

export async function executeFreeBulkAddon(job:string){
 try{if(!uuid.test(job))throw Error();const db=await createServerSupabaseClient(),auth=await db.auth.getUser();if(auth.error||!auth.data.user?.email_confirmed_at)return {ok:false as const,reason:'authentication'};
 const result=await db.rpc('execute_free_customer_addon_import',{p_job:job});if(result.error)throw Error();for(const row of result.data?.results??[])if(uuid.test(row.listingId))invalidatePublicListingRepresentations(row.listingId);return {ok:true as const,job:result.data};
 }catch{return {ok:false as const,reason:'canonical_input_rejected'}}
}
