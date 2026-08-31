type Coordinate = {
  constructionToLandRatio:
    number

  normalizedPricePerM2:
    number

  observationCount:
    number
}


export default function PriceMeterConstructionLandRelationshipChart({
  coordinates,
  normalizationUnitLabel,
  transactionType
}: {
  coordinates:
    Coordinate[]

  normalizationUnitLabel:
    string

  transactionType:
    'sale' | 'rent'
}) {
  if (
    coordinates.length ===
    0
  ) {
    return (
      <div style={emptyState}>
        No populated Construction-to-Land cohort
        coordinates are available to visualize
        for this selected market.
      </div>
    )
  }


  const constructionToLandRatios =
    coordinates.map(
      coordinate =>
        coordinate
          .constructionToLandRatio
    )


  const normalizedPrices =
    coordinates.map(
      coordinate =>
        coordinate
          .normalizedPricePerM2
    )


  const minimumConstructionToLandRatio =
    Math.min(
      ...constructionToLandRatios
    )


  const maximumConstructionToLandRatio =
    Math.max(
      ...constructionToLandRatios
    )


  const minimumNormalizedPrice =
    Math.min(
      ...normalizedPrices
    )


  const maximumNormalizedPrice =
    Math.max(
      ...normalizedPrices
    )


  const constructionToLandRange =
    maximumConstructionToLandRatio -
    minimumConstructionToLandRatio


  const normalizedPriceRange =
    maximumNormalizedPrice -
    minimumNormalizedPrice


  const xPosition =
    (
      constructionToLandRatio:
        number
    ) =>
      constructionToLandRange ===
        0
        ? 50
        : 8 +
          (
            (
              constructionToLandRatio -
              minimumConstructionToLandRatio
            ) /
            constructionToLandRange
          ) *
          84


  const yPosition =
    (
      normalizedPrice:
        number
    ) =>
      normalizedPriceRange ===
        0
        ? 50
        : 8 +
          (
            (
              maximumNormalizedPrice -
              normalizedPrice
            ) /
            normalizedPriceRange
          ) *
          84


  const formatConstructionToLandRatio =
    (
      value:
        number
    ) =>
      `${new Intl.NumberFormat(
        'en-US',
        {
          maximumFractionDigits:
            3
        }
      ).format(
        value
      )} : 1`


  const formatConstructionPerLand =
    (
      value:
        number
    ) =>
      `${new Intl.NumberFormat(
        'en-US',
        {
          maximumFractionDigits:
            1
        }
      ).format(
        value * 100
      )} m² construction / 100 m² property`


  const formatPricePerM2 =
    (
      value:
        number
    ) => {

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


  return (
    <div style={chartShell}>
      <div style={chartYAxisLabel}>
        Price / {normalizationUnitLabel}
      </div>


      <div style={plot}>
        {coordinates.map(
          (
            coordinate,
            index
          ) => {

            const left =
              xPosition(
                coordinate
                  .constructionToLandRatio
              )


            const top =
              yPosition(
                coordinate
                  .normalizedPricePerM2
              )


            return (
              <div
                key={
                  `${coordinate.constructionToLandRatio}-${coordinate.normalizedPricePerM2}-${index}`
                }
                style={{
                  ...point,
                  left:
                    `${left}%`,
                  top:
                    `${top}%`
                }}
              >
                <div style={dot} />

                <div style={pointLabel}>
                  <strong>
                    {
                      formatConstructionToLandRatio(
                        coordinate
                          .constructionToLandRatio
                      )
                    }
                  </strong>

                  <span style={pointContext}>
                    {
                      formatConstructionPerLand(
                        coordinate
                          .constructionToLandRatio
                      )
                    }
                  </span>

                  <span style={pointCount}>
                    n = {
                      coordinate
                        .observationCount
                    }
                  </span>

                  <span style={pointPrice}>
                    {
                      formatPricePerM2(
                        coordinate
                          .normalizedPricePerM2
                      )
                    }
                  </span>
                </div>
              </div>
            )
          }
        )}
      </div>


      <div style={chartXAxisLabel}>
        Median Observed Construction-to-Land Ratio
      </div>


      <div style={legend}>
        Each point represents one populated
        Construction-to-Land cohort using its
        median observed ratio and median normalized
        Price / m². The displayed n is the number
        of properties represented by that cohort.
      </div>


      <div style={measurementBoundary}>
        Construction-to-Land Ratio is reported
        Construction Area divided by Property Area.
        It does not represent physical Site Coverage
        or building footprint.
      </div>
    </div>
  )
}


const chartShell = {
  position:
    'relative' as const,

  marginTop:
    '1.25rem',

  padding:
    '1.5rem 1.5rem 1.25rem 4.5rem',

  background:
    '#111',

  border:
    '1px solid #222',

  borderRadius:
    '1rem'
}


const plot = {
  position:
    'relative' as const,

  height:
    '360px',

  borderLeft:
    '1px solid #444',

  borderBottom:
    '1px solid #444',

  backgroundImage:
    'linear-gradient(#1c1c1c 1px, transparent 1px), linear-gradient(90deg, #1c1c1c 1px, transparent 1px)',

  backgroundSize:
    '25% 25%'
}


const point = {
  position:
    'absolute' as const,

  transform:
    'translate(-50%, -50%)',

  zIndex:
    2
}


const dot = {
  width:
    '12px',

  height:
    '12px',

  borderRadius:
    '50%',

  background:
    '#ff3B00',

  border:
    '2px solid #fff',

  boxSizing:
    'border-box' as const
}


const pointLabel = {
  position:
    'absolute' as const,

  top:
    '18px',

  left:
    '50%',

  transform:
    'translateX(-50%)',

  display:
    'grid',

  gap:
    '.12rem',

  minWidth:
    '220px',

  textAlign:
    'center' as const,

  fontSize:
    '.72rem',

  whiteSpace:
    'nowrap' as const
}


const pointContext = {
  color:
    '#777'
}


const pointCount = {
  color:
    '#999',

  fontWeight:
    700
}


const pointPrice = {
  color:
    '#888'
}


const chartXAxisLabel = {
  marginTop:
    '1rem',

  textAlign:
    'center' as const,

  color:
    '#888',

  fontSize:
    '.85rem'
}


const chartYAxisLabel = {
  position:
    'absolute' as const,

  left:
    '.65rem',

  top:
    '43%',

  transform:
    'translateY(-50%) rotate(-90deg)',

  color:
    '#888',

  fontSize:
    '.85rem',

  whiteSpace:
    'nowrap' as const
}


const legend = {
  marginTop:
    '1rem',

  paddingTop:
    '1rem',

  borderTop:
    '1px solid #222',

  color:
    '#777',

  fontSize:
    '.85rem',

  lineHeight:
    1.5
}


const measurementBoundary = {
  marginTop:
    '.75rem',

  color:
    '#666',

  fontSize:
    '.8rem',

  lineHeight:
    1.5
}


const emptyState = {
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
    '.9rem'
}