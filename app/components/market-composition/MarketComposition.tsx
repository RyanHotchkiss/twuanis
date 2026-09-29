'use client'
import CanonicalMarketWorkspace from '../CanonicalMarketWorkspace'
import type {ExplorerOptions,Filters,Language} from '../market-filters/types'
import {compositionQuestion,compositionLensQuestion,dimensionLabel,type CompositionResult} from './contract'
import shared from '../market-summary/workspace.module.css'
import styles from './composition.module.css'

export default function MarketComposition({options,filters,language='en'}:{options:ExplorerOptions;filters:Filters;language?:Language}) {
 const es=language==='es',locale=es?'es-CR':'en-US'
 const integer=new Intl.NumberFormat(locale),percent=new Intl.NumberFormat(locale,{style:'percent',minimumFractionDigits:2,maximumFractionDigits:2})
 return <CanonicalMarketWorkspace<CompositionResult> options={options} filters={filters} language={language} engine="composition" title={es?'Composición del mercado':'Market Composition'} primaryQuestion={compositionQuestion[language]}>
  {(committed,heading,id)=><>
   <section className={shared.evidence} aria-labelledby={`${id}-composition`}>
    <h3 id={`${id}-composition`} ref={heading} tabIndex={-1}>{es?'Composición por característica':'Characteristic composition'}</h3>
    <p className={shared.sectionQuestion}>{compositionLensQuestion[language]}</p>
    <p className={styles.population}><strong>{integer.format(committed.result.n)}</strong> {es?'anuncios en el mercado definido':'listings in the defined market'}</p>
    {committed.result.n===0?<p role="status">{es?'No hay anuncios que cumplan esta definición del mercado. Los porcentajes por característica no están establecidos.':'No listings meet this market definition. Characteristic shares are not established.'}</p>:<div className={styles.dimensions}>
     {committed.result.dimensions.map(d=><section className={styles.dimension} key={d.dimension} aria-labelledby={`${id}-${d.dimension}`}>
      <h4 id={`${id}-${d.dimension}`}>{dimensionLabel(d.dimension,language)}</h4>
      <p className={styles.coverage}>{es?'Con evidencia registrada':'With recorded evidence'}: {integer.format(d.representedN)} / {integer.format(d.denominatorN)} · {es?'Sin evidencia registrada':'Without recorded evidence'}: {integer.format(d.unrepresentedN)}</p>
      {d.terms.length===0?<p className={styles.missing}>{es?'No hay membresías canónicas establecidas para esta dimensión. Esto no demuestra la ausencia de sus características.':'No canonical memberships are established for this dimension. This does not establish that its characteristics are absent.'}</p>:<table aria-labelledby={`${id}-${d.dimension}`}>
       <thead><tr><th scope="col">{es?'Característica':'Characteristic'}</th><th scope="col">{es?'Anuncios':'Listings'}</th><th scope="col">{es?'% del mercado':'% of market'}</th></tr></thead>
       <tbody>{d.terms.map(t=><tr key={t.termId} data-term-id={t.termId}><th scope="row">{t.label[language]}</th><td>{integer.format(t.count)}</td><td>{t.percentage===null?(es?'No establecido':'Not established'):percent.format(t.percentage/100)}</td></tr>)}</tbody>
      </table>}
     </section>)}
    </div>}
   </section>
   <details className={shared.method}><summary>{es?'Metodología':'Methodology'}</summary>
    <p>{es?'Cada conteo corresponde a anuncios distintos del mercado definido con una membresía canónica registrada. Los porcentajes usan todos los anuncios de ese mercado como denominador, no solo los que tienen evidencia registrada para la dimensión.':'Each count represents distinct listings in the defined market with a recorded canonical membership. Percentages use all listings in that market as the denominator, not only those with recorded evidence for the dimension.'}</p>
    <p>{es?'Un anuncio puede tener varias características de la misma dimensión; por eso los porcentajes pueden sumar más del 100%. La falta de evidencia no demuestra que una característica esté ausente. Solo se muestran los términos devueltos por el análisis.':'A listing can have multiple characteristics within a dimension, so percentages may sum to more than 100%. Missing evidence does not establish that a characteristic is absent. Only terms returned by the analysis are shown.'}</p>
    <p>{es?'Dentro de cada dimensión, los conteos se ordenan de mayor a menor; los empates conservan el orden estable de identidad canónica. Los porcentajes se muestran con dos decimales. Cero anuncios es un resultado completo; un fallo no es cero.':'Within each dimension, counts run from greatest to smallest; ties retain stable canonical identity order. Percentages are displayed to two decimal places. Zero listings is a complete result; a failure is not zero.'}</p>
   </details>
  </>}
 </CanonicalMarketWorkspace>
}
