'use client'

type LocationFilterProps = {
  provinces: Record<string, string[]>
  districts: Record<string, string[]>

  selectedprovince: string
  selectedcanton: string
  selecteddistrict: string

  setSelectedprovince: (value: string) => void
  setSelectedcanton: (value: string) => void
  setSelecteddistrict: (value: string) => void

  showProvinceOptions: boolean
  setShowProvinceOptions: (value: boolean) => void

  showCantonOptions: boolean
  setShowCantonOptions: (value: boolean) => void

  showDistrictOptions: boolean
  setShowDistrictOptions: (value: boolean) => void

  showLocationOptions: boolean
  setShowLocationOptions: (
    value: boolean
  ) => void

}

        export default function LocationFilter({
          provinces,
          districts,

          selectedprovince,
          selectedcanton,
          selecteddistrict,

          setSelectedprovince,
          setSelectedcanton,
          setSelecteddistrict,

          showProvinceOptions,
          setShowProvinceOptions,

          showCantonOptions,
          setShowCantonOptions,

          showDistrictOptions,
          setShowDistrictOptions,

          showLocationOptions,
          setShowLocationOptions,

        }: LocationFilterProps) {

return (

            <>

              {!showLocationOptions && selecteddistrict && (

                <div
                  style={{
                    display:'flex',
                    justifyContent:'space-between',
                    alignItems:'center',

                    background:'#181818',
                    border:'1px solid #222',

                    borderRadius:'1rem',

                    padding:'1rem',

                    cursor:'pointer'
                  }}
                  onClick={() => {

                    setShowLocationOptions(true)

                    setShowProvinceOptions(false)
                    setShowCantonOptions(false)
                    setShowDistrictOptions(true)

                  }}
                >

                  <span
                    style={{
                      color:'#fff',
                      lineHeight:'1.5'
                    }}
                  >
                    Location
                    <br />

                    <span style={{ color:'#00ff99' }}>
                      {selectedprovince}
                      {' → '}
                      {selectedcanton}
                      {' → '}
                      {selecteddistrict}
                    </span>

                  </span>

                  <button
                    type="button"
                    onClick={(e) => {

                      e.stopPropagation()

                      setShowLocationOptions(true)

                      setShowProvinceOptions(true)
                      setShowCantonOptions(false)
                      setShowDistrictOptions(false)

                    }}
                    style={{
                      background:'transparent',
                      border:'none',

                      color:'#ff6666',

                      cursor:'pointer',

                      fontSize:'1rem'
                    }}
                  >
                    ✕
                  </button>

                </div>

              )}

              {showLocationOptions && (

              <div>

                <h3 style={filterHeading}>
                  LOCATION
                </h3>

                {/* province LEVEL */}
                {showProvinceOptions && (

                  <div
                      className="location-scroll-panel"
                      style={scrollPanel}
                    >

                      <h2 style={sectionHeading0}>
                        Province
                      </h2>

                    {Object.keys(provinces).map((province) => (

                      <button
                        key={province}
                        onClick={() => {
                          setSelectedprovince(province)
                          setShowProvinceOptions(false)
                          setShowCantonOptions(true)
                          setShowDistrictOptions(false)

                        }}
                        style={
                          selectedprovince === province
                            ? activeListButton
                            : listButton
                        }
                      >
                        {province}
                      </button>

                    ))}

                  </div>

                )}

                {/* canton LEVEL */}
                {showCantonOptions && (

                  <div>
                  <h2 style={sectionHeading0}>
                    Canton
                  </h2>
                    <div style={breadcrumbBar}>

                      <button
                        onClick={(e) => {

                                e.preventDefault()

                                setSelectedprovince('')

                                setSelectedcanton('')

                                setSelecteddistrict('')

                                setShowProvinceOptions(true)

                                setShowCantonOptions(false)

                                setShowDistrictOptions(false)

                              }}
                        style={backButton}
                      >
                        ← provinces
                      </button>

                      <span style={breadcrumbText}>
                        {selectedprovince}
                      </span>

                    </div>

                    <div
            className="location-scroll-panel"
            style={scrollPanel}
          >

                      {provinces[selectedprovince].map((canton) => (

                        <button
                          key={canton}
                          onClick={() => {
                            setSelectedcanton(canton)
                            setShowCantonOptions(false)
                            setShowDistrictOptions(true)

                          }}
                          style={listButton}
                        >
                          {canton}
                        </button>

                      ))}

                    </div>

                  </div>

                )}

                {/* district LEVEL */}
                      {showDistrictOptions && (

                        <div>

                          <h2 style={sectionHeading0}>
                            District
                          </h2>

                          <div style={breadcrumbBar}>

                            <button
                              onClick={() => {
                                setSelectedcanton('')
                                setShowProvinceOptions(false)
                                setShowCantonOptions(true)
                                setShowDistrictOptions(false)
                              }}
                              style={backButton}
                            >
                              ← cantons
                            </button>

                            <span style={breadcrumbText}>
                              {selectedprovince} → {selectedcanton}
                            </span>

                          </div>

                          <div
                            className="location-scroll-panel"
                            style={scrollPanel}
                          >

                            {districts[selectedcanton]?.map((district) => (

                              <button
                                key={district}
                                onClick={(e) => {
                                  e.preventDefault()

                                  setSelecteddistrict(district)

                                  setShowProvinceOptions(false)
                                  setShowCantonOptions(false)
                                  setShowDistrictOptions(false)
                                }}
                                style={
                                  selecteddistrict === district
                                    ? activeListButton
                                    : listButton
                                }
                              >
                                {district}
                              </button>

                            ))}

                          </div>

                        </div>

                      )}

          {/* Summary Card */}
                      {/* Summary Card */}
                        {!showProvinceOptions &&
                        !showCantonOptions &&
                        !showDistrictOptions && (

                        <div style={summaryCard}>

                          <span
                            onClick={() => {

                              setShowProvinceOptions(false)
                              setShowCantonOptions(false)
                              setShowDistrictOptions(true)

                            }}
                            style={{
                              ...breadcrumbText,
                              cursor:'pointer'
                            }}
                          >
                            {selectedprovince &&
                            selectedcanton &&
                            selecteddistrict
                              ? <>
                                      {selectedprovince}

                                      <span style={{ color:'#fff' }}>
                                        {' → '}
                                      </span>

                                      {selectedcanton}

                                      <span style={{ color:'#fff' }}>
                                        {' → '}
                                      </span>

                                      {selecteddistrict}
                                    </>
                              : 'Costa Rica'}
                          </span>

                          <button
                            type="button"
                            onClick={() => {

                              setSelectedprovince('')
                              setSelectedcanton('')
                              setSelecteddistrict('')

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
                          <style jsx>{`
                              .location-scroll-panel::-webkit-scrollbar {
                                  width: 8px;
                                  height: 50px
                              }
                              .location-scroll-panel::-webkit-scrollbar-track {
                                  background: #111;
                                  border-radius: 999px;
                                  margin-top: 35px;
                                  margin-bottom: 35px;
                              }
                              .location-scroll-panel::-webkit-scrollbar-thumb {
                                  background: #00ff9970;
                                  border-radius: 999px;
                              }
                          `}</style>

              </div>

    )}
  </>
 )
}

const filterHeading = {
  fontSize:'1rem',
  marginBottom:'1rem',
  color:'#ff3b00'
}

const sectionHeading0 = {
  fontSize:'.8rem',
  marginBottom:'1rem',
  color:'#00ff99'
}

const scrollPanel = {
  display:'flex',
  flexDirection:'column' as const,
  gap:'.5rem',
  maxHeight:'12.5rem',
  overflowY:'scroll' as const,
  paddingRight:'.35rem',
  maskImage:'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 72%, rgba(0,0,0,.25) 92%, rgba(0,0,0,0) 100%)',
  WebkitMaskImage:'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 72%, rgba(0,0,0,.25) 92%, rgba(0,0,0,0) 100%)',
  scrollbarWidth:'thin' as const,
  scrollbarColor:'#00ff9970 #111'
}

const listButton = {
  background:'#181818',
  border:'1px solid #2a2a2a',
  color:'#fff',
  padding:'1rem 1rem',
  borderRadius:'.75rem',
  textAlign:'left' as const,
  cursor:'pointer',
  minHeight:'3.5rem',
  flexShrink:0
}

const activeListButton = {
  ...listButton,
  background:'#00ff9970',
  color:'#000',
  fontWeight:'bold'
}

const breadcrumbBar = {
  display:'flex',
  alignItems:'center',
  gap:'.75rem',
  marginBottom:'1rem'
}

const breadcrumbText = {
  color:'#00ff99',
  fontSize:'.85rem'
}

const backButton = {
  background:'transparent',
  border:'none',
  color:'#00ff9970',
  cursor:'pointer',
  fontSize:'.85rem'
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

const resetButton = {
  background:'transparent',
  border:'none',
  color:'#ff6666',
  cursor:'pointer',
  fontSize:'1rem'
}

/*

import LocationFilter from '@/app/components/filter-bar/LocationFilter'

<LocationFilter

  provinces={provinces}
  districts={districts}

  selectedprovince={selectedprovince}
  selectedcanton={selectedcanton}
  selecteddistrict={selecteddistrict}

  setSelectedprovince={setSelectedprovince}
  setSelectedcanton={setSelectedcanton}
  setSelecteddistrict={setSelecteddistrict}

  selectprovince={selectprovince}
  selectcanton={selectcanton}
  selectdistrict={selectdistrict}

/>

*/