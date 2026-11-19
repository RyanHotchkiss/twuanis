
'use client'

import {useId} from 'react'
import type {Normalization} from './contract'

export default function ConstructionLandNotRun({
  language,
  mode,
}: {
  language: 'en' | 'es'
  mode: Normalization | ''
}) {
  const es = language === 'es'
  const id = useId()

  const unit =
    mode === 'land'
      ? es ? 'CRC / m² de terreno' : 'CRC / land m²'
      : mode === 'construction'
        ? es ? 'CRC / m² de construcción' : 'CRC / construction m²'
        : 'CRC / m²'

  return (
    <div
      aria-label={
        es
          ? 'Vista previa de construcción/terreno y precio por m²'
          : 'Construction-to-Land and Price / m² preview'
      }
    >
      <section>
        <h3>
          {es
            ? '¿Cómo difiere la mediana del precio por m² entre cohortes de construcción/terreno?'
            : 'How does median Price / m² differ across Construction-to-Land cohorts?'}
        </h3>

        <p>
          {es ? 'Propiedades representadas' : 'Represented properties'}:
          {' '}n = —.{' '}
          {es ? 'Cohortes con datos' : 'Populated cohorts'}: —.
        </p>

        <svg
          viewBox="0 0 400 260"
          role="img"
          aria-labelledby={id}
          style={{width: '100%', maxWidth: 700, height: 'auto'}}
        >
          <title id={id}>
            {es
              ? 'Vista previa sin calcular: ejes de construcción/terreno y precio por m²'
              : 'Uncalculated preview: Construction-to-Land and Price / m² axes'}
          </title>

          <path
            d="M45 30V210H380"
            fill="none"
            stroke="currentColor"
          />

          <text x="45" y="235" fill="currentColor">
            0
          </text>

          <text
            x="380"
            y="235"
            textAnchor="end"
            fill="currentColor"
          >
            —
          </text>

          <text
            x="45"
            y="20"
            textAnchor="start"
            fill="currentColor"
            fontSize="12"
          >
            —
          </text>
        </svg>

        <p>
          {es
            ? 'Eje horizontal: mediana de construcción/terreno.'
            : 'Horizontal axis: median Construction-to-Land ratio.'}
        </p>

        <p>
          {es ? 'Eje vertical: mediana' : 'Vertical axis: median'}{' '}
          {unit}.{' '}
          {es
            ? 'Cada punto es evidencia agregada; no representa necesariamente una propiedad individual.'
            : 'Each point is aggregate evidence; it does not necessarily represent an individual property.'}
        </p>

        <dl>
          <div
            style={{
              padding: '12px 0',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <dt>
              <strong>
                {es
                  ? 'Intervalo de C/L por establecer'
                  : 'C/L interval to be established'}
              </strong>
              {' · '}n = —
            </dt>

            <dd style={{marginLeft: 0}}>
              {es ? 'Mediana exacta de C/L' : 'Median exact C/L'}: —
              {' · '}
              {es ? 'Mediana del precio por m²' : 'Median Price / m²'}:
              {' '}— {unit}
            </dd>
          </div>
        </dl>

        <p>
          {es
            ? 'Las cohortes y sus coordenadas aparecerán después de ejecutar el análisis.'
            : 'Cohorts and their coordinates will appear after the analysis is executed.'}
        </p>
      </section>

      <section>
        <h3>
          {es
            ? '¿Qué asociación de rangos se observa entre construcción/terreno y precio por m²?'
            : 'What rank association is observed between Construction-to-Land ratio and Price / m²?'}
        </h3>

        <p>
          Spearman ρ: <strong>—</strong>
        </p>

        <p>
          {es
            ? 'Se requieren al menos 3 cohortes con datos y 12 propiedades representadas. Todavía no se ha evaluado si se cumplen los requisitos.'
            : 'At least 3 populated cohorts and 12 represented properties are required. Whether these requirements are met has not yet been evaluated.'}
        </p>
      </section>

      <details>
        <summary>
          {es ? 'Metodología y límites' : 'Methodology and limits'}
        </summary>

        <p>
          {es
            ? 'C/L = área exacta de construcción ÷ área exacta del terreno. Ambas deben ser positivas, finitas y analíticamente utilizables. Los rangos no sustituyen mediciones exactas. C/L puede superar 1.'
            : 'C/L = exact Construction Area ÷ exact Property Area. Both must be positive, finite and analytically usable. Ranges do not substitute for exact measurements. C/L may exceed 1.'}
        </p>

        <p>
          {es
            ? 'C/L no establece cobertura del suelo, huella del edificio, densidad, FAR ni capacidad de desarrollo.'
            : 'C/L does not establish site coverage, building footprint, density, FAR or development capacity.'}
        </p>

        <p>
          {mode === 'land'
            ? es
              ? 'C/L y el precio por m² = P/L comparten el terreno como denominador.'
              : 'C/L and Price / m² = P/L share land area as a denominator.'
            : mode === 'construction'
              ? es
                ? 'El área de construcción está en el numerador de C/L y en el denominador de P/C.'
                : 'Construction Area appears in the numerator of C/L and the denominator of P/C.'
              : es
                ? 'La relación matemática entre C/L y el precio por m² depende de la base de normalización seleccionada.'
                : 'The mathematical relationship between C/L and Price / m² depends on the selected normalization basis.'}
        </p>

        <p>
          {es
            ? 'Spearman usa las medianas de las cohortes, con rangos promedio en los empates. La asociación es descriptiva, no causal. No se calcula regresión, R² ni cambio porcentual modelado.'
            : 'Spearman uses cohort medians, with average ranks for ties. Association is descriptive, not causal. No regression, R² or modeled percentage change is calculated.'}
        </p>
      </details>

      <p>
        {es
          ? 'TWUANIS REPORTA EVIDENCIA DEL MERCADO. TWUANIS NO PRESCRIBE DECISIONES.'
          : 'TWUANIS REPORTS MARKET EVIDENCE. TWUANIS DOES NOT PRESCRIBE DECISIONS.'}
      </p>
    </div>
  )
}
