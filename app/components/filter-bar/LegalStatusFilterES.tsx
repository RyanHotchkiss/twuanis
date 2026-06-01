'use client'

type LegalStatusFilterProps = {
  selectedlegal_status: string
  setSelectedlegal_status: (value: string) => void

  showlegal_statusOptions: boolean
  setShowlegal_statusOptions: (
    value: boolean
  ) => void

  setShowTerrainOptions: (
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

export default function LegalStatusFilter({
  selectedlegal_status,
  setSelectedlegal_status,

  showlegal_statusOptions,
  setShowlegal_statusOptions,

  setShowTerrainOptions,

  setShowProvinceOptions,
  setShowCantonOptions,
  setShowDistrictOptions 

}: LegalStatusFilterProps) {

  const legalStatuses = [
    'Propiedad Titulada',
    'Plano Disponible',
    'Propiedad en Concesión',
    'Financiamiento Disponible'
  ]

  return (

    <div>

      <p style={miniHeading}>
        ESTADO LEGAL
      </p>

      {showlegal_statusOptions && (

        <div style={pillWrap}>

          {legalStatuses.map((status) => (

            <button
              key={status}
              onClick={() => {

                setSelectedlegal_status(status)

                setShowTerrainOptions(false)

                setShowlegal_statusOptions(false) 

                setShowProvinceOptions(false)

                setShowCantonOptions(false)

                setShowDistrictOptions(false)

              }}
              style={
                selectedlegal_status === status
                  ? activePill
                  : pill
              }
            >
              {status}
            </button>

          ))}

        </div>

      )}

      {!showlegal_statusOptions &&
      selectedlegal_status && (

        <div style={summaryCard}>

          <span
            onClick={() => {

              setShowlegal_statusOptions(true)

            }}
            style={{
              ...breadcrumbText,
              cursor:'pointer'
            }}
          >
            {selectedlegal_status}
          </span>

          <button
            type="button"
            onClick={() => {

              setSelectedlegal_status('')

              setShowlegal_statusOptions(true)

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

import LegalStatusFilter from '@/app/components/filter-bar/LegalStatusFilterES'

USAGE:

<LegalStatusFilterES
  selectedlegal_status={selectedlegal_status}
  setSelectedlegal_status={setSelectedlegal_status}
/>

*/