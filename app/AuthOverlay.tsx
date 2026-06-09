'use client'
import { useState } from 'react'

import {
  uploadListingImages
} from '@/app/utils/uploadListingImages'

type AuthOverlayProps = {
  whatsapp: string

  propertyData: any

  formatWhatsAppNumber: (
    value: string
  ) => string


  onClose: () => void
}

export default function AuthOverlay({

  whatsapp,

  propertyData,

  formatWhatsAppNumber,

  onClose

}: AuthOverlayProps)

{
  
  const [loading, setLoading] = useState(false)

  return (

    <div style={{
      position:'fixed',
      inset:0,

      background:'rgba(0,0,0,.92)',

      backdropFilter:'blur(12px)',

      zIndex:99999,

      display:'flex',
      justifyContent:'center',
      alignItems:'center',

      padding:'1.5rem'
    }}>

      <div style={{
        width:'100%',
        maxWidth:'32rem',

        background:'#111',

        border:'1px solid #222',

        borderRadius:'2rem',

        padding:'2rem',

        display:'flex',
        flexDirection:'column',

        gap:'1.5rem',

        textAlign:'center'
      }}>

        <h2 style={{
          fontSize:'2rem',
          color:'#D4AF37',
          margin:0
        }}>
          Verify Your WhatsApp
        </h2>

        <p style={{
          color:'#888',
          lineHeight:'1.7',
          margin:0
        }}>
          We sent a message to:
        </p>

        <div style={{
          fontSize:'2rem',
          color:'#FFFFFF',
          fontWeight:'bold'
        }}>
          +506 {
            formatWhatsAppNumber(
              whatsapp
            )
          }
        </div>

        <div style={{
          background:'#181818',

          border:'1px solid #222',

          borderRadius:'1rem',

          padding:'1.25rem',

          color:'#bbb',

          lineHeight:'1.8'
        }}>

          A secure publishing link will be sent to:

          <div style={{
            marginTop:'1rem',

            fontSize:'2rem',

            color:'#FFFFFF',

            fontWeight:'bold'
          }}>
            “Tuanis!”
          </div>

        </div>

      <button
  onClick={async () => {

    setLoading(true)

   const uploadedImageUrls =
          await uploadListingImages(
            propertyData.images
          )
        const updatedPropertyData = {
          ...propertyData,
          images: uploadedImageUrls
        }
        const response = await fetch(
          '/api/send-otp',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              phone: whatsapp,
              listingData:
                updatedPropertyData
            })
          }
        )

    const data = await response.json()

    setLoading(false)

    if (!data.success) {
      alert(data.error)
      return
    }

    alert('Tuanis!')

    onClose()

  }}
  style={{
    background:'#FFFFFF',
    color:'#000',
    border:'none',
    borderRadius:'999rem',
    padding:'1rem',
    fontWeight:'bold',
    cursor:'pointer',
    fontSize:'1rem'
  }}
>
  {loading
    ? 'Sending...'
    : 'Send WhatsApp Link'}
</button>

      </div>

    </div>

  )

}