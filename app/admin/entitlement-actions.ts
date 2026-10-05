'use server'
import {assertAdministrativePermission} from '@/lib/administrative-control'
import {createServerSupabaseClient} from '@/lib/supabase-server'
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export async function readEntitlements(input:{id?:string;after?:string;account?:string;source?:string;kind?:string;state?:string;listing?:string}={}){
 try {await assertAdministrativePermission('entitlements.read');if([input.id,input.after,input.account,input.listing].some(v=>v!==undefined&&!uuid.test(v)))return {ok:false as const};const db=await createServerSupabaseClient();const r=await db.rpc('admin_entitlement_read',{p_id:input.id??null,p_after:input.after??null,p_account:input.account??null,p_source:input.source||null,p_class:input.kind||null,p_state:input.state||null,p_listing:input.listing??null});return r.error?{ok:false as const}:{ok:true as const,data:r.data}}catch{return{ok:false as const}}
}
export async function entitlementCommand(request:string,command:Record<string,unknown>){
 try{await assertAdministrativePermission('entitlements.manage');if(!uuid.test(request)||JSON.stringify(command).length>8000)return{ok:false as const};const db=await createServerSupabaseClient();const r=await db.rpc('admin_entitlement_command',{p_request:request,p_command:command});return r.error?{ok:false as const}:{ok:true as const,data:r.data}}catch{return{ok:false as const}}
}
export async function entitlementTargets(after?:string){try{await assertAdministrativePermission('entitlements.manage');if(after&&after.length>150)return{ok:false as const};const db=await createServerSupabaseClient();const r=await db.rpc('admin_entitlement_targets',{p_after:after??null});return r.error?{ok:false as const}:{ok:true as const,data:r.data}}catch{return{ok:false as const}}}
