"use server"
import {assertAdministrativePermission} from '@/lib/administrative-control'
import {createServerSupabaseClient} from '@/lib/supabase-server'
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export async function readSinpe(input:{id?:string;after?:string;state?:string;order?:string}={}){
 try{await assertAdministrativePermission('payments.read');if([input.id,input.after,input.order].some(x=>x!==undefined&&!uuid.test(x)))return {ok:false as const};const db=await createServerSupabaseClient();const r=await db.rpc('admin_sinpe_read',{p_id:input.id??null,p_after:input.after??null,p_state:input.state||null,p_order:input.order||null});return r.error?{ok:false as const}:{ok:true as const,data:r.data}}catch{return {ok:false as const}}
}
export async function reviewSinpe(id:string,request:string,command:Record<string,string>){
 try{await assertAdministrativePermission('payments.review');if(!uuid.test(id)||!uuid.test(request))return{ok:false as const};const db=await createServerSupabaseClient();const r=await db.rpc('review_order_sinpe',{p_attempt:id,p_request:request,p_command:command});return r.error?{ok:false as const}:{ok:true as const,data:r.data}}catch{return {ok:false as const}}
}

export async function retrySinpeFulfillment(order:string,request:string){try{await assertAdministrativePermission('payments.review');if(!uuid.test(order)||!uuid.test(request))return{ok:false as const};const db=await createServerSupabaseClient();const r=await db.rpc('retry_sinpe_fulfillment',{p_order:order,p_request:request});return r.error?{ok:false as const}:{ok:true as const,data:r.data}}catch{return{ok:false as const}}}
