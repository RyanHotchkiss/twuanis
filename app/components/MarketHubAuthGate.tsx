'use client'

import {
  ReactNode,
  useEffect,
  useState
} from 'react'

import type {
  User
} from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'

import EmailAuthModal from '@/app/components/EmailAuthModal'

type MarketHubAuthGateProps = {
  children: ReactNode
}

export default function MarketHubAuthGate({
  children
}: MarketHubAuthGateProps) {
  const [user, setUser] =
    useState<User | null>(null)

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {
    let mounted = true

    async function loadSession() {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (!mounted) {
        return
      }

      setUser(session?.user ?? null)
      setLoading(false)
    }

    loadSession()

    const {
      data: { subscription }
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <main style={loadingPage}>
        Loading MarketHub...
      </main>
    )
  }

  if (!user) {
    return (
      <EmailAuthModal
        redirectTo="/en/market-hub"
      />
    )
  }
    return <>{children}</>
}

const loadingPage = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#0a0a0a',
  color: '#aaa',
  fontSize: '1.1rem'
}