'use client'

type TerrainFilterProps = {
  selectedterrain: string[]
  setSelectedterrain: (value: string[]) => void

  showTerrainOptions: boolean
  setShowTerrainOptions: (value: boolean) => void

  setShowProvinceOptions: (
    value: boolean
  ) => void

  setShowCantonOptions: (
    value: boolean
  ) => void

  setShowDistrictOptions: (
    value: boolean
  ) => void
}

export default function TerrainFilter({
  selectedterrain,
  setSelectedterrain,

  showTerrainOptions,
  setShowTerrainOptions,
  setShowProvinceOptions,
  setShowCantonOptions,
  setShowDistrictOptions

}: TerrainFilterProps) {

  const terrainOptions = [
    'Flat',
    'Mostly Flat',
    'Rolling Hills',
    'Steep Slope',
    'Mountainous',
    'Rocky',
    'Forested',
    'River Valley',
    'Cleared Land',
    'Jungle Terrain',
    'Build Ready',
    'Agricultural Terrain'
  ]

  return (

    <div>

      <h3 style={filterHeading}>
        TERRAIN
      </h3>

      {showTerrainOptions && (

      <div style={pillWrap}>

            {terrainOptions.map((option) => (

                      <button
                        key={option}
                        onClick={() => {

                          if (
                            selectedterrain.includes(option)
                          ) {

                            setSelectedterrain(
                              selectedterrain.filter(
                                (item) => item !== option
                              )
                            )

                          } else {

                            setSelectedterrain([
                              ...selectedterrain,
                              option
                            ])

                          }

                          setShowProvinceOptions(false)

                          setShowCantonOptions(false)

                          setShowDistrictOptions(false)

                        }}
                        style={
                          selectedterrain.includes(option)
                            ? activePill
                            : pill
                        }
                      >
                        {option}
                      </button>

                    ))}

            </div>

            )}

            {!showTerrainOptions &&
            selectedterrain.length > 0 && (

              <div style={summaryCard}>

                <span
                  onClick={() => {

                    setShowTerrainOptions(true)

                  }}
                  style={{
                    ...breadcrumbText,
                    cursor:'pointer'
                  }}
                >
                  {selectedterrain.map((item, index) => (

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

                    setSelectedterrain([])

                    setShowTerrainOptions(true)

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
  color:'#D4AF37'
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

import TerrainFilter from '@/app/components/filter-bar/TerrainFilter'

USAGE:

<TerrainFilter
  selectedterrain={selectedterrain}
  setSelectedterrain={setSelectedterrain}
/>

*/