'use client'

type AdvancedFiltersToggleProps = {
  showadvanced_filters: boolean
  setShowadvanced_filters: (value: boolean) => void
  setShowutilityOptions?: (value: boolean) => void
  setShowProvinceOptions: (
  value: boolean
    ) => void

    setShowCantonOptions: (
      value: boolean
    ) => void

    setShowDistrictOptions: (
      value: boolean
    ) => void
  children: React.ReactNode
}

export default function AdvancedFiltersToggle({
  showadvanced_filters,
  setShowadvanced_filters,
  setShowutilityOptions,
  children,
  setShowProvinceOptions,
  setShowCantonOptions,
  setShowDistrictOptions
}: AdvancedFiltersToggleProps) {

  return (

    <div>

      <div style={topBar}>

        <h3 style={filterHeading}>
          Filtros Avanzados
        </h3>

        <button
              onClick={(e) => {

                e.preventDefault()

                const nextState =
                  !showadvanced_filters

                setShowadvanced_filters(
                  nextState
                )

                if (nextState) {

                  setShowutilityOptions?.(false)

                  setShowProvinceOptions(false)

                  setShowCantonOptions(false)

                  setShowDistrictOptions(false)
                }

              }}
              style={toggleButton}
            >
              {showadvanced_filters
                ? 'Colapsar'
                : 'Expandir'}
            </button>

      </div>

      {showadvanced_filters && (

        <div style={advancedFiltersWrap}>
          {children}
        </div>

      )}

    </div>

  )

}

const topBar = {
  display:'flex',
  justifyContent:'space-between',
  alignItems:'center',
  marginBottom:'1rem'
}

const filterHeading = {
  fontSize:'1rem',
  marginBottom:0,
  color:'#D4AF37'
}

const toggleButton = {
  background:'transparent',
  border:'none',
  color:'#FFFFFF',
  fontSize:'13px',
  cursor:'pointer'
}

const advancedFiltersWrap = {
  display:'flex',
  flexDirection:'column' as const,
  gap:'24px'
}

/*

IMPORT:

import AdvancedFiltersToggle from '@/app/components/filter-bar/AdvancedFiltersToggleES'

USAGE:

<AdvancedFiltersToggleES
  showadvanced_filters={showadvanced_filters}
  setShowadvanced_filters={setShowadvanced_filters}
>

  <LegalStatusFilter
    selectedlegal_status={selectedlegal_status}
    setSelectedlegal_status={setSelectedlegal_status}
  />

  <EnvironmentFilter
    selectedenvironment={selectedenvironment}
    setSelectedenvironment={setSelectedenvironment}
  />

</AdvancedFiltersToggle>

*/