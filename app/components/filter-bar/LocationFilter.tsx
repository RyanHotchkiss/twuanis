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

  selectprovince: (province: string) => void
  selectcanton: (canton: string) => void
  selectdistrict: (district: string) => void
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

  selectprovince,
  selectcanton,
  selectdistrict

}: LocationFilterProps) {

  return (

    <div>

      <h3 style={filterHeading}>
        LOCATION
      </h3>

      {/* province LEVEL */}
      {!selectedprovince && (

        <div
  className="location-scroll-panel"
  style={scrollPanel}
>

          {Object.keys(provinces).map((province) => (

            <button
              key={province}
              onClick={(e) => {
                e.preventDefault()
                selectprovince(province)
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
      {selectedprovince && !selectedcanton && (

        <div>

          <div style={breadcrumbBar}>

            <button
              onClick={(e) => {
                e.preventDefault()
                setSelectedprovince('')
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
                onClick={(e) => {
                  e.preventDefault()
                  selectcanton(canton)
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
      {selectedprovince && selectedcanton && (

        <div>

          <div style={breadcrumbBar}>

            <button
              onClick={(e) => {
                e.preventDefault()
                setSelectedcanton('')
                setSelecteddistrict('')
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
                  selectdistrict(district)
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

  )

}

const filterHeading = {
  fontSize:'1rem',
  marginBottom:'1rem',
  color:'#ffffff50'
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
  color:'#888',
  fontSize:'.85rem'
}

const backButton = {
  background:'transparent',
  border:'none',
  color:'#00ff9970',
  cursor:'pointer',
  fontSize:'.85rem'
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