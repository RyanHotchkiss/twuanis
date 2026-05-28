'use client'

type PropertyTypeFilterProps = {
  selectedproperty_type: string
  setSelectedproperty_type: (value: string) => void

   bedrooms: string

    bathrooms: string

    parking: string

    yearBuiltRange: string

    constructionArea: string

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
    constructionArea,

  showproperty_typeOptions,
  setShowproperty_typeOptions,

  setShowproperty_areaOptions,

  setShowBedroomOptions,

  setShowProvinceOptions,
  setShowCantonOptions,
  setShowDistrictOptions

}: PropertyTypeFilterProps) {

  const propertyTypes = [
    'Casa',
    'Condominio',
    'Terreno',
    'Finca',
    'Cabaña',
    'Propiedad Comercial',
    ]

  return (

    <div>

      <h3 style={filterHeading}>
        TIPO DE PROPIEDAD
      </h3>

      {showproperty_typeOptions && (

  <div style={pillWrap}>

                {propertyTypes.map((type) => (

                  <button
                    key={type}
                    onClick={() => {

                      setSelectedproperty_type(type)

                      setShowproperty_typeOptions(false)

                      setShowBedroomOptions(true)

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

                          setShowproperty_typeOptions(true)

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

                              {constructionArea && (
                                <>
                                  <span style={{ color:'#fff' }}> • </span>
                                  {constructionArea}
                                </>
                              )}
                      </span>

                      <button
                        type="button"
                        onClick={() => {

                          setSelectedproperty_type('')

                          setShowproperty_typeOptions(true)

                          setShowproperty_areaOptions(false)

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

import PropertyTypeFilterSES from '@/app/components/filter-bar/PropertyTypeFilter'

USAGE:

<PropertyTypeFilterSES
  selectedproperty_type={selectedproperty_type}
  setSelectedproperty_type={setSelectedproperty_type}
/>

*/