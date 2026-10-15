 'use client'
import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { authReturnContext, validateAuthEntry, usableAuthUser, type AuthLocale } from '@/lib/auth/account-access'
import { accountCopy } from '@/lib/auth/account-copy'
export default function ResetPasswordPage(){
 const [locale,setLocale]=useState<AuthLocale>('en'),[next,setNext]=useState('/en/market-hub'),[ready,setReady]=useState(false),[failed,setFailed]=useState(false),[loading,setLoading]=useState(false),[saved,setSaved]=useState(false)
 const [password,setPassword]=useState(''),[confirmPassword,setConfirmPassword]=useState(''),[error,setError]=useState('')
 useEffect(()=>{let active=true;const c=authReturnContext(window.location.search);setLocale(c.locale);setNext(c.next)
 const timer=window.setTimeout(()=>{if(active){active=false;setFailed(true)}},10000)
 validateAuthEntry(window.location.search,window.location.hash).then(()=>{if(active){setReady(true);window.clearTimeout(timer)}}).catch(()=>{if(active){setFailed(true);window.clearTimeout(timer)}})
 return()=>{active=false;window.clearTimeout(timer)}},[])
 const t=accountCopy(locale)
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();if(!ready||failed||loading||saved)return
 if(password.length<6){setError(t.shortPassword);return}if(password!==confirmPassword){setError(t.mismatch);return}
 setLoading(true);setError('');try{await usableAuthUser();const {error}=await supabase.auth.updateUser({password});if(error)throw error;setPassword('');setConfirmPassword('');setSaved(true)}catch{setError(t.failure)}finally{setLoading(false)}}
 return <main style={page}><section style={card}><h1 style={heading}>{t.newPassword}</h1>
 {failed?<p role="alert" style={errorText}>{t.badLink}</p>:!ready?<p role="status">{t.working}</p>:saved?<><p role="status">{t.saved}</p><a href={next}>{t.returnHub}</a></>:<form onSubmit={submit} style={form}>
 <input aria-label={t.password} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder={t.password} autoComplete="new-password" required minLength={6} style={input}/>
 <input aria-label={t.confirmNew} type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder={t.confirmNew} autoComplete="new-password" required minLength={6} style={input}/>
 <button type="submit" disabled={loading} style={button}>{loading?t.working:t.savePassword}</button></form>}
 {error&&<p role="alert" style={errorText}>{error}</p>}</section></main>
}

const page = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1.5rem',
  background: 'var(--background)'
}

const card = {
  width: '100%',
  maxWidth: '32rem',
  padding: '2rem',
  border: '1px solid var(--border)',
  borderRadius: '2rem',
  background: 'var(--surface)',
  color: 'var(--foreground)'
}

const heading = {
  margin: '0 0 1.5rem',
  color: '#D4AF37',
  textAlign: 'center' as const
}

const form = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '1rem'
}

const input = {
  width: '100%',
  boxSizing: 'border-box' as const,
  padding: '1rem',
  border: '1px solid var(--border)',
  borderRadius: '1rem',
  background: 'var(--input)',
  color: 'var(--foreground)',
  fontSize: '1rem'
}

const button = {
  width: '100%',
  padding: '1rem',
  border: 'none',
  borderRadius: '999rem',
  background: 'var(--foreground)',
  color: 'var(--background)',
  fontSize: '1rem',
  fontWeight: 700,
  cursor: 'pointer'
}

const errorText = {
  marginTop: '1rem',
  color: 'var(--error-text)',
  lineHeight: 1.6
}