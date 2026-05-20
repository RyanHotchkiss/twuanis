'use client'

type UtilitiesFilterSProps = {
  selectedUtilities: string[]
  setSelectedUtilities: (value: string[]) => void

  showUtilityOptions: boolean
  setShowUtilityOptions: (value: boolean) => void

  setShowEnvironmentOptions: (value: boolean) => void

  utilities: string[]
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
          Utilities
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
            : 'None Selected'}
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

            <div style={pillWrap}>

              {utilities.map((utility) => (

                <button
                  type="button"
                  key={utility}
                  onClick={() => {

                    const alreadySelected =
                      selectedUtilities.includes(utility)

                    const updatedUtilities =
                      alreadySelected
                        ? selectedUtilities.filter(
                            (item) => item !== utility
                          )
                        : [
                            ...selectedUtilities,
                            utility
                          ]

                    setSelectedUtilities(updatedUtilities)

                    setShowEnvironmentOptions(true)

                  }}
                  style={
                    selectedUtilities.includes(utility)
                      ? activePill
                      : pill
                  }
                >
                  {utility}
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
  color:'#ff3b00'
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
  alignItems:'center',
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