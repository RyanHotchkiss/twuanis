
'use client'

import type {Language} from '../market-filters/types'
import {question} from './contract'
import styles from './workspace.module.css'

export default function MarketSummaryNotRun({
  language,
}: {
  language: Language
}) {
  const es = language === 'es'

  return (
    <div aria-label={es ? 'Vista previa del resumen del mercado' : 'Market Summary preview'}>
      <section className={styles.evidence}>
        <h3>{es ? 'Inventario actual' : 'Current inventory'}</h3>

        <p className={styles.sectionQuestion}>
          {question[language]}
        </p>

        <p className={styles.count}>
          <strong>—</strong>
          <span>{es ? 'anuncios' : 'listings'}</span>
        </p>

        <p className={styles.sectionQuestion}>
          {es
            ? 'Sin calcular. Aplique los datos para obtener el conteo del inventario actual.'
            : 'Not calculated. Apply inputs to obtain the current inventory count.'}
        </p>
      </section>

      <details className={styles.method}>
        <summary>{es ? 'Metodología' : 'Methodology'}</summary>

        <p>
          {es
            ? 'Cuenta anuncios activos con datos canónicos vigentes que cumplen la definición del mercado analizado. Cuenta anuncios, no propiedades físicas únicas ni transacciones cerradas.'
            : 'Counts active listings with current canonical data that satisfy the analyzed market definition. Counts listings, not unique physical properties or closed transactions.'}
        </p>

        <p>
          {es
            ? 'Un resultado de cero significa que el análisis se ejecutó y no encontró anuncios. Un guion significa que todavía no se ha calculado.'
            : 'A result of zero means the analysis ran and found no listings. A dash means the analysis has not yet been calculated.'}
        </p>
      </details>
    </div>
  )
}
