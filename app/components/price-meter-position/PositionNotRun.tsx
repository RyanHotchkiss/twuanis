
'use client'

import {positionHubQuestion} from '@/lib/position-hub-contract'
import {positionLabels} from '@/lib/price-meter-property-position-presentation'
import styles from '../market-summary/workspace.module.css'
import local from './position.module.css'

type Props = {
  language: 'en' | 'es'
  listing?: boolean
  listingId?: string
  geographyLevel?: 'district' | 'canton' | 'province'
  normalizationBasis?: 'land' | 'construction'
}

export default function PositionNotRun({
  language,
  listing = false,
  listingId,
  geographyLevel,
  normalizationBasis,
}: Props) {
  const es = language === 'es'
  const l = positionLabels[language]
  const t = (en: string, sp: string) => es ? sp : en

  const unit = t('CRC / m²', 'CRC / m²')

  const referenceGeography = geographyLevel
    ? l[geographyLevel]
    : '—'

  const normalization = normalizationBasis
    ? l[normalizationBasis]
    : '—'

  const metrics = [
    [l.subject, '—'],
    [l.median, '—'],
    [l.percentile, '—'],
    [l.n, `— · ${l.complete}`],
    [l.difference, '— (—%)'],
  ]

  const distribution = [
    [l.minimum, '—'],
    ['P10', '—'],
    ['P25', '—'],
    [l.median, '—'],
    ['P75', '—'],
    ['P90', '—'],
    [l.maximum, '—'],
    [l.iqr, '—'],
  ]

  return (
    <section
      className={styles.evidence}
      aria-label={t(
        'Property Price / m² Position preview',
        'Vista previa de la posición del precio por m² de la propiedad'
      )}
    >
      <div className={styles.identity}>
        <div>
          <h3>
            {t('Property position', 'Posición de la propiedad')}
            {' · '}
            {t('Not calculated', 'Sin calcular')}
          </h3>

          {listingId && (
            <p className={local.id}>{listingId}</p>
          )}

          {listing && !listingId && (
            <p className={local.id}>
              {t(
                'Current listing',
                'Anuncio actual'
              )}
            </p>
          )}
        </div>
      </div>

      <p className={styles.sectionQuestion}>
        {positionHubQuestion[language]}
      </p>

      <p>
        {t('Transaction', 'Transacción')}: — ·{' '}
        {t('Property Basis', 'Base de propiedad')}: — ·{' '}
        {t('Normalization', 'Normalización')}: {normalization} ·{' '}
        {unit}
      </p>

      <p>
        {l.geography}: {referenceGeography} ·{' '}
        {l.type}: —
      </p>

      <p>{l.areas}</p>

      <dl className={local.metrics}>
        {metrics.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <p>{l.denominator}</p>

      <div
        className={local.position}
        aria-label={t(
          'Uncalculated property percentile position',
          'Posición percentil de la propiedad sin calcular'
        )}
      >
        <div className={local.track} />

        <div className={local.ends}>
          <span>0</span>
          <strong>
            {t('Percentile', 'Percentil')} —
          </strong>
          <span>100</span>
        </div>
      </div>

      <p>
        {l.below}: — · {l.equal}: — · {l.above}: —
      </p>

      <p>
        {l.interval}: —
      </p>

      <details>
        <summary>{l.distribution}</summary>

        <dl className={local.metrics}>
          {distribution.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value} {unit}</dd>
            </div>
          ))}
        </dl>
      </details>

      <details>
        <summary>
          {t(
            'Unrounded numerical evidence',
            'Valores numéricos sin redondear'
          )}
        </summary>

        <dl className={local.metrics}>
          {[
            [l.subject, '—'],
            [l.percentile, '—'],
            [l.difference, '—'],
            [
              t('Percentage difference', 'Diferencia porcentual'),
              '—',
            ],
            ...distribution,
          ].map(([label, value], index) => (
            <div key={`${label}-${index}`}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </details>

      <p>
        {l.tail}: — · {l.tailDifference}: —
      </p>

      <p>
        {l.ratio}: —
      </p>

      <p>
        {l.date}: — ·{' '}
        {t(
          'Monetary conversion evidence pending execution.',
          'Evidencia de conversión monetaria pendiente de ejecución.'
        )}
      </p>

      <details className={styles.method}>
        <summary>{t('Methodology', 'Metodología')}</summary>

        <p>
          {t(
            'One active canonical property, positive asking amount and valid exact area. The subject participates exactly once in the reference. Midrank percentile = 100 × (below + equals / 2) / n. This is not ordinal rank. Difference is subject minus median; percentage uses the median. Tails are strictly below P10 or above P90.',
            'Una propiedad canónica activa, importe de oferta positivo y área exacta válida. La propiedad participa exactamente una vez en la referencia. Percentil de rango medio = 100 × (inferiores + iguales / 2) / n. No es un rango ordinal. La diferencia es propiedad menos mediana; el porcentaje usa la mediana. Las colas son estrictamente inferiores a P10 o superiores a P90.'
          )}
        </p>

        <p>
          {t(
            'Missing evidence is not zero. Areas are not inferred from ranges. Position describes observed asking evidence; it is not a valuation, recommendation or causal explanation.',
            'La evidencia ausente no es cero. No se infieren áreas a partir de rangos. La posición describe ofertas observadas; no es una valoración, recomendación ni explicación causal.'
          )}
        </p>
      </details>

      <p>{l.boundary}</p>
    </section>
  )
}
