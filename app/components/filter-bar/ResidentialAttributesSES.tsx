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

  constructionArea: string
  setConstructionArea: (value: string) => void

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
  constructionAreaOptions: string[]

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

  showConstructionAreaOptions: boolean
  setShowConstructionAreaOptions: (
    value: boolean
  ) => void

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

  constructionArea,
  setConstructionArea,

  bedroomOptions,
  bathroomOptions,
  parkingOptions,
  yearBuiltOptions,
  constructionAreaOptions,

  showBedroomOptions,
  setShowBedroomOptions,

  showBathroomOptions,
  setShowBathroomOptions,

  showParkingOptions,
  setShowParkingOptions,

  showYearBuiltOptions,
  setShowYearBuiltOptions,

  showConstructionAreaOptions,
  setShowConstructionAreaOptions,

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

                    <span style={{
                            color:'#FFFFFF',
                            lineHeight:'1.7',
                            wordBreak:'break-word',
                            paddingRight:'1rem',
                            flex:'1',
                            display:'flex',
                            flexWrap:'wrap',
                            alignItems:'center',
                            gap:'.5rem'
                          }}>

                            {bedrooms && (
                              <>
                                <span>{bedrooms}</span>
                                <span style={{ color:'#fff' }}>•</span>
                              </>
                            )}

                            {bathrooms && (
                              <>
                                <span>{bathrooms}</span>
                                <span style={{ color:'#fff' }}>•</span>
                              </>
                            )}

                            {parking && (
                              <>
                                <span>{parking}</span>
                                <span style={{ color:'#fff' }}>•</span>
                              </>
                            )}

                            {yearBuiltRange && (
                              <>
                                <span>{yearBuiltRange}</span>
                                <span style={{ color:'#fff' }}>•</span>
                              </>
                            )}

                            {constructionArea && (
                              <span>{constructionArea}</span>
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
                        setConstructionArea('')

                        setShowResidentialSummary(false)

                        setShowBedroomOptions(true)
                        setShowBathroomOptions(false)
                        setShowParkingOptions(false)
                        setShowYearBuiltOptions(false)
                        setShowConstructionAreaOptions(false)

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
                            {bedrooms}
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
                                key={option}
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
                                {option}
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
                            {bathrooms}
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
                                key={option}
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
                                {option}
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
                            {parking}
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
                                key={option}
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
                                {option}
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
                            {yearBuiltRange}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {

                              e.stopPropagation()

                              setYearBuiltRange('')

                              setShowYearBuiltOptions(true)
                              setShowConstructionAreaOptions(false)

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
                                key={option}
                                onClick={() => {

                                  setYearBuiltRange(option)

                                  setShowYearBuiltOptions(false)
                                  setShowConstructionAreaOptions(true)

                                }}
                                style={
                                  yearBuiltRange === option
                                    ? activePill
                                    : pill
                                }
                              >
                                {option}
                              </button>

                            ))}

                          </div>

                        </div>

                      )}

                    </div>

                    {/* CONSTRUCTION AREA */}

                    <div>

                      {!showConstructionAreaOptions && constructionArea && (

                        <div
                          style={{
                            ...summaryCard,
                            cursor:'pointer'
                          }}
                          onClick={() => {

                            setShowConstructionAreaOptions(true)

                          }}
                        >

                          <span>
                            {constructionArea}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {

                              e.stopPropagation()

                              setConstructionArea('')

                              setShowConstructionAreaOptions(true)

                            }}
                            style={resetButton}
                          >
                            ✕
                          </button>

                        </div>

                      )}

                      {showConstructionAreaOptions && (

                        <div>

                          <h2 style={sectionHeading}>
                            Área de Construcción
                          </h2>

                          <div style={pillWrap}>

                            {constructionAreaOptions.map((option) => (

                              <button
                                type="button"
                                key={option}
                                onClick={() => {

                                  setConstructionArea(option)

                                  setShowConstructionAreaOptions(false)

                                  setShowBedroomOptions(false)
                                  setShowBathroomOptions(false)
                                  setShowParkingOptions(false)
                                  setShowYearBuiltOptions(false)

                                  setShowResidentialSummary(true)

                                  setShowproperty_typeOptions(false)

                                  setShowproperty_areaOptions(true)

                                }}
                                style={
                                  constructionArea === option
                                    ? activePill
                                    : pill
                                }
                              >
                                {option}
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
