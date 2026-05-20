'use client'

type AdvancedFiltersToggleProps = {
  showadvanced_filters: boolean
  setShowadvanced_filters: (value: boolean) => void
  children: React.ReactNode
}

export default function AdvancedFiltersToggle({
  showadvanced_filters,
  setShowadvanced_filters,
  children
}: AdvancedFiltersToggleProps) {

  return (

    <div>

      <div style={topBar}>

        <h3 style={filterHeading}>
          Advanced Filters
        </h3>

        <button
          onClick={(e) => {
            e.preventDefault()

            setShowadvanced_filters(
              !showadvanced_filters
            )
          }}
          style={toggleButton}
        >
          {showadvanced_filters
            ? 'Collapse'
            : 'Expand'}
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
  color:'#ffffff50'
}

const toggleButton = {
  background:'transparent',
  border:'none',
  color:'#00ff99',
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

import AdvancedFiltersToggle from '@/app/components/filter-bar/AdvancedFiltersToggle'

USAGE:

<AdvancedFiltersToggle
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