import PriceMeterSizeRelationshipChart
  from './PriceMeterSizeRelationshipChart'

import PriceMeterConstructionLandRelationshipChart from './PriceMeterConstructionLandRelationshipChart'
import PriceMeterConstructionLandDistributionChart from './PriceMeterConstructionLandDistributionChart'

type Distribution = {
  transactionType:
    'sale' | 'rent'

  sampleSize:
    number

  minimum:
    number | null

  p10:
    number | null

  p25:
    number | null

  median:
    number | null

  average:
    number | null

  p75:
    number | null

  p90:
    number | null

  maximum:
    number | null

  iqr:
    number | null
}


type Confidence = {
  numberOfProperties:
    number

  confidence: {
    score:
      number

    label:
      string
  }
}

type SizeRelationshipBand = {
  range:
    string

  label:
    string

  observationCount:
    number

  medianExactArea:
    number | null

  medianNormalizedRatio:
    number | null
}


type SizeRelationship = {
  population: {
    relationshipKind:
      string

    bands:
      SizeRelationshipBand[]

    populatedBands:
      SizeRelationshipBand[]

    coordinates: {
      area:
        number

      ratio:
        number
    }[]

    representedObservationCount:
      number
  }

  result: {
    evidence: {
      populatedBandCount:
        number

      representedObservationCount:
        number

      hasSufficientBandEvidence:
        boolean
    }

    coordinates: {
      area:
        number

      ratio:
        number
    }[]

    spearmanRho:
      number | null

    regression:
      {
        alpha:
          number

        beta:
          number

        modeledTenPercentAreaChange:
          number

        rSquared:
          number
      } | null
  }
}

type ConstructionLandCohortDefinition = {
  key:
    string

  label:
    string

  minimumInclusive:
    number | null

  maximumExclusive:
    number | null
}


type ConstructionLandCohortStatistic = {
  definition:
    ConstructionLandCohortDefinition

  observationCount:
    number

  medianExactRatio:
    number | null

  landNormalized:
    Distribution

  constructionNormalized:
    Distribution
}


type ConstructionLandAdjacentComparison = {
  lowerCohort:
    ConstructionLandCohortDefinition

  higherCohort:
    ConstructionLandCohortDefinition

  lowerObservationCount:
    number

  higherObservationCount:
    number

  landNormalized: {
    lowerMedian:
      number | null

    higherMedian:
      number | null

    absoluteDifference:
      number | null

    percentageDifference:
      number | null
  }

  constructionNormalized: {
    lowerMedian:
      number | null

    higherMedian:
      number | null

    absoluteDifference:
      number | null

    percentageDifference:
      number | null
  }
}


type ConstructionLandRelationship = {
  coordinates: {
    constructionToLandRatio:
      number

    normalizedPricePerM2:
      number

    observationCount:
      number
  }[]

  evidence: {
    populatedCohortCount:
      number

    representedObservationCount:
      number

    requiredPopulatedCohortCount:
      number

    requiredObservationCount:
      number

    hasSufficientCohortEvidence:
      boolean

    hasSufficientObservationEvidence:
      boolean

    hasSufficientEvidence:
      boolean
  }

  spearmanRho:
    number | null

  regression:
    null

  regressionWithheldReason:
    string
}


type ConstructionLandAnalysis = {
  transactionType:
    'sale' | 'rent'

  distribution:
    Distribution

  statistics: {
    cohorts:
      ConstructionLandCohortStatistic[]

    populatedCohorts:
      ConstructionLandCohortStatistic[]

    adjacentComparisons:
      ConstructionLandAdjacentComparison[]

    representedObservationCount:
      number
  }

  relationships: {
    landNormalized:
      ConstructionLandRelationship

    constructionNormalized:
      ConstructionLandRelationship
  }

  representedObservationCount:
    number
}

type CohortKey =
  | 'vacantLandLandNormalized'
  | 'improvedLandNormalized'
  | 'improvedConstructionNormalized'


type CohortDefinition = {
  key:
    CohortKey

  propertyBasisLabel:
    string

  normalizationBasisLabel:
    string

  normalizationUnitLabel:
    string
}


const cohortDefinitions:
  CohortDefinition[] = [
    {
      key:
        'vacantLandLandNormalized',

      propertyBasisLabel:
        'Vacant Land',

      normalizationBasisLabel:
        'Land-normalized',

      normalizationUnitLabel:
        'land m²'
    },

    {
      key:
        'improvedLandNormalized',

      propertyBasisLabel:
        'Improved Property',

      normalizationBasisLabel:
        'Land-normalized',

      normalizationUnitLabel:
        'land m²'
    },

    {
      key:
        'improvedConstructionNormalized',

      propertyBasisLabel:
        'Improved Property',

      normalizationBasisLabel:
        'Construction-normalized',

      normalizationUnitLabel:
        'construction m²'
    }
  ]

function formatPricePerM2(
  value:
    number | null,

  transactionType:
    'sale' | 'rent',

  normalizationUnitLabel:
    string
) {
  if (
    value === null ||
    Number.isNaN(value)
  ) {
    return 'Not available'
  }


  const formatted =
    new Intl.NumberFormat(
      'en-US',
      {
        style:
          'currency',

        currency:
          'CRC',

        maximumFractionDigits:
          2
      }
    ).format(
      value
    )


  return transactionType ===
    'rent'
      ? `${formatted} / ${normalizationUnitLabel} / month`
      : `${formatted} / ${normalizationUnitLabel}`
}


function transactionLabel(
  transactionType:
    'sale' | 'rent'
) {
  return transactionType ===
    'sale'
      ? 'Sale'
      : 'Rent'
}

function formatCorrelation(
  value:
    number | null
) {
  if (
    value === null ||
    Number.isNaN(value)
  ) {
    return 'Not calculated'
  }


  return value.toFixed(
    3
  )
}


function formatPercentChange(
  value:
    number | null
) {
  if (
    value === null ||
    Number.isNaN(value)
  ) {
    return 'Not calculated'
  }


  const sign =
    value > 0
      ? '+'
      : ''


  return `${sign}${value.toFixed(
    2
  )}%`
}


function formatRSquared(
  value:
    number | null
) {
  if (
    value === null ||
    Number.isNaN(value)
  ) {
    return 'Not calculated'
  }


  return value.toFixed(
    3
  )
}

function formatConstructionLandRatio(
  value:
    number | null
) {
  if (
    value === null ||
    Number.isNaN(value)
  ) {
    return 'Not available'
  }


  return `${new Intl.NumberFormat(
    'en-US',
    {
      maximumFractionDigits:
        3
    }
  ).format(
    value
  )} : 1`
}


function formatConstructionPerLand(
  value:
    number | null
) {
  if (
    value === null ||
    Number.isNaN(value)
  ) {
    return 'Not available'
  }

  return `${new Intl.NumberFormat(
    'en-US',
    {
      maximumFractionDigits:
        1
    }
  ).format(
    value * 100
  )} m² construction per 100 m² property area`
}

function relationshipDirection(
  beta:
    number
) {
  if (
    beta < 0
  ) {
    return 'decreases'
  }

  if (
    beta > 0
  ) {
    return 'increases'
  }

  return 'remains approximately unchanged'
}

function MarketStatisticCard({
  label,
  value,
  description
}: {
  label:
    string

  value:
    string

  description?:
    string
}) {
  return (
    <div style={statCard}>
      <p style={cardLabel}>
        {label}
      </p>

      <div style={cardValue}>
        {value}
      </div>

      {description && (
        <div style={secondaryValue}>
          {description}
        </div>
      )}
    </div>
  )
}


function CohortDistribution({
  distribution,
  confidence,
  definition
}: {
  distribution:
    Distribution

  confidence:
    Confidence

  definition:
    CohortDefinition
}) {
  const transaction =
    transactionLabel(
      distribution.transactionType
    )


  const identity =
    `${transaction} · ${definition.propertyBasisLabel} · ${definition.normalizationBasisLabel}`


  const format =
    (
      value:
        number | null
    ) =>
      formatPricePerM2(
        value,
        distribution.transactionType,
        definition.normalizationUnitLabel
      )


  return (
    <section style={cohortSection}>
      <div style={cohortHeader}>
        <div>
          <h3 style={cohortTitle}>
            {definition.propertyBasisLabel}
          </h3>

          <div style={identityLabel}>
            {identity}
          </div>
        </div>

        <div style={sampleBadge}>
          {distribution.sampleSize}{' '}
          {distribution.sampleSize === 1
            ? 'property'
            : 'properties'}
        </div>
      </div>


      {distribution.sampleSize === 0 ? (
        <div style={emptyCard}>
          No observations are available for this
          market cohort.
        </div>
      ) : (
        <>
          <div style={cardGrid}>
            <MarketStatisticCard
              label={`Median Price / ${definition.normalizationUnitLabel}`}
              value={
                format(
                  distribution.median
                )
              }
              description={identity}
            />


            <MarketStatisticCard
              label="Middle 50% Price Range"
              value={
                `${format(
                  distribution.p25
                )} – ${format(
                  distribution.p75
                )}`
              }
              description={
                `50% of observed ${transaction.toLowerCase()} prices fall between the 25th and 75th percentiles.`
              }
            />


            <MarketStatisticCard
              label="10th Percentile"
              value={
                format(
                  distribution.p10
                )
              }
              description={
                `${identity} · 10% of observed prices fall below this Price / ${definition.normalizationUnitLabel}.`
              }
            />


            <MarketStatisticCard
              label="90th Percentile"
              value={
                format(
                  distribution.p90
                )
              }
              description={
                `${identity} · 10% of observed prices fall above this Price / ${definition.normalizationUnitLabel}.`
              }
            />


            <MarketStatisticCard
              label={`Average Price / ${definition.normalizationUnitLabel}`}
              value={
                format(
                  distribution.average
                )
              }
              description={identity}
            />


            <MarketStatisticCard
              label="Confidence Based on Number of Properties"
              value={
                `${confidence.confidence.score}% · ${confidence.confidence.label}`
              }
              description={
                `Based on ${confidence.numberOfProperties} ${
                  confidence.numberOfProperties === 1
                    ? 'property'
                    : 'properties'
                } in this exact market cohort.`
              }
            />
          </div>


          <div style={internalRangeNote}>
            <strong>
              Observed internal range:
            </strong>{' '}
            {format(
              distribution.minimum
            )}{' '}
            to{' '}
            {format(
              distribution.maximum
            )}
          </div>
        </>
      )}
    </section>
  )
}
 function ConstructionLandDistribution({
  analysis
}: {
  analysis:
    ConstructionLandAnalysis
}) {
  const {
    distribution
  } =
    analysis


  return (
    <section style={relationshipSection}>
      <div style={relationshipHeader}>
        <div>
          <h3 style={cohortTitle}>
            Construction-to-Land Distribution
          </h3>

          <p style={relationshipDescription}>
            The Construction-to-Land Ratio compares
            reported construction area with property
            area for improved properties in this
            selected market.
          </p>
        </div>

        <div style={sampleBadge}>
          {distribution.sampleSize}{' '}
          {
            distribution.sampleSize === 1
              ? 'property'
              : 'properties'
          }
        </div>
      </div>


      {distribution.sampleSize === 0 ? (
        <div style={emptyCard}>
          No eligible Construction-to-Land
          observations are available for this
          selected market.
        </div>
      ) : (
        <>
          <div style={cardGrid}>
            <MarketStatisticCard
              label="Median Construction-to-Land Ratio"
              value={
                formatConstructionLandRatio(
                  distribution.median
                )
              }
              description={
                formatConstructionPerLand(
                  distribution.median
                )
              }
            />


            <MarketStatisticCard
              label="25th Percentile"
              value={
                formatConstructionLandRatio(
                  distribution.p25
                )
              }
              description={
                formatConstructionPerLand(
                  distribution.p25
                )
              }
            />


            <MarketStatisticCard
              label="75th Percentile"
              value={
                formatConstructionLandRatio(
                  distribution.p75
                )
              }
              description={
                formatConstructionPerLand(
                  distribution.p75
                )
              }
            />


            <MarketStatisticCard
              label="10th Percentile"
              value={
                formatConstructionLandRatio(
                  distribution.p10
                )
              }
              description={
                formatConstructionPerLand(
                  distribution.p10
                )
              }
            />


            <MarketStatisticCard
              label="90th Percentile"
              value={
                formatConstructionLandRatio(
                  distribution.p90
                )
              }
              description={
                formatConstructionPerLand(
                  distribution.p90
                )
              }
            />


            <MarketStatisticCard
              label="Average Construction-to-Land Ratio"
              value={
                formatConstructionLandRatio(
                  distribution.average
                )
              }
              description={
                formatConstructionPerLand(
                  distribution.average
                )
              }
            />
          </div>


          <div style={internalRangeNote}>
            <strong>
              Observed internal range:
            </strong>{' '}
            {
              formatConstructionLandRatio(
                distribution.minimum
              )
            }{' '}
            to{' '}
            {
              formatConstructionLandRatio(
                distribution.maximum
              )
            }
          </div>


          <div style={evidenceGateNote}>
            <strong>
              Measurement boundary:
            </strong>{' '}
            Construction-to-Land Ratio is reported
            construction area divided by property
            area. It does not represent physical
            Site Coverage or building footprint.
          </div>
        </>
      )}
    </section>
  )
}

function ConstructionLandCohortEvidence({
  analysis
}: {
  analysis:
    ConstructionLandAnalysis
}) {
  const {
    statistics
  } =
    analysis


  const formatMedian =
    (
      distribution:
        Distribution,

      normalizationUnitLabel:
        string
    ) =>
      formatPricePerM2(
        distribution.median,
        analysis.transactionType,
        normalizationUnitLabel
      )


  return (
    <section style={relationshipSection}>
      <div style={relationshipHeader}>
        <div>
          <h3 style={cohortTitle}>
            Construction-to-Land Cohorts
          </h3>

          <p style={relationshipDescription}>
            Every eligible improved property is
            assigned to exactly one structural
            Construction-to-Land cohort. Price /
            m² evidence remains separate for
            land-normalized and
            construction-normalized measurements.
          </p>
        </div>

        <div style={sampleBadge}>
          {
            statistics
              .representedObservationCount
          }{' '}
          {
            statistics
              .representedObservationCount === 1
              ? 'property'
              : 'properties'
          }
        </div>
      </div>


      <div style={relationshipTableWrap}>
        <table style={constructionLandTable}>
          <thead>
            <tr>
              <th style={relationshipTh}>
                Construction-to-Land Cohort
              </th>

              <th style={relationshipTh}>
                Properties
              </th>

              <th style={relationshipTh}>
                Median Observed Ratio
              </th>

              <th style={relationshipTh}>
                Median Price / land m²
              </th>

              <th style={relationshipTh}>
                Median Price / construction m²
              </th>
            </tr>
          </thead>

          <tbody>
            {statistics
              .cohorts
              .map(
                cohort => (
                  <tr
                    key={
                      cohort.definition.key
                    }
                  >
                    <td style={relationshipTd}>
                      <strong>
                        {
                          cohort
                            .definition
                            .label
                        }
                      </strong>
                    </td>

                    <td style={relationshipTd}>
                      {
                        cohort
                          .observationCount
                      }
                    </td>

                    <td style={relationshipTd}>
                      {
                        cohort
                          .observationCount >
                          0
                          ? (
                            <>
                              {
                                formatConstructionLandRatio(
                                  cohort
                                    .medianExactRatio
                                )
                              }

                              <div style={tableSecondary}>
                                {
                                  formatConstructionPerLand(
                                    cohort
                                      .medianExactRatio
                                  )
                                }
                              </div>
                            </>
                          )
                          : 'Not available'
                      }
                    </td>

                    <td style={relationshipTd}>
                      {
                        cohort
                          .observationCount >
                          0
                          ? formatMedian(
                              cohort
                                .landNormalized,
                              'land m²'
                            )
                          : 'Not available'
                      }
                    </td>

                    <td style={relationshipTd}>
                      {
                        cohort
                          .observationCount >
                          0
                          ? formatMedian(
                              cohort
                                .constructionNormalized,
                              'construction m²'
                            )
                          : 'Not available'
                      }
                    </td>
                  </tr>
                )
              )}
          </tbody>
        </table>
      </div>


      <div style={evidenceGateNote}>
        All five structural cohorts remain visible,
        including cohorts containing 0 properties.
        Empty cohorts do not contribute coordinates
        to relationship calculations.
      </div>
    </section>
  )
}

function ConstructionLandAdjacentComparisons({
  analysis
}: {
  analysis:
    ConstructionLandAnalysis
}) {
  const {
    adjacentComparisons
  } =
    analysis.statistics


  const formatDifference =
    (
      value:
        number | null,

      normalizationUnitLabel:
        string
    ) =>
      formatPricePerM2(
        value,
        analysis.transactionType,
        normalizationUnitLabel
      )


  if (
    adjacentComparisons.length ===
      0
  ) {
    return (
      <section style={relationshipSection}>
        <h3 style={cohortTitle}>
          Differences Between Consecutive Populated Cohorts
        </h3>

        <div style={statisticsUnavailable}>
          No comparison between consecutive populated cohorts
          is available for this selected market.
        </div>
      </section>
    )
  }


  return (
    <section style={relationshipSection}>
      <div style={relationshipHeader}>
        <div>
          <h3 style={cohortTitle}>
            Differences Between Consecutive Populated Cohorts
          </h3>

          <p style={relationshipDescription}>
            Consecutive populated
            Construction-to-Land cohorts are
            compared using their median
            land-normalized and
            construction-normalized Price / m².
            Absolute and percentage differences
            are shown separately.
          </p>
        </div>
      </div>


      <div style={relationshipTableWrap}>
        <table style={adjacentComparisonTable}>
          <thead>
            <tr>
              <th style={relationshipTh}>
                Cohort Comparison
              </th>

              <th style={relationshipTh}>
                Properties
              </th>

              <th style={relationshipTh}>
                Land-Normalized Difference
              </th>

              <th style={relationshipTh}>
                Land-Normalized % Difference
              </th>

              <th style={relationshipTh}>
                Construction-Normalized Difference
              </th>

              <th style={relationshipTh}>
                Construction-Normalized % Difference
              </th>
            </tr>
          </thead>

          <tbody>
            {adjacentComparisons.map(
              (
                comparison,
                index
              ) => (
                <tr
                  key={
                    `${comparison.lowerCohort.key}-${comparison.higherCohort.key}-${index}`
                  }
                >
                  <td style={relationshipTd}>
                    <strong>
                      {
                        comparison
                          .lowerCohort
                          .label
                      }
                    </strong>

                    {' → '}

                    <strong>
                      {
                        comparison
                          .higherCohort
                          .label
                      }
                    </strong>
                  </td>

                  <td style={relationshipTd}>
                    {
                      comparison
                        .lowerObservationCount
                    }{' '}
                    →{' '}
                    {
                      comparison
                        .higherObservationCount
                    }
                  </td>

                  <td style={relationshipTd}>
                    {
                      formatDifference(
                        comparison
                          .landNormalized
                          .absoluteDifference,
                        'land m²'
                      )
                    }
                  </td>

                  <td style={relationshipTd}>
                    {
                      formatPercentChange(
                        comparison
                          .landNormalized
                          .percentageDifference
                      )
                    }
                  </td>

                  <td style={relationshipTd}>
                    {
                      formatDifference(
                        comparison
                          .constructionNormalized
                          .absoluteDifference,
                        'construction m²'
                      )
                    }
                  </td>

                  <td style={relationshipTd}>
                    {
                      formatPercentChange(
                        comparison
                          .constructionNormalized
                          .percentageDifference
                      )
                    }
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>


      <div style={evidenceGateNote}>
        Differences are calculated from the lower
        populated cohort to the next populated
        cohort shown in the comparison. A positive
        value means the higher cohort has a larger
        median Price / m²; a negative value means
        it has a smaller median Price / m².
      </div>
    </section>
  )
}

function ConstructionLandRelationshipCoordinates({
  title,
  description,
  relationship,
  normalizationUnitLabel,
  transactionType
}: {
  title:
    string

  description:
    string

  relationship:
    ConstructionLandRelationship

  normalizationUnitLabel:
    string

  transactionType:
    'sale' | 'rent'
}) {
  return (
    <section style={relationshipSection}>
      <div style={relationshipHeader}>
        <div>
          <h3 style={cohortTitle}>
            {title}
          </h3>

          <p style={relationshipDescription}>
            {description}
          </p>
        </div>

        <div style={sampleBadge}>
          {
            relationship
              .evidence
              .representedObservationCount
          }{' '}
          {
            relationship
              .evidence
              .representedObservationCount ===
                1
                ? 'property'
                : 'properties'
          }
        </div>
      </div>


      <div style={relationshipTableWrap}>
        <table style={relationshipTable}>
          <thead>
            <tr>
              <th style={relationshipTh}>
                Median Construction-to-Land Ratio
              </th>

              <th style={relationshipTh}>
                Properties
              </th>

              <th style={relationshipTh}>
                Median Price / {normalizationUnitLabel}
              </th>
            </tr>
          </thead>

          <tbody>
            {relationship
              .coordinates
              .map(
                (
                  coordinate,
                  index
                ) => (
                  <tr
                    key={
                      `${coordinate.constructionToLandRatio}-${index}`
                    }
                  >
                    <td style={relationshipTd}>
                      {
                        formatConstructionLandRatio(
                          coordinate
                            .constructionToLandRatio
                        )
                      }

                      <div style={tableSecondary}>
                        {
                          formatConstructionPerLand(
                            coordinate
                              .constructionToLandRatio
                          )
                        }
                      </div>
                    </td>

                    <td style={relationshipTd}>
                      {
                        coordinate
                          .observationCount
                      }
                    </td>

                    <td style={relationshipTd}>
                      {
                        formatPricePerM2(
                          coordinate
                            .normalizedPricePerM2,
                          transactionType,
                          normalizationUnitLabel
                        )
                      }
                    </td>
                  </tr>
                )
              )}
          </tbody>
        </table>
      </div>


      {relationship.coordinates.length ===
        0 && (
        <div style={evidenceGateNote}>
          No populated Construction-to-Land
          cohort coordinates are available for
          this relationship.
        </div>
      )}
    </section>
  )
}

function ConstructionLandRelationshipStatistics({
  title,
  relationship,
  couplingDescription
}: {
  title:
    string

  relationship:
    ConstructionLandRelationship

  couplingDescription:
    string
}) {
  const {
    evidence
  } =
    relationship


  return (
    <section style={relationshipStatisticsSection}>
      <h3 style={cohortTitle}>
        {title}
      </h3>


      <div style={statisticsGrid}>
        <MarketStatisticCard
          label="Populated Cohorts"
          value={
            `${evidence.populatedCohortCount}`
          }
          description={
            `${evidence.requiredPopulatedCohortCount} populated cohorts are required for Spearman ρ.`
          }
        />


        <MarketStatisticCard
          label="Represented Properties"
          value={
            `${evidence.representedObservationCount}`
          }
          description={
            `${evidence.requiredObservationCount} represented properties are required for Spearman ρ.`
          }
        />


        <MarketStatisticCard
          label="Spearman Rank Correlation (ρ)"
          value={
            formatCorrelation(
              relationship
                .spearmanRho
            )
          }
          description={
            evidence.hasSufficientEvidence
              ? 'Calculated from the ranked populated Construction-to-Land cohort coordinates.'
              : 'Not calculated because the complete evidence threshold is not satisfied.'
          }
        />
      </div>


      {!evidence.hasSufficientEvidence && (
        <div style={evidenceGateNote}>
          This selected market contains{' '}
          <strong>
            {evidence.populatedCohortCount}
          </strong>{' '}
          populated Construction-to-Land{' '}
          {
            evidence.populatedCohortCount === 1
              ? 'cohort'
              : 'cohorts'
          }{' '}
          representing{' '}
          <strong>
            {evidence.representedObservationCount}
          </strong>{' '}
          {
            evidence.representedObservationCount === 1
              ? 'property'
              : 'properties'
          }.
          {' '}Spearman ρ requires at least{' '}
          <strong>
            {evidence.requiredPopulatedCohortCount}
          </strong>{' '}
          populated cohorts and{' '}
          <strong>
            {evidence.requiredObservationCount}
          </strong>{' '}
          represented properties.
        </div>
      )}


      <div style={couplingBoundary}>
        <strong>
          Mathematical coupling boundary:
        </strong>{' '}
        {couplingDescription}
        {' '}Spearman ρ is therefore presented as
        descriptive rank association only. Twuanis
        does not calculate log-log regression,
        modeled percentage change, or R² for this
        relationship.
      </div>
    </section>
  )
}

function SizeRelationshipEvidence({
  title,
  description,
  relationship,
  areaLabel,
  ratioLabel,
  transactionType
}: {
  title:
    string

  description:
    string

  relationship:
    SizeRelationship

  areaLabel:
    string

  ratioLabel:
    string

  transactionType:
    'sale' | 'rent'
}) {
  const {
    population,
    result
  } =
    relationship


  const formatArea =
    (
      value:
        number | null
    ) => {

      if (
        value === null ||
        Number.isNaN(value)
      ) {
        return 'Not available'
      }


      return `${new Intl.NumberFormat(
        'en-US',
        {
          maximumFractionDigits:
            2
        }
      ).format(
        value
      )} m²`
    }


  const formatRatio =
    (
      value:
        number | null
    ) =>
      formatPricePerM2(
        value,
        transactionType,
        ratioLabel
      )


  return (
    <section style={relationshipSection}>
      <div style={relationshipHeader}>
        <div>
          <h3 style={cohortTitle}>
            {title}
          </h3>

          <p style={relationshipDescription}>
            {description}
          </p>
        </div>

        <div style={sampleBadge}>
          {
            result.evidence
              .representedObservationCount
          }{' '}
          {
            result.evidence
              .representedObservationCount ===
              1
              ? 'property'
              : 'properties'
          }
        </div>
      </div>


      <div style={relationshipEvidenceSummary}>
        <div>
          <div style={evidenceValue}>
            {
              result.evidence
                .populatedBandCount
            }
          </div>

          <div style={cardLabel}>
            Populated area cohorts
          </div>
        </div>

        <div>
          <div style={evidenceValue}>
            {
              result.evidence
                .representedObservationCount
            }
          </div>

          <div style={cardLabel}>
            Represented properties
          </div>
        </div>

        <div>
          <div style={evidenceValue}>
            {
              result.evidence
                .hasSufficientBandEvidence
                ? 'Sufficient'
                : 'Insufficient'
            }
          </div>

          <div style={cardLabel}>
            Relationship evidence
          </div>
        </div>
      </div>


      <div style={relationshipTableWrap}>
        <table style={relationshipTable}>
          <thead>
            <tr>
              <th style={relationshipTh}>
                Area Cohort
              </th>

              <th style={relationshipTh}>
                Properties
              </th>

              <th style={relationshipTh}>
                Median Observed {areaLabel}
              </th>

              <th style={relationshipTh}>
                Median Price / {ratioLabel}
              </th>
            </tr>
          </thead>

          <tbody>
            {population
              .populatedBands
              .map(
                band => (
                  <tr
                    key={
                      band.range
                    }
                  >
                    <td style={relationshipTd}>
                      {band.label}
                    </td>

                    <td style={relationshipTd}>
                      {band.observationCount}
                    </td>

                    <td style={relationshipTd}>
                      {formatArea(
                        band.medianExactArea
                      )}
                    </td>

                    <td style={relationshipTd}>
                      {formatRatio(
                        band.medianNormalizedRatio
                      )}
                    </td>
                  </tr>
                )
              )}
          </tbody>
        </table>
      </div>


      {!result.evidence
        .hasSufficientBandEvidence && (
        <div style={evidenceGateNote}>
          This selected market contains{' '}
          {
            result.evidence
              .populatedBandCount
          } populated {areaLabel.toLowerCase()}{' '}
          {
            result.evidence
              .populatedBandCount === 1
              ? 'cohort'
              : 'cohorts'
          } representing{' '}
          {
            result.evidence
              .representedObservationCount
          }{' '}
          {
            result.evidence
              .representedObservationCount === 1
              ? 'property'
              : 'properties'
          }. At least 3 populated cohorts are
          required before Twuanis calculates the
          overall size relationship.
        </div>
      )}
    </section>
  )
}

function SizeRelationshipStatistics({
  title,
  relationship
}: {
  title:
    string

  relationship:
    SizeRelationship
}) {
  const {
    result
  } =
    relationship


  if (
    !result.evidence
      .hasSufficientBandEvidence ||
    result.spearmanRho ===
      null ||
    result.regression ===
      null
  ) {
    return (
      <section style={relationshipStatisticsSection}>
        <h3 style={cohortTitle}>
          {title}
        </h3>

        <div style={statisticsUnavailable}>
          Relationship statistics are not
          calculated for this selected market
          because at least 3 populated area
          cohorts are required. The available
          cohort evidence is shown above.
        </div>
      </section>
    )
  }


  const {
    beta,
    modeledTenPercentAreaChange,
    rSquared
  } =
    result.regression


  return (
    <section style={relationshipStatisticsSection}>
      <h3 style={cohortTitle}>
        {title}
      </h3>

      <div style={statisticsGrid}>
        <MarketStatisticCard
          label="Spearman Rank Correlation (ρ)"
          value={
            formatCorrelation(
              result.spearmanRho
            )
          }
          description="Measures whether Price / m² tends to rise or fall as area increases, based on the ranked observed cohort coordinates."
        />


        <MarketStatisticCard
          label="Log-Log Size Coefficient (β)"
          value={
            formatCorrelation(
              beta
            )
          }
          description="Measures the modeled proportional relationship between area and normalized Price / m²."
        />


        <MarketStatisticCard
          label="Modeled Price / m² Change for +10% Area"
          value={
            formatPercentChange(
              modeledTenPercentAreaChange
            )
          }
          description="The modeled percentage change in normalized Price / m² associated with a 10% increase in area."
        />


        <MarketStatisticCard
          label="Model Fit (R²)"
          value={
            formatRSquared(
              rSquared
            )
          }
          description="Reports R² for the fitted log-log model across the observed cohort coordinates."
        />
      </div>
    </section>
  )
}

function SizeRelationshipSynthesis({
  title,
  relationship,
  areaLabel,
  ratioLabel
}: {
  title:
    string

  relationship:
    SizeRelationship

  areaLabel:
    string

  ratioLabel:
    string
}) {
  const {
    population,
    result
  } =
    relationship


  const {
    populatedBandCount,
    representedObservationCount,
    hasSufficientBandEvidence
  } =
    result.evidence


  if (
    !hasSufficientBandEvidence ||
    result.spearmanRho ===
      null ||
    result.regression ===
      null
  ) {
    return (
      <section style={synthesisSection}>
        <h3 style={cohortTitle}>
          {title}
        </h3>


        <div style={synthesisCard}>
          <p style={synthesisText}>
            This selected market contains{' '}
            <strong>
              {populatedBandCount}{' '}
              {
                populatedBandCount ===
                  1
                  ? 'populated cohort'
                  : 'populated cohorts'
              }
            </strong>{' '}
            representing{' '}
            <strong>
              {representedObservationCount}{' '}
              {
                representedObservationCount ===
                  1
                  ? 'property'
                  : 'properties'
              }
            </strong>{' '}
            for {areaLabel.toLowerCase()}.
          </p>


          {population.coordinates.length >=
            2 && (
            <p style={synthesisText}>
              The available cohort coordinates can
              be compared numerically and visually,
              but at least 3 populated cohorts are
              required before Twuanis calculates
              the overall relationship.
            </p>
          )}


          {population.coordinates.length ===
            1 && (
            <p style={synthesisText}>
              One populated cohort provides one
              observed market coordinate. At least
              3 populated cohorts are required to
              calculate how normalized Price /{' '}
              {ratioLabel} changes as area changes.
            </p>
          )}


          {population.coordinates.length ===
            0 && (
            <p style={synthesisText}>
              There are 0 populated cohort
              coordinates available for relationship
              calculation.
            </p>
          )}


          <p style={synthesisText}>
            Insufficient cohort evidence to calculate
            the overall {areaLabel.toLowerCase()} and
            Price / {ratioLabel} relationship.
          </p>
        </div>
      </section>
    )
  }


  const {
    beta,
    modeledTenPercentAreaChange,
    rSquared
  } =
    result.regression


  const direction =
    relationshipDirection(
      beta
    )


  return (
    <section style={synthesisSection}>
      <h3 style={cohortTitle}>
        {title}
      </h3>


      <div style={synthesisCard}>
        <p style={synthesisText}>
          Across{' '}
          <strong>
            {populatedBandCount} populated cohorts
          </strong>{' '}
          representing{' '}
          <strong>
            {representedObservationCount}{' '}
            {
              representedObservationCount ===
                1
                ? 'property'
                : 'properties'
            }
          </strong>
          , Spearman ρ is{' '}
          <strong>
            {formatCorrelation(
              result.spearmanRho
            )}
          </strong>
          .
        </p>


        <div style={synthesisFacts}>
          <div>
            <div style={synthesisFactValue}>
              {formatCorrelation(
                result.spearmanRho
              )}
            </div>

            <div style={cardLabel}>
              Spearman ρ
            </div>
          </div>


          <div>
            <div style={synthesisFactValue}>
              {formatPercentChange(
                modeledTenPercentAreaChange
              )}
            </div>

            <div style={cardLabel}>
              Modeled Price / m² change with +10% area
            </div>
          </div>


          <div>
            <div style={synthesisFactValue}>
              {formatRSquared(
                rSquared
              )}
            </div>

            <div style={cardLabel}>
              R²
            </div>
          </div>
        </div>


        <p style={synthesisText}>
          The log-log model estimates that a 10%
          increase in {areaLabel.toLowerCase()} is
          associated with a{' '}
          <strong>
            {formatPercentChange(
              modeledTenPercentAreaChange
            )}
          </strong>{' '}
          change in normalized Price / {ratioLabel},
          with R² ={' '}
          <strong>
            {formatRSquared(
              rSquared
            )}
          </strong>
          .
        </p>


        <p style={synthesisConclusion}>
          As {areaLabel.toLowerCase()} increases,
          normalized Price / {ratioLabel} {direction}{' '}
          in this selected market.
        </p>


        <div style={synthesisBoundary}>
          This synthesis describes an association
          within the selected market evidence. It
          does not imply that area alone causes the
          observed Price / {ratioLabel} relationship.
        </div>
      </div>
    </section>
  )
}

function SizeRelationshipMethodology() {
  return (
    <div style={methodologyCard}>
      <div style={methodologyStep}>
        <div style={methodologyNumber}>
          1
        </div>

        <div>
          <h3 style={methodologyTitle}>
            Construct Area Cohorts
          </h3>

          <p style={methodologyText}>
            Twuanis groups comparable properties
            into predefined area cohorts separately
            for construction area and property
            area. Empty cohorts remain part of the
            analytical structure but do not
            contribute coordinates to the
            relationship analysis.
          </p>
        </div>
      </div>


      <div style={methodologyStep}>
        <div style={methodologyNumber}>
          2
        </div>

        <div>
          <h3 style={methodologyTitle}>
            Create Observed Cohort Coordinates
          </h3>

          <p style={methodologyText}>
            Each populated cohort contributes one
            observed coordinate. The horizontal
            coordinate is the median exact area of
            the properties in that cohort. The
            vertical coordinate is the median
            normalized Price / m² for those same
            observations.
          </p>
        </div>
      </div>


      <div style={methodologyStep}>
        <div style={methodologyNumber}>
          3
        </div>

        <div>
          <h3 style={methodologyTitle}>
            Require Sufficient Cohort Evidence
          </h3>

          <p style={methodologyText}>
            Twuanis requires at least 3 populated
            area cohorts before calculating an
            overall size relationship. Markets with
            fewer populated cohorts may still show
            their observed coordinates, but
            relationship statistics and statistical
            conclusions are withheld.
          </p>
        </div>
      </div>


      <div style={methodologyStep}>
        <div style={methodologyNumber}>
          4
        </div>

        <div>
          <h3 style={methodologyTitle}>
            Measure Ranked Association
          </h3>

          <p style={methodologyText}>
            When sufficient evidence exists,
            Spearman rank correlation (ρ) measures
            whether normalized Price / m² tends to
            increase or decrease as area increases.
            Because it operates on ranks, it
            evaluates the monotonic relationship
            across the observed cohort coordinates
            without requiring a linear relationship
            in the original units.
          </p>
        </div>
      </div>


      <div style={methodologyStep}>
        <div style={methodologyNumber}>
          5
        </div>

        <div>
          <h3 style={methodologyTitle}>
            Model the Proportional Relationship
          </h3>

          <p style={methodologyText}>
            Twuanis fits a log-log model to the
            observed cohort coordinates. The size
            coefficient (β) describes the modeled
            proportional relationship between area
            and normalized Price / m².
          </p>

          <div style={methodologyFormula}>
            ln(Price / m²) = α + β · ln(Area)
          </div>
        </div>
      </div>


      <div style={methodologyStep}>
        <div style={methodologyNumber}>
          6
        </div>

        <div>
          <h3 style={methodologyTitle}>
            Translate the Model into Market Meaning
          </h3>

          <p style={methodologyText}>
            The fitted coefficient is translated
            into the modeled percentage change in
            normalized Price / m² associated with
            a 10% increase in area. This provides a
            more intuitive interpretation of the
            proportional model.
          </p>

          <div style={methodologyFormula}>
            Modeled change = (1.10^β − 1) × 100%
          </div>
        </div>
      </div>


      <div style={methodologyStep}>
        <div style={methodologyNumber}>
          7
        </div>

        <div>
          <h3 style={methodologyTitle}>
            Evaluate Model Fit
          </h3>

          <p style={methodologyText}>
            R² measures how closely the fitted
            log-log relationship corresponds to
            the observed cohort coordinates. It
            describes model fit, not causation and
            not certainty that the same
            relationship will persist outside the
            selected market evidence.
          </p>
        </div>
      </div>


      <div style={methodologyBoundary}>
        <strong>
          Interpretation boundary:
        </strong>{' '}
        Size relationships describe associations
        within the selected market evidence.
        Property characteristics, location,
        condition, age, amenities, and other
        market factors may also contribute to
        observed Price / m² differences.
      </div>
    </div>
  )
}

export default function PriceMeterResults({
  filters,
  analysis
}: {
  filters:
    any

  analysis:
    any
}) {
  const transactionType:
    'sale' | 'rent' =
      filters.transaction_type ===
        'rent'
        ? 'rent'
        : 'sale'


  const intelligence =
    transactionType ===
      'sale'
      ? analysis.saleIntelligence
      : analysis.rentIntelligence

    const constructionSizeRelationship:
    SizeRelationship =
      intelligence
        .sizeRelationships
        .constructionArea


  const propertySizeRelationship:
    SizeRelationship =
      intelligence
        .sizeRelationships
        .propertyArea

  const constructionLandAnalysis:
    ConstructionLandAnalysis =
    intelligence
      .constructionToLand

  return (
    <section>
      <div style={presentationHeader}>
        <div>
          <h2 style={sectionTitle}>
            Market Price Distribution
          </h2>

          <p style={sectionDescription}>
            Price / m² statistics are shown
            separately by transaction type,
            property basis, and normalization
            basis.
          </p>
        </div>

        <div style={transactionBadge}>
          {transactionLabel(
            transactionType
          )}
        </div>
      </div>


      {cohortDefinitions.map(
        definition => {

          const distribution:
            Distribution =
              intelligence
                .distributions[
                  definition.key
                ]


          const confidence:
            Confidence =
              intelligence
                .confidenceBasedOnNumberOfProperties[
                  definition.key
                ]


          return (
            <CohortDistribution
              key={
                definition.key
              }
              distribution={
                distribution
              }
              confidence={
                confidence
              }
              definition={
                definition
              }
            />
          )
        }
      )}

      <div style={relationshipPresentation}>
        <div style={presentationHeader}>
          <div>
            <h2 style={sectionTitle}>
              Size Relationship Evidence
            </h2>

            <p style={sectionDescription}>
              Twuanis compares populated area
              cohorts using their median observed
              area and median normalized Price /
              m². These observed cohorts form the
              evidence used to evaluate how size
              relates to Price / m².
            </p>
          </div>
        </div>


        <SizeRelationshipEvidence
          title="Construction Area Relationship"
          description="How construction size relates to construction-normalized Price / m² for improved properties in this selected market."
          relationship={
            constructionSizeRelationship
          }
          areaLabel="Construction Area"
          ratioLabel="construction m²"
          transactionType={
            transactionType
          }
        />


        <SizeRelationshipEvidence
          title="Property Area Relationship"
          description="How property size relates to land-normalized Price / m² for improved properties in this selected market."
          relationship={
            propertySizeRelationship
          }
          areaLabel="Property Area"
          ratioLabel="land m²"
          transactionType={
            transactionType
          }
        />

        <div style={statisticsPresentation}>
          <div style={presentationHeader}>
            <div>
              <h2 style={sectionTitle}>
                Size Relationship Statistics
              </h2>

              <p style={sectionDescription}>
                When at least 3 area cohorts contain
                observations, Twuanis evaluates the
                overall relationship between area
                and normalized Price / m² using rank
                correlation and log-log regression.
              </p>
            </div>
          </div>


          <SizeRelationshipStatistics
            title="Construction Area Statistics"
            relationship={
              constructionSizeRelationship
            }
          />


          <SizeRelationshipStatistics
            title="Property Area Statistics"
            relationship={
              propertySizeRelationship
            }
          />
        </div>

        <div style={visualizationPresentation}>
          <div style={presentationHeader}>
            <div>
              <h2 style={sectionTitle}>
                Size Relationship Visualization
              </h2>

              <p style={sectionDescription}>
                These plots visualize the same
                observed cohort coordinates shown
                in the evidence tables above.
                Points represent observed evidence,
                not modeled or interpolated values.
              </p>
            </div>
          </div>


          <section style={visualizationSection}>
            <h3 style={cohortTitle}>
              Construction Area Relationship
            </h3>

            <p style={relationshipDescription}>
              Median observed construction area
              plotted against construction-normalized
              Price / m².
            </p>

            <PriceMeterSizeRelationshipChart
              coordinates={
                constructionSizeRelationship
                  .population
                  .coordinates
              }
              areaLabel="Construction Area"
              ratioLabel="construction m²"
              transactionType={
                transactionType
              }
            />
          </section>


          <section style={visualizationSection}>
            <h3 style={cohortTitle}>
              Property Area Relationship
            </h3>

            <p style={relationshipDescription}>
              Median observed property area plotted
              against land-normalized Price / m².
            </p>

            <PriceMeterSizeRelationshipChart
              coordinates={
                propertySizeRelationship
                  .population
                  .coordinates
              }
              areaLabel="Property Area"
              ratioLabel="land m²"
              transactionType={
                transactionType
              }
            />
          </section>
        </div>


        <div style={synthesisPresentation}>
          <div style={presentationHeader}>
            <div>
              <h2 style={sectionTitle}>
                Size Relationship Synthesis
              </h2>

              <p style={sectionDescription}>
                Twuanis combines the observed cohort
                evidence, evidence threshold,
                relationship statistics, and model
                fit into a bounded interpretation
                of what this selected market
                currently supports.
              </p>
            </div>
          </div>


          <SizeRelationshipSynthesis
            title="Construction Area Synthesis"
            relationship={
              constructionSizeRelationship
            }
            areaLabel="Construction Area"
            ratioLabel="construction m²"
          />


                    <SizeRelationshipSynthesis
            title="Property Area Synthesis"
            relationship={
              propertySizeRelationship
            }
            areaLabel="Property Area"
            ratioLabel="land m²"
          />
        </div>


        <div style={methodologyPresentation}>
          <div style={presentationHeader}>
            <div>
              <h2 style={sectionTitle}>
                Size Relationship Methodology
              </h2>

              <p style={sectionDescription}>
                How Twuanis transforms observed
                property evidence into the size
                relationship statistics,
                visualizations, and bounded
                interpretations presented above.
              </p>
            </div>
          </div>


          <SizeRelationshipMethodology />
        </div>


      </div>
      <div style={constructionLandPresentation}>
        <div style={presentationHeader}>
          <div>
            <h2 style={sectionTitle}>
              Construction-to-Land Intelligence
            </h2>

            <p style={sectionDescription}>
              Twuanis evaluates the numerical
              relationship between reported
              construction area and property area
              for improved properties, then
              compares Price / m² evidence across
              the observed Construction-to-Land
              distribution.
            </p>
          </div>
        </div>

        <ConstructionLandDistribution
          analysis={
            constructionLandAnalysis
          }
        />

        <ConstructionLandCohortEvidence
          analysis={
            constructionLandAnalysis
          }
        />


        <ConstructionLandAdjacentComparisons
          analysis={
            constructionLandAnalysis
          }
        />

        <div style={statisticsPresentation}>
          <div style={presentationHeader}>
            <div>
              <h2 style={sectionTitle}>
                Construction-to-Land Relationship Coordinates
              </h2>

              <p style={sectionDescription}>
                Populated Construction-to-Land cohorts
                provide the observed coordinates used to
                evaluate the relationship with each
                Price / m² normalization basis.
              </p>
            </div>
          </div>


          <ConstructionLandRelationshipCoordinates
            title="Land-Normalized Relationship Coordinates"
            description="Median Construction-to-Land Ratio plotted against median land-normalized Price / m² for each populated cohort."
            relationship={
              constructionLandAnalysis
                .relationships
                .landNormalized
            }
            normalizationUnitLabel="land m²"
            transactionType={
              transactionType
            }
          />

          <section style={relationshipSection}>
            <div style={relationshipHeader}>
              <div>
                <h3 style={cohortTitle}>
                  Land-Normalized Relationship Visualization
                </h3>

                <p style={relationshipDescription}>
                  Each point shows one populated
                  Construction-to-Land cohort using its
                  median observed ratio and median
                  land-normalized Price / m².
                </p>
              </div>
            </div>

            <section style={relationshipSection}>
          <div style={relationshipHeader}>
            <div>
              <h3 style={cohortTitle}>
                Construction-to-Land Distribution Visualization
              </h3>

              <p style={relationshipDescription}>
                The five structural Construction-to-Land
                cohorts show how eligible improved
                properties are distributed across the
                observed ratio ranges.
              </p>
            </div>
          </div>


          <PriceMeterConstructionLandDistributionChart
            cohorts={
              constructionLandAnalysis
                .statistics
                .cohorts
            }
          />
        </section>

            <PriceMeterConstructionLandRelationshipChart
              coordinates={
                constructionLandAnalysis
                  .relationships
                  .landNormalized
                  .coordinates
              }
              normalizationUnitLabel="land m²"
              transactionType={
                transactionType
              }
            />
          </section>

          <ConstructionLandRelationshipCoordinates
            title="Construction-Normalized Relationship Coordinates"
            description="Median Construction-to-Land Ratio plotted against median construction-normalized Price / m² for each populated cohort."
            relationship={
              constructionLandAnalysis
                .relationships
                .constructionNormalized
            }
            normalizationUnitLabel="construction m²"
            transactionType={
              transactionType
            }
          />
        </div>

        <div style={statisticsPresentation}>
          <div style={presentationHeader}>
            <div>
              <h2 style={sectionTitle}>
                Construction-to-Land Relationship Statistics
              </h2>

              <p style={sectionDescription}>
                Twuanis calculates Spearman rank
                correlation only when both the populated
                cohort threshold and represented-property
                threshold are satisfied.
              </p>
            </div>
          </div>

          <section style={relationshipSection}>
            <div style={relationshipHeader}>
              <div>
                <h3 style={cohortTitle}>
                  Construction-Normalized Relationship Visualization
                </h3>

                <p style={relationshipDescription}>
                  Each point shows one populated
                  Construction-to-Land cohort using its
                  median observed ratio and median
                  construction-normalized Price / m².
                </p>
              </div>
            </div>


            <PriceMeterConstructionLandRelationshipChart
              coordinates={
                constructionLandAnalysis
                  .relationships
                  .constructionNormalized
                  .coordinates
              }
              normalizationUnitLabel="construction m²"
              transactionType={
                transactionType
              }
            />
          </section>

          <ConstructionLandRelationshipStatistics
            title="Land-Normalized Relationship"
            relationship={
              constructionLandAnalysis
                .relationships
                .landNormalized
            }
            couplingDescription="Construction-to-Land Ratio is C / L and land-normalized Price / m² is P / L, so both measurements share Property Area (L)."
          />


          <ConstructionLandRelationshipStatistics
            title="Construction-Normalized Relationship"
            relationship={
              constructionLandAnalysis
                .relationships
                .constructionNormalized
            }
            couplingDescription="Construction-to-Land Ratio is C / L and construction-normalized Price / m² is P / C, so Construction Area (C) appears in both measurements."
          />
        </div>

      </div>
    </section>
  )
}


const presentationHeader = {
  display:
    'flex',

  justifyContent:
    'space-between',

  alignItems:
    'flex-start',

  gap:
    '1rem',

  marginBottom:
    '2rem',

  flexWrap:
    'wrap' as const
}


const sectionTitle = {
  color:
    '#ff3B00',

  fontSize:
    '2rem',

  margin:
    '0 0 .5rem'
}


const sectionDescription = {
  color:
    '#888',

  margin:
    0,

  maxWidth:
    '720px',

  lineHeight:
    1.6
}


const transactionBadge = {
  background:
    '#111',

  border:
    '1px solid #333',

  borderRadius:
    '999px',

  padding:
    '.6rem 1rem',

  fontSize:
    '.9rem',

  fontWeight:
    700
}


const cohortSection = {
  marginBottom:
    '3rem'
}


const cohortHeader = {
  display:
    'flex',

  justifyContent:
    'space-between',

  alignItems:
    'center',

  gap:
    '1rem',

  marginBottom:
    '1rem',

  flexWrap:
    'wrap' as const
}


const cohortTitle = {
  margin:
    0,

  fontSize:
    '1.5rem'
}


const identityLabel = {
  color:
    '#888',

  marginTop:
    '.35rem',

  fontSize:
    '.9rem'
}


const sampleBadge = {
  color:
    '#aaa',

  fontSize:
    '.9rem'
}


const cardGrid = {
  display:
    'grid',

  gridTemplateColumns:
    'repeat(auto-fit, minmax(260px, 1fr))',

  gap:
    '1rem'
}


const statCard = {
  background:
    '#111',

  border:
    '1px solid #222',

  borderRadius:
    '1rem',

  padding:
    '1.25rem'
}


const cardLabel = {
  color:
    '#888',

  margin:
    0,

  fontSize:
    '.85rem',

  lineHeight:
    1.4
}


const cardValue = {
  marginTop:
    '.65rem',

  fontSize:
    '1.35rem',

  fontWeight:
    700,

  lineHeight:
    1.35
}


const secondaryValue = {
  marginTop:
    '.6rem',

  color:
    '#888',

  fontSize:
    '.9rem',

  fontWeight:
    400,

  lineHeight:
    1.5
}


const internalRangeNote = {
  marginTop:
    '1rem',

  color:
    '#777',

  fontSize:
    '.85rem'
}


const emptyCard = {
  background:
    '#111',

  border:
    '1px solid #222',

  borderRadius:
    '1rem',

  padding:
    '1.25rem',

  color:
    '#888'
}

const constructionLandPresentation = {
  marginTop:
    '4rem',

  paddingTop:
    '3rem',

  borderTop:
    '1px solid #222'
}

const relationshipPresentation = {
  marginTop:
    '4rem',

  paddingTop:
    '3rem',

  borderTop:
    '1px solid #222'
}


const relationshipSection = {
  marginBottom:
    '3.5rem'
}


const relationshipHeader = {
  display:
    'flex',

  justifyContent:
    'space-between',

  alignItems:
    'flex-start',

  gap:
    '1rem',

  marginBottom:
    '1.25rem',

  flexWrap:
    'wrap' as const
}


const relationshipDescription = {
  color:
    '#888',

  margin:
    '.4rem 0 0',

  maxWidth:
    '720px',

  lineHeight:
    1.6
}


const relationshipEvidenceSummary = {
  display:
    'grid',

  gridTemplateColumns:
    'repeat(auto-fit, minmax(180px, 1fr))',

  gap:
    '1rem',

  marginBottom:
    '1.25rem'
}


const evidenceValue = {
  fontSize:
    '1.25rem',

  fontWeight:
    700,

  marginBottom:
    '.3rem'
}


const relationshipTableWrap = {
  overflowX:
    'auto' as const,

  border:
    '1px solid #222',

  borderRadius:
    '1rem',

  background:
    '#111'
}


const relationshipTable = {
  width:
    '100%',

  borderCollapse:
    'collapse' as const,

  minWidth:
    '720px'
}

const constructionLandTable = {
  width:
    '100%',

  borderCollapse:
    'collapse' as const,

  minWidth:
    '980px'
}


const adjacentComparisonTable = {
  width:
    '100%',

  borderCollapse:
    'collapse' as const,

  minWidth:
    '1180px'
}


const tableSecondary = {
  marginTop:
    '.35rem',

  color:
    '#777',

  fontSize:
    '.78rem',

  lineHeight:
    1.4
}

const relationshipTh = {
  textAlign:
    'left' as const,

  color:
    '#888',

  fontSize:
    '.8rem',

  fontWeight:
    600,

  padding:
    '1rem',

  borderBottom:
    '1px solid #222'
}


const relationshipTd = {
  padding:
    '1rem',

  borderBottom:
    '1px solid #1c1c1c',

  fontSize:
    '.9rem',

  verticalAlign:
    'top' as const
}


const evidenceGateNote = {
  marginTop:
    '1rem',

  padding:
    '1rem 1.25rem',

  background:
    '#111',

  border:
    '1px solid #222',

  borderRadius:
    '1rem',

  color:
    '#888',

  fontSize:
    '.9rem',

  lineHeight:
    1.6
}

const couplingBoundary = {
  marginTop:
    '1.25rem',

  padding:
    '1rem 1.25rem',

  background:
    '#111',

  border:
    '1px solid #333',

  borderRadius:
    '1rem',

  color:
    '#888',

  fontSize:
    '.88rem',

  lineHeight:
    1.7
}

const statisticsPresentation = {
  marginTop:
    '4rem',

  paddingTop:
    '3rem',

  borderTop:
    '1px solid #222'
}


const relationshipStatisticsSection = {
  marginBottom:
    '3.5rem'
}


const statisticsGrid = {
  display:
    'grid',

  gridTemplateColumns:
    'repeat(auto-fit, minmax(240px, 1fr))',

  gap:
    '1rem',

  marginTop:
    '1.25rem'
}


const statisticsUnavailable = {
  marginTop:
    '1rem',

  padding:
    '1.25rem',

  background:
    '#111',

  border:
    '1px solid #222',

  borderRadius:
    '1rem',

  color:
    '#888',

  fontSize:
    '.9rem',

  lineHeight:
    1.6
}

const visualizationPresentation = {
  marginTop:
    '4rem',

  paddingTop:
    '3rem',

  borderTop:
    '1px solid #222'
}


const visualizationSection = {
  marginBottom:
    '3.5rem'
}

const synthesisPresentation = {
  marginTop:
    '4rem',

  paddingTop:
    '3rem',

  borderTop:
    '1px solid #222'
}


const synthesisSection = {
  marginBottom:
    '3.5rem'
}


const synthesisCard = {
  marginTop:
    '1.25rem',

  padding:
    '1.5rem',

  background:
    '#111',

  border:
    '1px solid #222',

  borderRadius:
    '1rem'
}


const synthesisStatus = {
  display:
    'inline-block',

  marginBottom:
    '1.25rem',

  padding:
    '.45rem .75rem',

  background:
    '#181818',

  border:
    '1px solid #333',

  borderRadius:
    '999px',

  color:
    '#aaa',

  fontSize:
    '.8rem',

  fontWeight:
    700
}


const synthesisLead = {
  margin:
    '0 0 1.25rem',

  fontSize:
    '1.15rem',

  lineHeight:
    1.65
}


const synthesisText = {
  margin:
    '1rem 0 0',

  color:
    '#aaa',

  fontSize:
    '.95rem',

  lineHeight:
    1.7
}


const synthesisFacts = {
  display:
    'grid',

  gridTemplateColumns:
    'repeat(auto-fit, minmax(180px, 1fr))',

  gap:
    '1rem',

  margin:
    '1.5rem 0'
}


const synthesisFactValue = {
  marginBottom:
    '.35rem',

  fontSize:
    '1.2rem',

  fontWeight:
    700
}


const synthesisConclusion = {
  margin:
    '1.5rem 0 0',

  color:
    '#ff3b00',

  fontSize:
    '1rem',

  fontWeight:
    700,

  fontStyle:
    'italic' as const,

  lineHeight:
    1.6
}

const synthesisBoundary = {
  marginTop:
    '1.5rem',

  paddingTop:
    '1rem',

  borderTop:
    '1px solid #222',

  color:
    '#777',

  fontSize:
    '.85rem',

  lineHeight:
    1.6
}

const methodologyPresentation = {
  marginTop:
    '4rem',

  paddingTop:
    '3rem',

  borderTop:
    '1px solid #222'
}


const methodologyCard = {
  background:
    '#111',

  border:
    '1px solid #222',

  borderRadius:
    '1rem',

  padding:
    '1.5rem'
}


const methodologyStep = {
  display:
    'grid',

  gridTemplateColumns:
    '42px minmax(0, 1fr)',

  gap:
    '1rem',

  padding:
    '1.5rem 0',

  borderBottom:
    '1px solid #222'
}


const methodologyNumber = {
  display:
    'flex',

  alignItems:
    'center',

  justifyContent:
    'center',

  width:
    '36px',

  height:
    '36px',

  border:
    '1px solid #333',

  borderRadius:
    '50%',

  color:
    '#aaa',

  fontSize:
    '.85rem',

  fontWeight:
    700
}


const methodologyTitle = {
  margin:
    '0 0 .5rem',

  fontSize:
    '1.05rem'
}


const methodologyText = {
  margin:
    0,

  maxWidth:
    '780px',

  color:
    '#999',

  fontSize:
    '.92rem',

  lineHeight:
    1.7
}


const methodologyFormula = {
  display:
    'inline-block',

  marginTop:
    '1rem',

  padding:
    '.65rem .85rem',

  background:
    '#161616',

  border:
    '1px solid #222',

  borderRadius:
    '.5rem',

  color:
    '#ccc',

  fontSize:
    '.9rem',

  fontFamily:
    'monospace'
}


const methodologyBoundary = {
  marginTop:
    '1.5rem',

  padding:
    '1.25rem',

  background:
    '#161616',

  border:
    '1px solid #222',

  borderRadius:
    '.75rem',

  color:
    '#888',

  fontSize:
    '.88rem',

  lineHeight:
    1.7
}