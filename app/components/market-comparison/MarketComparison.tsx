'use client'
import ResultSynthesis from '../ResultSynthesis'
import MarketComparisonResult from './MarketComparisonResult'
import {useEffect,useId,useRef,useState} from 'react'
import {executeMarketQuestion} from '@/lib/market-inventory-action'
import {saveMarketComparison,createMarketComparisonName} from '@/lib/market-comparisons'
import FilterSelect from '../market-filters/FilterSelect'
import {priceRangeOptions} from '../market-filters/options'
import {applyFilterChange,optionLabel,optionValue} from '../market-filters/utils'
import type {ExplorerOptions,Filters,Language} from '../market-filters/types'
import {summaryKeys,summarySnapshot,summaryIdentity,summaryLabel,summaryOptions,summaryOptionMatches,type SummaryKey} from '../market-summary/contract'
import {dimensionLabel} from '../market-composition/contract'
import {comparisonQuestion,pairWidths,type ComparisonResult,type ComparisonSide,type Metric} from './contract'
import shared from '../market-summary/workspace.module.css'
import styles from './comparison.module.css'
const keys=[...summaryKeys,'price_range'] as const
function side(filters:Filters,prefix:'a'|'b'):Filters{return Object.fromEntries(keys.filter(k=>filters[`${prefix}_${k}`]).map(k=>[k,filters[`${prefix}_${k}`]]))}
function prefixed(a:Filters,b:Filters):Filters{return Object.fromEntries([['a',a],['b',b]].flatMap(([p,f])=>keys.filter(k=>(f as Filters)[k]).map(k=>[`${p}_${k}`,(f as Filters)[k]])))}
type Commit={a:Filters;b:Filters;labels:string[][];result:ComparisonResult}
export default function MarketComparison({options,filters,language='en'}:{options:ExplorerOptions;filters:Filters;language?:Language}){
 const es=language==='es',id=useId(),market=(i:number)=>`${es?'Mercado':'Market'} ${i===0?'A':'B'}`
 const [a,setA]=useState(()=>side(filters,'a')),[b,setB]=useState(()=>side(filters,'b'))
 const [committed,setCommitted]=useState<Commit|null>(null),[expanded,setExpanded]=useState(true),[pending,setPending]=useState(false),[error,setError]=useState(''),[saveStatus,setSaveStatus]=useState('')
 const generation=useRef(0),busy=useRef(false),saving=useRef(false),heading=useRef<HTMLHeadingElement>(null),inputHeading=useRef<HTMLHeadingElement>(null)
 useEffect(()=>()=>{generation.current++},[])
 useEffect(()=>{if(committed)heading.current?.focus()},[committed])
 const identity=JSON.stringify(prefixed(side(filters,'a'),side(filters,'b'))),previous=useRef(identity)
 useEffect(()=>{if(previous.current!==identity){previous.current=identity;generation.current++;busy.current=false;setPending(false);setA(side(filters,'a'));setB(side(filters,'b'));setExpanded(true);setError('')}},[identity,filters])
 function labels(f:Filters){const values=summaryIdentity(summarySnapshot(f),options,language);if(f.price_range){const option=priceRangeOptions.find(o=>optionValue(o)===f.price_range);if(!option)throw Error('Unavailable range');values.push(`${es?'Rango de precio de oferta (CRC)':'Asking-price range (CRC)'}: ${optionLabel(option,language)}`)}return values}
 function field(key:typeof keys[number],index:number){
  const draft=index===0?a:b,set=index===0?setA:setB,choices=key==='price_range'?priceRangeOptions:summaryOptions(key,options,language,draft)
  const matches=(o:typeof choices[number],v:string)=>key==='price_range'?optionValue(o)===v:summaryOptionMatches(key,o,v)
  const selected=draft[key]?.split(',').map(v=>choices.find(o=>matches(o,v))),unavailable=selected?.some(o=>!o)
  const restored=unavailable?[{slug:draft[key],term_name:es?'Selección no disponible — selecciona de nuevo':'Selection unavailable — choose again'},...choices]:selected?.length&&!choices.some(o=>optionValue(o)===draft[key])?[{slug:draft[key],term_name:selected.map(o=>optionLabel(o!,language)).join(' / ')},...choices]:choices
  const label=key==='price_range'?(es?'Rango de precio de oferta (CRC)':'Asking-price range (CRC)'):summaryLabel(key,language)
  return <FilterSelect key={key} compact label={label} accessibleLabel={`${market(index)} · ${label}`} filterKey={key} options={restored} filters={draft} language={language} emptyLabel={es?'Sin restricción':'Any'} onFilterChange={(k,v)=>{set(current=>k==='accessibility'?{...current,[k]:v||undefined}:applyFilterChange(current,k,v));setError('')}}/>
 }
 async function apply(){if(busy.current)return;const left={...a},right={...b};let names:string[][];try{names=[labels(left),labels(right)]}catch{setError(es?'Revisa las selecciones no disponibles.':'Review unavailable input selections.');return}const ticket=++generation.current;busy.current=true;setPending(true);setError('');try{const result=await executeMarketQuestion('comparison',prefixed(left,right),language);if(ticket!==generation.current)return;if('access' in result){setError(es?'Inicia sesión con una cuenta que tenga acceso a este análisis mediante un Paquete de Inteligencia vigente.':'Sign in with an account that has access to this analysis through an active Intelligence Package.');return}setCommitted({a:left,b:right,labels:names,result:result as ComparisonResult});setExpanded(false);setSaveStatus('')}catch{if(ticket===generation.current)setError(es?'No se pudo completar la comparación. Se conserva el resultado anterior.':'Comparison could not be completed. The previous result is retained.')}finally{if(ticket===generation.current){busy.current=false;setPending(false)}}}
 async function save(){if(!committed||saving.current)return;saving.current=true;setSaveStatus('saving');const snapshot=committed,ticket=generation.current;try{const f=prefixed(snapshot.a,snapshot.b);await saveMarketComparison({name:createMarketComparisonName({filters:f,language}),filters:f,result:snapshot.result,language});if(ticket===generation.current)setSaveStatus(es?'Guardado':'Saved')}catch{if(ticket===generation.current)setSaveStatus(es?'No se pudo guardar':'Could not save')}finally{saving.current=false}}
 const number=new Intl.NumberFormat(es?'es-CR':'en-US',{maximumFractionDigits:2}),missing=es?'No establecido':'Not established'
 function pair(title:string,metric:Metric,formatted:(s:ComparisonSide)=>string|null,secondary?:(s:ComparisonSide)=>string|null){if(!committed)return null;const sides=[committed.result.left,committed.result.right],widths=pairWidths(sides[0].metrics?.[metric],sides[1].metrics?.[metric]);return <div className={styles.pair} data-metric={metric}><h5>{title}</h5><div className={styles.values}>{sides.map((s,i)=><div className={styles.value} key={i}><p>{market(i)}</p><strong>{formatted(s)??missing}</strong>{secondary&&secondary(s)&&<p>{secondary(s)}</p>}{widths[i]!==null&&<div className={styles.track} aria-hidden="true"><div className={styles.fill} data-value={s.metrics?.[metric]} style={{width:`${widths[i]}%`}}/></div>}</div>)}</div></div>}
 const sides=committed?[committed.result.left,committed.result.right]:[]
 const lens=(key:string,title:string,question:string,children:React.ReactNode)=><section className={styles.lens} aria-labelledby={`${id}-${key}`}><h3 id={`${id}-${key}`}>{title}</h3><p className={shared.sectionQuestion}>{question}</p>{children}</section>
 return <article className={shared.summary} aria-label={es?'Comparación de mercados':'Market Comparison'}>
  <header className={shared.introduction}><p className={shared.eyebrow}>{es?'Fundamentos del mercado':'Market fundamentals'}</p><h2>{es?'Comparación de mercados':'Market Comparison'}</h2><p className={shared.primaryQuestion}>{comparisonQuestion[language]}</p></header>
 {committed&&<ResultSynthesis engine={'comparison'} evidence={committed.result} language={language}/>}
  {committed&&<MarketComparisonResult id={id} pending={pending} part="identity" committed={committed} language={language} heading={heading} modify={<button className={shared.modify} style={{marginTop:16}} disabled={pending} aria-expanded={expanded} aria-controls={`${id}-inputs`} onClick={()=>{setExpanded(v=>!v);if(!expanded)requestAnimationFrame(()=>inputHeading.current?.focus())}}>{expanded?(es?'Cerrar edición':'Close editing'):(es?'Modificar':'Modify')}</button>}/>}
  <section id={`${id}-inputs`} className={shared.inputs} hidden={!expanded}><h3 tabIndex={-1} ref={inputHeading}>{es?'Definir los dos mercados':'Define both markets'}</h3><fieldset className={shared.fieldset} disabled={pending}><legend className={shared.srOnly}>{es?'Datos de comparación':'Comparison inputs'}</legend><div className={styles.markets}>{[0,1].map(i=><section className={styles.market} key={i} aria-label={`${market(i)} ${es?'datos':'inputs'}`}><h3>{market(i)}</h3><div className={shared.inputGrid}>{summaryKeys.slice(0,5).map(k=>field(k,i))}{field('price_range',i)}</div><details className={shared.optional}><summary>{es?'Características y medidas opcionales':'Optional characteristics and measurements'}</summary><div className={shared.inputGrid}>{summaryKeys.slice(5).map(k=>field(k,i))}</div></details></section>)}</div><button className={shared.apply} style={{marginTop:20}} onClick={apply} disabled={pending}>{pending?(es?'Comparando…':'Comparing…'):(es?'Comparar mercados':'Compare markets')}</button></fieldset></section>
  {pending&&<p role="status">{es?'Comparando los mercados…':'Comparing markets…'}</p>}{error&&<p role="alert" className={shared.error}>{error}</p>}
  {committed&&<MarketComparisonResult id={id} pending={pending} part="result" committed={committed} language={language} heading={heading} actions={<div className={styles.save}><button className={shared.modify} disabled={saveStatus==='saving'||pending} onClick={save}>{es?'Guardar comparación':'Save comparison'}</button><p role="status">{saveStatus==='saving'?(es?'Guardando…':'Saving…'):saveStatus}</p></div>}/>}
 </article>
}
