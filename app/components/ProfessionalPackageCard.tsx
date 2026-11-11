'use client'
import {useEffect,useRef,useState,type ReactNode} from 'react'
import type {commercialCatalog} from '@/app/commercial/actions'
import {promotionalDeadline} from '@/lib/promotional-deadline'
import PackageEngineExample from './PackageEngineExample'
import './package-questions.css'
import PackagePaymentButtons,{PackagePaymentHeading,PackagePaymentMethodHeading} from './PackagePaymentButtons'
import copy from './professional-copy.json'
import './ProfessionalPackageCard.css'
import PackageMeasurement from './measurement/PackageMeasurement'
import './EntertainmentPackageCard.css'
import './commercial-actions.css'
type Product=Extract<Awaited<ReturnType<typeof commercialCatalog>>,{ok:true}>['products'][number]
type Language='en'|'es'
export const PROFESSIONAL_ID='pkg-matching-market-comparison'
// Display arithmetic combines only the amounts already resolved by the canonical
// catalog. No exchange-rate calculation, offer clock, quote or Order is created.
export function selectedEntertainmentPrice(quote:{standardPrice?:string|number;effectivePrice?:string|number;bankUpgradePrice?:{amount?:string|number}|null}|undefined,bank:boolean){
 const base=Number(quote?.effectivePrice??quote?.standardPrice),standard=Number(quote?.standardPrice),upgrade=bank?Number(quote?.bankUpgradePrice?.amount):0
 if(![base,standard,upgrade].every(v=>Number.isFinite(v)&&v>=0))return null
 return {total:base+upgrade,standard:standard+upgrade}
}
export default function ProfessionalPackageCard({instanceId="",showStripeOption=false,inListingCheckout=false,product:p,language,currency,bankSelected,onBankChange,onPurchase,busy,sinpeAvailable,stripeAvailable,duration,onDurationChange}:{duration:'day'|'month';onDurationChange:(v:'day'|'month')=>void;instanceId?:string;showStripeOption?:boolean;inListingCheckout?:boolean;product:Product;language:Language;currency:'USD'|'CRC';bankSelected:boolean;onBankChange:(v:boolean)=>void;onPurchase:(provider:'existing'|'stripe')=>void;busy:boolean;sinpeAvailable:boolean;stripeAvailable:boolean}){
 const es=language==='es',t=(en:string,sp:string)=>es?sp:en
 const [open,setOpen]=useState(false),dialog=useRef<HTMLDialogElement>(null),opener=useRef<HTMLButtonElement>(null)
 useEffect(()=>{if(!open)return;const d=dialog.current;if(!d)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';d.showModal();return()=>{d.close();document.body.style.overflow=previous;opener.current?.focus()}},[open])
 const monthly=duration==='month',selectedBank=monthly&&bankSelected
 const quote=monthly?p.pricing:{...p.pricing,source:'STANDARD',founderProtected:false,standardPrice:p.dailyPrice,effectivePrice:p.dailyPrice,offerEnd:undefined},secondary=monthly?p.secondaryPricing:{...p.secondaryPricing,standardPrice:p.secondaryDailyPrice,effectivePrice:p.secondaryDailyPrice}
 const amount=selectedEntertainmentPrice(quote,selectedBank),usd=selectedEntertainmentPrice(currency==='USD'?quote:secondary,selectedBank)
 const dates=quote?.offerEnd?promotionalDeadline(quote.offerEnd,language):null
 const format=(n:number)=>new Intl.NumberFormat(es?'es-CR':'en-US',{style:'currency',currency,currencyDisplay:'narrowSymbol',minimumFractionDigits:0,maximumFractionDigits:2}).format(n)
 const intro=copy.filter(b=>b.part==='intro'),overlay=copy.filter(b=>b.part==='overlay')
 return <article className="intelligence-package entertainment-card professional-card" data-package-number="2">
  <PackageMeasurement locale={language} id={p.id} market={selectedBank?'COMBINED':'PRIVATE'} duration={monthly?'monthly':'daily'}/>
  <h3 className="package-title">{intro[0][language]}</h3>
  <section className="package-questions" data-package-questions="professional"><h4>{t('Additional Questions the Professional Package Answers','Preguntas adicionales que responde el Paquete Profesional')}</h4><ol>
   <li>{t("Where does each eligible listing sit within the defined market's Price / m² distribution?",'¿Dónde se sitúa cada anuncio elegible dentro de la distribución del precio / m² del mercado definido?')}</li>
   <li>{t('How does Price / m² differ across geographic areas in the defined Costa Rican real-estate market?','¿Cómo difiere el precio / m² entre áreas geográficas del mercado inmobiliario definido de Costa Rica?')}</li>
   <li>{t('How do two explicitly defined Costa Rican real-estate markets differ?','¿En qué difieren dos mercados inmobiliarios de Costa Rica definidos explícitamente?')}</li>
   <li>{t('Which eligible listings most closely match selected property attributes?','¿Qué anuncios elegibles coinciden más con los atributos de propiedad seleccionados?')}</li>
  </ol></section>
  <div className="entertainment-introduction">{intro.slice(1).map(b=><p key={b.id}>{emphasize(b[language],b.emphasis)}</p>)}</div>
  <button ref={opener} type="button" className="commercial-action" data-commercial-theme="professional" aria-haspopup="dialog" aria-controls={instanceId+"professional-specifics"} onClick={()=>setOpen(true)}>{t('Package Algorithms Specifics','Detalles de los algoritmos del Paquete')}</button>
  <section className="package-section"><h4>{t('Included algorithms','Algoritmos incluidos')}</h4><ul>{p.allCapabilities.map((c:{id:string;en:string;es:string})=><li key={c.id}><PackageEngineExample capability={c.id} name={c[language]} language={language}/></li>)}</ul></section>
  <section className="package-section package-pricing entertainment-pricing" aria-label={t('Selected monthly coverage and price','Cobertura mensual seleccionada y precio')}>
   <div className="professional-duration">{(['month','day'] as const).filter(v=>v==='month'||p.dailyPrice!=null).map(v=><button key={v} type="button" className="commercial-action commercial-secondary" data-commercial-theme="professional" aria-pressed={duration===v} disabled={busy} onClick={()=>onDurationChange(v)}>{v==='month'?t('Monthly access','Acceso mensual'):t('24-hour access','Acceso por 24 horas')}</button>)}</div>
   {p.pricing?.bankUpgradePrice?.amount!=null&&<div className="entertainment-bank"><h4>{t('Bank Properties & Foreclosures','Propiedades bancarias y remates')}</h4><label><input type="checkbox" checked={selectedBank} disabled={busy||!monthly} onChange={e=>onBankChange(e.target.checked)}/>{t('Include Bank Properties & Foreclosures','Incluir propiedades bancarias y remates')}</label><p>{t('Optional monthly access to eligible Bank Properties & Foreclosures using the same included Package capabilities.','Acceso mensual opcional a propiedades bancarias y remates elegibles con las mismas capacidades incluidas del Paquete.')}</p></div>}
   <div className="commercial-currency-pair entertainment-single-price" aria-live="polite" aria-atomic="true">
    <p>{selectedBank?t('Private + Bank/Foreclosure coverage selected','Cobertura privada + bancos/remates seleccionada'):t('Private-only coverage selected','Solo cobertura de propiedades privadas seleccionada')}</p>
    <PackagePaymentHeading quotes={p.paymentPricing} duration={duration} bank={selectedBank} language={language}/>
    {quote?.founderProtected&&<p>{t('Founding Member protected price','Precio protegido de fundador')}</p>}
    {dates&&<p className="package-offer-end">{dates.offerEnds}<br/>{dates.standardStarts}</p>}
    <p>{t('Duration','Duración')}: {monthly?<>{p.termQuantity} {p.termQuantity===1?t('calendar month','mes calendario'):t('calendar months','meses calendario')}</>:t('24 consecutive elapsed hours','24 horas consecutivas transcurridas')}</p>
   </div>
  </section>
  <section className="package-section package-acquisition"><PackagePaymentMethodHeading language={language}/>
   <PackagePaymentButtons quotes={p.paymentPricing} duration={duration} bank={selectedBank} language={language} theme="professional" busy={busy} sinpeAvailable={sinpeAvailable} stripeAvailable={stripeAvailable} onPurchase={onPurchase}/>
  </section>
  <dialog ref={dialog} id={instanceId+"professional-specifics"} className="entertainment-dialog" aria-labelledby={instanceId+"professional-dialog-title"} onCancel={()=>setOpen(false)} onClose={()=>setOpen(false)} onClick={e=>{if(e.target===dialog.current){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)setOpen(false)}}}>
   <header><h2 id={instanceId+"professional-dialog-title"}>{t('Package Algorithms Specifics','Detalles de los algoritmos del Paquete')}</h2><button type="button" autoFocus className="commercial-action commercial-secondary" onClick={()=>setOpen(false)} aria-label={t('Close algorithm specifics','Cerrar detalles de los algoritmos')}>{t('Close','Cerrar')}</button></header>
   {open&&<div className="entertainment-specifics-content">{overlay.map(b=>b.kind==='heading'?<h3 key={b.id}>{b[language]}</h3>:b.kind==='subheading'?<h4 key={b.id}>{b[language]}</h4>:b.kind==='formula'?<p key={b.id} className="entertainment-formula" role="math">{b[language]}</p>:b.kind==='item'?<p key={b.id} className="entertainment-list-item">• {emphasize(b[language],b.emphasis)}</p>:<p key={b.id}>{emphasize(b[language],b.emphasis)}</p>)}</div>}
  </dialog>
 </article>
}
function emphasize(text:string,emphasis:string):ReactNode{return emphasis==='bold'?<strong>{text}</strong>:emphasis==='italic'?<em>{text}</em>:text}
