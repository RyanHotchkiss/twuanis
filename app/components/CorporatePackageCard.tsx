'use client'
import {useEffect,useRef,useState,type ReactNode} from 'react'
import type {commercialCatalog} from '@/app/commercial/actions'
import {promotionalDeadline} from '@/lib/promotional-deadline'
import PackageEngineExample from './PackageEngineExample'
import './package-questions.css'
import PackagePaymentButtons,{PackagePaymentHeading,PackagePaymentMethodHeading} from './PackagePaymentButtons'
import copy from './corporate-copy.json'
import './CorporatePackageCard.css'
import './CorporatePackageCard.css'
import PackageMeasurement from './measurement/PackageMeasurement'
import './EntertainmentPackageCard.css'
import './commercial-actions.css'
type Product=Extract<Awaited<ReturnType<typeof commercialCatalog>>,{ok:true}>['products'][number]
type Language='en'|'es'
export const CORPORATE_ID='pkg-pricing-position-relationships'
// Display arithmetic combines only the amounts already resolved by the canonical
// catalog. No exchange-rate calculation, offer clock, quote or Order is created.
export function selectedEntertainmentPrice(quote:{standardPrice?:string|number;effectivePrice?:string|number;bankUpgradePrice?:{amount?:string|number}|null}|undefined,bank:boolean){
 const base=Number(quote?.effectivePrice??quote?.standardPrice),standard=Number(quote?.standardPrice),upgrade=bank?Number(quote?.bankUpgradePrice?.amount):0
 if(![base,standard,upgrade].every(v=>Number.isFinite(v)&&v>=0))return null
 return {total:base+upgrade,standard:standard+upgrade}
}
export default function CorporatePackageCard({instanceId="",showStripeOption=false,inListingCheckout=false,product:p,language,currency,bankSelected,onBankChange,onPurchase,busy,sinpeAvailable,stripeAvailable,duration,onDurationChange}:{duration:'day'|'month';onDurationChange:(v:'day'|'month')=>void;instanceId?:string;showStripeOption?:boolean;inListingCheckout?:boolean;product:Product;language:Language;currency:'USD'|'CRC';bankSelected:boolean;onBankChange:(v:boolean)=>void;onPurchase:(provider:'existing'|'stripe')=>void;busy:boolean;sinpeAvailable:boolean;stripeAvailable:boolean}){
 const es=language==='es',t=(en:string,sp:string)=>es?sp:en
 const [open,setOpen]=useState(false),dialog=useRef<HTMLDialogElement>(null),opener=useRef<HTMLButtonElement>(null)
 useEffect(()=>{if(!open)return;const d=dialog.current;if(!d)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';d.showModal();return()=>{d.close();document.body.style.overflow=previous;opener.current?.focus()}},[open])
 const monthly=duration==='month',selectedBank=monthly&&bankSelected
 const quote=monthly?p.pricing:{...p.pricing,source:'STANDARD',founderProtected:false,standardPrice:p.dailyPrice,effectivePrice:p.dailyPrice,offerEnd:undefined},secondary=monthly?p.secondaryPricing:{...p.secondaryPricing,standardPrice:p.secondaryDailyPrice,effectivePrice:p.secondaryDailyPrice}
 const amount=selectedEntertainmentPrice(quote,selectedBank),usd=selectedEntertainmentPrice(currency==='USD'?quote:secondary,selectedBank)
 const dates=quote?.offerEnd?promotionalDeadline(quote.offerEnd,language):null
 const format=(n:number)=>new Intl.NumberFormat(es?'es-CR':'en-US',{style:'currency',currency,currencyDisplay:'narrowSymbol',minimumFractionDigits:0,maximumFractionDigits:2}).format(n)
 const intro=copy.filter(b=>b.part==='intro'),overlay=copy.filter(b=>b.part==='overlay')
 return <article className="intelligence-package entertainment-card corporate-card" data-package-number="3">
  <PackageMeasurement locale={language} id={p.id} market={selectedBank?'COMBINED':'PRIVATE'} duration={monthly?'monthly':'daily'}/>
  <h3 className="package-title">{intro[0][language]}</h3>
  <section className="package-questions" data-package-questions="corporate"><h4>{t('Additional Questions the Corporate Package Answers','Preguntas adicionales que responde el Paquete Corporativo')}</h4><ol>
   <li>{t('What is the modeled asking-price relationship per square meter of Construction Area divided by the modeled asking-price relationship per square meter of Property Area?','¿Cuál es la relación modelada del precio de oferta por metro cuadrado del Área de Construcción dividida por la relación modelada del precio de oferta por metro cuadrado del Área de la Propiedad?')}</li>
   <li>{t('How does Price / m² vary with the Construction-to-Land ratio in the defined Costa Rican real-estate market?','¿Cómo varía el precio / m² con la relación Construcción/Terreno en el mercado inmobiliario definido de Costa Rica?')}</li>
   <li>{t('Does the selected Price / m² relationship persist, vary, or reverse across the selected secondary dimension?','¿La relación seleccionada del precio / m² persiste, varía o se invierte a lo largo de la dimensión secundaria seleccionada?')}</li>
   <li>{t('How is Price / m² distributed across the defined Costa Rican real-estate market?','¿Cómo se distribuye el precio / m² en el mercado inmobiliario definido de Costa Rica?')}</li>
   <li>{t('How many listings in the defined Costa Rican real-estate market positively establish the selected property configuration?','¿Cuántos anuncios del mercado inmobiliario definido de Costa Rica acreditan positivamente la configuración de propiedad seleccionada?')}</li>
   <li>{t("Where does this property's asking Price / m² sit within its defined reference population?",'¿Dónde se sitúa el precio de oferta / m² de esta propiedad dentro de su población de referencia definida?')}</li>
   <li>{t('How does Price / m² vary with size in the defined Costa Rican real-estate market?','¿Cómo varía el precio / m² con el tamaño en el mercado inmobiliario definido de Costa Rica?')}</li>
   <li>{t('How does median Price / m² differ between two user-defined property cohorts?','¿Cómo difiere la mediana del precio / m² entre dos cohortes de propiedades definidas por el usuario?')}</li>
   <li>{t("How does this property's asking Price / m² compare with the cohort matching its compulsory boundaries and selected canonical characteristics?",'¿Cómo se compara el precio de oferta / m² de esta propiedad con el de la cohorte que coincide con sus límites obligatorios y las características canónicas seleccionadas?')}</li>
   <li>{t("What is this property's Price / m² when Property Area and Construction Area are weighted by their modeled asking-price relationships in the selected market?",'¿Cuál es el precio / m² de esta propiedad cuando el Área de la Propiedad y el Área de Construcción se ponderan según sus relaciones modeladas con el precio de oferta en el mercado seleccionado?')}<p data-weighted-question-disclaimer style={{marginTop:'1rem'}}>{copy.find(b=>b.id==='corporate-328')![language]}</p></li>
  </ol></section>
  <div className="entertainment-introduction">{intro.slice(1).map(b=><p key={b.id}>{emphasize(b[language],b.emphasis)}</p>)}</div>
  <button ref={opener} type="button" className="commercial-action" data-commercial-theme="gold" aria-haspopup="dialog" aria-controls={instanceId+"corporate-specifics"} onClick={()=>setOpen(true)}>{t('Package Algorithms Specifics','Detalles de los algoritmos del Paquete')}</button>
  <section className="package-section"><h4>{t('Included algorithms','Algoritmos incluidos')}</h4><ul>{p.allCapabilities.map((c:{id:string;en:string;es:string})=><li key={c.id}><PackageEngineExample capability={c.id} name={c[language]} language={language}/></li>)}</ul></section>
  <section className="package-section package-pricing entertainment-pricing" aria-label={t('Selected monthly coverage and price','Cobertura mensual seleccionada y precio')}>
   <div className="professional-duration">{(['month','day'] as const).filter(v=>v==='month'||p.dailyPrice!=null).map(v=><button key={v} type="button" className="commercial-action commercial-secondary" data-commercial-theme="gold" aria-pressed={duration===v} disabled={busy} onClick={()=>onDurationChange(v)}>{v==='month'?t('Monthly access','Acceso mensual'):t('24-hour access','Acceso por 24 horas')}</button>)}</div>
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
   <PackagePaymentButtons quotes={p.paymentPricing} duration={duration} bank={selectedBank} language={language} theme="gold" busy={busy} sinpeAvailable={sinpeAvailable} stripeAvailable={stripeAvailable} onPurchase={onPurchase}/>
  </section>
  <dialog ref={dialog} id={instanceId+"corporate-specifics"} className="entertainment-dialog" aria-labelledby={instanceId+"corporate-dialog-title"} onCancel={()=>setOpen(false)} onClose={()=>setOpen(false)} onClick={e=>{if(e.target===dialog.current){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)setOpen(false)}}}>
   <header><h2 id={instanceId+"corporate-dialog-title"}>{t('Package Algorithms Specifics','Detalles de los algoritmos del Paquete')}</h2><button type="button" autoFocus className="commercial-action commercial-secondary" onClick={()=>setOpen(false)} aria-label={t('Close algorithm specifics','Cerrar detalles de los algoritmos')}>{t('Close','Cerrar')}</button></header>
   {open&&<div className="entertainment-specifics-content">{overlay.map(b=>b.kind==='heading'?<h3 key={b.id}>{b[language]}</h3>:b.kind==='subheading'?<h4 key={b.id}>{b[language]}</h4>:b.kind==='disclaimer'?<p key={b.id} className="corporate-weighted-disclaimer">{b[language]}</p>:b.kind==='formula'?<p key={b.id} className="entertainment-formula" role="math">{b[language]}</p>:b.kind==='item'?<p key={b.id} className="entertainment-list-item">• {emphasize(b[language],b.emphasis)}</p>:<p key={b.id}>{emphasize(b[language],b.emphasis)}</p>)}</div>}
  </dialog>
 </article>
}
function emphasize(text:string,emphasis:string):ReactNode{return emphasis==='bold'?<strong>{text}</strong>:emphasis==='italic'?<em>{text}</em>:text}
