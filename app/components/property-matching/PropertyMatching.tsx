'use client'
import CanonicalMarketWorkspace from '../CanonicalMarketWorkspace'
import type {ExplorerOptions,Filters,Language} from '../market-filters/types'
import {optionLabel} from '../market-filters/utils'
import {summaryLabel,type SummaryKey} from '../market-summary/contract'
import type {MatchEvidence,MatchExplanation} from '@/lib/market-matching-evidence-contract'
import shared from '../market-summary/workspace.module.css'
import styles from './matching.module.css'
type Preference={dimension:string;identity:string;label:string;state:'MATCH'|'NONMATCH'|'UNKNOWN';explanation?:MatchExplanation}
type Listing={id:string;transaction?:'sale'|'rent';title:string|null;images:string[];formattedPrice:string|null;province:string|null;canton:string|null;property_type:string|null;matchScore:number|null;confirmedMatches:number;confirmedNonmatches:number;unknown:number;preferences:Preference[]}
type Result={totalListings:number;listings:Listing[]}
export default function PropertyMatching({options,filters,language='en'}:{options:ExplorerOptions;filters:Filters;language?:Language}){
 const es=language==='es',number=new Intl.NumberFormat(es?'es-CR':'en-US',{maximumFractionDigits:2})
 const question=es?'¿Qué anuncios coinciden más con los atributos de propiedad seleccionados?':'Which listings most closely match the selected property attributes?'
 function evidence(v:MatchEvidence|undefined,dimension:string){
  if(!v)return es?'Explicación no disponible en este resultado guardado':'Explanation unavailable in this saved result'
  if(v.kind==='unknown')return es?'Desconocida':'Unknown'
  if(v.kind==='term'){const option=(options[dimension as keyof ExplorerOptions]??[]).find(o=>typeof o==='object'&&String(o.id)===v.id);return option?optionLabel(option,language):v.label??(es?'Categoría registrada (etiqueta no disponible)':'Recorded category (label unavailable)')}
  const unit=['property_area','construction_area'].includes(dimension)?' m²':dimension==='distance_to_paved_road'?' m':''
  if(v.kind==='exact')return v.value+unit
  return `${v.lowerInclusive?'[':'('}${v.lower??'−∞'}, ${v.upper??'∞'}${v.upperInclusive?']':')'}${unit}`
 }
 return <CanonicalMarketWorkspace<Result> engine="matching" options={options} filters={filters} language={language} title={es?'Coincidencia de propiedades':'Property Matching'} primaryQuestion={question}>
 {(committed,heading,id)=><section className={shared.evidence} aria-labelledby={`${id}-results`}>
  <h3 ref={heading} tabIndex={-1} id={`${id}-results`}>{es?'Resultados de coincidencia':'Matching results'}</h3><p className={shared.sectionQuestion}>{es?'¿Qué porcentaje de los atributos seleccionados conocidos coincide con cada anuncio y qué evidencia respalda el resultado?':'What percentage of known selected attributes does each listing match, and what evidence supports the result?'}</p>
  <p>{number.format(committed.result.listings.length)} {es?'mostrados de':'shown from'} {number.format(committed.result.totalListings)} {es?'anuncios candidatos · Máximo 12 resultados':'candidate listings · Maximum 12 results'}</p>
  {!committed.result.listings.length&&<p role="status">{es?'Ningún anuncio cumple la definición de la población.':'No listings meet the population definition.'}</p>}
  <ol className={styles.results}>{committed.result.listings.map((l,index)=><li key={l.id} className={styles.card}>
   <div className={styles.top}><div><p className={styles.rank}>#{index+1}</p><strong className={styles.score}>{l.matchScore===null?(es?'Sin evidencia evaluable':'No evaluable evidence'):`${number.format(l.matchScore)}%`}</strong><p>{l.confirmedMatches} / {l.confirmedMatches+l.confirmedNonmatches} {es?'atributos seleccionados conocidos coinciden':'known selected attributes matched'}</p><p>{l.unknown} {es?'atributos seleccionados desconocidos · No incluidos en el denominador':'selected attributes unknown · Not included in the denominator'}</p>{l.matchScore!==null&&<div className={styles.track} aria-hidden="true"><div style={{width:`${l.matchScore}%`}}/></div>}</div>
   <div className={styles.identity}>{l.images[0]&&<img src={l.images[0]} alt="" loading="lazy"/>}<h4>{l.title||(es?'Anuncio':'Listing')}</h4><p>{[l.canton,l.province,l.property_type].filter(Boolean).join(' · ')}</p><p>{l.formattedPrice??(es?'Precio no establecido':'Price not established')}</p>{l.transaction&&<a href={es?`/es/${l.transaction==='sale'?'comprar':'alquilar-arrendar'}/anuncio/${l.id}`:`/en/${l.transaction==='sale'?'buy':'rent-lease'}/listing/${l.id}`}>{es?'Ver anuncio':'View listing'}</a>}</div></div>
   <details className={styles.detail}><summary>{es?'Comparar atributos y evidencia':'Compare attributes and evidence'}</summary>{l.preferences.map(p=><div className={styles.attribute} key={`${p.dimension}:${p.identity}`}>
    <h5>{summaryLabel((p.dimension==='distance_to_paved_road'?'distance_to_paved_road_range':p.dimension) as SummaryKey,language)}</h5><dl><div><dt>{es?'Seleccionado':'Selected'}</dt><dd>{p.explanation?evidence(p.explanation.selected,p.dimension):p.label}</dd></div><div><dt>{es?'Evidencia del anuncio':'Listing evidence'}</dt><dd>{evidence(p.explanation?.candidate,p.dimension)}</dd></div></dl><p>{p.state==='MATCH'?(es?'Coincide':'Matches'):p.state==='NONMATCH'?(es?'No coincide':'Does not match'):(es?'Coincidencia desconocida — no incluida en el denominador':'Match unknown — not included in the denominator')}</p>
   </div>)}</details>
  </li>)}</ol>
  <details className={shared.method}><summary>{es?'Metodología':'Methodology'}</summary><p>{es?'La transacción, geografía y tipo de propiedad delimitan la población; no suman puntos. Cada atributo seleccionado tiene el mismo peso. El porcentaje divide coincidencias conocidas entre coincidencias y no coincidencias conocidas. Lo desconocido no cuenta a favor ni en contra.':'Transaction, geography and property type bound the population; they do not score points. Each selected attribute has equal weight. The percentage divides known matches by known matches plus known nonmatches. Unknown counts neither for nor against.'}</p><p>{es?'Se ordena por porcentaje, luego por mayor cantidad de coincidencias y finalmente por identidad estable del anuncio. Las selecciones múltiples se comparan individualmente. Un intervalo conocido puede no determinar una coincidencia; se conserva la evidencia y la clasificación desconocida. Esto no es una recomendación.':'Order is percentage, then greater matched count, then stable listing identity. Multiple selections are compared individually. A known interval may not establish a match; its evidence and unknown classification are both retained. This is not a recommendation.'}</p></details>
 </section>}
 </CanonicalMarketWorkspace>
}
