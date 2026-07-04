'use client'

type PriceFilterRLESProps = {
  selectedmonthly_price: string
  setSelectedmonthly_price: (value: string) => void

  showPriceOptions: boolean
  setShowPriceOptions: (value: boolean) => void

  setShowProvinceOptions: (value: boolean) => void
  setShowCantonOptions: (value: boolean) => void
  setShowDistrictOptions: (value: boolean) => void
}

export default function PriceFilterRLES({
  selectedmonthly_price,
  setSelectedmonthly_price,

  showPriceOptions,
  setShowPriceOptions,

  setShowProvinceOptions,
  setShowCantonOptions,
  setShowDistrictOptions
}: PriceFilterRLESProps) {

  const priceOptions = [
    { label:'₡0 - ₡250K', usd:'$0 - $500/mes' },
    { label:'₡250K - ₡500K', usd:'$500 - $1K/mes' },
    { label:'₡500K - ₡1M', usd:'$1K - $2K/mes' },
    { label:'₡1M - ₡2.5M', usd:'$2K - $5K/mes' },
    { label:'₡2.5M+', usd:'$5K+/mes' }
  ]

  return (
    <div>
      <h3 style={filterHeading}>
        PRECIO
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
                {price.usd}
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
                  )?.usd
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