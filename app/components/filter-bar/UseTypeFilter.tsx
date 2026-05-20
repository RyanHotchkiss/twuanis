'use client'

type UseTypeFilterProps = {
  selecteduse_type: string
  setSelecteduse_type: (value: string) => void
}

export default function UseTypeFilter({
  selecteduse_type,
  setSelecteduse_type
}: UseTypeFilterProps) {

  const useTypes = [
    'Residential',
    'Commercial',
    'Agricultural',
    'Tourism Commercial',
    'Mixed Use'
  ]

  return (

    <div>

      <h3 style={filterHeading}>
        USE TYPE
      </h3>

      <div style={pillWrap}>

        {useTypes.map((type) => (

          <button
            key={type}
            onClick={() =>
              setSelecteduse_type(
                selecteduse_type === type
                  ? ''
                  : type
              )
            }
            style={
              selecteduse_type === type
                ? activePill
                : pill
            }
          >
            {type}
          </button>

        ))}

      </div>

    </div>

  )

}

const filterHeading = {
  fontSize:'1rem',
  marginBottom:'1rem',
  color:'#ffffff50'
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

import UseTypeFilter from '@/app/components/filter-bar/UseTypeFilter'

USAGE:

<UseTypeFilter
  selecteduse_type={selecteduse_type}
  setSelecteduse_type={setSelecteduse_type}
/>

*/