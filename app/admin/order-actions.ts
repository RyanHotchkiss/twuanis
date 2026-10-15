
'use server'
import {assertAdministrativePermission} from '@/lib/administrative-control'
import {createServerSupabaseClient} from '@/lib/supabase-server'
export async function readOrders(input:{id?:string;after?:string;account?:string;kind?:string;source?:string;currency?:string}={}){
 try{await assertAdministrativePermission('orders.read');
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 if(Object.keys(input).some(k=>!['id','after','account','kind','source','currency'].includes(k))||[input.id,input.after,input.account].some(v=>v!==undefined&&!uuid.test(v)))return {ok:false as const};
 const db=await createServerSupabaseClient();const r=await db.rpc('admin_order_read',{p_id:input.id??null,p_after:input.after??null,p_account:input.account??null,p_kind:input.kind||null,p_source:input.source||null,p_currency:input.currency||null});
 return r.error?{ok:false as const}:{ok:true as const,data:r.data};
 }catch{return {ok:false as const}}
}
