'use client'
import { useEffect, useRef, useState } from 'react'
import PriceMeterPropertyDifferenceContext from './PriceMeterPropertyDifferenceContext'
import type { ContextSelection } from '@/lib/price-meter-property-difference-context-request'
import type { DifferenceDTO } from '@/lib/price-meter-property-difference-context-browser-contract'
import type { PositionConfiguration, PositionDTO, PositionFailure } from '@/lib/price-meter-property-position-browser-contract'
import type { PositionGeography, PositionNormalization } from '@/lib/price-meter-property-position-request'
import { positionLabels, positionStateText, positionNumber, positionIntervals } from '@/lib/price-meter-property-position-presentation'

type Access = { access:'authentication_required' | 'entitlement_required' }
type Configuration = PositionConfiguration | PositionFailure | Access
type Result = PositionDTO | Access
const endpoint='/api/price-meter/property-position'
async function json<T>(url:string, init?:RequestInit):Promise<T> {
  const response=await fetch(url,{...init,cache:'no-store'})
  const value=await response.json()
  if (!response.ok && response.status!==401 && response.status!==403 && !value.state) throw new Error('Request failed')
  return value as T
}
const analyze=(listingId:string, geography:PositionGeography, normalization:PositionNormalization) => json<Result>(endpoint,{
  method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({listingId,requestedGeographyLevel:geography,requestedNormalizationBasis:normalization})
})
const unavailable:PositionFailure={state:'execution_unavailable',reason:'request_unavailable'}

export function PositionEvidence({result:r,lang}:{result:Extract<PositionDTO,{state:'ok'}>;lang:'en'|'es'}) {
 const l=positionLabels[lang], f=(v:number|null,s=false)=>positionNumber(v,lang,s)
 const unit=lang==='es' && r.unit==='CRC/m²/month' ? 'CRC/m²/mes' : r.unit
 const place=r.reference.geography
 return <div className="space-y-3">
  <p>{l[r.reference.geographyLevel]}: {lang==='es' ? place.labelEs || place.label : place.labelEn || place.label} · {l.type}: {r.reference.propertyType.label} · {l[r.transactionType]} · {l[r.propertyBasis]} · {l[r.normalizationBasis]}</p>
  <p>{l.areas}</p><p>{l.included}</p>
  <dl className="grid grid-cols-2 gap-3">
   <div><dt>{l.subject}</dt><dd>{f(r.subjectPricePerM2)} {unit}</dd></div>
   <div><dt>{l.n}</dt><dd>{r.n} · {l.complete}</dd></div>
   <div><dt>{l.median}</dt><dd>{f(r.distribution.median)} {unit}</dd></div>
   <div><dt>{l.percentile}</dt><dd>{f(r.percentile)}</dd></div>
   <div><dt>{l.difference}</dt><dd>{f(r.difference,true)} {unit} ({f(r.percentDifference,true)}%)</dd></div>
  </dl><p>{l.denominator}</p>
  <details><summary>{l.distribution}</summary>
   <dl className="grid grid-cols-2 gap-2">{(['minimum','p10','p25','median','p75','p90','maximum','iqr'] as const).map(k=><div key={k}><dt>{k in l ? l[k as 'minimum'|'median'|'maximum'|'iqr'] : k.toUpperCase()}</dt><dd>{f(r.distribution[k])} {unit}</dd></div>)}</dl>
   <p>{l.below}: {r.below} · {l.equal}: {r.equal} · {l.above}: {r.above}</p>
   <p>{l.interval}: {positionIntervals[r.interval]}</p>
   {r.tail && <p>{l.tail}: P{r.tail.thresholdPercentile} = {f(r.tail.thresholdPricePerM2)} {unit}. {l.tailDifference}: {f(r.tail.difference,true)} {unit} ({f(r.tail.percentDifference,true)}%; P{r.tail.thresholdPercentile}).</p>}
   {r.constructionToLand && <p>{l.ratio}: {f(r.constructionToLand.ratio)} ({f(r.constructionToLand.constructionAreaM2)} m² / {f(r.constructionToLand.propertyAreaM2)} m²)</p>}
  </details>
  <p>{l.date}: {r.analyticalDate}. {r.monetaryMethod==='native_crc' ? l.native : l.fx}</p>
 </div>
}
export default function PriceMeterPropertyPositionListing({listingId,lang}:{listingId:string;lang:'en'|'es'}) {
 const l=positionLabels[lang]
 const [config,setConfig]=useState<Configuration|null>(null)
 const [display,setDisplay]=useState<{position:Result|null;context:DifferenceDTO|null;contextError:boolean}>({position:null,context:null,contextError:false})
 const result=display.position
 const setResult=(position:Result|null)=>setDisplay({position,context:null,contextError:false})
 const [geography,setGeography]=useState<PositionGeography|null>(null), [normalization,setNormalization]=useState<PositionNormalization|null>(null)
 const [committed,setCommitted]=useState<{geography:PositionGeography;normalization:PositionNormalization}|null>(null)
 const [executionError,setExecutionError]=useState(false)
 const [loading,setLoading]=useState(true)
 const generation=useRef(0)
 // Reuse configuration only for this mounted listing, including StrictMode replay.
 // This is not a persistent analytical cache. Language is intentionally not an execution dependency.
 const initial=useRef<{id:string;promise:Promise<Configuration>}|null>(null)
 useEffect(()=>{
  let active=true; const ticket=++generation.current
  setLoading(true);setConfig(null);setResult(null);setCommitted(null);setExecutionError(false);setGeography(null);setNormalization(null)
  if (initial.current?.id!==listingId) initial.current={id:listingId,promise:json<Configuration>(endpoint+'?listingId='+encodeURIComponent(listingId))}
  const session=initial.current
  session.promise.then(async config=>{
   if (!active || generation.current!==ticket) return
   setConfig(config)
   if ('geographies' in config) {setGeography(config.defaultGeography);setNormalization(config.defaultNormalization)}
   setLoading(false)
  }).catch(()=>{if(active && generation.current===ticket){setResult(unavailable);setLoading(false)}})
  return ()=>{active=false;generation.current++}
 },[listingId])
 async function commit(g:PositionGeography|null,n:PositionNormalization|null) {
  if (!g || !n) return
  const ticket=++generation.current;setLoading(true);setExecutionError(false)
  try {
   const next=await analyze(listingId,g,n)
   if(generation.current!==ticket)return
   if('access' in next){setResult(next);setCommitted(null);return}
   if(next.state==='execution_unavailable'||next.state==='reference_evidence_incomplete'){setExecutionError(true);return}
   setResult(next);setCommitted({geography:g,normalization:n})
  } catch {if(generation.current===ticket)setExecutionError(true)}
  finally {if(generation.current===ticket)setLoading(false)}
 }
 async function commitContexts(contexts:ContextSelection[]) {
  if(!committed)return
  const ticket=++generation.current;setLoading(true)
  try {
   const response=await fetch('/api/price-meter/property-difference-context',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({positionRequest:{listingId,requestedGeographyLevel:committed.geography,requestedNormalizationBasis:committed.normalization},contexts})})
   const value=await response.json()
   if(generation.current!==ticket)return
   if(response.status===401||response.status===403){setResult(value);return}
   if(!response.ok)throw new Error('Context request failed')
   const completed=value as DifferenceDTO
   setDisplay({position:completed.position,context:completed,contextError:false})
  }catch {if(generation.current===ticket)setDisplay(current=>({position:current.position,context:current.context,contextError:true}))}
  finally {if(generation.current===ticket)setLoading(false)}
 }
 const outcome=result || config
 return <section className="my-8 rounded-xl border border-slate-200 bg-white p-6" aria-label={l.title}>
  <h2 className="text-xl font-semibold mb-4">{l.title}</h2>
  {config && 'geographies' in config && <div className="flex flex-wrap gap-4 mb-4">
   <label>{l.geography}<select className="block border rounded p-2" value={geography||''} onChange={e=>setGeography(e.target.value as PositionGeography)}>
    <option value="" disabled>{l.choose}</option>
    {(['district','canton','province'] as const).filter(g=>config.geographies[g]).map(g=><option key={g} value={g}>{l[g]}: {lang==='es' ? config.geographies[g]!.labelEs || config.geographies[g]!.label : config.geographies[g]!.labelEn || config.geographies[g]!.label}</option>)}
   </select></label>
   <label>{l.normalization}<select className="block border rounded p-2" value={normalization||''} onChange={e=>setNormalization(e.target.value as PositionNormalization)}>{config.normalizations.map(n=><option key={n} value={n}>{l[n]}</option>)}</select></label>
   <button type="button" disabled={loading||!geography||!normalization} onClick={()=>void commit(geography,normalization)} className="border rounded p-2">{lang==='es'?'Analizar posición':'Analyze position'}</button>
   {!config.defaultGeography && !geography && <p>{l.districtMissing}</p>}
  </div>}
  <div aria-live="polite">{loading && <p>{l.loading}</p>}{executionError && <p>{positionStateText('execution_unavailable',lang)}</p>}{outcome && ('access' in outcome ? <p>{l.access}</p> : result && 'state' in result && result.state==='ok' ? <PositionEvidence result={result} lang={lang}/> : 'state' in outcome && outcome.state!=='ok' ? <p>{positionStateText(outcome.state,lang)}</p> : null)}</div>
  {committed&&((result&&'state' in result&&result.state==='ok')||display.context)&&<PriceMeterPropertyDifferenceContext key={listingId+':'+committed.geography+':'+committed.normalization} positionRequest={{listingId,requestedGeographyLevel:committed.geography,requestedNormalizationBasis:committed.normalization}} result={display.context} lang={lang} loading={loading} error={display.contextError} onCommit={contexts=>void commitContexts(contexts)}/>}
  <p className="mt-4 text-xs text-slate-600">{l.boundary}</p>
 </section>
}
