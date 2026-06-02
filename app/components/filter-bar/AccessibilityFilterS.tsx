'use client'

type AccessibilityFiltersProps = {
  selectedAccessibility: string[]
  setSelectedAccessibility: (value: string[]) => void

  showAccessibilityOptions: boolean
  setShowAccessibilityOptions: (value: boolean) => void
}

export default function AccessibilityFilters({
  selectedAccessibility,
  setSelectedAccessibility,

  showAccessibilityOptions,
  setShowAccessibilityOptions

}: AccessibilityFiltersProps) {

  const accessibilityOptions = [
    '2WD Accessible',
    'Paved Road',
    '4x4 Required',
    'Walkable',
    'Boat Access Only'
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

              <h2 style={filterHeading}>
                Accessibility
              </h2>

              <button
                type="button"
                onClick={() =>
                  setShowAccessibilityOptions(
                    !showAccessibilityOptions
                  )
                }
                style={collapseButton}
              >
                {showAccessibilityOptions ? '−' : '+'}
              </button>

            </div>

            {/* COLLAPSED SUMMARY */}
            {!showAccessibilityOptions && (

              <div style={summaryCard}>

                <span>
                  {selectedAccessibility.length > 0
                    ? selectedAccessibility.join(', ')
                    : 'None Selected'}
                </span>

                <button
                  type="button"
                  onClick={() => {

                    setSelectedAccessibility([])
                    setShowAccessibilityOptions(true)

                  }}
                  style={resetButton}
                >
                  ✕
                </button>

              </div>

            )}

            {/* OPTIONS */}
            {showAccessibilityOptions && (

              <div style={pillWrap}>

                {accessibilityOptions.map((option) => {

                  const alreadySelected =
                    selectedAccessibility.includes(option)

                  return (

                    <button
                      type="button"
                      key={option}
                      onClick={() => {

                        setSelectedAccessibility(
                          alreadySelected
                            ? selectedAccessibility.filter(
                                item => item !== option
                              )
                            : [
                                ...selectedAccessibility,
                                option
                              ]
                        )

                      }}
                      style={
                        alreadySelected
                          ? activePill
                          : pill
                      }
                    >
                      {option}
                    </button>

                  )

                })}

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