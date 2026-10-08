'use server'
import {assertAdministrativePermission} from '@/lib/administrative-control'
import {createServerSupabaseClient} from '@/lib/supabase-server'
async function read(name:string,args:Record<string,unknown>){try{await assertAdministrativePermission('promotions.read');const db=await createServerSupabaseClient();const r=await db.rpc(name,args);return r.error?{ok:false as const}:{ok:true as const,data:r.data}}catch{return {ok:false as const}}}
export async function readCampaigns(after:string|null=null,state:string|null=null){return read('admin_campaign_read',{p_after:after,p_state:state})}
export async function campaignOptions(kind:string,after:string|null=null){return read('admin_campaign_options',{p_kind:kind,p_after:after})}
export async function campaignPerformance(id:string,after:string|null=null){return read('admin_campaign_performance',{p_id:id,p_after:after})}
export async function changeCampaign(request:string,command:Record<string,unknown>){
 try{await assertAdministrativePermission('promotions.manage');if(!/^[a-f0-9-]{36}$/i.test(request)||JSON.stringify(command).length>32000)return {ok:false as const,code:'invalid'};const db=await createServerSupabaseClient();const r=await db.rpc('admin_campaign_command',{p_request:request,p_command:command});return r.error?{ok:false as const,code:r.error.code==='40001'?'stale':'rejected'}:{ok:true as const,data:r.data}}catch{return {ok:false as const,code:'unavailable'}}
}
