'use client'

type PriceFilterRLProps = {

  selectedmonthly_price: string

  setSelectedmonthly_price: (
    value: string
  ) => void

  showPriceOptions: boolean

  setShowPriceOptions: (
    value: boolean
  ) => void

}

export default function PriceFilterRL({

  selectedmonthly_price,
  setSelectedmonthly_price,

  showPriceOptions,
  setShowPriceOptions

}: PriceFilterRLProps) {

  const priceOptions = [
    '-₡100K / month',
    '₡100K - ₡200K / month',
    '₡200K - ₡300K / month',
    '₡300K - ₡400K / month',
    '₡400K+ / month'
  ]

  return (

    <div>

      <h3 style={filterHeading}>
        PRICE
      </h3>

      {/* COLLAPSED */}
      {!showPriceOptions &&
      selectedmonthly_price && (

        <div style={summaryCard}>

          <span
            onClick={() =>
              setShowPriceOptions(true)
            }
            style={{
              ...summaryText,
              cursor:'pointer'
            }}
          >
            {selectedmonthly_price}
          </span>

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

      {/* OPTIONS */}
      {showPriceOptions && (

        <div style={pillWrap}>

          {priceOptions.map((price) => (

            <button
              type="button"
              key={price}
              onClick={() => {

                setSelectedmonthly_price(price)

                setShowPriceOptions(false)

              }}
              style={
                selectedmonthly_price === price
                  ? activePill
                  : pill
              }
            >
              {price}
            </button>

          ))}

        </div>

      )}

    </div>

  )

}

const filterHeading = {
  marginBottom:'14px',
  fontSize:'15px',
  color:'#888',
  textTransform:'uppercase' as const,
  letterSpacing:'1px'
}

const pillWrap = {
  display:'flex',
  flexWrap:'wrap' as const,
  gap:'10px'
}

const pill = {
  background:'#181818',
  border:'1px solid #D4AF3750',
  color:'#bbb',
  padding:'10px 14px',
  borderRadius:'999px',
  cursor:'pointer',
  transition:'all .2s ease'
}

const activePill = {
  background:'#FFFFFF',
  border:'1px solid #FFFFFF',
  color:'#000',
  padding:'10px 14px',
  borderRadius:'999px',
  cursor:'pointer',
  fontWeight:'bold',
  transition:'all .2s ease'
}

const summaryCard = {
  display:'flex',
  justifyContent:'space-between',
  alignItems:'center',
  background:'#181818',
  border:'1px solid #222',
  borderRadius:'1rem',
  padding:'1rem'
}

const summaryText = {
  color:'#FFFFFF',
  fontSize:'.85rem'
}

const resetButton = {
  background:'transparent',
  border:'none',
  color:'#ff6666',
  cursor:'pointer',
  fontSize:'1rem'
}