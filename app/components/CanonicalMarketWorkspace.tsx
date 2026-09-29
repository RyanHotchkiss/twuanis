'use client'
import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react'
import { executeMarketQuestion } from '@/lib/market-inventory-action'
import FilterSelect from './market-filters/FilterSelect'
import { applyFilterChange, optionLabel, optionValue } from './market-filters/utils'
import AnalysisActions from './AnalysisActions'
import type { ExplorerOptions, Filters, Language } from './market-filters/types'
import { summaryKeys, summaryLabel, summaryOptions, summarySnapshot, summaryIdentity, summaryOptionMatches, type SummaryKey } from './market-summary/contract'
import styles from './market-summary/workspace.module.css'

type Committed<T>={filters:Filters;labels:string[];result:T}
// Shared presentation/commit lifecycle only. Each engine owns its result and lens.
export default function CanonicalMarketWorkspace<T>({options,filters,language='en',engine,title,primaryQuestion,children}:{options:ExplorerOptions;filters:Filters;language?:Language;engine:'summary'|'composition'|'matching'|'configuration';title:string;primaryQuestion:string;children:(committed:Committed<T>,heading:RefObject<HTMLHeadingElement|null>,id:string)=>ReactNode}) {
 const es=language==='es', id=useId(), grouped=engine==='matching'||engine==='configuration'
 const [draft,setDraft]=useState(()=>summarySnapshot(filters))
 const [committed,setCommitted]=useState<Committed<T>|null>(null)
 const [expanded,setExpanded]=useState(true)
 const [pending,setPending]=useState(false)
 const [error,setError]=useState<string|null>(null)
 const inFlight=useRef(false),generation=useRef(0)
 const resultHeading=useRef<HTMLHeadingElement>(null),inputHeading=useRef<HTMLHeadingElement>(null)
 useEffect(()=>()=>{generation.current++},[])
 useEffect(()=>{if(committed)resultHeading.current?.focus()},[committed])
 const identity=JSON.stringify(summarySnapshot(filters)),previous=useRef(identity)
 useEffect(()=>{if(previous.current!==identity){setDraft(summarySnapshot(filters));setExpanded(true);setError(null);previous.current=identity;generation.current++;inFlight.current=false;setPending(false)}},[identity,filters])
 function change(key:string,value:string){
  // Road evidence is independently optional in this engine; do not silently
  // discard it when the accessibility semantic changes.
  setDraft(current=>key==='accessibility'?{...current,accessibility:value||undefined}:applyFilterChange(current,key,value))
  setError(null)
 }
 function field(key:SummaryKey){
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
  const snapshot=summarySnapshot(draft)
  let labels:string[]
  try{labels=summaryIdentity(snapshot,options,language)}catch{setError(es?'Revisa las selecciones no disponibles.':'Review unavailable input selections.');return}
  const ticket=++generation.current
  inFlight.current=true;setPending(true);setError(null)
  try{
   const result=await executeMarketQuestion(engine,snapshot,language) as T
   if(ticket!==generation.current)return
   setCommitted({filters:snapshot,labels,result});setExpanded(false)
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
  {committed&&<div className={styles.identity}>
   <div><p className={styles.eyebrow}>{engine==='matching'?(es?'Población de búsqueda':'Search population'):(es?'Definición del mercado':'Market definition')}</p><ul aria-label={es?'Mercado analizado':'Analyzed market'}>{(grouped?summaryIdentity(Object.fromEntries(Object.entries(committed.filters).filter(([k])=>summaryKeys.slice(0,5).includes(k as never))),options,language):committed.labels).map((label,i)=><li key={i}>{label}</li>)}</ul>{grouped&&<><p className={styles.eyebrow} style={{marginTop:16}}>{engine==='configuration'?(es?'Configuración de propiedad':'Property configuration'):(es?'Atributos seleccionados':'Matching attributes')}</p><ul>{summaryKeys.slice(5).filter(k=>committed.filters[k]).map(k=><li key={k}>{summaryLabel(k,language)}: {committed.filters[k]!.split(',').map(v=>optionLabel(summaryOptions(k,options,language).find(o=>summaryOptionMatches(k,o,v))!,language)).join(' / ')}</li>)}</ul>{!summaryKeys.slice(5).some(k=>committed.filters[k])&&<p>{engine==='configuration'?(es?'Sin restricciones: todo el mercado definido':'No constraints: entire defined market'):(es?'Ninguno seleccionado':'None selected')}</p>}</>}</div>
   <button type="button" className={styles.modify} disabled={pending} aria-expanded={expanded} aria-controls={id} onClick={()=>{setExpanded(v=>!v);if(!expanded)requestAnimationFrame(()=>inputHeading.current?.focus())}}>{expanded?(es?'Cerrar edición':'Close editing'):(es?'Modificar':'Modify')}</button>
  </div>}
  <section id={id} hidden={!expanded} className={styles.inputs} aria-labelledby={`${id}-title`}>
   <h3 id={`${id}-title`} ref={inputHeading} tabIndex={-1}>{committed?(es?'Modificar mercado':'Modify market'):(es?'Definir el mercado':'Define the market')}</h3>
   <fieldset disabled={pending} className={styles.fieldset}><legend className={styles.srOnly}>{es?'Datos del mercado':'Market inputs'}</legend>
    {engine==='matching'&&<h4>{es?'Definir la población de búsqueda':'Define the search population'}</h4>}<div className={styles.inputGrid}>{summaryKeys.slice(0,5).map(field)}</div>
    <details className={styles.optional} open={engine==='configuration'?true:undefined}><summary>{engine==='configuration'?(es?'Definir la configuración de propiedad':'Define the property configuration'):engine==='matching'?(es?'Seleccionar atributos para comparar':'Select matching attributes'):(es?'Características y medidas opcionales':'Optional characteristics and measurements')}</summary>{engine==='configuration'&&<p>{es?'Todos los atributos seleccionados son requisitos conjuntos. Sin atributos, la configuración incluye todo el mercado.':'All selected attributes are joint requirements. With no attributes, the configuration includes the entire market.'}</p>}<div className={styles.inputGrid}>{summaryKeys.slice(5).map(field)}</div></details>
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
