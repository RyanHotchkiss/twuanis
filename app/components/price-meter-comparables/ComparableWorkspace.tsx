'use client'
import ResultSynthesis from '../ResultSynthesis'
import {useHubUniverse} from '../HubUniverseContext'
import ComparableResult,{ComparableMethodology} from './ComparableResult'
import {commitConfiguration} from '@/lib/measurement/analytical'
import {useEffect,useRef,useState} from 'react'
import {measuredComparables as executeComparablesHub} from '@/lib/measurement/actions'
import {serverSignal} from '@/lib/measurement/runtime'
import {comparableInputEvidenceGuidance,comparablesTitle,comparablesQuestion,comparableDimensions,comparableLabels,parseComparablesRequest,type ComparablesRequest,type ComparablesResponse} from '@/lib/comparables-hub-contract'
import type {PriceMeterComparableBrowserSuccessEvidence} from '@/lib/price-meter-comparable-browser-contract'
import {positionLabels,positionNumber,positionIntervals} from '@/lib/price-meter-property-position-presentation'
import ComparativeDiscoveryAccess from '../ComparativeDiscoveryAccess'
import AnalysisActions from '../AnalysisActions'
import styles from '../market-summary/workspace.module.css'
import cohort from './comparables.module.css'
import local from '../price-meter-position/position.module.css'
function restore(text?:string):ComparablesRequest|null{try{return text?parseComparablesRequest(JSON.parse(text)):null}catch{return null}}
const blank:ComparablesRequest={subjectListingId:'',geographyLevel:'canton',normalizationBasis:'land',activeDimensions:[]}
function Workspace({language,serialized}:{language:'en'|'es';serialized?:string}){
 const universe=useHubUniverse()
 const es=language==='es',initial=restore(serialized),l=positionLabels[language]
 const[draft,setDraft]=useState<ComparablesRequest>(initial??blank),[editing,setEditing]=useState(true),[busy,setBusy]=useState(false)
 const[committed,setCommitted]=useState<{request:ComparablesRequest;response:Extract<ComparablesResponse,{evidence:unknown}>}|null>(null)
 const[error,setError]=useState(serialized&&!initial?(es?'No se pudo restaurar la pregunta guardada.':'The saved question could not be restored.'):'')
 const lock=useRef(false),generation=useRef(0),heading=useRef<HTMLHeadingElement>(null)
 useEffect(()=>()=>{generation.current++},[]);useEffect(()=>{if(committed)heading.current?.focus()},[committed])
 async function apply(event:React.FormEvent){event.preventDefault();if(lock.current)return;let request:ComparablesRequest
  try{request=parseComparablesRequest(draft)}catch{setError(es?'Ingresa un ID de anuncio válido y define la cohorte.':'Enter a valid listing ID and define the cohort.');return}
  lock.current=true;const ticket=++generation.current;setBusy(true);setError('')
  try{commitConfiguration('comparables',language,'s3d91d980afe2de981796a866e0e4ebb985909c8180a6c5f7b594324f20cb2d5f');const response=await executeComparablesHub(request,serverSignal(language));if(ticket!==generation.current)return
   if('access'in response){setCommitted(null);setError(es?'Se requiere una sesión y acceso autorizado.':'Sign in with authorized access to run this analysis.');return}
   if('error'in response&&response.error==='unsupported_subject_dimensions'){setError(comparableInputEvidenceGuidance(response.unsupportedDimensions,language));return}
   if('error'in response){setError(es?'No se pudo establecer la cohorte. Comprueba la propiedad, su geografía, las áreas exactas y las características seleccionadas. La evidencia previa no ha sido reemplazada.':'The cohort could not be established. Check the property, its geography, exact areas and selected characteristics. Prior evidence has not been replaced.');return}
   if(universe&&'evidence' in response&&response.evidence.transactionType!==(universe==='RENT'?'rent':'sale'))throw Error('Subject universe differs from the selected universe.');
   setCommitted({request,response});setEditing(false)
  }catch{if(ticket===generation.current)setError(es?'Análisis no disponible. Inténtalo de nuevo.':'Analysis unavailable. Please retry.')}
  finally{if(ticket===generation.current){lock.current=false;setBusy(false)}}
 }
 const r=committed?.response.evidence,p=committed?.response.presentation
 const areaLabel=(value:string)=>es?value.replace('Under','Menos de').replace('hectares','hectáreas'):value
 return <section className={`${styles.summary} ${local.workspace}`}><header className={styles.introduction}><p className={styles.eyebrow}>{es?'Inteligencia de Mercado':'Market Intelligence'}</p><h2>{comparablesTitle[language]}</h2><p className={styles.primaryQuestion}>{comparablesQuestion[language]}</p><p>{es?'Selecciona una propiedad existente y las características que deben compartir sus comparables. La propiedad queda excluida de la cohorte.':'Select an existing property and the characteristics its comparables must share. The subject is excluded from the cohort.'}</p></header>
 {committed&&<ResultSynthesis engine={'comparables'} evidence={committed.response} language={language}/>}
 <form hidden={!editing} className={styles.inputs} onSubmit={apply}><h3>{es?'Propiedad y cohorte':'Property and cohort'}</h3><fieldset disabled={busy} className={styles.fieldset}><div className={styles.inputGrid}>
 <label>{es?'ID del anuncio':'Listing ID'}<input aria-label={es?'ID del anuncio':'Listing ID'} value={draft.subjectListingId} onChange={e=>setDraft({...draft,subjectListingId:e.target.value})} autoComplete="off" placeholder="00000000-0000-0000-0000-000000000000" required/></label>
 <label>{es?'Geografía de la propiedad':'Subject geography'}<select value={draft.geographyLevel} onChange={e=>setDraft({...draft,geographyLevel:e.target.value as ComparablesRequest['geographyLevel']})}>{(['district','canton','province'] as const).map(g=><option key={g} value={g}>{l[g]}</option>)}</select></label>
 <label>{es?'Denominador de área exacta':'Exact-area denominator'}<select value={draft.normalizationBasis} onChange={e=>setDraft({...draft,normalizationBasis:e.target.value as ComparablesRequest['normalizationBasis']})}><option value="land">{es?'Área del terreno':'Property Area'}</option><option value="construction">{es?'Área de construcción':'Construction Area'}</option></select></label></div>
 <p>{es?'Límites obligatorios: mismo tipo de propiedad, banda canónica de área del terreno y, para propiedades mejoradas, banda de área de construcción. La transacción y la base proceden de la propiedad. No se amplía la cohorte automáticamente.':'Compulsory boundaries: same Property Type, canonical Property Area band and, for improved properties, Construction Area band. Transaction and Property Basis come from the subject. The cohort never expands automatically.'}</p>
 <fieldset className={styles.fieldset}><legend>{es?'Características opcionales que deben coincidir':'Optional characteristics to match'}</legend><div className={cohort.dimensions}>{comparableDimensions.map(d=><label key={d}><input type="checkbox" checked={draft.activeDimensions.includes(d)} onChange={e=>setDraft({...draft,activeDimensions:e.target.checked?[...draft.activeDimensions,d]:draft.activeDimensions.filter(x=>x!==d)})}/>{comparableLabels[d][language]}</label>)}</div></fieldset>
 <p>{es?'Cada selección exige la categoría registrada de la propiedad. Todas las selecciones se intersectan. Una característica ausente o ambigua no se interpreta como cero ni se sustituye; la solicitud no se ejecutará con esa selección.':'Each selection requires the subject’s recorded category. All selected dimensions intersect. A missing or ambiguous characteristic is not zero and is not substituted; the request cannot complete with that selection.'}</p>
 <button type="submit" className={styles.apply}>{busy?(es?'Analizando…':'Analyzing…'):(es?'Analizar cohorte':'Analyze Cohort')}</button></fieldset></form>
 {error&&<p className={styles.error} role="alert">{error}</p>}
 <div aria-live="polite" aria-busy={busy}>{committed&&r&&p&&<ComparableResult committed={committed} language={language} heading={heading} editing={editing} modify={<button className={styles.modify} disabled={busy} onClick={()=>{setDraft(committed.request);setEditing(true)}}>{es?'Modificar':'Modify'}</button>} actions={<AnalysisActions engineType="price-meter" language={language} filters={{analysis_question:'comparables',comparable_request:JSON.stringify(committed.request)}} result={committed.response} defaultName={comparablesTitle[language]}/>}/>}</div>
 <ComparableMethodology language={language}/></section>
}
export default function ComparableWorkspace(props:{language:'en'|'es';serialized?:string;previewOnly?:boolean}){return <ComparativeDiscoveryAccess language={props.language} previewOnly={props.previewOnly}><Workspace key={props.serialized??'new'} {...props}/></ComparativeDiscoveryAccess>}
