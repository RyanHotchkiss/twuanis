
'use client'

import type { Language } from '../market-filters/types'
import { compositionLensQuestion } from './contract'
import shared from '../market-summary/workspace.module.css'
import styles from './composition.module.css'

export default function MarketCompositionNotRun({
  language,
}: {
  language: Language
}) {
  const es = language === 'es'

  const dimensions = es
    ? ['Provincia', 'Cantón', 'Distrito', 'Tipo de propiedad', 'Dormitorios', 'Baños', 'Estacionamiento', 'Año de construcción', 'Servicios', 'Entorno', 'Terreno', 'Accesibilidad', 'Estado legal']
    : ['Province', 'Canton', 'District', 'Property type', 'Bedrooms', 'Bathrooms', 'Parking', 'Year built', 'Utilities', 'Environment', 'Terrain', 'Accessibility', 'Legal status']

  return (
    <div aria-label={es ? 'Vista previa de composición del mercado' : 'Market Composition preview'}>
      <section className={shared.evidence}>
        <h3>{es ? 'Composición por característica' : 'Characteristic composition'}</h3>
        <p className={shared.sectionQuestion}>
          {es
            ? '¿Qué características componen el mercado definido?'
            : 'What characteristics compose the defined market?'}
        </p>
        <p className={shared.sectionQuestion}>
          {compositionLensQuestion[language]}
        </p>

        <p className={styles.population}>
          <strong>—</strong>{' '}
          {es ? 'anuncios en el mercado definido' : 'listings in the defined market'}
        </p>

        <p className={shared.sectionQuestion}>
          {es
            ? 'Sin calcular. Aplique los datos para obtener la composición del mercado.'
            : 'Not calculated. Apply inputs to obtain the market composition.'}
        </p>

        <div className={styles.dimensions}>
          {dimensions.map((dimension) => (
            <section className={styles.dimension} key={dimension}>
              <h4>{dimension}</h4>
              <table>
                <thead>
                  <tr>
                    <th scope="col">{es ? 'Característica' : 'Characteristic'}</th>
                    <th scope="col">{es ? 'Anuncios' : 'Listings'}</th>
                    <th scope="col">{es ? '% del mercado' : '% of market'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">{es ? 'Sin calcular' : 'Not calculated'}</th>
                    <td>—</td>
                    <td className={styles.share}>—</td>
                  </tr>
                </tbody>
              </table>
            </section>
          ))}
        </div>
      </section>

      <details className={shared.method}>
        <summary>{es ? 'Metodología' : 'Methodology'}</summary>
        <p>
          {es
            ? 'Cada conteo corresponde a anuncios distintos del mercado definido con evidencia canónica que establece la característica. Los porcentajes utilizan todos los anuncios del mercado definido como denominador.'
            : 'Each count represents distinct listings in the defined market with canonical evidence establishing the characteristic. Percentages use all listings in the defined market as the denominator.'}
        </p>
        <p>
          {es
            ? 'Un anuncio puede tener varias características dentro de una dimensión. Los porcentajes pueden superar el 100 % al sumarse. La ausencia de evidencia no demuestra que una característica esté ausente.'
            : 'A listing can have multiple characteristics within a dimension. Shares may sum to more than 100%. Missing evidence does not establish that a characteristic is absent.'}
        </p>
        <p>
          {es
            ? 'Un guion indica que el análisis todavía no se ha ejecutado. Cero es un resultado calculado, no un valor pendiente.'
            : 'A dash indicates the analysis has not yet been executed. Zero is a calculated result, not a pending value.'}
        </p>
      </details>
    </div>
  )
}
