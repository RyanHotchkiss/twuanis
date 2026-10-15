"use client"
import {useEffect,useState} from 'react'
type Price={available:boolean;currency:string;standardPrice?:string;effectivePrice?:string;source?:string;offerEnd?:string;tiers?:{min:number;max:number;standardRate:string;effectiveRate:string;source:string;offerEnd?:string}[]}
type CatalogProduct={id:string;name_en:string;name_es?:string|null;state:string;termKind:string;durationDays?:number|null;capacity?:number|null;standardPrices:Partial<Record<'USD'|'CRC',string>>;quantityTiers:{min:number;max:number;currency:string;unitRate:string}[]}
type Product={id:string;name_en:string;name_es?:string;termQuantity?:number;termUnit?:string;durationDays?:number;termKind?:string;capacity?:number;pricing:Price}
export default function OfferCatalog({language,onState}:{language:'en'|'es';onState:(active:boolean)=>void}){
 const es=language==='es',t=(en:string,sp:string)=>es?sp:en
 const [kind,setKind]=useState('addon'),[currency,setCurrency]=useState('USD'),[after,setAfter]=useState<string|null>(null),[data,setData]=useState<{state:string;products?:Product[];next?:string|null}|null>(null),[error,setError]=useState(false),[standardOnly,setStandardOnly]=useState(false)
 useEffect(()=>{
  const abort=new AbortController();setData(null);setError(false);onState(true)
  async function read(){
   const response=await fetch(`/api/offer-catalog?kind=${kind}&currency=${currency}${after?'&after='+encodeURIComponent(after):''}`,{signal:abort.signal,cache:'no-store'})
   if(!response.ok)throw Error('unavailable')
   let result=await response.json()
   if(result.state==='inactive'){
    // Offer presentation is independent of the authoritative standard catalog.
    const catalogResponse=await fetch(`/api/addon-catalog${after?'?after='+encodeURIComponent(after):''}`,{signal:abort.signal,cache:'no-store'})
    if(!catalogResponse.ok)throw Error('unavailable')
    const catalog=await catalogResponse.json()
    if(catalog.state==='legacy_compatibility'){if(!abort.signal.aborted){setData({state:'inactive'});onState(false)};return}
    if(catalog.state!=='canonical'||!Array.isArray(catalog.products)||catalog.products.length>25||catalog.checkoutAvailable!==false)throw Error('unavailable')
    result={state:'canonical',next:catalog.next,products:catalog.products.map((p:CatalogProduct)=>{
     const tiers=p.quantityTiers.filter(r=>r.currency===currency).map(r=>({min:r.min,max:r.max,standardRate:r.unitRate,effectiveRate:r.unitRate,source:'STANDARD'}))
     const price=p.standardPrices[currency as 'USD'|'CRC']
     return {id:p.id,name_en:p.name_en,name_es:p.name_es??undefined,termKind:p.termKind,durationDays:p.durationDays??undefined,capacity:p.capacity??undefined,pricing:{available:p.state==='active'&&p.termKind!=='unconfigured'&&(p.termKind==='whole_job'?tiers.length>0:price!==undefined),currency,standardPrice:price,effectivePrice:price,source:'STANDARD',...(p.termKind==='whole_job'?{tiers}:{})}}
    })}
    if(!abort.signal.aborted)setStandardOnly(true)
   }else{
    if(result.state!=='canonical'||!Array.isArray(result.products)||result.products.length>25)throw Error('unavailable')
    if(!abort.signal.aborted)setStandardOnly(false)
   }
   if(!abort.signal.aborted){setData(result);onState(true)}
  }
  read().catch(e=>{if(!abort.signal.aborted&&e.name!=='AbortError'){setError(true);onState(true)}})
  return()=>abort.abort()
 },[kind,currency,after,onState])
 if(data?.state==='inactive')return null
 const end=(value?:string)=>value?<p>{t('Offer through','Oferta hasta')} {new Date(value).toLocaleString(es?'es-CR':'en-US',{timeZone:'America/Costa_Rica'})} (Costa Rica)</p>:null
 return <section aria-label={t('Product pricing','Precios de productos')} style={{margin:'24px 0',padding:20,border:'1px solid var(--border, #666)',borderRadius:12}}>
 <h3>{standardOnly?t('Add-ons','Complementos'):t('Packages & Add-ons','Paquetes y complementos')}</h3><p>{t('Prices only. Checkout, payment and fulfillment are not available. Your existing access is unchanged.','Solo precios. La compra, el pago y la entrega no están disponibles. Su acceso actual no cambia.')}</p>
 {!standardOnly&&<label>{t('Products','Productos')} <select value={kind} onChange={e=>{setKind(e.target.value);setAfter(null)}}><option value="addon">{t('Add-ons','Complementos')}</option><option value="package">{t('Packages','Paquetes')}</option></select></label>}{' '}
 <label>{t('Currency','Moneda')} <select value={currency} onChange={e=>{setCurrency(e.target.value);setAfter(null)}}><option>USD</option><option>CRC</option></select></label>
 {error?<p role="alert">{t('Pricing is unavailable. Reload to try again.','Los precios no están disponibles. Vuelva a cargar para reintentar.')}</p>:!data?<p role="status">{t('Loading prices…','Cargando precios…')}</p>:<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,240px),1fr))',gap:16,marginTop:16}}>{data.products?.map(p=><article key={p.id} style={{padding:16,border:'1px solid var(--border, #666)',borderRadius:8,overflowWrap:'anywhere'}}><h4>{es?(p.name_es??p.name_en):p.name_en}</h4>
 {!p.pricing.available?<p>{t('Unavailable in this currency','No disponible en esta moneda')}</p>:p.pricing.tiers?<>{p.pricing.tiers.map(r=><div key={r.min}><p>{r.min}–{r.max} {t('accepted listings; rate per listing for the whole job','anuncios aceptados; tarifa por anuncio para todo el trabajo')}</p><p>{t('Standard','Estándar')}: {currency} {r.standardRate}</p>{r.source==='OFFER'&&<strong>{t('Offer','Oferta')}: {currency} {r.effectiveRate}</strong>}{end(r.offerEnd)}</div>)}<p>{t('Final total requires server-accepted quantity. Above 500 is unpriced.','El total requiere la cantidad aceptada por el servidor. Más de 500 no tiene precio.')}</p></>:<><p>{t('Standard','Estándar')}: {currency} {p.pricing.standardPrice}</p>{p.pricing.source==='OFFER'&&<strong>{t('Offer','Oferta')}: {currency} {p.pricing.effectivePrice}</strong>}{end(p.pricing.offerEnd)}</>}
 {p.durationDays&&<p>{p.durationDays} {t('days','días')}</p>}{p.termQuantity&&<p>{p.termQuantity} {t('month(s)','mes(es)')}</p>}{p.termKind==='lifetime'&&<p>{t('Lifetime pricing right','Derecho de precios de por vida')}</p>}{p.capacity&&<p>{t('Global capacity','Capacidad global')}: {p.capacity}</p>}<p>{t('Acquisition unavailable','Adquisición no disponible')}</p></article>)}</div>}
 {after&&<button onClick={()=>setAfter(null)}>{t('First page','Primera página')}</button>}{data?.next&&<button onClick={()=>setAfter(data.next!)}>{t('Next','Siguiente')}</button>}
 </section>
}
