'use client'
import {useEffect,useRef,useState,type ReactNode} from 'react'
import type {commercialCatalog} from '@/app/commercial/actions'
import {promotionalDeadline} from '@/lib/promotional-deadline'
import PackageEngineExample from './PackageEngineExample'
import './package-questions.css'
import PackagePaymentButtons,{PackagePaymentHeading,PackagePaymentMethodHeading} from './PackagePaymentButtons'
import copy from './entertainment-copy.json'
import PackageMeasurement from './measurement/PackageMeasurement'
import './EntertainmentPackageCard.css'
import './commercial-actions.css'
type Product=Extract<Awaited<ReturnType<typeof commercialCatalog>>,{ok:true}>['products'][number]
type Language='en'|'es'
export const ENTERTAINMENT_ID='pkg-geographic-distribution-price-range'
// Display arithmetic combines only the amounts already resolved by the canonical
// catalog. No exchange-rate calculation, offer clock, quote or Order is created.
export function selectedEntertainmentPrice(quote:{standardPrice?:string|number;effectivePrice?:string|number;bankUpgradePrice?:{amount?:string|number}|null}|undefined,bank:boolean){
 const base=Number(quote?.effectivePrice??quote?.standardPrice),standard=Number(quote?.standardPrice),upgrade=bank?Number(quote?.bankUpgradePrice?.amount):0
 if(![base,standard,upgrade].every(v=>Number.isFinite(v)&&v>=0))return null
 return {total:base+upgrade,standard:standard+upgrade}
}
export default function EntertainmentPackageCard({instanceId="",showStripeOption=false,inListingCheckout=false,product:p,language,currency,bankSelected,onBankChange,onPurchase,busy,sinpeAvailable,stripeAvailable}:{instanceId?:string;showStripeOption?:boolean;inListingCheckout?:boolean;product:Product;language:Language;currency:'USD'|'CRC';bankSelected:boolean;onBankChange:(v:boolean)=>void;onPurchase:(provider:'existing'|'stripe')=>void;busy:boolean;sinpeAvailable:boolean;stripeAvailable:boolean}){
 const es=language==='es',t=(en:string,sp:string)=>es?sp:en
 const [open,setOpen]=useState(false),dialog=useRef<HTMLDialogElement>(null),opener=useRef<HTMLButtonElement>(null)
 useEffect(()=>{if(!open)return;const d=dialog.current;if(!d)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';d.showModal();return()=>{d.close();document.body.style.overflow=previous;opener.current?.focus()}},[open])
 const quote=p.pricing,amount=selectedEntertainmentPrice(quote,bankSelected),usd=selectedEntertainmentPrice(currency==='USD'?quote:p.secondaryPricing,bankSelected)
 const dates=quote?.offerEnd?promotionalDeadline(quote.offerEnd,language):null
 const format=(n:number)=>new Intl.NumberFormat(es?'es-CR':'en-US',{style:'currency',currency,currencyDisplay:'narrowSymbol',minimumFractionDigits:0,maximumFractionDigits:2}).format(n)
 const intro=copy.filter(b=>b.part==='intro'),overlay=copy.filter(b=>b.part==='overlay')
 return <article className="intelligence-package entertainment-card" data-package-number="1">
  <PackageMeasurement locale={language} id={p.id} market={bankSelected?'COMBINED':'PRIVATE'} duration="monthly"/>
  <h3 className="package-title">{intro[0][language]}</h3>
  <section className="package-questions" data-package-questions="entertainment"><h4>{t('Questions the Entertainment Package Answers','Preguntas que responde el Paquete de Entretenimiento')}</h4><ol>
   <li>{t('How are asking prices distributed across a defined Costa Rican real-estate market?','¿Cómo se distribuyen los precios de oferta en un mercado inmobiliario definido de Costa Rica?')}</li>
   <li>{t('What property characteristics compose that market?','¿Qué características de las propiedades componen ese mercado?')}</li>
   <li>{t('How many eligible property listings are represented in that market?','¿Cuántos anuncios de propiedades elegibles están representados en ese mercado?')}</li>
  </ol></section>
  <div className="entertainment-introduction">{intro.slice(1).map(b=><p key={b.id}>{emphasize(b[language],b.emphasis)}</p>)}</div>
  <button ref={opener} type="button" className="commercial-action" data-commercial-theme="blue" aria-haspopup="dialog" aria-controls={instanceId+"entertainment-specifics"} onClick={()=>setOpen(true)}>{t('Package Algorithms Specifics','Detalles de los algoritmos del Paquete')}</button>
  <section className="package-section"><h4>{t('Included algorithms','Algoritmos incluidos')}</h4><ul>{p.capabilities.map((c:{id:string;en:string;es:string})=><li key={c.id}><PackageEngineExample capability={c.id} name={c[language]} language={language}/></li>)}</ul></section>
  <section className="package-section package-pricing entertainment-pricing" aria-label={t('Selected monthly coverage and price','Cobertura mensual seleccionada y precio')}>
   {quote?.bankUpgradePrice?.amount!=null&&<div className="entertainment-bank"><h4>{t('Bank Properties & Foreclosures','Propiedades bancarias y remates')}</h4><label><input type="checkbox" checked={bankSelected} disabled={busy} onChange={e=>onBankChange(e.target.checked)}/>{t('Include Bank Properties & Foreclosures','Incluir propiedades bancarias y remates')}</label><p>{t('Optional monthly access to eligible Bank Properties & Foreclosures using the same included Package capabilities.','Acceso mensual opcional a propiedades bancarias y remates elegibles con las mismas capacidades incluidas del Paquete.')}</p></div>}
   <div className="commercial-currency-pair entertainment-single-price" aria-live="polite" aria-atomic="true">
    <p>{bankSelected?t('Private + Bank/Foreclosure coverage selected','Cobertura privada + bancos/remates seleccionada'):t('Private-only coverage selected','Solo cobertura de propiedades privadas seleccionada')}</p>
    <PackagePaymentHeading quotes={p.paymentPricing} duration={'month'} bank={bankSelected} language={language}/>
    {quote?.founderProtected&&<p>{t('Founding Member protected price','Precio protegido de fundador')}</p>}
    {dates&&<p className="package-offer-end">{dates.offerEnds}<br/>{dates.standardStarts}</p>}
    <p>{t('Duration','Duración')}: {p.termQuantity} {p.termQuantity===1?t('calendar month','mes calendario'):t('calendar months','meses calendario')}</p>
   </div>
  </section>
  <section className="package-section package-acquisition"><PackagePaymentMethodHeading language={language}/>
   <PackagePaymentButtons quotes={p.paymentPricing} duration={'month'} bank={bankSelected} language={language} theme="blue" busy={busy} sinpeAvailable={sinpeAvailable} stripeAvailable={stripeAvailable} onPurchase={onPurchase}/>
  </section>
  <dialog ref={dialog} id={instanceId+"entertainment-specifics"} className="entertainment-dialog" aria-labelledby={instanceId+"entertainment-dialog-title"} onCancel={()=>setOpen(false)} onClose={()=>setOpen(false)} onClick={e=>{if(e.target===dialog.current){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)setOpen(false)}}}>
   <header><h2 id={instanceId+"entertainment-dialog-title"}>{t('Package Algorithms Specifics','Detalles de los algoritmos del Paquete')}</h2><button type="button" autoFocus className="commercial-action commercial-secondary" onClick={()=>setOpen(false)} aria-label={t('Close algorithm specifics','Cerrar detalles de los algoritmos')}>{t('Close','Cerrar')}</button></header>
   {open&&<div className="entertainment-specifics-content">{overlay.map(b=>b.kind==='heading'?<h3 key={b.id}>{b[language]}</h3>:b.kind==='subheading'?<h4 key={b.id}>{b[language]}</h4>:b.kind==='formula'?<p key={b.id} className="entertainment-formula" role="math">{b[language]}</p>:b.kind==='item'?<p key={b.id} className="entertainment-list-item">• {emphasize(b[language],b.emphasis)}</p>:<p key={b.id}>{emphasize(b[language],b.emphasis)}</p>)}</div>}
  </dialog>
 </article>
}
function emphasize(text:string,emphasis:string):ReactNode{return emphasis==='bold'?<strong>{text}</strong>:emphasis==='italic'?<em>{text}</em>:text}
