'use server'
import {assertAdministrativePermission} from '@/lib/administrative-control'
import {createServerSupabaseClient} from '@/lib/supabase-server'
import type {AddonCatalog} from './addon-contract'
export async function readAdminAddons(after:string|null=null){
 try{
  await assertAdministrativePermission('addons.read')
  if(after!==null&&(typeof after!=='string'||after.length>150))return {ok:false as const}
  const db=await createServerSupabaseClient()
  const {data,error}=await db.rpc('admin_addon_read',{p_after:after})
  if(error||!data||!Array.isArray(data.products)||data.products.length>26||!Array.isArray(data.createBehaviors)||data.createBehaviors.length>8)return {ok:false as const}
  return {ok:true as const,data:data as AddonCatalog}
 }catch{return {ok:false as const}}
}
export async function changeAdminAddon(requestId:string,command:Record<string,unknown>){
 try{
  await assertAdministrativePermission('addons.manage')
  if(typeof requestId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)||!command||typeof command!=='object'||Array.isArray(command)||JSON.stringify(command).length>16000)return {ok:false as const,code:'invalid'}
  const db=await createServerSupabaseClient()
  const {data,error}=await db.rpc('admin_addon_command',{p_request:requestId,p_command:command})
  if(error)return {ok:false as const,code:error.code==='40001'?'stale':'rejected'}
  return data?.ok===true?{ok:true as const,productId:typeof data.productId==='string'?data.productId:undefined}:{ok:false as const,code:'rejected'}
 }catch{return {ok:false as const,code:'unavailable'}}
}
