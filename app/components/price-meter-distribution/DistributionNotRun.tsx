
'use client'

import {distributionQuestion} from './contract'
import styles from '../market-summary/workspace.module.css'
import chart from './distribution.module.css'

export default function DistributionNotRun({
  language,
}: {
  language: 'en' | 'es'
}) {
  const es = language === 'es'

  const stats = [
    {key: 'minimum', label: es ? 'Mínimo observado' : 'Observed minimum'},
    {key: 'p10', label: 'P10'},
    {key: 'p25', label: 'P25'},
    {key: 'median', label: es ? 'Mediana' : 'Median'},
    {key: 'p75', label: 'P75'},
    {key: 'p90', label: 'P90'},
    {key: 'maximum', label: es ? 'Máximo observado' : 'Observed maximum'},
  ]

  return (
    <>
      <section
        className={styles.evidence}
        aria-label={
          es
            ? 'Vista previa de distribución del precio por m²'
            : 'Price / m² Distribution preview'
        }
      >
        <h3>
          {es
            ? 'Distribución del precio por m²'
            : 'Price / m² Distribution'}{' '}
          · {es ? 'Sin calcular' : 'Not calculated'}
        </h3>

        <p className={styles.sectionQuestion}>
          {distributionQuestion[language]}
        </p>

        <p>
          {es ? 'Observaciones elegibles' : 'Eligible observations'}:{' '}
          <strong>—</strong>
          {' · '}
          {es ? 'Anuncios del mercado definido' : 'Defined-market listings'}: —
        </p>

        <p className={styles.count}>
          <strong>—</strong>
          <span>
            {es ? 'Mediana' : 'Median'} ·{' '}
            {es ? 'CRC / m²' : 'CRC / m²'}
          </span>
        </p>

        <div
          className={chart.ruler}
          role="img"
          aria-label={
            es
              ? 'Escala de cuantiles sin calcular. No se han establecido posiciones.'
              : 'Uncalculated quantile scale. No positions have been established.'
          }
        />

        <p>
          {es
            ? 'Escala lineal completa del mínimo al máximo observado; no se recortan extremos.'
            : 'Full linear scale from observed minimum to maximum; extremes are not clipped.'}
        </p>

        <dl className={chart.values}>
          {stats.map(stat => (
            <div key={stat.key}>
              <dt>{stat.label}</dt>
              <dd>
                — <small>CRC / m²</small>
              </dd>
            </div>
          ))}
        </dl>

        <p>
          {es
            ? 'Seleccione la base de propiedad y la normalización, luego ejecute el algoritmo para establecer la distribución.'
            : 'Select the Property Basis and normalization, then run the algorithm to establish the distribution.'}
        </p>
      </section>

      <details className={styles.method}>
        <summary>{es ? 'Metodología' : 'Methodology'}</summary>

        <p>
          {es
            ? 'Una distribución corresponde a una transacción, base de propiedad y normalización. Cada observación divide el precio de oferta normalizado a CRC por el área exacta elegible del anuncio.'
            : 'One distribution represents one transaction, Property Basis and normalization. Each observation divides the CRC-normalized asking price by the listing’s eligible exact area.'}
        </p>

        <p>
          {es
            ? 'Los rangos restringen el mercado; no sustituyen medidas exactas. La base desconocida y la evidencia no elegible no producen observaciones.'
            : 'Ranges constrain the market; they do not substitute exact measurements. Unknown basis and ineligible evidence do not produce observations.'}
        </p>

        <p>
          {es
            ? 'Los cuantiles se establecen en el servidor mediante interpolación lineal sobre observaciones ordenadas. El número de observaciones elegibles permanece explícito.'
            : 'Quantiles are established server-side by linear interpolation over ordered observations. The eligible observation count remains explicit.'}
        </p>

        <p>
          {es
            ? 'El terreno sin construcción solo admite normalización por área del terreno. Una propiedad con construcción puede usar área del terreno o área de construcción, según la definición seleccionada.'
            : 'Vacant Land permits Land Area normalization only. Improved Property may use Land Area or Construction Area, according to the selected definition.'}
        </p>

        <p>
          {es
            ? 'No se infiere valor, causalidad ni confianza cualitativa. La relación construcción/terreno no establece huella ni cobertura.'
            : 'No value judgment, causation or qualitative confidence is inferred. Construction/land ratio does not establish footprint or site coverage.'}
        </p>
      </details>
    </>
  )
}
