'use client'

type UtilitiesFilterProps = {
  selectedutility: string
  setSelectedutility: (value: string) => void
}

export default function UtilitiesFilter({
  selectedutility,
  setSelectedutility
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

      <div style={pillWrap}>

        {utilities.map((utility) => (

          <button
            key={utility}
            onClick={() =>
              setSelectedutility(
                selectedutility === utility
                  ? ''
                  : utility
              )
            }
            style={
              selectedutility === utility
                ? activePill
                : pill
            }
          >
            {utility}
          </button>

        ))}

      </div>

    </div>

  )

}

const miniHeading = {
  fontSize:'.85rem',
  marginBottom:'1rem',
  color:'#ff3b00',
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

import UtilitiesFilter from '@/app/components/filter-bar/UtilitiesFilter'

USAGE:

<UtilitiesFilter
  selectedutility={selectedutility}
  setSelectedutility={setSelectedutility}
/>

*/