import PrecioMetroRelacionTamanoChart
  from './PrecioMetroRelacionTamanoChart'
import PrecioMetroRelacionConstruccionTerrenoChart from './PrecioMetroRelacionConstruccionTerrenoChart'
import PrecioMetroDistribucionConstruccionTerrenoChart from './PrecioMetroDistribucionConstruccionTerrenoChart'
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
        'Terreno Vacante',

      normalizationBasisLabel:
        'Normalizado por Terreno',

      normalizationUnitLabel:
        'm² de terreno'
    },

    {
      key:
        'improvedLandNormalized',

      propertyBasisLabel:
        'Propiedad con Construcción',

      normalizationBasisLabel:
        'Normalizado por Terreno',

      normalizationUnitLabel:
        'm² de terreno'
    },

    {
      key:
        'improvedConstructionNormalized',

      propertyBasisLabel:
        'Propiedad con Construcción',

      normalizationBasisLabel:
        'Normalizado por Construcción',

      normalizationUnitLabel:
        'm² de construcción'
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


  return transactionType ===
    'rent'
      ? `${formatted} / ${normalizationUnitLabel} / mes`
      : `${formatted} / ${normalizationUnitLabel}`
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

function formatCorrelation(
  value:
    number | null
) {
  if (
    value === null ||
    Number.isNaN(value)
  ) {
    return 'No calculado'
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
    return 'No calculado'
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
    return 'No calculado'
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
    return 'No disponible'
  }


  return `${new Intl.NumberFormat(
    'es-CR',
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
    return 'No disponible'
  }


  return `${new Intl.NumberFormat(
    'es-CR',
    {
      maximumFractionDigits:
        1
    }
  ).format(
    value * 100
  )} m² de construcción por cada 100 m² de área de propiedad`
}

function relationshipDirection(
  beta:
    number
) {
  if (
    beta < 0
  ) {
    return 'disminuye'
  }

  if (
    beta > 0
  ) {
    return 'aumenta'
  }

  return 'permanece aproximadamente sin cambios'
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
            ? 'propiedad'
            : 'propiedades'}
        </div>
      </div>


      {distribution.sampleSize === 0 ? (
        <div style={emptyCard}>
          No hay observaciones disponibles para
          este grupo de mercado.
        </div>
      ) : (
        <>
          <div style={cardGrid}>
            <MarketStatisticCard
              label={`Mediana de Precio / ${definition.normalizationUnitLabel}`}
              value={
                format(
                  distribution.median
                )
              }
              description={identity}
            />


            <MarketStatisticCard
              label="Rango de Precios del 50% Central"
              value={
                `${format(
                  distribution.p25
                )} – ${format(
                  distribution.p75
                )}`
              }
              description={
                `El 50% de los precios de ${transaction.toLowerCase()} observados se encuentra entre los percentiles 25 y 75.`
              }
            />


            <MarketStatisticCard
              label="Percentil 10"
              value={
                format(
                  distribution.p10
                )
              }
              description={
                `${identity} · El 10% de los precios observados se encuentra por debajo de este Precio / ${definition.normalizationUnitLabel}.`
              }
            />


            <MarketStatisticCard
              label="Percentil 90"
              value={
                format(
                  distribution.p90
                )
              }
              description={
                `${identity} · El 10% de los precios observados se encuentra por encima de este Precio / ${definition.normalizationUnitLabel}.`
              }
            />


            <MarketStatisticCard
              label={`Precio Promedio / ${definition.normalizationUnitLabel}`}
              value={
                format(
                  distribution.average
                )
              }
              description={identity}
            />


            <MarketStatisticCard
              label="Confianza Basada en el Número de Propiedades"
              value={
                `${confidence.confidence.score}% · ${confidence.confidence.label}`
              }
              description={
                `Basado en ${confidence.numberOfProperties} ${
                  confidence.numberOfProperties === 1
                    ? 'propiedad'
                    : 'propiedades'
                } en este grupo de mercado exacto.`
              }
            />
          </div>


          <div style={internalRangeNote}>
            <strong>
              Rango interno observado:
            </strong>{' '}
            {format(
              distribution.minimum
            )}{' '}
            a{' '}
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
            Distribución de Construcción a Terreno
          </h3>

          <p style={relationshipDescription}>
            La Relación de Construcción a Terreno
            compara el área de construcción
            reportada con el área de la propiedad
            para propiedades con construcción en
            este mercado seleccionado.
          </p>
        </div>

        <div style={sampleBadge}>
          {distribution.sampleSize}{' '}
          {
            distribution.sampleSize === 1
              ? 'propiedad'
              : 'propiedades'
          }
        </div>
      </div>


      {distribution.sampleSize === 0 ? (
        <div style={emptyCard}>
          No hay observaciones elegibles de la
          Relación de Construcción a Terreno para
          este mercado seleccionado.
        </div>
      ) : (
        <>
          <div style={cardGrid}>
            <MarketStatisticCard
              label="Mediana de la Relación de Construcción a Terreno"
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
              label="Percentil 25"
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
              label="Percentil 75"
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
              label="Percentil 10"
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
              label="Percentil 90"
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
              label="Promedio de la Relación de Construcción a Terreno"
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
              Rango interno observado:
            </strong>{' '}
            {
              formatConstructionLandRatio(
                distribution.minimum
              )
            }{' '}
            a{' '}
            {
              formatConstructionLandRatio(
                distribution.maximum
              )
            }
          </div>


          <div style={evidenceGateNote}>
            <strong>
              Límite de medición:
            </strong>{' '}
            La Relación de Construcción a Terreno
            es el área de construcción reportada
            dividida entre el área de la propiedad.
            No representa la Cobertura Física del
            Terreno ni la huella del edificio.
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
            Cohortes de Construcción a Terreno
          </h3>

          <p style={relationshipDescription}>
            Cada propiedad con construcción
            elegible se asigna exactamente a una
            cohorte estructural de Construcción a
            Terreno. La evidencia de Precio / m²
            permanece separada para las mediciones
            normalizadas por terreno y por
            construcción.
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
              ? 'propiedad'
              : 'propiedades'
          }
        </div>
      </div>


      <div style={relationshipTableWrap}>
        <table style={constructionLandTable}>
          <thead>
            <tr>
              <th style={relationshipTh}>
                Cohorte de Construcción a Terreno
              </th>

              <th style={relationshipTh}>
                Propiedades
              </th>

              <th style={relationshipTh}>
                Mediana de la Relación Observada
              </th>

              <th style={relationshipTh}>
                Mediana de Precio / m² de terreno
              </th>

              <th style={relationshipTh}>
                Mediana de Precio / m² de construcción
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
                          : 'No disponible'
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
                              'm² de terreno'
                            )
                          : 'No disponible'
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
                              'm² de construcción'
                            )
                          : 'No disponible'
                      }
                    </td>
                  </tr>
                )
              )}
          </tbody>
        </table>
      </div>


      <div style={evidenceGateNote}>
        Las cinco cohortes estructurales permanecen
        visibles, incluidas las cohortes que
        contienen 0 propiedades. Las cohortes
        vacías no aportan coordenadas a los
        cálculos de relación.
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
          Diferencias entre Cohortes Consecutivas con Dato
        </h3>

        <div style={statisticsUnavailable}>
          No hay una comparación disponible entre
          cohortes consecutivas con datos para este
          mercado seleccionado.
        </div>
      </section>
    )
  }


  return (
    <section style={relationshipSection}>
      <div style={relationshipHeader}>
        <div>
          <h3 style={cohortTitle}>
            Diferencias entre Cohortes Consecutivas con Dato
          </h3>

          <p style={relationshipDescription}>
            Las cohortes consecutivas con datos de
            Construcción a Terreno se comparan
            utilizando sus medianas de Precio / m²
            normalizadas por terreno y por
            construcción. Las diferencias absolutas
            y porcentuales se muestran por separado.
          </p>
        </div>
      </div>


      <div style={relationshipTableWrap}>
        <table style={adjacentComparisonTable}>
          <thead>
            <tr>
              <th style={relationshipTh}>
                Comparación de Cohortes
              </th>

              <th style={relationshipTh}>
                Propiedades
              </th>

              <th style={relationshipTh}>
                Diferencia Normalizada por Terreno
              </th>

              <th style={relationshipTh}>
                Diferencia % Normalizada por Terreno
              </th>

              <th style={relationshipTh}>
                Diferencia Normalizada por Construcción
              </th>

              <th style={relationshipTh}>
                Diferencia % Normalizada por Construcción
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
                        'm² de terreno'
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
                        'm² de construcción'
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
        Las diferencias se calculan desde la
        cohorte con datos inferior hasta la
        siguiente cohorte con datos mostrada en la
        comparación. Un valor positivo significa
        que la cohorte superior tiene una mediana
        de Precio / m² mayor; un valor negativo
        significa que tiene una mediana de
        Precio / m² menor.
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
                ? 'propiedad'
                : 'propiedades'
          }
        </div>
      </div>


      <div style={relationshipTableWrap}>
        <table style={relationshipTable}>
          <thead>
            <tr>
              <th style={relationshipTh}>
                Mediana de Construcción a Terreno
              </th>

              <th style={relationshipTh}>
                Propiedades
              </th>

              <th style={relationshipTh}>
                Mediana de Precio / {normalizationUnitLabel}
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
          No hay coordenadas de cohortes con datos
          de Construcción a Terreno disponibles
          para esta relación.
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
          label="Cohortes con Datos"
          value={
            `${evidence.populatedCohortCount}`
          }
          description={
            `Se requieren ${evidence.requiredPopulatedCohortCount} cohortes con datos para Spearman ρ.`
          }
        />


        <MarketStatisticCard
          label="Propiedades Representadas"
          value={
            `${evidence.representedObservationCount}`
          }
          description={
            `Se requieren ${evidence.requiredObservationCount} propiedades representadas para Spearman ρ.`
          }
        />


        <MarketStatisticCard
          label="Correlación de Rangos de Spearman (ρ)"
          value={
            formatCorrelation(
              relationship
                .spearmanRho
            )
          }
          description={
            evidence.hasSufficientEvidence
              ? 'Calculada a partir de los rangos de las coordenadas de las cohortes con datos de Construcción a Terreno.'
              : 'No calculada porque no se cumple el umbral completo de evidencia.'
          }
        />
      </div>


      {!evidence.hasSufficientEvidence && (
        <div style={evidenceGateNote}>
          Este mercado seleccionado contiene{' '}
          <strong>
            {evidence.populatedCohortCount}
          </strong>{' '}
          {
            evidence.populatedCohortCount === 1
              ? 'cohorte con datos'
              : 'cohortes con datos'
          }{' '}
          de Construcción a Terreno que representan{' '}
          <strong>
            {evidence.representedObservationCount}
          </strong>{' '}
          {
            evidence.representedObservationCount === 1
              ? 'propiedad'
              : 'propiedades'
          }.
          {' '}Spearman ρ requiere al menos{' '}
          <strong>
            {evidence.requiredPopulatedCohortCount}
          </strong>{' '}
          cohortes con datos y{' '}
          <strong>
            {evidence.requiredObservationCount}
          </strong>{' '}
          propiedades representadas.
        </div>
      )}


      <div style={couplingBoundary}>
        <strong>
          Límite de acoplamiento matemático:
        </strong>{' '}
        {couplingDescription}
        {' '}Por lo tanto, Spearman ρ se presenta
        únicamente como una asociación descriptiva
        por rangos. Twuanis no calcula regresión
        log-log, cambio porcentual modelado ni R²
        para esta relación.
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
        return 'No disponible'
      }


      return `${new Intl.NumberFormat(
        'es-CR',
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
              ? 'propiedad'
              : 'propiedades'
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
            Cohortes de área con datos
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
            Propiedades representadas
          </div>
        </div>

        <div>
          <div style={evidenceValue}>
            {
              result.evidence
                .hasSufficientBandEvidence
                ? 'Suficiente'
                : 'Insuficiente'
            }
          </div>

          <div style={cardLabel}>
            Evidencia de la relación
          </div>
        </div>
      </div>


      <div style={relationshipTableWrap}>
        <table style={relationshipTable}>
          <thead>
            <tr>
              <th style={relationshipTh}>
                Cohorte de Área
              </th>

              <th style={relationshipTh}>
                Propiedades
              </th>

              <th style={relationshipTh}>
                Mediana Observada de {areaLabel}
              </th>

              <th style={relationshipTh}>
                Mediana de Precio / {ratioLabel}
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
          Este mercado seleccionado contiene{' '}
          {
            result.evidence
              .populatedBandCount
          }{' '}
          {
            result.evidence
              .populatedBandCount === 1
              ? 'cohorte'
              : 'cohortes'
          } de {areaLabel.toLowerCase()} con datos,
          que representan{' '}
          {
            result.evidence
              .representedObservationCount
          }{' '}
          {
            result.evidence
              .representedObservationCount === 1
              ? 'propiedad'
              : 'propiedades'
          }. Se requieren al menos 3 cohortes con
          datos antes de que Twuanis calcule la
          relación general con el tamaño.
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
          Las estadísticas de la relación no se
          calculan para este mercado seleccionado
          porque se requieren al menos 3 cohortes
          de área con datos. La evidencia
          disponible de las cohortes se muestra
          arriba.
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
          label="Correlación de Rangos de Spearman (ρ)"
          value={
            formatCorrelation(
              result.spearmanRho
            )
          }
          description="Mide si el Precio / m² tiende a aumentar o disminuir a medida que aumenta el área, según los rangos de las coordenadas observadas de las cohortes."
        />


        <MarketStatisticCard
          label="Coeficiente Log-Log de Tamaño (β)"
          value={
            formatCorrelation(
              beta
            )
          }
          description="Mide la relación proporcional modelada entre el área y el Precio / m² normalizado."
        />


        <MarketStatisticCard
          label="Cambio Modelado del Precio / m² con +10% de Área"
          value={
            formatPercentChange(
              modeledTenPercentAreaChange
            )
          }
          description="El cambio porcentual modelado en el Precio / m² normalizado asociado con un aumento del 10% en el área."
        />


        <MarketStatisticCard
          label="Ajuste del Modelo (R²)"
          value={
            formatRSquared(
              rSquared
            )
          }
         description="Reporta R² para el modelo log-log ajustado entre las coordenadas observadas de las cohortes."
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
            Este mercado seleccionado contiene{' '}
            <strong>
              {populatedBandCount}{' '}
              {
                populatedBandCount ===
                  1
                  ? 'cohorte con datos'
                  : 'cohortes con datos'
              }
            </strong>{' '}
            que representan{' '}
            <strong>
              {representedObservationCount}{' '}
              {
                representedObservationCount ===
                  1
                  ? 'propiedad'
                  : 'propiedades'
              }
            </strong>{' '}
            para {areaLabel.toLowerCase()}.
          </p>


          {population.coordinates.length >=
            2 && (
            <p style={synthesisText}>
              Las coordenadas disponibles de las
              cohortes pueden compararse numérica y
              visualmente, pero se requieren al
              menos 3 cohortes con datos antes de
              que Twuanis calcule la relación
              general.
            </p>
          )}


          {population.coordinates.length ===
            1 && (
            <p style={synthesisText}>
              Una cohorte con datos proporciona una
              coordenada de mercado observada. Se
              requieren al menos 3 cohortes con
              datos para calcular cómo cambia el
              Precio / {ratioLabel} normalizado a
              medida que cambia el área.
            </p>
          )}


          {population.coordinates.length ===
            0 && (
            <p style={synthesisText}>
              Hay 0 coordenadas de cohortes con
              datos disponibles para calcular la
              relación.
            </p>
          )}


          <p style={synthesisText}>
            Evidencia insuficiente entre cohortes
            para calcular la relación general entre{' '}
            {areaLabel.toLowerCase()} y el Precio /{' '}
            {ratioLabel}.
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
          Entre{' '}
          <strong>
            {populatedBandCount} cohortes con datos
          </strong>{' '}
          que representan{' '}
          <strong>
            {representedObservationCount}{' '}
            {
              representedObservationCount ===
                1
                ? 'propiedad'
                : 'propiedades'
            }
          </strong>
          , Spearman ρ es{' '}
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
              Cambio modelado del Precio / m² con +10% de área
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
          El modelo log-log estima que un aumento
          del 10% en {areaLabel.toLowerCase()} está
          asociado con un cambio de{' '}
          <strong>
            {formatPercentChange(
              modeledTenPercentAreaChange
            )}
          </strong>{' '}
          en el Precio / {ratioLabel} normalizado,
          con R² ={' '}
          <strong>
            {formatRSquared(
              rSquared
            )}
          </strong>
          .
        </p>


        <p style={synthesisConclusion}>
          A medida que aumenta{' '}
          {areaLabel.toLowerCase()}, el Precio /{' '}
          {ratioLabel} normalizado {direction} en
          este mercado seleccionado.
        </p>


        <div style={synthesisBoundary}>
          Esta síntesis describe una asociación
          dentro de la evidencia del mercado
          seleccionado. No implica que el área por
          sí sola cause la relación observada del
          Precio / {ratioLabel}.
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
            Construir Cohortes de Área
          </h3>

          <p style={methodologyText}>
            Twuanis agrupa propiedades comparables
            en cohortes de área predefinidas, por
            separado para el área de construcción
            y el área de la propiedad. Las cohortes
            vacías permanecen como parte de la
            estructura analítica, pero no aportan
            coordenadas al análisis de la relación.
          </p>
        </div>
      </div>


      <div style={methodologyStep}>
        <div style={methodologyNumber}>
          2
        </div>

        <div>
          <h3 style={methodologyTitle}>
            Crear Coordenadas Observadas de las Cohortes
          </h3>

          <p style={methodologyText}>
            Cada cohorte con datos aporta una
            coordenada observada. La coordenada
            horizontal es la mediana del área
            exacta de las propiedades de esa
            cohorte. La coordenada vertical es la
            mediana del Precio / m² normalizado
            para esas mismas observaciones.
          </p>
        </div>
      </div>


      <div style={methodologyStep}>
        <div style={methodologyNumber}>
          3
        </div>

        <div>
          <h3 style={methodologyTitle}>
            Exigir Evidencia Suficiente entre Cohortes
          </h3>

          <p style={methodologyText}>
            Twuanis requiere al menos 3 cohortes
            de área con datos antes de calcular
            una relación general con el tamaño.
            Los mercados con menos cohortes con
            datos aún pueden mostrar sus
            coordenadas observadas, pero las
            estadísticas de la relación y las
            conclusiones estadísticas se reservan.
          </p>
        </div>
      </div>


      <div style={methodologyStep}>
        <div style={methodologyNumber}>
          4
        </div>

        <div>
          <h3 style={methodologyTitle}>
            Medir la Asociación por Rangos
          </h3>

          <p style={methodologyText}>
            Cuando existe evidencia suficiente,
            la correlación de rangos de Spearman
            (ρ) mide si el Precio / m² normalizado
            tiende a aumentar o disminuir a medida
            que aumenta el área. Debido a que opera
            sobre rangos, evalúa la relación
            monotónica entre las coordenadas
            observadas de las cohortes sin requerir
            una relación lineal en las unidades
            originales.
          </p>
        </div>
      </div>


      <div style={methodologyStep}>
        <div style={methodologyNumber}>
          5
        </div>

        <div>
          <h3 style={methodologyTitle}>
            Modelar la Relación Proporcional
          </h3>

          <p style={methodologyText}>
            Twuanis ajusta un modelo log-log a las
            coordenadas observadas de las cohortes.
            El coeficiente de tamaño (β) describe
            la relación proporcional modelada entre
            el área y el Precio / m² normalizado.
          </p>

          <div style={methodologyFormula}>
            ln(Precio / m²) = α + β · ln(Área)
          </div>
        </div>
      </div>


      <div style={methodologyStep}>
        <div style={methodologyNumber}>
          6
        </div>

        <div>
          <h3 style={methodologyTitle}>
            Traducir el Modelo a Significado de Mercado
          </h3>

          <p style={methodologyText}>
            El coeficiente ajustado se traduce en
            el cambio porcentual modelado del
            Precio / m² normalizado asociado con
            un aumento del 10% en el área. Esto
            proporciona una interpretación más
            intuitiva del modelo proporcional.
          </p>

          <div style={methodologyFormula}>
            Cambio modelado = (1.10^β − 1) × 100%
          </div>
        </div>
      </div>


      <div style={methodologyStep}>
        <div style={methodologyNumber}>
          7
        </div>

        <div>
          <h3 style={methodologyTitle}>
            Evaluar el Ajuste del Modelo
          </h3>

          <p style={methodologyText}>
            R² mide qué tan estrechamente la
            relación log-log ajustada corresponde
            a las coordenadas observadas de las
            cohortes. Describe el ajuste del
            modelo, no causalidad ni certeza de
            que la misma relación persistirá fuera
            de la evidencia del mercado
            seleccionado.
          </p>
        </div>
      </div>


      <div style={methodologyBoundary}>
        <strong>
          Límite de interpretación:
        </strong>{' '}
        Las relaciones con el tamaño describen
        asociaciones dentro de la evidencia del
        mercado seleccionado. Las características
        de la propiedad, la ubicación, la
        condición, la antigüedad, las amenidades
        y otros factores del mercado también
        pueden contribuir a las diferencias
        observadas en el Precio / m².
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
            Distribución de Precios del Mercado
          </h2>

          <p style={sectionDescription}>
            Las estadísticas de Precio / m² se
            muestran por separado según el tipo
            de transacción, el tipo de propiedad
            y la base de normalización.
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
              Evidencia de la Relación con el Tamaño
            </h2>

            <p style={sectionDescription}>
              Twuanis compara cohortes de área con
              datos utilizando la mediana del área
              observada y la mediana del Precio /
              m² normalizado. Estas cohortes
              observadas constituyen la evidencia
              utilizada para evaluar cómo se
              relaciona el tamaño con el Precio /
              m².
            </p>
          </div>
        </div>


        <SizeRelationshipEvidence
          title="Relación con el Área de Construcción"
          description="Cómo se relaciona el tamaño de construcción con el Precio / m² normalizado por construcción para propiedades con construcción en este mercado seleccionado."
          relationship={
            constructionSizeRelationship
          }
          areaLabel="Área de Construcción"
          ratioLabel="m² de construcción"
          transactionType={
            transactionType
          }
        />


        <SizeRelationshipEvidence
          title="Relación con el Área de la Propiedad"
          description="Cómo se relaciona el tamaño de la propiedad con el Precio / m² normalizado por terreno para propiedades con construcción en este mercado seleccionado."
          relationship={
            propertySizeRelationship
          }
          areaLabel="Área de la Propiedad"
          ratioLabel="m² de terreno"
          transactionType={
            transactionType
          }
        />
      

        <div style={statisticsPresentation}>
          <div style={presentationHeader}>
            <div>
              <h2 style={sectionTitle}>
                Estadísticas de la Relación con el Tamaño
              </h2>

              <p style={sectionDescription}>
                Cuando al menos 3 cohortes de área
                contienen observaciones, Twuanis
                evalúa la relación general entre el
                área y el Precio / m² normalizado
                mediante correlación de rangos y
                regresión log-log.
              </p>
            </div>
          </div>


          <SizeRelationshipStatistics
            title="Estadísticas del Área de Construcción"
            relationship={
              constructionSizeRelationship
            }
          />


          <SizeRelationshipStatistics
            title="Estadísticas del Área de la Propiedad"
            relationship={
              propertySizeRelationship
            }
          />
        </div>

              <div style={visualizationPresentation}>
          <div style={presentationHeader}>
            <div>
              <h2 style={sectionTitle}>
                Visualización de la Relación con el Tamaño
              </h2>

              <p style={sectionDescription}>
                Estos gráficos visualizan las
                mismas coordenadas observadas de
                las cohortes que se muestran en
                las tablas de evidencia anteriores.
                Los puntos representan evidencia
                observada, no valores modelados ni
                interpolados.
              </p>
            </div>
          </div>


          <section style={visualizationSection}>
            <h3 style={cohortTitle}>
              Relación con el Área de Construcción
            </h3>

            <p style={relationshipDescription}>
              Mediana observada del área de
              construcción representada frente al
              Precio / m² normalizado por
              construcción.
            </p>

            <PrecioMetroRelacionTamanoChart
              coordinates={
                constructionSizeRelationship
                  .population
                  .coordinates
              }
              areaLabel="Área de Construcción"
              ratioLabel="m² de construcción"
              transactionType={
                transactionType
              }
            />
          </section>


          <section style={visualizationSection}>
            <h3 style={cohortTitle}>
              Relación con el Área de la Propiedad
            </h3>

            <p style={relationshipDescription}>
              Mediana observada del área de la
              propiedad representada frente al
              Precio / m² normalizado por terreno.
            </p>

            <PrecioMetroRelacionTamanoChart
              coordinates={
                propertySizeRelationship
                  .population
                  .coordinates
              }
              areaLabel="Área de la Propiedad"
              ratioLabel="m² de terreno"
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
                Síntesis de la Relación con el Tamaño
              </h2>

              <p style={sectionDescription}>
                Twuanis combina la evidencia
                observada de las cohortes, el
                umbral de evidencia, las
                estadísticas de la relación y el
                ajuste del modelo en una
                interpretación delimitada de lo
                que este mercado seleccionado
                respalda actualmente.
              </p>
            </div>
          </div>


          <SizeRelationshipSynthesis
            title="Síntesis del Área de Construcción"
            relationship={
              constructionSizeRelationship
            }
            areaLabel="Área de Construcción"
            ratioLabel="m² de construcción"
          />


                    <SizeRelationshipSynthesis
            title="Síntesis del Área de la Propiedad"
            relationship={
              propertySizeRelationship
            }
            areaLabel="Área de la Propiedad"
            ratioLabel="m² de terreno"
          />
        </div>


        <div style={methodologyPresentation}>
          <div style={presentationHeader}>
            <div>
              <h2 style={sectionTitle}>
                Metodología de la Relación con el Tamaño
              </h2>

              <p style={sectionDescription}>
                Cómo Twuanis transforma la
                evidencia observada de las
                propiedades en las estadísticas,
                visualizaciones e interpretaciones
                delimitadas de la relación con el
                tamaño presentadas anteriormente.
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
              Inteligencia de Construcción a Terreno
            </h2>

            <p style={sectionDescription}>
              Twuanis evalúa la relación numérica
              entre el área de construcción
              reportada y el área de la propiedad
              para propiedades con construcción,
              y luego compara la evidencia de
              Precio / m² a través de la
              distribución observada de
              Construcción a Terreno.
            </p>
          </div>
        </div>


        <ConstructionLandDistribution
                  analysis={
                    constructionLandAnalysis
                  }
                />

        <section style={relationshipSection}>
          <div style={relationshipHeader}>
            <div>
              <h3 style={cohortTitle}>
                Visualización de la Distribución de Construcción a Terreno
              </h3>

              <p style={relationshipDescription}>
                Las cinco cohortes estructurales de
                Construcción a Terreno muestran cómo se
                distribuyen las propiedades con
                construcción elegibles entre los rangos
                observados de la relación.
              </p>
            </div>
          </div>


          <PrecioMetroDistribucionConstruccionTerrenoChart
            cohorts={
              constructionLandAnalysis
                .statistics
                .cohorts
            }
          />
        </section>

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
                Coordenadas de la Relación de Construcción a Terreno
              </h2>

              <p style={sectionDescription}>
                Las cohortes con datos de Construcción a
                Terreno proporcionan las coordenadas
                observadas utilizadas para evaluar la
                relación con cada base de normalización
                del Precio / m².
              </p>
            </div>
          </div>


          <ConstructionLandRelationshipCoordinates
            title="Coordenadas de la Relación Normalizada por Terreno"
            description="Mediana de la Relación de Construcción a Terreno frente a la mediana del Precio / m² normalizado por terreno para cada cohorte con datos."
            relationship={
              constructionLandAnalysis
                .relationships
                .landNormalized
            }
            normalizationUnitLabel="m² de terreno"
            transactionType={
              transactionType
            }
          />

          <ConstructionLandRelationshipCoordinates
            title="Coordenadas de la Relación Normalizada por Construcción"
            description="Mediana de la Relación de Construcción a Terreno frente a la mediana del Precio / m² normalizado por construcción para cada cohorte con datos."
            relationship={
              constructionLandAnalysis
                .relationships
                .constructionNormalized
            }
            normalizationUnitLabel="m² de construcción"
            transactionType={
              transactionType
            }
          />

            <section style={relationshipSection}>
              <div style={relationshipHeader}>
                <div>
                  <h3 style={cohortTitle}>
                    Visualización de la Relación Normalizada por Terreno
                  </h3>

                  <p style={relationshipDescription}>
                    Cada punto muestra una cohorte con datos
                    de Construcción a Terreno utilizando su
                    mediana de relación observada y su mediana
                    de Precio / m² normalizado por terreno.
                  </p>
                </div>
              </div>


              <PrecioMetroRelacionConstruccionTerrenoChart
                coordinates={
                  constructionLandAnalysis
                    .relationships
                    .landNormalized
                    .coordinates
                }
                normalizationUnitLabel="m² de terreno"
                transactionType={
                  transactionType
                }
              />
            </section>

        </div>

        <div style={statisticsPresentation}>
          <div style={presentationHeader}>
            <div>
              <h2 style={sectionTitle}>
                Estadísticas de la Relación de Construcción a Terreno
              </h2>

              <p style={sectionDescription}>
                Twuanis calcula la correlación de rangos
                de Spearman únicamente cuando se cumplen
                tanto el umbral de cohortes con datos como
                el umbral de propiedades representadas.
              </p>
            </div>
          </div>

          <section style={relationshipSection}>
            <div style={relationshipHeader}>
              <div>
                <h3 style={cohortTitle}>
                  Visualización de la Relación Normalizada por Construcción
                </h3>

                <p style={relationshipDescription}>
                  Cada punto muestra una cohorte con datos
                  de Construcción a Terreno utilizando su
                  mediana de relación observada y su mediana
                  de Precio / m² normalizado por construcción.
                </p>
              </div>
            </div>


            <PrecioMetroRelacionConstruccionTerrenoChart
              coordinates={
                constructionLandAnalysis
                  .relationships
                  .constructionNormalized
                  .coordinates
              }
              normalizationUnitLabel="m² de construcción"
              transactionType={
                transactionType
              }
            />
          </section>

          <ConstructionLandRelationshipStatistics
            title="Relación Normalizada por Terreno"
            relationship={
              constructionLandAnalysis
                .relationships
                .landNormalized
            }
            couplingDescription="La Relación de Construcción a Terreno es C / L y el Precio / m² normalizado por terreno es P / L, por lo que ambas mediciones comparten el Área de la Propiedad (L)."
          />


          <ConstructionLandRelationshipStatistics
            title="Relación Normalizada por Construcción"
            relationship={
              constructionLandAnalysis
                .relationships
                .constructionNormalized
            }
            couplingDescription="La Relación de Construcción a Terreno es C / L y el Precio / m² normalizado por construcción es P / C, por lo que el Área de Construcción (C) aparece en ambas mediciones."
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