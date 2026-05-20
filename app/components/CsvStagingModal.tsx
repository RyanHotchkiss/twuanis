'use client'

type CsvStagingModalProps = {
  csvListings: any[]
  setCsvListings: (value: any[]) => void
  setShowCsvStaging: (value: boolean) => void
}

export default function CsvStagingModal({
  csvListings,
  setCsvListings,
  setShowCsvStaging
}: CsvStagingModalProps) {

  return (

    <div style={overlay}>

      {/* OUTER PANEL */}
      <div style={panel}>

        {/* HEADER */}
        <div style={header}>

          <div>

            <h2 style={heading}>
              Review Listings
            </h2>

            <p style={description}>
              Add images and review your listings before publishing.
            </p>

          </div>

          <button
            onClick={() => setShowCsvStaging(false)}
            style={closeButton}
          >
            Close
          </button>

        </div>

      </div>

    </div>

  )

}

const overlay = {
  position:'fixed' as const,
  inset:0,
  background:'rgba(0,0,0,.82)',
  backdropFilter:'blur(12px)',
  zIndex:99999,
  overflowY:'auto' as const,
  padding:'3rem 2rem'
}

const panel = {
  maxWidth:'90rem',
  margin:'0 auto',
  background:'#0d0d0d',
  border:'1px solid #222',
  borderRadius:'2rem',
  padding:'2rem'
}

const header = {
  display:'flex',
  justifyContent:'space-between',
  alignItems:'center',
  marginBottom:'3rem'
}

const heading = {
  fontSize:'2.5rem',
  marginBottom:'.5rem'
}

const description = {
  color:'#888',
  fontSize:'1rem'
}

const closeButton = {
  background:'#181818',
  border:'1px solid #333',
  color:'#ff6666',
  borderRadius:'999px',
  padding:'.85rem 1.25rem',
  cursor:'pointer',
  fontWeight:'bold'
}