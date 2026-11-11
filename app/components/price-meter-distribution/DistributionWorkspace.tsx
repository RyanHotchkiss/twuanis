'use client'
import ResultSynthesis from '../ResultSynthesis'
import DistributionResult from './DistributionResult'
import {commitConfiguration} from '@/lib/measurement/analytical'
import {useEffect,useId,useRef,useState} from 'react'
import {measuredPriceMeterApply} from '@/lib/measurement/actions'
import {serverSignal} from '@/lib/measurement/runtime'
import {validatePriceMeterApply} from '@/lib/price-meter-apply-contract'
import {validateDistributionIdentity} from '@/lib/price-meter-selected-contract'
import {summaryKeys,summaryOptions,summaryLabel,summaryIdentity,summarySnapshot} from '../market-summary/contract'
import {applyFilterChange} from '../market-filters/utils'
import type {ExplorerOptions,Filters} from '../market-filters/types'
import FilterSelect from '../market-filters/FilterSelect'
import AnalysisActions from '../AnalysisActions'
import {distributionQuestion,type DistributionEvidence,type DistributionContext} from './contract'
import styles from '../market-summary/workspace.module.css'
import chart from './distribution.module.css'
export default function DistributionWorkspace({options,filters,language,source}:{options:ExplorerOptions;filters:Filters;language:'en'|'es';source:'workspace'|'standalone'}){
 const es=language==='es',id=useId(),title=es?'Distribución del precio por m²':'Price / m² Distribution'
 const [draft,setDraft]=useState(()=>summarySnapshot(filters)),[basis,setBasis]=useState(filters.property_basis??''),[normalization,setNormalization]=useState(filters.normalization_basis??'')
 const [open,setOpen]=useState(true),[pending,setPending]=useState(false),[error,setError]=useState(false)
 const [committed,setCommitted]=useState<{filters:Filters;labels:string[];result:Awaited<ReturnType<typeof measuredPriceMeterApply>>;context:DistributionContext;evidence:DistributionEvidence}|null>(null)
 const generation=useRef(0),inFlight=useRef(false),heading=useRef<HTMLHeadingElement>(null)
 useEffect(()=>()=>{generation.current++},[])
 useEffect(()=>{if(committed)heading.current?.focus()},[committed])
 const incoming=JSON.stringify(filters),previous=useRef(incoming)
 useEffect(()=>{if(previous.current!==incoming){previous.current=incoming;generation.current++;inFlight.current=false;setPending(false);setDraft(summarySnapshot(filters));setBasis(filters.property_basis??'');setNormalization(filters.normalization_basis??'');setOpen(true);setError(false)}},[incoming,filters])
 async function apply(){if(inFlight.current)return;let snapshot:Filters,labels:string[],identity:ReturnType<typeof validateDistributionIdentity>
 try{snapshot=validatePriceMeterApply(draft);labels=summaryIdentity(snapshot,options,language);identity=validateDistributionIdentity({propertyBasis:basis,normalizationBasis:normalization})}catch{setError(true);return}
 const ticket=++generation.current;inFlight.current=true;setPending(true);setError(false)
 try{commitConfiguration('distribution',language,'s7b2558f6f95fd1f732461736b2f19fe528a8ba0aa942d4f96fe88a59e1616a4b');const result=await measuredPriceMeterApply([snapshot,language,source,['distribution'],identity],serverSignal(language))
 if(ticket!==generation.current)return
 const context=result.distributionContext as DistributionContext
 const intelligence='saleIntelligence' in result?result.saleIntelligence:result.rentIntelligence
 const values=Object.values(intelligence.distributions) as DistributionEvidence[]
 if(values.length!==1||!context||context.propertyBasis!==identity.propertyBasis||context.normalizationBasis!==identity.normalizationBasis||context.transactionType!==snapshot.transaction_type)throw Error('Invalid distribution response')
 setCommitted({filters:{...snapshot,property_basis:identity.propertyBasis,normalization_basis:identity.normalizationBasis},labels,result,context,evidence:values[0]});setOpen(false)
 }catch{if(ticket===generation.current)setError(true)}finally{if(ticket===generation.current){inFlight.current=false;setPending(false)}}}
 const nf=new Intl.NumberFormat(es?'es-CR':'en-US',{minimumFractionDigits:2,maximumFractionDigits:2}),integer=new Intl.NumberFormat(es?'es-CR':'en-US')
 function field(key:typeof summaryKeys[number]){return <FilterSelect key={key} compact label={summaryLabel(key,language)} filterKey={key} options={summaryOptions(key,options,language,draft)} filters={draft} language={language} onFilterChange={(k,v)=>setDraft(d=>k==='accessibility'?{...d,[k]:v||undefined}:applyFilterChange(d,k,v))} emptyLabel={['transaction_type','property_type','province','canton'].includes(key)?(es?'Seleccionar (obligatorio)':'Select (required)'):(es?'Sin restricción':'Unrestricted')}/>}
 const valueText=(v:number)=>v>0&&v<0.005?new Intl.NumberFormat(es?'es-CR':'en-US',{maximumSignificantDigits:4}).format(v):nf.format(v)
 const c=committed?.context,d=committed?.evidence
 const unit=c?(es?`CRC / m² de ${c.normalizationBasis==='land'?'terreno':'construcción'}`:`CRC / ${c.normalizationBasis==='land'?'land':'construction'} m²`):''
 const stats=d?[['minimum',es?'Mínimo observado':'Observed minimum'],['p10','P10'],['p25','P25'],['median',es?'Mediana':'Median'],['p75','P75'],['p90','P90'],['maximum',es?'Máximo observado':'Observed maximum']]as const:[]
 return <article className={styles.summary} aria-label={title}>
 <header className={styles.introduction}><p className={styles.eyebrow}>{es?'Precio por m²':'Price / m²'}</p><h2>{title}</h2><p className={styles.primaryQuestion}>{distributionQuestion[language]}</p></header>
 {committed&&<ResultSynthesis engine={'distribution'} evidence={committed} language={language}/>}
 {committed&&c&&<DistributionResult pending={pending} part="identity" committed={committed} language={language} heading={heading} modify={<button type="button" className={styles.modify} aria-expanded={open} aria-controls={id} disabled={pending} onClick={()=>setOpen(!open)}>{es?'Modificar':'Modify'}</button>}/>}
 <section id={id} hidden={!open} className={styles.inputs}><fieldset disabled={pending} className={styles.fieldset}><legend>{es?'Definir el mercado':'Define the market'}</legend><p>{es?'Transacción, tipo de propiedad, provincia y cantón son obligatorios.':'Transaction, Property Type, Province and Canton are required.'}</p><div className={styles.inputGrid}>{summaryKeys.slice(0,5).map(field)}</div><details className={styles.optional}><summary>{es?'Restricciones opcionales':'Optional constraints'}</summary><div className={styles.inputGrid}>{summaryKeys.slice(5).map(field)}</div></details>
 <h3>{es?'Definir precio por m²':'Define Price / m²'}</h3><div className={`${styles.inputGrid} ${chart.controls}`}><label>{es?'Base de propiedad':'Property Basis'}<select aria-label={es?'Base de propiedad':'Property Basis'} value={basis} onChange={e=>{setBasis(e.target.value);setNormalization(e.target.value==='land_only'?'land':'')}}><option value="">{es?'Seleccionar':'Select'}</option><option value="land_only">{es?'Terreno sin construcción':'Vacant Land'}</option><option value="improved_property">{es?'Propiedad con construcción':'Improved Property'}</option></select></label>{basis==='land_only'?<p>{es?'Normalización: área del terreno (única opción válida).':'Normalization: Land Area (only valid choice).'}</p>:basis==='improved_property'?<label>{es?'Normalización':'Normalization'}<select aria-label={es?'Normalización':'Normalization'} value={normalization} onChange={e=>setNormalization(e.target.value)}><option value="">{es?'Seleccionar':'Select'}</option><option value="land">{es?'Área del terreno':'Land Area'}</option><option value="construction">{es?'Área de construcción':'Construction Area'}</option></select></label>:null}</div><button type="button" className={styles.apply} disabled={pending} onClick={apply}>{pending?(es?'Analizando…':'Analyzing…'):(es?'Analizar distribución del precio por m²':'Analyze Price / m² Distribution')}</button></fieldset></section>
 {error&&<p role="alert" className={styles.error}>{es?'Revisa las entradas requeridas. No se pudo completar el análisis; el resultado anterior se conserva.':'Check required inputs. Analysis could not complete; the previous result is retained.'}</p>}
 {committed&&c&&d&&<DistributionResult pending={pending} part="result" committed={committed} language={language} heading={heading} actions={<AnalysisActions engineType="price-meter" language={language} filters={{...committed.filters,analysis_question:'distribution'}} result={committed.result} defaultName={title}/>}/>}
 </article>
}
