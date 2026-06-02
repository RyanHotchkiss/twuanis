'use client'

type PriceFilterProps = {
  selectedprice_range: string
  setSelectedprice_range: (value: string) => void

  showPriceOptions: boolean
  setShowPriceOptions: (value: boolean) => void

  setShowProvinceOptions: (value: boolean) => void

  setShowCantonOptions: (value: boolean) => void

  setShowDistrictOptions: (value: boolean) => void
}

export default function PriceFilter({
  selectedprice_range,
  setSelectedprice_range,

  showPriceOptions,
  setShowPriceOptions,

  setShowProvinceOptions,

  setShowCantonOptions,

  setShowDistrictOptions
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

{showPriceOptions && (

            <div style={pillWrap}>

              {priceOptions.map((price) => (

                <button
                  key={price}
                  onClick={() => {

                    setSelectedprice_range(price)

                    setShowProvinceOptions(false)

                    setShowCantonOptions(false)

                    setShowDistrictOptions(false)

                    setShowPriceOptions(false)

                  }}
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

          )}

{!showPriceOptions &&
            selectedprice_range && (

              <div style={summaryCard}>

                <span
                  onClick={() => {
                    setShowPriceOptions(true)
                  }}
                  style={{
                    ...breadcrumbText,
                    cursor:'pointer'
                  }}
                >
                  {selectedprice_range}
                </span>

                <button
                  type="button"
                  onClick={() => {

                    setSelectedprice_range('')

                    setShowPriceOptions(true)

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


const breadcrumbText = {
  color:'#FFFFFF',
  fontSize:'.85rem'
}

const summaryCard = {
  display:'flex',
  justifyContent:'space-between',
  alignItems:'flex-start',
  background:'#181818',
  border:'1px solid #FFFFFF50',
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

/*

IMPORT:

import PriceFilter from '@/app/components/filter-bar/PriceFilter'

USAGE:

<PriceFilter
  selectedprice_range={selectedprice_range}
  setSelectedprice_range={setSelectedprice_range}
/>

*/