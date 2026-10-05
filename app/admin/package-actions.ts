'use server'
import {assertAdministrativePermission} from '@/lib/administrative-control'
import {createServerSupabaseClient} from '@/lib/supabase-server'
import type {PackageCatalog} from './package-contract'
export async function readAdminPackages(after:string|null=null){
 try{
  await assertAdministrativePermission('packages.read')
  if(after!==null&&(typeof after!=='string'||after.length>150))return {ok:false as const}
  const db=await createServerSupabaseClient()
  const {data,error}=await db.rpc('admin_package_read',{p_after:after})
  if(error||!data||!Array.isArray(data.packages)||data.packages.length>26||!Array.isArray(data.capabilities)||data.capabilities.length!==17)return {ok:false as const}
  return {ok:true as const,data:data as PackageCatalog}
 }catch{return {ok:false as const}}
}
export async function changeAdminPackage(requestId:string,command:Record<string,unknown>){
 try{
  await assertAdministrativePermission('packages.manage')
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)||!command||typeof command!=='object'||Array.isArray(command)||JSON.stringify(command).length>16000)return {ok:false as const,code:'invalid'}
  const db=await createServerSupabaseClient()
  const {data,error}=await db.rpc('admin_package_command',{p_request:requestId,p_command:command})
  if(error)return {ok:false as const,code:error.code==='40001'?'stale':'rejected'}
  return data?.ok===true?{ok:true as const,packageId:typeof data.packageId==='string'?data.packageId:undefined}:{ok:false as const,code:'rejected'}
 }catch{return {ok:false as const,code:'unavailable'}}
}
