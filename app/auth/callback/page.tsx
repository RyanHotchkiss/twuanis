'use client'

import {
  useEffect,
  useState
} from 'react'

import { useRouter } from 'next/navigation'

import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  const [message, setMessage] =
    useState(
      'Completing your secure sign-in...'
    )

  useEffect(() => {
  let mounted = true

  async function completeAuthentication() {
    const params =
      new URLSearchParams(
        window.location.search
      )

    const next =
      params.get('next') ||
      '/en/market-hub'

    const {
      data: { session },
      error
    } = await supabase.auth.getSession()

    if (!mounted) {
      return
    }

    if (error) {
      console.error(error)

      setMessage(
        'We could not complete your sign-in.'
      )

      return
    }

    if (session) {
      router.replace(next)
      router.refresh()
      return
    }

    const {
      data: { subscription }
    } =
      supabase.auth.onAuthStateChange(
        event => {
          if (
            event === 'SIGNED_IN' ||
            event === 'INITIAL_SESSION'
          ) {
            router.replace(next)
            router.refresh()
          }
        }
      )

    window.setTimeout(() => {
      if (mounted) {
        setMessage(
          'The sign-in link may have expired. Please request another link.'
        )
      }
    }, 8000)

    return () => {
      subscription.unsubscribe()
    }
  }

  let unsubscribe:
    | (() => void)
    | undefined

  completeAuthentication().then(
    cleanup => {
      unsubscribe = cleanup
    }
  )

  return () => {
    mounted = false
    unsubscribe?.()
  }
}, [router])
    return (
    <main style={main}>
      <div style={card}>
        <h1 style={heading}>
          MarketHub
        </h1>

        <p style={messageStyle}>
          {message}
        </p>
      </div>
    </main>
  )
}

const main = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
  background: '#0a0a0a',
  color: '#fff'
}

const card = {
  width: '100%',
  maxWidth: '34rem',
  padding: '2rem',
  border: '1px solid #222',
  borderRadius: '2rem',
  background: '#111',
  textAlign: 'center' as const
}

const heading = {
  margin: 0,
  color: '#D4AF37',
  fontSize: '2.25rem'
}

const messageStyle = {
  margin: '1rem 0 0',
  color: '#aaa',
  lineHeight: 1.7
}