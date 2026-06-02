'use client'

import {
  publishCsvListings
} from '@/app/utils/publishCsvListings'

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
          publishCsvListings(
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
  background:'#FFFFFF',
  color:'#000',
  border:'none',
  borderRadius:'1.5rem',
  padding:'1.5rem',
  fontSize:'1.4rem',
  fontWeight:'bold',
  cursor:'pointer'
}