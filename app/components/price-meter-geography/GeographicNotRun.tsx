
'use client'

import {geographicQuestion} from './contract'
import styles from '../market-summary/workspace.module.css'
import geo from './geography.module.css'

export default function GeographicNotRun({
  language,
}: {
  language: 'en' | 'es'
}) {
  const es = language === 'es'

  return (
    <>
      <section
        className={styles.evidence}
        aria-label={
          es
            ? 'Vista previa de comparación geográfica'
            : 'Geographic comparison preview'
        }
      >
        <h3>
          {es
            ? 'Comparación geográfica del precio por m²'
            : 'Geographic Price / m² Comparison'}
          {' · '}
          {es ? 'Sin calcular' : 'Not calculated'}
        </h3>

        <p className={styles.sectionQuestion}>
          {geographicQuestion[language]}
        </p>

        <p>
          {es
            ? 'Mediana de referencia: mercado definido'
            : 'Reference median: defined market'}:{' '}
          <strong>— CRC / m²</strong>
          {' · '}n = —
        </p>

        <p>
          {es
            ? 'Anuncios del mercado definido'
            : 'Defined-market listings'}: —
        </p>

        <p>
          {es
            ? 'Medianas en escala lineal desde cero. La línea marca la mediana del mercado definido.'
            : 'Medians on a linear scale from zero. The line marks the defined-market median.'}
        </p>

        <ol className={geo.rows}>
          <li>
            <div className={geo.rowTitle}>
              <strong>
                {es
                  ? 'Área geográfica por establecer'
                  : 'Geographic area to be established'}
              </strong>

              <span>
                {es ? 'Orden' : 'Rank'} — · n = —
              </span>
            </div>

            <div
              className={geo.track}
              aria-hidden="true"
            />

            <dl className={geo.values}>
              <div>
                <dt>{es ? 'Mediana' : 'Median'}</dt>
                <dd>
                  — <small>CRC / m²</small>
                </dd>
              </div>

              <div>
                <dt>
                  {es
                    ? 'Diferencia del mercado'
                    : 'Difference from market'}
                </dt>
                <dd>
                  — <small>CRC / m²</small>
                </dd>
              </div>

              <div>
                <dt>
                  {es
                    ? 'Diferencia porcentual'
                    : 'Percentage difference'}
                </dt>
                <dd>—%</dd>
              </div>
            </dl>
          </li>
        </ol>

        <p>
          {es
            ? 'Las áreas geográficas y sus resultados aparecerán después de ejecutar la comparación.'
            : 'Geographic areas and their results will appear after the comparison is executed.'}
        </p>
      </section>

      <details className={styles.method}>
        <summary>
          {es ? 'Metodología' : 'Methodology'}
        </summary>

        <p>
          {es
            ? 'Cada observación usa el precio de oferta normalizado a CRC y el área exacta elegible. Los rangos no sustituyen medidas exactas. Cada comparación utiliza una transacción, base de propiedad, normalización y nivel geográfico.'
            : 'Each observation uses the CRC-normalized asking price and eligible exact area. Ranges do not substitute exact measurements. Each comparison uses one transaction, Property Basis, normalization and geographic level.'}
        </p>

        <p>
          {es
            ? 'La pertenencia geográfica es canónica. Solo se muestran cohortes representadas por observaciones elegibles. La referencia incluye la población elegible del mercado definido, incluso observaciones sin identidad geográfica suficiente para el nivel solicitado.'
            : 'Geographic membership is canonical. Only cohorts represented by eligible observations are shown. The reference includes the eligible defined-market population, even observations without sufficient geographic identity for the requested level.'}
        </p>

        <p>
          {es
            ? 'Las cohortes se ordenan por mediana descendente. Las medianas iguales conservan el orden determinista por nombre e identidad. Los números de orden no establecen diferencias analíticas.'
            : 'Cohorts are ordered by descending median. Equal medians retain deterministic name-and-identity ordering. Sequential ranks do not establish analytical differences.'}
        </p>

        <p>
          {es
            ? 'Diferencia = mediana del área menos mediana del mercado. Porcentaje = diferencia dividida por mediana del mercado × 100.'
            : 'Difference = area median minus market median. Percentage = difference divided by market median × 100.'}
        </p>

        <p>
          {es
            ? 'El número de observaciones permanece explícito. Las diferencias observadas no establecen causalidad, valor ni recomendaciones.'
            : 'Observation counts remain explicit. Observed differences establish no causation, value judgment or recommendation.'}
        </p>
      </details>
    </>
  )
}
