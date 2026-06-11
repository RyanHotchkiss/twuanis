'use client'

type BathroomOption = {
  en: string
  es: string
}

type BathroomFilterSProps = {
  selectedBathrooms: string
  setSelectedBathrooms: (
    value: string
  ) => void

  showBathroomOptions: boolean
  setShowBathroomOptions: (
    value: boolean
  ) => void

  setShowParkingOptions: (
    value: boolean
  ) => void

  bathroomOptions: BathroomOption[]
}

export default function BathroomFilterS({
  selectedBathrooms,
  setSelectedBathrooms,

  showBathroomOptions,
  setShowBathroomOptions,

  setShowParkingOptions,

  bathroomOptions
}: BathroomFilterSProps) {

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
          Baños
        </h2>

        <button
          onClick={() =>
            setShowBathroomOptions(
              !showBathroomOptions
            )
          }
          style={collapseButton}
        >
          {showBathroomOptions ? '−' : '+'}
        </button>

      </div>

      {!showBathroomOptions && (

        <div style={summaryCard}>

          <span>
            {selectedBathrooms || 'None Selected'}
          </span>

          <button
            onClick={() => {

              setSelectedBathrooms('')

              setShowBathroomOptions(true)

            }}
            style={resetButton}
          >
            ✕
          </button>

        </div>

      )}

      {showBathroomOptions && (

        <div style={pillWrap}>

          {bathroomOptions.map((bathroom) => (

            <button
              type="button"
              key={bathroom.es}
              onClick={() => {

                setSelectedBathrooms(
                  bathroom.es
                )

                setShowBathroomOptions(
                  false
                )

                setShowParkingOptions(
                  true
                )

              }}
              style={
                selectedBathrooms === bathroom.es
                  ? activePill
                  : pill
              }
            >
              {bathroom.es}
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