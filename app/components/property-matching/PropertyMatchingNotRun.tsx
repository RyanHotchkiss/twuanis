
'use client'

import type {Language} from '../market-filters/types'
import shared from '../market-summary/workspace.module.css'
import styles from './matching.module.css'

export default function PropertyMatchingNotRun({
  language,
  listing = false,
}: {
  language: Language
  listing?: boolean
}) {
  const es = language === 'es'

  return (
    <section
      className={shared.evidence}
      aria-label={es ? 'Vista previa de coincidencia de propiedades' : 'Property Matching preview'}
    >
      <h3>{es ? 'Resultados de coincidencia' : 'Matching results'}</h3>

      <p className={shared.sectionQuestion}>
        {es
          ? '¿Qué porcentaje de los atributos seleccionados conocidos coincide con cada anuncio y qué evidencia respalda el resultado?'
          : 'What percentage of known selected attributes does each listing match, and what evidence supports the result?'}
      </p>

      <p>
        — {es ? 'mostrados de' : 'shown from'} —{' '}
        {es ? 'anuncios candidatos · Máximo 12 resultados' : 'candidate listings · Maximum 12 results'}
      </p>

      <ol className={styles.results}>
        <li className={styles.card}>
          <div className={styles.top}>
            <div>
              <p className={styles.rank}>#—</p>
              <strong className={styles.score}>—%</strong>

              <p>
                — / —{' '}
                {es
                  ? 'atributos seleccionados conocidos coinciden'
                  : 'known selected attributes matched'}
              </p>

              <p>
                —{' '}
                {es
                  ? 'atributos seleccionados desconocidos · No incluidos en el denominador'
                  : 'selected attributes unknown · Not included in the denominator'}
              </p>
            </div>

            <div className={styles.identity}>
              <h4>{listing
                ? (es ? 'Comparación de propiedades' : 'Property comparison')
                : (es ? 'Anuncio candidato' : 'Candidate listing')}
              </h4>

              <p>— · — · —</p>
              <p>{es ? 'Precio no calculado' : 'Price not calculated'}</p>
            </div>
          </div>

          <details className={styles.detail}>
            <summary>
              {es ? 'Comparar atributos y evidencia' : 'Compare attributes and evidence'}
            </summary>

            <div className={styles.attribute}>
              <h5>{es ? 'Atributo seleccionado' : 'Selected attribute'}</h5>

              <dl>
                <div>
                  <dt>{es ? 'Seleccionado' : 'Selected'}</dt>
                  <dd>—</dd>
                </div>
                <div>
                  <dt>{es ? 'Evidencia del anuncio' : 'Listing evidence'}</dt>
                  <dd>—</dd>
                </div>
              </dl>

              <p>{es ? 'Sin calcular' : 'Not calculated'}</p>
            </div>
          </details>
        </li>
      </ol>

      <p className={shared.sectionQuestion}>
        {es
          ? 'Sin calcular. Ejecute el algoritmo para obtener las coincidencias.'
          : 'Not calculated. Run the algorithm to obtain matching results.'}
      </p>

      <details className={shared.method}>
        <summary>{es ? 'Metodología' : 'Methodology'}</summary>

        <p>
          {es
            ? 'La transacción, geografía y tipo de propiedad delimitan la población, pero no aportan puntos. Cada atributo seleccionado tiene el mismo peso.'
            : 'Transaction, geography and property type define the population but do not contribute to the score. Each selected attribute has equal weight.'}
        </p>

        <p>
          {es
            ? 'El porcentaje se calcula dividiendo las coincidencias conocidas entre las coincidencias y no coincidencias conocidas. Los atributos desconocidos no cuentan a favor ni en contra.'
            : 'The percentage divides known matches by known matches plus known nonmatches. Unknown attributes count neither for nor against.'}
        </p>

        <p>
          {es
            ? 'Los anuncios se ordenan por porcentaje, cantidad de coincidencias y finalmente identidad estable. Los resultados no constituyen una recomendación.'
            : 'Listings are ordered by percentage, matched count and finally stable identity. Results are not recommendations.'}
        </p>
      </details>
    </section>
  )
}
