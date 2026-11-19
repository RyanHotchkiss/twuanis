
'use client'

import type {Language} from '../market-filters/types'
import {
  configurationShareQuestion,
  evidenceContext,
} from './contract'
import shared from '../market-summary/workspace.module.css'
import styles from './frequency.module.css'

export default function ConfigurationFrequencyNotRun({
  language,
}: {
  language: Language
}) {
  const es = language === 'es'

  return (
    <>
      <section
        className={shared.evidence}
        aria-label={
          es
            ? 'Vista previa de frecuencia de configuración'
            : 'Configuration Frequency preview'
        }
      >
        <h3>
          {es
            ? 'Frecuencia de evidencia positiva'
            : 'Positive-evidence frequency'}
        </h3>

        <p className={shared.sectionQuestion}>
          {configurationShareQuestion[language]}
        </p>

        <div className={styles.counts}>
          <p>
            <strong>—</strong>
            <span>
              {es
                ? 'anuncios acreditan positivamente la configuración completa'
                : 'listings positively establish the complete configuration'}
            </span>
          </p>

          <p>
            <strong>—</strong>
            <span>
              {es
                ? 'anuncios en todo el mercado definido · denominador'
                : 'listings in the entire defined market · denominator'}
            </span>
          </p>
        </div>

        <p className={styles.share}>
          —%{' '}
          <span>
            {es ? 'del mercado definido' : 'of the defined market'}
          </span>
        </p>

        <div
          className={styles.track}
          aria-hidden="true"
        />

        <p className={styles.note}>
          {es
            ? 'La parte coloreada representa únicamente pertenencia acreditada positivamente. El resto no está clasificado como ausencia o no coincidencia conocida.'
            : 'The filled portion represents positively established membership only. The remainder is not classified as absence or known nonmembership.'}
        </p>

        <p className={styles.context}>
          {evidenceContext[language]}
        </p>

        <p className={styles.note}>
          {es
            ? 'Sin calcular. Ejecute el algoritmo para establecer la frecuencia de la configuración seleccionada.'
            : 'Not calculated. Run the algorithm to establish the frequency of the selected configuration.'}
        </p>
      </section>

      <details className={shared.method}>
        <summary>
          {es ? 'Metodología' : 'Methodology'}
        </summary>

        <p>
          {es
            ? 'El denominador cuenta anuncios distintos, activos y canónicos que cumplen transacción, geografía y tipo de propiedad. Las opciones seleccionadas dentro de Habitaciones, Baños y Estacionamiento son alternativas.'
            : 'The denominator counts distinct active canonical listings satisfying transaction, geography and property type. Selected options within Bedrooms, Bathrooms and Parking are alternatives.'}
        </p>

        <p>
          {es
            ? 'El numerador exige conjuntamente todas las dimensiones seleccionadas y cada característica semántica seleccionada. La evidencia desconocida no acredita una coincidencia.'
            : 'The numerator requires all selected dimensions and every selected semantic characteristic together. Unknown evidence does not establish a match.'}
        </p>

        <p>
          {es
            ? 'Los rangos son restricciones, no medidas exactas. Año de construcción y distancia a carretera requieren evidencia numérica que establezca la restricción seleccionada.'
            : 'Ranges are constraints, not exact measurements. Year built and road distance require numerical evidence establishing the selected constraint.'}
        </p>

        <p>
          {es
            ? 'El porcentaje usa todo el mercado como denominador. No se distinguen los casos desconocidos de las no coincidencias conocidas. No se evalúan demanda, valor ni rareza.'
            : 'The percentage uses the entire market as its denominator. Unknown cases are not distinguished from known nonmembers. Demand, value and rarity are not evaluated.'}
        </p>
      </details>
    </>
  )
}
