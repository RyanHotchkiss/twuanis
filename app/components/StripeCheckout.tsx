'use client'
import {useState} from 'react'
import {useStripeCheckoutNavigation} from './StripeCheckoutNavigation'
export default function StripeCheckout({order,language}:{order:string;language:'en'|'es'}){
 const[busy,setBusy]=useState(false),[error,setError]=useState(false);const es=language==='es',navigation=useStripeCheckoutNavigation(language)
 return <section><button className="stripe-checkout-action" disabled={busy} onClick={async()=>{if(busy)return;const tab=navigation.begin();setBusy(true);setError(false);try{await tab.checkout(order)}catch{tab.cancel();setError(true)}finally{setBusy(false)}}}>{busy?(es?'Abriendo pago…':'Opening checkout…'):(es?'Pagar con Stripe (USD)':'Pay with Stripe (USD)')}</button>{navigation.fallback}{error&&<p role="alert">{es?'No se pudo abrir Stripe. Revise el estado del pedido antes de reintentar.':'Stripe could not be opened. Check your order status before retrying.'}</p>}</section>
}
