
'use client'

import {weightedQuestion} from '@/lib/weighted-price-contract'
import styles from '../asking-area-ratio/workspace.module.css'

type Draft = {
  cohort: {
    transaction: string
    geography: {
      level: string
      termId: string
    }
    propertyType: string
    propertyArea: {min: string; max: string}
    constructionArea: {min: string; max: string}
  }
  kind: string
  listingId: string
  propertyArea: string
  constructionArea: string
  province: string
  canton: string
  district: string
  amount: string
  currency: string
}

import type {loadWeightedPriceOptions} from '@/lib/weighted-price-action'

type Option = Extract<
  Awaited<ReturnType<typeof loadWeightedPriceOptions>>,
  {state: 'ready'}
>['options'][number]

type Props = {
  language: 'en' | 'es'
  draft: Draft
  options: Option[]
}

export default function WeightedNotRun({
  language,
  draft,
  options,
}: Props) {
  const es = language === 'es'
  const t = (en: string, sp: string) => es ? sp : en

  const name = (id: string, type: string) =>
    options.find(o => o.id === id && o.type === type)?.[language] ?? '—'

  const bounds = (range: {min: string; max: string}) =>
    `[${range.min || '—'}, ${range.max || '—'}] m²`

  const transaction = draft.cohort.transaction === 'sale'
    ? t('Sale', 'Venta')
    : draft.cohort.transaction === 'rent'
      ? t('Monthly asking rent', 'Alquiler mensual de oferta')
      : '—'

  const unit = draft.cohort.transaction === 'rent'
    ? t(
        'CRC per analytical weighted-area unit per month',
        'CRC por unidad analítica de área ponderada por mes'
      )
    : t(
        'CRC per analytical weighted-area unit',
        'CRC por unidad analítica de área ponderada'
      )

  const isListing = draft.kind === 'listing'
  const hasAmount = isListing || draft.amount.trim() !== ''

  const subjectArea = isListing
    ? '—'
    : `${draft.propertyArea || '—'} m²`

  const subjectConstruction = isListing
    ? '—'
    : `${draft.constructionArea || '—'} m²`

  return (
    <section
      className={styles.evidence}
      aria-label={t(
        'Exploratory Weighted Price per square meter preview',
        'Vista previa del precio ponderado exploratorio por metro cuadrado'
      )}
    >
      <h3>
        {t('Weighted result', 'Resultado ponderado')}
        {' · '}
        {t('Not calculated', 'Sin calcular')}
      </h3>

      <p>{weightedQuestion[language]}</p>

      <p>
        {t('Nominal confidence', 'Confianza nominal')}: 75%
        {' · '}
        {t(
          'Weighting establishment pending execution',
          'Establecimiento de ponderación pendiente de ejecución'
        )}
      </p>

      <p>
        {name(
          draft.cohort.geography.termId,
          draft.cohort.geography.level
        )}
        {' · '}
        {name(draft.cohort.propertyType, 'property_type')}
        {' · '}
        {transaction}
        {' · '}
        n = —
      </p>

      <p>
        {t('Reference Property Area', 'Área del terreno de referencia')}:{' '}
        {bounds(draft.cohort.propertyArea)}
        {' · '}
        {t('Reference Construction Area', 'Área de construcción de referencia')}:{' '}
        {bounds(draft.cohort.constructionArea)}
      </p>

      <p>
        {t('Subject Property Area', 'Área del terreno de la propiedad')}:{' '}
        {subjectArea}
        {' · '}
        {t('Subject Construction Area', 'Área de construcción de la propiedad')}:{' '}
        {subjectConstruction}
      </p>

      <p>
        {t('Subject lens', 'Modo de propiedad')}:{' '}
        {isListing
          ? t('Existing canonical listing', 'Anuncio canónico existente')
          : t('Hypothetical property', 'Propiedad hipotética')}
      </p>

      {isListing ? (
        <p>
          {t('Canonical listing ID', 'ID del anuncio canónico')}:{' '}
          {draft.listingId.trim() || '—'}
        </p>
      ) : (
        <p>
          {t('Proposed asking amount', 'Importe de oferta propuesto')}:{' '}
          {draft.amount.trim()
            ? `${draft.amount} ${draft.currency}`
            : t('Not supplied', 'No proporcionado')}
        </p>
      )}

      <p>
        {t(
          'Subject Weighted Price / m²',
          'Precio ponderado por m² de la propiedad'
        )}: <strong>—</strong>
      </p>

      <p>
        {t('Weighted Price / m²', 'Precio ponderado por m²')}
        {' · '}
        {unit}
      </p>

      <dl>
        <dt>P25</dt>
        <dd>—</dd>

        <dt>{t('Median', 'Mediana')}</dt>
        <dd>—</dd>

        <dt>P75</dt>
        <dd>—</dd>

        <dt>n</dt>
        <dd>—</dd>
      </dl>

      <dl>
        <dt>
          {t(
            'Percentile position (midrank)',
            'Posición percentil (rango medio)'
          )}
        </dt>
        <dd>—</dd>

        <dt>
          {t(
            'Difference from reference median',
            'Diferencia respecto a la mediana de referencia'
          )}
        </dt>
        <dd>— (—%)</dd>

        <dt>
          {t(
            'Below / equal / above the subject',
            'Debajo / igual / encima de la propiedad'
          )}
        </dt>
        <dd>— / — / —</dd>
      </dl>

      <p>
        {t(
          'Relative interval deviation',
          'Desviación relativa del intervalo'
        )}: —
        {' · '}
        {t('Maximum allowed', 'Máximo permitido')}: 25%
      </p>

      <section>
        <h4>
          {t(
            'Exploratory fitted-model evidence',
            'Evidencia exploratoria del ajuste'
          )}
        </h4>

        <p>
          {t(
            'Fitted coefficients and ratio identification are available only after execution. An estimated ratio is not automatically approved for weighting.',
            'Los coeficientes ajustados y la identificación de la razón solo están disponibles después de ejecutar. Una razón estimada no queda automáticamente aprobada para ponderar.'
          )}
        </p>

        <dl>
          <dt>{t('Intercept α', 'Intercepto α')}</dt>
          <dd>—</dd>

          <dt>{t('Property Area βL', 'Área del terreno βL')}</dt>
          <dd>—</dd>

          <dt>{t('Construction Area βC', 'Área de construcción βC')}</dt>
          <dd>—</dd>

          <dt>
            {t(
              'Coefficient-ratio point estimate',
              'Estimación puntual de la razón de coeficientes'
            )}
          </dt>
          <dd>—</dd>
        </dl>

        <p>
          {t(
            'Ratio interval identification',
            'Identificación del intervalo de la razón'
          )}: —
        </p>

        <details>
          <summary>
            {t('HC3 covariance', 'Covarianza HC3')}
          </summary>

          <p>
            {t(
              'Order: intercept, Property Area, Construction Area.',
              'Orden: intercepto, área del terreno, área de construcción.'
            )}
          </p>

          <p>{t('Intercept', 'Intercepto')}: — · — · —</p>
          <p>{t('Property Area', 'Área del terreno')}: — · — · —</p>
          <p>{t('Construction Area', 'Área de construcción')}: — · — · —</p>

          <p>
            {t(
              'Critical t used by inference',
              'Valor crítico t utilizado por la inferencia'
            )}: —
          </p>
        </details>
      </section>

      <p>
        {isListing
          ? t(
              'Existing subject ID will be excluded from both weighting and reference distribution.',
              'El ID de la propiedad existente se excluirá de la ponderación y de la distribución de referencia.'
            )
          : t(
              'Hypothetical subject: no listing ID is excluded.',
              'Propiedad hipotética: no se excluye ningún ID de anuncio.'
            )}
      </p>

      <p>
        {t('Analytical date', 'Fecha analítica')}: —
        {' · '}CRC
        {' · '}
        {t(
          'Monetary conversion evidence pending execution',
          'Evidencia de conversión monetaria pendiente de ejecución'
        )}
        {' · '}
        {t(
          'Excluded for ineligible monetary evidence',
          'Excluidos por evidencia monetaria no elegible'
        )}: —
      </p>

      <details>
        <summary>
          {t('Weighting evidence', 'Evidencia de ponderación')}
        </summary>

        <dl>
          {hasAmount && (
            <>
              <dt>
                {t(
                  'Subject analytical asking amount',
                  'Importe analítico de oferta de la propiedad'
                )}
              </dt>
              <dd>— CRC</dd>
            </>
          )}

          <dt>r = βC / βL</dt>
          <dd>—</dd>

          <dt>βL</dt>
          <dd>—</dd>

          <dt>βC</dt>
          <dd>—</dd>

          <dt>
            {t(
              'Approximate nominal 75% ratio interval',
              'Intervalo aproximado nominal del 75% de la razón'
            )}
          </dt>
          <dd>[—, —]</dd>
        </dl>

        <p>
          {t(
            'The ratio interval supports weighting evidence; it is not a Weighted Price / m² interval.',
            'El intervalo de la razón respalda la evidencia de ponderación; no es un intervalo del precio ponderado por m².'
          )}
        </p>
      </details>

      <p>
        {t(
          'The weighted distribution and subject position are conditional on established weighting. A hypothetical property without an asking amount can produce distribution-only evidence. Otherwise, fitted evidence may remain available without an established weighted result.',
          'La distribución ponderada y la posición de la propiedad dependen de que se establezca la ponderación. Una propiedad hipotética sin importe de oferta puede producir solo evidencia de distribución. En otros casos, la evidencia del ajuste puede permanecer disponible sin un resultado ponderado establecido.'
        )}
      </p>
    </section>
  )
}
