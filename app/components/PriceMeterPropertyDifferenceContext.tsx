'use client'
import { useState } from 'react'
import type { ContextSelection } from '@/lib/price-meter-property-difference-context-request'
import type { ContextOptions,DifferenceDTO,ContextItemDTO } from '@/lib/price-meter-property-difference-context-browser-contract'
import type { PositionRequest } from '@/lib/price-meter-property-position-request'
import { contextText,contextLabel } from '@/lib/price-meter-property-difference-context-presentation'
import { positionNumber } from '@/lib/price-meter-property-position-presentation'
const types=['bedrooms','bathrooms','parking','year_built','utility','environment','terrain','accessibility','legal_status']
export function ContextCard({item,lang}:{item:ContextItemDTO;lang:'en'|'es'}) {
 const l=contextText[lang],f=(n:number|null)=>positionNumber(n,lang),label=(k:string)=>contextLabel(k,lang)
 return <article className="my-4 rounded border p-4">
  <h4 className="font-semibold">{item.index+1}. {item.phase===7?l.geographic:item.phase===8?l.size:item.phase===9?l.ratio:l.characteristic} · {label(item.state)}</h4>
  {item.reason&&<p>{label(item.reason)}</p>}
  {item.universe&&<p>{item.universe.unit} · {item.universe.analyticalDate} · {item.universe.monetaryMethod==='native_crc'?l.native:l.bccr}</p>}
  {item.populations.map(p=><div key={p.key} className="my-2 text-sm"><p>{l.population} {p.key}: {p.geography.label} · {l.propertyType}: {p.propertyType.label} · n = {f(p.n)} · {l.represented}: {f(p.representedN)} · {l.subject}: {p.subjectIncluded===null?l.unknown:p.subjectIncluded?l.yes:l.no}</p><p>{l.propertyArea}: {p.propertyArea==='unconstrained'?l.unconstrained:p.propertyArea} · {l.constructionArea}: {p.constructionArea==='unconstrained'?l.unconstrained:p.constructionArea}{p.constructionLand?' · '+l.constructionLand+': '+p.constructionLand:''}</p>{p.characteristics.map(t=><span key={t.id}>{label(t.type)}: {t.label}; </span>)}</div>)}
  <dl className="grid grid-cols-2 gap-2">{item.metrics.map(m=><div key={m.key}><dt>{label(m.key)}</dt><dd>{f(m.value)} {m.unit}{m.reason?' · '+label(m.reason):''}</dd></div>)}</dl>
  {!!item.groups.length&&<details><summary>{l.details}</summary>{item.groups.map(g=><div key={g.key} className="my-3 border-t pt-2">
   <p>{g.label} · n = {g.n} · {l.subject}: {g.subjectIncluded?l.yes:l.no}{g.rank!==null?' · '+l.rank+': '+g.rank:''}{g.coordinate!==null?' · '+l.coordinate+': '+f(g.coordinate)+(item.phase===8?' m²':''):''}</p>
   <p>{Object.entries(g.distribution).filter(([k])=>item.phase!==8||k==='median').map(([k,v])=>label(k)+': '+f(v)).join(' · ')}</p>
   {g.difference!==null&&<p>{l.difference}: {positionNumber(g.difference,lang,true)} · {l.percentage}: {positionNumber(g.percentDifference,lang,true)}%</p>}
   {g.percentageReference&&<p>{l.denominator}: {g.percentageReference.startsWith('lower_ratio_cohort:')?(lang==='en'?'Lower ratio cohort ':'Cohorte de relación inferior ')+g.percentageReference.split(':')[1]:label(g.percentageReference)}</p>}
  </div>)}</details>}
 </article>
}
export default function PriceMeterPropertyDifferenceContext({positionRequest,result,lang,loading,error,onCommit}:{positionRequest:PositionRequest;result:DifferenceDTO|null;lang:'en'|'es';loading:boolean;error:boolean;onCommit:(contexts:ContextSelection[])=>void}) {
 const l=contextText[lang]
 const [geographic,setGeographic]=useState(false),[size,setSize]=useState(false),[ratio,setRatio]=useState(false)
 const [comparisons,setComparisons]=useState<Record<string,string>[]>([]),[options,setOptions]=useState<ContextOptions|null>(null),[optionError,setOptionError]=useState(false),[optionsLoading,setOptionsLoading]=useState(false)
 async function add(){
  if(comparisons.length>=4||optionsLoading)return
  if(!options){setOptionsLoading(true);setOptionError(false);try{const response=await fetch('/api/price-meter/property-difference-context',{cache:'no-store'});if(!response.ok)throw new Error('Unavailable');setOptions(await response.json())}catch{setOptionError(true);return}finally{setOptionsLoading(false)}}
  setComparisons(current=>current.length<4?[...current,{reference_cohort:'A'}]:current)
 }
 function change(index:number,key:string,value:string){setComparisons(current=>current.map((p,i)=>{if(i!==index)return p;const next={...p,[key]:value};for(const prefix of ['a','b']){if(key===prefix+'_province'){delete next[prefix+'_canton'];delete next[prefix+'_district']}if(key===prefix+'_canton')delete next[prefix+'_district'];for(const number of [1,2])if(key===prefix+'_characteristic_'+number+'_type')delete next[prefix+'_characteristic_'+number]}return next}))}
 function commit(){const contexts:ContextSelection[]=[];if(geographic)contexts.push({questionKey:'geographic_children'});if(size)contexts.push({questionKey:positionRequest.requestedNormalizationBasis==='land'?'property_area_to_land_normalized_ratio':'construction_area_to_construction_normalized_ratio'});if(ratio)contexts.push({questionKey:positionRequest.requestedNormalizationBasis==='land'?'construction_land_land':'construction_land_construction'});comparisons.forEach(params=>contexts.push({questionKey:'characteristic_comparison',params}));onCommit(contexts)}
 return <section className="mt-6 border-t pt-5" aria-label={l.title}><h3 className="text-lg font-semibold">{l.title}</h3>
  <div className="flex flex-wrap gap-4 my-3">{([[l.geographic,geographic,setGeographic],[l.size,size,setSize],[l.ratio,ratio,setRatio]] as const).map(([text,value,set])=><label key={text}><input type="checkbox" checked={value} onChange={e=>set(e.target.checked)}/> {text}</label>)}</div>
  <button type="button" className="rounded border px-3 py-2" disabled={comparisons.length>=4||optionsLoading} onClick={()=>void add()}>{l.add}</button>
  {optionsLoading&&<p>{l.loading}</p>}{optionError&&<p role="alert">{l.error}</p>}
  {options&&comparisons.map((params,index)=><fieldset key={index} className="my-4 border p-3"><legend>{l.characteristic} {index+1}</legend>
   <div className="grid gap-4 md:grid-cols-2">{(['a','b'] as const).map(prefix=>{
    const choose=(suffix:string,title:string,values:{value:string;label:string}[],optional=false)=><label key={suffix} className="block my-2">{title}<select className="block w-full border rounded p-2" value={params[prefix+'_'+suffix]||''} onChange={e=>change(index,prefix+'_'+suffix,e.target.value)}><option value="">{optional?l.optional:l.select}</option>{values.map(v=><option key={v.value} value={v.value}>{v.label}</option>)}</select></label>
    const terms=(type:string)=>{let values=options.terms[type]||[];const parentType=type==='canton'?'province':type==='district'?'canton':null;if(parentType){const parent=options.terms[parentType]?.find(v=>v.value===params[prefix+'_'+parentType]);values=values.filter(v=>parent&&v.parentId===parent.id)}return values.map(v=>({value:v.value,label:lang==='es'?v.labelEs||v.label:v.labelEn||v.label}))}
    return <div key={prefix}><h4>{prefix.toUpperCase()}</h4>{choose('province',l.province,terms('province'))}{choose('canton',l.canton,terms('canton'),true)}{choose('district',l.district,terms('district'),true)}{choose('property_type',l.propertyType,terms('property_type'))}{[1,2].map(n=><div key={n}>{choose('characteristic_'+n+'_type',l.characteristicType+' '+n,types.map(value=>({value,label:contextLabel(value,lang)})))}{choose('characteristic_'+n,l.characteristicValue+' '+n,terms(params[prefix+'_characteristic_'+n+'_type']||''))}</div>)}{choose('property_area',l.propertyArea,options.propertyAreas,true)}{choose('construction_area',l.constructionArea,options.constructionAreas,true)}{choose('construction_land_cohort',l.constructionLand,options.ratios,true)}</div>
   })}</div>
   <label>{l.reference}<select value={params.reference_cohort} onChange={e=>change(index,'reference_cohort',e.target.value)}><option>A</option><option>B</option></select></label>
   <button type="button" onClick={()=>setComparisons(current=>current.filter((_,i)=>i!==index))}>{l.remove}</button>
  </fieldset>)}
  <button type="button" className="mt-3 rounded bg-slate-900 px-4 py-2 text-white" onClick={commit}>{l.commit}</button>
  <div aria-live="polite">{loading?<p>{l.loading}</p>:error?<p>{l.error}</p>:result?.items.map(item=><ContextCard key={item.index} item={item} lang={lang}/>)}</div>
  <p className="mt-3 text-sm">{l.boundary}</p>
 </section>
}
