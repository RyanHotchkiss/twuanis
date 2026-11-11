'use client'
import ResultSynthesis from '../ResultSynthesis'
import {useHubUniverse} from '../HubUniverseContext'
import PositionResult from './PositionResult'
import {commitConfiguration} from '@/lib/measurement/analytical'
import {useEffect,useRef,useState} from 'react'
import {measuredPosition as executePositionHub} from '@/lib/measurement/actions'
import {serverSignal} from '@/lib/measurement/runtime'
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
function Workspace({language,serialized}:{language:'en'|'es';serialized?:string}){
 const universe=useHubUniverse()
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
   commitConfiguration('position',language,'s0130f863e8eca14a7ed27cb45de242b273b3b20b7f88c09897899f2cc55a3c60');const response=await executePositionHub(request,serverSignal(language))
   if(ticket!==generation.current)return
   if('access'in response){setCommitted(null);setError(es?'Se requiere una sesión y acceso autorizado.':'Sign in with authorized access to run this analysis.');return}
   if(response.result.state==='execution_unavailable'||response.result.state==='reference_evidence_incomplete'){setError(positionStateText(response.result.state,language));return}
   if(universe&&'result' in response&&response.result.state==='ok'&&response.result.transactionType!==(universe==='RENT'?'rent':'sale'))throw Error('Subject universe differs from the selected universe.');
   setCommitted({request,response});setEditing(false)
  }catch{if(ticket===generation.current)setError(positionStateText('execution_unavailable',language))}
  finally{if(ticket===generation.current){lock.current=false;setBusy(false)}}
 }
 const result=committed?.response.result
 return <section className={`${styles.summary} ${local.workspace}`}>
 <header className={styles.introduction}><p className={styles.eyebrow}>{es?'Inteligencia de Mercado':'Market Intelligence'}</p><h2>{positionHubTitle[language]}</h2><p className={styles.primaryQuestion}>{positionHubQuestion[language]}</p><p>{es?'Elige un anuncio y su referencia. La transacción, el tipo de propiedad y la base se establecen a partir de su evidencia canónica al ejecutar.':'Choose a listing and its reference. Transaction, Property Type and Property Basis are established from its canonical evidence when you run the analysis.'}</p></header>
 {committed&&<ResultSynthesis engine={'position'} evidence={committed.response} language={language}/>}
 <form hidden={!editing} className={styles.inputs} onSubmit={apply}><h3>{es?'Propiedad y referencia':'Property and reference'}</h3><fieldset disabled={busy} className={styles.fieldset}><div className={styles.inputGrid}>
 <label>{es?'ID del anuncio':'Listing ID'}<input aria-label={es?'ID del anuncio':'Listing ID'} value={draft.listingId} onChange={e=>setDraft({...draft,listingId:e.target.value})} placeholder="00000000-0000-0000-0000-000000000000" autoComplete="off" required/></label>
 <label>{es?'Referencia geográfica':'Geographic reference'}<select value={draft.requestedGeographyLevel} onChange={e=>setDraft({...draft,requestedGeographyLevel:e.target.value as PositionRequest['requestedGeographyLevel']})}>{(['district','canton','province'] as const).map(g=><option key={g} value={g}>{es?`${positionLabels.es[g]} de la propiedad`:`Subject’s ${g}`}</option>)}</select></label>
 <label>{es?'Denominador de área exacta':'Exact-area denominator'}<select value={draft.requestedNormalizationBasis} onChange={e=>setDraft({...draft,requestedNormalizationBasis:e.target.value as PositionRequest['requestedNormalizationBasis']})}><option value="land">{es?'Área del terreno':'Property Area'}</option><option value="construction">{es?'Área de construcción':'Construction Area'}</option></select></label>
 </div><p>{es?'La referencia incluye anuncios activos del mismo tipo, transacción y base, dentro de la geografía elegida de la propiedad. No se amplía automáticamente.':'The reference includes active listings of the same type, transaction and basis within the subject’s chosen geography. It never expands automatically.'}</p><button type="submit" className={styles.apply}>{busy?(es?'Analizando…':'Analyzing…'):(es?'Analizar posición':'Analyze Position')}</button></fieldset></form>
 {error&&<p className={styles.error} role="alert">{error}</p>}
 <div aria-live="polite" aria-busy={busy}>{committed&&<PositionResult part="result" editing={editing} committed={committed} language={language} heading={heading} modify={<button className={styles.modify} disabled={busy} onClick={()=>setEditing(true)}>{es?'Modificar':'Modify'}</button>} actions={<AnalysisActions engineType="price-meter" language={language} filters={{analysis_question:'position',position_request:JSON.stringify(committed.request)}} result={committed.response} defaultName={positionHubTitle[language]}/>}/>}</div>
 <PositionResult part="method" committed={committed} language={language} heading={heading} />
 </section>
}
export default function PositionWorkspace(props:{language:'en'|'es';serialized?:string;previewOnly?:boolean}){return <ComparativeDiscoveryAccess language={props.language} previewOnly={props.previewOnly}><Workspace key={props.serialized??'new'} {...props}/></ComparativeDiscoveryAccess>}
