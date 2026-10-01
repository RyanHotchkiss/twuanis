'use client'

import {
  useEffect,
  useState,
  type ReactNode
} from 'react'

import { supabase } from '@/lib/supabase'
import {
  loadCurrentUserPermissionContext
} from '@/lib/current-user-permissions-action'
import {
  resolveWidgetGate,
  type UserPermissionContext,
  type RestrictedWidgetBehavior
} from '@/lib/permissions'

import PermissionGate from './PermissionGate'
import Phase14Discovery from './Phase14Discovery'

export function ComparativeDiscoveryPermissionSurface({
  user,
  language,
  restrictedBehavior = 'lock',
  children
}: {
  user: UserPermissionContext
  language: 'en' | 'es'
  restrictedBehavior?: RestrictedWidgetBehavior
  children?: ReactNode
}) {
  const allowed =
    resolveWidgetGate(
      'price-per-square-meter',
      user,
      restrictedBehavior
    ) === 'allow'

  return (
    <PermissionGate
      widgetId="price-per-square-meter"
      user={user}
      restrictedBehavior={restrictedBehavior}
      language={language}
    >
      {allowed
        ? children ?? (
            <Phase14Discovery
              language={language}
            />
          )
        : (
            <div
              style={{
                minHeight: 280
              }}
            />
          )}
    </PermissionGate>
  )
}

export default function ComparativeDiscoveryAccess({
  language,
  children
}: {
  language: 'en' | 'es'
  children?: ReactNode
}) {
  const [user, setUser] =
    useState<UserPermissionContext>({
      authenticated: false,
      premium: false,
      enterprise: false,
      roles: []
    })

  useEffect(() => {
    let active = true

    async function loadPermissions() {
      const {
        data: {
          session
        }
      } =
        await supabase.auth.getSession()

      if (!active) {
        return
      }

      if (!session?.access_token) {
        setUser({
          authenticated: false,
          premium: false,
          enterprise: false,
          roles: []
        })

        return
      }

      const context =
        await loadCurrentUserPermissionContext(
          session.access_token
        )

      if (!active) {
        return
      }

      setUser(context)
    }

    loadPermissions().catch(() => {
      if (!active) {
        return
      }

      setUser({
        authenticated: false,
        premium: false,
        enterprise: false,
        roles: []
      })
    })

    const {
      data: {
        subscription
      }
    } =
      supabase.auth.onAuthStateChange(
        () => {
          loadPermissions().catch(() => {
            if (!active) {
              return
            }

            setUser({
              authenticated: false,
              premium: false,
              enterprise: false,
              roles: []
            })
          })
        }
      )

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  return (
    <ComparativeDiscoveryPermissionSurface
      user={user}
      language={language}
    >
      {children}
    </ComparativeDiscoveryPermissionSurface>
  )
}
