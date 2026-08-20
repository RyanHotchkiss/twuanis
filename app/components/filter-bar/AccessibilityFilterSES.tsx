'use client'

import {
  accessibilityOptions,
  pavedRoadDistanceRangeOptions
} from '@/data/property-data'

type AccessibilityFiltersProps = {
  selectedAccessibility: string
  setSelectedAccessibility: (value: string) => void

  selectedPavedRoadDistanceRange: string
  setSelectedPavedRoadDistanceRange: (value: string) => void

  showAccessibilityOptions: boolean
  setShowAccessibilityOptions: (value: boolean) => void
}

export default function AccessibilityFilters({
  selectedAccessibility,
  setSelectedAccessibility,

  selectedPavedRoadDistanceRange,
  setSelectedPavedRoadDistanceRange,

  showAccessibilityOptions,
  setShowAccessibilityOptions

}: AccessibilityFiltersProps) {

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
                Accesibilidad
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
                  {selectedAccessibility
                    ? accessibilityOptions.find(
                        (option) =>
                          option.en === selectedAccessibility
                      )?.es || selectedAccessibility
                    : 'Ninguno Seleccionado'}
                </span>

                <button
                  type="button"
                  onClick={() => {

                    setSelectedAccessibility('')
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
                    selectedAccessibility === option.en

                  return (

                    <button
                      type="button"
                      key={option.en}
                      onClick={() => {

                        setSelectedAccessibility(option.en)
                        setShowAccessibilityOptions(false)

                      }}
                      style={
                        alreadySelected
                          ? activePill
                          : pill
                      }
                    >
                      {option.es}
                    </button>

                  )

                })}

              </div>

            )}

            {selectedAccessibility ===
              'Unpaved Road to Property' && (

              <div style={distanceRangeSection}>

                <div style={distanceRangeHeading}>
                  Distancia a Carretera Pavimentada
                </div>

                <div style={pillWrap}>

                  {pavedRoadDistanceRangeOptions.map(
                    (option) => (

                      <button
                        type="button"
                        key={option.value}
                        onClick={() =>
                          setSelectedPavedRoadDistanceRange(
                            option.value
                          )
                        }
                        style={
                          selectedPavedRoadDistanceRange ===
                          option.value
                            ? activePill
                            : pill
                        }
                      >
                        {option.es}
                      </button>

                    )
                  )}

                </div>

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

const distanceRangeSection = {
  marginTop: '1rem'
}

const distanceRangeHeading = {
  fontSize: '.85rem',
  color: '#aaa',
  marginBottom: '.75rem'
}