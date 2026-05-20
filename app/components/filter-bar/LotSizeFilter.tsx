'use client'

type LotSizeFilterProps = {
  selectedproperty_area: string
  setSelectedproperty_area: (value: string) => void
}

export default function LotSizeFilter({
  selectedproperty_area,
  setSelectedproperty_area
}: LotSizeFilterProps) {

  const lotSizes = [
    '<1,000m²',
    '1,000–10,000m²',
    '10,000–50,000m²',
    '50,000m²+'
  ]

  return (

    <div>

      <p style={miniHeading}>
        LOT SIZE
      </p>

      <div style={pillWrap}>

        {lotSizes.map((size) => (

          <button
            key={size}
            onClick={() =>
              setSelectedproperty_area(
                selectedproperty_area === size
                  ? ''
                  : size
              )
            }
            style={
              selectedproperty_area === size
                ? activePill
                : pill
            }
          >
            {size}
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

import LotSizeFilter from '@/app/components/filter-bar/LotSizeFilter'

USAGE:

<LotSizeFilter
  selectedproperty_area={selectedproperty_area}
  setSelectedproperty_area={setSelectedproperty_area}
/>

*/