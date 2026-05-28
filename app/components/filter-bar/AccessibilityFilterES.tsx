'use client'

type AccessibilityFilterProps = {
  selectedaccessibility: string
  setSelectedaccessibility: (value: string) => void

  showaccessibilityOptions: boolean
  setShowaccessibilityOptions: (value: boolean) => void

  setShowenvironmentOptions: (value: boolean) => void

  setShowTerrainOptions: (value: boolean) => void

  setShowProvinceOptions: (value: boolean) => void

  setShowCantonOptions: (value: boolean) => void

  setShowDistrictOptions: (value: boolean) => void
}

export default function AccessibilityFilter({
  selectedaccessibility,
  setSelectedaccessibility,

  showaccessibilityOptions,
  setShowaccessibilityOptions,

  setShowProvinceOptions,
  setShowCantonOptions,
  setShowDistrictOptions,

  setShowenvironmentOptions,
  setShowTerrainOptions
  }: AccessibilityFilterProps) 
{

  const accessibilityOptions = [
    'Accesible en 2WD',
    'Carretera Pavimentada',
    'Requiere 4x4',
    'Caminable',
    'Acceso Solo por Bote'
  ]

  return (

    <div>

      <h3 style={filterHeading}>
        ACCESIBILIDAD
      </h3>

      {showaccessibilityOptions && (

        <div style={pillWrap}>

          {accessibilityOptions.map((option) => (

            <button
              key={option}
              onClick={() => {

                setSelectedaccessibility(option)

                setShowProvinceOptions(false)

                setShowCantonOptions(false)

                setShowDistrictOptions(false)

                setShowenvironmentOptions(false)

                setShowaccessibilityOptions(false)

              }}
              style={
                selectedaccessibility === option
                  ? activePill
                  : pill
              }
            >
              {option}
            </button>

          ))}

        </div>

      )}

      {!showaccessibilityOptions &&
      selectedaccessibility && (

        <div style={summaryCard}>

          <span
            onClick={() =>
              setShowaccessibilityOptions(true)
            }
            style={{
              ...breadcrumbText,
              cursor:'pointer'
            }}
          >
            {selectedaccessibility}
          </span>

          <button
            type="button"
            onClick={() => {

              setSelectedaccessibility('')

              setShowaccessibilityOptions(true)

            }}
            style={resetButton}
          >
            ✕
          </button>

        </div>

      )}

    </div>

  )

}

const filterHeading = {
  fontSize:'1rem',
  marginBottom:'1rem',
  color:'#ff3b00'
}

const pillWrap = {
  display:'flex',
  flexWrap:'wrap' as const,
  gap:'.5rem'
}

const pill = {
  background:'#181818',
  border:'1px solid #2a2a2a',
  color:'#fff',
  padding:'.85rem 1rem',
  borderRadius:'999rem',
  cursor:'pointer',
  transition:'all .2s ease'
}

const activePill = {
  ...pill,
  background:'#00ff9970',
  border:'1px solid #00ff99',
  color:'#fff'
}

const summaryCard = {
  display:'flex',
  justifyContent:'space-between',
  alignItems:'flex-start',
  background:'#181818',
  border:'1px solid #00ff9950',
  borderRadius:'1rem',
  padding:'1rem',
  marginTop:'1rem'
}

const breadcrumbText = {
  color:'#00ff99',
  fontSize:'.85rem'
}

const resetButton = {
  background:'transparent',
  border:'none',
  color:'#ff6666',
  cursor:'pointer',
  fontSize:'1rem'
}