'use client'
import {useEffect,useId,useRef,useState} from 'react'
import {executePriceMeterApply} from '@/lib/price-meter-apply-action'
import {validatePriceMeterApply} from '@/lib/price-meter-apply-contract'
import {summaryKeys,summaryOptions,summaryLabel,summaryIdentity,summarySnapshot} from '../market-summary/contract'
import {applyFilterChange} from '../market-filters/utils'
import type {ExplorerOptions,Filters} from '../market-filters/types'
import FilterSelect from '../market-filters/FilterSelect'
import AnalysisActions from '../AnalysisActions'
import SizeEvidence from './SizeEvidence'
import {sizeQuestion,type SizeMode,type SizeContext,type SizeEvidence as Evidence} from './contract'
import styles from '../market-summary/workspace.module.css'
import controls from '../price-meter-distribution/distribution.module.css'

export default function SizeWorkspace({options,filters,language,source,initialMode}:{options:ExplorerOptions;filters:Filters;language:'en'|'es';source:'workspace'|'standalone';initialMode:SizeMode}){
 const es=language==='es',id=useId(),title=es?'Tamaño → Precio por m²':'Size → Price / m²'
 const [draft,setDraft]=useState(()=>summarySnapshot(filters)),[mode,setMode]=useState<SizeMode>(initialMode)
 const [open,setOpen]=useState(true),[pending,setPending]=useState(false),[error,setError]=useState(false)
 const [committed,setCommitted]=useState<{version:number;filters:Filters;labels:string[];result:Awaited<ReturnType<typeof executePriceMeterApply>>;context:SizeContext;evidence:Evidence}|null>(null)
 const generation=useRef(0),inFlight=useRef(false),heading=useRef<HTMLHeadingElement>(null)
 useEffect(()=>()=>{generation.current++},[])
 useEffect(()=>{if(committed)heading.current?.focus()},[committed])
 const incoming=JSON.stringify([filters,initialMode]),previous=useRef(incoming)
 useEffect(()=>{if(previous.current!==incoming){previous.current=incoming;generation.current++;inFlight.current=false;setPending(false);setDraft(summarySnapshot(filters));setMode(initialMode);setOpen(true);setError(false)}},[incoming,filters,initialMode])
 async function apply(){if(inFlight.current)return;let snapshot:Filters,labels:string[]
 try{snapshot=validatePriceMeterApply(draft);labels=summaryIdentity(snapshot,options,language)}catch{setError(true);return}
 const ticket=++generation.current;inFlight.current=true;setPending(true);setError(false)
 try{const result=await executePriceMeterApply(snapshot,language,source,[mode]);if(ticket!==generation.current)return
 const context=result.sizeContext as SizeContext|undefined,intelligence='saleIntelligence'in result?result.saleIntelligence:result.rentIntelligence
 const values=Object.values(intelligence.sizeRelationships) as Evidence[]
 if(!context||context.mode!==mode||context.transactionType!==snapshot.transaction_type||values.length!==1)throw Error('Invalid size response')
 setCommitted({version:ticket,filters:{...snapshot,analysis_question:mode},labels,result,context,evidence:values[0]});setOpen(false)
 }catch{if(ticket===generation.current)setError(true)}finally{if(ticket===generation.current){inFlight.current=false;setPending(false)}}}
 function field(key:typeof summaryKeys[number]){return <FilterSelect key={key} compact label={summaryLabel(key,language)} filterKey={key} options={summaryOptions(key,options,language,draft)} filters={draft} language={language} onFilterChange={(k,v)=>setDraft(d=>k==='accessibility'?{...d,[k]:v||undefined}:applyFilterChange(d,k,v))} emptyLabel={['transaction_type','property_type','province','canton'].includes(key)?(es?'Seleccionar (obligatorio)':'Select (required)'):(es?'Sin restricción':'Unrestricted')}/>}
 const c=committed?.context
 const sizeLabel=(m:SizeMode)=>m==='property-area'?(es?'Área del terreno':'Property Area'):(es?'Área de construcción':'Construction Area')
 return <article className={styles.summary} aria-label={title}>
 <header className={styles.introduction}><p className={styles.eyebrow}>{es?'Precio por m²':'Price / m²'}</p><h2>{title}</h2><p className={styles.primaryQuestion}>{sizeQuestion[language]}</p></header>
 {committed&&c&&<div className={styles.identity}><div><p className={styles.eyebrow}>{es?'Definición del mercado':'Market definition'}</p><ul>{committed.labels.map((s,i)=><li key={i}>{s}</li>)}</ul><p className={styles.eyebrow}>{es?'Definición del tamaño':'Size definition'}</p><p data-size-identity>{sizeLabel(c.mode)} · m²</p><p className={styles.eyebrow}>{es?'Definición del precio por m²':'Price / m² definition'}</p><p>{es?'Propiedad con construcción':'Improved Property'} · {es?`CRC / m² de ${c.normalizationBasis==='land'?'terreno':'construcción'}`:`CRC / ${c.normalizationBasis==='land'?'land':'construction'} m²`} · {c.transactionType==='rent'?(es?'Precio de oferta mensual de alquiler':'Monthly rental asking price'):(es?'Precio de oferta de venta':'Sale asking price')}</p><p>{es?'Fecha analítica':'Analytical date'}: {c.analyticalDate}. {c.fx?`${c.fx.source} USD → CRC: ${c.fx.rate} · ${es?'Referencia de venta':'Reference sale'} · ${c.fx.effectiveDate}`:(es?'Sin conversión USD en el contexto adquirido.':'No USD conversion in the acquired context.')}</p></div><button type="button" className={styles.modify} disabled={pending} aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)}>{es?'Modificar':'Modify'}</button></div>}
 <section id={id} hidden={!open} className={styles.inputs}><fieldset disabled={pending} className={styles.fieldset}><legend>{es?'Definir el mercado':'Define the market'}</legend><div className={styles.inputGrid}>{summaryKeys.slice(0,5).map(field)}</div><details className={styles.optional}><summary>{es?'Restricciones opcionales':'Optional constraints'}</summary><p>{es?'Los rangos de área restringen el mercado; no cambian la dimensión de tamaño analizada.':'Area ranges constrain the market; they do not change the analyzed size dimension.'}</p><div className={styles.inputGrid}>{summaryKeys.slice(5).map(field)}</div></details>
 <div className={controls.controls}><label>{es?'Análisis de tamaño':'Size analysis'}<select aria-label={es?'Análisis de tamaño':'Size analysis'} value={mode} onChange={e=>setMode(e.target.value as SizeMode)}><option value="property-area">{sizeLabel('property-area')}</option><option value="construction-area">{sizeLabel('construction-area')}</option></select></label></div><p>{es?'Propiedad con construcción. El precio por m² usa el área exacta seleccionada como denominador.':'Improved Property. Price / m² uses the selected exact area as its denominator.'}</p><button type="button" className={styles.apply} disabled={pending} onClick={apply}>{pending?(es?'Analizando…':'Analyzing…'):(es?'Analizar tamaño y precio por m²':'Analyze Size → Price / m²')}</button></fieldset></section>
 {error&&<p role="alert" className={styles.error}>{es?'Revisa las entradas. No se pudo completar el análisis; el resultado anterior se conserva.':'Check inputs. Analysis could not complete; the previous result is retained.'}</p>}
 {committed&&c&&<div aria-live="polite" aria-busy={pending} data-size-result><h3 ref={heading} tabIndex={-1}>{sizeLabel(c.mode)} → {es?'Precio por m²':'Price / m²'}</h3><SizeEvidence context={c} evidence={committed.evidence} language={language}/><AnalysisActions key={committed.version} engineType="price-meter" language={language} filters={committed.filters} result={committed.result} defaultName={title}/></div>}
 </article>
}
