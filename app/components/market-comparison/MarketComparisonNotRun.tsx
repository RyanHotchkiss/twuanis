
'use client'

import type {Language} from '../market-filters/types'
import shared from '../market-summary/workspace.module.css'
import styles from './comparison.module.css'
import {comparisonQuestion} from './contract'

export default function MarketComparisonNotRun({
  language,
}: {
  language: Language
}) {
  const es = language === 'es'
  const t = (en: string, spanish: string) => es ? spanish : en

  function pair(title: string, unit?: string) {
    return (
      <div className={styles.pair} key={title}>
        <h5>{title}</h5>
        <div className={styles.values}>
          {['A', 'B'].map(market => (
            <div className={styles.value} key={market}>
              <p>{t('Market', 'Mercado')} {market}</p>
              <strong>—{unit ? ` ${unit}` : ''}</strong>
              <p>
                {t('Valid observations', 'Observaciones válidas')}: —
              </p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function section(
    title: string,
    question: string,
    content: React.ReactNode,
  ) {
    return (
      <section className={styles.lens}>
        <h3>{title}</h3>
        <p className={shared.sectionQuestion}>{question}</p>
        {content}
      </section>
    )
  }

  return (
    <section
      className={shared.evidence}
      aria-label={t('Market Comparison preview', 'Vista previa de comparación de mercados')}
    >
      <h3>{t('Comparison not calculated', 'Comparación sin calcular')}</h3>
      <p className={shared.sectionQuestion}>
        {comparisonQuestion[language]}
      </p>

      <div className={styles.definitions}>
        <div className={styles.markets}>
          {['A', 'B'].map(market => (
            <div className={styles.market} key={market}>
              <h3>{t('Market', 'Mercado')} {market}</h3>
              <p>{t('Population', 'Población')}: n = —</p>
              <p className={styles.note}>
                {t(
                  'Population will be established from the selected filters.',
                  'La población se establecerá a partir de los filtros seleccionados.',
                )}
              </p>
            </div>
          ))}
        </div>
      </div>

      <p className={styles.note}>
        {t('Analytical date', 'Fecha analítica')}: — · BCCR USD → CRC: —
      </p>

      {section(
        t('Asking prices', 'Precios de oferta'),
        t(
          'How do asking prices differ between the two defined markets?',
          '¿Cómo difieren los precios de oferta entre los dos mercados definidos?',
        ),
        <>
          <h4>
            {t('Sale · total asking price · CRC / USD', 'Venta · precio total · CRC / USD')}
          </h4>
          {pair(t('Mean', 'Media'))}
          {pair(t('Median', 'Mediana'))}

          <h4>
            {t('Rent · monthly asking price · CRC / USD', 'Alquiler · precio mensual · CRC / USD')}
          </h4>
          {pair(t('Monthly mean', 'Media mensual'))}
          {pair(t('Monthly median', 'Mediana mensual'))}

          <p className={styles.note}>
            {t(
              'Sale and monthly rent use separate comparisons. USD is an alternative presentation of the same established FX context.',
              'Venta y alquiler mensual se comparan por separado. USD es una presentación alternativa del mismo contexto cambiario establecido.',
            )}
          </p>
        </>,
      )}

      {section(
        t('Property area', 'Área de la propiedad'),
        t(
          'How does mean property area differ between the two defined markets?',
          '¿Cómo difiere el área media de la propiedad entre los dos mercados definidos?',
        ),
        pair(t('Mean · m²', 'Media · m²'), 'm²'),
      )}

      {section(
        t('Construction area', 'Área de construcción'),
        t(
          'How does mean construction area differ between the two defined markets?',
          '¿Cómo difiere el área media de construcción entre los dos mercados definidos?',
        ),
        pair(t('Mean · m²', 'Media · m²'), 'm²'),
      )}

      {section(
        t('Canonical characteristics', 'Características canónicas'),
        t(
          'How do recorded memberships and their prevalence differ between the two defined markets?',
          '¿Cómo difieren las membresías registradas y su prevalencia entre los dos mercados definidos?',
        ),
        <>
          <div className={styles.values}>
            {['A', 'B'].map(market => (
              <div className={styles.coverage} key={market}>
                <b>{t('Market', 'Mercado')} {market}</b>
                <p>{t('With recorded evidence', 'Con evidencia registrada')}: — / —</p>
                <p>{t('Without recorded evidence', 'Sin evidencia registrada')}: —</p>
                <p>{t('Leading category by count', 'Categoría de mayor conteo')}: —</p>
              </div>
            ))}
          </div>

          {pair(t('Recorded category · listings / prevalence', 'Categoría registrada · anuncios / prevalencia'))}

          <p className={styles.note}>
            {t(
              'Recorded memberships use each market population as their denominator. No category prevalence has been calculated.',
              'Las membresías registradas usan la población de cada mercado como denominador. No se ha calculado ninguna prevalencia.',
            )}
          </p>
        </>,
      )}

      <details className={shared.method}>
        <summary>{t('Methodology', 'Metodología')}</summary>
        <p>
          {t(
            'Each market is evaluated separately using its canonical filters. Selections within one dimension use OR; different dimensions use AND. Numerical constraints require matching evidence.',
            'Cada mercado se evalúa por separado mediante sus filtros canónicos. Las selecciones dentro de una dimensión usan OR; las dimensiones diferentes usan AND. Las restricciones numéricas requieren evidencia coincidente.',
          )}
        </p>
        <p>
          {t(
            'Means, medians and area statistics use valid observations, which may differ from the full population n. Sale and monthly rent are never combined.',
            'Las medias, medianas y estadísticas de área usan observaciones válidas, que pueden diferir de la población total n. Venta y alquiler mensual nunca se combinan.',
          )}
        </p>
        <p>
          {t(
            'Recorded characteristics are aligned by canonical identity. Observed differences do not establish causes, recommendations or winners. Signed and percentage differences between markets are not calculated.',
            'Las características registradas se alinean por identidad canónica. Las diferencias observadas no establecen causas, recomendaciones ni ganadores. No se calculan diferencias firmadas ni porcentuales entre mercados.',
          )}
        </p>
      </details>
    </section>
  )
}
