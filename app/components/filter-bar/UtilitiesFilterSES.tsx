'use client'

type UtilityCategory =
  | 'water_supply'
  | 'electricity'
  | 'wastewater'
  | 'greywater'
  | 'internet'
  | 'gas'

type Utility = {
  category: UtilityCategory
  en: string
  es: string
}

const utilityCategoryLabels: Record<UtilityCategory, string> = {
  water_supply: 'Abastecimiento de Agua',
  electricity: 'Electricidad',
  wastewater: 'Aguas Residuales',
  greywater: 'Aguas Grises',
  internet: 'Internet',
  gas: 'Gas'
}

const utilityCategoryOrder: UtilityCategory[] = [
  'water_supply',
  'electricity',
  'wastewater',
  'greywater',
  'internet',
  'gas'
]

type UtilitiesFilterSProps = {
  selectedUtilities: string[]
  setSelectedUtilities: (value: string[]) => void

  showUtilityOptions: boolean
  setShowUtilityOptions: (value: boolean) => void

  setShowEnvironmentOptions: (value: boolean) => void

  utilities: Utility[]
}

export default function UtilitiesFilterS({
  selectedUtilities,
  setSelectedUtilities,

  showUtilityOptions,
  setShowUtilityOptions,

  setShowEnvironmentOptions,

  utilities
}: UtilitiesFilterSProps) {

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
          Servicios
        </h2>

        <button
          onClick={() =>
            setShowUtilityOptions(
              !showUtilityOptions
            )
          }
          style={collapseButton}
        >
          {showUtilityOptions ? '−' : '+'}
        </button>

      </div>

      {/* COLLAPSED SUMMARY */}
      {!showUtilityOptions && (

        <div style={summaryCard}>

          <span>
            {selectedUtilities.length > 0
            ? `${selectedUtilities.join(', ')}`
            : 'Ninguno Seleccionado'}
          </span>

          <button
            onClick={() => {

              setSelectedUtilities([])
              setShowUtilityOptions(true)

            }}
            style={resetButton}
          >
            ✕
          </button>

        </div>

      )}

{/* OPTIONS */}
    {showUtilityOptions && (

      <div style={utilityGroups}>

        {utilityCategoryOrder.map((category) => {

          const categoryUtilities =
            utilities.filter(
              (utility) =>
                utility.category === category
            )

          if (categoryUtilities.length === 0) {
            return null
          }

          return (

            <div
              key={category}
              style={utilityGroup}
            >

              <div style={utilityGroupHeading}>
                {utilityCategoryLabels[category]}
              </div>

              <div style={pillWrap}>

                {categoryUtilities.map((utility) => (

                  <button
                    type="button"
                    key={utility.en}
                    onClick={() => {

                      const alreadySelected =
                        selectedUtilities.includes(
                          utility.en
                        )

                      const updatedUtilities =
                        alreadySelected
                          ? selectedUtilities.filter(
                              (item) =>
                                item !== utility.en
                            )
                          : [
                              ...selectedUtilities,
                              utility.en
                            ]

                      setSelectedUtilities(
                        updatedUtilities
                      )

                      setShowEnvironmentOptions(true)

                    }}
                    style={
                      selectedUtilities.includes(
                        utility.en
                      )
                        ? activePill
                        : pill
                    }
                  >
                    {utility.es}
                  </button>

                ))}

              </div>

            </div>

          )

        })}

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
  background:'#181818',
  border:'1px solid #D4AF3750',
  borderRadius:'1rem',
  padding:'1rem',
  marginTop:'1rem'
}

const resetButton = {
  background:'transparent',
  border:'none',
  color:'#ff6666',
  cursor:'pointer',
  fontSize:'1rem'
}

const utilityGroups = {
  display:'flex',
  flexDirection:'column' as const,
  gap:'1.5rem'
}

const utilityGroup = {
  display:'flex',
  flexDirection:'column' as const,
  gap:'.65rem'
}

const utilityGroupHeading = {
  fontSize:'.75rem',
  fontWeight:600,
  letterSpacing:'.08em',
  textTransform:'uppercase' as const,
  color:'#aaa'
}

const pillWrap = {
  display:'flex',
  flexWrap:'wrap' as const,
  gap:'.5rem'
}

const pill = {
  background:'#181818',
  border:'.25px solid #D4AF3750',
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