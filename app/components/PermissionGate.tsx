'use client'

import type {
  CSSProperties,
  ReactNode
} from 'react'

import {
  LockKeyhole
} from 'lucide-react'

import {
  getWidgetRequiredPermission,
  resolvePermissionGate,
  resolveWidgetGate
} from '@/lib/permissions'

import type {
  MarketHubWidgetId,
  PermissionType,
  RestrictedWidgetBehavior,
  UserPermissionContext
} from '@/lib/permissions'

type SupportedLanguage =
  | 'en'
  | 'es'

type PermissionGateProps = {
        children: ReactNode
        widgetId?: MarketHubWidgetId
        requiredPermission?: PermissionType
        user: UserPermissionContext
        restrictedBehavior?: RestrictedWidgetBehavior
        language?: SupportedLanguage
        title?: string
        description?: string
        actionLabel?: string
        learnMoreLabel?: string
        onAction?: () => void
        onLearnMore?: () => void
        }

export default function PermissionGate({
  children,
  widgetId,
  requiredPermission,
  user,
  restrictedBehavior = 'lock',
  language = 'en',
  title,
  description,
  actionLabel,
    learnMoreLabel,
    onAction,
    onLearnMore
}: PermissionGateProps) {

  const resolvedPermission =
        widgetId
            ? getWidgetRequiredPermission(widgetId)
            : requiredPermission

        if (!resolvedPermission) {
        throw new Error(
            'PermissionGate requires either widgetId or requiredPermission.'
        )
        }

  const result =
        widgetId
            ? resolveWidgetGate(
                widgetId,
                user,
                restrictedBehavior
            )
            : resolvePermissionGate(
                resolvedPermission,
                user,
                restrictedBehavior
            )

  const labels =
        language === 'es'
            ? {
                locked:
                'Acceso Bloqueado',
                description:
                'Este widget requiere un nivel de acceso superior.',
                signIn:
                'Iniciar Sesión',
                upgrade:
                'Mejorar Acceso',
                enterprise:
                'Contactar Ventas',
                learnMore:
                'Más Información'
            }
            : {
                locked:
                'Access Locked',
                description:
                'This widget requires a higher access level.',
                signIn:
                'Sign In',
                upgrade:
                'Upgrade Access',
                enterprise:
                'Contact Sales',
                learnMore:
                'Learn More'
            }

  if (result === 'hide') {
    return null
  }

  if (result === 'allow') {
    return <>{children}</>
  }

  const resolvedActionLabel =
    actionLabel ??
    getDefaultActionLabel(
        resolvedPermission,
        labels
        )

  return (
        <div style={lockedContainer}>
            <div
            aria-hidden="true"
            style={lockedContent}
            >
            {children}
            </div>

            <div style={overlay}>
            <div style={lockPanel}>
                <div style={iconContainer}>
                <LockKeyhole
                    size={25}
                    strokeWidth={1.4}
                    color="#C7A44B"
                />
                </div>

                <div style={lockedEyebrow}>
                {getPermissionLabel(
                    resolvedPermission,
                    language
                )}
                </div>

                <h4 style={lockTitle}>
                {title ?? labels.locked}
                </h4>

                <p style={lockDescription}>
                {
                    description ??
                    labels.description
                }
                </p>

                <div style={buttonGroup}>
                {onAction && (
                    <button
                    type="button"
                    style={actionButton}
                    onClick={onAction}
                    >
                    {resolvedActionLabel}
                    </button>
                )}

                {onLearnMore && (
                    <button
                    type="button"
                    style={learnMoreButton}
                    onClick={onLearnMore}
                    >
                    {
                        learnMoreLabel ??
                        labels.learnMore
                    }
                    </button>
                )}
                </div>
            </div>
            </div>
        </div>
        )
}

function getDefaultActionLabel(
  requiredPermission: PermissionType,
  labels: {
    signIn: string
    upgrade: string
    enterprise: string
  }
): string {
  switch (requiredPermission) {
    case 'authenticated':
      return labels.signIn

    case 'premium':
      return labels.upgrade

    case 'enterprise':
      return labels.enterprise

    case 'public':
    default:
      return labels.upgrade
  }
}

function getPermissionLabel(
  permission: PermissionType,
  language: SupportedLanguage
): string {
  const labels =
    language === 'es'
      ? {
          public:
            'Público',
          authenticated:
            'Cuenta Requerida',
          premium:
            'Premium',
          enterprise:
            'Empresarial'
        }
      : {
          public:
            'Public',
          authenticated:
            'Account Required',
          premium:
            'Premium',
          enterprise:
            'Enterprise'
        }

  return labels[permission]
}

const lockedContainer: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  borderRadius: '14px'
}

const lockedContent: CSSProperties = {
  pointerEvents: 'none',
  userSelect: 'none',
  filter: 'blur(5px)',
  transform: 'scale(1.015)',
  opacity: 0.32
}

const overlay: CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
  background:
    'linear-gradient(180deg, rgba(10, 10, 10, 0.45), rgba(10, 10, 10, 0.82))',
  backdropFilter: 'blur(2px)'
}

const lockPanel: CSSProperties = {
  width: '100%',
  maxWidth: '330px',
  padding: '1.35rem',
  border: '1px solid #4b4127',
  borderRadius: '14px',
  background:
    'rgba(17, 17, 17, 0.97)',
  textAlign: 'center',
  boxShadow:
    '0 20px 50px rgba(0, 0, 0, 0.5)'
}

const iconContainer: CSSProperties = {
  width: '46px',
  height: '46px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto .9rem',
  border: '1px solid #4b4127',
  borderRadius: '12px',
  background: '#17140d'
}

const lockTitle: CSSProperties = {
  margin: 0,
  color: '#ededed',
  fontSize: '1rem'
}

const lockDescription: CSSProperties = {
  margin: '.55rem 0 0',
  color: '#aaa',
  fontSize: '.86rem',
  lineHeight: 1.5
}

const actionButton: CSSProperties = {
  marginTop: '1rem',
  padding: '.7rem 1rem',
  border: '1px solid #C7A44B',
  borderRadius: '9px',
  background: '#C7A44B',
  color: '#111',
  fontSize: '.82rem',
  fontWeight: 700,
  cursor: 'pointer'
}

const lockedEyebrow: CSSProperties = {
  marginBottom: '.45rem',
  color: '#C7A44B',
  fontSize: '.7rem',
  fontWeight: 700,
  letterSpacing: '.12em',
  textTransform: 'uppercase'
}

const buttonGroup: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: '.65rem',
  marginTop: '1rem'
}

const learnMoreButton: CSSProperties = {
  padding: '.7rem 1rem',
  border: '1px solid #444',
  borderRadius: '9px',
  background: 'transparent',
  color: '#ddd',
  fontSize: '.82rem',
  fontWeight: 700,
  cursor: 'pointer'
}