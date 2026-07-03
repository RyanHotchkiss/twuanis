'use client'

type LotSizeFilterProps = {
  selectedproperty_area: string
  setSelectedproperty_area: (value: string) => void

  showproperty_areaOptions: boolean
  setShowproperty_areaOptions: (value: boolean) => void

  setShowutilityOptions: (value: boolean) => void

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

export default function PropertyAreaFilter({
  selectedproperty_area,
  setSelectedproperty_area,

  showproperty_areaOptions,
  setShowproperty_areaOptions,

  setShowutilityOptions,

  setShowProvinceOptions,
  setShowCantonOptions,
  setShowDistrictOptions
}: LotSizeFilterProps) {

  const propertyAreas = [
    '<1,000m²',
    '1,000–10,000m²',
    '10,000–50,000m²',
    '50,000m²+'
  ]

  return (

    <div>

      <p style={miniHeading}>
        PROPERTY AREA
      </p>

      {showproperty_areaOptions && (

            <div style={pillWrap}>

              {propertyAreas.map((size) => (

                <button
                  key={size}
                  onClick={() => {

                    setSelectedproperty_area(size)

                    setShowproperty_areaOptions(false)

                    setShowutilityOptions(true)

                    setShowProvinceOptions(false)

                    setShowCantonOptions(false)

                    setShowDistrictOptions(false)

                  }}
                  style={
                    selectedproperty_area === size
                      ? activePill
                      : pill
                  }
                >
                  {size}
                </button>

              ))}

            </div>

          )}

          {!showproperty_areaOptions &&
          selectedproperty_area && (

            <div style={summaryCard}>

                    <span
                      onClick={() => {

                        setShowproperty_areaOptions(true)

                      }}
                      style={{
                        ...breadcrumbText,
                        cursor:'pointer'
                      }}
                    >
                      {selectedproperty_area}
                    </span>

                    <button
                      type="button"
                      onClick={() => {

                        setSelectedproperty_area('')

                        setShowproperty_areaOptions(true)

                        setShowutilityOptions(true)

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

const miniHeading = {
  fontSize:'1rem',
  marginBottom:'1rem',
  color:'#D4AF37',
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

import LotSizeFilter from '@/app/components/filter-bar/LotSizeFilter'

USAGE:

<LotSizeFilter
  selectedproperty_area={selectedproperty_area}
  setSelectedproperty_area={setSelectedproperty_area}
/>

*/