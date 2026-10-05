'use server'
import {assertAdministrativePermission} from '@/lib/administrative-control'
import {createServerSupabaseClient} from '@/lib/supabase-server'
export async function readAdminOffers(filters:{after?:string|null;status?:string|null;kind?:string|null;target?:string|null;currency?:string|null}={}) {
 try {await assertAdministrativePermission('offers.read');const db=await createServerSupabaseClient();const {data,error}=await db.rpc('admin_offer_read',{p_after:filters.after??null,p_status:filters.status??null,p_kind:filters.kind??null,p_target:filters.target??null,p_currency:filters.currency??null});return error?{ok:false as const}:{ok:true as const,data}}catch{return {ok:false as const}}
}
export async function readOfferTargets(kind:'package'|'addon',after:string|null=null){
 try {await assertAdministrativePermission('offers.read');const db=await createServerSupabaseClient();const {data,error}=await db.rpc('admin_offer_targets',{p_kind:kind,p_after:after});return error?{ok:false as const}:{ok:true as const,data}}catch{return {ok:false as const}}
}
export async function changeAdminOffer(requestId:string,command:Record<string,unknown>){
 try {await assertAdministrativePermission('offers.manage');if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)||!command||Array.isArray(command)||typeof command!=='object'||JSON.stringify(command).length>16000)return {ok:false as const,code:'invalid'};const db=await createServerSupabaseClient();const {data,error}=await db.rpc('admin_offer_command',{p_request:requestId,p_command:command});return error?{ok:false as const,code:error.code==='40001'?'stale':'rejected'}:{ok:true as const,data}}catch{return {ok:false as const,code:'unavailable'}}
}
