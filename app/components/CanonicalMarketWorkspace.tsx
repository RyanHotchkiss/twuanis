'use client'
import ResultSynthesis from './ResultSynthesis'
import CanonicalMarketIdentity from './CanonicalMarketIdentity'
import {commitConfiguration} from '@/lib/measurement/analytical'
import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react'
import {measuredMarketQuestion as executeMarketQuestion} from '@/lib/measurement/actions'
import {serverSignal} from '@/lib/measurement/runtime'
import FilterSelect from './market-filters/FilterSelect'
import { applyFilterChange, optionLabel, optionValue } from './market-filters/utils'
import AnalysisActions from './AnalysisActions'
import type { ExplorerOptions, Filters, Language } from './market-filters/types'
import { summaryKeys, summaryLabel, summaryOptions, summaryRoomSnapshot, summaryVisibleInputKeys, summaryIdentity, summaryOptionMatches, type SummaryKey } from './market-summary/contract'
import styles from './market-summary/workspace.module.css'

type Committed<T>={filters:Filters;labels:string[];result:T}
// Shared presentation/commit lifecycle only. Each engine owns its result and lens.
export default function CanonicalMarketWorkspace<T>({options,filters,language='en',engine,title,primaryQuestion,children}:{options:ExplorerOptions;filters:Filters;language?:Language;engine:'summary'|'composition'|'matching'|'configuration';title:string;primaryQuestion:string;children:(committed:Committed<T>,heading:RefObject<HTMLHeadingElement|null>,id:string)=>ReactNode}) {
 const es=language==='es', id=useId(), grouped=engine==='matching'||engine==='configuration'
 const [draft,setDraft]=useState(()=>summaryRoomSnapshot(filters,options))
 const [committed,setCommitted]=useState<Committed<T>|null>(null)
 const [expanded,setExpanded]=useState(true)
 const [pending,setPending]=useState(false)
 const [error,setError]=useState<string|null>(null)
 const inFlight=useRef(false),generation=useRef(0)
 const resultHeading=useRef<HTMLHeadingElement>(null),inputHeading=useRef<HTMLHeadingElement>(null)
 useEffect(()=>()=>{generation.current++},[])
 useEffect(()=>{if(committed)resultHeading.current?.focus()},[committed])
 const identity=JSON.stringify(summaryRoomSnapshot(filters,options)),previous=useRef(identity),previousFilters=useRef(filters)
 useEffect(()=>{if(previous.current!==identity||previousFilters.current!==filters){setDraft(summaryRoomSnapshot(filters,options));setExpanded(true);setError(null);previous.current=identity;previousFilters.current=filters;generation.current++;inFlight.current=false;setPending(false)}},[identity,filters,options.property_type])
 function change(key:string,value:string){
  // Road evidence is independently optional in this engine; do not silently
  // discard it when the accessibility semantic changes.
  setDraft(current=>summaryRoomSnapshot(key==='accessibility'?{...current,accessibility:value||undefined}:applyFilterChange(current,key,value),options))
  setError(null)
 }
 const visibleKeys=summaryVisibleInputKeys(draft,options)
 function field(key:SummaryKey){
  if(key==='bathrooms')return <FilterSelect key={key} compact label={summaryLabel(key,language)} filterKey={key} options={options.bathrooms} filters={draft} language={language} onFilterChange={change}/>
  const choices=summaryOptions(key,options,language,draft)
  const selected=draft[key]?.split(',').map(value=>choices.find(o=>summaryOptionMatches(key,o,value)))
  const unavailable=selected?.some(o=>!o)
  const restored=selected?.length && !unavailable && !choices.some(o=>optionValue(o)===draft[key])
   ? [{slug:draft[key],term_name:selected.map(o=>optionLabel(o!,language)).join(' / ')},...choices] : choices
  if(grouped&&['bedrooms','bathrooms','parking','utility','environment','terrain','accessibility','legal_status'].includes(key)){const control=<fieldset key={key} className={styles.inputs}><legend>{summaryLabel(key,language)}</legend>{choices.map(o=>{const value=optionValue(o),checked=(draft[key]?.split(',')??[]).some(v=>summaryOptionMatches(key,o,v));return <label key={value} style={{display:'flex',gap:8,minHeight:44,alignItems:'center'}}><input type="checkbox" checked={checked} onChange={e=>{const prior=(draft[key]?.split(',')??[]).filter(v=>!summaryOptionMatches(key,o,v));change(key,(e.target.checked?[...prior,value]:prior).join(','))}}/>{optionLabel(o,language)}</label>})}</fieldset>;return engine==='configuration'?<details key={key}><summary style={{cursor:'pointer',minHeight:44}}>{summaryLabel(key,language)}{draft[key]?` (${draft[key]!.split(',').length})`:''}</summary>{control}</details>:control}
  return <div key={key}>
   <FilterSelect compact label={summaryLabel(key,language)} filterKey={key} options={unavailable?[{slug:draft[key],term_name:es?'Selección no disponible — selecciona de nuevo':'Selection unavailable — choose again'},...choices]:restored} filters={draft} language={language} onFilterChange={change} emptyLabel={es?'Sin restricción':'Any'}/>
   {unavailable&&<small className={styles.error}>{es?'Revisa esta selección antes de aplicar.':'Review this selection before applying.'}</small>}
  </div>
 }
 async function apply(){
  if(inFlight.current)return
  const snapshot=summaryRoomSnapshot(draft,options)
  let labels:string[]
  try{labels=summaryIdentity(snapshot,options,language)}catch{setError(es?'Revisa las selecciones no disponibles.':'Review unavailable input selections.');return}
  const ticket=++generation.current
  inFlight.current=true;setPending(true);setError(null)
  try{
   commitConfiguration(engine,language,'s8a062a78a073bec91c52280d68153a6452b14903001127fe4aaec3d17590e4a6');const result=await executeMarketQuestion(engine,snapshot,language,serverSignal(language))
   if(ticket!==generation.current)return
   if('access' in result){setError(es?'Inicia sesión con una cuenta que tenga acceso a este análisis mediante un Paquete de Inteligencia vigente.':'Sign in with an account that has access to this analysis through an active Intelligence Package.');return}
   setCommitted({filters:snapshot,labels,result:result as T});setExpanded(false)
  }catch{
   if(ticket===generation.current)setError(es?'No se pudo completar el análisis. El resultado anterior se conserva.':'Analysis could not be completed. The previous result is retained.')
  }finally{if(ticket===generation.current){inFlight.current=false;setPending(false)}}
 }
 return <article className={styles.summary} aria-label={title}>
  <header className={styles.introduction}>
   <p className={styles.eyebrow}>{es?'Fundamentos del mercado':'Market fundamentals'}</p>
   <h2>{title}</h2>
   <p className={styles.primaryQuestion}>{primaryQuestion}</p>

  </header>
 {committed&&<ResultSynthesis engine={engine} evidence={committed.result} language={language}/>}
  {committed&&<CanonicalMarketIdentity committed={committed} engine={engine} options={options} language={language} modify={<button type="button" className={styles.modify} disabled={pending} aria-expanded={expanded} aria-controls={id} onClick={()=>{setExpanded(v=>!v);if(!expanded)requestAnimationFrame(()=>inputHeading.current?.focus())}}>{expanded?(es?'Cerrar edición':'Close editing'):(es?'Modificar':'Modify')}</button>}/>}
  <section id={id} hidden={!expanded} className={styles.inputs} aria-labelledby={`${id}-title`}>
   <h3 id={`${id}-title`} ref={inputHeading} tabIndex={-1}>{committed?(es?'Modificar mercado':'Modify market'):(es?'Definir el mercado':'Define the market')}</h3>
   <fieldset disabled={pending} className={styles.fieldset}><legend className={styles.srOnly}>{es?'Datos del mercado':'Market inputs'}</legend>
    {engine==='matching'&&<h4>{es?'Definir la población de búsqueda':'Define the search population'}</h4>}<div className={styles.inputGrid}>{visibleKeys.market.map(field)}</div>
    <details className={styles.optional} open={engine==='configuration'?true:undefined}><summary>{engine==='configuration'?(es?'Definir la configuración de propiedad':'Define the property configuration'):engine==='matching'?(es?'Seleccionar atributos para comparar':'Select matching attributes'):(es?'Características y medidas opcionales':'Optional characteristics and measurements')}</summary>{engine==='configuration'&&<p>{es?'Las opciones seleccionadas dentro de Habitaciones, Baños y Estacionamiento son alternativas: al menos una debe acreditarse positivamente en cada dimensión seleccionada. Todas las dimensiones seleccionadas y cada una de las demás características seleccionadas son requisitos conjuntos. Sin atributos, la configuración incluye todo el mercado.':'Selected options within Bedrooms, Bathrooms and Parking are alternatives: at least one must be positively established in each selected dimension. All selected dimensions and every other selected characteristic are joint requirements. With no attributes, the configuration includes the entire market.'}</p>}<div className={styles.inputGrid}>{visibleKeys.optional.map(field)}</div></details>
    <button type="button" className={styles.apply} onClick={apply} disabled={pending}>{pending?(es?'Analizando…':'Analyzing…'):(engine==='configuration'?(es?'Analizar configuración':'Analyze configuration'):engine==='matching'?(es?'Buscar anuncios coincidentes':'Find matching listings'):(es?'Aplicar datos':'Apply inputs'))}</button>
   </fieldset>
  </section>
  {pending&&<p role="status">{es?`Ejecutando ${title}…`:`Running ${title}…`}</p>}
  {error&&<p role="alert" className={styles.error}>{error}</p>}
  {committed&&<div aria-live="polite" aria-busy={pending}>
   {children(committed,resultHeading,id)}
   <AnalysisActions engineType={engine==='configuration'?'scarcity':engine==='matching'?'matching':'explorer'} language={language} filters={{...committed.filters,analysis_question:engine}} result={committed.result} defaultName={title}/>
  </div>}
 </article>
}
