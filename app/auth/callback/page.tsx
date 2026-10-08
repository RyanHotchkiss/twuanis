 'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authReturnContext, validateAuthEntry, type AuthLocale } from '@/lib/auth/account-access'
import { accountCopy } from '@/lib/auth/account-copy'
export default function AuthCallbackPage(){
 const router=useRouter();const [locale,setLocale]=useState<AuthLocale>('en');const [failed,setFailed]=useState(false)
 useEffect(()=>{
  let active=true;const {locale,next}=authReturnContext(window.location.search);setLocale(locale)
  const timer=window.setTimeout(()=>{if(active){active=false;setFailed(true)}},10000)
  // SDK initialization resolves URL exchange; no INITIAL_SESSION-based success or duplicate token exchange.
  validateAuthEntry(window.location.search,window.location.hash).then(()=>{if(active){active=false;window.clearTimeout(timer);router.replace(next);router.refresh()}}).catch(()=>{if(active){active=false;window.clearTimeout(timer);setFailed(true)}})
  return()=>{active=false;window.clearTimeout(timer)}
 },[router])
 const t=accountCopy(locale)
 return <main style={main}><div style={card}><h1 style={heading}>MarketHub</h1><p role={failed?'alert':'status'} style={messageStyle}>{failed?t.badLink:t.callback}</p></div></main>
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