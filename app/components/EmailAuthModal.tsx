'use client'

import {
  FormEvent,
  useState
} from 'react'

import { supabase } from '@/lib/supabase'
import { usePathname } from 'next/navigation'
import { authLocale, authReturnContext, safeAuthNext, authRedirect, usableAuthUser } from '@/lib/auth/account-access'
import { accountCopy, safeAuthError } from '@/lib/auth/account-copy'

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
  redirectTo
}: EmailAuthModalProps) {
  const pathname=usePathname()
  const locale=redirectTo?.includes('?')?authReturnContext('?'+redirectTo.split('?')[1]+'&next='+encodeURIComponent(redirectTo.split('?')[0])).locale:authLocale(redirectTo || pathname)
  const t=accountCopy(locale)
  const destination=safeAuthNext(redirectTo,locale)
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

    if (normalizedEmail.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setErrorMessage(
        t.invalidEmail
      )
      return
    }

    if (
      mode !== 'forgot-password' &&
      password.length < 6
    ) {
      setErrorMessage(
        t.shortPassword
      )
      return
    }

    if (
      mode === 'sign-up' &&
      password !== confirmPassword
    ) {
      setErrorMessage(
        t.mismatch
      )
      return
    }

    try {
      setLoading(true)
      clearMessages()

      if (mode === 'sign-in') {
        const { data, error } =
          await supabase.auth
            .signInWithPassword({
              email: normalizedEmail,
              password
            })

        if (error) {throw error}
        if(!data.session)throw new Error('auth_context')
        await usableAuthUser()
        window.location.href = destination

        return
      }

      if (mode === 'sign-up') {
        const callbackUrl=authRedirect('/auth/callback',destination,locale)

        const {
          data,
          error
        } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo:
              callbackUrl
          }
        })

        if (error) {
          throw error
        }

        if (data.session && data.user?.email_confirmed_at) {
          await usableAuthUser()
          window.location.href =
            destination

          return
        }

        setMessage(
          t.confirmation
        )

        return
      }

      const resetUrl=authRedirect('/auth/reset-password',destination,locale)

      const { error } =
        await supabase.auth
          .resetPasswordForEmail(
            normalizedEmail,
            {
              redirectTo:
                resetUrl
            }
          )

      if (error) {
        throw error
      }

      setMessage(
        t.recoverySent
      )
    } catch (error) {
      setErrorMessage(safeAuthError(error,locale))
    } finally {
      setLoading(false)
    }
  }

  const headingText=mode==='sign-in'?t.signInTitle:mode==='sign-up'?t.signUpTitle:t.resetTitle
  const descriptionText=mode==='sign-in'?t.signInDescription:mode==='sign-up'?t.signUpDescription:t.resetDescription
  const submitText=mode==='sign-in'?t.signIn:mode==='sign-up'?t.signUp:t.reset

  return (
    <div style={overlay}>
      <div style={modal}>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={closeButton}
            aria-label={t.close}
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
            placeholder={t.email}
            aria-label={t.email}
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
              placeholder={t.password}
              aria-label={t.password}
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
              placeholder={t.confirmPassword}
              aria-label={t.confirmPassword}
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
              ? t.working
              : submitText}
          </button>
        </form>

        {message && (
          <p role="status" style={successMessage}>
            {message}
          </p>
        )}

        {errorMessage && (
          <p role="alert" style={errorText}>
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
              {t.signIn}
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
              {t.signUp}
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
              {t.forgot}
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
  background: 'var(--surface)',
  color: 'var(--foreground)'
}

const closeButton = {
  position: 'absolute' as const,
  top: '1rem',
  right: '1.25rem',
  border: 'none',
  background: 'transparent',
  color: 'var(--muted)',
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
  color: 'var(--muted)',
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
  background: 'var(--surface-raised)',
  color: 'var(--foreground)',
  fontSize: '1rem'
}

const submitButton = {
  width: '100%',
  padding: '1rem',
  border: 'none',
  borderRadius: '999rem',
  background: 'var(--foreground)',
  color: 'var(--background)',
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
  color: 'var(--success-text)',
  lineHeight: 1.6
}

const errorText = {
  marginTop: '1rem',
  color: 'var(--error-text)',
  lineHeight: 1.6
}