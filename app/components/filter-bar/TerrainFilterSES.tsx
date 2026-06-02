'use client'

type TerrainFilterSProps = {
  selectedTerrain: string[]
  setSelectedTerrain: (value: string[]) => void

  showTerrainOptions: boolean
  setShowTerrainOptions: (value: boolean) => void

  setShowAccessibilityOptions: (value: boolean) => void

  setShowLegalStatusOptions: (value: boolean) => void

  terrainOptions: string[]
}

export default function TerrainFilterS({
  selectedTerrain,
  setSelectedTerrain,
  showTerrainOptions,
  setShowTerrainOptions,

  setShowAccessibilityOptions,

  setShowLegalStatusOptions,

  terrainOptions
  }: TerrainFilterSProps) {

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
          Terreno
        </h2>

        <button
          onClick={() =>
            setShowTerrainOptions(
              !showTerrainOptions
            )
          }
          style={collapseButton}
        >
          {showTerrainOptions ? '−' : '+'}
        </button>

      </div>

      {/* COLLAPSED SUMMARY */}
      {!showTerrainOptions && (

        <div style={summaryCard}>

          <span>
            {selectedTerrain.length > 0
              ? selectedTerrain.join(', ')
              : 'Ninguno Seleccionado'}
          </span>

          <button
            onClick={() => {

              setSelectedTerrain([])
              setShowTerrainOptions(true)
              setShowAccessibilityOptions(false)
            }}
            style={resetButton}
          >
            ✕
          </button>

        </div>

      )}

      {/* OPTIONS */}
      {showTerrainOptions && (

        <div style={pillWrap}>

          {terrainOptions.map((terrain) => (

            <button
              key={terrain}
              onClick={() => {

                const alreadySelected =
                  selectedTerrain.includes(terrain)

               const updatedTerrain =
                  alreadySelected
                    ? selectedTerrain.filter(
                        (item) => item !== terrain
                      )
                    : [
                        ...selectedTerrain,
                        terrain
                      ]

                setSelectedTerrain(updatedTerrain)

                  if (updatedTerrain.length > 0) {

                    setShowAccessibilityOptions(false)

                    setShowLegalStatusOptions(true)

                  }

              }}
              style={
                selectedTerrain.includes(terrain)
                  ? activePill
                  : pill
              }
            >
              {terrain}
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