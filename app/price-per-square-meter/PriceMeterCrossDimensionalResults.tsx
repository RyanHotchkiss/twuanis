import type {
  PriceMeterCrossDimensionalEvidence,
  PriceMeterCrossDimensionalEvidenceSet,
  PriceMeterCrossDimensionalGeographicEvidence,
  PriceMeterCrossDimensionalSizeEvidence,
  PriceMeterCrossDimensionalConstructionLandEvidence
} from '@/lib/price-meter-cross-dimensional-evidence'

import {
  evaluatePriceMeterCrossDimensionalOutcomes,
  type PriceMeterCrossDimensionalOutcomes,
  type PriceMeterCrossDimensionalVariation,
  type PriceMeterCrossDimensionalReversal,
  type PriceMeterCrossDimensionalNonEstablishment
} from '@/lib/price-meter-cross-dimensional-outcomes'

import {
  buildPriceMeterCrossDimensionalSynthesis,
  type PriceMeterCrossDimensionalSynthesis
} from '@/lib/price-meter-cross-dimensional-synthesis'

import type {
  PriceMeterCrossDimensionalQuestionDefinition
} from '@/lib/price-meter-cross-dimensional-question'


type Props = {
  language:
    PriceMeterCrossDimensionalLanguage

  transactionType:
    'sale' | 'rent'

  question:
    PriceMeterCrossDimensionalQuestionDefinition

  evidence:
    PriceMeterCrossDimensionalEvidenceSet
}

import {
  getPriceMeterCrossDimensionalPresentation,
  type PriceMeterCrossDimensionalLanguage
} from '@/lib/price-meter-cross-dimensional-presentation'

function formatInteger(
  value:
    number
): string {

  return new Intl.NumberFormat(
    'en-US',
    {
      maximumFractionDigits:
        0
    }
  ).format(
    value
  )
}


function formatDecimal(
  value:
    number | null,
  digits:
    number = 2
): string {

  if (
    value ===
      null ||
    !Number.isFinite(
      value
    )
  ) {
    return '—'
  }


  return value.toFixed(
    digits
  )
}


function formatSignedDecimal(
  value:
    number | null,
  digits:
    number = 2
): string {

  if (
    value ===
      null ||
    !Number.isFinite(
      value
    )
  ) {
    return '—'
  }


  if (
    value >
      0
  ) {
    return `+${value.toFixed(
      digits
    )}`
  }


  return value.toFixed(
    digits
  )
}


function formatPercent(
  value:
    number | null,
  digits:
    number = 1
): string {

  if (
    value ===
      null ||
    !Number.isFinite(
      value
    )
  ) {
    return '—'
  }


  return `${value.toFixed(
    digits
  )}%`
}


function formatSignedPercent(
  value:
    number | null,
  digits:
    number = 1
): string {

  if (
    value ===
      null ||
    !Number.isFinite(
      value
    )
  ) {
    return '—'
  }


  if (
    value >
      0
  ) {
    return `+${value.toFixed(
      digits
    )}%`
  }


  return `${value.toFixed(
    digits
  )}%`
}


function formatPricePerM2(
  value:
    number | null,

  transactionType:
    'sale' | 'rent',

  language:
    PriceMeterCrossDimensionalLanguage
): string {

  if (
    value ===
      null ||
    !Number.isFinite(
      value
    )
  ) {
    return '—'
  }


  const formatted =
    `₡${new Intl.NumberFormat(
      'en-US',
      {
        maximumFractionDigits:
          0
      }
    ).format(
      value
    )}/m²`


  if (
    transactionType ===
      'sale'
  ) {
    return formatted
  }


  return language ===
    'es'
      ? `${formatted}/mes`
      : `${formatted}/month`
}


function formatSignedPricePerM2(
  value:
    number | null,

  transactionType:
    'sale' | 'rent',

  language:
    PriceMeterCrossDimensionalLanguage
): string {

  if (
    value ===
      null ||
    !Number.isFinite(
      value
    )
  ) {
    return '—'
  }


  const absoluteBase =
    `₡${new Intl.NumberFormat(
      'en-US',
      {
        maximumFractionDigits:
          0
      }
    ).format(
      Math.abs(
        value
      )
    )}/m²`


  const absolute =
    transactionType ===
      'rent'
      ? language ===
          'es'
        ? `${absoluteBase}/mes`
        : `${absoluteBase}/month`
      : absoluteBase


  if (
    value >
      0
  ) {
    return `+${absolute}`
  }


  if (
    value <
      0
  ) {
    return `−${absolute}`
  }


  return absolute
}


function formatArea(
  value:
    number
): string {

  return `${new Intl.NumberFormat(
    'en-US',
    {
      maximumFractionDigits:
        1
    }
  ).format(
    value
  )} m²`
}


function formatRatio(
  value:
    number
): string {

  return new Intl.NumberFormat(
    'en-US',
    {
      minimumFractionDigits:
        2,

      maximumFractionDigits:
        3
    }
  ).format(
    value
  )
}


function EvidenceStatus({
  status,
  language
}: {
  status:
    PriceMeterCrossDimensionalEvidence['status']

  language:
    PriceMeterCrossDimensionalLanguage
}) {

  return (
    <span style={statusValue}>
      {status ===
        'established'
        ? language ===
            'es'
          ? 'Establecida'
          : 'Established'
        : language ===
            'es'
          ? 'No establecida'
          : 'Not established'}
    </span>
  )
}


function GeographicEvidence({
  evidence,
  transactionType,
  language
}: {
  evidence:
    PriceMeterCrossDimensionalGeographicEvidence

  transactionType:
    'sale' | 'rent'

  language:
    PriceMeterCrossDimensionalLanguage
}) {

  const isSpanish =
    language ===
      'es'


  return (
    <div style={evidenceCard}>
      <div style={evidenceHeader}>
        <div>
          <div style={evidenceTitle}>
            {evidence.secondaryCohortLabel}
          </div>

          <div style={evidencePopulation}>
            {formatInteger(
              evidence
                .representedObservationCount
            )}{' '}
            {isSpanish
              ? 'propiedades representadas'
              : 'represented properties'}
          </div>
        </div>

        <EvidenceStatus
          status={
            evidence.status
          }
          language={
            language
          }
        />
      </div>


      <div style={evidenceSummaryGrid}>
        <EvidenceMetric
          label={
            isSpanish
              ? 'Mediana del mercado seleccionado'
              : 'Selected-market median'
          }
          value={
            formatPricePerM2(
              evidence
                .selectedMarketMedianPricePerM2,
              transactionType,
              language
            )
          }
        />

        <EvidenceMetric
          label={
            isSpanish
              ? 'Población del mercado seleccionado'
              : 'Selected-market population'
          }
          value={`${formatInteger(
            evidence
              .selectedMarketSampleSize
          )} ${
            isSpanish
              ? 'propiedades'
              : 'properties'
          }`}
        />

        <EvidenceMetric
          label={
            isSpanish
              ? 'Geografías comparadas'
              : 'Compared geographies'
          }
          value={
            formatInteger(
              evidence
                .comparisonGeographyCount
            )
          }
        />
      </div>


      {evidence
        .geographicStatistics
        .length >
        0 && (
        <div style={tableWrapper}>
          <table style={table}>
            <thead>
              <tr>
                <th style={tableHeader}>
                  {isSpanish
                    ? 'Posición'
                    : 'Rank'}
                </th>

                <th style={tableHeader}>
                  {isSpanish
                    ? 'Geografía'
                    : 'Geography'}
                </th>

                <th style={tableHeaderRight}>
                  {isSpanish
                    ? 'Propiedades'
                    : 'Properties'}
                </th>

                <th style={tableHeaderRight}>
                  {isSpanish
                    ? 'Precio / m² mediano'
                    : 'Median Price / m²'}
                </th>

                <th style={tableHeaderRight}>
                  {isSpanish
                    ? 'Diferencia'
                    : 'Difference'}
                </th>

                <th style={tableHeaderRight}>
                  % {isSpanish
                    ? 'Diferencia'
                    : 'Difference'}
                </th>
              </tr>
            </thead>

            <tbody>
              {evidence
                .geographicStatistics
                .map(
                  statistic => (
                    <tr
                      key={
                        statistic
                          .geographyKey
                      }
                    >
                      <td style={tableCell}>
                        {statistic.rank}
                      </td>

                      <td style={tableCell}>
                        {
                          statistic
                            .geographyLabel
                        }
                      </td>

                      <td style={tableCellRight}>
                        {formatInteger(
                          statistic
                            .sampleSize
                        )}
                      </td>

                      <td style={tableCellRight}>
                        formatPricePerM2(
                          statistic
                            .medianPricePerM2,
                          transactionType,
                          language
                        )
                      </td>

                      <td style={tableCellRight}>
                        formatSignedPricePerM2(
                          statistic
                            .medianDifferenceFromSelectedMarket,
                          transactionType,
                          language
                        )
                      </td>

                      <td style={tableCellRight}>
                        {formatSignedPercent(
                          statistic
                            .medianPercentAboveOrBelowSelectedMarket
                        )}
                      </td>
                    </tr>
                  )
                )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}


function SizeEvidence({
  evidence,
  transactionType,
  language
}: {
  evidence:
    PriceMeterCrossDimensionalSizeEvidence

  transactionType:
    'sale' | 'rent'

  language:
    PriceMeterCrossDimensionalLanguage
}) {

  const isSpanish =
    language ===
      'es'


  return (
    <div style={evidenceCard}>
      <div style={evidenceHeader}>
        <div>
          <div style={evidenceTitle}>
            {evidence.secondaryCohortLabel}
          </div>

          <div style={evidencePopulation}>
            {formatInteger(
              evidence
                .representedObservationCount
            )}{' '}
            {isSpanish
              ? 'propiedades representadas'
              : 'represented properties'}
          </div>
        </div>

        <EvidenceStatus
          status={
            evidence.status
          }
          language={
            language
          }
        />
      </div>


      <div style={evidenceSummaryGrid}>
        <EvidenceMetric
          label={
            isSpanish
              ? 'Bandas de área con datos'
              : 'Populated area bands'
          }
          value={`${formatInteger(
            evidence
              .populatedBandCount
          )} / ${formatInteger(
            evidence
              .requiredPopulatedBandCount
          )} ${
            isSpanish
              ? 'requeridas'
              : 'required'
          }`}
        />

        <EvidenceMetric
          label="Spearman ρ"
          value={
            formatSignedDecimal(
              evidence
                .spearmanRho
            )
          }
        />

        <EvidenceMetric
          label={
            isSpanish
              ? 'Pendiente log-log'
              : 'Log-log slope'
          }
          value={
            formatSignedDecimal(
              evidence
                .logLogSlope
            )
          }
        />

        <EvidenceMetric
          label={
            isSpanish
              ? 'Cambio modelado ante +10% de área'
              : 'Modeled 10% area change'
          }
          value={
            formatSignedPercent(
              evidence
                .modeledTenPercentAreaChangePercent
            )
          }
        />

        <EvidenceMetric
          label="R²"
          value={
            formatDecimal(
              evidence
                .rSquared
            )
          }
        />
      </div>


      {evidence
        .modeledStatisticsAuthorization ===
        'withheld_mathematical_coupling' && (
        <div style={withheldNotice}>
          {isSpanish
            ? 'La regresión, el cambio porcentual modelado y R² no se presentan para este emparejamiento porque la dimensión secundaria seleccionada está matemáticamente acoplada a la relación de tamaño analizada.'
            : 'Regression, modeled percentage change, and R² are withheld for this pairing because the selected secondary dimension is mathematically coupled to the owning size relationship.'}
        </div>
      )}


      {evidence.coordinates.length >
        0 && (
        <div style={tableWrapper}>
          <table style={table}>
            <thead>
              <tr>
                <th style={tableHeader}>
                  {isSpanish
                    ? 'Coordenada de Área'
                    : 'Area Coordinate'}
                </th>

                <th style={tableHeaderRight}>
                  {isSpanish
                    ? 'Precio / m² mediano'
                    : 'Median Price / m²'}
                </th>

                <th style={tableHeaderRight}>
                  {isSpanish
                    ? 'Propiedades'
                    : 'Properties'}
                </th>
              </tr>
            </thead>

            <tbody>
              {evidence
                .coordinates
                .map(
                  (
                    coordinate,
                    index
                  ) => (
                    <tr
                      key={`${evidence.secondaryCohortKey}-${index}`}
                    >
                      <td style={tableCell}>
                        {formatArea(
                          coordinate
                            .areaM2
                        )}
                      </td>

                      <td style={tableCellRight}>
                        {formatPricePerM2(
                          coordinate
                            .normalizedPricePerM2,
                          transactionType,
                          language
                        )}
                      </td>

                      <td style={tableCellRight}>
                        {formatInteger(
                          coordinate
                            .observationCount
                        )}
                      </td>
                    </tr>
                  )
                )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}


function ConstructionLandEvidence({
  evidence,
  transactionType,
  language
}: {
  evidence:
    PriceMeterCrossDimensionalConstructionLandEvidence

  transactionType:
    'sale' | 'rent'

  language:
    PriceMeterCrossDimensionalLanguage
}) {

  const isSpanish =
    language ===
      'es'


  return (
    <div style={evidenceCard}>
      <div style={evidenceHeader}>
        <div>
          <div style={evidenceTitle}>
            {evidence.secondaryCohortLabel}
          </div>

          <div style={evidencePopulation}>
            {formatInteger(
              evidence
                .representedObservationCount
            )}{' '}
            {isSpanish
              ? 'propiedades representadas'
              : 'represented properties'}
          </div>
        </div>

        <EvidenceStatus
          status={
            evidence.status
          }
          language={
            language
          }
        />
      </div>


      <div style={evidenceSummaryGrid}>
        <EvidenceMetric
          label={
            isSpanish
              ? 'Normalización'
              : 'Normalization'
          }
          value={
            evidence
              .normalizationBasis ===
              'land'
              ? isSpanish
                ? 'Terreno'
                : 'Land'
              : isSpanish
                ? 'Construcción'
                : 'Construction'
          }
        />

        <EvidenceMetric
          label={
            isSpanish
              ? 'Cohortes de razón con datos'
              : 'Populated ratio cohorts'
          }
          value={`${formatInteger(
            evidence
              .populatedCohortCount
          )} / ${formatInteger(
            evidence
              .requiredPopulatedCohortCount
          )} ${
            isSpanish
              ? 'requeridas'
              : 'required'
          }`}
        />

        <EvidenceMetric
          label={
            isSpanish
              ? 'Propiedades representadas'
              : 'Properties represented'
          }
          value={`${formatInteger(
            evidence
              .representedObservationCount
          )} / ${formatInteger(
            evidence
              .requiredObservationCount
          )} ${
            isSpanish
              ? 'requeridas'
              : 'required'
          }`}
        />

        <EvidenceMetric
          label="Spearman ρ"
          value={
            formatSignedDecimal(
              evidence
                .spearmanRho
            )
          }
        />
      </div>


      <div style={withheldNotice}>
        {isSpanish
          ? 'La regresión, el cambio porcentual modelado y R² no se presentan porque la relación Construcción a Terreno comparte un componente matemático con el cálculo normalizado de Precio / m².'
          : 'Regression, modeled percentage change, and R² are withheld because the Construction-to-Land relationship shares a mathematical component with the normalized Price / m² calculation.'}
      </div>


      {evidence.coordinates.length >
        0 && (
        <div style={tableWrapper}>
          <table style={table}>
            <thead>
              <tr>
                <th style={tableHeader}>
                  {isSpanish
                    ? 'Construcción a Terreno'
                    : 'Construction-to-Land'}
                </th>

                <th style={tableHeaderRight}>
                  {isSpanish
                    ? 'Precio / m² mediano'
                    : 'Median Price / m²'}
                </th>

                <th style={tableHeaderRight}>
                  {isSpanish
                    ? 'Propiedades'
                    : 'Properties'}
                </th>
              </tr>
            </thead>

            <tbody>
              {evidence
                .coordinates
                .map(
                  (
                    coordinate,
                    index
                  ) => (
                    <tr
                      key={`${evidence.secondaryCohortKey}-${index}`}
                    >
                      <td style={tableCell}>
                        {formatRatio(
                          coordinate
                            .constructionToLandRatio
                        )}
                      </td>

                      <td style={tableCellRight}>
                        {formatPricePerM2(
                          coordinate
                            .normalizedPricePerM2,
                          transactionType,
                          language
                        )}
                      </td>

                      <td style={tableCellRight}>
                        {formatInteger(
                          coordinate
                            .observationCount
                        )}
                      </td>
                    </tr>
                  )
                )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}


function EvidenceMetric({
  label,
  value
}: {
  label:
    string

  value:
    string
}) {

  return (
    <div style={metric}>
      <div style={metricLabel}>
        {label}
      </div>

      <div style={metricValue}>
        {value}
      </div>
    </div>
  )
}


function EvidenceSection({
  evidenceSet,
  transactionType,
  language
}: {
  evidenceSet:
    PriceMeterCrossDimensionalEvidenceSet

  transactionType:
    'sale' | 'rent'

  language:
    PriceMeterCrossDimensionalLanguage
}) {

  const isSpanish =
    language ===
      'es'


  if (
    evidenceSet.evidence.length ===
      0
  ) {
    return (
      <div style={emptyEvidence}>
        {isSpanish
          ? 'No se representaron poblaciones secundarias con datos en este análisis.'
          : 'No populated secondary populations were represented in this analysis.'}
      </div>
    )
  }


  return (
    <div style={evidenceList}>
      {evidenceSet
        .evidence
        .map(
          evidence => {

            if (
              evidence.kind ===
                'geographic'
            ) {
              return (
                <GeographicEvidence
                  key={
                    evidence
                      .secondaryCohortKey
                  }
                  evidence={
                    evidence
                  }
                  transactionType={
                    transactionType
                  }
                  language={
                    language
                  }
                />
              )
            }


            if (
              evidence.kind ===
                'size_relationship'
            ) {
              return (
                <SizeEvidence
                  key={
                    evidence
                      .secondaryCohortKey
                  }
                  evidence={
                    evidence
                  }
                  transactionType={
                    transactionType
                  }
                  language={
                    language
                  }
                />
              )
            }


            return (
              <ConstructionLandEvidence
                key={
                  evidence
                    .secondaryCohortKey
                }
                evidence={
                  evidence
                }
                transactionType={
                  transactionType
                }
                language={
                  language
                }
              />
            )
          }
        )}
    </div>
  )
}


function PersistenceSection({
  outcomes,
  language
}: {
  outcomes:
    PriceMeterCrossDimensionalOutcomes

  language:
    PriceMeterCrossDimensionalLanguage
}) {

  const isSpanish =
    language ===
      'es'

  const persistence =
    outcomes.persistence


  return (
    <OutcomeCard
      title={
        isSpanish
          ? 'Persistencia'
          : 'Persistence'
      }
    >
      <p style={outcomeText}>
        {isSpanish
          ? 'La relación analizada se estableció en '
          : 'The owning relationship was established in '}
        <strong>
          {formatInteger(
            persistence
              .establishedSecondaryCohortCount
          )}{' '}
          {isSpanish
            ? 'de'
            : 'of'}{' '}
          {formatInteger(
            persistence
              .examinedSecondaryCohortCount
          )}
        </strong>{' '}
        {isSpanish
          ? 'poblaciones secundarias examinadas'
          : 'examined secondary populations'}
        {persistence
          .persistenceRatePercent !==
          null
          ? ` (${formatPercent(
              persistence
                .persistenceRatePercent
            )})`
          : ''}
        .
      </p>

      <p style={outcomeDetail}>
        {isSpanish
          ? 'Las poblaciones en las que se estableció la relación representan '
          : 'Established populations represent '}
        {formatInteger(
          persistence
            .establishedObservationCount
        )}{' '}
        {isSpanish
          ? 'propiedades. La población representada completa contiene '
          : 'properties. The complete represented population contains '}
        {formatInteger(
          persistence
            .representedObservationCount
        )}{' '}
        {isSpanish
          ? 'propiedades.'
          : 'properties.'}
      </p>
    </OutcomeCard>
  )
}


function VariationSection({
  variation,
  transactionType,
  language
}: {
  variation:
    PriceMeterCrossDimensionalVariation | null

  transactionType:
    'sale' | 'rent'

  language:
    PriceMeterCrossDimensionalLanguage
}) {

  const isSpanish =
    language ===
      'es'


  if (
    variation ===
      null
  ) {
    return (
      <OutcomeCard
        title={
          isSpanish
            ? 'Variación'
            : 'Variation'
        }
      >
        <p style={outcomeText}>
          {isSpanish
            ? 'Ninguna población secundaria en la que se estableció la relación produjo evidencia numérica de la relación a partir de la cual pudiera calcularse la variación.'
            : 'No established secondary population produced numerical relationship evidence from which variation could be calculated.'}
        </p>
      </OutcomeCard>
    )
  }


  if (
    variation.kind ===
      'geographic'
  ) {
    return (
      <OutcomeCard
        title={
          isSpanish
            ? 'Variación'
            : 'Variation'
        }
      >
        <div style={outcomeMetricGrid}>
          <EvidenceMetric
            label={
              isSpanish
                ? 'Poblaciones establecidas'
                : 'Established populations'
            }
            value={
              formatInteger(
                variation
                  .establishedSecondaryCohortCount
              )
            }
          />

          <EvidenceMetric
            label={
              isSpanish
                ? 'Diferencia mediana mínima'
                : 'Median-difference minimum'
            }
            value={
              formatSignedPricePerM2(
                variation
                  .observedMedianDifferenceMinimum,
                transactionType,
                language
              )
            }
          />

          <EvidenceMetric
            label={
              isSpanish
                ? 'Diferencia mediana máxima'
                : 'Median-difference maximum'
            }
            value={
              formatSignedPricePerM2(
                variation
                  .observedMedianDifferenceMaximum,
                transactionType,
                language
              )
            }
          />

          <EvidenceMetric
            label={
              isSpanish
                ? 'Rango de diferencia mediana'
                : 'Median-difference range'
            }
            value={
              formatPricePerM2(
                variation
                  .observedMedianDifferenceRange,
                transactionType,
                language
              )
            }
          />

          <EvidenceMetric
            label={
              isSpanish
                ? 'Diferencia % mínima'
                : '% difference minimum'
            }
            value={
              formatSignedPercent(
                variation
                  .observedPercentDifferenceMinimum
              )
            }
          />

          <EvidenceMetric
            label={
              isSpanish
                ? 'Diferencia % máxima'
                : '% difference maximum'
            }
            value={
              formatSignedPercent(
                variation
                  .observedPercentDifferenceMaximum
              )
            }
          />

          <EvidenceMetric
            label={
              isSpanish
                ? 'Rango de diferencia %'
                : '% difference range'
            }
            value={
              formatPercent(
                variation
                  .observedPercentDifferenceRange
              )
            }
          />
        </div>
      </OutcomeCard>
    )
  }


  if (
    variation.kind ===
      'size_relationship'
  ) {
    return (
      <OutcomeCard
        title={
          isSpanish
            ? 'Variación'
            : 'Variation'
        }
      >
        <div style={outcomeMetricGrid}>
          <EvidenceMetric
            label={
              isSpanish
                ? 'Poblaciones establecidas'
                : 'Established populations'
            }
            value={
              formatInteger(
                variation
                  .establishedSecondaryCohortCount
              )
            }
          />

          <EvidenceMetric
            label="ρ mínimo"
            value={
              formatSignedDecimal(
                variation
                  .spearmanRhoMinimum
              )
            }
          />

          <EvidenceMetric
            label="ρ máximo"
            value={
              formatSignedDecimal(
                variation
                  .spearmanRhoMaximum
              )
            }
          />

          <EvidenceMetric
            label={
              isSpanish
                ? 'Rango de ρ'
                : 'ρ range'
            }
            value={
              formatDecimal(
                variation
                  .spearmanRhoRange
              )
            }
          />

          <EvidenceMetric
            label={
              isSpanish
                ? 'Pendiente log-log mínima'
                : 'Log-log slope minimum'
            }
            value={
              formatSignedDecimal(
                variation
                  .logLogSlopeMinimum
              )
            }
          />

          <EvidenceMetric
            label={
              isSpanish
                ? 'Pendiente log-log máxima'
                : 'Log-log slope maximum'
            }
            value={
              formatSignedDecimal(
                variation
                  .logLogSlopeMaximum
              )
            }
          />

          <EvidenceMetric
            label={
              isSpanish
                ? 'Rango de pendiente log-log'
                : 'Log-log slope range'
            }
            value={
              formatDecimal(
                variation
                  .logLogSlopeRange
              )
            }
          />

          <EvidenceMetric
            label={
              isSpanish
                ? 'Cambio modelado mínimo ante +10% de área'
                : 'Modeled 10% change minimum'
            }
            value={
              formatSignedPercent(
                variation
                  .modeledTenPercentAreaChangeMinimum
              )
            }
          />

          <EvidenceMetric
            label={
              isSpanish
                ? 'Cambio modelado máximo ante +10% de área'
                : 'Modeled 10% change maximum'
            }
            value={
              formatSignedPercent(
                variation
                  .modeledTenPercentAreaChangeMaximum
              )
            }
          />

          <EvidenceMetric
            label={
              isSpanish
                ? 'Rango del cambio modelado ante +10% de área'
                : 'Modeled 10% change range'
            }
            value={
              formatPercent(
                variation
                  .modeledTenPercentAreaChangeRange
              )
            }
          />

          <EvidenceMetric
            label="R² mínimo"
            value={
              formatDecimal(
                variation
                  .rSquaredMinimum
              )
            }
          />

          <EvidenceMetric
            label="R² máximo"
            value={
              formatDecimal(
                variation
                  .rSquaredMaximum
              )
            }
          />

          <EvidenceMetric
            label={
              isSpanish
                ? 'Rango de R²'
                : 'R² range'
            }
            value={
              formatDecimal(
                variation
                  .rSquaredRange
              )
            }
          />
        </div>
      </OutcomeCard>
    )
  }


  return (
    <OutcomeCard
      title={
        isSpanish
          ? 'Variación'
          : 'Variation'
      }
    >
      <div style={outcomeMetricGrid}>
        <EvidenceMetric
          label={
            isSpanish
              ? 'Poblaciones establecidas'
              : 'Established populations'
          }
          value={
            formatInteger(
              variation
                .establishedSecondaryCohortCount
            )
          }
        />

        <EvidenceMetric
          label={
            isSpanish
              ? 'ρ mínimo'
              : 'ρ minimum'
          }
          value={
            formatSignedDecimal(
              variation
                .spearmanRhoMinimum
            )
          }
        />

        <EvidenceMetric
          label={
            isSpanish
              ? 'ρ máximo'
              : 'ρ maximum'
          }
          value={
            formatSignedDecimal(
              variation
                .spearmanRhoMaximum
            )
          }
        />

        <EvidenceMetric
          label={
            isSpanish
              ? 'Rango de ρ'
              : 'ρ range'
          }
          value={
            formatDecimal(
              variation
                .spearmanRhoRange
            )
          }
        />
      </div>
    </OutcomeCard>
  )
}


function ReversalSection({
  reversals,
  transactionType,
  language
}: {
  reversals:
    PriceMeterCrossDimensionalReversal[]

  transactionType:
    'sale' | 'rent'

  language:
    PriceMeterCrossDimensionalLanguage
}) {

  const isSpanish =
    language ===
      'es'


  return (
    <OutcomeCard
      title={
        isSpanish
          ? 'Reversión'
          : 'Reversal'
      }
    >
      {reversals.length ===
        0 ? (
        <p style={outcomeText}>
          {isSpanish
            ? 'No se observó ninguna reversión entre las poblaciones secundarias en las que se estableció la relación.'
            : 'No reversal was observed between the established secondary populations.'}
        </p>
      ) : (
        <div style={reversalList}>
          <p style={outcomeText}>
            {formatInteger(
              reversals.length
            )}{' '}
            {isSpanish
              ? reversals.length ===
                  1
                ? 'reversión observada.'
                : 'reversiones observadas.'
              : `reversal${
                  reversals.length ===
                    1
                    ? ''
                    : 's'
                } observed.`}
          </p>

          {reversals.map(
            (
              reversal,
              index
            ) => (
              <ReversalEvidence
                key={index}
                reversal={
                  reversal
                }
                transactionType={
                  transactionType
                }
                language={
                  language
                }
              />
            )
          )}
        </div>
      )}
    </OutcomeCard>
  )
}


function ReversalEvidence({
  reversal,
  transactionType,
  language
}: {
  reversal:
    PriceMeterCrossDimensionalReversal

  transactionType:
    'sale' | 'rent'

  language:
    PriceMeterCrossDimensionalLanguage
}) {

  if (
    reversal.kind ===
      'directional'
  ) {
    return (
      <div style={reversalItem}>
        <strong>
          {
            reversal
              .firstSecondaryCohortLabel
          }
        </strong>
        : ρ ={' '}
        {formatSignedDecimal(
          reversal
            .firstSpearmanRho
        )}
        {' → '}
        <strong>
          {
            reversal
              .secondSecondaryCohortLabel
          }
        </strong>
        : ρ ={' '}
        {formatSignedDecimal(
          reversal
            .secondSpearmanRho
        )}
        .
      </div>
    )
  }


  return (
    <div style={reversalItem}>
      <strong>
        {
          reversal
            .firstSecondaryCohortLabel
        }
      </strong>
      {': '}
      {
        reversal
          .firstCohortFirstGeography
          .geographyLabel
      }{' '}
      {formatPricePerM2(
        reversal
          .firstCohortFirstGeography
          .medianPricePerM2,
        transactionType,
        language
      )}{' '}
      (n=
      {formatInteger(
        reversal
          .firstCohortFirstGeography
          .sampleSize
      )})
      {' > '}
      {
        reversal
          .firstCohortSecondGeography
          .geographyLabel
      }{' '}
      {formatPricePerM2(
        reversal
          .firstCohortSecondGeography
          .medianPricePerM2,
        transactionType,
        language
      )}{' '}
      (n=
      {formatInteger(
        reversal
          .firstCohortSecondGeography
          .sampleSize
      )})
      {' → '}
      <strong>
        {
          reversal
            .secondSecondaryCohortLabel
        }
      </strong>
      {': '}
      {
        reversal
          .secondCohortFirstGeography
          .geographyLabel
      }{' '}
      {formatPricePerM2(
        reversal
          .secondCohortFirstGeography
          .medianPricePerM2,
        transactionType,
        language
      )}{' '}
      (n=
      {formatInteger(
        reversal
          .secondCohortFirstGeography
          .sampleSize
      )})
      {' > '}
      {
        reversal
          .secondCohortSecondGeography
          .geographyLabel
      }{' '}
      {formatPricePerM2(
        reversal
          .secondCohortSecondGeography
          .medianPricePerM2,
        transactionType,
        language
      )}{' '}
      (n=
      {formatInteger(
        reversal
          .secondCohortSecondGeography
          .sampleSize
      )})
      .
    </div>
  )
}


function NonEstablishmentSection({
  nonEstablishment,
  language
}: {
  nonEstablishment:
    PriceMeterCrossDimensionalNonEstablishment[]

  language:
    PriceMeterCrossDimensionalLanguage
}) {

  const isSpanish =
    language ===
      'es'


  return (
    <OutcomeCard
      title={
        isSpanish
          ? 'No establecimiento'
          : 'Non-establishment'
      }
    >
      {nonEstablishment.length ===
        0 ? (
        <p style={outcomeText}>
          {isSpanish
            ? 'La relación se estableció en cada población secundaria examinada.'
            : 'The relationship was established in every examined secondary population.'}
        </p>
      ) : (
        <div style={nonEstablishmentList}>
          {nonEstablishment.map(
            item => (
              <NonEstablishmentEvidence
                key={
                  item
                    .secondaryCohortKey
                }
                item={
                  item
                }
                language={
                  language
                }
              />
            )
          )}
        </div>
      )}
    </OutcomeCard>
  )
}


function NonEstablishmentEvidence({
  item,
  language
}: {
  item:
    PriceMeterCrossDimensionalNonEstablishment

  language:
    PriceMeterCrossDimensionalLanguage
}) {

  const isSpanish =
    language ===
      'es'

  const reason =
    item.reason


  if (
    reason.kind ===
      'geographic_relationship_not_established'
  ) {
    return (
      <div style={nonEstablishmentItem}>
        <strong>
          {item.secondaryCohortLabel}
        </strong>
        {isSpanish
          ? ': la relación geográfica no se estableció. La población contiene '
          : ': the geographic relationship was not established. The population contains '}
        {formatInteger(
          reason
            .representedObservationCount
        )}{' '}
        {isSpanish
          ? 'propiedades distribuidas entre '
          : 'properties across '}
        {formatInteger(
          reason
            .comparisonGeographyCount
        )}{' '}
        {isSpanish
          ? 'geografías comparadas. El cálculo requiere '
          : 'compared geographies. The calculation requires '}
        {formatInteger(
          reason
            .requiredComparisonGeographyCount
        )}{' '}
        {isSpanish
          ? 'geografías comparadas.'
          : 'compared geographies.'}
      </div>
    )
  }


  if (
    reason.kind ===
      'size_relationship_not_established'
  ) {
    return (
      <div style={nonEstablishmentItem}>
        <strong>
          {item.secondaryCohortLabel}
        </strong>
        {isSpanish
          ? ': la relación de tamaño no se estableció. La población contiene '
          : ': the size relationship was not established. The population contains '}
        {formatInteger(
          reason
            .representedObservationCount
        )}{' '}
        {isSpanish
          ? 'propiedades distribuidas entre '
          : 'properties across '}
        {formatInteger(
          reason
            .populatedBandCount
        )}{' '}
        {isSpanish
          ? 'bandas de área con datos; el cálculo requiere '
          : 'populated area bands; the calculation requires '}
        {formatInteger(
          reason
            .requiredPopulatedBandCount
        )}{' '}
        {isSpanish
          ? 'bandas de área con datos.'
          : 'populated area bands.'}
      </div>
    )
  }


  return (
    <div style={nonEstablishmentItem}>
      <strong>
        {item.secondaryCohortLabel}
      </strong>
      {isSpanish
        ? ': la relación Construcción a Terreno no se estableció. La población contiene '
        : ': the Construction-to-Land relationship was not established. The population contains '}
      {formatInteger(
        reason
          .representedObservationCount
      )}{' '}
      {isSpanish
        ? 'propiedades distribuidas entre '
        : 'properties across '}
      {formatInteger(
        reason
          .populatedCohortCount
      )}{' '}
      {isSpanish
        ? 'cohortes de razón con datos. El cálculo requiere '
        : 'populated ratio cohorts. The calculation requires '}
      {formatInteger(
        reason
          .requiredPopulatedCohortCount
      )}{' '}
      {isSpanish
        ? 'cohortes de razón con datos y '
        : 'populated ratio cohorts and '}
      {formatInteger(
        reason
          .requiredObservationCount
      )}{' '}
      {isSpanish
        ? 'propiedades representadas.'
        : 'represented properties.'}
    </div>
  )
}


function OutcomeCard({
  title,
  children
}: {
  title:
    string

  children:
    React.ReactNode
}) {

  return (
    <div style={outcomeCard}>
      <h5 style={outcomeTitle}>
        {title}
      </h5>

      {children}
    </div>
  )
}


function formatSynthesis(
  synthesis:
    PriceMeterCrossDimensionalSynthesis,

  transactionType:
    'sale' | 'rent',

  language:
    PriceMeterCrossDimensionalLanguage
): string {

  const isSpanish =
    language ===
      'es'


  if (
    synthesis
      .examinedSecondaryCohortCount ===
      0
  ) {
    return isSpanish
      ? `No se examinaron poblaciones secundarias con datos. La población delimitada contiene ${synthesis.representedObservationCount} propiedades representadas.`
      : `No populated secondary populations were examined. The bounded population contains ${synthesis.representedObservationCount} represented properties.`
  }


  const statements:
    string[] = [
      isSpanish
        ? `La relación se estableció en ${synthesis.establishedSecondaryCohortCount} de ${synthesis.examinedSecondaryCohortCount} poblaciones secundarias examinadas, que representan ${synthesis.establishedObservationCount} propiedades`
        : `The relationship was established in ${synthesis.establishedSecondaryCohortCount} of ${synthesis.examinedSecondaryCohortCount} examined secondary populations representing ${synthesis.establishedObservationCount} properties`
    ]


  const variation =
    synthesis.variation


  if (
    variation?.kind ===
      'geographic' &&
    variation
      .observedMedianDifferenceMinimum !==
      null &&
    variation
      .observedMedianDifferenceMaximum !==
      null
  ) {
    statements.push(
      isSpanish
        ? `las diferencias medianas geográficas observadas variaron de ${formatSignedPricePerM2(
            variation
              .observedMedianDifferenceMinimum,
            transactionType,
            language
          )} a ${formatSignedPricePerM2(
            variation
              .observedMedianDifferenceMaximum,
            transactionType,
            language
          )}`
        : `observed geographic median differences ranged from ${formatSignedPricePerM2(
            variation
              .observedMedianDifferenceMinimum,
            transactionType,
            language
          )} to ${formatSignedPricePerM2(
            variation
              .observedMedianDifferenceMaximum,
            transactionType,
            language
          )}`
    )
  }


  if (
    (
      variation?.kind ===
        'size_relationship' ||
      variation?.kind ===
        'construction_to_land_relationship'
    ) &&
    variation
      .spearmanRhoMinimum !==
      null &&
    variation
      .spearmanRhoMaximum !==
      null
  ) {
    statements.push(
      isSpanish
        ? `Spearman ρ varió de ${formatSignedDecimal(
            variation
              .spearmanRhoMinimum
          )} a ${formatSignedDecimal(
            variation
              .spearmanRhoMaximum
          )}`
        : `Spearman ρ ranged from ${formatSignedDecimal(
            variation
              .spearmanRhoMinimum
          )} to ${formatSignedDecimal(
            variation
              .spearmanRhoMaximum
          )}`
    )
  }


  if (
    synthesis.hasReversal
  ) {
    statements.push(
      isSpanish
        ? `se ${synthesis.reversalCount === 1 ? 'observó' : 'observaron'} ${synthesis.reversalCount} ${synthesis.reversalCount === 1 ? 'reversión' : 'reversiones'}`
        : `${synthesis.reversalCount} reversal${synthesis.reversalCount === 1 ? ' was' : 's were'} observed`
    )
  }
  else {
    statements.push(
      isSpanish
        ? 'no se observó ninguna reversión entre las poblaciones en las que se estableció la relación'
        : 'no reversal was observed across the established populations'
    )
  }


  if (
    synthesis
      .hasNonEstablishment
  ) {
    statements.push(
      isSpanish
        ? `la relación no se estableció en ${synthesis.nonEstablishmentCount} ${synthesis.nonEstablishmentCount === 1 ? 'población secundaria examinada' : 'poblaciones secundarias examinadas'}`
        : `the relationship was not established in ${synthesis.nonEstablishmentCount} examined secondary population${synthesis.nonEstablishmentCount === 1 ? '' : 's'}`
    )
  }


  return `${statements.join(
    '; '
  )}.`
}

export default function PriceMeterCrossDimensionalResults({
  language,
  transactionType,
  question,
  evidence
}: Props) {

  const isSpanish =
    language ===
      'es'


  const presentation =
    getPriceMeterCrossDimensionalPresentation({
      question,
      language
    })


  const outcomes =
    evaluatePriceMeterCrossDimensionalOutcomes(
      evidence
    )


  const synthesis =
    buildPriceMeterCrossDimensionalSynthesis({
      question,
      evidenceSet:
        evidence,
      outcomes
    })


  return (
    <div style={container}>

      <header style={header}>
        <div style={eyebrow}>
          {isSpanish
            ? 'Análisis Multidimensional'
            : 'Cross-Dimensional Analysis'}
        </div>
      </header>


      <section style={section}>
        <div style={sectionLabel}>
          {isSpanish
            ? 'Definición'
            : 'Definition'}
        </div>

        <p style={sectionText}>
          {presentation.definition}
        </p>
      </section>


      <section style={section}>
        <div style={sectionLabel}>
          {isSpanish
            ? 'Pregunta'
            : 'Question'}
        </div>

        <p style={questionText}>
          {presentation.question}
        </p>
      </section>


      <section style={section}>
        <div style={sectionLabel}>
          {isSpanish
            ? 'Este Análisis Reporta'
            : 'This Analysis Reports'}
        </div>

        <ul style={reportsList}>
          {presentation.reports.map(
            report => (
              <li
                key={report}
                style={reportsItem}
              >
                {report}
              </li>
            )
          )}
        </ul>
      </section>


      <section style={section}>
        <div style={sectionLabel}>
          {isSpanish
            ? 'Evidencia'
            : 'Evidence'}
        </div>

        <div style={populationSummary}>
          <EvidenceMetric
            label={
              isSpanish
                ? 'Población de entrada'
                : 'Input population'
            }
            value={`${formatInteger(
              evidence
                .inputObservationCount
            )} ${
              isSpanish
                ? 'propiedades'
                : 'properties'
            }`}
          />

          <EvidenceMetric
            label={
              isSpanish
                ? 'Población representada'
                : 'Represented population'
            }
            value={`${formatInteger(
              evidence
                .representedObservationCount
            )} ${
              isSpanish
                ? 'propiedades'
                : 'properties'
            }`}
          />

          <EvidenceMetric
            label={
              isSpanish
                ? 'Excluidas'
                : 'Excluded'
            }
            value={`${formatInteger(
              evidence
                .excludedObservationCount
            )} ${
              isSpanish
                ? 'propiedades'
                : 'properties'
            }`}
          />

          <EvidenceMetric
            label={
              isSpanish
                ? 'Poblaciones secundarias con datos'
                : 'Populated secondary populations'
            }
            value={
              formatInteger(
                evidence
                  .populatedSecondaryCohortCount
              )
            }
          />
        </div>

        <EvidenceSection
          evidenceSet={
            evidence
          }
          transactionType={
            transactionType
          }
          language={
            language
          }
        />
      </section>


      <section style={section}>
        <div style={sectionLabel}>
          {isSpanish
            ? 'Resultados Multidimensionales'
            : 'Cross-Dimensional Outcomes'}
        </div>

        <div style={outcomeList}>
          <PersistenceSection
            outcomes={
              outcomes
            }
            language={
              language
            }
          />

          <VariationSection
            variation={
              outcomes
                .variation
            }
            transactionType={
              transactionType
            }
            language={
              language
            }
          />

          <ReversalSection
            reversals={
              outcomes
                .reversals
            }
            transactionType={
              transactionType
            }
            language={
              language
            }
          />

          <NonEstablishmentSection
            nonEstablishment={
              outcomes
                .nonEstablishment
            }
            language={
              language
            }
          />
        </div>
      </section>


      <section style={synthesisSection}>
        <div style={synthesisLabel}>
          {isSpanish
            ? 'Síntesis'
            : 'Synthesis'}
        </div>

        <p style={synthesisText}>
          {formatSynthesis(
            synthesis,
            transactionType,
            language
          )}
        </p>
      </section>


      <div style={attributionBoundary}>
        {isSpanish
          ? 'Estos resultados describen relaciones observadas de Precio / m² dentro de las poblaciones representadas. No establecen que la dimensión secundaria haya causado las diferencias o relaciones observadas.'
          : 'These results describe observed Price / m² relationships within the represented populations. They do not establish that the secondary dimension caused the observed differences or relationships.'}
      </div>

    </div>
  )
}


const container = {
  display:
    'grid',

  gap:
    '1.75rem'
}


const header = {
  display:
    'grid',

  gap:
    '.4rem'
}


const eyebrow = {
  color:
    '#888',

  fontSize:
    '.78rem',

  fontWeight:
    700,

  letterSpacing:
    '.08em',

  textTransform:
    'uppercase' as const
}

const section = {
  display:
    'grid',

  gap:
    '.85rem'
}


const sectionLabel = {
  color:
    '#aaa',

  fontSize:
    '.8rem',

  fontWeight:
    700,

  letterSpacing:
    '.06em',

  textTransform:
    'uppercase' as const
}


const sectionText = {
  margin:
    0,

  color:
    '#ccc',

  fontSize:
    '.92rem',

  lineHeight:
    1.65
}


const questionText = {
  ...sectionText,

  color:
    '#eee',

  fontWeight:
    600
}


const reportsList = {
  margin:
    0,

  paddingLeft:
    '1.2rem',

  color:
    '#bbb'
}


const reportsItem = {
  marginBottom:
    '.4rem',

  fontSize:
    '.9rem',

  lineHeight:
    1.55
}


const populationSummary = {
  display:
    'grid',

  gridTemplateColumns:
    'repeat(auto-fit, minmax(150px, 1fr))',

  gap:
    '.75rem'
}


const evidenceList = {
  display:
    'grid',

  gap:
    '1rem'
}


const evidenceCard = {
  padding:
    '1rem',

  background:
    '#0d0d0d',

  border:
    '1px solid #242424',

  borderRadius:
    '.8rem'
}


const evidenceHeader = {
  display:
    'flex',

  alignItems:
    'flex-start',

  justifyContent:
    'space-between',

  gap:
    '1rem',

  marginBottom:
    '1rem'
}


const evidenceTitle = {
  color:
    '#eee',

  fontSize:
    '.95rem',

  fontWeight:
    700
}


const evidencePopulation = {
  marginTop:
    '.3rem',

  color:
    '#777',

  fontSize:
    '.8rem'
}


const statusValue = {
  color:
    '#aaa',

  fontSize:
    '.78rem',

  fontWeight:
    700,

  whiteSpace:
    'nowrap' as const
}


const evidenceSummaryGrid = {
  display:
    'grid',

  gridTemplateColumns:
    'repeat(auto-fit, minmax(145px, 1fr))',

  gap:
    '.65rem',

  marginBottom:
    '1rem'
}


const metric = {
  padding:
    '.7rem',

  background:
    '#151515',

  border:
    '1px solid #242424',

  borderRadius:
    '.55rem'
}


const metricLabel = {
  marginBottom:
    '.3rem',

  color:
    '#777',

  fontSize:
    '.72rem',

  lineHeight:
    1.4
}


const metricValue = {
  color:
    '#ddd',

  fontSize:
    '.9rem',

  fontWeight:
    700,

  lineHeight:
    1.4
}


const tableWrapper = {
  overflowX:
    'auto' as const
}


const table = {
  width:
    '100%',

  borderCollapse:
    'collapse' as const,

  fontSize:
    '.82rem'
}


const tableHeader = {
  padding:
    '.65rem .55rem',

  borderBottom:
    '1px solid #2b2b2b',

  color:
    '#777',

  fontWeight:
    600,

  textAlign:
    'left' as const,

  whiteSpace:
    'nowrap' as const
}


const tableHeaderRight = {
  ...tableHeader,

  textAlign:
    'right' as const
}


const tableCell = {
  padding:
    '.7rem .55rem',

  borderBottom:
    '1px solid #1d1d1d',

  color:
    '#bbb',

  textAlign:
    'left' as const
}


const tableCellRight = {
  ...tableCell,

  textAlign:
    'right' as const,

  fontVariantNumeric:
    'tabular-nums'
}


const withheldNotice = {
  marginBottom:
    '1rem',

  padding:
    '.75rem',

  border:
    '1px solid #292929',

  borderRadius:
    '.55rem',

  color:
    '#888',

  fontSize:
    '.8rem',

  lineHeight:
    1.55
}


const emptyEvidence = {
  padding:
    '1rem',

  border:
    '1px solid #242424',

  borderRadius:
    '.7rem',

  color:
    '#888',

  fontSize:
    '.88rem'
}


const outcomeList = {
  display:
    'grid',

  gridTemplateColumns:
    'repeat(auto-fit, minmax(240px, 1fr))',

  gap:
    '.8rem'
}


const outcomeCard = {
  padding:
    '1rem',

  background:
    '#0d0d0d',

  border:
    '1px solid #242424',

  borderRadius:
    '.75rem'
}


const outcomeTitle = {
  margin:
    '0 0 .75rem',

  color:
    '#eee',

  fontSize:
    '.9rem'
}


const outcomeText = {
  margin:
    0,

  color:
    '#ccc',

  fontSize:
    '.86rem',

  lineHeight:
    1.6
}


const outcomeDetail = {
  margin:
    '.65rem 0 0',

  color:
    '#777',

  fontSize:
    '.78rem',

  lineHeight:
    1.55
}


const outcomeMetricGrid = {
  display:
    'grid',

  gridTemplateColumns:
    'repeat(auto-fit, minmax(125px, 1fr))',

  gap:
    '.55rem'
}


const reversalList = {
  display:
    'grid',

  gap:
    '.65rem'
}


const reversalItem = {
  paddingTop:
    '.65rem',

  borderTop:
    '1px solid #222',

  color:
    '#aaa',

  fontSize:
    '.8rem',

  lineHeight:
    1.55
}


const nonEstablishmentList = {
  display:
    'grid',

  gap:
    '.7rem'
}


const nonEstablishmentItem = {
  color:
    '#aaa',

  fontSize:
    '.82rem',

  lineHeight:
    1.6
}


const synthesisSection = {
  paddingTop:
    '1.25rem',

  borderTop:
    '1px solid #292929'
}


const synthesisLabel = {
  marginBottom:
    '.55rem',

  color:
    '#ff3b00',

  fontSize:
    '.78rem',

  fontWeight:
    700,

  letterSpacing:
    '.06em',

  textTransform:
    'uppercase' as const
}


const synthesisText = {
  margin:
    0,

  color:
    '#ff3b00',

  fontSize:
    '.95rem',

  fontStyle:
    'italic',

  fontWeight:
    700,

  lineHeight:
    1.65
}


const attributionBoundary = {
  paddingTop:
    '.9rem',

  borderTop:
    '1px solid #222',

  color:
    '#666',

  fontSize:
    '.75rem',

  lineHeight:
    1.55
}