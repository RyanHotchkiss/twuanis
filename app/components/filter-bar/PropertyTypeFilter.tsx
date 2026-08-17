'use client'

type PropertyTypeFilterProps = {
  selectedproperty_type: string
  setSelectedproperty_type: (value: string) => void

   bedrooms: string

    bathrooms: string

    parking: string

    yearBuiltRange: string

  showproperty_typeOptions: boolean
  setShowproperty_typeOptions: (value: boolean) => void

  setShowproperty_areaOptions: (value: boolean) => void

  setShowBedroomOptions: (
    value: boolean
  ) => void

  setShowProvinceOptions: (
  value: boolean
    ) => void

    setShowCantonOptions: (
      value: boolean
    ) => void

    setShowDistrictOptions: (
      value: boolean
    ) => void
}

export default function PropertyTypeFilter({
  selectedproperty_type,
  setSelectedproperty_type,

    bedrooms,
    bathrooms,
    parking,
    yearBuiltRange,
    

  showproperty_typeOptions,
  setShowproperty_typeOptions,

  setShowproperty_areaOptions,

  setShowBedroomOptions,

  setShowProvinceOptions,
  setShowCantonOptions,
  setShowDistrictOptions

}: PropertyTypeFilterProps) {

  const propertyTypes = [
    'House',
    'Condo',
    'Land',
    'Farm',
    'Cabin',
    'Commercial Property',
  ]

  return (

    <div>

      <h3 style={filterHeading}>
        PROPERTY TYPE
      </h3>

      {showproperty_typeOptions && (

  <div style={pillWrap}>

                {propertyTypes.map((type) => (

                  <button
                    key={type}
                    onClick={() => {

                      setSelectedproperty_type(type)

                      setShowproperty_typeOptions(false)

                      setShowProvinceOptions(false)

                      setShowCantonOptions(false)

                      setShowDistrictOptions(false)

                    }}
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

            )}

            {!showproperty_typeOptions &&
            selectedproperty_type && (

                    <div style={summaryCard}>

                      <span
                        onClick={() => {

                         

                        }}
                        style={{
                          ...breadcrumbText,
                          cursor:'pointer'
                        }}
                      >
                       {selectedproperty_type}

                              {bedrooms && (
                                <>
                                  <span style={{ color:'#fff' }}> • </span>
                                  {bedrooms}
                                </>
                              )}

                              {bathrooms && (
                                <>
                                  <span style={{ color:'#fff' }}> • </span>
                                  {bathrooms}
                                </>
                              )}

                              {parking && (
                                <>
                                  <span style={{ color:'#fff' }}> • </span>
                                  {parking}
                                </>
                              )}

                              {yearBuiltRange && (
                                <>
                                  <span style={{ color:'#fff' }}> • </span>
                                  {yearBuiltRange}
                                </>
                              )}
                              
                      </span>

                      <button
                        type="button"
                        onClick={() => {

                          setSelectedproperty_type('')

                          setShowproperty_typeOptions(true)

                          setShowproperty_areaOptions(true)

                        }}
                        style={resetButton}
                      >
                        ✕
                      </button>

                    </div>

            )}

    </div>

  )

}

const filterHeading = {
  fontSize:'1rem',
  marginBottom:'1rem',
  color:'#D4AF37'
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

const summaryCard = {
  display:'flex',
  justifyContent:'space-between',
  alignItems:'flex-start',
  background:'#181818',
  border:'1px solid #FFFFFF50',
  borderRadius:'1rem',
  padding:'1rem',
  marginTop:'1rem'
}

const breadcrumbText = {
  color:'#FFFFFF',
  fontSize:'.85rem'
}

const resetButton = {
  background:'transparent',
  border:'none',
  color:'#ff6666',
  cursor:'pointer',
  fontSize:'1rem'
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