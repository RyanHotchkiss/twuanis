'use client'

type TerrainFilterProps = {
  selectedterrain: string
  setSelectedterrain: (value: string) => void
}

export default function TerrainFilter({
  selectedterrain,
  setSelectedterrain
}: TerrainFilterProps) {

  const terrainOptions = [
    'Flat',
    'Mostly Flat',
    'Rolling Hills',
    'Steep Slope',
    'Mountainous',
    'Rocky',
    'Forested',
    'River Valley',
    'Cleared Land',
    'Jungle Terrain',
    'Build Ready',
    'Agricultural Terrain'
  ]

  return (

    <div>

      <h3 style={filterHeading}>
        TERRAIN
      </h3>

      <div style={pillWrap}>

        {terrainOptions.map((option) => (

          <button
            key={option}
            onClick={() =>
              setSelectedterrain(
                selectedterrain === option
                  ? ''
                  : option
              )
            }
            style={
              selectedterrain === option
                ? activePill
                : pill
            }
          >
            {option}
          </button>

        ))}

      </div>

    </div>

  )

}

const filterHeading = {
  fontSize:'1rem',
  marginBottom:'1rem',
  color:'#ffffff50'
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

/*

IMPORT:

import TerrainFilter from '@/app/components/filter-bar/TerrainFilter'

USAGE:

<TerrainFilter
  selectedterrain={selectedterrain}
  setSelectedterrain={setSelectedterrain}
/>

*/