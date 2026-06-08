'use client'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

type AuthOverlayProps = {
  whatsapp: string

  propertyData: any

  formatWhatsAppNumber: (
    value: string
  ) => string

  onVerify: () => void

  onClose: () => void
}

export default function AuthOverlay({

  whatsapp,

  propertyData,

  formatWhatsAppNumber,

  onVerify,

  onClose

}: AuthOverlayProps)

{
  const [step, setStep] = useState<'send' | 'verify'>('send')
  const [code, setCode] = useState('')
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

          Open WhatsApp and tap:

          <div style={{
            marginTop:'1rem',

            fontSize:'2rem',

            color:'#FFFFFF',

            fontWeight:'bold'
          }}>
            “Pura Vida!”
          </div>

        </div>

      {step === 'send' && (

                  <button
                    onClick={async () => {

console.log(
    'SEND OTP CLICKED'
  )
  console.log(
    'WHATSAPP:',
    whatsapp
  )

                      setLoading(true)

                      const response = await fetch('/api/send-otp', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                        phone: whatsapp,
                        listingData: propertyData
                      })
                      })

const data = await response.json()

alert(
  JSON.stringify(
    data,
    null,
    2
  )
)

console.log(
  'SEND OTP RESPONSE:',
  data
)

                      setLoading(false)

                      if (!data.success) {
                        alert(data.error)
                        return
                      }

                      setStep('verify')
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
                      : 'Send Verification Code'}
                  </button>

                )}

                {step === 'verify' && (

                  <div
                    style={{
                      display:'flex',
                      flexDirection:'column',
                      gap:'1rem'
                    }}
                  >

                    <input
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value)
                      }

                      style={{
                        background:'#181818',
                        border:'1px solid #333',
                        borderRadius:'1rem',
                        padding:'1rem',
                        color:'#fff',
                        textAlign:'center',
                        fontSize:'1.25rem',
                        letterSpacing:'.3rem'
                      }}
                    />

                    <button
                      onClick={async () => {

                        setLoading(true)

                        const response = await fetch(
                          '/api/verify-otp',
                          {
                            method:'POST',
                            headers:{
                              'Content-Type':'application/json'
                            },
                            body: JSON.stringify({
                              phone: whatsapp,
                              code
                            })
                          }
                        )

                        const data = await response.json()

                        setLoading(false)

                        if (!data.success) {
                          alert(data.error)
                          return
                        }

                        localStorage.setItem(
                          'twuanis_verified_phone',
                          whatsapp
                        )

                        onVerify()
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
                        ? 'Verifying...'
                        : 'Verify & Publish Listing'}
                    </button>

                  </div>

                )}

      </div>

    </div>

  )

}