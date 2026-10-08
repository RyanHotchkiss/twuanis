'use server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
type Profile={name:string|null;biography:string|null;language:'en'|'es'|null;revision:number}
function project(p:Profile):Profile{return {name:p.name,biography:p.biography,language:p.language,revision:p.revision}}
export async function readSettingsProfile(){
 try{const db=await createServerSupabaseClient();const {data,error}=await db.rpc('read_account_profile');if(error||!data)return {ok:false as const,reason:'unavailable' as const};return {ok:true as const,profile:project(data)}}catch{return {ok:false as const,reason:'unavailable' as const}}
}
export async function saveSettingsProfile(request:string,revision:number,patch:Record<string,unknown>){
 if(typeof request!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(request)||!Number.isSafeInteger(revision)||revision<0||!patch||typeof patch!=='object'||Array.isArray(patch)||!Object.keys(patch).length||Object.keys(patch).some(k=>!['name','biography','language'].includes(k))||Object.entries(patch).some(([k,v])=>k==='language'?!['en','es'].includes(v as string):typeof v!=='string'||Array.from(v).length>(k==='name'?120:2000)))return {ok:false as const,reason:'invalid' as const}
 try{const db=await createServerSupabaseClient();const {error}=await db.rpc('update_account_profile',{p_request:request,p_expected_revision:revision,p_patch:patch});if(error)return {ok:false as const,reason:error.code==='40001'?'conflict' as const:'unavailable' as const};const {data,error:readError}=await db.rpc('read_account_profile');if(readError||!data)return {ok:false as const,reason:'unavailable' as const};return {ok:true as const,profile:project(data)}}catch{return {ok:false as const,reason:'unavailable' as const}}
}
