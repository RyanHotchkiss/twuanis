import 'server-only'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { normalizeAccountPhone } from './phone-validation'
export async function phoneCommand(user:string,request:string|null,op:string,revision:number|null=null,data:Record<string,unknown>={}){
 const result=await supabaseAdmin.rpc('account_phone_service',{p_user:user,p_request:request,p_operation:op,p_revision:revision,p_data:data})
 if(result.error)throw new Error('unavailable');return result.data
}
export const readAccountPhone=(user:string)=>phoneCommand(user,null,'read')
export async function changeAccountPhone(user:string,request:string,revision:number,input:unknown,country:unknown){
 let phone:string|null;try{phone=typeof input==='string'&&!input.trim()?null:normalizeAccountPhone(input,country)}catch{return {ok:false,reason:'invalid'}}
 const result=await phoneCommand(user,request,'change',revision,{phone});return {...result,current:await readAccountPhone(user)}
}
