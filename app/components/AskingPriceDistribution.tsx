"use client"
import {useHubUniverse} from './HubUniverseContext'
import ResultSynthesis from './ResultSynthesis'
import {AskingPriceResult,words,statisticKeys,areaLabels,constraintText} from './AskingPriceResult'
import { useEffect, useId, useRef, useState } from 'react'
import {measuredAskingPrice as analyzeAskingPrice} from '@/lib/measurement/actions'
import {serverSignal} from '@/lib/measurement/runtime'
import {commitConfiguration} from '@/lib/measurement/analytical'
import {validateQuestion} from '@/lib/asking-price-question'
import { FACTS, SEMANTICS, type Catalog, type Constraint, type Fact, type Option, type Question, type Result } from '@/lib/asking-price-contract'
import { PROPERTY_AREA_RANGE_OPTIONS, CONSTRUCTION_AREA_RANGE_OPTIONS } from '@/lib/market-intelligence-area-ranges'
import styles from './AskingPriceDistribution.module.css'
import shared from './market-summary/workspace.module.css'
type Lang='en'|'es'




type FactDraft = {kind:'exact'|'interval'|'category';value:string;lower:string;upper:string;li:boolean;ui:boolean}
const emptyDraft = (kind:FactDraft['kind']='exact'):FactDraft => ({kind,value:'',lower:'',upper:'',li:true,ui:false})
const emptyDrafts = () => Object.fromEntries(FACTS.map(d=>[d,emptyDraft()])) as Record<Fact,FactDraft>
function pendingConstraint(draft:FactDraft):Constraint|null {
 if(draft.kind==='interval')return draft.lower!==''||draft.upper!==''?{kind:'interval',interval:{lower:draft.lower===''?null:draft.lower,upper:draft.upper===''?null:draft.upper,lowerInclusive:draft.lower!==''&&draft.li,upperInclusive:draft.upper!==''&&draft.ui}}:null
 return draft.value===''?null:draft.kind==='exact'?{kind:'exact',value:draft.value}:{kind:'category',termId:draft.value}
}
function validateConstraints(dimension:Fact,values:Constraint[],options:Option[]):Constraint[] {
 // Reuse the authoritative parser for field validation only. This well-formed
 // envelope does not resolve geography, acquire a population or run an engine.
 const checked=validateQuestion({version:1,transaction:'sale',geography:{level:'province',officialCode:'1'},filters:{semantics:{},facts:{[dimension]:values}}}).filters.facts[dimension]??[]
 if(checked.some(c=>c.kind==='category'&&!options.some(o=>o.type===dimension&&o.id===c.termId)))throw Error('Unavailable category')
 return checked
}
function mergedConstraints(dimension:Fact,values:Constraint[],draft:FactDraft,options:Option[]):Constraint[] {
 const added=validateConstraints(dimension,values,options),candidate=pendingConstraint(draft)
 const pending=candidate?validateConstraints(dimension,[candidate],options):[]
 const unique=[...new Set([...added,...pending].map(c=>JSON.stringify(c)))].map(c=>JSON.parse(c) as Constraint)
 return validateConstraints(dimension,unique,options)
}
function fieldMessage(dimension:Fact,draft:FactDraft,lang:Lang) {
 const name=words[lang][dimension]
 return lang==='en'?`${name}: enter a valid ${draft.kind==='exact'?'exact value':draft.kind==='interval'?'range with valid values, order and included boundaries':'available recorded category'}.`:`${name}: ingrese ${draft.kind==='exact'?'un valor exacto válido':draft.kind==='interval'?'un rango con valores, orden y límites incluidos válidos':'una categoría registrada disponible'}.`
}
function FactEditor({dimension,options,lang,values,onChange,draft,onDraft,add,error}:{dimension:Fact;options:Option[];lang:Lang;values:Constraint[];onChange:(c:Constraint[])=>void;draft:FactDraft;onDraft:(d:FactDraft)=>void;add:()=>void;error?:string}){
 const w=words[lang],errorId=useId(),labels=Object.fromEntries(options.map(o=>[o.id,o]))
 return <fieldset className={styles.fact} aria-invalid={!!error} aria-describedby={error?errorId:undefined}><legend>{w[dimension]}</legend><label>{lang==='en'?'Evidence form':'Forma de evidencia'}<select value={draft.kind} onChange={e=>onDraft(emptyDraft(e.target.value as FactDraft['kind']))}>{(['exact','interval','category'] as const).map(k=><option key={k} value={k}>{w[k]}</option>)}</select></label>
 {draft.kind==='category'?<label>{w.category}<select value={draft.value} onChange={e=>onDraft({...draft,value:e.target.value})}><option value="">{w.choose}</option>{options.map(o=><option key={o.id} value={o.id}>{o[lang]}</option>)}</select></label>:draft.kind==='exact'?<label>{w.exact}<input inputMode="decimal" value={draft.value} onChange={e=>onDraft({...draft,value:e.target.value})}/></label>:<>{(['lower','upper'] as const).map(key=><div key={key}><label>{w[key]}<input inputMode="decimal" placeholder={w.unbounded} value={draft[key]} onChange={e=>onDraft({...draft,[key]:e.target.value})}/></label><label className={styles.check}><input type="checkbox" checked={draft[key==='lower'?'li':'ui']} onChange={e=>onDraft({...draft,[key==='lower'?'li':'ui']:e.target.checked})}/>{w.include}</label></div>)}</>}
 <button type="button" disabled={values.length>=64||pendingConstraint(draft)===null} onClick={add}>{w.add}</button>
 {error&&<p id={errorId} role="alert" className={shared.error}>{error}</p>}
 <ul>{values.map((c,i)=><li key={i}>{constraintText(c,labels,lang)} <button type="button" onClick={()=>onChange(values.filter((_,j)=>j!==i))} aria-label={`${w.remove} ${w[dimension]} ${i+1}`}>{w.remove}</button></li>)}</ul></fieldset>
}

export default function AskingPriceDistribution({lang,catalog}:{lang:Lang;catalog:Catalog}){
 const universe=useHubUniverse()
 const w=words[lang],[transaction,setTransaction]=useState<''|'sale'|'rent'>(universe?(universe==='RENT'?'rent':'sale'):''),[level,setLevel]=useState<Question['geography']['level']>('province'),[geo,setGeo]=useState(''),[propertyType,setPropertyType]=useState(''),[filters,setFilters]=useState<Question['filters']>({semantics:{},facts:{}}),[result,setResult]=useState<Result|null>(null),[pending,setPending]=useState(false),[failure,setFailure]=useState(''),[expanded,setExpanded]=useState(true)
 const [drafts,setDrafts]=useState(emptyDrafts),[fieldErrors,setFieldErrors]=useState<Partial<Record<Fact,string>>>({})
 const inputId=useId(),container=useRef<HTMLElement>(null)
 useEffect(()=>{if(result)container.current?.querySelector<HTMLElement>('[data-result-heading]')?.focus()},[result])
 const active=useRef(false),generation=useRef(0);useEffect(()=>()=>{generation.current++},[])
 const options=catalog.state==='ready'?catalog.options:[]
 function editDraft(d:Fact,draft:FactDraft){setDrafts(current=>({...current,[d]:draft}));setFieldErrors(current=>({...current,[d]:undefined}))}
 function addConstraint(d:Fact){
  try{const cs=mergedConstraints(d,filters.facts[d]??[],drafts[d],options);setFilters(f=>({...f,facts:{...f.facts,[d]:cs}}));editDraft(d,emptyDraft(drafts[d].kind))}
  catch{setFieldErrors(current=>({...current,[d]:fieldMessage(d,drafts[d],lang)}))}
 }
 async function submit(e:React.FormEvent){
  e.preventDefault();if(active.current)return
  setFailure('')
  const snapshot=structuredClone(filters),errors:Partial<Record<Fact,string>>={}
  for(const d of FACTS){
   try{const cs=mergedConstraints(d,snapshot.facts[d]??[],drafts[d],options);if(cs.length)snapshot.facts[d]=cs;else delete snapshot.facts[d]}
   catch{errors[d]=fieldMessage(d,drafts[d],lang)}
  }
  setFieldErrors(errors)
  if(Object.keys(errors).length){setExpanded(true);return}
  let question:Question
  try{question=validateQuestion({version:1,transaction,geography:{level,officialCode:geo},...(propertyType?{propertyType}:{}),filters:snapshot})}
  catch{setFailure(w.invalid);return}
  active.current=true;setPending(true);const run=++generation.current
  try{
   const response=await (commitConfiguration('market-asking-price-distribution',lang,'s488b7673a686d9c2851ce18ccfe4631329e3befa44c13e99b55af1dc88dd1fdf'),analyzeAskingPrice(question,serverSignal(lang)))
   if(run!==generation.current)return
   if(response.ok){
    setResult(response.result);setFilters(structuredClone(response.result.question.filters))
    setDrafts(current=>Object.fromEntries(FACTS.map(d=>[d,emptyDraft(current[d].kind)])) as Record<Fact,FactDraft>)
    setExpanded(false)
   }else setFailure(response.code==='invalid_question'?w.invalid:w.failure)
  }catch{if(run===generation.current)setFailure(w.failure)}
  finally{if(run===generation.current){active.current=false;setPending(false)}}
 }

 return <article ref={container} className={`${styles.engine} ${shared.summary}`} aria-label={w.name}><header className={shared.introduction}><p className={shared.eyebrow}>{lang==='en'?'Market fundamentals':'Fundamentos del mercado'}</p><h2>{w.name}</h2><p className={shared.primaryQuestion}>{w.primary}</p></header>
 {result&&<ResultSynthesis engine={'market-asking-price-distribution'} evidence={result} language={lang}/>}
 {catalog.state!=='ready'?<p role="alert">{w.catalog}</p>:<form id={inputId} hidden={!expanded} className={shared.inputs} onSubmit={submit}><h3>{result?(lang==='en'?'Modify market':'Modificar mercado'):(lang==='en'?'Define the market':'Definir el mercado')}</h3><fieldset disabled={pending} className={shared.fieldset}><legend className={shared.srOnly}>{lang==='en'?'Market inputs':'Datos del mercado'}</legend><div className={styles.controls}>
 <label>{w.transaction}<select disabled={!!universe} required value={transaction} onChange={e=>setTransaction(e.target.value as typeof transaction)}><option value="">{w.choose}</option><option value="sale">{w.sale}</option><option value="rent">{w.rent}</option></select></label>
 <label>{w.geography}<select value={level} onChange={e=>{setLevel(e.target.value as typeof level);setGeo('')}}>{(['province','canton','district'] as const).map(k=><option key={k} value={k}>{w[k]}</option>)}</select></label>
 <label>{w[level]}<select required value={geo} onChange={e=>setGeo(e.target.value)}><option value="">{w.choose}</option>{options.filter(o=>o.type===level).map(o=><option key={o.id} value={o.code!}>{o[lang]}</option>)}</select></label>
 <label>{w.property_type}<select value={propertyType} onChange={e=>setPropertyType(e.target.value)}><option value="">{w.all}</option>{options.filter(o=>o.type==='property_type').map(o=><option key={o.id} value={o.id}>{o[lang]}</option>)}</select></label></div>
 <details><summary>{w.optional}</summary><div className={styles.controls}>{(['propertyArea','constructionArea'] as const).map(k=><label key={k}>{w[k]}<select value={filters[k]??''} onChange={e=>setFilters(f=>{const next={...f};if(e.target.value)next[k]=e.target.value;else delete next[k];return next})}><option value="">{w.none}</option>{(k==='propertyArea'?PROPERTY_AREA_RANGE_OPTIONS:CONSTRUCTION_AREA_RANGE_OPTIONS).map((o,i)=><option key={o.value} value={o.value}>{areaLabels[k][i]}</option>)}</select></label>)}
 {SEMANTICS.map(d=><fieldset className={styles.fact} key={d}><legend>{w[d]}</legend><div className={styles.choices}>{options.filter(o=>o.type===d).map(o=><label className={styles.check} key={o.id}><input type="checkbox" checked={(filters.semantics[d]??[]).includes(o.id)} onChange={e=>setFilters(f=>({...f,semantics:{...f.semantics,[d]:e.target.checked?[...(f.semantics[d]??[]),o.id]:(f.semantics[d]??[]).filter(id=>id!==o.id)}}))}/>{o[lang]}</label>)}</div></fieldset>)}</div>
 <div className={styles.controls}>{FACTS.map(d=><FactEditor key={d} dimension={d} options={options.filter(o=>o.type===d)} lang={lang} values={filters.facts[d]??[]} draft={drafts[d]} onDraft={draft=>editDraft(d,draft)} add={()=>addConstraint(d)} error={fieldErrors[d]} onChange={cs=>{setFilters(f=>({...f,facts:{...f.facts,[d]:cs}}));setFieldErrors(current=>({...current,[d]:undefined}))}}/>)}</div></details>
 <button className={styles.analyze} type="submit" disabled={pending||!transaction||!geo}>{pending?w.loading:w.analyze}</button><span role="status" aria-live="polite">{pending?w.loading:''}</span></fieldset></form>}
 {failure&&<p role="alert">{failure}</p>}{result?<AskingPriceResult result={result} lang={lang} modify={<button className={shared.modify} type="button" disabled={pending} aria-expanded={expanded} aria-controls={inputId} onClick={()=>setExpanded(v=>!v)}>{expanded?(lang==='en'?'Close editing':'Cerrar edición'):(lang==='en'?'Modify':'Modificar')}</button>}/>:null}</article>
}
