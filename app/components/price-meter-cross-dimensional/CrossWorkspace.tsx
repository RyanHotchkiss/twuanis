'use client'
import {useEffect,useId,useRef,useState} from 'react'
import {readCrossDimensionalQuestions,executeCrossDimensionalHub} from '@/lib/price-meter-cross-dimensional-action'
import {summaryKeys,summaryOptions,summaryLabel,summaryIdentity,summarySnapshot} from '../market-summary/contract'
import {applyFilterChange} from '../market-filters/utils'
import type {ExplorerOptions,Filters} from '../market-filters/types'
import FilterSelect from '../market-filters/FilterSelect'
import AnalysisActions from '../AnalysisActions'
import CrossEvidence from './CrossEvidence'
import {crossTitle,crossQuestion,ownerLabels,dimensionLabels} from './contract'
import styles from '../market-summary/workspace.module.css'
import controls from '../price-meter-distribution/distribution.module.css'
import crossStyles from './cross.module.css'
type Catalog=Awaited<ReturnType<typeof readCrossDimensionalQuestions>>
type Complete=Extract<Awaited<ReturnType<typeof executeCrossDimensionalHub>>,{state:'complete'}>
export default function CrossWorkspace({options,filters,language}:{options:ExplorerOptions;filters:Filters;language:'en'|'es'}){
 const es=language==='es',id=useId(),heading=useRef<HTMLHeadingElement>(null),generation=useRef(0),busy=useRef(false)
 const [chosenOwner,setChosenOwner]=useState('')
 const [catalog,setCatalog]=useState<Catalog>([]),[catalogFailed,setCatalogFailed]=useState(false)
 const [draft,setDraft]=useState(()=>summarySnapshot(filters)),[question,setQuestion]=useState(filters.cross_question??''),[cohort,setCohort]=useState(filters.cross_cohort??'')
 const [open,setOpen]=useState(true),[pending,setPending]=useState(false),[error,setError]=useState<'invalid'|'execution'|null>(null)
 const [committed,setCommitted]=useState<{filters:Filters;response:Complete;version:number}|null>(null)
 useEffect(()=>{let active=true;setCatalogFailed(false);readCrossDimensionalQuestions(language).then(c=>{if(active)setCatalog(c)}).catch(()=>{if(active)setCatalogFailed(true)});return()=>{active=false}},[language])
 useEffect(()=>()=>{generation.current++},[])
 useEffect(()=>{if(committed)heading.current?.focus()},[committed])
 const incoming=JSON.stringify(filters),previous=useRef(incoming)
 useEffect(()=>{if(previous.current!==incoming){previous.current=incoming;generation.current++;busy.current=false;setPending(false);setDraft(summarySnapshot(filters));setChosenOwner('');setQuestion(filters.cross_question??'');setCohort(filters.cross_cohort??'');setOpen(true);setError(null)}},[incoming,filters])
 const q=catalog.find(q=>q.key===question),owner=q?.owner??chosenOwner
 const needsCohort=owner==='phase_7_geography'||owner==='phase_9_construction_to_land'
 const availableCohorts=owner==='phase_7_geography'&&q?.secondary==='property_area'?['vacantLandLandNormalized','improvedLandNormalized','improvedConstructionNormalized']:['improvedLandNormalized','improvedConstructionNormalized']
 const cohortLabel=(key:string)=>key==='vacantLandLandNormalized'?(es?'Terreno vacío · CRC / m² de terreno':'Vacant Land · CRC / land m²'):key==='improvedLandNormalized'?(es?'Propiedad mejorada · CRC / m² de terreno':'Improved Property · CRC / land m²'):(es?'Propiedad mejorada · CRC / m² de construcción':'Improved Property · CRC / construction m²')
 async function analyze(){if(busy.current)return;if(!q||needsCohort&&!availableCohorts.includes(cohort)){setError('invalid');return}
 const snapshot={...summarySnapshot(draft),cross_question:question,...(needsCohort?{cross_cohort:cohort}:{})};const ticket=++generation.current;busy.current=true;setPending(true);setError(null)
 try{const response=await executeCrossDimensionalHub({questionKey:question,filters:summarySnapshot(snapshot),...(needsCohort?{cohortKey:cohort}:{})});if(ticket!==generation.current)return
 if(response.state==='error'){setError(response.status===400?'invalid':'execution');return}
 setCommitted({filters:{...snapshot,analysis_question:'cross-dimensional'},response,version:ticket});setOpen(false)
 }catch{if(ticket===generation.current)setError('execution')}finally{if(ticket===generation.current){busy.current=false;setPending(false)}}}
 function field(key:typeof summaryKeys[number]){return <FilterSelect key={key} compact label={summaryLabel(key,language)} filterKey={key} options={summaryOptions(key,options,language,draft)} filters={draft} language={language} onFilterChange={(k,v)=>setDraft(d=>k==='accessibility'?{...d,[k]:v||undefined}:applyFilterChange(d,k,v))} emptyLabel={['transaction_type','property_type','province','canton'].includes(key)?(es?'Seleccionar (obligatorio)':'Select (required)'):(es?'Sin restricción':'Unrestricted')}/>}
 const c=committed?.response,r=c?.result
 return <article className={styles.summary} aria-label={crossTitle[language]} style={{minWidth:0,overflowWrap:'anywhere'}}><header className={styles.introduction}><h2>{crossTitle[language]}</h2><p className={styles.primaryQuestion}>{crossQuestion[language]}</p></header>
 {committed&&<button type="button" className={styles.modify} aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)}>{es?'Modificar':'Modify'}</button>}
 <section id={id} hidden={!open} className={styles.inputs}><fieldset className={styles.fieldset} disabled={pending}><legend>{es?'Definir la pregunta':'Define the question'}</legend>
 {catalogFailed&&<p role="alert">{es?'No se pudieron cargar las preguntas autorizadas.':'Authorized questions could not be loaded.'}</p>}
 <div className={controls.controls}><label>{es?'Relación principal':'Owning relationship'}<select aria-label={es?'Relación principal':'Owning relationship'} value={owner} onChange={e=>{setChosenOwner(e.target.value);setQuestion('');setCohort('')}}><option value="">{es?'Seleccionar':'Select'}</option>{[...new Set(catalog.map(q=>q.owner))].map(o=><option key={o} value={o}>{ownerLabels[language][o]}</option>)}</select></label>
 <label>{es?'Dimensión secundaria':'Secondary dimension'}<select aria-label={es?'Dimensión secundaria':'Secondary dimension'} value={question} onChange={e=>{setQuestion(e.target.value);setCohort('')}}><option value="">{es?'Seleccionar':'Select'}</option>{catalog.filter(q=>q.owner===owner).map(q=><option key={q.key} value={q.key}>{dimensionLabels[language][q.secondary]}</option>)}</select></label>
 {needsCohort&&<label>{es?'Definición del precio por m²':'Price / m² definition'}<select aria-label={es?'Definición del precio por m²':'Price / m² definition'} value={cohort} onChange={e=>setCohort(e.target.value)}><option value="">{es?'Seleccionar (obligatorio)':'Select (required)'}</option>{availableCohorts.map(k=><option key={k} value={k}>{cohortLabel(k)}</option>)}</select></label>}</div>
 {q&&<p>{q.question}</p>}<p>{es?'Transacción, tipo de propiedad, provincia y cantón son obligatorios. Si la pregunta incluye geografía, el análisis compara distritos dentro del cantón; no selecciones un distrito terminal.':'Transaction, Property Type, Province and Canton are required. Geographic questions compare districts within the canton; do not select a terminal district.'}</p>
 <div className={styles.inputGrid}>{summaryKeys.slice(0,5).map(field)}</div><details className={styles.optional}><summary>{es?'Restricciones opcionales':'Optional constraints'}</summary><div className={styles.inputGrid}>{summaryKeys.slice(5).map(field)}</div></details>
 <button type="button" className={styles.apply} onClick={analyze} disabled={pending||!catalog.length}>{pending?(es?'Analizando…':'Analyzing…'):(es?'Analizar la relación entre grupos':'Analyze relationship across groups')}</button></fieldset></section>
 {error&&<p role="alert" className={styles.error}>{error==='invalid'?(es?'Solicitud inválida. Revisa la pregunta y la definición del mercado.':'Invalid request. Check the question and market definition.'):(es?'No se completó el análisis. El resultado anterior se conserva.':'Analysis did not complete. The previous result is retained.')}</p>}
 {committed&&c&&r&&<section className={crossStyles.evidence} aria-live="polite" aria-busy={pending} data-cross-result><h3 ref={heading} tabIndex={-1}>{crossTitle[language]}</h3><div className={styles.identity}><div><p className={styles.eyebrow}>{es?'Mercado comprometido':'Committed market'}</p><ul>{summaryIdentity(summarySnapshot(committed.filters),options,language).map((label,i)=><li key={i}>{label}</li>)}</ul><p>{cohortLabel(r.context.propertyBasis==='land_only'?'vacantLandLandNormalized':r.context.normalizationBasis==='land'?'improvedLandNormalized':'improvedConstructionNormalized')}</p><p>{es?'Fecha analítica':'Analytical date'}: {c.analyticalDate}. {c.fx?`${c.fx.source} USD → CRC: ${c.fx.rate} · ${c.fx.effectiveDate}`:(es?'Sin conversión USD en el contexto adquirido.':'No USD conversion in the acquired context.')}</p></div></div>
 {r.evidence.populatedSecondaryCohortCount===0?<p role="status">{es?'No hay grupos secundarios con evidencia elegible.':'No secondary groups contain eligible evidence.'} n = {r.evidence.inputObservationCount}; {es?'excluidos':'excluded'} = {r.evidence.excludedObservationCount}. {es?'No se establecen relaciones ni reversiones.':'Relationships and reversals are not established.'}</p>:<CrossEvidence result={r} language={language}/>}
 <details className={styles.optional}><summary>{es?'Metodología':'Methodology'}</summary><p>{es?'Una población fija se divide por una dimensión secundaria. La relación se calcula de forma independiente en cada grupo representado. Los conteos y estados de establecimiento se conservan; la ausencia de evidencia no equivale a cero. Las diferencias y reversiones describen observaciones, no causas ni predicciones. C/L usa áreas exactas y no representa cobertura del sitio.':'One fixed population is segmented by one secondary dimension. The relationship is calculated independently within each represented group. Counts and establishment states are retained; missing evidence is not zero. Differences and reversals describe observations, not causes or predictions. C/L uses exact areas and is not site coverage.'}</p></details>
 <AnalysisActions key={committed.version} engineType="price-meter" language={language} filters={committed.filters} result={c} defaultName={crossTitle[language]}/></section>}
 </article>
}
