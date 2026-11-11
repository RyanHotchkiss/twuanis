'use client'
import LiveResultQuestion from '../LiveResultQuestion'
import {crossQuestion} from './contract'
import type {ReactNode,RefObject} from 'react'
import type {executeCrossDimensionalHub} from '@/lib/price-meter-cross-dimensional-action'
import type {ExplorerOptions} from '../market-filters/types'
import type {Filters} from '../market-filters/types'
import CrossEvidence from './CrossEvidence'
import {crossTitle} from './contract'
import styles from '../market-summary/workspace.module.css'
import crossStyles from './cross.module.css'
type Complete=Extract<Awaited<ReturnType<typeof executeCrossDimensionalHub>>,{state:'complete'}>

export default function CrossResult({committed,language,heading,part,modify,actions,editing=false,pending=false,options={}}:{committed:{filters:Filters;labels:string[];response:Complete}|null;language:"en"|"es";heading:RefObject<HTMLHeadingElement|null>;part:string;modify?:ReactNode;actions?:ReactNode;editing?:boolean;pending?:boolean;options?:ExplorerOptions}){
 const es=language==='es';

if(!committed)return null;
 const cohortLabel=(key:string)=>key==='vacantLandLandNormalized'?(es?'Terreno vacío · CRC / m² de terreno':'Vacant Land · CRC / land m²'):key==='improvedLandNormalized'?(es?'Propiedad mejorada · CRC / m² de terreno':'Improved Property · CRC / land m²'):(es?'Propiedad mejorada · CRC / m² de construcción':'Improved Property · CRC / construction m²')

const c=committed.response,r=c.result;
if(part==='result')return <><section className={crossStyles.evidence} aria-live="polite" aria-busy={pending} data-cross-result><h3 ref={heading} tabIndex={-1}>{crossTitle[language]}</h3><LiveResultQuestion className={styles.sectionQuestion}>{crossQuestion[language]}</LiveResultQuestion><div className={styles.identity}><div><p className={styles.eyebrow}>{es?'Mercado comprometido':'Committed market'}</p><ul>{committed.labels.map((label,i)=><li key={i}>{label}</li>)}</ul><p>{cohortLabel(r.context.propertyBasis==='land_only'?'vacantLandLandNormalized':r.context.normalizationBasis==='land'?'improvedLandNormalized':'improvedConstructionNormalized')}</p><p>{es?'Fecha analítica':'Analytical date'}: {c.analyticalDate}. {c.fx?`${c.fx.source} USD → CRC: ${c.fx.rate} · ${c.fx.effectiveDate}`:(es?'Sin conversión USD en el contexto adquirido.':'No USD conversion in the acquired context.')}</p></div></div>
 {r.evidence.populatedSecondaryCohortCount===0?<p role="status">{es?'No hay grupos secundarios con evidencia elegible.':'No secondary groups contain eligible evidence.'} n = {r.evidence.inputObservationCount}; {es?'excluidos':'excluded'} = {r.evidence.excludedObservationCount}. {es?'No se establecen relaciones ni reversiones.':'Relationships and reversals are not established.'}</p>:<CrossEvidence result={r} language={language} options={options}/>}
 <details className={styles.optional}><summary>{es?'Metodología':'Methodology'}</summary><p>{es?'Una población fija se divide por una dimensión secundaria. La relación se calcula de forma independiente en cada grupo representado. Los conteos y estados de establecimiento se conservan; la ausencia de evidencia no equivale a cero. Las diferencias y reversiones describen observaciones, no causas ni predicciones. C/L usa áreas exactas y no representa cobertura del sitio.':'One fixed population is segmented by one secondary dimension. The relationship is calculated independently within each represented group. Counts and establishment states are retained; missing evidence is not zero. Differences and reversals describe observations, not causes or predictions. C/L uses exact areas and is not site coverage.'}</p></details>
 {actions}</section></>;
return null
}
