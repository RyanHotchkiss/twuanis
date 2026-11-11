'use client'

import { useState } from 'react'

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

    const [isPublishing, setIsPublishing] =
      useState(false)

    async function handlePublish() {
      if (isPublishing) return

      setIsPublishing(true)

      try {
        await publishRentLeaseCsvListings(
          csvListings,
          setShowCsvStaging,
          setCsvListings
        )
      } finally {
        setIsPublishing(false)
      }
    }

  return (

    <div style={container}>

            <button
              onClick={handlePublish}
              disabled={isPublishing}
              style={{
                ...publishButton,
                background: isPublishing
                  ? '#666'
                  : '#FFFFFF',
                color: isPublishing
                  ? '#ccc'
                  : '#000',
                cursor: isPublishing
                  ? 'not-allowed'
                  : 'pointer'
              }}
            >
              {isPublishing
                ? 'Publishing...'
                : 'Publish Listings'}
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