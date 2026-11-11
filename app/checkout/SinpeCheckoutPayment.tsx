'use client'
import {useEffect,useState} from 'react'
import Link from 'next/link'
import OnvoPayment from '@/app/payments/OnvoPayment'
import {sinpeMoney} from '@/lib/sinpe-journey'
import {boundedSinpeRead} from '@/lib/sinpe-status-refresh'
import {readSinpeCheckoutDisplay} from './sinpe-display'

type Display=NonNullable<Awaited<ReturnType<typeof readSinpeCheckoutDisplay>>>
export default function SinpeCheckoutPayment({order,language,product,onResume,back,name,quotedAmount}:{order:string;language:'en'|'es';product:string;onResume:()=>void;back:string;name:string;quotedAmount:number}){
 const es=language==='es',[display,setDisplay]=useState<Display|null>(null),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0)
 useEffect(()=>{let live=true;setDisplay(null);setFailed(false)
  boundedSinpeRead(()=>readSinpeCheckoutDisplay(order,language)).then(value=>{if(live){if(value&&value.product===product)setDisplay(value);else setFailed(true)}}).catch(()=>{if(live)setFailed(true)})
  return()=>{live=false}
 },[order,language,product,retry])
 return <div className="sinpe-checkout-payment">{display?<OnvoPayment key={order+language} {...display} language={language} twoStep onResumePreparation={onResume} restartHref={back}/>:<section className="sinpe-instructions sinpe-compact" aria-busy={!failed}><h1>{es?'Pagar con SINPE Móvil':'Pay with SINPE Móvil'}</h1><h2>{name}</h2><p>{es?'Cotización seleccionada':'Selected quote'}: {sinpeMoney(quotedAmount)}</p><p role="status">{failed?(es?'No se pudieron consultar los datos de este pedido. Vuelve a intentar; no se creará otro pedido.':'This Order’s payment details are unavailable. Try again; no new Order will be created.'):(es?'Consultando los datos de tu pago…':'Loading your payment details…')}</p>{failed&&<button type="button" onClick={()=>setRetry(v=>v+1)}>{es?'Volver a intentar':'Try again'}</button>}</section>}<p><Link href={back}>{es?'Volver a los Paquetes':'Back to Packages'}</Link></p></div>
}
