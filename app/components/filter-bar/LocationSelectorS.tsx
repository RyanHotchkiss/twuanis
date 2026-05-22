'use client'

type LocationSelectorSProps = {

  province: string
  canton: string
  district: string

  setProvince: (value: string) => void
  setCanton: (value: string) => void
  setDistrict: (value: string) => void

  provinces: Record<string, string[]>
  districts: Record<string, string[]>

  showLocationOptions: boolean
  setShowLocationOptions: (value: boolean) => void

  showProvinceOptions: boolean
  setShowProvinceOptions: (value: boolean) => void

  showCantonOptions: boolean
  setShowCantonOptions: (value: boolean) => void

  showDistrictOptions: boolean
  setShowDistrictOptions: (value: boolean) => void


  setShowPropertyTypeOptions:
  (value: boolean) => void

}

export default function LocationSelectorS({

  setShowPropertyTypeOptions,

  province,
  canton,
  district,

  setProvince,
  setCanton,
  setDistrict,

  provinces,
  districts,

  showLocationOptions,
  setShowLocationOptions,

  showProvinceOptions,
  setShowProvinceOptions,

  showCantonOptions,
  setShowCantonOptions,

  showDistrictOptions,
  setShowDistrictOptions

}: LocationSelectorSProps) {

  return (

  <div>

{/* HEADER */}
              <div style={{
                marginBottom:'1rem'
              }}>

                <h2 style={sectionHeading}>
                  Location
                </h2>

              </div>

{/* COLLAPSED SUMMARY */}

{/* EXPANDED OPTIONS */}
         
          {!showLocationOptions &&
              province &&
              canton &&
              district && (

            <div style={summaryCard}>

              <span
                          onClick={() => {

                            setShowLocationOptions(true)

                            if (!canton) {

                              setShowProvinceOptions(true)
                              setShowCantonOptions(false)
                              setShowDistrictOptions(false)

                            } else if (!district) {

                              setShowProvinceOptions(false)
                              setShowCantonOptions(true)
                              setShowDistrictOptions(false)

                            } else {

                              setShowProvinceOptions(false)
                              setShowCantonOptions(false)
                              setShowDistrictOptions(true)

                            }

                          }}
                          style={{
                            cursor:'pointer'
                          }}
                        >

                        {province && `${province} → `}

                        {canton && `${canton} → `}

                        {district && district}

                        {!province && 'No Location Selected'}

              </span>

              <button
              type="button"
                onClick={() => {

                  setProvince('')
                  setCanton('')
                  setDistrict('')

                  setShowLocationOptions(true)

                  setShowProvinceOptions(true)
                  setShowCantonOptions(false)
                  setShowDistrictOptions(false)

                }}
                style={resetButton}
              >
                ✕
              </button>

            </div>

          )}

{/* EXPANDED OPTIONS */}

  {showLocationOptions && (

    <div>

      {/* PROVINCES */}
            {showProvinceOptions && (

              <div>

                <h2 style={sectionHeading0}>
                  Province
                </h2>

                <div style={buttonWrap}>

                  {Object.keys(provinces).map((provinceName) => (

                    <button
                    type="button"
                      key={provinceName}
                      onClick={() => {

                        setProvince(provinceName)
                        setCanton('')
                        setDistrict('')

                        setShowProvinceOptions(false)
                        setShowCantonOptions(true)
                        setShowDistrictOptions(false)

                      }}
                      style={
                        province === provinceName
                          ? activePill
                          : pill
                      }
                    >
                      {provinceName}
                    </button>

                  ))}

                </div>

              </div>

            )}

            {/* CANTONS */}
            {showCantonOptions &&
            province && (

              <div style={{ marginTop:'2rem' }}>

                <h2 style={sectionHeading0}>
                  Canton
                </h2>

                <div style={buttonWrap}>

                  {provinces[province].map((cantonName) => (

                    <button
                    type="button"
                      key={cantonName}
                      onClick={() => {

                        setCanton(cantonName)
                        setDistrict('')

                        setShowProvinceOptions(false)
                        setShowCantonOptions(false)
                        setShowDistrictOptions(true)

                      }}
                      style={
                        canton === cantonName
                          ? activePill
                          : pill
                      }
                    >
                      {cantonName}
                    </button>

                  ))}

                </div>

              </div>

            )}

            {/* DISTRICTS */}
            {showDistrictOptions &&
            canton &&
            districts[canton] && (

              <div style={{ marginTop:'2rem' }}>

                <h2 style={sectionHeading0}>
                  District
                </h2>

                <div style={buttonWrap}>

                  {districts[canton].map((districtName) => (

                    <button
                    type="button"
                      key={districtName}
                      onClick={() => {

                        setDistrict(districtName)

                        setShowProvinceOptions(false)
                        setShowCantonOptions(false)
                        setShowDistrictOptions(false)

                        setShowLocationOptions(false)

                      }}
                      style={
                        district === districtName
                          ? activePill
                          : pill
                      }
                    >
                      {districtName}
                    </button>

                  ))}

                </div>

              </div>

            )}

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

const sectionHeading0 = {
  fontSize:'0.8rem',
  marginBottom:'1rem',
  color:'#00ff99'
}

const buttonWrap = {
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
  alignItems:'flex-start',
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