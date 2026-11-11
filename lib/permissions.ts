export const PERMISSION_TYPES = [
  'public',
  'authenticated',
  'premium',
  'enterprise'
] as const

export type PermissionType =
  (typeof PERMISSION_TYPES)[number]

export const PERMISSION_GATE_RESULTS = [
  'allow',
  'lock',
  'hide'
] as const

export type PermissionGateResult =
  (typeof PERMISSION_GATE_RESULTS)[number]

export type RestrictedWidgetBehavior =
  Exclude<PermissionGateResult, 'allow'>

export const MARKET_HUB_USER_ROLES = [
  'buyer',
  'seller',
  'agent',
  'brokerage',
  'developer'
] as const

export type MarketHubUserRole =
  (typeof MARKET_HUB_USER_ROLES)[number]

export type UserPermissionContext = {
  authenticated: boolean
  premium: boolean
  enterprise: boolean
  roles: MarketHubUserRole[]
}

export function hasPermission(
  requiredPermission: PermissionType,
  user: UserPermissionContext
): boolean {
  switch (requiredPermission) {
    case 'public':
      return true

    case 'authenticated':
      return user.authenticated

    case 'premium':
      return (
        user.authenticated &&
        (
          user.premium ||
          user.enterprise
        )
      )

    case 'enterprise':
      return (
        user.authenticated &&
        user.enterprise
      )

    default:
      return false
  }
}

export function resolvePermissionGate(
  requiredPermission: PermissionType,
  user: UserPermissionContext,
  restrictedBehavior: RestrictedWidgetBehavior = 'lock'
): PermissionGateResult {
  if (
    hasPermission(
      requiredPermission,
      user
    )
  ) {
    return 'allow'
  }

  return restrictedBehavior
}

export function hasUserRole(
  user: UserPermissionContext,
  role: MarketHubUserRole
): boolean {
  return user.roles.includes(role)
}

export function hasAnyUserRole(
  user: UserPermissionContext,
  roles: MarketHubUserRole[]
): boolean {
  return roles.some(role =>
    user.roles.includes(role)
  )
}

export function hasEveryUserRole(
  user: UserPermissionContext,
  roles: MarketHubUserRole[]
): boolean {
  return roles.every(role =>
    user.roles.includes(role)
  )
}

export const MARKET_HUB_ROLE_LABELS: Record<
  MarketHubUserRole,
  {
    en: string
    es: string
  }
> = {
  buyer: {
    en: 'Buyer',
    es: 'Comprador'
  },

  seller: {
    en: 'Seller',
    es: 'Vendedor'
  },

  agent: {
    en: 'Agent',
    es: 'Agente'
  },

  brokerage: {
    en: 'Brokerage',
    es: 'Correduría'
  },

  developer: {
    en: 'Developer',
    es: 'Desarrollador'
  }
}

export function getRoleLabel(
  role: MarketHubUserRole,
  language: 'en' | 'es'
): string {
  return MARKET_HUB_ROLE_LABELS[
    role
  ][language]
}

export const MARKET_HUB_WIDGET_IDS = [
  'my-listings',
  'favorites',
  'market-explorer',
  'valuation',
  'pricing-strategy',
  'property-matching',
  'market-comparison',
  'market-frequency',
  'price-per-square-meter',
  'buyer-demand',
  'market-velocity',
  'price-dynamics',
  'listing-lifecycle',
  'seller-behavior',
  'packages',
  'settings'
] as const

export type MarketHubWidgetId =
  (typeof MARKET_HUB_WIDGET_IDS)[number]

export type WidgetRegistration = {
  id: MarketHubWidgetId
  requiredPermission: PermissionType
  allowedRoles?: MarketHubUserRole[]
}

export const MARKET_HUB_WIDGET_REGISTRY: Record<
  MarketHubWidgetId,
  WidgetRegistration
> = {
  'my-listings': {
    id: 'my-listings',
    requiredPermission: 'authenticated',
    allowedRoles: [
      'seller',
      'agent',
      'brokerage',
      'developer'
    ]
  },

  favorites: {
    id: 'favorites',
    requiredPermission: 'authenticated',
    allowedRoles: [
      'buyer',
      'seller',
      'agent',
      'brokerage',
      'developer'
    ]
  },

  'market-explorer': {
    id: 'market-explorer',
    requiredPermission: 'authenticated',
    allowedRoles: [
      'buyer',
      'seller',
      'agent',
      'brokerage',
      'developer'
    ]
  },

  valuation: {
    id: 'valuation',
    requiredPermission: 'premium',
    allowedRoles: [
      'seller',
      'agent',
      'brokerage',
      'developer'
    ]
  },

  'pricing-strategy': {
    id: 'pricing-strategy',
    requiredPermission: 'premium',
    allowedRoles: [
      'seller',
      'agent',
      'brokerage',
      'developer'
    ]
  },

  'property-matching': {
    id: 'property-matching',
    requiredPermission: 'premium',
    allowedRoles: [
      'buyer',
      'agent',
      'brokerage'
    ]
  },

  'market-comparison': {
    id: 'market-comparison',
    requiredPermission: 'premium',
    allowedRoles: [
      'buyer',
      'seller',
      'agent',
      'brokerage',
      'developer'
    ]
  },

  'market-frequency': {
    id: 'market-frequency',
    requiredPermission: 'premium',
    allowedRoles: [
      'buyer',
      'seller',
      'agent',
      'brokerage',
      'developer'
    ]
  },

  'price-per-square-meter': {
    id: 'price-per-square-meter',
    requiredPermission: 'premium',
    allowedRoles: [
      'buyer',
      'seller',
      'agent',
      'brokerage',
      'developer'
    ]
  },

  'buyer-demand': {
    id: 'buyer-demand',
    requiredPermission: 'enterprise',
    allowedRoles: [
      'seller',
      'agent',
      'brokerage',
      'developer'
    ]
  },

  'market-velocity': {
    id: 'market-velocity',
    requiredPermission: 'enterprise',
    allowedRoles: [
      'seller',
      'agent',
      'brokerage',
      'developer'
    ]
  },

  'price-dynamics': {
    id: 'price-dynamics',
    requiredPermission: 'enterprise',
    allowedRoles: [
      'seller',
      'agent',
      'brokerage',
      'developer'
    ]
  },

  'listing-lifecycle': {
    id: 'listing-lifecycle',
    requiredPermission: 'enterprise',
    allowedRoles: [
      'seller',
      'agent',
      'brokerage',
      'developer'
    ]
  },

  'seller-behavior': {
    id: 'seller-behavior',
    requiredPermission: 'enterprise',
    allowedRoles: [
      'seller',
      'agent',
      'brokerage',
      'developer'
    ]
  },

  packages: {
    id: 'packages',
    requiredPermission: 'authenticated',
    allowedRoles: [
      'buyer',
      'seller',
      'agent',
      'brokerage',
      'developer'
    ]
  },

  settings: {
    id: 'settings',
    requiredPermission: 'authenticated',
    allowedRoles: [
      'buyer',
      'seller',
      'agent',
      'brokerage',
      'developer'
    ]
  }
}

export function getWidgetRegistration(
  widgetId: MarketHubWidgetId
): WidgetRegistration {
  return MARKET_HUB_WIDGET_REGISTRY[widgetId]
}

export type WidgetAccessDecision = {
  widgetId: MarketHubWidgetId
  requiredPermission: PermissionType
  userHasPermission: boolean
  userHasRole: boolean
  allowed: boolean
}

export function getWidgetRequiredPermission(
  widgetId: MarketHubWidgetId
): PermissionType {
  return MARKET_HUB_WIDGET_REGISTRY[
    widgetId
  ].requiredPermission
}

export function resolveWidgetAccess(
  widgetId: MarketHubWidgetId,
  user: UserPermissionContext
): WidgetAccessDecision {
  const widget =
    getWidgetRegistration(widgetId)

  const userHasPermission =
    hasPermission(
      widget.requiredPermission,
      user
    )

  const userHasRole =
    !widget.allowedRoles?.length ||
    hasAnyUserRole(
      user,
      widget.allowedRoles
    )

  return {
    widgetId,
    requiredPermission:
      widget.requiredPermission,
    userHasPermission,
    userHasRole,
    allowed:
      userHasPermission &&
      userHasRole
  }
}

export function resolveWidgetGate(
  widgetId: MarketHubWidgetId,
  user: UserPermissionContext,
  restrictedBehavior: RestrictedWidgetBehavior = 'lock'
): PermissionGateResult {
  const decision =
    resolveWidgetAccess(
      widgetId,
      user
    )

  if (decision.allowed) {
    return 'allow'
  }

  return restrictedBehavior
}