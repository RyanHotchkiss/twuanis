"use client"
import AlgorithmRunButton from './AlgorithmRunButton'
import {measuredListingLens as runListingLens} from '@/lib/measurement/actions'
import {serverSignal} from '@/lib/measurement/runtime'
import {useEffect,useRef,useState} from 'react'
import {supabase} from '@/lib/supabase'
import {LPI_LENSES,draftSnapshot,contextKey,createRunController,type Context,type Lang,type Lens} from '@/lib/lpi-contract'
import {validateListingLensReuse} from '@/lib/lpi-action'
import {createPurchaseIntent} from '@/lib/lpi-purchase-contract'
import {verifyListingPurchase} from '@/app/checkout/overlay-actions'
import type {CheckoutSelection} from '@/lib/checkout-selection'
import type {Request} from '@/lib/lpi-contract'
import ListingPackageCard from './ListingPackageCard'
import ListingCheckoutOverlay from './ListingCheckoutOverlay'
import AnalysisActions from './AnalysisActions'
import InlineHubExample from './engine-examples/InlineHubExample'
import CanonicalMarketIdentity from './CanonicalMarketIdentity'
import sharedPresentation from './market-summary/workspace.module.css'
import askingPresentation from './AskingPriceDistribution.module.css'
import {AskingPriceResult} from './AskingPriceResult'
import PropertyMatchingResult from './property-matching/PropertyMatchingResult'
import ConfigurationFrequencyResult from './configuration-frequency/ConfigurationFrequencyResult'
import PositionResult from './price-meter-position/PositionResult'
import styles from './ListingIntelligencePanel.module.css'
type Reply=Awaited<ReturnType<typeof runListingLens>>
// No effect invokes an executor, configuration endpoint or population reader.
export default function ListingIntelligencePanel({context,language}:{context:Context;language:Lang}){
 const es=language==='es',key=contextKey(context)+':'+language,heading=useRef<HTMLHeadingElement>(null)
 const controller=useRef(createRunController<Reply>()),current=useRef(key);current.current=key
 const [results,setResults]=useState<Partial<Record<Lens,{key:string;reply:Reply}>>>({})
 const intent=useRef(createPurchaseIntent()),pending=useRef<{request:Request;key:string}|null>(null)
 const [checkout,setCheckout]=useState<{selection:CheckoutSelection;lens:Lens;updateSelection:(selection:CheckoutSelection)=>void}|null>(null)
 const [requiresRun,setRequiresRun]=useState<Partial<Record<Lens,boolean>>>({})
 function discard(){const lens=pending.current?.request.lens;if(lens)setRequiresRun(r=>({...r,[lens]:true}));intent.current.discard();pending.current=null;setCheckout(null)}
 const [busy,setBusy]=useState<Partial<Record<Lens,boolean>>>({})
 useEffect(()=>{discard();controller.current.invalidate();setResults({});setBusy({});setRequiresRun({})},[key,language])
 useEffect(()=>{return()=>{intent.current.discard();pending.current=null;controller.current.invalidate()}},[])
 const delivered=useRef(results);delivered.current=results
 useEffect(()=>{let live=true,checking=false;const revalidate=async()=>{if(document.visibilityState==='hidden'||checking)return;checking=true;try{for(const [id,entry] of Object.entries(delivered.current)){if(entry?.reply.state!=='result'||entry.key!==current.current)continue;const reply=entry.reply;const valid=await validateListingLensReuse({lens:id as Lens,context,language},reply.question.revision,reply.account,reply.analyticalDate);if(live&&!valid)setResults(r=>r[id as Lens]===entry?{...r,[id]:undefined}:r)}}finally{checking=false}};document.addEventListener('visibilitychange',revalidate);window.addEventListener('focus',revalidate);return()=>{live=false;document.removeEventListener('visibilitychange',revalidate);window.removeEventListener('focus',revalidate)}},[key])
 const lastAccount=useRef<string|null|undefined>(undefined)
 useEffect(()=>{const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{const id=session?.user.id??null;if(lastAccount.current!==undefined&&lastAccount.current!==id){controller.current.invalidate();setResults(r=>Object.fromEntries(Object.entries(r).filter(([,v])=>v?.reply.state!=='result')));setBusy({});if(lastAccount.current!==null||!id)discard();else intent.current.bind(id)}lastAccount.current=id});return()=>subscription.unsubscribe()},[])
 const lenses=LPI_LENSES.filter(l=>context.kind==='published'||l.id!=='position')
 async function run(lens:Lens,resume?:Request){
  if(!resume){discard();setRequiresRun(r=>({...r,[lens]:false}))}
  const selectedKey=key;const request:Request=resume??{lens,context:context.kind==='draft'?{...context,draft:draftSnapshot(context.draft)}:context,language};setBusy(b=>({...b,[lens]:true}))
  try{await controller.current.run(`${key}:${lens}`,async()=>{const prior=results[lens]?.key===key?results[lens]?.reply:undefined;if(!resume&&prior?.state==='result'&&await validateListingLensReuse(request,prior.question.revision,prior.account,prior.analyticalDate))return prior;return runListingLens(request,serverSignal(request.language))},reply=>{if(current.current===selectedKey){if(reply.state==='access_required'&&!resume){pending.current={request,key:selectedKey};intent.current.hold(lens,selectedKey,lastAccount.current??null)}setResults(r=>({...r,[lens]:{key:selectedKey,reply}}))}})}
  catch{if(current.current===selectedKey)setResults(r=>({...r,[lens]:{key:selectedKey,reply:{state:'error'}}}))}
  finally{if(current.current===selectedKey)setBusy(b=>({...b,[lens]:false}))}
 }
 async function paid(order:string,account:string){const original=pending.current;if(!original||original.key!==current.current)return false;if(!await verifyListingPurchase(order,original.request,account))return false;const lens=await intent.current.consume(original.key,account,()=>verifyListingPurchase(order,original.request,account));if(!lens||pending.current!==original||current.current!==original.key)return false;pending.current=null;setCheckout(null);await run(lens,original.request);return true}
 const d=context.kind==='draft'?context.draft:null
 const proposed=d?(context.transaction==='sale'?Number(d.priceMillions)*1000000:Number(d.monthly_price)):null
 return <section className={styles.panel} aria-label={es?'Inteligencia de la propiedad':'Property intelligence'}>
 <h2>{es?'Inteligencia de la propiedad':'Property intelligence'}</h2>
 <p>{es?'Cada algoritmo analiza una pregunta fija: distrito, tipo de propiedad y transacción. Ejecutar es opcional; publicar sigue siendo gratis.':'Each algorithm analyzes a fixed district, property type and transaction question. Execution is optional; publishing remains free.'}</p>
 {lenses.map(l=>{
 const reply=results[l.id]?.key===key?results[l.id]?.reply:undefined
 return <section className={styles.lens} key={l.id} data-lpi-lens={l.id}>
 <h3>{l[language]}</h3>
 {!reply&&<InlineHubExample lens={l.id} language={language}/>}
 {reply?.state==='result'&&<div data-lpi-live-result className={reply.result.kind==='asking'?askingPresentation.engine:sharedPresentation.summary}>
  {(reply.result.kind==='matching'||reply.result.kind==='frequency')&&<><CanonicalMarketIdentity committed={{filters:reply.question.filters,labels:reply.result.labels}} engine={reply.result.kind==='frequency'?'configuration':'matching'} options={reply.result.options} language={language}/>{reply.question.unsupported.length>0&&<p>{es?'Evidencia exacta/de intervalo no incluida en esta pregunta categórica':'Exact/range evidence not included in this categorical question'}: {reply.question.unsupported.join(' · ')}</p>}</>}
  {reply.result.kind==='asking'&&(reply.result.value.ok?<>
   <AskingPriceResult result={reply.result.value.result} lang={language}/>
   <PriceMarker value={d?proposed:reply.question.amount} currency={d?String(d.currency??'CRC'):reply.question.currency??''} result={reply.result.value.result} language={language} draft={Boolean(d)}/>
  </>:<p role="status">{es?'Resultado no definido para esta pregunta.':'No defined result for this question.'}</p>)}
  {reply.result.kind==='matching'&&<PropertyMatchingResult committed={{filters:reply.question.filters,labels:reply.result.labels,result:reply.result.value}} heading={heading} id={`lpi-${l.id}`} language={language} options={reply.result.options}/>}
  {reply.result.kind==='frequency'&&<ConfigurationFrequencyResult committed={{filters:reply.question.filters,labels:reply.result.labels,result:reply.result.value}} heading={heading} id={`lpi-${l.id}`} language={language} options={reply.result.options}/>}
  {reply.result.kind==='position'&&<><PositionResult committed={{request:reply.result.request,response:{result:reply.result.value,fx:reply.result.fx}}} language={language} heading={heading} part="result" actions={<AnalysisActions engineType="price-meter" language={language} filters={{analysis_question:'position',position_request:JSON.stringify(reply.result.request)}} result={{result:reply.result.value,fx:reply.result.fx}} defaultName={l[language]}/>} /><PositionResult committed={{request:reply.result.request,response:{result:reply.result.value,fx:reply.result.fx}}} language={language} heading={heading} part="method"/></>}
 {(reply.result.kind==='matching'||reply.result.kind==='frequency')&&<AnalysisActions engineType={reply.result.kind==='matching'?'matching':'scarcity'} language={language} filters={{...reply.question.filters,analysis_question:reply.result.kind==='matching'?'matching':'configuration'}} result={reply.result.value} defaultName={l[language]}/>}
 </div>}
 {reply?.state==='access_required'&&<ListingPackageCard lens={l.id} language={language} onPurchase={(selection,account,updateSelection)=>{if(pending.current?.key!==key||pending.current.request.lens!==l.id){setRequiresRun(r=>({...r,[l.id]:true}));return;} if(account&&!intent.current.bind(account))return;setCheckout({selection,lens:l.id,updateSelection})}}/>}
 {requiresRun[l.id]&&<p role="status">{es?'La solicitud anterior se cerró o cambió. Haga clic en Ejecutar Algoritmo para iniciar una solicitud nueva.':'The previous request was closed or replaced. Click Run Algorithm to start a new request.'}</p>}
 {reply?.state==='undefined'&&<p role="status">{es?'Análisis no disponible para esta evidencia canónica.':'Analysis unavailable for this canonical evidence.'} <span lang={reply.reasonLanguage??'en'}>{reply.reason}</span></p>}
 {reply?.state==='error'&&<p role="alert">{es?'No se pudo completar. Vuelva a ejecutar explícitamente.':'Unable to complete. Run again explicitly.'}</p>}
 <AlgorithmRunButton className={styles.run} type="button" disabled={busy[l.id]} onClick={()=>void run(l.id)}>{busy[l.id]?(es?'Ejecutando…':'Running…'):(es?'Ejecutar algoritmo':'Run Algorithm')}</AlgorithmRunButton>
 </section>})}{checkout&&<ListingCheckoutOverlay selection={checkout.selection} lens={checkout.lens} onSelection={checkout.updateSelection} onClose={()=>setCheckout(null)} onAccount={account=>intent.current.bind(account)} onPaid={paid}/>}</section>
}
function PriceMarker({value,currency,result,language,draft}:{value:number|null;currency:string;result:import('@/lib/asking-price-contract').Result;language:Lang;draft:boolean}){
 const amount=value&&Number.isFinite(value)&&value>0?(currency==='CRC'?value:currency==='USD'&&result.fx?value*result.fx.rate:null):null
 const min=result.statistics.minimum,max=result.statistics.maximum
 if(amount===null||min===null||max===null)return <p>{language==='es'?'Marcador no disponible en el contexto monetario ejecutado.':'Marker unavailable in the executed monetary context.'}</p>
 // Pure presentation of the proposed amount, not an inferred percentile/density.
 const left=max===min?50:Math.min(100,Math.max(0,100*(amount-min)/(max-min)))
 return <div><p>{draft?(language==='es'?'Precio propuesto':'Proposed asking price'):(language==='es'?'Precio de oferta de la propiedad':'Property asking price')}: CRC {new Intl.NumberFormat(language==='es'?'es-CR':'en-US').format(amount)}{amount<min||amount>max?(language==='es'?' · Fuera del rango observado':' · Outside observed range'):''}</p><div className={styles.track}><i style={{left:`${left}%`}}/></div><p>{language==='es'?'Marcador de importe; no es un percentil. Cambiar solo el precio no recalcula el mercado.':'Amount marker, not a percentile. Price-only changes do not recalculate the market.'}</p></div>
}
