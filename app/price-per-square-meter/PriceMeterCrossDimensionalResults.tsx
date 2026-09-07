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

import type {
  PriceMeterCrossDimensionalQuestionDefinition
} from '@/lib/price-meter-cross-dimensional-question'


type Props = {
  question:
    PriceMeterCrossDimensionalQuestionDefinition

  evidence:
    PriceMeterCrossDimensionalEvidenceSet
}


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
    number | null
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


  return `₡${new Intl.NumberFormat(
    'en-US',
    {
      maximumFractionDigits:
        0
    }
  ).format(
    value
  )}/m²`
}


function formatSignedPricePerM2(
  value:
    number | null
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


  const absolute =
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
  status
}: {
  status:
    PriceMeterCrossDimensionalEvidence['status']
}) {

  return (
    <span style={statusValue}>
      {status ===
        'established'
        ? 'Established'
        : 'Not established'}
    </span>
  )
}


function GeographicEvidence({
  evidence
}: {
  evidence:
    PriceMeterCrossDimensionalGeographicEvidence
}) {

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
            represented properties
          </div>
        </div>

        <EvidenceStatus
          status={
            evidence.status
          }
        />
      </div>


      <div style={evidenceSummaryGrid}>
        <EvidenceMetric
          label="Selected-market median"
          value={
            formatPricePerM2(
              evidence
                .selectedMarketMedianPricePerM2
            )
          }
        />

        <EvidenceMetric
          label="Selected-market population"
          value={`${formatInteger(
            evidence
              .selectedMarketSampleSize
          )} properties`}
        />

        <EvidenceMetric
          label="Compared geographies"
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
                  Rank
                </th>

                <th style={tableHeader}>
                  Geography
                </th>

                <th style={tableHeaderRight}>
                  Properties
                </th>

                <th style={tableHeaderRight}>
                  Median Price / m²
                </th>

                <th style={tableHeaderRight}>
                  Difference
                </th>

                <th style={tableHeaderRight}>
                  % Difference
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
                        {formatPricePerM2(
                          statistic
                            .medianPricePerM2
                        )}
                      </td>

                      <td style={tableCellRight}>
                        {formatSignedPricePerM2(
                          statistic
                            .medianDifferenceFromSelectedMarket
                        )}
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
  evidence
}: {
  evidence:
    PriceMeterCrossDimensionalSizeEvidence
}) {

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
            represented properties
          </div>
        </div>

        <EvidenceStatus
          status={
            evidence.status
          }
        />
      </div>


      <div style={evidenceSummaryGrid}>
        <EvidenceMetric
          label="Populated area bands"
          value={`${formatInteger(
            evidence
              .populatedBandCount
          )} / ${formatInteger(
            evidence
              .requiredPopulatedBandCount
          )} required`}
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
          label="Log-log slope"
          value={
            formatSignedDecimal(
              evidence
                .logLogSlope
            )
          }
        />

        <EvidenceMetric
          label="Modeled 10% area change"
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
          Regression, modeled percentage
          change, and R² are withheld for
          this pairing because the selected
          secondary dimension is
          mathematically coupled to the
          owning size relationship.
        </div>
      )}


      {evidence.coordinates.length >
        0 && (
        <div style={tableWrapper}>
          <table style={table}>
            <thead>
              <tr>
                <th style={tableHeader}>
                  Area Coordinate
                </th>

                <th style={tableHeaderRight}>
                  Median Price / m²
                </th>

                <th style={tableHeaderRight}>
                  Properties
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
                            .normalizedPricePerM2
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
  evidence
}: {
  evidence:
    PriceMeterCrossDimensionalConstructionLandEvidence
}) {

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
            represented properties
          </div>
        </div>

        <EvidenceStatus
          status={
            evidence.status
          }
        />
      </div>


      <div style={evidenceSummaryGrid}>
        <EvidenceMetric
          label="Normalization"
          value={
            evidence
              .normalizationBasis ===
              'land'
              ? 'Land'
              : 'Construction'
          }
        />

        <EvidenceMetric
          label="Populated ratio cohorts"
          value={`${formatInteger(
            evidence
              .populatedCohortCount
          )} / ${formatInteger(
            evidence
              .requiredPopulatedCohortCount
          )} required`}
        />

        <EvidenceMetric
          label="Properties represented"
          value={`${formatInteger(
            evidence
              .representedObservationCount
          )} / ${formatInteger(
            evidence
              .requiredObservationCount
          )} required`}
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
        Regression, modeled percentage
        change, and R² are withheld because
        the Construction-to-Land relationship
        shares a mathematical component with
        the normalized Price / m² calculation.
      </div>


      {evidence.coordinates.length >
        0 && (
        <div style={tableWrapper}>
          <table style={table}>
            <thead>
              <tr>
                <th style={tableHeader}>
                  Construction-to-Land
                </th>

                <th style={tableHeaderRight}>
                  Median Price / m²
                </th>

                <th style={tableHeaderRight}>
                  Properties
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
                            .normalizedPricePerM2
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
  evidenceSet
}: {
  evidenceSet:
    PriceMeterCrossDimensionalEvidenceSet
}) {

  if (
    evidenceSet.evidence.length ===
      0
  ) {
    return (
      <div style={emptyEvidence}>
        No populated secondary populations
        were represented in this analysis.
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
              />
            )
          }
        )}
    </div>
  )
}


function PersistenceSection({
  outcomes
}: {
  outcomes:
    PriceMeterCrossDimensionalOutcomes
}) {

  const persistence =
    outcomes.persistence


  return (
    <OutcomeCard
      title="Persistence"
    >
      <p style={outcomeText}>
        The owning relationship was
        established in{' '}
        <strong>
          {formatInteger(
            persistence
              .establishedSecondaryCohortCount
          )}{' '}
          of{' '}
          {formatInteger(
            persistence
              .examinedSecondaryCohortCount
          )}
        </strong>{' '}
        examined secondary populations
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
        Established populations represent{' '}
        {formatInteger(
          persistence
            .establishedObservationCount
        )}{' '}
        properties. The complete represented
        population contains{' '}
        {formatInteger(
          persistence
            .representedObservationCount
        )}{' '}
        properties.
      </p>
    </OutcomeCard>
  )
}


function VariationSection({
  variation
}: {
  variation:
    PriceMeterCrossDimensionalVariation | null
}) {

  if (
    variation ===
      null
  ) {
    return (
      <OutcomeCard
        title="Variation"
      >
        <p style={outcomeText}>
          No established secondary population
          produced numerical relationship
          evidence from which variation could
          be calculated.
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
        title="Variation"
      >
        <div style={outcomeMetricGrid}>
          <EvidenceMetric
            label="Established populations"
            value={
              formatInteger(
                variation
                  .establishedSecondaryCohortCount
              )
            }
          />

          <EvidenceMetric
            label="Median-difference minimum"
            value={
              formatSignedPricePerM2(
                variation
                  .observedMedianDifferenceMinimum
              )
            }
          />

          <EvidenceMetric
            label="Median-difference maximum"
            value={
              formatSignedPricePerM2(
                variation
                  .observedMedianDifferenceMaximum
              )
            }
          />

          <EvidenceMetric
            label="Median-difference range"
            value={
              formatPricePerM2(
                variation
                  .observedMedianDifferenceRange
              )
            }
          />

          <EvidenceMetric
            label="% difference minimum"
            value={
              formatSignedPercent(
                variation
                  .observedPercentDifferenceMinimum
              )
            }
          />

          <EvidenceMetric
            label="% difference maximum"
            value={
              formatSignedPercent(
                variation
                  .observedPercentDifferenceMaximum
              )
            }
          />

          <EvidenceMetric
            label="% difference range"
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
        title="Variation"
      >
        <div style={outcomeMetricGrid}>
          <EvidenceMetric
            label="Established populations"
            value={
              formatInteger(
                variation
                  .establishedSecondaryCohortCount
              )
            }
          />

          <EvidenceMetric
            label="ρ minimum"
            value={
              formatSignedDecimal(
                variation
                  .spearmanRhoMinimum
              )
            }
          />

          <EvidenceMetric
            label="ρ maximum"
            value={
              formatSignedDecimal(
                variation
                  .spearmanRhoMaximum
              )
            }
          />

          <EvidenceMetric
            label="ρ range"
            value={
              formatDecimal(
                variation
                  .spearmanRhoRange
              )
            }
          />

          <EvidenceMetric
            label="Log-log slope minimum"
            value={
              formatSignedDecimal(
                variation
                  .logLogSlopeMinimum
              )
            }
          />

          <EvidenceMetric
            label="Log-log slope maximum"
            value={
              formatSignedDecimal(
                variation
                  .logLogSlopeMaximum
              )
            }
          />

          <EvidenceMetric
            label="Log-log slope range"
            value={
              formatDecimal(
                variation
                  .logLogSlopeRange
              )
            }
          />

          <EvidenceMetric
            label="Modeled 10% change minimum"
            value={
              formatSignedPercent(
                variation
                  .modeledTenPercentAreaChangeMinimum
              )
            }
          />

          <EvidenceMetric
            label="Modeled 10% change maximum"
            value={
              formatSignedPercent(
                variation
                  .modeledTenPercentAreaChangeMaximum
              )
            }
          />

          <EvidenceMetric
            label="Modeled 10% change range"
            value={
              formatPercent(
                variation
                  .modeledTenPercentAreaChangeRange
              )
            }
          />

          <EvidenceMetric
            label="R² minimum"
            value={
              formatDecimal(
                variation
                  .rSquaredMinimum
              )
            }
          />

          <EvidenceMetric
            label="R² maximum"
            value={
              formatDecimal(
                variation
                  .rSquaredMaximum
              )
            }
          />

          <EvidenceMetric
            label="R² range"
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
      title="Variation"
    >
      <div style={outcomeMetricGrid}>
        <EvidenceMetric
          label="Established populations"
          value={
            formatInteger(
              variation
                .establishedSecondaryCohortCount
            )
          }
        />

        <EvidenceMetric
          label="ρ minimum"
          value={
            formatSignedDecimal(
              variation
                .spearmanRhoMinimum
            )
          }
        />

        <EvidenceMetric
          label="ρ maximum"
          value={
            formatSignedDecimal(
              variation
                .spearmanRhoMaximum
            )
          }
        />

        <EvidenceMetric
          label="ρ range"
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
  reversals
}: {
  reversals:
    PriceMeterCrossDimensionalReversal[]
}) {

  return (
    <OutcomeCard
      title="Reversal"
    >
      {reversals.length ===
        0 ? (
        <p style={outcomeText}>
          No reversal was observed between
          the established secondary
          populations.
        </p>
      ) : (
        <div style={reversalList}>
          <p style={outcomeText}>
            {formatInteger(
              reversals.length
            )}{' '}
            reversal
            {reversals.length ===
              1
              ? ''
              : 's'}{' '}
            observed.
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
              />
            )
          )}
        </div>
      )}
    </OutcomeCard>
  )
}


function ReversalEvidence({
  reversal
}: {
  reversal:
    PriceMeterCrossDimensionalReversal
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
      Relative geographic ordering changed
      between{' '}
      <strong>
        {
          reversal
            .firstSecondaryCohortLabel
        }
      </strong>{' '}
      and{' '}
      <strong>
        {
          reversal
            .secondSecondaryCohortLabel
        }
      </strong>{' '}
      for{' '}
      {
        reversal
          .firstGeographyKey
      }{' '}
      and{' '}
      {
        reversal
          .secondGeographyKey
      }.
    </div>
  )
}


function NonEstablishmentSection({
  nonEstablishment
}: {
  nonEstablishment:
    PriceMeterCrossDimensionalNonEstablishment[]
}) {

  return (
    <OutcomeCard
      title="Non-establishment"
    >
      {nonEstablishment.length ===
        0 ? (
        <p style={outcomeText}>
          The relationship was established
          in every examined secondary
          population.
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
              />
            )
          )}
        </div>
      )}
    </OutcomeCard>
  )
}


function NonEstablishmentEvidence({
  item
}: {
  item:
    PriceMeterCrossDimensionalNonEstablishment
}) {

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
        : the geographic relationship was
        not established. The population
        contains{' '}
        {formatInteger(
          reason
            .representedObservationCount
        )}{' '}
        properties across{' '}
        {formatInteger(
          reason
            .comparisonGeographyCount
        )}{' '}
        compared geographies.
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
        : the size relationship was not
        established. The population contains{' '}
        {formatInteger(
          reason
            .representedObservationCount
        )}{' '}
        properties across{' '}
        {formatInteger(
          reason
            .populatedBandCount
        )}{' '}
        populated area bands; the calculation
        requires{' '}
        {formatInteger(
          reason
            .requiredPopulatedBandCount
        )}{' '}
        populated area bands.
      </div>
    )
  }


  return (
    <div style={nonEstablishmentItem}>
      <strong>
        {item.secondaryCohortLabel}
      </strong>
      : the Construction-to-Land relationship
      was not established. The population
      contains{' '}
      {formatInteger(
        reason
          .representedObservationCount
      )}{' '}
      properties across{' '}
      {formatInteger(
        reason
          .populatedCohortCount
      )}{' '}
      populated ratio cohorts. The calculation
      requires{' '}
      {formatInteger(
        reason
          .requiredPopulatedCohortCount
      )}{' '}
      populated ratio cohorts and{' '}
      {formatInteger(
        reason
          .requiredObservationCount
      )}{' '}
      represented properties.
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


function buildSynthesis(
  outcomes:
    PriceMeterCrossDimensionalOutcomes
): string {

  const persistence =
    outcomes.persistence


  if (
    persistence
      .examinedSecondaryCohortCount ===
      0
  ) {
    return (
      'No populated secondary populations were represented, so the Cross-Dimensional relationship was not examined.'
    )
  }


  const persistenceStatement =
    `The relationship was established in ${
      persistence
        .establishedSecondaryCohortCount
    } of ${
      persistence
        .examinedSecondaryCohortCount
    } examined secondary populations representing ${
      persistence
        .establishedObservationCount
    } properties`


  if (
    outcomes.reversals.length >
      0
  ) {
    return (
      `${persistenceStatement}; ${
        outcomes.reversals.length
      } reversal${
        outcomes.reversals.length ===
          1
          ? ' was'
          : 's were'
      } observed across the established populations.`
    )
  }


  if (
    outcomes
      .nonEstablishment
      .length >
      0
  ) {
    return (
      `${persistenceStatement}; the relationship was not established in ${
        outcomes
          .nonEstablishment
          .length
      } examined secondary population${
        outcomes
          .nonEstablishment
          .length ===
          1
          ? ''
          : 's'
      }.`
    )
  }


  return (
    `${persistenceStatement}; no reversal was observed across the established populations.`
  )
}


export default function PriceMeterCrossDimensionalResults({
  question,
  evidence
}: Props) {

  const outcomes =
    evaluatePriceMeterCrossDimensionalOutcomes(
      evidence
    )


  const synthesis =
    buildSynthesis(
      outcomes
    )


  return (
    <div style={container}>

      <header style={header}>
        <div style={eyebrow}>
          Cross-Dimensional Analysis
        </div>

        <h4 style={title}>
          {question.definition}
        </h4>
      </header>


      <section style={section}>
        <div style={sectionLabel}>
          Definition
        </div>

        <p style={sectionText}>
          {question.definition}
        </p>
      </section>


      <section style={section}>
        <div style={sectionLabel}>
          Question
        </div>

        <p style={questionText}>
          {question.question}
        </p>
      </section>


      <section style={section}>
        <div style={sectionLabel}>
          This Analysis Reports
        </div>

        <ul style={reportsList}>
          {question.reports.map(
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
          Evidence
        </div>

        <div style={populationSummary}>
          <EvidenceMetric
            label="Input population"
            value={`${formatInteger(
              evidence
                .inputObservationCount
            )} properties`}
          />

          <EvidenceMetric
            label="Represented population"
            value={`${formatInteger(
              evidence
                .representedObservationCount
            )} properties`}
          />

          <EvidenceMetric
            label="Excluded"
            value={`${formatInteger(
              evidence
                .excludedObservationCount
            )} properties`}
          />

          <EvidenceMetric
            label="Populated secondary populations"
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
        />
      </section>


      <section style={section}>
        <div style={sectionLabel}>
          Cross-Dimensional Outcomes
        </div>

        <div style={outcomeList}>
          <PersistenceSection
            outcomes={
              outcomes
            }
          />

          <VariationSection
            variation={
              outcomes
                .variation
            }
          />

          <ReversalSection
            reversals={
              outcomes
                .reversals
            }
          />

          <NonEstablishmentSection
            nonEstablishment={
              outcomes
                .nonEstablishment
            }
          />
        </div>
      </section>


      <section style={synthesisSection}>
        <div style={synthesisLabel}>
          Synthesis
        </div>

        <p style={synthesisText}>
          {synthesis}
        </p>
      </section>


      <div style={attributionBoundary}>
        These results describe observed
        Price / m² relationships within the
        represented populations. They do not
        establish that the secondary dimension
        caused the observed differences or
        relationships.
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


const title = {
  margin:
    0,

  color:
    '#f5f5f5',

  fontSize:
    '1.1rem',

  lineHeight:
    1.45
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