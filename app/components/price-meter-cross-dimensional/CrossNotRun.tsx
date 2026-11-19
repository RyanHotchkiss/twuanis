
'use client'

import {useId} from 'react'
import {crossQuestion, dimensionLabels, ownerLabels} from './contract'
import styles from '../market-summary/workspace.module.css'
import crossStyles from './cross.module.css'

type Props = {
  language: 'en' | 'es'
  owner: string
  secondary: string
  questionText?: string
  cohort: string
}

export default function CrossNotRun({
  language,
  owner,
  secondary,
  questionText,
  cohort,
}: Props) {
  const es = language === 'es'
  const id = useId()

  const t = (en: string, sp: string) => es ? sp : en

  const ownerName =
    ownerLabels[language][owner as keyof typeof ownerLabels.en] ?? '—'

  const secondaryName =
    dimensionLabels[language][secondary as keyof typeof dimensionLabels.en] ?? '—'

  const cohortName =
    cohort === 'vacantLandLandNormalized'
      ? t('Vacant Land · CRC / land m²', 'Terreno vacío · CRC / m² de terreno')
      : cohort === 'improvedLandNormalized'
        ? t('Improved Property · CRC / land m²', 'Propiedad mejorada · CRC / m² de terreno')
        : cohort === 'improvedConstructionNormalized'
          ? t('Improved Property · CRC / construction m²', 'Propiedad mejorada · CRC / m² de construcción')
          : '—'

  const needsCohort =
    owner === 'phase_7_geography' ||
    owner === 'phase_9_construction_to_land'

  const isGeographic = owner === 'phase_7_geography'
  const isSize =
    owner === 'phase_8_property_area' ||
    owner === 'phase_8_construction_area'

  const xAxis =
    isGeographic
      ? t('Geographies in table order', 'Geografías en el orden de la tabla')
      : isSize
        ? t('Median exact area (m²)', 'Área exacta mediana (m²)')
        : 'C/L'

  const variationRows = isGeographic
    ? [
        t('Median difference', 'Diferencia mediana'),
        t('Percentage difference', 'Diferencia porcentual'),
      ]
    : isSize
      ? [
          'Spearman ρ',
          t('Log-log slope', 'Pendiente log-log'),
          'R²',
          t('Modeled +10% area change', 'Cambio modelado ante +10% de área'),
        ]
      : ['Spearman ρ']

  return (
    <section
      className={crossStyles.evidence}
      aria-label={t(
        'Cross-Dimensional Analysis preview',
        'Vista previa del análisis multidimensional'
      )}
    >
      <h3>
        {t('Cross-Dimensional Analysis', 'Análisis multidimensional')}
        {' · '}
        {t('Not calculated', 'Sin calcular')}
      </h3>

      <p className={styles.sectionQuestion}>
        {crossQuestion[language]}
      </p>

      <div className={styles.identity}>
        <div>
          <p className={styles.eyebrow}>
            {t('Selected relationship', 'Relación seleccionada')}
          </p>
          <p>{ownerName}</p>

          <p className={styles.eyebrow}>
            {t('Secondary dimension', 'Dimensión secundaria')}
          </p>
          <p>{secondaryName}</p>

          {questionText && <p>{questionText}</p>}

          {needsCohort && (
            <>
              <p className={styles.eyebrow}>
                {t('Price / m² definition', 'Definición del precio por m²')}
              </p>
              <p>{cohortName}</p>
            </>
          )}

          <p>
            {t('Analytical date', 'Fecha analítica')}: —
          </p>
        </div>
      </div>

      <div className={crossStyles.results}>
        <p>
          {t('Input', 'Entrada')} n = — ·{' '}
          {t('Represented', 'Representadas')} n = — ·{' '}
          {t('Excluded', 'Excluidas')} n = —
        </p>

        <section>
          <h4>
            {t('Relationship across groups', 'Relación entre grupos')}
          </h4>

          <p>
            {t('Established in', 'Establecida en')} — / —{' '}
            {t('examined groups', 'grupos examinados')} (—%).
            {' '}
            {t(
              'Established groups represent',
              'Los grupos establecidos representan'
            )}{' '}
            n = —.
          </p>

          <p>
            {t(
              'This is the share of groups meeting the evidence requirements, not proof of a stable direction or a confidence score.',
              'Es la proporción de grupos que cumplen los requisitos de evidencia, no una prueba de dirección estable ni una puntuación de confianza.'
            )}
          </p>
        </section>

        <section
          aria-label={t('Evidence by group', 'Evidencia por grupo')}
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(min(100%,280px),1fr))',
            gap: 20,
            marginBlock: 24,
          }}
        >
          <figure
            style={{
              margin: 0,
              minWidth: 0,
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 16,
            }}
          >
            <figcaption>
              {t(
                'Secondary group to be established',
                'Grupo secundario por establecer'
              )}{' '}
              · n = —
            </figcaption>

            <svg
              viewBox="0 0 360 210"
              role="img"
              aria-labelledby={id}
              style={{width: '100%', display: 'block'}}
            >
              <title id={id}>
                {t(
                  'Uncalculated group-level Price / m² plot',
                  'Gráfico de precio por m² por grupo sin calcular'
                )}
              </title>

              <path
                d="M35 10V175H350"
                fill="none"
                stroke="#888"
              />

              <text
                x="5"
                y="15"
                fill="currentColor"
                fontSize="12"
              >
                —
              </text>

              <text
                x="20"
                y="190"
                fill="currentColor"
                fontSize="12"
              >
                0
              </text>

              <text
                x="180"
                y="205"
                textAnchor="middle"
                fill="currentColor"
                fontSize="13"
              >
                {xAxis}
              </text>
            </svg>

            <p style={{fontSize: 13}}>
              {t(
                'Price / m² on the vertical axis. Group coordinates and scales will be established by the analysis.',
                'Precio por m² en el eje vertical. El análisis establecerá las coordenadas y escalas de los grupos.'
              )}
            </p>
          </figure>
        </section>

        <section>
          <h4>
            {t('Evidence by secondary group', 'Evidencia por grupo secundario')}
          </h4>

          <p>
            {t(
              'Open a group for exact coordinates, counts and evidence prerequisites. — means not established or withheld, never zero.',
              'Abre un grupo para ver coordenadas exactas, conteos y requisitos de evidencia. — significa no establecido o retenido, nunca cero.'
            )}
          </p>

          <details className={crossStyles.group}>
            <summary>
              {t(
                'Secondary group to be established',
                'Grupo secundario por establecer'
              )}{' '}
              · n = — · {t('Not calculated', 'Sin calcular')}
            </summary>

            {isGeographic ? (
              <>
                <p>
                  {t(
                    'Reference: this secondary population',
                    'Referencia: esta población secundaria'
                  )}{' '}
                  · n = — · {t('Median', 'Mediana')} — ·{' '}
                  {t('Compared geographies', 'Geografías comparadas')}: —
                </p>

                <div className={crossStyles.tableWrap}>
                  <table>
                    <thead>
                      <tr>
                        {[
                          t('Rank', 'Posición'),
                          t('Geography', 'Geografía'),
                          'n',
                          t('Median', 'Mediana'),
                          t('Difference from reference', 'Diferencia con la referencia'),
                          '%',
                        ].map(label => <th key={label}>{label}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>—</td>
                        <td>—</td>
                        <td>—</td>
                        <td>—</td>
                        <td>—</td>
                        <td>—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <>
                <p>
                  Spearman ρ = — ·{' '}
                  {t('Populated groups / required', 'Grupos con datos / requeridos')}:
                  {' '}— / —
                </p>

                {isSize && (
                  <p>
                    {t('Log-log slope', 'Pendiente log-log')} = — ·{' '}
                    R² = — ·{' '}
                    {t(
                      'Modeled +10% area change',
                      'Cambio modelado ante +10% de área'
                    )}{' '}
                    = —
                  </p>
                )}

                <p>
                  {t(
                    'Modeled statistics are shown only when authorized by the analytical evidence. Mathematical coupling may require them to be withheld.',
                    'Las estadísticas modeladas se muestran únicamente cuando la evidencia analítica las autoriza. El acoplamiento matemático puede requerir que se retengan.'
                  )}
                </p>

                <div className={crossStyles.tableWrap}>
                  <table>
                    <thead>
                      <tr>
                        <th>
                          {isSize
                            ? t('Median exact area (m²)', 'Área exacta mediana (m²)')
                            : t('Median C/L ratio', 'Razón C/L mediana')}
                        </th>
                        <th>
                          {t('Median Price / m²', 'Precio / m² mediano')}
                        </th>
                        <th>n</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>—</td>
                        <td>—</td>
                        <td>—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </details>
        </section>

        <section>
          <h4>
            {t(
              'Variation across established groups',
              'Variación entre grupos establecidos'
            )}
          </h4>

          <div className={crossStyles.tableWrap}>
            <table>
              <thead>
                <tr>
                  {[
                    t('Evidence', 'Evidencia'),
                    t('Minimum', 'Mínimo'),
                    t('Maximum', 'Máximo'),
                    t('Range', 'Rango'),
                  ].map(label => <th key={label}>{label}</th>)}
                </tr>
              </thead>
              <tbody>
                {variationRows.map(label => (
                  <tr key={label}>
                    <th>{label}</th>
                    <td>—</td>
                    <td>—</td>
                    <td>—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h4>
            {t('Reversals', 'Reversiones')} · —
          </h4>

          <p>
            {t(
              'Reversal evidence has not been evaluated.',
              'La evidencia de reversiones todavía no se ha evaluado.'
            )}
          </p>
        </section>

        <section>
          <h4>
            {t('Not established', 'No establecido')} · —
          </h4>

          <p>
            {t(
              'Groups that do not meet evidence requirements will be reported here after execution.',
              'Los grupos que no cumplan los requisitos de evidencia se reportarán aquí después de la ejecución.'
            )}
          </p>
        </section>

        <p>
          {t(
            'These observations do not establish causation or predict an individual property’s price.',
            'Estas observaciones no establecen causalidad ni predicen el precio de una propiedad individual.'
          )}
        </p>
      </div>

      <details className={styles.optional}>
        <summary>
          {t('Methodology', 'Metodología')}
        </summary>

        <p>
          {t(
            'One fixed population is segmented by one secondary dimension. The relationship is calculated independently within each represented group. Counts and establishment states are retained; missing evidence is not zero. Differences and reversals describe observations, not causes or predictions. C/L uses exact areas and is not site coverage.',
            'Una población fija se divide por una dimensión secundaria. La relación se calcula de forma independiente en cada grupo representado. Los conteos y estados de establecimiento se conservan; la ausencia de evidencia no equivale a cero. Las diferencias y reversiones describen observaciones, no causas ni predicciones. C/L usa áreas exactas y no representa cobertura del sitio.'
          )}
        </p>
      </details>
    </section>
  )
}
