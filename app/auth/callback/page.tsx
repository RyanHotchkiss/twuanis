 'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authReturnContext, validateAuthEntry, type AuthLocale } from '@/lib/auth/account-access'
import { confirmSignup } from '@/lib/auth/confirm-signup'
import { settingsPath } from '@/lib/auth/return-context'
import { accountCopy } from '@/lib/auth/account-copy'
export default function AuthCallbackPage(){
 const signupAttempt=useRef<Promise<Awaited<ReturnType<typeof confirmSignup>>>|null>(null)
 const router=useRouter();const [locale,setLocale]=useState<AuthLocale>('en');const [failed,setFailed]=useState(false)
 useEffect(()=>{
  let active=true;const {locale,next}=authReturnContext(window.location.search);setLocale(locale)
  const timer=window.setTimeout(()=>{if(active){active=false;setFailed(true)}},10000)
  const params=new URLSearchParams(window.location.search),hash=params.get('token_hash')
  async function complete(){
   if(hash){
    // POST Server Action avoids consuming email links during passive GET prefetch.
    if(params.get('type')!=='email'||params.has('error'))throw Error('auth_link')
    signupAttempt.current??=confirmSignup(hash)
    const result=await signupAttempt.current
    if(!result.ok)throw Error('auth_link')
    if(active){active=false;window.clearTimeout(timer)
     const destination=settingsPath(locale)
     window.location.replace(result.authenticated?destination:'/login?lang='+locale+'&next='+encodeURIComponent(destination))
    }
   }else{
    // Retain existing PKCE/implicit flows for recovery and secure email change.
    if(!params.has('code')&&!new URLSearchParams(window.location.hash.slice(1)).has('access_token'))throw Error('auth_link')
    await validateAuthEntry(window.location.search,window.location.hash)
    if(active){active=false;window.clearTimeout(timer);router.replace(next);router.refresh()}
   }
  }
  complete().catch(()=>{if(active){active=false;window.clearTimeout(timer);setFailed(true)}})
  return()=>{active=false;window.clearTimeout(timer)}
 },[router])
 const t=accountCopy(locale)
 return <main style={main}><div style={card}><h1 style={heading}>MarketHub</h1><p role={failed?'alert':'status'} style={messageStyle}>{failed?t.badLink:t.callback}</p>{failed&&<a href={'/login?lang='+locale+'&next='+encodeURIComponent(settingsPath(locale))}>{locale==='es'?'Iniciar sesión':'Sign in'}</a>}</div></main>
}

const main = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
  background: 'var(--background)',
  color: 'var(--foreground)'
}

const card = {
  width: '100%',
  maxWidth: '34rem',
  padding: '2rem',
  border: '1px solid var(--border)',
  borderRadius: '2rem',
  background: 'var(--surface)',
  textAlign: 'center' as const
}

const heading = {
  margin: 0,
  color: '#D4AF37',
  fontSize: '2.25rem'
}

const messageStyle = {
  margin: '1rem 0 0',
  color: 'var(--muted)',
  lineHeight: 1.7
}