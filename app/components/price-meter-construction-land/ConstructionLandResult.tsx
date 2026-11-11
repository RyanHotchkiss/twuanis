'use client'
import {useHubUniverse as usePopulation,priceMeaning} from '../HubUniverseContext'
import LiveResultQuestion from '../LiveResultQuestion'
import {constructionLandQuestion} from './contract'
import type {ReactNode,RefObject} from 'react'
import styles from '../market-summary/workspace.module.css'
import ConstructionLandEvidence from './ConstructionLandEvidence'
import type {ConstructionLandEvidence as Evidence,Context} from './contract'

export default function ConstructionLandResult({committed,language,heading,part,modify,actions,editing=false,pending=false}:{committed:{labels:string[];context:Context;evidence:Evidence}|null;language:"en"|"es";heading:RefObject<HTMLHeadingElement|null>;part:string;modify?:ReactNode;actions?:ReactNode;editing?:boolean;pending?:boolean}){
 const populationMeaning=usePopulation()
 const es=language==='es';

if(!committed)return null;
const c=committed.context,title=es?'Construcción/terreno → Precio por m²':'Construction-to-Land → Price / m²',basisLabel=(m:'land'|'construction')=>m==='land'?(es?'Área del terreno':'Property Area'):(es?'Área de construcción':'Construction Area');
if(part==='identity')return <><div className={styles.identity}><div><p className={styles.eyebrow}>{es?'Definición del mercado':'Market definition'}</p><ul>{committed.labels.map((s,i)=><li key={i}>{s}</li>)}</ul><p className={styles.eyebrow}>{es?'Definición de construcción/terreno':'Construction-to-Land definition'}</p><p data-cl-identity>{es?'Área exacta de construcción ÷ área exacta del terreno':'Exact Construction Area ÷ Exact Property Area'}</p><p className={styles.eyebrow}>{es?'Definición del precio por m²':'Price / m² definition'}</p><p>{es?'Propiedad con construcción':'Improved Property'} · {es?`CRC / m² de ${c.normalizationBasis==='land'?'terreno':'construcción'}`:`CRC / ${c.normalizationBasis==='land'?'land':'construction'} m²`} · {priceMeaning(populationMeaning,language,c.transactionType)}</p><p>{es?'Fecha analítica':'Analytical date'}: {c.analyticalDate}. {c.fx?`${c.fx.source} USD → CRC: ${c.fx.rate} · ${es?'Referencia de venta':'Reference sale'} · ${c.fx.effectiveDate}`:(es?'Sin conversión USD en el contexto adquirido.':'No USD conversion in the acquired context.')}</p></div>{modify}</div></>;
if(part==='result')return <><div aria-live="polite" aria-busy={pending} data-cl-result><h3 ref={heading} tabIndex={-1}>{title} · {basisLabel(c.normalizationBasis)}</h3><LiveResultQuestion className={styles.sectionQuestion}>{constructionLandQuestion[language]}</LiveResultQuestion><ConstructionLandEvidence evidence={committed.evidence} language={language}/>{actions}</div></>;
return null
}
