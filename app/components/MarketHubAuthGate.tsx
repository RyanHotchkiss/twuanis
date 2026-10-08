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
import { usePathname } from 'next/navigation'
import { authLocale, safeAuthNext } from '@/lib/auth/account-access'
import { accountCopy } from '@/lib/auth/account-copy'

import EmailAuthModal from '@/app/components/EmailAuthModal'

type MarketHubAuthGateProps = {
  children: ReactNode
}

export default function MarketHubAuthGate({
  children
}: MarketHubAuthGateProps) {
  const pathname=usePathname()
  const locale=authLocale(pathname)
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

    loadSession().catch(()=>{if(mounted){setUser(null);setLoading(false)}})

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
        {accountCopy(locale).loading}
      </main>
    )
  }

  if (!user) {
    return (
      <EmailAuthModal
        redirectTo={safeAuthNext(pathname,locale)}
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
  background: 'var(--background)',
  color: 'var(--muted)',
  fontSize: '1.1rem'
}