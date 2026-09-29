'use client'
import {useEffect,useId,useRef,useState} from 'react'
import {executePriceMeterApply} from '@/lib/price-meter-apply-action'
import {validatePriceMeterApply} from '@/lib/price-meter-apply-contract'
import {summaryKeys,summaryOptions,summaryLabel,summaryIdentity,summarySnapshot} from '../market-summary/contract'
import {applyFilterChange} from '../market-filters/utils'
import type {ExplorerOptions,Filters} from '../market-filters/types'
import FilterSelect from '../market-filters/FilterSelect'
import AnalysisActions from '../AnalysisActions'
import ConstructionLandEvidence from './ConstructionLandEvidence'
import {constructionLandQuestion,type Normalization,type Context,type ConstructionLandEvidence as Evidence} from './contract'
import styles from '../market-summary/workspace.module.css'
import controls from '../price-meter-distribution/distribution.module.css'

export default function ConstructionLandWorkspace({options,filters,language,source}:{options:ExplorerOptions;filters:Filters;language:'en'|'es';source:'workspace'|'standalone'}){
 const es=language==='es',id=useId(),title=es?'Construcción/terreno → Precio por m²':'Construction-to-Land → Price / m²'
 const [draft,setDraft]=useState(()=>summarySnapshot(filters)),[mode,setMode]=useState<Normalization|''>(filters.cl_normalization==='land'||filters.cl_normalization==='construction'?filters.cl_normalization:'')
 const [open,setOpen]=useState(true),[pending,setPending]=useState(false),[error,setError]=useState(false)
 const [committed,setCommitted]=useState<{version:number;filters:Filters;labels:string[];result:Awaited<ReturnType<typeof executePriceMeterApply>>;context:Context;evidence:Evidence}|null>(null)
 const generation=useRef(0),inFlight=useRef(false),heading=useRef<HTMLHeadingElement>(null)
 useEffect(()=>()=>{generation.current++},[])
 useEffect(()=>{if(committed)heading.current?.focus()},[committed])
 const incoming=JSON.stringify([filters]),previous=useRef(incoming)
 useEffect(()=>{if(previous.current!==incoming){previous.current=incoming;generation.current++;inFlight.current=false;setPending(false);setDraft(summarySnapshot(filters));setMode(filters.cl_normalization==='land'||filters.cl_normalization==='construction'?filters.cl_normalization:'');setOpen(true);setError(false)}},[incoming,filters])
 async function apply(){if(inFlight.current)return;let snapshot:Filters,labels:string[]
 try{if(mode!=='land'&&mode!=='construction')throw Error('Select normalization');snapshot=validatePriceMeterApply(draft);labels=summaryIdentity(snapshot,options,language)}catch{setError(true);return}
 const ticket=++generation.current;inFlight.current=true;setPending(true);setError(false)
 try{const result=await executePriceMeterApply(snapshot,language,source,['construction-land'],undefined,undefined,mode);if(ticket!==generation.current)return
 const evidence=result.constructionLandResult as Evidence|undefined,context=evidence?.context
 if(!context||context.normalizationBasis!==mode||context.transactionType!==snapshot.transaction_type)throw Error('Invalid C/L response')
 setCommitted({version:ticket,filters:{...snapshot,analysis_question:'construction-land',cl_normalization:mode},labels,result,context,evidence:evidence!});setOpen(false)
 const url=new URL(window.location.href);for(const key of summaryKeys)url.searchParams.delete(key);for(const [key,value]of Object.entries(snapshot))if(value)url.searchParams.set(key,value);url.searchParams.set('analysis_question','construction-land');url.searchParams.set('cl_normalization',mode);window.history.replaceState(window.history.state,'',url)
 }catch{if(ticket===generation.current)setError(true)}finally{if(ticket===generation.current){inFlight.current=false;setPending(false)}}}
 function field(key:typeof summaryKeys[number]){return <FilterSelect key={key} compact label={summaryLabel(key,language)} filterKey={key} options={summaryOptions(key,options,language,draft)} filters={draft} language={language} onFilterChange={(k,v)=>setDraft(d=>k==='accessibility'?{...d,[k]:v||undefined}:applyFilterChange(d,k,v))} emptyLabel={['transaction_type','property_type','province','canton'].includes(key)?(es?'Seleccionar (obligatorio)':'Select (required)'):(es?'Sin restricción':'Unrestricted')}/>}
 const c=committed?.context
 const basisLabel=(m:Normalization)=>m==='land'?(es?'Área del terreno':'Property Area'):(es?'Área de construcción':'Construction Area')
 return <article className={styles.summary} aria-label={title}>
 <header className={styles.introduction}><p className={styles.eyebrow}>{es?'Precio por m²':'Price / m²'}</p><h2>{title}</h2><p className={styles.primaryQuestion}>{constructionLandQuestion[language]}</p></header>
 {committed&&c&&<div className={styles.identity}><div><p className={styles.eyebrow}>{es?'Definición del mercado':'Market definition'}</p><ul>{committed.labels.map((s,i)=><li key={i}>{s}</li>)}</ul><p className={styles.eyebrow}>{es?'Definición de construcción/terreno':'Construction-to-Land definition'}</p><p data-cl-identity>{es?'Área exacta de construcción ÷ área exacta del terreno':'Exact Construction Area ÷ Exact Property Area'}</p><p className={styles.eyebrow}>{es?'Definición del precio por m²':'Price / m² definition'}</p><p>{es?'Propiedad con construcción':'Improved Property'} · {es?`CRC / m² de ${c.normalizationBasis==='land'?'terreno':'construcción'}`:`CRC / ${c.normalizationBasis==='land'?'land':'construction'} m²`} · {c.transactionType==='rent'?(es?'Precio de oferta mensual de alquiler':'Monthly rental asking price'):(es?'Precio de oferta de venta':'Sale asking price')}</p><p>{es?'Fecha analítica':'Analytical date'}: {c.analyticalDate}. {c.fx?`${c.fx.source} USD → CRC: ${c.fx.rate} · ${es?'Referencia de venta':'Reference sale'} · ${c.fx.effectiveDate}`:(es?'Sin conversión USD en el contexto adquirido.':'No USD conversion in the acquired context.')}</p></div><button type="button" className={styles.modify} disabled={pending} aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)}>{es?'Modificar':'Modify'}</button></div>}
 <section id={id} hidden={!open} className={styles.inputs}><fieldset disabled={pending} className={styles.fieldset}><legend>{es?'Definir el mercado':'Define the market'}</legend><div className={styles.inputGrid}>{summaryKeys.slice(0,5).map(field)}</div><details className={styles.optional}><summary>{es?'Restricciones opcionales':'Optional constraints'}</summary><p>{es?'Los rangos de área restringen el mercado; no proporcionan mediciones exactas para la relación.':'Area ranges constrain the market; they do not provide exact measurements for the ratio.'}</p><div className={styles.inputGrid}>{summaryKeys.slice(5).map(field)}</div></details>
 <p>{es?'Construcción/terreno = área exacta de construcción ÷ área exacta del terreno. No representa cobertura del suelo ni huella del edificio.':'Construction-to-Land = exact Construction Area ÷ exact Property Area. It does not represent site coverage or building footprint.'}</p><div className={controls.controls}><label>{es?'Base del precio por m²':'Price / m² basis'}<select aria-label={es?'Base del precio por m²':'Price / m² basis'} value={mode} onChange={e=>setMode(e.target.value as Normalization)}><option value="">{es?'Seleccionar (obligatorio)':'Select (required)'}</option><option value="land">{basisLabel('land')}</option><option value="construction">{basisLabel('construction')}</option></select></label></div><p>{es?'Propiedad con construcción. El precio por m² usa el área exacta seleccionada como denominador.':'Improved Property. Price / m² uses the selected exact area as its denominator.'}</p><button type="button" className={styles.apply} disabled={pending} onClick={apply}>{pending?(es?'Analizando…':'Analyzing…'):(es?'Analizar construcción/terreno y precio por m²':'Analyze Construction-to-Land → Price / m²')}</button></fieldset></section>
 {error&&<p role="alert" className={styles.error}>{es?'Revisa las entradas. No se pudo completar el análisis; el resultado anterior se conserva.':'Check inputs. Analysis could not complete; the previous result is retained.'}</p>}
 {committed&&c&&<div aria-live="polite" aria-busy={pending} data-cl-result><h3 ref={heading} tabIndex={-1}>{title} · {basisLabel(c.normalizationBasis)}</h3><ConstructionLandEvidence evidence={committed.evidence} language={language}/><AnalysisActions key={committed.version} engineType="price-meter" language={language} filters={committed.filters} result={committed.result} defaultName={title}/></div>}
 </article>
}
