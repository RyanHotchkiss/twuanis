'use client'

type AccessibilityFilterProps = {
  selectedaccessibility: string
  setSelectedaccessibility: (value: string) => void

  showAccessibilityOptions: boolean
  setShowAccessibilityOptions: (value: boolean) => void
}

export default function AccessibilityFilter({
  selectedaccessibility,
  setSelectedaccessibility,
  showAccessibilityOptions,
  setShowAccessibilityOptions
}: AccessibilityFilterProps) {
  const accessibilityOptions = [
    '2WD Accessible',
    'Paved Road',
    '4x4 Required',
    'Walkable',
    'Boat Access Only'
  ]

  return (
    <div>
      <h3 style={filterHeading}>
        ACCESSIBILITY
      </h3>

      {showAccessibilityOptions && (
        <div style={pillWrap}>
          {accessibilityOptions.map((option) => (
            <button
              key={option}
              onClick={() => {
                setSelectedaccessibility(option)
                setShowAccessibilityOptions(false)
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

      {!showAccessibilityOptions &&
        selectedaccessibility && (
          <div style={summaryCard}>
            <span
              onClick={() =>
                setShowAccessibilityOptions(true)
              }
              style={{
                ...breadcrumbText,
                cursor: 'pointer'
              }}
            >
              {selectedaccessibility}
            </span>

            <button
              type="button"
              onClick={() => {
                setSelectedaccessibility('')
                setShowAccessibilityOptions(true)
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