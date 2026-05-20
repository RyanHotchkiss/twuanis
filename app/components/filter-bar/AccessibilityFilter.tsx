'use client'

type AccessibilityFilterProps = {
  selectedaccessibility: string
  setSelectedaccessibility: (value: string) => void
}

export default function AccessibilityFilter({
  selectedaccessibility,
  setSelectedaccessibility
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

      <div style={pillWrap}>

        {accessibilityOptions.map((option) => (

          <button
            key={option}
            onClick={() =>
              setSelectedaccessibility(
                selectedaccessibility === option
                  ? ''
                  : option
              )
            }
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

/*

IMPORT:

import AccessibilityFilter from '@/app/components/filter-bar/AccessibilityFilter'

USAGE:

<AccessibilityFilter
  selectedaccessibility={selectedaccessibility}
  setSelectedaccessibility={setSelectedaccessibility}
/>

*/