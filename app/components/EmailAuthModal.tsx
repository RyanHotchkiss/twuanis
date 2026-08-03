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

type AuthMode =
  | 'sign-in'
  | 'sign-up'
  | 'forgot-password'

export default function EmailAuthModal({
  onClose,
  redirectTo = '/en/market-hub'
}: EmailAuthModalProps) {
  const [mode, setMode] =
    useState<AuthMode>('sign-in')

  const [email, setEmail] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [confirmPassword, setConfirmPassword] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  const [message, setMessage] =
    useState('')

  const [errorMessage, setErrorMessage] =
    useState('')

  function clearMessages() {
    setMessage('')
    setErrorMessage('')
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode)
    setPassword('')
    setConfirmPassword('')
    clearMessages()
  }

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

    if (
      mode !== 'forgot-password' &&
      password.length < 6
    ) {
      setErrorMessage(
        'Your password must contain at least 6 characters.'
      )
      return
    }

    if (
      mode === 'sign-up' &&
      password !== confirmPassword
    ) {
      setErrorMessage(
        'The passwords do not match.'
      )
      return
    }

    try {
      setLoading(true)
      clearMessages()

      if (mode === 'sign-in') {
        const { error } =
          await supabase.auth
            .signInWithPassword({
              email: normalizedEmail,
              password
            })

        if (error) {
          throw error
        }

        window.location.href =
          redirectTo

        return
      }

      if (mode === 'sign-up') {
        const callbackUrl =
          new URL(
            '/auth/callback',
            window.location.origin
          )

        callbackUrl.searchParams.set(
          'next',
          redirectTo
        )

        const {
          data,
          error
        } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo:
              callbackUrl.toString()
          }
        })

        if (error) {
          throw error
        }

        if (data.session) {
          window.location.href =
            redirectTo

          return
        }

        setMessage(
          'Account created. Check your email to confirm your account.'
        )

        return
      }

      const resetUrl =
        new URL(
          '/auth/reset-password',
          window.location.origin
        )

      resetUrl.searchParams.set(
        'next',
        redirectTo
      )

      const { error } =
        await supabase.auth
          .resetPasswordForEmail(
            normalizedEmail,
            {
              redirectTo:
                resetUrl.toString()
            }
          )

      if (error) {
        throw error
      }

      setMessage(
        'Check your email for the password-reset link.'
      )
    } catch (error) {
      console.error(
        'MARKETHUB AUTH ERROR:',
        error
      )

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Authentication failed.'
      )
    } finally {
      setLoading(false)
    }
  }

  const headingText =
    mode === 'sign-in'
      ? 'Sign In to MarketHub'
      : mode === 'sign-up'
        ? 'Create Your MarketHub Account'
        : 'Reset Your Password'

  const descriptionText =
    mode === 'sign-in'
      ? 'Enter your email address and password.'
      : mode === 'sign-up'
        ? 'Create an account using your email address and password.'
        : 'Enter your email address. We will send you a password-reset link.'

  const submitText =
    mode === 'sign-in'
      ? 'Sign In'
      : mode === 'sign-up'
        ? 'Create Account'
        : 'Send Reset Link'

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
          {headingText}
        </h2>

        <p style={description}>
          {descriptionText}
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

          {mode !== 'forgot-password' && (
            <input
              type="password"
              value={password}
              onChange={event =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="Password"
              autoComplete={
                mode === 'sign-in'
                  ? 'current-password'
                  : 'new-password'
              }
              required
              minLength={6}
              style={input}
            />
          )}

          {mode === 'sign-up' && (
            <input
              type="password"
              value={confirmPassword}
              onChange={event =>
                setConfirmPassword(
                  event.target.value
                )
              }
              placeholder="Confirm password"
              autoComplete="new-password"
              required
              minLength={6}
              style={input}
            />
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...submitButton,
              opacity: loading
                ? 0.65
                : 1,
              cursor: loading
                ? 'not-allowed'
                : 'pointer'
            }}
          >
            {loading
              ? 'Working...'
              : submitText}
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

        <div style={authLinks}>
          {mode !== 'sign-in' && (
            <button
              type="button"
              onClick={() =>
                changeMode('sign-in')
              }
              style={textButton}
            >
              Sign In
            </button>
          )}

          {mode !== 'sign-up' && (
            <button
              type="button"
              onClick={() =>
                changeMode('sign-up')
              }
              style={textButton}
            >
              Create Account
            </button>
          )}

          {mode !==
            'forgot-password' && (
            <button
              type="button"
              onClick={() =>
                changeMode(
                  'forgot-password'
                )
              }
              style={textButton}
            >
              Forgot Password?
            </button>
          )}
        </div>
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
  boxSizing: 'border-box' as const,
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
  fontWeight: 700
}

const authLinks = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  justifyContent: 'center',
  gap: '0.75rem 1.25rem',
  marginTop: '1.5rem'
}

const textButton = {
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: '#D4AF37',
  fontSize: '0.95rem',
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