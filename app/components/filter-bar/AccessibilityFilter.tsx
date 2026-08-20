'use client'

import {
  accessibilityOptions,
  pavedRoadDistanceRangeOptions
} from '@/data/property-data'

type AccessibilityFilterProps = {
  selectedaccessibility: string
  setSelectedaccessibility: (value: string) => void

  selectedPavedRoadDistanceRange: string
  setSelectedPavedRoadDistanceRange: (value: string) => void

  showAccessibilityOptions: boolean
  setShowAccessibilityOptions: (value: boolean) => void
}

export default function AccessibilityFilter({
  selectedaccessibility,
  setSelectedaccessibility,
  selectedPavedRoadDistanceRange,
  setSelectedPavedRoadDistanceRange,
  showAccessibilityOptions,
  setShowAccessibilityOptions
}: AccessibilityFilterProps) {

  return (
    <div>
      <h3 style={filterHeading}>
        ACCESSIBILITY
      </h3>

      {showAccessibilityOptions && (
        <div style={pillWrap}>
          {accessibilityOptions.map((option) => (
            <button
              key={option.en}
              onClick={() => {
                setSelectedaccessibility(option.en)
                setShowAccessibilityOptions(false)
              }}
              style={
                selectedaccessibility === option.en
                  ? activePill
                  : pill
              }
            >
              {option.en}
            </button>
          ))}
        </div>
      )}

      {selectedaccessibility ===
        'Unpaved Road to Property' && (

        <div style={distanceRangeSection}>

          <div style={distanceRangeHeading}>
            DISTANCE TO PAVED ROAD
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
                  {option.en}
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
  fontSize: '1rem',
  marginBottom: '1rem',
  color: '#D4AF37'
}

const pillWrap = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '.5rem'
}

const pill = {
  background: '#181818',
  border: '.25px solid #D4AF3750',
  color: '#fff',
  padding: '.85rem 1rem',
  borderRadius: '999rem',
  cursor: 'pointer',
  transition: 'all .2s ease'
}

const activePill = {
  ...pill,
  background: '#D4AF37',
  border: '1px solid #FFFFFF',
  color: '#000'
}

const summaryCard = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  background: '#181818',
  border: '1px solid #FFFFFF50',
  borderRadius: '1rem',
  padding: '1rem',
  marginTop: '1rem'
}

const breadcrumbText = {
  color: '#FFFFFF',
  fontSize: '.85rem'
}

const resetButton = {
  background: 'transparent',
  border: 'none',
  color: '#ff6666',
  cursor: 'pointer',
  fontSize: '1rem'
}

const distanceRangeSection = {
  marginTop: '1rem'
}

const distanceRangeHeading = {
  fontSize: '.85rem',
  color: '#aaa',
  marginBottom: '.75rem'
}