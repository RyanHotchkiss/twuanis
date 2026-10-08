'use server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
// This reader has no caller-supplied account identity or email and exposes no tokens/metadata.
export async function readAccountEmail() {
 try {
  const db=await createServerSupabaseClient(); const {data,error}=await db.auth.getUser()
  if(error||!data.user)return {ok:false as const}
  const user=data.user
  return {ok:true as const,email:user.email??null,emailConfirmed:!!(user.email&&user.email_confirmed_at),pendingEmail:user.new_email??null}
 }catch{return {ok:false as const}}
}
