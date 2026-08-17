'use client'

type ConstructionAreaOption = {
  en: string
  es: string
}

type ConstructionAreaFilterSProps = {
  selectedConstructionArea: string
  setSelectedConstructionArea: (
    value: string
  ) => void

  showConstructionAreaOptions: boolean
  setShowConstructionAreaOptions: (
    value: boolean
  ) => void

  setShowPropertyAreaOptions: (
    value: boolean
  ) => void

  constructionAreaOptions: ConstructionAreaOption[]
}

export default function ConstructionAreaFilterS({
  selectedConstructionArea,
  setSelectedConstructionArea,

  showConstructionAreaOptions,
  setShowConstructionAreaOptions,

  setShowPropertyAreaOptions,

  constructionAreaOptions
}: ConstructionAreaFilterSProps) {

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
          Área de Construcción
        </h2>

      </div>

      {!showConstructionAreaOptions && (

        <div style={summaryCard}>

          <span>
            {selectedConstructionArea || 'None Selected'}
          </span>

          <button
            onClick={() => {

              setSelectedConstructionArea('')

              setShowConstructionAreaOptions(true)

            }}
            style={resetButton}
          >
            ✕
          </button>

        </div>

      )}

      {showConstructionAreaOptions && (

        <div style={pillWrap}>

          {constructionAreaOptions.map(
            (constructionArea) => (

              <button
                type="button"
                key={constructionArea.es}
                onClick={() => {

                  setSelectedConstructionArea(
                    constructionArea.es
                  )

                  setShowConstructionAreaOptions(
                    false
                  )

                  setShowPropertyAreaOptions(
                    true
                  )

                }}
                style={
                  selectedConstructionArea ===
                  constructionArea.es
                    ? activePill
                    : pill
                }
              >
                {constructionArea.es}
              </button>

            )
          )}

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