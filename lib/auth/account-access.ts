import { supabase } from '@/lib/supabase'
export type AuthLocale = 'en' | 'es'
export const hubPath = (locale: AuthLocale) => locale === 'es' ? '/es/centro-de-mercado' : '/en/market-hub'
export const authLocale = (path?: string | null): AuthLocale => path?.startsWith('/es/') || path === '/es' ? 'es' : 'en'
// Match existing caller destinations only. Query parameters are restricted, never nested redirects.
const destinations = new Set(['/en/market-hub','/es/centro-de-mercado','/en/buy','/es/comprar','/en/rent-lease','/es/alquilar-arrendar','/en/sell','/es/vender','/en/rent-out-lease-out','/es/publicar-alquiler-arrendamiento','/en/market-intelligence','/es/inteligencia-de-mercado','/en/market-intelligence/packages','/es/inteligencia-de-mercado/paquetes'])
export function safeAuthNext(value: unknown, locale: AuthLocale = 'en'): string {
 if(typeof value !== 'string' || !value.startsWith('/') || /[\\%\s]/.test(value)) return hubPath(locale)
 try {const u=new URL(value,'https://twuanis.invalid'); if(u.origin!=='https://twuanis.invalid'||(!destinations.has(u.pathname)&&!/^\/publish-listing\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(u.pathname))||u.hash) return hubPath(locale)
 const query=new URLSearchParams(); for(const [k,v] of u.searchParams){if(k==='currency' && ['USD','CRC'].includes(v))query.set(k,v);if(k==='lang'&&['en','es'].includes(v))query.set(k,v)}
 return u.pathname+(query.size?'?'+query.toString():'')
 }catch{return hubPath(locale)}
}
export function authReturnContext(search: string) {
 const p=new URLSearchParams(search), locale: AuthLocale=p.get('lang')==='es'?'es':authLocale(p.get('next'))
 return {locale,next:safeAuthNext(p.get('next'),locale)}
}
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
