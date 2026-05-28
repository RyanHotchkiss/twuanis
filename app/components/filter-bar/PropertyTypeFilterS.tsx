'use client'

type PropertyTypeFilterProps = {

  propertyTypes: string[]

  residentialPropertyTypes: string[]

  selectedPropertyType: string

  setSelectedPropertyType: (
    value: string
  ) => void

  bedrooms: string

  bathrooms: string

  parking: string

  yearBuiltRange: string

  constructionArea: string

  showPropertyTypeOptions: boolean

  setShowPropertyTypeOptions: (
    value: boolean
  ) => void

  setShowPropertyAreaOptions: (
    value: boolean
  ) => void

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

  resetResidentialFields: () => void

  enableResidentialFlow: () => void

}

export default function PropertyTypeFilterS({

  propertyTypes,

  residentialPropertyTypes,

  selectedPropertyType,

  setSelectedPropertyType,

  bedrooms,

  bathrooms,

  parking,

  yearBuiltRange,

  constructionArea,

  showPropertyTypeOptions,

  setShowPropertyTypeOptions,

  setShowPropertyAreaOptions,

  setShowBedroomOptions,

  setShowProvinceOptions,

  setShowCantonOptions,

  setShowDistrictOptions,

  resetResidentialFields,

  enableResidentialFlow

}: PropertyTypeFilterProps) {

  return (

    <div>

      <h3 style={filterHeading}>
        PROPERTY TYPE
      </h3>

      {showPropertyTypeOptions && (

        <div style={pillWrap}>

          {propertyTypes.map((type) => (

            <button
              key={type}
              onClick={() => {

                setSelectedPropertyType(type)

                setShowPropertyTypeOptions(false)

                setShowBedroomOptions(true)

                setShowProvinceOptions(false)

                setShowCantonOptions(false)

                setShowDistrictOptions(false)

                if (
                  residentialPropertyTypes.includes(type)
                ) {

                  enableResidentialFlow()

                }

              }}
              style={
                selectedPropertyType === type
                  ? activePill
                  : pill
              }
            >
              {type}
            </button>

          ))}

        </div>

      )}

      

          {!showPropertyTypeOptions &&
selectedPropertyType && (

  <div style={summaryCard}>

    <span
      onClick={() => {

        setShowPropertyTypeOptions(true)

      }}
      style={{
        ...breadcrumbText,
        cursor:'pointer'
      }}
    >

      {selectedPropertyType}

      {bedrooms && (
        <>
          <span style={{ color:'#fff' }}>
            {' '}•{' '}
          </span>

          {bedrooms}
        </>
      )}

      {bathrooms && (
        <>
          <span style={{ color:'#fff' }}>
            {' '}•{' '}
          </span>

          {bathrooms}
        </>
      )}

      {parking && (
        <>
          <span style={{ color:'#fff' }}>
            {' '}•{' '}
          </span>

          {parking}
        </>
      )}

      {yearBuiltRange && (
        <>
          <span style={{ color:'#fff' }}>
            {' '}•{' '}
          </span>

          {yearBuiltRange}
        </>
      )}

      {constructionArea && (
        <>
          <span style={{ color:'#fff' }}>
            {' '}•{' '}
          </span>

          {constructionArea}
        </>
      )}

    </span>

    <button
      type="button"
      onClick={() => {

        setSelectedPropertyType('')

        setShowPropertyTypeOptions(true)

        setShowPropertyAreaOptions(false)

        resetResidentialFields()

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

const summaryCard = {
  display:'flex',
  justifyContent:'space-between',
  alignItems:'flex-start',
  background:'#181818',
  border:'1px solid #00ff9950',
  borderRadius:'1rem',
  padding:'1rem',
  marginTop:'1rem'
}

const breadcrumbText = {
  color:'#00ff99',
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

import PropertyTypeFilterS from '@/app/components/filter-bar/PropertyTypeFilter'

USAGE:

<PropertyTypeFilter
  selectedproperty_type={selectedproperty_type}
  setSelectedproperty_type={setSelectedproperty_type}
/>

*/