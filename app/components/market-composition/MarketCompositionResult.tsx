'use client'
import LiveResultQuestion from '../LiveResultQuestion'
import type {ExplorerOptions,Filters,Language} from '../market-filters/types'
import {compositionLensQuestion,dimensionLabel,compositionValueLabel,compositionRangeLabel,compositionDistrictLabel,type CompositionResult,type CompositionShare} from './contract'
import shared from '../market-summary/workspace.module.css'
import styles from './composition.module.css'
import type {RefObject} from 'react'

export default function MarketCompositionResult({committed,heading,id,language,options}:{committed:{filters:Filters;labels:string[];result:CompositionResult};heading:RefObject<HTMLHeadingElement|null>;id:string;language:Language;options:ExplorerOptions}){
 const es=language==='es',locale=es?'es-CR':'en-US'
 const integer=new Intl.NumberFormat(locale),percent=new Intl.NumberFormat(locale,{style:'percent',minimumFractionDigits:2,maximumFractionDigits:2})
 const share=(value:number|null)=>typeof value!=='number'||!Number.isFinite(value)?(es?'No establecido':'Not established'):percent.format(value/100)
 function table(rows:(CompositionShare&{key:string;text:string;termId?:string})[],labelledBy:string){return <table aria-labelledby={labelledBy}>
  <thead><tr><th scope="col">{es?'Característica':'Characteristic'}</th><th scope="col">{es?'Anuncios':'Listings'}</th><th scope="col">{es?'% del mercado':'% of market'}</th></tr></thead>
  <tbody>{rows.map(row=><tr key={row.key} data-term-id={row.termId}><th scope="row">{row.text}</th><td>{integer.format(row.count)}</td><td className={styles.share}>{share(row.percentage)}</td></tr>)}</tbody>
 </table>}
 return <>
  <section className={shared.evidence} aria-labelledby={`${id}-composition`}>
   <h3 id={`${id}-composition`} ref={heading} tabIndex={-1}>{es?'Composición por característica':'Characteristic composition'}</h3><LiveResultQuestion className={shared.sectionQuestion}>{es?'¿Qué características componen el mercado definido?':'What characteristics compose the defined market?'}</LiveResultQuestion>
   <p className={shared.sectionQuestion}>{compositionLensQuestion[language]}</p>
   <p className={styles.population}><strong>{integer.format(committed.result.n)}</strong> {es?(committed.result.n===1?'anuncio en el mercado definido':'anuncios en el mercado definido'):(committed.result.n===1?'listing in the defined market':'listings in the defined market')}</p>
   {committed.result.n===0?<p role="status">{es?'No hay anuncios que cumplan esta definición del mercado. Los porcentajes por característica no están establecidos.':'No listings meet this market definition. Characteristic shares are not established.'}</p>:<div className={styles.dimensions}>
    {committed.result.dimensions.map(d=><section className={styles.dimension} key={d.dimension} aria-labelledby={`${id}-${d.dimension}`}>
     <h4 id={`${id}-${d.dimension}`}>{dimensionLabel(d.dimension,language)}</h4>
     {d.numerical?<>
      <dl className={styles.coverage}>
       <div><dt>{es?'Con evidencia numérica o categórica registrada':'With recorded numerical/category evidence'}</dt><dd>{integer.format(d.numerical.coverage.recordedEvidenceN)} / {integer.format(d.denominatorN)}</dd></div>
       <div><dt>{es?'Sin evidencia registrada':'Without recorded evidence'}</dt><dd>{integer.format(d.numerical.coverage.missingEvidenceN)}</dd></div>
       <div><dt>{es?'Establecen una categoría aprobada':'Establishing an approved category'}</dt><dd>{integer.format(d.numerical.coverage.categoryEstablishedN)}</dd></div>
       <div><dt>{es?'Con evidencia registrada que no establece una categoría aprobada':'Recorded evidence not establishing an approved category'}</dt><dd>{integer.format(d.numerical.coverage.recordedButUnclassifiedN)}</dd></div>
      </dl>
      <p className={styles.missing}>{es?'Estas son vistas distintas de la misma población; los grupos pueden superponerse y no deben sumarse. Los porcentajes usan todo el mercado definido.':'These are different views of the same population; groups may overlap and must not be added together. Percentages use the entire defined market.'}</p>
      <h5 id={`${id}-${d.dimension}-categories`}>{es?'Categorías canónicas':'Canonical categories'}</h5>
      {table(d.terms.map(t=>({...t,key:t.termId,text:t.label[language]})),`${id}-${d.dimension}-categories`)}
      <p className={styles.missing}>{es?'Cero coincidencias significa que ningún anuncio establece esa categoría. La evidencia desconocida o insuficiente no se cuenta como una coincidencia. Un cero registrado es evidencia, no un dato faltante.':'Zero matches means no listing establishes that category. Unknown or insufficient evidence is not counted as a match. A recorded zero is evidence, not missing data.'}</p>
      <h5 id={`${id}-${d.dimension}-exact`}>{es?'Valores exactos registrados':'Exact recorded values'}</h5>
      {d.numerical.exactValues.length?table(d.numerical.exactValues.map(v=>({...v,text:compositionValueLabel(v.value,d.dimension,language)})),`${id}-${d.dimension}-exact`):<p className={styles.missing}>{es?'No se registran valores numéricos exactos para esta dimensión.':'No exact numerical values are recorded for this dimension.'}</p>}
      <h5 id={`${id}-${d.dimension}-ranges`}>{es?'Rangos explícitos registrados':'Explicit recorded ranges'}</h5>
      {d.numerical.ranges.length?<>{table(d.numerical.ranges.map(v=>({...v,text:compositionRangeLabel(v,d.dimension,language)})),`${id}-${d.dimension}-ranges`)}<p className={styles.missing}>{es?'[ y ] incluyen el límite; ( y ) lo excluyen. ∞ indica un extremo no acotado. No se utiliza un punto medio.':'[ and ] include the boundary; ( and ) exclude it. ∞ indicates an unbounded endpoint. No midpoint is used.'}</p></>:<p className={styles.missing}>{es?'No se registran rangos explícitos para esta dimensión.':'No explicit ranges are recorded for this dimension.'}</p>}
     </>:<>
      <p className={styles.coverage}>{es?'Con membresía canónica positiva registrada':'With recorded positive canonical membership'}: {integer.format(d.representedN)} / {integer.format(d.denominatorN)} · {es?'Sin membresía positiva registrada':'Without recorded positive membership'}: {integer.format(d.unrepresentedN)}</p>
      {d.terms.length===0?<p className={styles.missing}>{es?'No se registran selecciones canónicas positivas para esta dimensión en el mercado definido. Esto no demuestra la ausencia de esas características.':'No positive canonical selections are recorded for this dimension in the defined market. This does not establish that those characteristics are absent.'}</p>:table(d.terms.map(t=>({...t,key:t.termId,text:d.dimension==='district'?compositionDistrictLabel(t,options,language).text:t.label[language]})),`${id}-${d.dimension}`)}
     </>}
    </section>)}
   </div>}
  </section>
  <details className={shared.method}><summary>{es?'Metodología':'Methodology'}</summary>
   <p>{es?'Cada conteo corresponde a anuncios distintos del mercado definido con evidencia canónica que establece la característica. Los porcentajes usan todos los anuncios de ese mercado como denominador, no solo los que tienen evidencia registrada para la dimensión.':'Each count represents distinct listings in the defined market with canonical evidence establishing the characteristic. Percentages use all listings in that market as the denominator, not only those with recorded evidence for the dimension.'}</p>
   <p>{es?'Un anuncio puede tener varias características de la misma dimensión; por eso los porcentajes pueden sumar más del 100%. La falta de evidencia no demuestra que una característica esté ausente. Solo se muestran los términos devueltos por el análisis.':'A listing can have multiple characteristics within a dimension, so percentages may sum to more than 100%. Missing evidence does not establish that a characteristic is absent. Only terms returned by the analysis are shown.'}</p>
   <p>{es?'Dentro de cada grupo, los conteos se ordenan de mayor a menor; los empates conservan el orden estable de identidad de la evidencia. Los porcentajes se muestran con dos decimales. Cero anuncios es un resultado completo; un fallo no es cero.':'Within each group, counts run from greatest to smallest; ties retain stable evidence identity order. Percentages are displayed to two decimal places. Zero listings is a complete result; a failure is not zero.'}</p>
  </details>
 </>
}
