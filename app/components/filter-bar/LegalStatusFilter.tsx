'use client'

type LegalStatusFilterProps = {
  selectedlegal_status: string
  setSelectedlegal_status: (value: string) => void
}

export default function LegalStatusFilter({
  selectedlegal_status,
  setSelectedlegal_status
}: LegalStatusFilterProps) {

  const legalStatuses = [
    'Titled Property',
    'Survey Available',
    'Concession Property',
    'Financing Available'
  ]

  return (

    <div>

      <p style={miniHeading}>
        LEGAL STATUS
      </p>

      <div style={pillWrap}>

        {legalStatuses.map((status) => (

          <button
            key={status}
            onClick={() =>
              setSelectedlegal_status(
                selectedlegal_status === status
                  ? ''
                  : status
              )
            }
            style={
              selectedlegal_status === status
                ? activePill
                : pill
            }
          >
            {status}
          </button>

        ))}

      </div>

    </div>

  )

}

const miniHeading = {
  fontSize:'.85rem',
  marginBottom:'1rem',
  color:'#ff3b00',
  textTransform:'uppercase' as const,
  letterSpacing:'.05rem'
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

/*

IMPORT:

import LegalStatusFilter from '@/app/components/filter-bar/LegalStatusFilter'

USAGE:

<LegalStatusFilter
  selectedlegal_status={selectedlegal_status}
  setSelectedlegal_status={setSelectedlegal_status}
/>

*/