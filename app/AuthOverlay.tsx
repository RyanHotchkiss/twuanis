'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'

import {
  startListingPublishFlow
} from '@/app/utils/startListingPublishFlow'

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
  const es = usePathname().startsWith('/es')

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
          {es ? 'Confirmar publicación por correo' : 'Confirm Publication by Email'}
        </h2>

        <p style={{
          color:'#888',
          lineHeight:'1.7',
          margin:0
        }}>
          {es ? 'Se conserva el contacto del anuncio:' : 'Your listing contact remains:'}
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

          {es ? 'Enviaremos un enlace seguro al correo de su cuenta.' : 'A secure publishing link will be sent to your signed-in account email.'}

          <div style={{
            marginTop:'1rem',

            fontSize:'2rem',

            color:'#FFFFFF',

            fontWeight:'bold'
          }}>
            {es ? 'Revise el correo de su cuenta' : 'Check your account email'}
          </div>

        </div>

      <button
        type="button"
        disabled={loading}
        onClick={async () => {
            if (loading) {
              return
            }

            setLoading(true)

            try {
              await startListingPublishFlow({
                phone:
                  whatsapp,

                propertyData
              })

              alert(
                es ? 'Revise el correo de su cuenta para confirmar la publicación.' : 'Check your account email for the publication confirmation link.'
              )

              onClose()
            } catch (error) {
              console.error(
                'AUTH OVERLAY PUBLISH ERROR:',
                error
              )

              alert(
                error instanceof Error
                  ? error.message
                  : es ? 'No se pudo enviar el enlace.' : 'The link could not be sent.'
              )
            } finally {
              setLoading(false)
            }
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
              ? (es ? 'Enviando...' : 'Sending...')
              : (es ? 'Enviar correo de publicación' : 'Send Publication Email')}
          </button>

      </div>

    </div>

  )

}