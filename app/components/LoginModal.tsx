'use client'

import { useState } from 'react'

export default function LoginModal() {
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function sendOTP() {
    try {
      setLoading(true)
      setMessage('')

      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      })

      const data = await response.json()

      if (data.success) {
        setStep('code')
        setMessage('Verification code sent via WhatsApp.')
        console.log('SWITCHING TO CODE STEP')
      } else {
        setMessage('Failed to send verification code.')
      }
    } catch (error) {
      console.error(error)
      setMessage('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  async function verifyOTP() {
    try {
      setLoading(true)
      setMessage('')

      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          code,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage('Successfully logged in.')
      } else {
        setMessage('Invalid verification code.')
      }
    } catch (error) {
      console.error(error)
      setMessage('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: '90%',
          maxWidth: '420px',
          background: '#111',
          padding: '2rem',
          borderRadius: '16px',
          color: '#fff',
        }}
      >
        <h2
          style={{
            marginBottom: '1rem',
            fontSize: '1.5rem',
          }}
        >
          Twuanis Login
        </h2>

        {step === 'phone' && (
          <>
            <input
              type="tel"
              placeholder="+50684479916"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid #333',
                marginBottom: '1rem',
                background: '#222',
                color: '#fff',
              }}
            />

            <button
              onClick={sendOTP}
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '8px',
                border: 'none',
                background: '#25D366',
                color: '#000',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </>
        )}

        {step === 'code' && (
          <>
            <input
              type="text"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid #333',
                marginBottom: '1rem',
                background: '#222',
                color: '#fff',
                letterSpacing: '0.5rem',
                textAlign: 'center',
                fontSize: '1.25rem',
              }}
            />

            <button
              onClick={verifyOTP}
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '8px',
                border: 'none',
                background: '#25D366',
                color: '#000',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </>
        )}

        {message && (
          <p
            style={{
              marginTop: '1rem',
              color: '#ccc',
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  )
}