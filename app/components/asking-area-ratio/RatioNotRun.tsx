
'use client'

import {ratioQuestion} from '@/lib/asking-area-ratio-contract'
import styles from './workspace.module.css'

type Draft = {
  transaction: string
  geography: {
    level: string
    termId: string
  }
  propertyType: string
  propertyArea: {
    min: string
    max: string
  }
  constructionArea: {
    min: string
    max: string
  }
}

type Option = {
  id: string
  type: string
  en: string
  es: string
}

type Props = {
  language: 'en' | 'es'
  draft: Draft
  options: Option[]
}

export default function RatioNotRun({
  language,
  draft,
  options,
}: Props) {
  const es = language === 'es'
  const t = (en: string, sp: string) => es ? sp : en

  const geography = options.find(
    o => o.id === draft.geography.termId &&
      o.type === draft.geography.level
  )?.[language] ?? '—'

  const propertyType = options.find(
    o => o.id === draft.propertyType &&
      o.type === 'property_type'
  )?.[language] ?? '—'

  const transaction = draft.transaction === 'sale'
    ? t('Sale', 'Venta')
    : draft.transaction === 'rent'
      ? t('Monthly asking rent', 'Alquiler mensual de oferta')
      : '—'

  const unit = draft.transaction === 'rent'
    ? t('CRC/m²/month', 'CRC/m²/mes')
    : draft.transaction === 'sale'
      ? 'CRC/m²'
      : '—'

  const bounds = (range: {min: string; max: string}) =>
    `[${range.min || '—'}, ${range.max || '—'}] m²`

  const diagnostics = [
    [t('Observed Property Area', 'Área del terreno observada'), '[—, —] m²'],
    [t('Observed Construction Area', 'Área de construcción observada'), '[—, —] m²'],
    [t('Residual degrees of freedom', 'Grados de libertad residuales'), '—'],
    [t('Descriptive R²', 'R² descriptivo'), '—'],
    [t('Adjusted R²', 'R² ajustado'), '—'],
    [t('Residual scale (CRC)', 'Escala residual (CRC)'), '—'],
    [t('Numerical condition', 'Condición numérica'), '—'],
    [t('Predictor correlation', 'Correlación entre predictores'), '—'],
    [t('Variance inflation factor', 'Factor de inflación de varianza'), '—'],
    [t('Maximum leverage', 'Apalancamiento máximo'), '—'],
    [t('Relative interval deviation', 'Desviación relativa del intervalo'), '—'],
    [t('Relative influence bound', 'Límite relativo de influencia'), '—'],
  ]

  return (
    <section
      className={styles.evidence}
      aria-label={t(
        'Asking-price relationship ratio preview',
        'Vista previa de la razón de relaciones del precio de oferta'
      )}
    >
      <h3>
        {t('Relationship ratio', 'Razón de relaciones')}
        {' · '}
        {t('Not calculated', 'Sin calcular')}
      </h3>

      <p>{ratioQuestion[language]}</p>

      <p>
        {geography} · {propertyType} · {transaction} · n = —
      </p>

      <p>
        {t('Property Area', 'Área del terreno')}: {bounds(draft.propertyArea)}
        {' · '}
        {t('Construction Area', 'Área de construcción')}: {bounds(draft.constructionArea)}
      </p>

      <dl>
        <dt>βC / βL</dt>
        <dd className={styles.ratio}>—</dd>

        <dt>
          {t(
            'Approximate nominal 95% ratio interval',
            'Intervalo aproximado nominal del 95% de la razón'
          )}
        </dt>
        <dd>[—, —]</dd>

        <dt>βL · {unit}</dt>
        <dd>—</dd>

        <dt>βC · {unit}</dt>
        <dd>—</dd>
      </dl>

      <section>
        <h4>
          {t(
            'Fitted-model evidence',
            'Evidencia del ajuste'
          )}
        </h4>

        <p>
          {t(
            'Descriptive simultaneous slopes, not market value, causal effects or approved weights. Signs are preserved when established.',
            'Pendientes descriptivas simultáneas, no valor de mercado, efectos causales ni pesos aprobados. Los signos se conservan cuando se establecen.'
          )}
        </p>

        <dl>
          <dt>
            {t('Intercept α', 'Intercepto α')} ·{' '}
            {draft.transaction === 'rent'
              ? t('CRC/month', 'CRC/mes')
              : draft.transaction === 'sale' ? 'CRC' : '—'}
          </dt>
          <dd>—</dd>

          <dt>
            {t('Property Area βL', 'Área del terreno βL')} · {unit}
          </dt>
          <dd>—</dd>

          <dt>
            {t('Construction Area βC', 'Área de construcción βC')} · {unit}
          </dt>
          <dd>—</dd>
        </dl>

        <p>
          {t('Ratio interval identification', 'Identificación del intervalo de la razón')}: —
        </p>

        <p>
          {t(
            'Calculated nominal 95% ratio interval',
            'Intervalo calculado nominal del 95% de la razón'
          )}: [—, —]
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
        {t(
          'A descriptive ratio of simultaneous fitted asking-price slopes within this exact cohort, not property value or causal contributions.',
          'Una razón descriptiva de pendientes simultáneas ajustadas del precio de oferta dentro de esta cohorte exacta, no valor de la propiedad ni contribuciones causales.'
        )}
      </p>

      <p>
        {t('Analytical date', 'Fecha analítica')}: — · CRC ·{' '}
        {t(
          'Monetary conversion evidence pending execution.',
          'Evidencia de conversión monetaria pendiente de ejecución.'
        )}
      </p>

      <p>
        {t(
          'Excluded for unavailable eligible monetary evidence',
          'Excluidos por falta de evidencia monetaria elegible'
        )}: —
      </p>

      <details>
        <summary>
          {t('Supporting evidence', 'Evidencia de respaldo')}
        </summary>

        {diagnostics.map(([label, value]) => (
          <p key={label}>
            {label}: {value}
          </p>
        ))}
      </details>

      <p>
        {t(
          'The ratio may remain unestablished if the model cannot identify a finite, sufficiently stable relationship. Fitted evidence may still be available.',
          'La razón puede permanecer sin establecer si el modelo no identifica una relación finita y suficientemente estable. La evidencia del ajuste puede seguir disponible.'
        )}
      </p>
    </section>
  )
}
