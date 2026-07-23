'use client'

import {
  FormEvent,
  useState
} from 'react'

import { supabase } from '@/lib/supabase'

type EmailAuthModalProps = {
  onClose?: () => void
  redirectTo?: string
}

export default function EmailAuthModal({
  onClose,
  redirectTo = '/en/market-hub'
}: EmailAuthModalProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] =
    useState(false)
  const [message, setMessage] =
    useState('')
  const [errorMessage, setErrorMessage] =
    useState('')

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    const normalizedEmail =
      email.trim().toLowerCase()

    if (!normalizedEmail) {
      setErrorMessage(
        'Enter your email address.'
      )
      return
    }

    try {
      setLoading(true)
      setMessage('')
      setErrorMessage('')

      const callbackUrl =
        new URL(
          '/auth/callback',
          window.location.origin
        )

      callbackUrl.searchParams.set(
        'next',
        redirectTo
      )

      callbackUrl.searchParams.set(
        'publish',
        'true'
      )

      const { error } =
        await supabase.auth.signInWithOtp({
          email: normalizedEmail,
          options: {
            emailRedirectTo:
              callbackUrl.toString(),
            shouldCreateUser: true
          }
        })

      if (error) {
        throw error
      }

      setMessage(
        'Check your email and click the secure sign-in link.'
      )
    } catch (error) {
      console.error(error)

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to send the sign-in link.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={overlay}>
      <div style={modal}>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={closeButton}
            aria-label="Close"
          >
            ×
          </button>
        )}

        <h2 style={heading}>
          Sign In to MarketHub
        </h2>

        <p style={description}>
          Enter your email address. We will
          send you a secure sign-in link.
        </p>

        <form
          onSubmit={handleSubmit}
          style={form}
        >
          <input
            type="email"
            value={email}
            onChange={event =>
              setEmail(event.target.value)
            }
            placeholder="you@example.com"
            autoComplete="email"
            required
            style={input}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              ...submitButton,
              opacity: loading ? 0.65 : 1
            }}
          >
            {loading
              ? 'Sending...'
              : 'Send Secure Link'}
          </button>
        </form>
                    {message && (
          <p style={successMessage}>
            {message}
          </p>
        )}

        {errorMessage && (
          <p style={errorText}>
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  )
}

const overlay = {
  position: 'fixed' as const,
  inset: 0,
  zIndex: 99999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1.5rem',
  background: 'rgba(0,0,0,.9)',
  backdropFilter: 'blur(12px)'
}

const modal = {
  position: 'relative' as const,
  width: '100%',
  maxWidth: '32rem',
  padding: '2rem',
  border: '1px solid #222',
  borderRadius: '2rem',
  background: '#111',
  color: '#fff'
}

const closeButton = {
  position: 'absolute' as const,
  top: '1rem',
  right: '1.25rem',
  border: 'none',
  background: 'transparent',
  color: '#888',
  fontSize: '2rem',
  cursor: 'pointer'
}

const heading = {
  margin: 0,
  color: '#D4AF37',
  fontSize: '2rem',
  textAlign: 'center' as const
}

const description = {
  margin: '1rem 0 1.5rem',
  color: '#aaa',
  lineHeight: 1.7,
  textAlign: 'center' as const
}

const form = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '1rem'
}

const input = {
  width: '100%',
  padding: '1rem',
  border: '1px solid #333',
  borderRadius: '1rem',
  background: '#181818',
  color: '#fff',
  fontSize: '1rem'
}

const submitButton = {
  width: '100%',
  padding: '1rem',
  border: 'none',
  borderRadius: '999rem',
  background: '#fff',
  color: '#000',
  fontSize: '1rem',
  fontWeight: 700,
  cursor: 'pointer'
}

const successMessage = {
  marginTop: '1rem',
  color: '#7ee2a8',
  lineHeight: 1.6
}

const errorText = {
  marginTop: '1rem',
  color: '#ff8b8b',
  lineHeight: 1.6
}