'use client'
import {useEffect,useRef,useState} from 'react'
import {useRouter} from 'next/navigation'
import {startStripeCheckout} from '@/app/commercial/stripe-actions'

const statusRefresh='twuanis:commercial-status-refresh'
export function useCommercialStatusRevision(){
 const [revision,setRevision]=useState(0)
 useEffect(()=>{const refresh=()=>setRevision(v=>v+1);window.addEventListener(statusRefresh,refresh);return()=>window.removeEventListener(statusRefresh,refresh)},[])
 return revision
}

export function useStripeCheckoutNavigation(language:'en'|'es'){
 const router=useRouter(),returned=useRef(false)
 const [link,setLink]=useState<{url:string;opened:boolean}|null>(null)
 const es=language==='es'
 useEffect(()=>{
  const refresh=()=>{if(!returned.current||document.visibilityState!=='visible'||!document.hasFocus())return;window.dispatchEvent(new Event(statusRefresh));router.refresh()}
  window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh)
  return()=>{window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh)}
 },[router])
 function begin(){
  setLink(null)
  let tab:Window|null=null
  try{
   // Reserve the tab synchronously in the trusted click, before creating an order/session.
   tab=window.open('about:blank','_blank')
   if(tab){tab.opener=null;tab.document.title=es?'Abriendo Stripe…':'Opening Stripe…';tab.document.body.textContent=es?'Abriendo el pago seguro de Stripe…':'Opening secure Stripe Checkout…'}
  }catch{if(tab&&!tab.closed)tab.close();tab=null}
  const cancel=()=>{try{if(tab&&!tab.closed&&tab.location.href==='about:blank')tab.close()}catch{/* Never close a tab the customer navigated elsewhere. */}}
  return {cancel,async checkout(order:string){
   try{
    const result=await startStripeCheckout(order,language)
    if(!result.ok)throw Error(result.reason==='expired'?'checkout_expired':result.reason==='completed'?'checkout_completed':'Checkout unavailable')
    const url=new URL(result.url)
    if(url.protocol!=='https:'||url.hostname!=='checkout.stripe.com')throw Error('Invalid Checkout destination')
    let opened=false
    try{if(tab&&!tab.closed&&tab.location.href==='about:blank'){tab.location.replace(result.url);opened=true}}catch{/* A blocked or closed tab uses the explicit safe fallback. */}
    if(!opened)cancel()
    setLink({url:result.url,opened});returned.current=true
   }catch(error){cancel();throw error}
  }}
 }
 return {begin,fallback:link?<p role="status">{link.opened?(es?'Stripe se abrió en una pestaña nueva.':'Stripe opened in a new tab.'):(es?'No se abrió la pestaña de pago. Utilice este enlace para abrirla en una pestaña nueva.':'The checkout tab did not open. Use this link to open it in a new tab.')} {' '}<a href={link.url} target="_blank" rel="noopener noreferrer">{es?'Abrir Stripe Checkout':'Open Stripe Checkout'}</a></p>:null}
}
