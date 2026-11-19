
'use client'

import {useId} from 'react'
import styles from '../Phase14Discovery.module.css'

type Props = {
  language: 'en' | 'es'
  geography: string
  transaction: string
  propertyType: string
  normalization: string
}

export default function DiscoveryNotRun({
  language,
  geography,
  transaction,
  propertyType,
  normalization,
}: Props) {
  const es = language === 'es'
  const chartId = useId()
  const t = (en: string, sp: string) => es ? sp : en

  const unit =
    normalization === 'land'
      ? t('CRC / land m²', 'CRC / m² de terreno')
      : normalization === 'construction'
        ? t('CRC / construction m²', 'CRC / m² de construcción')
        : 'CRC / m²'

  const monthly =
    transaction === 'rent'
      ? t(' / month', ' / mes')
      : ''

  const stats = [
    ['minimum', t('Minimum', 'Mínimo')],
    ['p10', 'P10'],
    ['p25', 'P25'],
    ['median', t('Median', 'Mediana')],
    ['average', t('Average', 'Promedio')],
    ['p75', 'P75'],
    ['p90', 'P90'],
    ['maximum', t('Maximum', 'Máximo')],
    ['iqr', t('Interquartile range', 'Rango intercuartílico')],
  ] as const

  return (
    <div
      className={styles.results}
      aria-label={t(
        'Comparative Price / m² Discovery preview',
        'Vista previa del descubrimiento comparativo de precio por m²'
      )}
    >
      <h3>
        {t('Discovery results', 'Resultados del descubrimiento')}
        {' · '}
        {t('Not calculated', 'Sin calcular')}
      </h3>

      <section>
        <h3>{t('Market Question', 'Pregunta de mercado')}</h3>

        <ul>
          <li>
            {t('Geography', 'Geografía')}: {geography || '—'}
          </li>
          <li>
            {t('Transaction', 'Transacción')}:{' '}
            {transaction === 'sale'
              ? t('Sale', 'Venta')
              : transaction === 'rent'
                ? t('Rent', 'Alquiler')
                : '—'}
          </li>
          <li>
            {t('Property type', 'Tipo de propiedad')}:{' '}
            {propertyType || '—'}
          </li>
          <li>
            {t('Normalization', 'Normalización')}:{' '}
            {normalization === 'land'
              ? t('Land', 'Terreno')
              : normalization === 'construction'
                ? t('Construction', 'Construcción')
                : '—'}
          </li>
        </ul>

        <p>
          {t(
            'Additional selected constraints are applied when the market question is executed.',
            'Las condiciones adicionales seleccionadas se aplican al ejecutar la pregunta de mercado.'
          )}
        </p>
      </section>

      <section>
        <h3>
          {t('Analytical Population', 'Población analítica')}: n = —
        </h3>

        <p>
          {t(
            'The analytical population will be established for the submitted market question. A snapshot is not guaranteed.',
            'La población analítica se establecerá para la pregunta de mercado enviada. No se garantiza una instantánea.'
          )}
        </p>
      </section>

      <section aria-label={t('Distribution', 'Distribución')}>
        <h3>{t('Distribution', 'Distribución')}</h3>

        <p>{unit}{monthly} · n = —</p>

        <svg
          viewBox="0 0 420 80"
          role="img"
          aria-labelledby={chartId}
          style={{
            width: '100%',
            maxWidth: 750,
            display: 'block',
          }}
        >
          <title id={chartId}>
            {t(
              'Uncalculated Price / m² distribution axis. Quantile positions are not established.',
              'Eje de distribución del precio por m² sin calcular. Las posiciones de los cuantiles no están establecidas.'
            )}
          </title>

          <line
            x1="20"
            y1="40"
            x2="400"
            y2="40"
            stroke="currentColor"
          />

          <text
            x="20"
            y="65"
            fill="currentColor"
            fontSize="13"
          >
            —
          </text>

          <text
            x="400"
            y="65"
            textAnchor="end"
            fill="currentColor"
            fontSize="13"
          >
            —
          </text>
        </svg>

        <dl className={styles.stats}>
          {stats.map(([key, label]) => (
            <div key={key}>
              <dt>{label}</dt>
              <dd><strong>—</strong></dd>
            </div>
          ))}
        </dl>

        <p>
          {t(
            'Quantile markers will appear at their calculated positions after execution.',
            'Los marcadores de cuantiles aparecerán en sus posiciones calculadas después de la ejecución.'
          )}
        </p>
      </section>

      <section>
        <h3>
          {t(
            'Listings in Analytical Population',
            'Anuncios en la población analítica'
          )}
        </h3>

        <p>
          {unit}{monthly} ·{' '}
          {t(
            '— = unavailable or not applicable; listing price retains its original currency.',
            '— = no disponible o no aplicable; el precio anunciado conserva su moneda original.'
          )}
        </p>

        <p className={styles.swipe}>
          {t(
            'Swipe horizontally to see more columns.',
            'Desliza horizontalmente para ver más columnas.'
          )}
        </p>

        <div
          className={styles.scroll}
          role="region"
          tabIndex={0}
          aria-label={t(
            'Uncalculated analytical population table',
            'Tabla de población analítica sin calcular'
          )}
        >
          <table>
            <thead>
              <tr>
                {[
                  t('Listing', 'Anuncio'),
                  t('Asking price', 'Precio anunciado'),
                  'Price / m²',
                  t('Percentile position', 'Posición percentil'),
                  t('Difference from median', 'Diferencia con la mediana'),
                  t('Percentage difference', 'Diferencia porcentual'),
                  t('Property Area', 'Área del terreno'),
                  t('Construction Area', 'Área de construcción'),
                ].map(label => (
                  <th key={label} scope="col">{label}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              <tr>
                <th scope="row" className={styles.property}>—</th>
                <td>—</td>
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

        <p>
          {t(
            'Eligible listings, exact analytical positions and available listing details will appear after execution.',
            'Los anuncios elegibles, las posiciones analíticas exactas y los detalles disponibles aparecerán después de la ejecución.'
          )}
        </p>
      </section>

      <details>
        <summary>{t('Methodology', 'Metodología')}</summary>

        <p>
          {t(
            'Each candidate is an eligible canonical listing. The reference is the complete selected market population, including the candidate itself; it is not an exact-peer cohort or a valuation. All eligible candidates are included, without a top-results limit.',
            'Cada candidato es un anuncio canónico elegible. La referencia es la población completa del mercado seleccionado, incluido el propio candidato; no es una cohorte de pares exactos ni una valoración. Se incluyen todos los candidatos elegibles, sin un límite de mejores resultados.'
          )}
        </p>

        <p>
          {t(
            'Initial order is ascending Price / m². Exact ties use listing ID only for stable ordering, not analytical rank. Percentile uses midrank: (count below + half of equals) / n × 100. Difference is candidate minus median; percentage uses the median as reference. Tails are strictly below P10 or above P90.',
            'El orden inicial es precio por m² ascendente. Los empates exactos usan el ID del anuncio únicamente para un orden estable, no como rango analítico. El percentil usa rango medio: (cantidad inferior + mitad de los iguales) / n × 100. La diferencia es candidato menos mediana; el porcentaje usa la mediana como referencia. Las colas son estrictamente inferiores a P10 o superiores a P90.'
          )}
        </p>

        <p>
          {t(
            'Eligibility requires active status, current canonical version, selected transaction and geography, Property Type and explicit constraints, positive amount and a valid exact-area denominator. Missing evidence is not zero. Sorting columns, paging or modifying inputs does not rerun analysis. Differences describe asking evidence, not causes, fair value or recommendations.',
            'La elegibilidad exige estado activo, versión canónica vigente, transacción y geografía seleccionadas, tipo de propiedad y condiciones explícitas, importe positivo y denominador de área exacta válido. La evidencia ausente no es cero. Ordenar columnas, paginar o modificar entradas no vuelve a ejecutar el análisis. Las diferencias describen evidencia de oferta, no causas, valor justo ni recomendaciones.'
          )}
        </p>
      </details>

      <p>
        {t(
          'TWUANIS REPORTS MARKET EVIDENCE. TWUANIS DOES NOT PRESCRIBE DECISIONS.',
          'TWUANIS REPORTA EVIDENCIA DEL MERCADO. TWUANIS NO PRESCRIBE DECISIONES.'
        )}
      </p>
    </div>
  )
}
