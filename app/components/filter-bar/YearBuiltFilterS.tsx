'use client'

type YearBuiltOption = {
  en: string
  es: string
}

type YearBuiltFilterSProps = {
  selectedYearBuilt: string
  setSelectedYearBuilt: (
    value: string
  ) => void

  showYearBuiltOptions: boolean
  setShowYearBuiltOptions: (
    value: boolean
  ) => void

  setShowConstructionAreaOptions: (
    value: boolean
  ) => void

  yearBuiltOptions: YearBuiltOption[]
}

export default function YearBuiltFilterS({
  selectedYearBuilt,
  setSelectedYearBuilt,

  showYearBuiltOptions,
  setShowYearBuiltOptions,

  setShowConstructionAreaOptions,

  yearBuiltOptions
}: YearBuiltFilterSProps) {

  return (

    <div>

      <div
        style={{
          display:'flex',
          justifyContent:'space-between',
          alignItems:'center',
          marginBottom:'1rem'
        }}
      >

        <h2 style={sectionHeading}>
          Year Built
        </h2>

        <button
          onClick={() =>
            setShowYearBuiltOptions(
              !showYearBuiltOptions
            )
          }
          style={collapseButton}
        >
          {showYearBuiltOptions ? '−' : '+'}
        </button>

      </div>

      {!showYearBuiltOptions && (

        <div style={summaryCard}>

          <span>
            {selectedYearBuilt || 'None Selected'}
          </span>

          <button
            onClick={() => {

              setSelectedYearBuilt('')

              setShowYearBuiltOptions(true)

            }}
            style={resetButton}
          >
            ✕
          </button>

        </div>

      )}

      {showYearBuiltOptions && (

        <div style={pillWrap}>

          {yearBuiltOptions.map((yearBuilt) => (

            <button
              type="button"
              key={yearBuilt.en}
              onClick={() => {

                setSelectedYearBuilt(
                  yearBuilt.en
                )

                setShowYearBuiltOptions(
                  false
                )

                setShowConstructionAreaOptions(
                  true
                )

              }}
              style={
                selectedYearBuilt === yearBuilt.en
                  ? activePill
                  : pill
              }
            >
              {yearBuilt.en}
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
  color:'#D4AF37'
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
  alignItems:'flex-start',
  background:'#181818',
  border:'1px solid #D4AF3750',
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

const pillWrap = {
  display:'flex',
  flexWrap:'wrap' as const,
  gap:'.5rem'
}

const pill = {
  background:'#181818',
  border:'.25px solid #D4AF3750',
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