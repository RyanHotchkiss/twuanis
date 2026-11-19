
'use client'

import {useId} from 'react'
import {useHubUniverse, priceMeaning} from '../HubUniverseContext'
import {cohortQuestion, cohortTitle} from './contract'
import styles from '../market-summary/workspace.module.css'

type Props = {
  language: 'en' | 'es'
  draft: Record<string, string | undefined>
}

export default function CohortNotRun({language, draft}: Props) {
  const es = language === 'es'
  const chartId = useId()
  const population = useHubUniverse()

  const transaction = draft.transaction_type
  const basis = draft.property_basis
  const normalization = draft.normalization_basis
  const reference = draft.reference_cohort

  const unit =
    normalization === 'land'
      ? es ? 'CRC / m² de terreno' : 'CRC / land m²'
      : normalization === 'construction'
        ? es ? 'CRC / m² de construcción' : 'CRC / construction m²'
        : 'CRC / m²'

  const monthly = transaction === 'rent'
    ? es ? ' / mes' : ' / month'
    : ''

  const propertyBasis =
    basis === 'land_only'
      ? es ? 'Terreno vacío' : 'Vacant Land'
      : basis === 'improved_property'
        ? es ? 'Propiedad mejorada' : 'Improved Property'
        : '—'

  const priceType =
    transaction === 'sale' || transaction === 'rent'
      ? priceMeaning(population, language, transaction)
      : '—'

  const referenceLabel =
    reference === 'A' || reference === 'B'
      ? reference
      : '—'

  return (
    <div
      aria-label={
        es
          ? 'Vista previa de comparación entre cohortes'
          : 'Cohort comparison preview'
      }
    >
      <h3>
        {es ? 'Comparación de cohortes' : 'Cohort comparison'}
        {' · '}
        {es ? 'Sin calcular' : 'Not calculated'}
      </h3>

      <p className={styles.sectionQuestion}>
        {cohortQuestion[language]}
      </p>

      <section className={styles.identity}>
        <div>
          <p className={styles.eyebrow}>
            {es
              ? 'Definición del precio por m²'
              : 'Price / m² definition'}
          </p>

          <p>
            {propertyBasis} · {priceType} · {unit}{monthly}
          </p>

          <p>
            {es ? 'Fecha analítica' : 'Analytical date'}: —
          </p>
        </div>
      </section>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit,minmax(min(100%,320px),1fr))',
          gap: 24,
        }}
      >
        {(['A', 'B'] as const).map(key => (
          <section key={key}>
            <h4>
              {es ? 'Cohorte' : 'Cohort'} {key}
            </h4>

            <p>
              {es
                ? 'Geografía: pendiente de definición analítica'
                : 'Geography: analytical definition pending'}
            </p>

            <p>
              {es
                ? 'Tipo de propiedad y características según la selección anterior.'
                : 'Property Type and characteristics as selected above.'}
            </p>

            <p>
              {es
                ? 'La pertenencia y las observaciones elegibles se establecerán al ejecutar la comparación.'
                : 'Membership and eligible observations will be established when the comparison runs.'}
            </p>
          </section>
        ))}
      </div>

      <section
        aria-label={
          es ? 'Comparación de medianas' : 'Median comparison'
        }
        style={{marginTop: 24}}
      >
        <h4>
          {es
            ? 'Medianas del precio de oferta por m²'
            : 'Median asking Price / m²'}
        </h4>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(150px,1fr))',
            gap: 20,
          }}
        >
          {(['A', 'B'] as const).map(key => (
            <div key={key}>
              <strong>
                {es ? 'Cohorte' : 'Cohort'} {key}
              </strong>
              <p>— {unit}{monthly}</p>
              <p>n = —</p>
            </div>
          ))}
        </div>

        <svg
          viewBox="0 0 420 170"
          role="img"
          aria-labelledby={chartId}
          style={{
            width: '100%',
            maxWidth: 750,
            display: 'block',
          }}
        >
          <title id={chartId}>
            {es
              ? 'Vista previa sin calcular de medianas en una escala compartida'
              : 'Uncalculated preview of medians on a shared scale'}
          </title>

          <line
            x1="35"
            y1="130"
            x2="385"
            y2="130"
            stroke="#999"
          />

          <text
            x="8"
            y="50"
            fill="currentColor"
            fontSize="18"
          >
            A
          </text>

          <text
            x="8"
            y="95"
            fill="currentColor"
            fontSize="18"
          >
            B
          </text>

          <text
            x="35"
            y="151"
            fill="currentColor"
            fontSize="16"
          >
            0
          </text>

          <text
            x="385"
            y="151"
            textAnchor="end"
            fill="currentColor"
            fontSize="16"
          >
            —
          </text>
        </svg>

        <p>
          <strong>
            {es
              ? 'Diferencia de medianas (A − B)'
              : 'Median difference (A − B)'}
          </strong>
          : —
        </p>

        <p>
          <strong>
            {es
              ? 'Diferencia porcentual'
              : 'Percentage difference'}
          </strong>
          : —%
        </p>

        <p>
          {es
            ? 'Referencia porcentual: Cohorte'
            : 'Percentage reference: Cohort'}{' '}
          {referenceLabel}
        </p>

        <p>
          {es
            ? 'La suficiencia de evidencia todavía no se ha evaluado. Los tamaños de muestra y las diferencias se establecerán únicamente después del cálculo.'
            : 'Evidence sufficiency has not yet been evaluated. Sample sizes and differences will be established only after calculation.'}
        </p>
      </section>

      <p>
        {es
          ? 'Los conteos exactos seleccionados usan hechos canónicos verificados, sin crear membresías de categoría. La evidencia ausente, inválida o no exacta se excluye.'
          : 'Selected exact counts use verified canonical facts without creating category memberships. Missing, invalid or nonexact evidence is excluded.'}
      </p>

      <details className={styles.optional}>
        <summary>
          {es ? 'Metodología' : 'Methodology'}
        </summary>

        <p>
          {es
            ? 'Cada cohorte requiere su geografía, tipo de propiedad, ambas características canónicas positivas y todas las restricciones seleccionadas. Las cohortes pueden superponerse y no necesariamente abarcan todo un mercado. n cuenta observaciones elegibles de precio por m², no todas las candidatas.'
            : 'Each cohort requires its geography, Property Type, both positive canonical characteristics and all selected constraints. Cohorts may overlap and need not exhaust a market. n counts eligible Price / m² observations, not all candidates.'}
        </p>

        <p>
          {es
            ? 'El denominador requiere un área exacta positiva. Los rangos restringen la pertenencia; no fabrican mediciones. Construcción/terreno usa ambas áreas exactas y no representa cobertura del suelo.'
            : 'The denominator requires a positive exact area. Ranges constrain membership; they do not manufacture measurements. Construction-to-Land uses both exact areas and does not represent site coverage.'}
        </p>

        <p>
          {es
            ? 'Diferencia = mediana A − mediana B. Porcentaje = diferencia ÷ mediana de referencia seleccionada × 100. La referencia cambia el denominador, no la dirección.'
            : 'Difference = median A − median B. Percentage = difference ÷ selected reference median × 100. Reference changes the denominator, not the direction.'}
        </p>

        <p>
          {es
            ? 'La comparación requiere un mínimo de observaciones elegibles en cada cohorte, determinado por el motor. Este requisito no establece significancia estadística ni causalidad. La comparación no atribuye la diferencia a ninguna característica.'
            : 'The comparison requires a minimum number of eligible observations in each cohort, determined by the engine. This prerequisite establishes neither statistical significance nor causation. The comparison does not attribute the difference to any characteristic.'}
        </p>
      </details>
    </div>
  )
}
