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
      { label: '₡0 - ₡25M', usd: '$0 - $50K' },
      { label: '₡25M - ₡50M', usd: '$50K - $100K' },
      { label: '₡50M - ₡100M', usd: '$100K - $200K' },
      { label: '₡100M+', usd: '$200K+' }
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
                    key={price.label}
                    onClick={() => {
                      setSelectedprice_range(price.label)
                      setShowProvinceOptions(false)
                      setShowCantonOptions(false)
                      setShowDistrictOptions(false)
                      setShowPriceOptions(false)
                    }}
                    style={
                      selectedprice_range === price.label
                        ? activePill
                        : pill
                    }
                  >
                    
                    <span style={priceColones}>
                      {price.usd}
                    </span>

                    <span style={priceDollars}>
                      {price.label}
                    </span>

                  </button>
                ))}
              </div>
          )}

{!showPriceOptions &&
            selectedprice_range && (

              <div style={summaryCard}>
                    <div
                      onClick={() => {
                        setShowPriceOptions(true)
                      }}
                      style={{
                        cursor:'pointer'
                      }}
                    >
                      <div style={priceColones}>
                        {selectedprice_range}
                      </div>
                      <div style={priceDollars}>
                        {
                          priceOptions.find(
                            p => p.label === selectedprice_range
                          )?.usd
                        }
                      </div>
                    </div>
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
  flexDirection:'row' as const,
  justifyContent:'space-between',
  alignItems:'center',

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
  flexDirection:'row' as const,
  flexWrap:'wrap' as const,
  gap:'.5rem',
  alignItems:'flex-start'
}

const pill = {
  background:'#181818',
  border:'.25px solid #D4AF3750',
  color:'#fff',
  padding:'.85rem 1rem',
  borderRadius:'999rem',
  cursor:'pointer',
  transition:'all .2s ease',

  display:'flex',
  flexDirection:'column' as const,
  alignItems:'center',
  justifyContent:'center',
  gap:'.2rem'
}

const activePill = {
  ...pill,
  background:'#D4AF37',
  border:'1px solid #FFFFFF',
  color:'#000'
}
const priceColones = {
  fontSize:'.8rem',
  color:'#fff',
  fontWeight:'500'
}

const priceDollars = {
  fontSize:'.75rem',
  color:'#888'
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