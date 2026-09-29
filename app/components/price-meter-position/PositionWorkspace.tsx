'use client'
import {useEffect,useRef,useState} from 'react'
import {executePositionHub} from '@/lib/position-hub-action'
import {positionHubTitle,positionHubQuestion,type PositionHubResponse} from '@/lib/position-hub-contract'
import {parsePositionRequest,type PositionRequest} from '@/lib/price-meter-property-position-request'
import {positionLabels,positionNumber,positionStateText,positionIntervals} from '@/lib/price-meter-property-position-presentation'
import type {PositionDTO} from '@/lib/price-meter-property-position-browser-contract'
import ComparativeDiscoveryAccess from '../ComparativeDiscoveryAccess'
import AnalysisActions from '../AnalysisActions'
import styles from '../market-summary/workspace.module.css'
import local from './position.module.css'

function restore(serialized?:string):PositionRequest|null{try{return serialized?parsePositionRequest(JSON.parse(serialized)) as PositionRequest:null}catch{return null}}
const blank:PositionRequest={listingId:'',requestedGeographyLevel:'district',requestedNormalizationBasis:'land'}
function Evidence({r,language}:{r:Extract<PositionDTO,{state:'ok'}>;language:'en'|'es'}){
 const es=language==='es',l=positionLabels[language],f=(v:number|null,s=false)=>positionNumber(v,language,s),unit=es?r.unit.replace('/month','/mes'):r.unit
 return <>
 <p>{l[r.transactionType]} · {l[r.propertyBasis]} · {l[r.normalizationBasis]} · {unit}</p>
 <p>{l[r.reference.geographyLevel]}: {es?r.reference.geography.labelEs||r.reference.geography.label:r.reference.geography.labelEn||r.reference.geography.label} · {l.type}: {r.reference.propertyType.label}</p>
 <p>{l.included} {l.areas}</p>
 <dl className={local.metrics}>
 {[[l.subject,`${f(r.subjectPricePerM2)} ${unit}`],[l.median,`${f(r.distribution.median)} ${unit}`],[l.percentile,f(r.percentile)],[l.n,`${r.n} · ${l.complete}`],[l.difference,`${f(r.difference,true)} ${unit} (${f(r.percentDifference,true)}%)`]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
 </dl><p>{l.denominator}</p>
 <div className={local.position} aria-label={es?'Posición percentil de la propiedad':'Property percentile position'}>
  <div className={local.track}><span style={{left:`${r.percentile}%`}}/></div>
  <div className={local.ends}><span>0</span><strong>{es?'Percentil':'Percentile'} {f(r.percentile)}</strong><span>100</span></div>
 </div>
 <p>{l.below}: {r.below} · {l.equal}: {r.equal} · {l.above}: {r.above}</p>
 <p>{l.interval}: {positionIntervals[r.interval]}</p>
 <details><summary>{l.distribution}</summary><dl className={local.metrics}>{(['minimum','p10','p25','median','p75','p90','maximum','iqr'] as const).map(k=><div key={k}><dt>{k in l?l[k as 'minimum'|'median'|'maximum'|'iqr']:k.toUpperCase()}</dt><dd>{f(r.distribution[k])} {unit}</dd></div>)}</dl></details>
 <details><summary>{es?'Valores numéricos sin redondear':'Unrounded numerical evidence'}</summary><dl className={local.metrics}>{[[l.subject,r.subjectPricePerM2],[l.percentile,r.percentile],[l.difference,r.difference],[es?'Diferencia porcentual':'Percentage difference',r.percentDifference],...Object.entries(r.distribution).map(([key,value])=>[key in l?l[key as 'minimum'|'median'|'maximum'|'iqr']:key.toUpperCase(),value])].map(([key,value])=><div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>)}</dl><p>{unit} · {es?'El percentil y la diferencia porcentual se expresan en %.':'Percentile and percentage difference are expressed in %.'}</p></details>
 {r.tail&&<p>{l.tail}: P{r.tail.thresholdPercentile} = {f(r.tail.thresholdPricePerM2)} {unit}. {l.tailDifference}: {f(r.tail.difference,true)} {unit} ({f(r.tail.percentDifference,true)}%; P{r.tail.thresholdPercentile}).</p>}
 {r.constructionToLand&&<p>{l.ratio}: {f(r.constructionToLand.ratio)} ({f(r.constructionToLand.constructionAreaM2)} m² / {f(r.constructionToLand.propertyAreaM2)} m²). {es?'No es cobertura del terreno.':'This is not site coverage.'}</p>}
 <p>{l.date}: {r.analyticalDate}. {r.monetaryMethod==='native_crc'?l.native:l.fx}</p>
 </>
}
function Workspace({language,serialized}:{language:'en'|'es';serialized?:string}){
 const es=language==='es',initial=restore(serialized)
 const[draft,setDraft]=useState<PositionRequest>(initial??blank),[editing,setEditing]=useState(true),[busy,setBusy]=useState(false)
 const[committed,setCommitted]=useState<{request:PositionRequest;response:Exclude<PositionHubResponse,{access:string}>}|null>(null)
 const[error,setError]=useState(serialized&&!initial?(es?'No se pudo restaurar la pregunta guardada.':'The saved question could not be restored.'):'')
 const lock=useRef(false),generation=useRef(0),heading=useRef<HTMLHeadingElement>(null)
 useEffect(()=>()=>{generation.current++},[])
 useEffect(()=>{if(committed)heading.current?.focus()},[committed])
 async function apply(event:React.FormEvent){
  event.preventDefault();if(lock.current)return
  let request:PositionRequest
  try{request=parsePositionRequest({...draft,listingId:draft.listingId.trim()}) as PositionRequest}catch{setError(es?'Ingresa un ID de anuncio válido y define la referencia.':'Enter a valid listing ID and define the reference.');return}
  lock.current=true;const ticket=++generation.current;setBusy(true);setError('')
  try{
   const response=await executePositionHub(request)
   if(ticket!==generation.current)return
   if('access'in response){setCommitted(null);setError(es?'Se requiere una sesión y acceso autorizado.':'Sign in with authorized access to run this analysis.');return}
   if(response.result.state==='execution_unavailable'||response.result.state==='reference_evidence_incomplete'){setError(positionStateText(response.result.state,language));return}
   setCommitted({request,response});setEditing(false)
  }catch{if(ticket===generation.current)setError(positionStateText('execution_unavailable',language))}
  finally{if(ticket===generation.current){lock.current=false;setBusy(false)}}
 }
 const result=committed?.response.result
 return <section className={`${styles.summary} ${local.workspace}`}>
 <header className={styles.introduction}><p className={styles.eyebrow}>{es?'Inteligencia de Mercado':'Market Intelligence'}</p><h2>{positionHubTitle[language]}</h2><p className={styles.primaryQuestion}>{positionHubQuestion[language]}</p><p>{es?'Elige un anuncio y su referencia. La transacción, el tipo de propiedad y la base se establecen a partir de su evidencia canónica al ejecutar.':'Choose a listing and its reference. Transaction, Property Type and Property Basis are established from its canonical evidence when you run the analysis.'}</p></header>
 <form hidden={!editing} className={styles.inputs} onSubmit={apply}><h3>{es?'Propiedad y referencia':'Property and reference'}</h3><fieldset disabled={busy} className={styles.fieldset}><div className={styles.inputGrid}>
 <label>{es?'ID del anuncio':'Listing ID'}<input aria-label={es?'ID del anuncio':'Listing ID'} value={draft.listingId} onChange={e=>setDraft({...draft,listingId:e.target.value})} placeholder="00000000-0000-0000-0000-000000000000" autoComplete="off" required/></label>
 <label>{es?'Referencia geográfica':'Geographic reference'}<select value={draft.requestedGeographyLevel} onChange={e=>setDraft({...draft,requestedGeographyLevel:e.target.value as PositionRequest['requestedGeographyLevel']})}>{(['district','canton','province'] as const).map(g=><option key={g} value={g}>{es?`${positionLabels.es[g]} de la propiedad`:`Subject’s ${g}`}</option>)}</select></label>
 <label>{es?'Denominador de área exacta':'Exact-area denominator'}<select value={draft.requestedNormalizationBasis} onChange={e=>setDraft({...draft,requestedNormalizationBasis:e.target.value as PositionRequest['requestedNormalizationBasis']})}><option value="land">{es?'Área del terreno':'Property Area'}</option><option value="construction">{es?'Área de construcción':'Construction Area'}</option></select></label>
 </div><p>{es?'La referencia incluye anuncios activos del mismo tipo, transacción y base, dentro de la geografía elegida de la propiedad. No se amplía automáticamente.':'The reference includes active listings of the same type, transaction and basis within the subject’s chosen geography. It never expands automatically.'}</p><button type="submit" className={styles.apply}>{busy?(es?'Analizando…':'Analyzing…'):(es?'Analizar posición':'Analyze Position')}</button></fieldset></form>
 {error&&<p className={styles.error} role="alert">{error}</p>}
 <div aria-live="polite" aria-busy={busy}>{committed&&<section className={styles.evidence}>
 <div className={styles.identity}><div><h3 ref={heading} tabIndex={-1}>{es?'Posición de la propiedad':'Property position'}</h3><p className={local.id}>{committed.request.listingId}</p></div><button className={styles.modify} disabled={busy} onClick={()=>setEditing(true)}>{es?'Modificar':'Modify'}</button></div>
 {editing&&<p>{es?'La evidencia mostrada corresponde a la última pregunta ejecutada.':'Displayed evidence belongs to the last executed question.'}</p>}
 {result?.state==='ok'?<Evidence r={result} language={language}/>:result&&<p>{positionStateText(result.state,language)}</p>}
 {committed.response.fx&&<p>BCCR USD → CRC: {committed.response.fx.rate} · {committed.response.fx.effectiveDate} · {es?'referencia de venta':'reference sale'} · {committed.response.fx.resolutionMode==='exact'?(es?'fecha exacta':'exact date'):(es?'última observación anterior aplicable':'latest applicable prior observation')}</p>}
 <AnalysisActions engineType="price-meter" language={language} filters={{analysis_question:'position',position_request:JSON.stringify(committed.request)}} result={committed.response} defaultName={positionHubTitle[language]}/>
 </section>}</div>
 <details className={styles.method}><summary>{es?'Metodología':'Methodology'}</summary><p>{es?'Una propiedad canónica activa, importe de oferta positivo y área exacta válida. La propiedad participa exactamente una vez en la referencia. Percentil de rango medio = 100 × (inferiores + iguales / 2) / n. No es un rango ordinal. La diferencia es propiedad menos mediana; el porcentaje usa la mediana. Las colas son estrictamente inferiores a P10 o superiores a P90.':'One active canonical property, positive asking amount and valid exact area. The subject participates exactly once in the reference. Midrank percentile = 100 × (below + equals / 2) / n. This is not ordinal rank. Difference is subject minus median; percentage uses the median. Tails are strictly below P10 or above P90.'}</p><p>{es?'La evidencia ausente no es cero. No se infieren áreas a partir de rangos. La posición describe ofertas observadas; no es una valoración, recomendación ni explicación causal.':'Missing evidence is not zero. Areas are not inferred from ranges. Position describes observed asking evidence; it is not a valuation, recommendation or causal explanation.'}</p></details>
 <p>{es?'TWUANIS REPORTA EVIDENCIA DEL MERCADO. TWUANIS NO PRESCRIBE DECISIONES.':'TWUANIS REPORTS MARKET EVIDENCE. TWUANIS DOES NOT PRESCRIBE DECISIONS.'}</p>
 </section>
}
export default function PositionWorkspace(props:{language:'en'|'es';serialized?:string}){return <ComparativeDiscoveryAccess language={props.language}><Workspace key={props.serialized??'new'} {...props}/></ComparativeDiscoveryAccess>}
