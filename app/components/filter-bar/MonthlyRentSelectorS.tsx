'use client'

type MonthlyRentSelectorSProps = {
  monthlyPrice: string
  setMonthlyPrice: (value: string) => void

  showMonthlyRentOptions: boolean
  setShowMonthlyRentOptions: (
    value: boolean
  ) => void
}

export default function MonthlyRentSelectorS({
  monthlyPrice,
  setMonthlyPrice,

  showMonthlyRentOptions,
  setShowMonthlyRentOptions

}: MonthlyRentSelectorSProps) {

  const monthlyRentOptions = [
    '-₡100K / month',
    '₡100K - ₡200K / month',
    '₡200K - ₡300K / month',
    '₡300K - ₡400K / month',
    '₡400K+ / month'
  ]

  return (

    <div>

      {/* HEADER */}
      <div style={{
        display:'flex',
        justifyContent:'space-between',
        alignItems:'center',
        marginBottom:'1rem'
      }}>

        <h2 style={sectionHeading}>
          Monthly Rent
        </h2>

        <button
          onClick={() =>
            setShowMonthlyRentOptions(
              !showMonthlyRentOptions
            )
          }
          style={collapseButton}
        >
          {showMonthlyRentOptions ? '−' : '+'}
        </button>

      </div>

      {/* COLLAPSED SUMMARY */}
      {!showMonthlyRentOptions && (

        <div style={summaryCard}>

          <span>
            {monthlyPrice || 'None Selected'}
          </span>

          <button
            onClick={() => {

              setMonthlyPrice('')
              setShowMonthlyRentOptions(true)

            }}
            style={resetButton}
          >
            ✕
          </button>

        </div>

      )}

      {/* OPTIONS */}
      {showMonthlyRentOptions && (

        <div style={pillWrap}>

          {monthlyRentOptions.map((price) => (

            <button
              key={price}
              onClick={() => {

                setMonthlyPrice(
                  monthlyPrice === price
                    ? ''
                    : price
                )

                setShowMonthlyRentOptions(false)

              }}
              style={
                monthlyPrice === price
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

const sectionHeading = {
  fontSize:'1rem',
  marginBottom:'1rem',
  color:'#ff3b00'
}

const collapseButton = {
  background:'#181818',
  border:'1px solid #333',
  color:'#fff',
  width:'2rem',
  height:'2rem',
  borderRadius:'999rem',
  cursor:'pointer'
}

const summaryCard = {
  display:'flex',
  justifyContent:'space-between',
  alignItems:'center',
  background:'#111',
  border:'1px solid #222',
  borderRadius:'1rem',
  padding:'1rem'
}

const resetButton = {
  background:'transparent',
  border:'none',
  color:'#ff6666',
  cursor:'pointer',
  fontSize:'1rem'
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