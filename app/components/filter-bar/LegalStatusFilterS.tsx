'use client'

type LegalStatusFilterSProps = {
  selectedLegalStatus: string
  setSelectedLegalStatus: (value: string) => void

  showLegalStatusOptions: boolean
  setShowLegalStatusOptions: (value: boolean) => void

  setShowTerrainOptions: (value: boolean) => void
}

export default function LegalStatusFilterS({
  selectedLegalStatus,
  setSelectedLegalStatus,

  showLegalStatusOptions,
  setShowLegalStatusOptions,

  setShowTerrainOptions

}: LegalStatusFilterSProps) {

  const legalStatuses = [
    'Titled Property',
    'Survey Available',
    'Concession Property',
    'Financing Available'
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
          Legal Status
        </h2>

        <button
          onClick={() =>
            setShowLegalStatusOptions(
              !showLegalStatusOptions
            )
          }
          style={collapseButton}
        >
          {showLegalStatusOptions ? '−' : '+'}
        </button>

      </div>

      {/* COLLAPSED SUMMARY */}
      {!showLegalStatusOptions && (

        <div style={summaryCard}>

          <span>
            {selectedLegalStatus || 'None Selected'}
          </span>

          <button
            onClick={() => {

              setSelectedLegalStatus('')
              setShowLegalStatusOptions(true)

            }}
            style={resetButton}
          >
            ✕
          </button>

        </div>

      )}

      {/* OPTIONS */}
      {showLegalStatusOptions && (

        <div style={pillWrap}>

          {legalStatuses.map((status) => (

            <button
              key={status}
              onClick={() => {

                setSelectedLegalStatus(
                  selectedLegalStatus === status
                    ? ''
                    : status
                )

                setShowLegalStatusOptions(false)

                  setShowTerrainOptions(false)

              }}
              style={
                selectedLegalStatus === status
                  ? activePill
                  : pill
              }
            >
              {status}
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
  border:'1px solid #D4AF37',
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