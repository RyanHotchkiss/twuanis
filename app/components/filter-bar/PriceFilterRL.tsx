'use client'

import { useMarketplaceFx } from '@/app/hooks/useMarketplaceFx'
import { priceOptions as createPriceOptions } from '@/lib/marketplace-price-ranges'

type PriceFilterProps = {
  selectedmonthly_price: string
  setSelectedmonthly_price: (value: string) => void

  showPriceOptions: boolean
  setShowPriceOptions: (value: boolean) => void

  setShowProvinceOptions: (value: boolean) => void
  setShowCantonOptions: (value: boolean) => void
  setShowDistrictOptions: (value: boolean) => void
}

export default function PriceFilterRL({
  selectedmonthly_price,
  setSelectedmonthly_price,

  showPriceOptions,
  setShowPriceOptions,

  setShowProvinceOptions,
  setShowCantonOptions,
  setShowDistrictOptions
}: PriceFilterProps) {

  const fx = useMarketplaceFx()
  const priceOptions = createPriceOptions('rent', 'en', fx?.usdToCrcRate ?? null)

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
                setSelectedmonthly_price(price.label)
                setShowProvinceOptions(false)
                setShowCantonOptions(false)
                setShowDistrictOptions(false)
                setShowPriceOptions(false)
              }}
              style={
                selectedmonthly_price === price.label
                  ? activePill
                  : pill
              }
            >
              <span style={priceColones}>
                {price.label}
              </span>

              <span style={priceDollars}>
                {price.crc}
              </span>
            </button>
          ))}
        </div>
      )}

      {!showPriceOptions &&
        selectedmonthly_price && (
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
                {selectedmonthly_price}
              </div>

              <div style={priceDollars}>
                {
                  priceOptions.find(
                    p => p.label === selectedmonthly_price
                  )?.crc
                }
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedmonthly_price('')
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

const summaryCard = {
  display:'flex',
  flexDirection:'row' as const,
  justifyContent:'space-between',
  alignItems:'center',
  background:'var(--surface)',
  border:'1px solid #FFFFFF50',
  borderRadius:'1rem',
  padding:'1rem',
  marginTop:'1rem'
}

const resetButton = {
  background:'transparent',
  border:'none',
  color:'var(--error-text)',
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
  background:'var(--surface)',
  border:'.25px solid #D4AF3750',
  color:'var(--foreground)',
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
  color:'var(--foreground)',
  fontWeight:'500'
}

const priceDollars = {
  fontSize:'.75rem',
  color:'var(--muted)'
}

/*

IMPORT:

import PriceFilter from '@/app/components/filter-bar/PriceFilter'

USAGE:

<PriceFilter
  selectedmonthly_price={selectedmonthly_price}
  setselectedmonthly_price={setselectedmonthly_price}
/>

*/