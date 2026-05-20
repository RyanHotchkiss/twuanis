'use client'

type PropertyTypeFilterProps = {
  selectedproperty_type: string
  setSelectedproperty_type: (value: string) => void
}

export default function PropertyTypeFilter({
  selectedproperty_type,
  setSelectedproperty_type
}: PropertyTypeFilterProps) {

  const propertyTypes = [
    'House',
    'Condo',
    'Land',
    'Farm',
    'Cabin',
    'Commercial Property'
  ]

  return (

    <div>

      <h3 style={filterHeading}>
        PROPERTY TYPE
      </h3>

      <div style={pillWrap}>

        {propertyTypes.map((type) => (

          <button
            key={type}
            onClick={() =>
              setSelectedproperty_type(
                selectedproperty_type === type
                  ? ''
                  : type
              )
            }
            style={
              selectedproperty_type === type
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
  color:'#ff3b00'
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

import PropertyTypeFilter from '@/app/components/filter-bar/PropertyTypeFilter'

USAGE:

<PropertyTypeFilter
  selectedproperty_type={selectedproperty_type}
  setSelectedproperty_type={setSelectedproperty_type}
/>

*/