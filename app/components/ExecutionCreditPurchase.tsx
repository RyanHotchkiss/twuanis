'use client'
import {commercialTheme} from '@/lib/commercial-theme'
import './commercial-actions.css'
import {checkoutPath} from '@/lib/checkout-selection'
import {useStripeCheckoutNavigation,useCommercialStatusRevision} from './StripeCheckoutNavigation'
import {createStripeCreditOrder,stripeCreditReadiness} from '@/app/commercial/stripe-actions'
import {useEffect,useRef,useState} from 'react'
import Link from 'next/link'
import {executionCreditCatalog,purchaseExecutionCredits} from '@/app/commercial/actions'
export default function ExecutionCreditPurchase({language}:{language:'en'|'es'}){
 const es=language==='es',t=(en:string,sp:string)=>es?sp:en
 const [currency,setCurrency]=useState<'USD'|'CRC'>(es?'CRC':'USD'),[quantity,setQuantity]=useState(2),[catalog,setCatalog]=useState<Awaited<ReturnType<typeof executionCreditCatalog>>|null>(null),[busy,setBusy]=useState(false),[order,setOrder]=useState<string|null>(null),[error,setError]=useState(false)
 const [stripe,setStripe]=useState(false)
 useEffect(()=>{stripeCreditReadiness().then(setStripe).catch(()=>{})},[])
 const stripeNavigation=useStripeCheckoutNavigation(language),stripeRevision=useCommercialStatusRevision()
 const retry=useRef<{key:string;request:string}|null>(null)
 useEffect(()=>{let live=true;setCatalog(null);executionCreditCatalog('CRC').then(x=>{if(live)setCatalog(x)}).catch(()=>{if(live)setCatalog({ok:false})});return()=>{live=false}},[currency,stripeRevision])
 const price=catalog?.ok?catalog.prices.find(x=>x.quantity===quantity):null
 async function purchase(provider:'existing'|'stripe'='existing'){if(!price||busy)return;window.location.assign(checkoutPath({kind:'credit',product:price.productId,quantity,provider:provider==='stripe'?'stripe':'sinpe',lang:language,displayCurrency:currency}))}

 return <section className="commercial-grid" aria-label={t('Purchase execution tokens','Comprar tokens de ejecución')}><article><h3>{t('Additional execution tokens','Tokens de ejecución adicionales')}</h3>{stripeNavigation.fallback}<label>{t('Quantity','Cantidad')} <select value={quantity} onChange={e=>{setQuantity(Number(e.target.value));setOrder(null)}}>{[2,5,10,20,50].map(q=><option key={q} value={q}>{q}</option>)}</select></label><label>{t('Currency','Moneda')} <select value={currency} onChange={e=>{setCurrency(e.target.value as 'USD'|'CRC');setOrder(null)}}><option value="CRC">CRC</option><option value="USD">USD</option></select></label>{price&&<><p>{t('Unit price','Precio unitario')}: {currency} {Number(price.currencyQuotes[currency])/price.quantity}</p><div className="addon-pricing"><div className="addon-current">{(es?['CRC','USD']:['USD','CRC']).map(code=><div key={code}>{code}: {new Intl.NumberFormat(es?'es-CR':'en-US',{style:'currency',currency:code,currencyDisplay:'narrowSymbol',maximumFractionDigits:code==='CRC'?0:2}).format(Number(price.currencyQuotes[code as 'USD'|'CRC']))}</div>)}</div></div></>}<button className="commercial-action" data-commercial-theme={commercialTheme(price?.productId??'')} type="button" disabled={!catalog?.ok||!catalog.enabled||!price||busy} aria-busy={busy} onClick={()=>void purchase()}>{t('Pay with SINPE Móvil (CRC)','Pagar con SINPE Móvil (CRC)')}</button>{stripe&&<button className="commercial-action" data-commercial-theme={commercialTheme(price?.productId??'')} type="button" disabled={!price||busy} onClick={()=>void purchase('stripe')}>{t('Pay with Stripe (USD)','Pagar con Stripe (USD)')}</button>}{(!catalog?.ok||!catalog.enabled)&&!stripe&&<p role="status">{t('Token purchases are unavailable pending payment activation. USD is a catalog price; automated SINPE payment requires CRC.','Las compras de tokens no están disponibles hasta activar los pagos. USD es un precio de catálogo; el pago SINPE automatizado requiere CRC.')}</p>}{error&&<p role="alert">{t('Order unavailable. No payment or tokens are confirmed.','Pedido no disponible. No se confirma ningún pago ni token.')}</p>}{order&&<Link href={`/payments/${order}?lang=${language}`}>{t('Continue existing SINPE payment / status','Continuar pago SINPE existente / estado')}</Link>}<p>{t('Purchasing tokens does not grant Package capabilities or Bank access.','Comprar tokens no concede capacidades de paquetes ni acceso bancario.')}</p></article></section>
}
