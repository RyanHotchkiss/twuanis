type Cohort = {
  definition: {
    key:
      string

    label:
      string
  }

  observationCount:
    number
}


export default function PrecioMetroDistribucionConstruccionTerrenoChart({
  cohorts
}: {
  cohorts:
    Cohort[]
}) {
  if (
    cohorts.length ===
    0
  ) {
    return (
      <div style={emptyState}>
        No hay cohortes estructurales de
        Construcción a Terreno disponibles para
        visualizar.
      </div>
    )
  }


  const maximumObservationCount =
    Math.max(
      ...cohorts.map(
        cohort =>
          cohort.observationCount
      )
    )


  const barHeight =
    (
      observationCount:
        number
    ) =>
      maximumObservationCount ===
        0
        ? 0
        : (
            observationCount /
            maximumObservationCount
          ) *
          100


  return (
    <div style={chartShell}>
      <div style={chartYAxisLabel}>
        Propiedades
      </div>


      <div style={plot}>
        {cohorts.map(
          cohort => (
            <div
              key={
                cohort.definition.key
              }
              style={cohortColumn}
            >
              <div style={countLabel}>
                n = {
                  cohort
                    .observationCount
                }
              </div>


              <div style={barTrack}>
                <div
                  style={{
                    ...bar,
                    height:
                      `${barHeight(
                        cohort
                          .observationCount
                      )}%`
                  }}
                />
              </div>


              <div style={cohortLabel}>
                {
                  cohort
                    .definition
                    .label
                }
              </div>
            </div>
          )
        )}
      </div>


      <div style={chartXAxisLabel}>
        Cohorte de la Relación de Construcción a Terreno
      </div>


      <div style={legend}>
        La altura de cada barra representa el
        número de propiedades elegibles asignadas
        a cada cohorte estructural de Construcción
        a Terreno. Las cinco cohortes estructurales
        permanecen visibles, incluidas las cohortes
        con n = 0.
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
  display:
    'grid',

  gridTemplateColumns:
    'repeat(5, minmax(100px, 1fr))',

  gap:
    '1rem',

  alignItems:
    'end',

  minHeight:
    '300px',

  padding:
    '1rem 0 0',

  borderLeft:
    '1px solid #444',

  borderBottom:
    '1px solid #444',

  backgroundImage:
    'linear-gradient(#1c1c1c 1px, transparent 1px)',

  backgroundSize:
    '100% 25%'
}


const cohortColumn = {
  display:
    'grid',

  gridTemplateRows:
    'auto 220px auto',

  gap:
    '.5rem',

  alignItems:
    'end',

  height:
    '100%',

  textAlign:
    'center' as const
}


const countLabel = {
  color:
    '#aaa',

  fontSize:
    '.8rem',

  fontWeight:
    700
}


const barTrack = {
  position:
    'relative' as const,

  height:
    '220px',

  display:
    'flex',

  alignItems:
    'flex-end',

  justifyContent:
    'center'
}


const bar = {
  width:
    '58%',

  minHeight:
    '0',

  background:
    '#ff3B00',

  borderRadius:
    '.35rem .35rem 0 0',

  transition:
    'height .2s ease'
}


const cohortLabel = {
  minHeight:
    '2.5rem',

  color:
    '#888',

  fontSize:
    '.78rem',

  lineHeight:
    1.35
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
    '42%',

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