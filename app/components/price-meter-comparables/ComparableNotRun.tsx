
'use client'

import {
  comparablesQuestion,
  comparableLabels,
  type ComparablesRequest,
} from '@/lib/comparables-hub-contract'
import {positionLabels} from '@/lib/price-meter-property-position-presentation'
import styles from '../market-summary/workspace.module.css'
import local from '../price-meter-position/position.module.css'

type Props = {
  language: 'en' | 'es'
  request: ComparablesRequest
}

export default function ComparableNotRun({language, request}: Props) {
  const es = language === 'es'
  const l = positionLabels[language]
  const t = (en: string, sp: string) => es ? sp : en

  const selected = request.activeDimensions

  const metrics = [
    [t('Subject Price / m²', 'Precio de la propiedad por m²'), '—'],
    [t('Cohort median', 'Mediana de la cohorte'), '—'],
    [l.percentile, '—'],
    [t('Subject − median', 'Propiedad − mediana'), '— (—%)'],
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
        'User-Defined Comparable Cohort preview',
        'Vista previa de la cohorte comparable definida por el usuario'
      )}
    >
      <div className={styles.identity}>
        <div>
          <h3>
            {t('Comparable cohort evidence', 'Evidencia de la cohorte comparable')}
            {' · '}
            {t('Not calculated', 'Sin calcular')}
          </h3>
          <p className={local.id}>
            {request.subjectListingId.trim() || '—'}
          </p>
        </div>
      </div>

      <p className={styles.primaryQuestion}>
        {comparablesQuestion[language]}
      </p>

      <p>
        {t('Transaction', 'Transacción')}: — ·{' '}
        {t('Property Basis', 'Base de propiedad')}: — ·{' '}
        {l[request.normalizationBasis]} · CRC/m²
      </p>

      <p>
        {l[request.geographyLevel]}: — · {l.type}: —
      </p>

      <p>
        {t('Property Area band', 'Banda del área del terreno')}: — ·{' '}
        {t('Construction Area band', 'Banda del área de construcción')}: —
      </p>

      <p>
        {t('Selected characteristics', 'Características seleccionadas')}:{' '}
        {selected.length
          ? selected.map(d => `${comparableLabels[d][language]}: —`).join(' · ')
          : t(
              'None; compulsory boundaries only.',
              'Ninguna; solo límites obligatorios.'
            )}
      </p>

      <p>
        <strong>
          {t('Peers', 'Comparables')} n = —
        </strong>
        {' · '}
        {t(
          'Subject excluded by identity.',
          'Propiedad excluida por identidad.'
        )}
      </p>

      <dl className={local.metrics}>
        {metrics.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <p>
        {t(
          'The percentage uses the cohort median as its reference.',
          'El porcentaje usa la mediana de la cohorte como referencia.'
        )}
      </p>

      <div
        className={local.position}
        aria-label={t(
          'Uncalculated comparable cohort percentile',
          'Percentil de cohorte comparable sin calcular'
        )}
      >
        <div className={local.track} />
        <div className={local.ends}>
          <span>0</span>
          <strong>{l.percentile}: —</strong>
          <span>100</span>
        </div>
      </div>

      <p>
        {l.below}: — · {l.equal}: — · {l.above}: —
      </p>

      <p>{l.interval}: —</p>

      <details>
        <summary>{l.distribution}</summary>
        <dl className={local.metrics}>
          {distribution.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value} CRC/m²</dd>
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
            [t('Subject', 'Propiedad'), '—'],
            [l.percentile, '—'],
            [l.difference, '—'],
            [t('Percentage difference (%)', 'Diferencia porcentual (%)'), '—'],
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

      <p>{l.ratio}: —</p>

      <details>
        <summary>{t('Population trail', 'Formación de la población')}</summary>

        <p>
          {t('Base population', 'Población base')}: —
        </p>

        {selected.map(d => (
          <p key={d}>
            {comparableLabels[d][language]}: — → — (
            {t('removed', 'excluidos')}: —)
          </p>
        ))}

        <p>
          {t('Final population', 'Población final')}: —
        </p>
      </details>

      <p>
        {l.date}: — ·{' '}
        {t(
          'Monetary evidence established at execution.',
          'Evidencia monetaria establecida al ejecutar.'
        )}
      </p>

      <p>
        {t(
          'No peers may be found. In that case, the median, percentile and differences remain undefined; cohort boundaries are not relaxed.',
          'Es posible que no se encuentren comparables. En ese caso, la mediana, el percentil y las diferencias permanecen sin definir; los límites de la cohorte no se amplían.'
        )}
      </p>
    </section>
  )
}
