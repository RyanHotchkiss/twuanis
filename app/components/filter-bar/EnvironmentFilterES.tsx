'use client'

type EnvironmentFilterProps = {

    selectedenvironment: string[]

    setSelectedenvironment: (
      value: string[]
    ) => void

  showenvironmentOptions: boolean

  setShowenvironmentOptions: (
    value: boolean
  ) => void

  setShowAccessibilityOptions: (
  value: boolean
) => void

}

export default function EnvironmentFilter({

  selectedenvironment,

  setSelectedenvironment,

  showenvironmentOptions,

  setShowenvironmentOptions

}: EnvironmentFilterProps) {

  const environments = [

    'Urbano',
    'Frente al Río',
    'Frente a la Playa',
    'Vista a la Montaña',
    'Selva',
    'Rural',
    'Frente al Lago'

  ]

  return (

    <div>

      <p style={miniHeading}>

        ENTORNO

      </p>

      {showenvironmentOptions && (

  <div style={pillWrap}>

    {environments.map((environment) => (

      <button

              key={environment}

              onClick={() => {

                if (
                  selectedenvironment.includes(environment)
                ) {

                  setSelectedenvironment(
                    selectedenvironment.filter(
                      (item) => item !== environment
                    )
                  )

                } else {

                  setSelectedenvironment([
                    ...selectedenvironment,
                    environment
                  ])

                }

              }}

              style={

                selectedenvironment.includes(environment)

                  ? activePill

                  : pill

              }

            >

        {environment}

      </button>

    ))}

  </div>

)}

{!showenvironmentOptions &&
selectedenvironment.length > 0 && (

      <div style={summaryCard}>

                  <span
                    onClick={() => {

                      setShowenvironmentOptions(
                        true
                      )

                    }}
                    style={{
                      ...breadcrumbText,
                      cursor:'pointer'
                    }}
                  >
                    {selectedenvironment.map((item, index) => (

                            <span key={item}>

                              {index > 0 && (
                                <span style={{ color:'#fff' }}>
                                  {' • '}
                                </span>
                              )}

                              {item}

                            </span>

                          ))}
                  </span>

                  <button
                    type="button"
                    onClick={() => {

                      setSelectedenvironment([])

                      setShowenvironmentOptions(
                        true
                      )

                    }}
                    style={resetButton}
                  >
                    ✕
                  </button>

                </div>

              )}

    </div>
  
  )}

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
  border:'1px solid #D4AF3750',
  color:'#fff',
  padding:'.85rem 1rem',
  borderRadius:'999rem',
  cursor:'pointer',
  transition:'all .2s ease'
}

const activePill = {
  ...pill,
  background:'#00ff9970',
  border:'1px solid #D4AF3750',
  color:'#fff'
}

const summaryCard = {
  display:'flex',
  justifyContent:'space-between',
  alignItems:'flex-start',
  background:'#181818',
  border:'1px solid #D4AF3750',
  borderRadius:'1rem',
  padding:'1rem',
  marginTop:'1rem'
}

const breadcrumbText = {
  color:'#D4AF37',
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

import EnvironmentFilter from '@/app/components/filter-bar/EnvironmentFilter'

USAGE:

<EnvironmentFilterES

  selectedenvironment={selectedenvironment}

  setSelectedenvironment={setSelectedenvironment}

/>

*/