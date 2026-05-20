'use client'

type PriceFilterProps = {
  selectedprice_range: string
  setSelectedprice_range: (value: string) => void
}

export default function PriceFilter({
  selectedprice_range,
  setSelectedprice_range
}: PriceFilterProps) {

  const priceOptions = [
    '₡0 - ₡25M',
    '₡25M - ₡50M',
    '₡50M - ₡100M',
    '₡100M+'
  ]

  return (

    <div>

      <h3 style={filterHeading}>
        PRICE
      </h3>

      <div style={pillWrap}>

        {priceOptions.map((price) => (

          <button
            key={price}
            onClick={() =>
              setSelectedprice_range(
                selectedprice_range === price
                  ? ''
                  : price
              )
            }
            style={
              selectedprice_range === price
                ? activePill
                : pill
            }
          >
            {price}
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

import PriceFilter from '@/app/components/filter-bar/PriceFilter'

USAGE:

<PriceFilter
  selectedprice_range={selectedprice_range}
  setSelectedprice_range={setSelectedprice_range}
/>

*/