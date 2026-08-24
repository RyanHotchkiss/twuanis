type Coordinate = {
  area:
    number

  ratio:
    number
}


export default function PrecioMetroRelacionTamanoChart({
  coordinates,
  areaLabel,
  ratioLabel,
  transactionType
}: {
  coordinates:
    Coordinate[]

  areaLabel:
    string

  ratioLabel:
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
        No hay cohortes de área con datos
        disponibles para visualizar en este
        mercado seleccionado.
      </div>
    )
  }


  const areas =
    coordinates.map(
      coordinate =>
        coordinate.area
    )


  const ratios =
    coordinates.map(
      coordinate =>
        coordinate.ratio
    )


  const minimumArea =
    Math.min(
      ...areas
    )

  const maximumArea =
    Math.max(
      ...areas
    )

  const minimumRatio =
    Math.min(
      ...ratios
    )

  const maximumRatio =
    Math.max(
      ...ratios
    )


  const areaRange =
    maximumArea -
    minimumArea


  const ratioRange =
    maximumRatio -
    minimumRatio


  const xPosition =
    (
      area:
        number
    ) =>
      areaRange ===
        0
        ? 50
        : 8 +
          (
            (
              area -
              minimumArea
            ) /
            areaRange
          ) *
          84


  const yPosition =
    (
      ratio:
        number
    ) =>
      ratioRange ===
        0
        ? 50
        : 8 +
          (
            (
              maximumRatio -
              ratio
            ) /
            ratioRange
          ) *
          84


  const formatArea =
    (
      value:
        number
    ) =>
      `${new Intl.NumberFormat(
        'es-CR',
        {
          maximumFractionDigits:
            2
        }
      ).format(
        value
      )} m²`


  const formatRatio =
    (
      value:
        number
    ) => {

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
          ? `${formatted} / ${ratioLabel} / mes`
          : `${formatted} / ${ratioLabel}`
    }


  return (
    <div style={chartShell}>
      <div style={chartYAxisLabel}>
        Precio / {ratioLabel}
      </div>


      <div style={plot}>
        {coordinates.map(
          (
            coordinate,
            index
          ) => {

            const left =
              xPosition(
                coordinate.area
              )


            const top =
              yPosition(
                coordinate.ratio
              )


            return (
              <div
                key={
                  `${coordinate.area}-${coordinate.ratio}-${index}`
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
                    {formatArea(
                      coordinate.area
                    )}
                  </strong>

                  <span style={pointRatio}>
                    {formatRatio(
                      coordinate.ratio
                    )}
                  </span>
                </div>
              </div>
            )
          }
        )}
      </div>


      <div style={chartXAxisLabel}>
        Mediana Observada de {areaLabel}
      </div>


      <div style={legend}>
        Cada punto representa una cohorte de área
        con datos utilizando su mediana de área
        observada y su mediana de Precio / m²
        normalizado.
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
    '320px',

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
    '.15rem',

  minWidth:
    '180px',

  textAlign:
    'center' as const,

  fontSize:
    '.75rem',

  whiteSpace:
    'nowrap' as const
}


const pointRatio = {
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
    '45%',

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