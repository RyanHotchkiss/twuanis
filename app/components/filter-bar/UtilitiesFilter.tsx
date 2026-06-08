'use client'

type UtilitiesFilterProps = {

  selectedutility: string[]
  setSelectedutility: (value: string[]) => void

  showutilityOptions: boolean
  setShowutilityOptions: (value: boolean) => void

}

export default function UtilitiesFilter({

      selectedutility,
      setSelectedutility,

      showutilityOptions,
      setShowutilityOptions,

    }: UtilitiesFilterProps) {

  const utilities = [
    'Water',
    'Electricity',
    'Fiber Internet',
    'Septic',
    'Municipal Sewer'
  ]

  return (

    <div>

            <p style={miniHeading}>
              UTILITIES
            </p>

           {showutilityOptions && (

                <div style={pillWrap}>

                  {utilities.map((utility) => (

                    <button
                      key={utility}
                      onClick={() => {

                        if (
                          selectedutility.includes(utility)
                        ) {

                          setSelectedutility(
                            selectedutility.filter(
                              (item) => item !== utility
                            )
                          )

                        } else {

                          setSelectedutility([
                            ...selectedutility,
                            utility
                          ])

                        }

                      }}
                      style={
                        selectedutility.includes(utility)
                          ? activePill
                          : pill
                      }
                    >
                      {utility}
                    </button>

                  ))}

                </div>

              )}

              {!showutilityOptions &&
              selectedutility.length > 0 && (

                <div style={summaryCard}>

                  <span
                    onClick={() => {

                      setShowutilityOptions(true)

                    }}
                    style={{
                      ...breadcrumbText,
                      cursor:'pointer'
                    }}
                  >
                    {selectedutility.map((item, index) => (

                              <span key={item}>

                                {index > 0 && (
                                  <span style={{ color:'#fff' }}>
                                    {' • '}
                                  </span>
                                )}

                                {item}

                              </span>

                            ))}
                  </span>

                  <button
                    type="button"
                    onClick={() => {

                      setSelectedutility([])

                      setShowutilityOptions(true)

                    }}
                    style={resetButton}
                  >
                    ✕
                  </button>

                </div>

              )}
          </div>

        )}



const miniHeading = {
  fontSize:'1rem',
  marginBottom:'1rem',
  color:'#D4AF37',
  textTransform:'uppercase' as const,
  letterSpacing:'.05rem'
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

const summaryCard = {
  display:'flex',
  justifyContent:'space-between',
  alignItems:'flex-start',
  background:'#181818',
  border:'1px solid #FFFFFF50',
  borderRadius:'1rem',
  padding:'1rem',
  marginTop:'1rem'
}

const breadcrumbText = {
  color:'#FFFFFF',
  fontSize:'.85rem'
}

const resetButton = {
  background:'transparent',
  border:'none',
  color:'#ff6666',
  cursor:'pointer',
  fontSize:'1rem'
}

/*

IMPORT:

import UtilitiesFilter from '@/app/components/filter-bar/UtilitiesFilter'

USAGE:

<UtilitiesFilter
  selectedutility={selectedutility}
  setSelectedutility={setSelectedutility}
/>

*/