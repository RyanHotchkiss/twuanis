'use client'

type BedroomOption = {
  en: string
  es: string
}

type BedroomFilterSProps = {
  selectedBedrooms: string
  setSelectedBedrooms: (
    value: string
  ) => void

  showBedroomOptions: boolean
  setShowBedroomOptions: (
    value: boolean
  ) => void

  setShowBathroomOptions: (
    value: boolean
  ) => void

  bedroomOptions: BedroomOption[]
}

export default function BedroomFilterS({
  selectedBedrooms,
  setSelectedBedrooms,

  showBedroomOptions,
  setShowBedroomOptions,

  setShowBathroomOptions,

  bedroomOptions
}: BedroomFilterSProps) {

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
          Bedrooms
        </h2>

        <button
          onClick={() =>
            setShowBedroomOptions(
              !showBedroomOptions
            )
          }
          style={collapseButton}
        >
          {showBedroomOptions ? '−' : '+'}
        </button>

      </div>

      {!showBedroomOptions && (

        <div style={summaryCard}>

          <span>
            {selectedBedrooms || 'None Selected'}
          </span>

          <button
            onClick={() => {

              setSelectedBedrooms('')

             

            }}
            style={resetButton}
          >
            ✕
          </button>

        </div>

      )}

      {showBedroomOptions && (

        <div style={pillWrap}>

          {bedroomOptions.map((bedroom) => (

            <button
              type="button"
              key={bedroom.en}
              onClick={() => {

                setSelectedBedrooms(
                  bedroom.en
                )

                setShowBedroomOptions(
                  false
                )

                setShowBathroomOptions(
                  true
                )

              }}
              style={
                selectedBedrooms === bedroom.en
                  ? activePill
                  : pill
              }
            >
              {bedroom.en}
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