'use server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
// Only Supabase validates the token. Metadata and callback visitation never prove confirmation.
export async function confirmSignup(tokenHash:string) {
 if(typeof tokenHash!=='string'||! /^[A-Za-z0-9_-]{32,256}$/.test(tokenHash))return {ok:false as const}
 try {
  const db=await createServerSupabaseClient()
  const {data,error}=await db.auth.verifyOtp({token_hash:tokenHash,type:'email'})
  if(error||!data.user?.email_confirmed_at)return {ok:false as const}
  const verified=await db.auth.getUser()
  return {ok:true as const,authenticated:!verified.error&&verified.data.user?.id===data.user.id}
 }catch{return {ok:false as const}}
}
