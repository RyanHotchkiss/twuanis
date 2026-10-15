import { supabase } from '@/lib/supabase'
import { safeAuthNext, type AuthLocale } from './return-context'
export { hubPath, authLocale, safeAuthNext, authReturnContext, settingsPath, type AuthLocale } from './return-context'
export function authRedirect(path: '/auth/callback' | '/auth/reset-password', next: string, locale: AuthLocale) {
 const u=new URL(path,window.location.origin);u.searchParams.set('next',safeAuthNext(next,locale));u.searchParams.set('lang',locale);return u.toString()
}
export async function usableAuthUser() {
 const {data,error}=await supabase.auth.getUser();if(error||!data.user)throw new Error('auth_context');return data.user
}
// initialize() awaits the SDK's own PKCE exchange; do not exchange the same code again.
export async function validateAuthEntry(search: string, hash: string) {
 const q=new URLSearchParams(search), h=new URLSearchParams(hash.replace(/^#/,''));
 if(q.has('error')||q.has('error_code')||h.has('error')||h.has('error_code')||(q.has('code')&&!q.get('code')))throw new Error('auth_link')
 const {error}=await supabase.auth.initialize();if(error)throw new Error('auth_link')
 // The installed SDK removes a PKCE code only after successful exchange. Reject
 // a leftover code (e.g. missing verifier), even if an older session exists.
 if(q.has('code')&&new URLSearchParams(window.location.search).has('code'))throw new Error('auth_link')
 return usableAuthUser()
}
export async function signOutAccount() {
 const {error}=await supabase.auth.signOut({scope:'local'});if(error)throw new Error('auth_signout')
}
export async function requestAccountEmailChange(email: string, next: string, locale: AuthLocale) {
 try {
  if(typeof email!=='string'||email.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))return {ok:false as const,reason:'invalidEmail' as const}
  await usableAuthUser()
  const {error}=await supabase.auth.updateUser({email:email.trim()},{emailRedirectTo:authRedirect('/auth/callback',next,locale)})
  if(error)return {ok:false as const,reason:'provider' as const}
  // Do not project submitted email as confirmed. Caller reloads the trusted server reader.
  return {ok:true as const,status:'requested' as const}
 }catch{return {ok:false as const,reason:'provider' as const}}
}
