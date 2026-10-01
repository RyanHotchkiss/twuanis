'use client'
import { useEffect, useState, type ReactNode } from 'react'
import { loadCurrentUserPermissionContext } from '@/lib/current-user-permissions-action'
import { resolveWidgetGate, type UserPermissionContext, type RestrictedWidgetBehavior } from '@/lib/permissions'
import PermissionGate from './PermissionGate'
import Phase14Discovery from './Phase14Discovery'

export function ComparativeDiscoveryPermissionSurface({ user, language, restrictedBehavior = 'lock', children }: {
  user: UserPermissionContext; language: 'en' | 'es'; restrictedBehavior?: RestrictedWidgetBehavior; children?:ReactNode
}) {
  const allowed = resolveWidgetGate('price-per-square-meter', user, restrictedBehavior) === 'allow'
  return <PermissionGate widgetId="price-per-square-meter" user={user} restrictedBehavior={restrictedBehavior} language={language}>
    {allowed ? children ?? <Phase14Discovery language={language} /> : <div style={{ minHeight: 280 }} />}
  </PermissionGate>
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

  const [diagnostic, setDiagnostic] =
    useState('WAITING FOR SERVER ACTION')

  useEffect(() => {
    let active = true

    loadCurrentUserPermissionContext()
      .then(context => {
        if (!active) return

        setUser(context)
        setDiagnostic(
          `SERVER ACTION RETURNED:\n${JSON.stringify(
            context,
            null,
            2
          )}`
        )
      })
      .catch(error => {
        if (!active) return

        setDiagnostic(
          `SERVER ACTION REJECTED:\n${
            error instanceof Error
              ? error.message
              : String(error)
          }`
        )
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <pre
        style={{
          position: 'relative',
          zIndex: 9999,
          padding: 12,
          background: '#000',
          color: '#0f0',
          fontSize: 12,
          whiteSpace: 'pre-wrap'
        }}
      >
        {diagnostic}
      </pre>

      <ComparativeDiscoveryPermissionSurface
        user={user}
        language={language}
      >
        {children}
      </ComparativeDiscoveryPermissionSurface>
    </>
  )
}