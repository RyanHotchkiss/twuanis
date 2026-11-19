
'use client'

import {statisticKeys, words} from './AskingPriceResult'
import styles from './AskingPriceDistribution.module.css'
import shared from './market-summary/workspace.module.css'

type Lang = 'en' | 'es'

export default function AskingPriceNotRun({
  lang,
  listing = false,
}: {
  lang: Lang
  listing?: boolean
}) {
  const w = words[lang]
  const es = lang === 'es'

  return (
    <section
      className={styles.result}
      aria-label={es ? 'Vista previa de distribución de precios' : 'Asking price distribution preview'}
    >
      <h3>{es ? 'Distribución de precios de oferta' : 'Asking price distribution'}</h3>
      <p className={shared.sectionQuestion}>{w.primary}</p>

      <div className={styles.counts}>
        <div>
          <h3>{w.market}</h3>
          <strong>—</strong>
        </div>
        <div>
          <h3>{w.priced}</h3>
          <strong>—</strong>
        </div>
      </div>

      <p>{w.notSale}</p>
      <h3>{es ? 'Precio de oferta · CRC' : 'Asking price · CRC'}</h3>

      <dl className={styles.statistics}>
        {statisticKeys.map(key => (
          <div key={key}>
            <dt>{w[key]}</dt>
            <dd>—</dd>
          </div>
        ))}
      </dl>

      <figure className={styles.figure}>
        <figcaption>{w.range}</figcaption>
        <p>{es ? 'Sin calcular' : 'Not calculated'}</p>
      </figure>

      <figure className={styles.figure}>
        <figcaption>
          {es
            ? 'Distribución central de precios de oferta · P10 a P90'
            : 'Central asking-price distribution · P10 to P90'}
        </figcaption>
        <p>{es ? 'Sin calcular' : 'Not calculated'}</p>
      </figure>

      {listing && (
        <div>
          <h3>{es ? 'Posición del precio de la propiedad' : 'Property asking-price position'}</h3>
          <p>
            {es
              ? 'La posición de la propiedad dentro del rango observado se mostrará después de ejecutar el algoritmo.'
              : 'The property position within the observed range will appear after the algorithm runs.'}
          </p>
        </div>
      )}

      <p className={shared.sectionQuestion}>
        {es
          ? 'Sin calcular. Ejecute el algoritmo para obtener los resultados.'
          : 'Not calculated. Run the algorithm to obtain results.'}
      </p>

      <details>
        <summary>{w.method}</summary>
        <p>
          {es
            ? 'La población del mercado cuenta anuncios canónicos activos que cumplen la pregunta definida. La población con precio cuenta anuncios con precios de oferta válidos. Los precios de venta y alquiler se analizan por separado.'
            : 'The market population counts active canonical listings satisfying the defined question. The priced population counts listings with eligible asking prices. Sale and rent are analyzed separately.'}
        </p>
        <p>
          {es
            ? 'Los cuantiles se calculan mediante interpolación lineal. Los precios de oferta no representan transacciones cerradas. Un guion significa que el análisis no se ha ejecutado.'
            : 'Quantiles use linear interpolation. Asking prices are not completed transaction prices. A dash means the analysis has not been executed.'}
        </p>
      </details>
    </section>
  )
}
