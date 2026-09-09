'use client'

import {
  useState
} from 'react'
import type {
  PriceMeterComparableBrowserAnalysisResponse,
  PriceMeterComparableBrowserConfigurationResponse,
  PriceMeterComparableBrowserDimension,
  PriceMeterComparableBrowserEvidence,
  PriceMeterComparableBrowserGeographyLevel,
  PriceMeterComparableBrowserLanguage,
  PriceMeterComparableBrowserNormalizationBasis,
  PriceMeterComparableBrowserPresentation
} from '@/lib/price-meter-comparable-browser-contract'

type Props = {
  listingId:
    string

  lang:
    PriceMeterComparableBrowserLanguage
}


const COPY = {
  en: {
    title:
      'Property Price / m² Position',

    description:
      'Define the comparable population used to position this property.',

    open:
      'Open Price / m² Intelligence',

    geography:
      'Comparison geography',

    normalization:
      'Normalization basis',

    base:
      'Base comparable cohort',

    optional:
      'Refine comparable population',

    propertyType:
      'Property type',

    propertyArea:
      'Property area range',

    constructionArea:
      'Construction area range',

    population:
      'Comparable population',

    subject:
      'Property Price / m²',

    median:
      'Comparable median',

    difference:
      'Difference from median',

    percentile:
      'Percentile position',

    calculate:
      'Calculate comparable position',

    loading:
      'Calculating…',

    loadingConfiguration:
      'Loading Price / m² Intelligence…',

    chooseGeography:
      'Choose a comparison geography.',

    chooseNormalization:
      'Choose a normalization basis.',

    noPeers:
      'No peer listings match the selected comparable population.',

    unavailable:
      'Price / m² comparable analysis is unavailable.',

    configurationUnavailable:
      'Price / m² configuration is unavailable.',

    authentication:
      'Sign in to use Price / m² Market Intelligence.',

    entitlement:
      'Price / m² Market Intelligence entitlement is required.',

    removed:
      'removed'
  },

  es: {
    title:
      'Posición del Precio / m² de la Propiedad',

    description:
      'Defina la población comparable utilizada para posicionar esta propiedad.',

    open:
      'Abrir Inteligencia de Precio / m²',

    geography:
      'Geografía de comparación',

    normalization:
      'Base de normalización',

    base:
      'Cohorte comparable base',

    optional:
      'Refinar población comparable',

    propertyType:
      'Tipo de propiedad',

    propertyArea:
      'Rango de área del terreno',

    constructionArea:
      'Rango de área de construcción',

    population:
      'Población comparable',

    subject:
      'Precio / m² de la propiedad',

    median:
      'Mediana comparable',

    difference:
      'Diferencia respecto a la mediana',

    percentile:
      'Posición percentil',

    calculate:
      'Calcular posición comparable',

    loading:
      'Calculando…',

    loadingConfiguration:
      'Cargando Inteligencia de Precio / m²…',

    chooseGeography:
      'Seleccione una geografía de comparación.',

    chooseNormalization:
      'Seleccione una base de normalización.',

    noPeers:
      'Ninguna propiedad comparable coincide con la población seleccionada.',

    unavailable:
      'El análisis comparable de Precio / m² no está disponible.',

    configurationUnavailable:
      'La configuración de Precio / m² no está disponible.',

    authentication:
      'Inicie sesión para usar Inteligencia de Mercado de Precio / m².',

    entitlement:
      'Se requiere acceso a Inteligencia de Mercado de Precio / m².',

    removed:
      'eliminadas'
  }
} as const


function formatNumber(
  value:
    number
): string {

  return new Intl.NumberFormat(
    'en-US',
    {
      maximumFractionDigits:
        2
    }
  ).format(
    value
  )
}


export default function PriceMeterComparableListing({
  listingId,
  lang
}: Props) {

  const copy =
    COPY[lang]


  const [
    presentation,
    setPresentation
  ] =
    useState<PriceMeterComparableBrowserPresentation | null>(
      null
    )

  const [
    geography,
    setGeography
  ] =
    useState<PriceMeterComparableBrowserGeographyLevel | null>(
      null
    )

  const [
    normalizationBasis,
    setNormalizationBasis
  ] =
    useState<PriceMeterComparableBrowserNormalizationBasis | null>(
      null
    )

  const [
    activeDimensions,
    setActiveDimensions
  ] =
    useState<PriceMeterComparableBrowserDimension[]>(
      []
    )

  const [
    evidence,
    setEvidence
  ] =
    useState<PriceMeterComparableBrowserEvidence | null>(
      null
    )

  const [
    configurationLoading,
    setConfigurationLoading
  ] =
    useState(
      false
    )

  const [
    analysisLoading,
    setAnalysisLoading
  ] =
    useState(
      false
    )

  const [
    opened,
    setOpened
  ] =
    useState(
      false
    )

  const [
    error,
    setError
  ] =
    useState<string | null>(
      null
    )


  async function loadConfiguration() {

    setOpened(
      true
    )

    setConfigurationLoading(
      true
    )

    setError(
      null
    )


    try {
      const result =
        await fetch(
          `/api/comparable?subjectListingId=${encodeURIComponent(
            listingId
          )}`,
          {
            method:
              'GET'
          }
        )


      if (
        result.status ===
          401
      ) {
        setError(
          copy.authentication
        )

        return
      }


      if (
        result.status ===
          403
      ) {
        setError(
          copy.entitlement
        )

        return
      }


      if (!result.ok) {
        throw new Error(
          copy.configurationUnavailable
        )
      }


      const data =
        await result.json() as
          PriceMeterComparableBrowserConfigurationResponse


      setPresentation(
        data.presentation
      )

      /*
       * Deliberately DO NOT choose geography or
       * Normalization Basis here.
       *
       * The server supplies legitimate choices.
       * The user selects the analytical question.
       */

      setGeography(
        null
      )

      setNormalizationBasis(
        null
      )

      setActiveDimensions(
        []
      )

      setEvidence(
        null
      )
    } catch {
      setError(
        copy.configurationUnavailable
      )
    } finally {
      setConfigurationLoading(
        false
      )
    }
  }


  async function execute({
    nextDimensions =
      activeDimensions,

    nextGeography =
      geography,

    nextNormalizationBasis =
      normalizationBasis
  }: {
    nextDimensions?:
      PriceMeterComparableBrowserDimension[]

    nextGeography?:
      PriceMeterComparableBrowserGeographyLevel | null

    nextNormalizationBasis?:
      PriceMeterComparableBrowserNormalizationBasis | null
  } = {}) {

    if (!nextGeography) {
      setError(
        copy.chooseGeography
      )

      return
    }


    if (!nextNormalizationBasis) {
      setError(
        copy.chooseNormalization
      )

      return
    }


    setAnalysisLoading(
      true
    )

    setError(
      null
    )


    try {
      const result =
        await fetch(
          '/api/comparable',
          {
            method:
              'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body:
              JSON.stringify({
                subjectListingId:
                  listingId,

                geographyLevel:
                  nextGeography,

                normalizationBasis:
                  nextNormalizationBasis,

                activeDimensions:
                  nextDimensions
              })
          }
        )


      if (
        result.status ===
          401
      ) {
        setEvidence(
          null
        )

        setError(
          copy.authentication
        )

        return
      }


      if (
        result.status ===
          403
      ) {
        setEvidence(
          null
        )

        setError(
          copy.entitlement
        )

        return
      }


      if (!result.ok) {
        throw new Error(
          copy.unavailable
        )
      }


      const data =
          await result.json() as
            PriceMeterComparableBrowserAnalysisResponse


      setPresentation(
        data.presentation
      )

      setEvidence(
        data.evidence
      )
    } catch {
      setEvidence(
        null
      )

      setError(
        copy.unavailable
      )
    } finally {
      setAnalysisLoading(
        false
      )
    }
  }


  function chooseGeography(
  level:
    PriceMeterComparableBrowserGeographyLevel
  ) {

    setGeography(
      level
    )

    setEvidence(
      null
    )

    setError(
      null
    )
  }


  function chooseNormalizationBasis(
    basis:
      PriceMeterComparableBrowserNormalizationBasis
  ) {

    setNormalizationBasis(
      basis
    )

    setEvidence(
      null
    )

    setError(
      null
    )
  }


  function toggleDimension(
    dimension:
      PriceMeterComparableBrowserDimension
  ) {

    const next =
      activeDimensions.includes(
        dimension
      )
        ? activeDimensions.filter(
            item =>
              item !==
                dimension
          )
        : [
            ...activeDimensions,
            dimension
          ]


    setActiveDimensions(
      next
    )

    setEvidence(
      null
    )

    setError(
      null
    )
  }


  if (!opened) {
    return (
      <section style={section}>
        <h2 style={title}>
          {copy.title}
        </h2>

        <p style={description}>
          {copy.description}
        </p>

        <button
          type="button"
          onClick={
            () =>
              void loadConfiguration()
          }
          style={primaryButton}
        >
          {copy.open}
        </button>
      </section>
    )
  }


  if (
    configurationLoading
  ) {
    return (
      <section style={section}>
        <h2 style={title}>
          {copy.title}
        </h2>

        <div style={message}>
          {copy.loadingConfiguration}
        </div>
      </section>
    )
  }


  if (!presentation) {
    return (
      <section style={section}>
        <h2 style={title}>
          {copy.title}
        </h2>

        {error && (
          <div style={message}>
            {error}
          </div>
        )}
      </section>
    )
  }


  return (
    <section style={section}>

      <h2 style={title}>
        {copy.title}
      </h2>

      <p style={description}>
        {copy.description}
      </p>


      <div style={controlBlock}>
        <div style={controlLabel}>
          {copy.geography}
        </div>

        <div style={buttonRow}>
          {presentation
            .geographyOptions
            .map(
              option => (
                <button
                  key={
                    option.level
                  }
                  type="button"
                  disabled={
                    analysisLoading
                  }
                  onClick={
                    () =>
                      chooseGeography(
                        option.level
                      )
                  }
                  style={
                    option.level ===
                      geography
                      ? selectedButton
                      : optionButton
                  }
                >
                  {
                    option.label[
                      lang
                    ]
                  }
                </button>
              )
            )}
        </div>
      </div>


      <div style={controlBlock}>
        <div style={controlLabel}>
          {copy.normalization}
        </div>

        <div style={buttonRow}>
          {presentation
            .normalizationOptions
            .map(
              option => (
                <button
                  key={
                    option.basis
                  }
                  type="button"
                  disabled={
                    analysisLoading
                  }
                  onClick={
                    () =>
                      chooseNormalizationBasis(
                        option.basis
                      )
                  }
                  style={
                    option.basis ===
                      normalizationBasis
                      ? selectedButton
                      : optionButton
                  }
                >
                  {
                    option.label[
                      lang
                    ]
                  }
                </button>
              )
            )}
        </div>
      </div>


      <div style={baseCard}>
        <div style={controlLabel}>
          {copy.base}
        </div>

        <EvidenceRow
          label={
            copy.propertyType
          }
          value={
            presentation
              .baseCohort
              .propertyType[
                lang
              ]
          }
        />

        <EvidenceRow
          label={
            copy.propertyArea
          }
          value={
            presentation
              .baseCohort
              .propertyAreaRange
          }
        />

        {presentation
          .baseCohort
          .constructionAreaRange &&
          (
            <EvidenceRow
              label={
                copy.constructionArea
              }
              value={
                presentation
                  .baseCohort
                  .constructionAreaRange
              }
            />
          )}
      </div>


      {presentation
        .optionalDimensions
        .length >
        0 && (
        <div style={controlBlock}>
          <div style={controlLabel}>
            {copy.optional}
          </div>

          <div style={dimensionGrid}>
            {presentation
              .optionalDimensions
              .map(
                item => {
                  const active =
                    activeDimensions.includes(
                      item.dimension
                    )

                  return (
                    <button
                      key={
                        item.dimension
                      }
                      type="button"
                      disabled={
                        analysisLoading
                      }
                      onClick={
                        () =>
                          toggleDimension(
                            item.dimension
                          )
                      }
                      style={
                        active
                          ? selectedDimension
                          : dimensionButton
                      }
                    >
                      <span style={dimensionLabel}>
                        {
                          item.label[
                            lang
                          ]
                        }
                      </span>

                      <span style={dimensionValue}>
                        {
                          item.value[
                            lang
                          ]
                        }
                      </span>
                    </button>
                  )
                }
              )}
          </div>
        </div>
      )}


      <button
        type="button"
        disabled={
          analysisLoading ||
          !geography ||
          !normalizationBasis
        }
        onClick={
          () =>
            void execute()
        }
        style={primaryButton}
      >
        {analysisLoading
          ? copy.loading
          : copy.calculate}
      </button>


      {error && (
        <div style={message}>
          {error}
        </div>
      )}


      {evidence?.status ===
        'no_peers' ? (
        <div style={message}>
          {copy.noPeers}
          {' '}
          {copy.population}: 0
        </div>
      ) : evidence?.status ===
          'ok' ? (
        <div style={resultsGrid}>

          <EvidenceCard
            label={
              copy.subject
            }
            value={
              formatNumber(
                evidence
                  .propertyPricePerM2
              )
            }
          />

          <EvidenceCard
            label={
              copy.population
            }
            value={
              evidence
                .comparisonPopulationCount
                .toLocaleString()
            }
          />

          <EvidenceCard
            label={
              copy.median
            }
            value={
              formatNumber(
                evidence
                  .distribution
                  .median
              )
            }
          />

          <EvidenceCard
            label={
              copy.difference
            }
            value={
              `${formatNumber(
                evidence
                  .medianPosition
                  .difference
              )} · ${formatNumber(
                evidence
                  .medianPosition
                  .percentDifference
              )}%`
            }
          />

          <EvidenceCard
            label={
              copy.percentile
            }
            value={
              `${formatNumber(
                evidence
                  .percentile
                  .position
              )}%`
            }
          />

        </div>
      ) : null}


      {evidence &&
        evidence
          .populationTrail
          .steps
          .length >
          0 && (
        <div style={trail}>
          {evidence
            .populationTrail
            .steps
            .map(
              step => (
                <div
                  key={
                    step.dimension
                  }
                  style={trailRow}
                >
                  <span>
                    {
                      presentation
                        .optionalDimensions
                        .find(
                          item =>
                            item.dimension ===
                              step.dimension
                        )
                        ?.label[
                          lang
                        ] ??
                      step.dimension
                    }
                  </span>

                  <span>
                    {step.beforeCount}
                    {' → '}
                    {step.afterCount}
                    {' · '}
                    {step.removedCount}
                    {' '}
                    {copy.removed}
                  </span>
                </div>
              )
            )}
        </div>
      )}

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


function EvidenceRow({
  label,
  value
}: {
  label:
    string

  value:
    string
}) {
  return (
    <div style={evidenceRow}>
      <span style={evidenceLabel}>
        {label}
      </span>

      <span>
        {value}
      </span>
    </div>
  )
}


const section = {
  marginTop:
    '3rem',
  borderTop:
    '1px solid #222',
  paddingTop:
    '2rem'
}

const title = {
  margin:
    0,
  color:
    '#ff3b00',
  fontSize:
    '2rem'
}

const description = {
  color:
    '#aaa',
  maxWidth:
    '760px',
  lineHeight:
    1.6,
  marginTop:
    '.75rem'
}

const controlBlock = {
  marginTop:
    '2rem'
}

const controlLabel = {
  color:
    '#aaa',
  fontSize:
    '.8rem',
  textTransform:
    'uppercase' as const,
  letterSpacing:
    '1px',
  marginBottom:
    '.75rem'
}

const buttonRow = {
  display:
    'flex',
  gap:
    '.65rem',
  flexWrap:
    'wrap' as const
}

const optionButton = {
  background:
    '#111',
  color:
    '#fff',
  border:
    '1px solid #333',
  borderRadius:
    '.65rem',
  padding:
    '.7rem 1rem',
  cursor:
    'pointer'
}

const selectedButton = {
  ...optionButton,
  border:
    '1px solid #ff3b00'
}

const primaryButton = {
  ...selectedButton,
  marginTop:
    '1.5rem',
  fontWeight:
    700
}

const baseCard = {
  marginTop:
    '2rem',
  padding:
    '1.25rem',
  background:
    '#0d0d0d',
  border:
    '1px solid #222',
  borderRadius:
    '1rem'
}

const dimensionGrid = {
  display:
    'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(180px, 1fr))',
  gap:
    '.75rem'
}

const dimensionButton = {
  ...optionButton,
  textAlign:
    'left' as const,
  display:
    'flex',
  flexDirection:
    'column' as const,
  gap:
    '.35rem'
}

const selectedDimension = {
  ...dimensionButton,
  border:
    '1px solid #ff3b00'
}

const dimensionLabel = {
  color:
    '#888',
  fontSize:
    '.75rem',
  textTransform:
    'uppercase' as const
}

const dimensionValue = {
  color:
    '#fff',
  fontWeight:
    700
}

const resultsGrid = {
  display:
    'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(180px, 1fr))',
  gap:
    '1rem',
  marginTop:
    '2rem'
}

const evidenceCard = {
  background:
    '#0d0d0d',
  border:
    '1px solid #222',
  borderRadius:
    '1rem',
  padding:
    '1.1rem'
}

const evidenceLabel = {
  color:
    '#888',
  fontSize:
    '.75rem',
  textTransform:
    'uppercase' as const,
  letterSpacing:
    '.5px'
}

const evidenceValue = {
  marginTop:
    '.5rem',
  color:
    '#fff',
  fontSize:
    '1.25rem',
  fontWeight:
    700
}

const evidenceRow = {
  display:
    'flex',
  justifyContent:
    'space-between',
  gap:
    '1rem',
  padding:
    '.5rem 0',
  borderBottom:
    '1px solid #1d1d1d'
}

const trail = {
  marginTop:
    '1.5rem',
  borderTop:
    '1px solid #222',
  paddingTop:
    '1rem'
}

const trailRow = {
  display:
    'flex',
  justifyContent:
    'space-between',
  gap:
    '1rem',
  color:
    '#aaa',
  fontSize:
    '.9rem',
  padding:
    '.4rem 0'
}

const message = {
  marginTop:
    '1.25rem',
  padding:
    '1rem',
  background:
    '#0d0d0d',
  border:
    '1px solid #222',
  borderRadius:
    '.75rem',
  color:
    '#aaa'
}