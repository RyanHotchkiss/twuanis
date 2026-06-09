'use client'

type PropertyTypeFilterProps = {
  propertyTypes: string[]
  residentialPropertyTypes: string[]
  selectedproperty_type: string
  setselectedproperty_type: (
    value: string
  ) => void
  bedrooms: string
  bathrooms?: string
  parking: string
  yearBuiltRange: string
  constructionArea: string
  showproperty_typeOptions: boolean
  setShowproperty_typeOptions: (
    value: boolean
  ) => void
  setShowproperty_areaOptions: (
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

const propertyTypeLabels: Record<string, string> = {
  House: 'Casa',
  Condo: 'Condominio',
  Apartment: 'Apartamento',
  Land: 'Terreno',
  Farm: 'Finca',
  Cabin: 'Cabaña',
  'Commercial Property': 'Propiedad Comercial',

  Studio: 'Estudio',
  '1 Bedroom': '1 Habitación',
  '2 Bedrooms': '2 Habitaciones',
  '3 Bedrooms': '3 Habitaciones',
  '4 Bedrooms': '4 Habitaciones',
  '5+ Bedrooms': '5+ Habitaciones',

  '1 Bathroom': '1 Baño',
  '2 Bathrooms': '2 Baños',
  '3 Bathrooms': '3 Baños',
  '4 Bathrooms': '4 Baños',
  '5+ Bathrooms': '5+ Baños',

  'No Parking': 'Sin Estacionamiento',
  '1 Vehicle': '1 Vehículo',
  '2 Vehicles': '2 Vehículos',
  '3 Vehicles': '3 Vehículos',
  '4+ Vehicles': '4+ Vehículos',

  'Pre-1980': 'Antes de 1980'
}

export default function PropertyTypeFilterSES({

  propertyTypes,

  residentialPropertyTypes,

  selectedproperty_type,

  setselectedproperty_type,

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

  setShowDistrictOptions,

  resetResidentialFields,

  enableResidentialFlow

}: PropertyTypeFilterProps) {

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

                  setselectedproperty_type(type)

                  setShowproperty_typeOptions(false)

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
                  selectedproperty_type === type
                    ? activePill
                    : pill
                }
              >
                {propertyTypeLabels[type] || type}
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

            {propertyTypeLabels[selectedproperty_type] || selectedproperty_type}

            {bedrooms && (
              <>
                <span style={{ color:'#fff' }}>
                  {' '}•{' '}
                </span>

                {propertyTypeLabels[bedrooms] || bedrooms}
              </>
            )}

            {bathrooms && (
              <>
                <span style={{ color:'#fff' }}>
                  {' '}•{' '}
                </span>

                {propertyTypeLabels[bathrooms] || bathrooms}
              </>
            )}

            {parking && (
              <>
                <span style={{ color:'#fff' }}>
                  {' '}•{' '}
                </span>

                {propertyTypeLabels[parking] || parking}
              </>
            )}

            {yearBuiltRange && (
              <>
                <span style={{ color:'#fff' }}>
                  {' '}•{' '}
                </span>

                {propertyTypeLabels[yearBuiltRange] || yearBuiltRange}
              </>
            )}

            {constructionArea && (
              <>
                <span style={{ color:'#fff' }}>
                  {' '}•{' '}
                </span>

                {propertyTypeLabels[constructionArea] || constructionArea}
              </>
            )}

          </span>

          <button
            type="button"
            onClick={() => {

              setselectedproperty_type('')

              setShowproperty_typeOptions(true)

              setShowproperty_areaOptions(false)

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

import PropertyTypeFilterSES from '@/app/components/filter-bar/PropertyTypeFilterES'

USAGE:

<PropertyTypeFilterSES
  selectedproperty_type={selectedproperty_type}
  setSelectedproperty_type={setSelectedproperty_type}
/>

*/