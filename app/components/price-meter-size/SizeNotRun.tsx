
'use client'

import type {SizeMode} from './contract'
import styles from '../market-summary/workspace.module.css'
import css from './size.module.css'

export default function SizeNotRun({
  language,
  mode,
}: {
  language: 'en' | 'es'
  mode: SizeMode
}) {
  const es = language === 'es'

  const sizeLabel =
    mode === 'property-area'
      ? es ? 'Área del terreno' : 'Property Area'
      : es ? 'Área de construcción' : 'Construction Area'

  const unit =
    mode === 'property-area'
      ? es ? 'CRC / m² de terreno' : 'CRC / land m²'
      : es ? 'CRC / m² de construcción' : 'CRC / construction m²'

  const stats = [
    {
      title: 'Spearman ρ',
      description: es
        ? 'Asociación por rangos entre coordenadas de cohortes'
        : 'Rank association among cohort coordinates',
    },
    {
      title: es ? 'Pendiente log-log β' : 'Log-log slope β',
      description: es
        ? 'Relación ajustada entre log(área) y log(precio por m²)'
        : 'Fitted relationship between log(area) and log(Price / m²)',
    },
    {
      title: 'R²',
      description: es
        ? 'Ajuste del mismo modelo log-log'
        : 'Fit of the same log-log model',
    },
  ]

  return (
    <>
      <section
        className={styles.evidence}
        aria-label={
          es
            ? 'Vista previa del análisis de tamaño'
            : 'Size analysis preview'
        }
      >
        <h3>
          {es
            ? 'Precio por m² por cohorte de tamaño'
            : 'Size Cohort Price / m²'}
          {' · '}
          {es ? 'Sin calcular' : 'Not calculated'}
        </h3>

        <p className={styles.sectionQuestion}>
          {es
            ? '¿Cómo difiere la mediana del precio por m² entre las cohortes del tamaño seleccionado?'
            : 'How does median Price / m² differ across the selected size cohorts?'}
        </p>

        <p>
          {es ? 'Dimensión de tamaño' : 'Size dimension'}:{' '}
          <strong>{sizeLabel}</strong>
        </p>

        <p>
          {es ? 'Anuncios del mercado definido' : 'Defined-market listings'}: —
          {' · '}
          {es ? 'Observaciones representadas' : 'Represented observations'}:{' '}
          <strong>—</strong>
          {' · '}
          {es ? 'Cohortes con datos' : 'Populated cohorts'}: —
        </p>

        <p>
          {es
            ? 'Coordenadas agregadas observadas. Eje X: mediana del área exacta (m²). Eje Y: mediana del precio por m². Escalas lineales desde cero.'
            : 'Observed aggregate coordinates. X: median exact area (m²). Y: median Price / m². Linear scales from zero.'}
        </p>

        <svg
          viewBox="0 0 640 340"
          className={css.plot}
          role="img"
          aria-label={
            es
              ? 'Vista previa de los ejes; no se han calculado coordenadas.'
              : 'Preview of axes; no coordinates have been calculated.'
          }
        >
          <line x1="80" y1="275" x2="590" y2="275" />
          <line x1="80" y1="30" x2="80" y2="275" />

          <text x="72" y="294">0</text>
          <text x="585" y="298" textAnchor="end">
            — m²
          </text>
          <text x="80" y="21">
            — {unit}
          </text>
        </svg>

        <ol className={css.bands}>
          <li>
            <strong>
              {es
                ? 'Cohortes de tamaño por establecer'
                : 'Size cohorts to be established'}
            </strong>

            <dl className={css.values}>
              <div>
                <dt>
                  {es
                    ? 'Mediana del área exacta'
                    : 'Median exact area'}
                </dt>
                <dd>— m²</dd>
              </div>

              <div>
                <dt>
                  {es
                    ? 'Mediana del precio por m²'
                    : 'Median Price / m²'}
                </dt>
                <dd>— {unit}</dd>
              </div>

              <div>
                <dt>n</dt>
                <dd>—</dd>
              </div>
            </dl>
          </li>
        </ol>
      </section>

      <section className={styles.evidence}>
        <h3>
          {es ? 'Relación estadística' : 'Statistical Relationship'}
        </h3>

        <p className={styles.sectionQuestion}>
          {es
            ? '¿Qué relación estadística se observa entre la dimensión de tamaño seleccionada y el precio por m²?'
            : 'What statistical relationship is observed between the selected size dimension and Price / m²?'}
        </p>

        <p>
          {es
            ? 'Coordenadas agregadas de entrada'
            : 'Aggregate input coordinates'}: —.
          {' '}
          {es
            ? 'Observaciones representadas'
            : 'Represented observations'}: —.
        </p>

        <dl className={css.stats}>
          {stats.map(stat => (
            <div key={stat.title}>
              <dt>
                {stat.title}
                <small>{stat.description}</small>
              </dt>
              <dd>—</dd>
            </div>
          ))}
        </dl>

        <p>
          {es
            ? 'Se requieren al menos tres cohortes con datos para calcular las estadísticas de relación. Todavía no se ha evaluado si se cumplen los requisitos.'
            : 'At least three populated cohorts are required to calculate relationship statistics. Whether the requirements are met has not yet been evaluated.'}
        </p>

        <p className={css.coupling}>
          {es
            ? 'El área seleccionada también está en el denominador del precio por m². La asociación entre estas variables matemáticamente vinculadas no establece un efecto causal independiente del tamaño.'
            : 'The selected area is also in the Price / m² denominator. Association between these mathematically coupled variables does not establish an independent causal effect of size.'}
        </p>
      </section>

      <details className={styles.method}>
        <summary>
          {es ? 'Metodología' : 'Methodology'}
        </summary>

        <p>
          {es
            ? 'Los rangos restringen pertenencia; no son medidas exactas. Cada punto usa la mediana del área exacta y la mediana del precio de oferta normalizado a CRC por m² de su cohorte. Es una coordenada agregada; no necesariamente corresponde a un anuncio real.'
            : 'Ranges constrain membership; they are not exact measurements. Each point uses its cohort’s median exact area and median CRC-normalized asking Price / m². It is an aggregate coordinate, not necessarily a real listing.'}
        </p>

        <p>
          {es
            ? 'Spearman usa rangos con empates promediados de las coordenadas de cohortes. El modelo ajusta ln(precio por m²) = α + β ln(área) sobre esas mismas coordenadas, no sobre todos los anuncios individuales.'
            : 'Spearman uses average tied ranks of cohort coordinates. The model fits ln(Price / m²) = α + β ln(area) over those same coordinates, not over every individual listing.'}
        </p>

        <p>
          {es
            ? 'R² describe el ajuste en espacio logarítmico; no es confianza ni exactitud predictiva.'
            : 'R² describes fit in log space; it is not confidence or predictive accuracy.'}
        </p>

        <p>
          {es
            ? 'Los límites inferiores finitos de las cohortes se incluyen; los superiores finitos se excluyen. Los valores extremos permanecen representados. Cada estadística conserva sus requisitos de cálculo; una ausencia no se reemplaza con cero.'
            : 'Finite lower cohort boundaries are inclusive; finite upper boundaries are exclusive. Extreme values remain represented. Each statistic retains its computability requirements; absence is not replaced by zero.'}
        </p>
      </details>
    </>
  )
}
