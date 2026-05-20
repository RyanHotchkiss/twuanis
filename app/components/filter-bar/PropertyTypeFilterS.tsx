'use client'

type PropertyTypeFilterSProps = {

      selectedPropertyType: string

      setSelectedPropertyType: (
        value: string
      ) => void

      propertyTypes: string[]

      residentialPropertyTypes: string[]

      showPropertyTypeOptions: boolean

      setShowPropertyAreaOptions: (
        value: boolean
      ) => void

      setShowPropertyTypeOptions: (
        value: boolean
      ) => void

      resetResidentialFields: () => void

      enableResidentialFlow: () => void

    }

    export default function PropertyTypeFilterS({

      selectedPropertyType,

      setSelectedPropertyType,

      propertyTypes,

      residentialPropertyTypes,

      showPropertyTypeOptions,

      setShowPropertyAreaOptions,

      setShowPropertyTypeOptions,

      resetResidentialFields,

      enableResidentialFlow

    }: PropertyTypeFilterSProps) {

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
              Property Type
            </h2>

            <button
              onClick={() =>
                setShowPropertyTypeOptions(
                  !showPropertyTypeOptions
                )
              }
              style={collapseButton}
            >
              {showPropertyTypeOptions ? '−' : '+'}
            </button>

          </div>

{/* COLLAPSED SUMMARY */}
          {!showPropertyTypeOptions && (

            <div style={summaryCard}>

              <span>
                {selectedPropertyType || 'None Selected'}
              </span>

              <button
                onClick={() => {

                  setSelectedPropertyType('')

                  resetResidentialFields()

                  setShowPropertyTypeOptions(true)

                }}
                style={resetButton}
              >
                ✕
              </button>

            </div>

          )}

{/* EXPANDED OPTIONS */}
          {showPropertyTypeOptions && (

            <div style={pillWrap}>

              {propertyTypes.map((type) => (

                <button
                  key={type}
                  onClick={() => {

                    setSelectedPropertyType(type)

                    resetResidentialFields()

                    setShowPropertyTypeOptions(false)

                    setShowPropertyAreaOptions(true)

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

        </div>

      )

    }

const sectionHeading = {
  fontSize:'1.1rem',
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

const collapseButton = {
  background:'transparent',
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
  alignItems:'center',
  background:'#181818',
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