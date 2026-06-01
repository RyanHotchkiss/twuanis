'use client'

import {
  publishRentLeaseCsvListings
} from '@/app/utils/publishRentLeaseCsvListings'

type CsvPublishActionsProps = {
  csvListings: any[]
  setCsvListings: (value: any[]) => void
  setShowCsvStaging: (value: boolean) => void
}

export default function CsvPublishActions({
  csvListings,
  setCsvListings,
  setShowCsvStaging
}: CsvPublishActionsProps) {

  return (

    <div style={container}>

      <button
        onClick={() =>
        publishRentLeaseCsvListings(
            csvListings,
            setShowCsvStaging,
            setCsvListings
        )
        }
        style={publishButton}
      >
        Publish Listings
      </button>

    </div>

  )

}

const container = {
  marginTop:'3rem'
}

const publishButton = {
  width:'100%',
  background:'#00ff99',
  color:'#000',
  border:'none',
  borderRadius:'1.5rem',
  padding:'1.5rem',
  fontSize:'1.4rem',
  fontWeight:'bold',
  cursor:'pointer'
}