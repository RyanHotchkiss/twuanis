'use client'

type PropertyArea = {
        en: string
        es: string
      }

      type PropertyAreaFilterSProps = {
        selectedPropertyArea: string
        setSelectedPropertyArea: (value: string) => void

        showPropertyAreaOptions: boolean
        setShowPropertyAreaOptions: (value: boolean) => void

        setShowUtilityOptions: (value: boolean) => void

        propertyAreas: PropertyArea[]
      }

export default function PropertyAreaFilterS({
  selectedPropertyArea,
  setSelectedPropertyArea,

  showPropertyAreaOptions,
  setShowPropertyAreaOptions,

  setShowUtilityOptions,

  propertyAreas
}: PropertyAreaFilterSProps) {

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
          Property Area
        </h2>

        <button
          onClick={() =>
            setShowPropertyAreaOptions(
              !showPropertyAreaOptions
            )
          }
          style={collapseButton}
        >
          {showPropertyAreaOptions ? '−' : '+'}
        </button>

      </div>

      {/* COLLAPSED SUMMARY */}
      {!showPropertyAreaOptions && (

        <div style={summaryCard}>

          <span>
            {selectedPropertyArea
            ? `${selectedPropertyArea}`
            : 'None Selected'}
          </span>

          <button
            onClick={() => {

              setSelectedPropertyArea('')
              setShowPropertyAreaOptions(true)

            }}
            style={resetButton}
          >
            ✕
          </button>

        </div>

      )}

      {/* OPTIONS */}
{showPropertyAreaOptions && (

  <div style={pillWrap}>

    {propertyAreas.map((area) => (

      <button
        type="button"
        key={area.en}
        onClick={() => {

          setSelectedPropertyArea(area.en)

          setShowPropertyAreaOptions(false)

          setShowUtilityOptions(true)

        }}
        style={
          selectedPropertyArea === area.en
            ? activePill
            : pill
        }
      >
        {area.en}
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