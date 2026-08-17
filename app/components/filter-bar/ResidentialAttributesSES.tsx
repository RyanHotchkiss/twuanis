'use client'
import { useState } from 'react'
type ResidentialAttributesSProps = {

  bedrooms: string
  setBedrooms: (value: string) => void

  bathrooms: string
  setBathrooms: (value: string) => void

  parking: string
  setParking: (value: string) => void

  yearBuiltRange: string
  setYearBuiltRange: (value: string) => void

  setShowproperty_typeOptions: (
    value: boolean
  ) => void

  setShowproperty_areaOptions: (
    value: boolean
  ) => void

  bedroomOptions: string[]
  bathroomOptions: string[]
  parkingOptions: string[]
  yearBuiltOptions: string[]

  showResidentialSummary: boolean
  setShowResidentialSummary: (
    value: boolean
  ) => void

  showBedroomOptions: boolean
  setShowBedroomOptions: (
    value: boolean
  ) => void

  showBathroomOptions: boolean
  setShowBathroomOptions: (
    value: boolean
  ) => void

  showParkingOptions: boolean
  setShowParkingOptions: (
    value: boolean
  ) => void

  showYearBuiltOptions: boolean
  setShowYearBuiltOptions: (
    value: boolean
  ) => void
}

const residentialLabels: Record<string, string> = {
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

  'Pre-1980': 'Antes de 1980',
  '1980–1999': '1980–1999',
  '2000–2009': '2000–2009',
  '2010–2019': '2010–2019',
  '2020+': '2020+',
}

export default function ResidentialAttributesS({

  bedrooms,
  setBedrooms,

  bathrooms,
  setBathrooms,

  parking,
  setParking,

  yearBuiltRange,
  setYearBuiltRange,

  setShowproperty_typeOptions,

  setShowproperty_areaOptions,

  bedroomOptions,
  bathroomOptions,
  parkingOptions,
  yearBuiltOptions,

  showBedroomOptions,
  setShowBedroomOptions,

  showBathroomOptions,
  setShowBathroomOptions,

  showParkingOptions,
  setShowParkingOptions,

  showYearBuiltOptions,
  setShowYearBuiltOptions,

  showResidentialSummary,
  setShowResidentialSummary,

}: ResidentialAttributesSProps) {

  return (

              <div style={{
                display:'flex',
                flexDirection:'column',
                gap:'2rem'
              }}>

                {/* RESIDENTIAL SUMMARY */}

                {showResidentialSummary && (

                  <div
                    style={{
                      ...summaryCard,
                      cursor:'pointer',
                      flexDirection:'column',
                      alignItems:'flex-start',
                      gap:'.5rem'
                    }}
                    onClick={() => {

                      setShowResidentialSummary(false)

                      setShowBedroomOptions(true)

                    }}
                  >

                    <span
                        style={{
                          color: '#FFFFFF',
                          lineHeight: '1.7',
                          wordBreak: 'break-word',
                          paddingRight: '1rem',
                          flex: '1',
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          gap: '.5rem'
                        }}
                      >

                        {bedrooms && (
                          <>
                            <span>
                              {residentialLabels[bedrooms] || bedrooms}
                            </span>
                            <span style={{ color: '#fff' }}>•</span>
                          </>
                        )}

                        {bathrooms && (
                          <>
                            <span>
                              {residentialLabels[bathrooms] || bathrooms}
                            </span>
                            <span style={{ color: '#fff' }}>•</span>
                          </>
                        )}

                        {parking && (
                          <>
                            <span>
                              {residentialLabels[parking] || parking}
                            </span>
                            <span style={{ color: '#fff' }}>•</span>
                          </>
                        )}

                        {yearBuiltRange && (
                          <span>
                            {residentialLabels[yearBuiltRange] || yearBuiltRange}
                          </span>
                        )}

                      </span>
                    <button
                      type="button"
                      onClick={(e) => {

                        e.stopPropagation()

                        setBedrooms('')
                        setBathrooms('')
                        setParking('')
                        setYearBuiltRange('')

                        setShowResidentialSummary(false)

                        setShowBedroomOptions(true)
                        setShowBathroomOptions(false)
                        setShowParkingOptions(false)
                        setShowYearBuiltOptions(false)

                      }}
                      style={resetButton}
                    >
                      ✕
                    </button>

                  </div>

                )}

                {!showResidentialSummary && (

                  <>

                    {/* BEDROOMS */}

                    <div>

                      {!showBedroomOptions && bedrooms && (

                        <div
                          style={{
                            ...summaryCard,
                            cursor:'pointer'
                          }}
                          onClick={() => {

                            setShowBedroomOptions(true)

                          }}
                        >

                          <span>
                            {residentialLabels[bedrooms] || bedrooms}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {

                              e.stopPropagation()

                              setBedrooms('')

                              setShowBedroomOptions(true)
                              setShowBathroomOptions(false)

                            }}
                            style={resetButton}
                          >
                            ✕
                          </button>

                        </div>

                      )}

                      {showBedroomOptions && (

                        <div>

                          <h2 style={sectionHeading}>
                            Habitaciones
                          </h2>

                          <div style={pillWrap}>

                            {bedroomOptions.map((option) => (

                              <button
                                type="button"
                                key={residentialLabels[option] || option}
                                onClick={() => {

                                  setBedrooms(option)

                                  setShowBedroomOptions(false)
                                  setShowBathroomOptions(true)

                                }}
                                style={
                                  bedrooms === option
                                    ? activePill
                                    : pill
                                }
                              >
                                {residentialLabels[option] || option}
                              </button>

                            ))}

                          </div>

                        </div>

                      )}

                    </div>

                    {/* BATHROOMS */}

                    <div>

                      {!showBathroomOptions && bathrooms && (

                        <div
                          style={{
                            ...summaryCard,
                            cursor:'pointer'
                          }}
                          onClick={() => {

                            setShowBathroomOptions(true)

                          }}
                        >

                          <span>
                            {residentialLabels[bathrooms] || bathrooms}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {

                              e.stopPropagation()

                              setBathrooms('')

                              setShowBathroomOptions(true)
                              setShowParkingOptions(false)

                            }}
                            style={resetButton}
                          >
                            ✕
                          </button>

                        </div>

                      )}

                      {showBathroomOptions && (

                        <div>

                          <h2 style={sectionHeading}>
                            Baños
                          </h2>

                          <div style={pillWrap}>

                            {bathroomOptions.map((option) => (

                              <button
                                type="button"
                                key={residentialLabels[option] || option}
                                onClick={() => {

                                  setBathrooms(option)

                                  setShowBathroomOptions(false)
                                  setShowParkingOptions(true)

                                }}
                                style={
                                  bathrooms === option
                                    ? activePill
                                    : pill
                                }
                              >
                                {residentialLabels[option] || option}
                              </button>

                            ))}

                          </div>

                        </div>

                      )}

                    </div>

                    {/* PARKING */}

                    <div>

                      {!showParkingOptions && parking && (

                        <div
                          style={{
                            ...summaryCard,
                            cursor:'pointer'
                          }}
                          onClick={() => {

                            setShowParkingOptions(true)

                          }}
                        >

                          <span>
                            {residentialLabels[parking] || parking}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {

                              e.stopPropagation()

                              setParking('')

                              setShowParkingOptions(true)
                              setShowYearBuiltOptions(false)

                            }}
                            style={resetButton}
                          >
                            ✕
                          </button>

                        </div>

                      )}

                      {showParkingOptions && (

                        <div>

                          <h2 style={sectionHeading}>
                            Estacionamiento
                          </h2>

                          <div style={pillWrap}>

                            {parkingOptions.map((option) => (

                              <button
                                type="button"
                                key={residentialLabels[option] || option}
                                onClick={() => {

                                  setParking(option)

                                  setShowParkingOptions(false)
                                  setShowYearBuiltOptions(true)

                                }}
                                style={
                                  parking === option
                                    ? activePill
                                    : pill
                                }
                              >
                                {residentialLabels[option] || option}
                              </button>

                            ))}

                          </div>

                        </div>

                      )}

                    </div>

                    {/* YEAR BUILT */}

                    <div>

                      {!showYearBuiltOptions && yearBuiltRange && (

                        <div
                          style={{
                            ...summaryCard,
                            cursor:'pointer'
                          }}
                          onClick={() => {

                            setShowYearBuiltOptions(true)

                          }}
                        >

                          <span>
                            {residentialLabels[yearBuiltRange] || yearBuiltRange}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {

                              e.stopPropagation()

                              setYearBuiltRange('')

                              setShowYearBuiltOptions(true)

                            }}
                            style={resetButton}
                          >
                            ✕
                          </button>

                        </div>

                      )}

                      {showYearBuiltOptions && (

                        <div>

                          <h2 style={sectionHeading}>
                            Año de Construcción
                          </h2>

                          <div style={pillWrap}>

                            {yearBuiltOptions.map((option) => (

                              <button
                                type="button"
                                key={residentialLabels[option] || option}
                                onClick={() => {

                                  setYearBuiltRange(option)

                                  setShowYearBuiltOptions(false)

                                }}
                                style={
                                  yearBuiltRange === option
                                    ? activePill
                                    : pill
                                }
                              >
                                {residentialLabels[option] || option}
                              </button>

                            ))}

                          </div>

                        </div>

                      )}

                    </div>

                  </>

                )}

              </div>

            )

}



const sectionHeading = {
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
  border:'1px solid #D4AF37',
  color:'#fff'
}

const summaryCard = {
      display:'flex',
      justifyContent:'space-between',
      alignItems:'center',
      background:'#181818',
      border:'1px solid #D4AF37',
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
