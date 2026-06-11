'use client'

type ParkingOption = {
  en: string
  es: string
}

type ParkingFilterSProps = {
  selectedParking: string
  setSelectedParking: (
    value: string
  ) => void

  showParkingOptions: boolean
  setShowParkingOptions: (
    value: boolean
  ) => void

  setShowYearBuiltOptions: (
    value: boolean
  ) => void

  parkingOptions: ParkingOption[]
}

export default function ParkingFilterS({
  selectedParking,
  setSelectedParking,

  showParkingOptions,
  setShowParkingOptions,

  setShowYearBuiltOptions,

  parkingOptions
}: ParkingFilterSProps) {

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
          Parking
        </h2>

        <button
          onClick={() =>
            setShowParkingOptions(
              !showParkingOptions
            )
          }
          style={collapseButton}
        >
          {showParkingOptions ? '−' : '+'}
        </button>

      </div>

      {!showParkingOptions && (

        <div style={summaryCard}>

          <span>
            {selectedParking || 'None Selected'}
          </span>

          <button
            onClick={() => {

              setSelectedParking('')

              setShowParkingOptions(true)

            }}
            style={resetButton}
          >
            ✕
          </button>

        </div>

      )}

      {showParkingOptions && (

        <div style={pillWrap}>

          {parkingOptions.map((parking) => (

            <button
              type="button"
              key={parking.en}
              onClick={() => {

                setSelectedParking(
                  parking.en
                )

                setShowParkingOptions(
                  false
                )

                setShowYearBuiltOptions(
                  true
                )

              }}
              style={
                selectedParking === parking.en
                  ? activePill
                  : pill
              }
            >
              {parking.en}
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