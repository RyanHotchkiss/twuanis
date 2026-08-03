'use client'

import {
  FormEvent,
  useState
} from 'react'

import { useRouter } from 'next/navigation'

import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()

  const [password, setPassword] =
    useState('')

  const [confirmPassword, setConfirmPassword] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState('')

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (password.length < 6) {
      setErrorMessage(
        'Your password must contain at least 6 characters.'
      )
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage(
        'The passwords do not match.'
      )
      return
    }

    try {
      setLoading(true)
      setErrorMessage('')

      const { error } =
        await supabase.auth.updateUser({
          password
        })

      if (error) {
        throw error
      }

      const next =
        new URLSearchParams(
          window.location.search
        ).get('next')

      router.replace(
        next || '/en/market-hub'
      )
    } catch (error) {
      console.error(
        'PASSWORD RESET ERROR:',
        error
      )

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to update password.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={page}>
      <section style={card}>
        <h1 style={heading}>
          Create a New Password
        </h1>

        <form
          onSubmit={handleSubmit}
          style={form}
        >
          <input
            type="password"
            value={password}
            onChange={event =>
              setPassword(
                event.target.value
              )
            }
            placeholder="New password"
            autoComplete="new-password"
            required
            minLength={6}
            style={input}
          />

          <input
            type="password"
            value={confirmPassword}
            onChange={event =>
              setConfirmPassword(
                event.target.value
              )
            }
            placeholder="Confirm new password"
            autoComplete="new-password"
            required
            minLength={6}
            style={input}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              ...button,
              opacity: loading
                ? 0.65
                : 1
            }}
          >
            {loading
              ? 'Saving...'
              : 'Save Password'}
          </button>
        </form>

        {errorMessage && (
          <p style={errorText}>
            {errorMessage}
          </p>
        )}
      </section>
    </main>
  )
}

const page = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1.5rem',
  background: '#0a0a0a'
}

const card = {
  width: '100%',
  maxWidth: '32rem',
  padding: '2rem',
  border: '1px solid #222',
  borderRadius: '2rem',
  background: '#111',
  color: '#fff'
}

const heading = {
  margin: '0 0 1.5rem',
  color: '#D4AF37',
  textAlign: 'center' as const
}

const form = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '1rem'
}

const input = {
  width: '100%',
  boxSizing: 'border-box' as const,
  padding: '1rem',
  border: '1px solid #333',
  borderRadius: '1rem',
  background: '#181818',
  color: '#fff',
  fontSize: '1rem'
}

const button = {
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

const errorText = {
  marginTop: '1rem',
  color: '#ff8b8b',
  lineHeight: 1.6
}