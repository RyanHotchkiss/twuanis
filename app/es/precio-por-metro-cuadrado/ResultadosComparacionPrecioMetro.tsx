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
    geography.term_name_es ||
    geography.term_name ||
    geography.slug_es ||
    geography.slug
  )
}


function characteristicLabel(
  characteristic:
    PriceMeterCharacteristicIdentity
) {
  return (
    characteristic.termNameEs ||
    characteristic.termName ||
    characteristic.slugEs ||
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
      ? 'Venta'
      : 'Alquiler'
}


function propertyBasisLabel(
  propertyBasis:
    'land_only' | 'improved_property'
) {
  return propertyBasis ===
    'land_only'
      ? 'Terreno sin construir'
      : 'Propiedad mejorada'
}


function normalizationBasisLabel(
  normalizationBasis:
    'land' | 'construction'
) {
  return normalizationBasis ===
    'land'
      ? 'Normalizado por terreno'
      : 'Normalizado por construcción'
}


function normalizationUnitLabel(
  normalizationBasis:
    'land' | 'construction'
) {
  return normalizationBasis ===
    'land'
      ? 'm² de terreno'
      : 'm² de construcción'
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
    return 'No disponible'
  }


  const formatted =
    new Intl.NumberFormat(
      'es-CR',
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
      ? `${formatted} / ${unit} / mes`
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
    return 'No disponible'
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
          label="Geografía"
          value={
            geographyLabel(
              definition.geography
            )
          }
        />

        <IdentityItem
          label="Tipo de propiedad"
          value={
            characteristicLabel(
              definition.propertyType
            )
          }
        />

        <IdentityItem
          label="Característica 1"
          value={
            characteristicLabel(
              definition.characteristics[0]
            )
          }
        />

        <IdentityItem
          label="Característica 2"
          value={
            characteristicLabel(
              definition.characteristics[1]
            )
          }
        />

      {definition.propertyAreaRange && (
        <IdentityItem
          label="Área de la propiedad"
          value={
            propertyAreaRangeLabel(
              definition.propertyAreaRange
            )
          }
        />
      )}

      {definition.constructionAreaRange && (
        <IdentityItem
          label="Área de construcción"
          value={
            constructionAreaRangeLabel(
              definition.constructionAreaRange
            )
          }
        />
      )}

      {definition.constructionLandCohortKey && (
        <IdentityItem
          label="Relación construcción-terreno"
          value={
            constructionLandCohortLabel(
              definition.constructionLandCohortKey
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
          label="Propiedades"
          value={
            String(
              distribution.sampleSize
            )
          }
        />

        <EvidenceCard
          label="Mediana del precio / m²"
          value={
            formatPricePerM2(
              distribution.median,
              transactionType,
              normalizationBasis
            )
          }
        />

        <EvidenceCard
          label="Percentil 25"
          value={
            formatPricePerM2(
              distribution.p25,
              transactionType,
              normalizationBasis
            )
          }
        />

        <EvidenceCard
          label="Percentil 75"
          value={
            formatPricePerM2(
              distribution.p75,
              transactionType,
              normalizationBasis
            )
          }
        />

        <EvidenceCard
          label="Confianza de Twuanis"
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
            ? `La Cohorte A tiene ${analysis.evidence.cohortA.sampleSize} propiedades elegibles`
            : null,

            !analysis.evidence.cohortB.sufficient
            ? `La Cohorte B tiene ${analysis.evidence.cohortB.sampleSize} propiedades elegibles`
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
            Datos insuficientes
            </h3>

            <p style={insufficientEvidenceText}>
            {insufficientCohorts.join(
                '. '
            )}
            . Se requiere un mínimo de{' '}
            {
                analysis
                .evidence
                .minimumSampleSize
            }{' '}
            propiedades elegibles en cada cohorte
            para calcular la diferencia observada
            entre las medianas de la Cohorte A y la
            Cohorte B.
            </p>
        </section>
        )
    }


  const referenceLabel =
    medianDifference
      .referenceCohort ===
        'A'
        ? 'Cohorte A'
        : 'Cohorte B'


  return (
    <section style={differenceSection}>
      <h3 style={cohortTitle}>
        Diferencia observada entre medianas
      </h3>


      <p style={differenceDescription}>
        Los valores siguientes comparan la mediana
        observada del precio / m² de la Cohorte A
        con la mediana observada del precio / m²
        de la Cohorte B. Describen la diferencia
        numérica entre las dos poblaciones
        seleccionadas y no atribuyen esa diferencia
        a ninguna característica individual.
      </p>


      <div style={evidenceGrid}>
        <EvidenceCard
          label="Mediana de la Cohorte A"
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
          label="Mediana de la Cohorte B"
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
          label="Diferencia entre medianas (A − B)"
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
          label={`Diferencia porcentual con respecto a ${referenceLabel}`}
          value={
            formatPercentage(
              medianDifference
                .percentageDifference
            )
          }
        />
      </div>

            <p style={synthesisSentence}>
        La Cohorte A tiene una mediana observada de{' '}
        {formatPricePerM2(
          medianDifference.cohortAMedian,
          analysis.transactionType,
          normalizationBasis
        )}
        , comparada con{' '}
        {formatPricePerM2(
          medianDifference.cohortBMedian,
          analysis.transactionType,
          normalizationBasis
        )}{' '}
        para la Cohorte B. La diferencia entre la
          mediana de la Cohorte A y la mediana de la
          Cohorte B (A − B) es{' '}
          {formatPricePerM2(
            medianDifference.absoluteDifference,
            analysis.transactionType,
            normalizationBasis
          )}
          , equivalente a{' '}
          {formatPercentage(
            medianDifference.percentageDifference
          )}{' '}
          con respecto a {referenceLabel}.
      </p>

      <div style={attributionBoundary}>
        Esta comparación reporta una diferencia
        observada entre dos poblaciones de
        propiedades seleccionadas explícitamente.
        No establece que la geografía, el tipo de
        propiedad, cualquiera de las características
        seleccionadas, el tamaño físico o la
        identidad de relación construcción-terreno
        haya causado la diferencia observada en el
        precio / m².
      </div>
    </section>
  )
}


export default function ResultadosComparacionPrecioMetro({
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
            Comparación de características por precio / m²
          </h2>

          <p style={sectionDescription}>
            Twuanis reporta las distribuciones
            observadas del precio / m² de dos
            poblaciones de propiedades definidas
            por el usuario y la diferencia numérica
            entre sus medianas.
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

          `Moneda analítica ${analyticalIdentity.analyticalCurrency}`
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
          label="Cohorte A"
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
          label="Cohorte B"
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