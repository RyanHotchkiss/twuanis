'use client'
import {useHubUniverse,priceMeaning} from '../HubUniverseContext'
import LiveResultQuestion from '../LiveResultQuestion'
import {positionHubQuestion} from '@/lib/position-hub-contract'
import {canonicalResultLabel} from '@/lib/analytical-result-presentation'
import type {ReactNode,RefObject} from 'react'
import type {PositionHubResponse} from '@/lib/position-hub-contract'
import type {PositionRequest} from '@/lib/price-meter-property-position-request'
import {positionLabels,positionNumber,positionStateText,positionIntervals} from '@/lib/price-meter-property-position-presentation'
import type {PositionDTO} from '@/lib/price-meter-property-position-browser-contract'
import styles from '../market-summary/workspace.module.css'
import local from './position.module.css'
function Evidence({r,language}:{r:Extract<PositionDTO,{state:'ok'}>;language:'en'|'es'}){
 const population=useHubUniverse()
 const es=language==='es',l=positionLabels[language],f=(v:number|null,s=false)=>positionNumber(v,language,s),unit=es?r.unit.replace('/month','/mes'):r.unit
 return <>
 <p>{population==='BANK'?priceMeaning(population,language):l[r.transactionType]} · {l[r.propertyBasis]} · {l[r.normalizationBasis]} · {unit}</p>
 <p>{l[r.reference.geographyLevel]}: {es?r.reference.geography.labelEs||r.reference.geography.label:r.reference.geography.labelEn||r.reference.geography.label} · {l.type}: {canonicalResultLabel({},'property_type',r.reference.propertyType.id,r.reference.propertyType.label,language)}</p>
 <p>{l.included} {l.areas}</p>
 <dl className={local.metrics}>
 {[[l.subject,`${f(r.subjectPricePerM2)} ${unit}`],[l.median,`${f(r.distribution.median)} ${unit}`],[l.percentile,f(r.percentile)],[l.n,`${r.n} · ${l.complete}`],[l.difference,`${f(r.difference,true)} ${unit} (${f(r.percentDifference,true)}%)`]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
 </dl><p>{l.denominator}</p>
 <div className={local.position} aria-label={es?'Posición percentil de la propiedad':'Property percentile position'}>
  <div className={local.track}><span style={{left:`${r.percentile}%`}}/></div>
  <div className={local.ends}><span>0</span><strong>{es?'Percentil':'Percentile'} {f(r.percentile)}</strong><span>100</span></div>
 </div>
 <p>{l.below}: {r.below} · {l.equal}: {r.equal} · {l.above}: {r.above}</p>
 <p>{l.interval}: {positionIntervals[r.interval]}</p>
 <details><summary>{l.distribution}</summary><dl className={local.metrics}>{(['minimum','p10','p25','median','p75','p90','maximum','iqr'] as const).map(k=><div key={k}><dt>{k in l?l[k as 'minimum'|'median'|'maximum'|'iqr']:k.toUpperCase()}</dt><dd>{f(r.distribution[k])} {unit}</dd></div>)}</dl></details>
 <details><summary>{es?'Valores numéricos sin redondear':'Unrounded numerical evidence'}</summary><dl className={local.metrics}>{[[l.subject,r.subjectPricePerM2],[l.percentile,r.percentile],[l.difference,r.difference],[es?'Diferencia porcentual':'Percentage difference',r.percentDifference],...Object.entries(r.distribution).map(([key,value])=>[key in l?l[key as 'minimum'|'median'|'maximum'|'iqr']:key.toUpperCase(),value])].map(([key,value])=><div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>)}</dl><p>{unit} · {es?'El percentil y la diferencia porcentual se expresan en %.':'Percentile and percentage difference are expressed in %.'}</p></details>
 {r.tail&&<p>{l.tail}: P{r.tail.thresholdPercentile} = {f(r.tail.thresholdPricePerM2)} {unit}. {l.tailDifference}: {f(r.tail.difference,true)} {unit} ({f(r.tail.percentDifference,true)}%; P{r.tail.thresholdPercentile}).</p>}
 {r.constructionToLand&&<p>{l.ratio}: {f(r.constructionToLand.ratio)} ({f(r.constructionToLand.constructionAreaM2)} m² / {f(r.constructionToLand.propertyAreaM2)} m²). {es?'No es cobertura del terreno.':'This is not site coverage.'}</p>}
 <p>{l.date}: {r.analyticalDate}. {r.monetaryMethod==='native_crc'?l.native:l.fx}</p>
 </>
}

export default function PositionResult({committed,language,heading,part,modify,actions,editing=false}:{committed:{request:PositionRequest;response:Exclude<PositionHubResponse,{access:string}>}|null;language:"en"|"es";heading:RefObject<HTMLHeadingElement|null>;part:string;modify?:ReactNode;actions?:ReactNode;editing?:boolean}){
 const es=language==='es';
if(part==='method')return <><details className={styles.method}><summary>{es?'Metodología':'Methodology'}</summary><p>{es?'Una propiedad canónica activa, importe de oferta positivo y área exacta válida. La propiedad participa exactamente una vez en la referencia. Percentil de rango medio = 100 × (inferiores + iguales / 2) / n. No es un rango ordinal. La diferencia es propiedad menos mediana; el porcentaje usa la mediana. Las colas son estrictamente inferiores a P10 o superiores a P90.':'One active canonical property, positive asking amount and valid exact area. The subject participates exactly once in the reference. Midrank percentile = 100 × (below + equals / 2) / n. This is not ordinal rank. Difference is subject minus median; percentage uses the median. Tails are strictly below P10 or above P90.'}</p><p>{es?'La evidencia ausente no es cero. No se infieren áreas a partir de rangos. La posición describe ofertas observadas; no es una valoración, recomendación ni explicación causal.':'Missing evidence is not zero. Areas are not inferred from ranges. Position describes observed asking evidence; it is not a valuation, recommendation or causal explanation.'}</p></details>
 <p>{es?'TWUANIS REPORTA EVIDENCIA DEL MERCADO. TWUANIS NO PRESCRIBE DECISIONES.':'TWUANIS REPORTS MARKET EVIDENCE. TWUANIS DOES NOT PRESCRIBE DECISIONS.'}</p></>;
if(!committed)return null;
const result=committed.response.result;
if(part==='result')return <><section className={styles.evidence}>
 <div className={styles.identity}><div><h3 ref={heading} tabIndex={-1}>{es?'Posición de la propiedad':'Property position'}</h3><p className={local.id}>{committed.request.listingId}</p></div>{modify}</div>
<LiveResultQuestion>{positionHubQuestion[language]}</LiveResultQuestion> {editing&&<p>{es?'La evidencia mostrada corresponde a la última pregunta ejecutada.':'Displayed evidence belongs to the last executed question.'}</p>}
 {result?.state==='ok'?<Evidence r={result} language={language}/>:result&&<p>{positionStateText(result.state,language)}</p>}
 {committed.response.fx&&<p>BCCR USD → CRC: {committed.response.fx.rate} · {committed.response.fx.effectiveDate} · {es?'referencia de venta':'reference sale'} · {committed.response.fx.resolutionMode==='exact'?(es?'fecha exacta':'exact date'):(es?'última observación anterior aplicable':'latest applicable prior observation')}</p>}
 {actions}
 </section></>;
return null
}
