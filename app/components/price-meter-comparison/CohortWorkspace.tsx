'use client'
import {useEffect,useId,useRef,useState} from 'react'
import {executePriceMeterCohortComparison} from '@/lib/price-meter-cohort-action'
import type {ExplorerOptions,Filters} from '../market-filters/types'
import {cohortTitle,cohortQuestion,comparisonSnapshot,comparisonKeys,type CohortResult} from './contract'
import {CohortEditor,DraftCohortSummary} from './CohortEditor'
import CohortEvidence from './CohortEvidence'
import AnalysisActions from '../AnalysisActions'
import styles from '../market-summary/workspace.module.css'
import controls from '../price-meter-distribution/distribution.module.css'
export default function CohortWorkspace({options,filters,language}:{options:ExplorerOptions;filters:Filters;language:'en'|'es'}){
 const es=language==='es',id=useId()
 const [draft,setDraft]=useState(()=>comparisonSnapshot(filters)),[open,setOpen]=useState(true),[pending,setPending]=useState(false),[error,setError]=useState<'invalid'|'execution'|null>(null),[validationMessage,setValidationMessage]=useState('')
 const [committed,setCommitted]=useState<{filters:Filters;result:CohortResult;version:number}|null>(null)
 const generation=useRef(0),inFlight=useRef(false),heading=useRef<HTMLHeadingElement>(null)
 useEffect(()=>()=>{generation.current++},[])
 useEffect(()=>{if(committed)heading.current?.focus()},[committed])
 const incoming=JSON.stringify(comparisonSnapshot(filters)),previous=useRef(incoming)
 useEffect(()=>{if(previous.current!==incoming){previous.current=incoming;generation.current++;inFlight.current=false;setPending(false);setDraft(comparisonSnapshot(filters));setOpen(true);setError(null)}},[incoming,filters])
 function change(key:string,value:string){setDraft(d=>{const next={...d};if(value)next[key]=value;else delete next[key];const prefix=key.slice(0,2);if(key.endsWith('_province')){delete next[`${prefix}canton`];delete next[`${prefix}district`]}if(key.endsWith('_canton'))delete next[`${prefix}district`];if(key.includes('_characteristic_')&&key.endsWith('_type'))delete next[key.slice(0,-5)];return next})}
 async function compare(){if(inFlight.current)return;const snapshot=comparisonSnapshot(draft),ticket=++generation.current;inFlight.current=true;setPending(true);setError(null)
 try{const result=await executePriceMeterCohortComparison(snapshot,language);if(ticket!==generation.current)return
 if('invalidRequest' in result){setError('invalid');setValidationMessage(result.message);return}
 setCommitted({filters:{...snapshot,analysis_question:'cohort-comparison'},result,version:ticket});setOpen(false)
 const url=new URL(window.location.href);for(const key of comparisonKeys)url.searchParams.delete(key);for(const [k,v]of Object.entries(snapshot))if(v)url.searchParams.set(k,v);url.searchParams.set('analysis_question','cohort-comparison');window.history.replaceState(window.history.state,'',url)
 }catch{if(ticket===generation.current)setError('execution')}finally{if(ticket===generation.current){inFlight.current=false;setPending(false)}}}
 function shared(key:string,label:string,choices:[string,string][]){return <label>{label}<select aria-label={label} value={draft[key]??''} onChange={e=>change(key,e.target.value)}><option value="">{es?'Seleccionar (obligatorio)':'Select (required)'}</option>{choices.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>}
 return <article className={styles.summary} aria-label={cohortTitle[language]}><header className={styles.introduction}><p className={styles.eyebrow}>{es?'Precio por m²':'Price / m²'}</p><h2>{cohortTitle[language]}</h2><p className={styles.primaryQuestion}>{cohortQuestion[language]}</p></header>
 {committed&&<button type="button" className={styles.modify} aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)}>{es?'Modificar':'Modify'}</button>}
 <section id={id} hidden={!open} className={styles.inputs}><fieldset disabled={pending} className={styles.fieldset}><legend>{es?'Definir la comparación':'Define the comparison'}</legend><div className={controls.controls}>{shared('transaction_type',es?'Transacción':'Transaction',[['sale',es?'Venta':'Sale'],['rent',es?'Alquiler mensual':'Monthly Rent']])}{shared('property_basis',es?'Base de propiedad':'Property Basis',[['land_only',es?'Terreno vacío':'Vacant Land'],['improved_property',es?'Propiedad mejorada':'Improved Property']])}{shared('normalization_basis',es?'Denominador del precio por m²':'Price / m² denominator',[['land',es?'Área del terreno':'Property Area'],['construction',es?'Área de construcción':'Construction Area']])}</div>
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,350px),1fr))',gap:24}}><CohortEditor prefix="a" draft={draft} options={options} language={language} onChange={change}/><CohortEditor prefix="b" draft={draft} options={options} language={language} onChange={change}/></div>
 <div className={controls.controls}>{shared('reference_cohort',es?'Referencia porcentual':'Percentage reference',[['A',es?'Cohorte A':'Cohort A'],['B',es?'Cohorte B':'Cohort B']])}</div><p>{es?'La referencia determina el denominador del porcentaje. La diferencia mantiene la dirección A − B.':'The reference determines the percentage denominator. Difference keeps the A − B direction.'}</p>
 <details className={styles.optional}><summary>{es?'Revisar las definiciones seleccionadas':'Review selected definitions'}</summary><DraftCohortSummary draft={draft} options={options} language={language}/></details>
 <button type="button" className={styles.apply} disabled={pending} onClick={compare}>{pending?(es?'Comparando cohortes…':'Comparing cohorts…'):(es?'Comparar precio por m² entre cohortes':'Compare cohort Price / m²')}</button></fieldset></section>
 {error&&<p role="alert" className={styles.error}><strong>{error==='invalid'?(es?'Solicitud inválida. ':'Invalid request. '):(es?'Error de ejecución. ':'Execution failure. ')}</strong>{error==='invalid'?validationMessage:es?'La comparación no se completó. Revisa que ambas cohortes tengan geografía, tipo de propiedad, dos características distintas y al menos una restricción de área, además de la identidad y referencia compartidas. El resultado anterior se conserva.':'Comparison did not complete. Check both cohorts have geography, Property Type, two distinct characteristics and at least one area constraint, plus the shared identity and reference. The previous result is retained.'}</p>}
 {committed&&<section aria-live="polite" aria-busy={pending} data-cohort-result><h3 ref={heading} tabIndex={-1}>{es?'Comparación de cohortes':'Cohort comparison'}</h3><CohortEvidence result={committed.result} language={language}/><AnalysisActions key={committed.version} engineType="price-meter" language={language} filters={committed.filters} result={committed.result} defaultName={cohortTitle[language]}/></section>}
 </article>
}
