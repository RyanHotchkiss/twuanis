'use client'
import {useEffect,useRef,useState} from 'react'
import {startEmbeddedStripeCheckout} from '@/app/commercial/stripe-actions'
type Instance={mount:(node:HTMLElement)=>void;destroy:()=>void}
type StripeFactory=(key:string)=>{initEmbeddedCheckout:(options:{fetchClientSecret:()=>Promise<string>;onComplete:()=>void})=>Promise<Instance>}
let loading:Promise<StripeFactory>|null=null
function stripeScript(){if(loading)return loading;loading=new Promise((resolve,reject)=>{const w=window as unknown as {Stripe?:StripeFactory};if(w.Stripe){resolve(w.Stripe);return}const s=document.createElement('script');s.src='https://js.stripe.com/acacia/stripe.js';s.async=true;s.onload=()=>w.Stripe?resolve(w.Stripe):reject(Error());s.onerror=()=>reject(Error());document.head.appendChild(s)});return loading}
export default function StripeEmbeddedCheckout({order,language,onComplete}:{order:string;language:'en'|'es';onComplete:()=>void}){
 const target=useRef<HTMLDivElement>(null),latest=useRef(onComplete);latest.current=onComplete;const[error,setError]=useState(false)
 useEffect(()=>{let live=true,instance:Instance|null=null;void(async()=>{try{const result=await startEmbeddedStripeCheckout(order,language);if(!result.ok)throw Error();if(!live)return;const Stripe=await stripeScript();if(!live)return;instance=await Stripe(result.publishableKey).initEmbeddedCheckout({fetchClientSecret:async()=>result.clientSecret,onComplete:()=>{if(live)latest.current()}});if(!live){instance.destroy();return}if(target.current)instance.mount(target.current)}catch{if(live)setError(true)}})();return()=>{live=false;instance?.destroy()}},[order,language])
 return <section aria-label={language==='es'?'Pago Stripe integrado':'Embedded Stripe Checkout'}>{error?<p role="alert">{language==='es'?'No se pudo abrir el pago integrado. Conserve este pedido; no inicie otro pago.':'Embedded Checkout is unavailable. Keep this Order; do not start another payment.'}</p>:null}<div ref={target}/></section>
}
