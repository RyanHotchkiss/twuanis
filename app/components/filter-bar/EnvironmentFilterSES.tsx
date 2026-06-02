'use client'

type EnvironmentFilterSProps = {
  selectedEnvironment: string
  setSelectedEnvironment: (value: string) => void

  showEnvironmentOptions: boolean
  setShowEnvironmentOptions: (value: boolean) => void

  setShowUtilityOptions: (value: boolean) => void
}

export default function EnvironmentFilterS({
  selectedEnvironment,
  setSelectedEnvironment,

  showEnvironmentOptions,
  setShowEnvironmentOptions,

  setShowUtilityOptions

}: EnvironmentFilterSProps) {

  const environments = [
    'Urbano',
    'Frente al Río',
    'Frente a la Playa',
    'Vista a la Montaña',
    'Selva',
    'Rural',
    'Frente al Lago'
  ]

  return (

    <div>

      {/* HEADER */}
      <div style={{
        display:'flex',
        justifyContent:'space-between',
        alignItems:'center',
        marginBottom:'1rem'
      }}>

        <h2 style={sectionHeading}>
          Entorno
        </h2>

        <button
          onClick={() =>
            setShowEnvironmentOptions(
              !showEnvironmentOptions
            )
          }
          style={collapseButton}
        >
          {showEnvironmentOptions ? '−' : '+'}
        </button>

      </div>

      {/* COLLAPSED SUMMARY */}
      {!showEnvironmentOptions && (

        <div style={summaryCard}>

          <span>
            {selectedEnvironment || 'Ninguno Seleccionado'}
          </span>

          <button
            onClick={() => {

              setSelectedEnvironment('')
              setShowEnvironmentOptions(true)

            }}
            style={resetButton}
          >
            ✕
          </button>

        </div>

      )}

      {/* EXPANDED OPTIONS */}
      {showEnvironmentOptions && (

        <div style={pillWrap}>

          {environments.map((environment) => (

            <button
              type="button"
              key={environment}
              onClick={() => {

                  setSelectedEnvironment(environment)

                  setShowUtilityOptions(false)

                  setShowEnvironmentOptions(false)

              }}
              style={
                selectedEnvironment === environment
                  ? activePill
                  : pill
              }
            >
              {environment}
            </button>

          ))}

        </div>

      )}

    </div>

  )

}

const sectionHeading = {
  fontSize:'1rem',
  marginBottom:'1rem',
  color:'#D4AF37'
}

const collapseButton = {
  background:'#181818',
  border:'1px solid #333',
  color:'#fff',
  width:'2rem',
  height:'2rem',
  borderRadius:'999rem',
  cursor:'pointer'
}

const summaryCard = {
  display:'flex',
  justifyContent:'space-between',
  alignItems:'flex-start',
  background:'#111',
  border:'1px solid #222',
  borderRadius:'1rem',
  padding:'1rem'
}

const resetButton = {
  background:'transparent',
  border:'none',
  color:'#ff6666',
  cursor:'pointer',
  fontSize:'1rem'
}

const pillWrap = {
  display:'flex',
  flexWrap:'wrap' as const,
  gap:'.5rem'
}

const pill = {
  background:'#181818',
  border:'1px solid #D4AF37',
  color:'#fff',
  padding:'.85rem 1rem',
  borderRadius:'999rem',
  cursor:'pointer',
  transition:'all .2s ease'
}

const activePill = {
  ...pill,
  background:'#D4AF37',
  border:'1px solid #FFFFFF',
  color:'#000'
}