'use client'

type EnvironmentFilterProps = {

  selectedenvironment: string

  setSelectedenvironment: (value: string) => void

}

export default function EnvironmentFilter({

  selectedenvironment,

  setSelectedenvironment

}: EnvironmentFilterProps) {

  const environments = [

    'Urban',

    'Riverfront',

    'Beachfront',

    'Mountain View',

    'Jungle',

    'Rural',

    'Lakefront'

  ]

  return (

    <div>

      <h3 style={filterHeading}>

        ENVIRONMENT

      </h3>

      <div style={pillWrap}>

        {environments.map((environment) => (

          <button

            key={environment}

            onClick={() =>

              setSelectedenvironment(

                selectedenvironment === environment

                  ? ''

                  : environment

              )

            }

            style={

              selectedenvironment === environment

                ? activePill

                : pill

            }

          >

            {environment}

          </button>

        ))}

      </div>

    </div>

  )

}

const filterHeading = {

  fontSize:'1rem',

  marginBottom:'1rem',

  color:'#ff3b00'

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

import EnvironmentFilter from '@/app/components/filter-bar/EnvironmentFilter'

USAGE:

<EnvironmentFilter

  selectedenvironment={selectedenvironment}

  setSelectedenvironment={setSelectedenvironment}

/>

*/