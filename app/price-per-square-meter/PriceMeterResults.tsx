import PriceMeterSizeRelationshipChart
  from './PriceMeterSizeRelationshipChart'

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


function relationshipDirectionLabel(
  beta:
    number
) {
  if (
    beta < 0
  ) {
    return 'Negative'
  }

  if (
    beta > 0
  ) {
    return 'Positive'
  }

  return 'Neutral'
}


function relationshipStrengthLabel(
  spearmanRho:
    number
) {
  const magnitude =
    Math.abs(
      spearmanRho
    )

  if (
    magnitude >=
    0.8
  ) {
    return 'Very strong'
  }

  if (
    magnitude >=
    0.6
  ) {
    return 'Strong'
  }

  if (
    magnitude >=
    0.4
  ) {
    return 'Moderate'
  }

  if (
    magnitude >=
    0.2
  ) {
    return 'Weak'
  }

  return 'Very weak'
}


function modelFitLabel(
  rSquared:
    number
) {
  if (
    rSquared >=
    0.8
  ) {
    return 'Very high'
  }

  if (
    rSquared >=
    0.6
  ) {
    return 'High'
  }

  if (
    rSquared >=
    0.4
  ) {
    return 'Moderate'
  }

  if (
    rSquared >=
    0.2
  ) {
    return 'Low'
  }

  return 'Very low'
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
          description="Shows how closely the log-log model fits the observed cohort coordinates. Higher values indicate a closer fit."
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
          <div style={synthesisStatus}>
            Observed pattern · Insufficient evidence
          </div>

          <p style={synthesisText}>
            Twuanis currently observes{' '}
            <strong>
              {populatedBandCount}{' '}
              {
                populatedBandCount ===
                  1
                  ? 'populated cohort'
                  : 'populated cohorts'
              }
            </strong>{' '}
            across{' '}
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
              The observed cohort coordinates can
              be compared visually, but Twuanis
              does not treat that pattern as an
              established relationship because at
              least 3 populated cohorts are
              required.
            </p>
          )}


          {population.coordinates.length ===
            1 && (
            <p style={synthesisText}>
              A single populated cohort establishes
              an observed market coordinate, but it
              cannot establish how Price /{' '}
              {ratioLabel} changes as area changes.
            </p>
          )}


          {population.coordinates.length ===
            0 && (
            <p style={synthesisText}>
              No populated cohort coordinates are
              available from which to evaluate a
              size relationship.
            </p>
          )}


          <div style={synthesisBoundary}>
            Conclusion withheld until sufficient
            cohort evidence exists.
          </div>
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


  const directionLabel =
    relationshipDirectionLabel(
      beta
    )


  const strengthLabel =
    relationshipStrengthLabel(
      result.spearmanRho
    )


  const fitLabel =
    modelFitLabel(
      rSquared
    )


  return (
    <section style={synthesisSection}>
      <h3 style={cohortTitle}>
        {title}
      </h3>


      <div style={synthesisCard}>
        <div style={synthesisStatus}>
          Supported relationship · {directionLabel}
        </div>


        <p style={synthesisLead}>
          Across the observed {areaLabel.toLowerCase()}{' '}
          cohorts, normalized Price / {ratioLabel}{' '}
          <strong>
            {direction}
          </strong>{' '}
          as area increases.
        </p>


        <div style={synthesisFacts}>
          <div>
            <div style={synthesisFactValue}>
              {strengthLabel}
            </div>

            <div style={cardLabel}>
              Ranked relationship
            </div>
          </div>


          <div>
            <div style={synthesisFactValue}>
              {formatPercentChange(
                modeledTenPercentAreaChange
              )}
            </div>

            <div style={cardLabel}>
              Modeled change with +10% area
            </div>
          </div>


          <div>
            <div style={synthesisFactValue}>
              {fitLabel}
            </div>

            <div style={cardLabel}>
              Model fit
            </div>
          </div>
        </div>


        <p style={synthesisText}>
          Spearman rank correlation is{' '}
          <strong>
            {formatCorrelation(
              result.spearmanRho
            )}
          </strong>
          , indicating a {strengthLabel.toLowerCase()}{' '}
          ranked relationship across the populated
          cohorts.
        </p>


        <p style={synthesisText}>
          The log-log model estimates that a 10%
          increase in {areaLabel.toLowerCase()} is
          associated with a{' '}
          <strong>
            {formatPercentChange(
              modeledTenPercentAreaChange
            )}
          </strong>{' '}
          change in normalized Price / {ratioLabel}.
          Model fit is {fitLabel.toLowerCase()} with
          an R² of{' '}
          <strong>
            {formatRSquared(
              rSquared
            )}
          </strong>
          .
        </p>


        <div style={synthesisBoundary}>
          This synthesis describes the selected
          market evidence. It does not imply that
          area alone causes the observed Price /{' '}
          {ratioLabel} relationship.
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