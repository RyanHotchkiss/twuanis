import type {
  PriceMeterComparisonCohortDefinition
} from '@/lib/price-meter-comparison-cohort'

import type {
  PriceMeterCharacteristicIdentity
} from '@/lib/price-meter-characteristic-identity'

import type {
  CanonicalGeographyTerm
} from '@/lib/geography/canonical-geography'

import {
  PROPERTY_AREA_RANGE_OPTIONS,
  CONSTRUCTION_AREA_RANGE_OPTIONS
} from '@/lib/market-intelligence-area-ranges'

import {
  PRICE_METER_CONSTRUCTION_LAND_COHORTS
} from '@/lib/price-meter-construction-land-cohorts'

type Distribution = {
  sampleSize:
    number

  p25:
    number | null

  median:
    number | null

  p75:
    number | null
}


type Confidence = {
  score:
    number

  label:
    string
}


type ComparisonCohort = {
  population: {
    definition:
      PriceMeterComparisonCohortDefinition

    sampleSize:
      number
  }

  distribution:
    Distribution

  confidence:
    Confidence
}


type ComparisonAnalysis = {
  transactionType:
    'sale' | 'rent'

  cohortA:
    ComparisonCohort

  cohortB:
    ComparisonCohort

  evidence: {
    minimumSampleSize:
      number

    cohortA: {
      sampleSize:
        number

      sufficient:
        boolean
    }

    cohortB: {
      sampleSize:
        number

      sufficient:
        boolean
    }

    comparisonSufficient:
      boolean
  }

  medianDifference: {
    cohortAMedian:
      number | null

    cohortBMedian:
      number | null

    absoluteDifference:
      number | null

    percentageDifference:
      number | null

    referenceCohort:
      'A' | 'B'
  }
}


type PriceMeterComparisonResult = {
  analyticalIdentity: {
    transactionType:
      'sale' | 'rent'

    propertyBasis:
      'land_only' | 'improved_property'

    normalizationBasis:
      'land' | 'construction'

    analyticalCurrency:
      'CRC'

    analyticalDate:
      string
  }

  comparison:
    ComparisonAnalysis
}


function geographyLabel(
  geography:
    CanonicalGeographyTerm
) {
  return (
    geography.term_name_en ||
    geography.term_name ||
    geography.slug_en ||
    geography.slug
  )
}


function characteristicLabel(
  characteristic:
    PriceMeterCharacteristicIdentity
) {
  return (
    characteristic.termNameEn ||
    characteristic.termName ||
    characteristic.slugEn ||
    characteristic.slug
  )
}

function propertyAreaRangeLabel(
  value:
    string
) {
  return (
    PROPERTY_AREA_RANGE_OPTIONS.find(
      option =>
        option.value === value
    )?.label ??
    value
  )
}


function constructionAreaRangeLabel(
  value:
    string
) {
  return (
    CONSTRUCTION_AREA_RANGE_OPTIONS.find(
      option =>
        option.value === value
    )?.label ??
    value
  )
}


function constructionLandCohortLabel(
  key:
    string
) {
  return (
    PRICE_METER_CONSTRUCTION_LAND_COHORTS.find(
      cohort =>
        cohort.key === key
    )?.label ??
    key
  )
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


function propertyBasisLabel(
  propertyBasis:
    'land_only' | 'improved_property'
) {
  return propertyBasis ===
    'land_only'
      ? 'Vacant Land'
      : 'Improved Property'
}


function normalizationBasisLabel(
  normalizationBasis:
    'land' | 'construction'
) {
  return normalizationBasis ===
    'land'
      ? 'Land-normalized'
      : 'Construction-normalized'
}


function normalizationUnitLabel(
  normalizationBasis:
    'land' | 'construction'
) {
  return normalizationBasis ===
    'land'
      ? 'land m²'
      : 'construction m²'
}


function formatPricePerM2(
  value:
    number | null,

  transactionType:
    'sale' | 'rent',

  normalizationBasis:
    'land' | 'construction'
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


  const unit =
    normalizationUnitLabel(
      normalizationBasis
    )


  return transactionType ===
    'rent'
      ? `${formatted} / ${unit} / month`
      : `${formatted} / ${unit}`
}


function formatPercentage(
  value:
    number | null
) {
  if (
    value === null ||
    Number.isNaN(value)
  ) {
    return 'Not available'
  }


  const sign =
    value > 0
      ? '+'
      : ''


  return `${sign}${value.toFixed(
    2
  )}%`
}


function CohortIdentity({
  label,
  definition
}: {
  label:
    string

  definition:
    PriceMeterComparisonCohortDefinition
}) {
  return (
    <div style={identityCard}>
      <h3 style={cohortTitle}>
        {label}
      </h3>


      <div style={identityGrid}>
        <IdentityItem
          label="Geography"
          value={
            geographyLabel(
              definition.geography
            )
          }
        />

        <IdentityItem
          label="Property Type"
          value={
            characteristicLabel(
              definition.propertyType
            )
          }
        />

        <IdentityItem
          label="Characteristic 1"
          value={
            characteristicLabel(
              definition.characteristics[0]
            )
          }
        />

        <IdentityItem
          label="Characteristic 2"
          value={
            characteristicLabel(
              definition.characteristics[1]
            )
          }
        />

        {definition.propertyAreaRange && (
            <IdentityItem
              label="Property Area"
              value={
                propertyAreaRangeLabel(
                  definition.propertyAreaRange
                )
              }
            />
          )}

        {definition.constructionAreaRange && (
            <IdentityItem
              label="Construction Area"
              value={
                constructionAreaRangeLabel(
                  definition.constructionAreaRange
                )
              }
            />
          )}

        {definition.constructionLandCohortKey && (
            <IdentityItem
              label="Construction-to-Land"
              value={
                constructionLandCohortLabel(
                  definition
                    .constructionLandCohortKey
                )
              }
            />
          )}
      </div>
    </div>
  )
}


function IdentityItem({
  label,
  value
}: {
  label:
    string

  value:
    string
}) {
  return (
    <div>
      <div style={identityLabel}>
        {label}
      </div>

      <div style={identityValue}>
        {value}
      </div>
    </div>
  )
}


function CohortEvidence({
  label,
  cohort,
  transactionType,
  normalizationBasis
}: {
  label:
    string

  cohort:
    ComparisonCohort

  transactionType:
    'sale' | 'rent'

  normalizationBasis:
    'land' | 'construction'
}) {
  const {
    distribution
  } =
    cohort


  return (
    <section style={cohortSection}>
      <CohortIdentity
        label={label}
        definition={
          cohort
            .population
            .definition
        }
      />


      <div style={evidenceGrid}>
        <EvidenceCard
          label="Properties"
          value={
            String(
              distribution.sampleSize
            )
          }
        />

        <EvidenceCard
          label="Median Price / m²"
          value={
            formatPricePerM2(
              distribution.median,
              transactionType,
              normalizationBasis
            )
          }
        />

        <EvidenceCard
          label="25th Percentile"
          value={
            formatPricePerM2(
              distribution.p25,
              transactionType,
              normalizationBasis
            )
          }
        />

        <EvidenceCard
          label="75th Percentile"
          value={
            formatPricePerM2(
              distribution.p75,
              transactionType,
              normalizationBasis
            )
          }
        />

        <EvidenceCard
          label="Twuanis Confidence"
          value={
            `${cohort.confidence.label} · ${cohort.confidence.score}/100`
          }
        />

      </div>
    </section>
  )
}


function EvidenceCard({
  label,
  value
}: {
  label:
    string

  value:
    string
}) {
  return (
    <div style={evidenceCard}>
      <div style={evidenceLabel}>
        {label}
      </div>

      <div style={evidenceValue}>
        {value}
      </div>
    </div>
  )
}


function MedianDifferenceEvidence({
  analysis,
  normalizationBasis
}: {
  analysis:
    ComparisonAnalysis

  normalizationBasis:
    'land' | 'construction'
}) {
  const {
    medianDifference
  } =
    analysis


    if (
        !analysis
        .evidence
        .comparisonSufficient
    ) {
        const insufficientCohorts =
        [
            !analysis.evidence.cohortA.sufficient
            ? `Cohort A has ${analysis.evidence.cohortA.sampleSize} eligible properties`
            : null,

            !analysis.evidence.cohortB.sufficient
            ? `Cohort B has ${analysis.evidence.cohortB.sampleSize} eligible properties`
            : null
        ].filter(
            (
            value
            ): value is string =>
            value !== null
        )


        return (
        <section style={differenceSection}>
            <h3 style={cohortTitle}>
            Insufficient Data
            </h3>

            <p style={insufficientEvidenceText}>
            {insufficientCohorts.join(
                '. '
            )}
            . A minimum of{' '}
            {
                analysis
                .evidence
                .minimumSampleSize
            }{' '}
            eligible properties is required in each
            cohort to calculate the observed median
            difference between Cohort A and Cohort B.
            </p>
        </section>
        )
    }


  const referenceLabel =
    medianDifference
      .referenceCohort ===
        'A'
        ? 'Cohort A'
        : 'Cohort B'


  return (
    <section style={differenceSection}>
      <h3 style={cohortTitle}>
        Observed Median Difference
      </h3>


      <p style={differenceDescription}>
        The values below compare the observed
        median Price / m² of Cohort A with the
        observed median Price / m² of Cohort B.
        They describe the numerical difference
        between the two selected populations and
        do not attribute that difference to any
        individual characteristic.
      </p>


      <div style={evidenceGrid}>
        <EvidenceCard
          label="Cohort A Median"
          value={
            formatPricePerM2(
              medianDifference
                .cohortAMedian,
              analysis.transactionType,
              normalizationBasis
            )
          }
        />

        <EvidenceCard
          label="Cohort B Median"
          value={
            formatPricePerM2(
              medianDifference
                .cohortBMedian,
              analysis.transactionType,
              normalizationBasis
            )
          }
        />

        <EvidenceCard
          label="Median Difference (A − B)"
          value={
            formatPricePerM2(
              medianDifference
                .absoluteDifference,
              analysis.transactionType,
              normalizationBasis
            )
          }
        />

        <EvidenceCard
          label={`Percentage Difference Relative to ${referenceLabel}`}
          value={
            formatPercentage(
              medianDifference
                .percentageDifference
            )
          }
        />
      </div>

            <p style={synthesisSentence}>
        Cohort A has an observed median{' '}
        {formatPricePerM2(
          medianDifference.cohortAMedian,
          analysis.transactionType,
          normalizationBasis
        )}
        , compared with{' '}
        {formatPricePerM2(
          medianDifference.cohortBMedian,
          analysis.transactionType,
          normalizationBasis
        )}{' '}
        for Cohort B. The Cohort A minus Cohort B
          median difference is{' '}
          {formatPricePerM2(
            medianDifference.absoluteDifference,
            analysis.transactionType,
            normalizationBasis
          )}
          , equivalent to{' '}
          {formatPercentage(
            medianDifference.percentageDifference
          )}{' '}
          relative to {referenceLabel}.
      </p>

      <div style={attributionBoundary}>
        This comparison reports an observed
        difference between two explicitly selected
        property populations. It does not establish
        that geography, Property Type, either
        selected characteristic, physical size, or
        Construction-to-Land identity caused the
        observed difference in Price / m².
      </div>
    </section>
  )
}


export default function PriceMeterComparisonResults({
  analysis
}: {
  analysis:
    PriceMeterComparisonResult
}) {
  const {
    analyticalIdentity,
    comparison
  } =
    analysis


  return (
    <section>
      <div style={presentationHeader}>
        <div>
          <h2 style={sectionTitle}>
            Characteristic Price / m² Comparison
          </h2>

          <p style={sectionDescription}>
            Twuanis reports the observed Price / m²
            distributions of two user-defined
            property populations and the numerical
            difference between their medians.
          </p>
        </div>
      </div>


      <div style={analyticalIdentityStyle}>
        {[
          transactionLabel(
            analyticalIdentity
              .transactionType
          ),

          propertyBasisLabel(
            analyticalIdentity
              .propertyBasis
          ),

          normalizationBasisLabel(
            analyticalIdentity
              .normalizationBasis
          ),

          `Analytical currency ${analyticalIdentity.analyticalCurrency}`
        ].join(' · ')}
      </div>


      {!comparison.evidence.comparisonSufficient && (
        <MedianDifferenceEvidence
          analysis={
            comparison
          }
          normalizationBasis={
            analyticalIdentity
              .normalizationBasis
          }
        />
      )}


      <div style={cohortGrid}>
        <CohortEvidence
          label="Cohort A"
          cohort={
            comparison.cohortA
          }
          transactionType={
            analyticalIdentity
              .transactionType
          }
          normalizationBasis={
            analyticalIdentity
              .normalizationBasis
          }
        />

        <CohortEvidence
          label="Cohort B"
          cohort={
            comparison.cohortB
          }
          transactionType={
            analyticalIdentity
              .transactionType
          }
          normalizationBasis={
            analyticalIdentity
              .normalizationBasis
          }
        />
      </div>


      {comparison.evidence.comparisonSufficient && (
        <MedianDifferenceEvidence
          analysis={
            comparison
          }
          normalizationBasis={
            analyticalIdentity
              .normalizationBasis
          }
        />
      )}    
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
    '1rem',

  flexWrap:
    'wrap' as const
}


const sectionTitle = {
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
    '760px',

  lineHeight:
    1.6
}


const analyticalIdentityStyle = {
  marginBottom:
    '2rem',

  color:
    '#aaa',

  fontSize:
    '.9rem',

  fontWeight:
    600,

  lineHeight:
    1.5
}


const cohortGrid = {
  display:
    'grid',

  gridTemplateColumns:
    'repeat(auto-fit, minmax(320px, 1fr))',

  gap:
    '1.5rem'
}


const cohortSection = {
  minWidth:
    0
}


const identityCard = {
  background:
    '#111',

  border:
    '1px solid #222',

  borderRadius:
    '1rem',

  padding:
    '1.25rem',

  marginBottom:
    '1rem'
}


const cohortTitle = {
  margin:
    0,

  fontSize:
    '1.35rem'
}


const identityGrid = {
  display:
    'grid',

  gridTemplateColumns:
    'repeat(auto-fit, minmax(140px, 1fr))',

  gap:
    '1rem',

  marginTop:
    '1.25rem'
}


const identityLabel = {
  color:
    '#777',

  fontSize:
    '.8rem',

  marginBottom:
    '.3rem'
}


const identityValue = {
  fontSize:
    '.95rem',

  fontWeight:
    600,

  lineHeight:
    1.4
}


const evidenceGrid = {
  display:
    'grid',

  gridTemplateColumns:
    'repeat(auto-fit, minmax(180px, 1fr))',

  gap:
    '1rem'
}


const evidenceCard = {
  background:
    '#111',

  border:
    '1px solid #222',

  borderRadius:
    '1rem',

  padding:
    '1.25rem'
}


const evidenceLabel = {
  color:
    '#888',

  fontSize:
    '.82rem',

  lineHeight:
    1.4
}


const evidenceValue = {
  marginTop:
    '.6rem',

  fontSize:
    '1.15rem',

  fontWeight:
    700,

  lineHeight:
    1.4
}


const differenceSection = {
  marginTop:
    '4rem',

  paddingTop:
    '3rem',

  borderTop:
    '1px solid #222'
}


const differenceDescription = {
  color:
    '#888',

  margin:
    '.5rem 0 1.5rem',

  maxWidth:
    '760px',

  lineHeight:
    1.6
}


const attributionBoundary = {
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

const synthesisSentence = {
  margin:
    '1.5rem 0 0',

  color:
    '#ff3b00',

  fontStyle:
    'italic',

  fontWeight:
    700,

  lineHeight:
    1.7
}

const insufficientEvidenceText = {
  color:
    '#888',

  margin:
    '.5rem 0 0',

  maxWidth:
    '760px',

  lineHeight:
    1.7
}