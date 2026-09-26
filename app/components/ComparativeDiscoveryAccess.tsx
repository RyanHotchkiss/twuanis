'use client'
import { useEffect, useState } from 'react'
import { loadCurrentUserPermissionContext } from '@/lib/current-user-permissions-action'
import { resolveWidgetGate, type UserPermissionContext, type RestrictedWidgetBehavior } from '@/lib/permissions'
import PermissionGate from './PermissionGate'
import Phase14Discovery from './Phase14Discovery'

export function ComparativeDiscoveryPermissionSurface({ user, language, restrictedBehavior = 'lock' }: {
  user: UserPermissionContext; language: 'en' | 'es'; restrictedBehavior?: RestrictedWidgetBehavior
}) {
  const allowed = resolveWidgetGate('price-per-square-meter', user, restrictedBehavior) === 'allow'
  return <PermissionGate widgetId="price-per-square-meter" user={user} restrictedBehavior={restrictedBehavior} language={language}>
    {allowed ? <Phase14Discovery language={language} /> : <div style={{ minHeight: 280 }} />}
  </PermissionGate>
}

export default function ComparativeDiscoveryAccess({ language }: { language: 'en' | 'es' }) {
  const [user, setUser] = useState<UserPermissionContext>({ authenticated: false, premium: false, enterprise: false, roles: [] })
  useEffect(() => {
    let active = true
    loadCurrentUserPermissionContext().then(context => { if (active) setUser(context) }).catch(() => {
      if (active) setUser({ authenticated: false, premium: false, enterprise: false, roles: [] })
    })
    return () => { active = false }
  }, [])
  return <ComparativeDiscoveryPermissionSurface user={user} language={language} />
}
