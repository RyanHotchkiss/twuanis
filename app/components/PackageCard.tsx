'use client'

import type {
  MarketIntelligencePackage,
  SupportedLanguage
} from '@/lib/marketIntelligencePackages'

type PackageCardProps = {
  pkg: MarketIntelligencePackage
  language: SupportedLanguage
  onLearnMore?: (
    pkg: MarketIntelligencePackage
  ) => void
  onChoosePackage?: (
    pkg: MarketIntelligencePackage
  ) => void
}

import {
  LayoutDashboard
} from 'lucide-react'

export default function PackageCard({
  pkg,
  language,
  onLearnMore,
  onChoosePackage
}: PackageCardProps) {
  const isFree =
    pkg.price === null

  const formattedUsd =
    pkg.price
      ? `$${pkg.price.usd.toLocaleString()}`
      : null

  const formattedCrc =
    pkg.price
      ? `₡${pkg.price.crc.toLocaleString()}`
      : null

  const labels =
    language === 'es'
      ? {
          free: 'Gratis',
          monthly: 'por mes',
          includedEngines: 'Motores incluidos',
          futureEngine: 'Motor futuro',
          dashboard: 'Panel Inmobiliario',
          learnMore: 'Más información',
          choosePackage: 'Elegir paquete'
        }
      : {
          free: 'Free',
          monthly: 'per month',
          includedEngines: 'Included engines',
          futureEngine: 'Future engine',
          dashboard: 'Real Estate Dashboard',
          learnMore: 'Learn more',
          choosePackage: 'Choose package'
        }

  return (
    <article
      style={{
        ...card,
        borderColor: pkg.color
      }}
    >
      <div>
        <h2 style={packageName}>
          {pkg.name[language]}
        </h2>

        <p style={description}>
          {pkg.description[language]}
        </p>

        <div style={priceWrap}>
          {isFree ? (
            <div
              style={{
                ...primaryPrice,
                color: pkg.color
              }}
            >
              {labels.free}
            </div>
          ) : (
            <>
              <div
                style={{
                  ...primaryPrice,
                  color: pkg.color
                }}
              >
                {formattedUsd}
              </div>

              <div style={secondaryPrice}>
                {formattedCrc}
              </div>

              <div style={billingPeriod}>
                {labels.monthly}
              </div>
            </>
          )}
        </div>
      </div>

      <div>
        <h3 style={engineHeading}>
          {labels.includedEngines}
        </h3>

        <div style={engineList}>
          {pkg.engines.map(engine => {
            const Icon =
              engine.icon

            return (
              <div
                key={engine.id}
                style={{
                  ...engineCard,
                  opacity:
                    engine.future
                      ? .55
                      : 1
                }}
              >
                <Icon
                  size={28}
                  strokeWidth={1}
                  color="#C7A44B"
                />

                <div>
                  <div style={engineName}>
                    {engine.name[language]}
                  </div>

                  <div style={enginePurpose}>
                    {engine.purpose[language]}
                  </div>

                  {engine.future && (
                    <div
                      style={{
                        ...futureLabel,
                        color: pkg.color
                      }}
                    >
                      {labels.futureEngine}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={dashboardFeature}>
        <LayoutDashboard
            size={30}
            strokeWidth={1}
            color="#C7A44B"
        />

        <div>
            <div style={dashboardName}>
            {labels.dashboard}
            </div>

            <div style={dashboardDescription}>
            {pkg.dashboardDescription[language]}
            </div>
        </div>
        </div>

      <div style={buttonRow}>
        <button
          type="button"
          onClick={() => {
            onLearnMore?.(pkg)
          }}
          style={secondaryButton}
        >
          {labels.learnMore}
        </button>

        <button
          type="button"
          onClick={() => {
            onChoosePackage?.(pkg)
          }}
          style={{
            ...primaryButton,
            borderColor: pkg.color,
            color: pkg.color
          }}
        >
          {labels.choosePackage}
        </button>
      </div>
    </article>
  )
}

const card = {
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'space-between',
  gap: '1.75rem',
  minHeight: '100%',
  padding: '1.5rem',
  background: '#181818',
  border: '2px solid',
  borderRadius: '18px'
}

const packageName = {
  margin: 0,
  color: '#fff',
  fontSize: '1.55rem',
  lineHeight: 1.2
}

const description = {
  margin: '.75rem 0 0',
  color: '#aaa',
  fontSize: '.95rem',
  lineHeight: 1.5
}

const priceWrap = {
  marginTop: '1.25rem'
}

const primaryPrice = {
  fontSize: '2rem',
  fontWeight: 700
}

const secondaryPrice = {
  marginTop: '.25rem',
  color: '#ddd',
  fontSize: '1.05rem'
}

const billingPeriod = {
  marginTop: '.2rem',
  color: '#777',
  fontSize: '.8rem'
}

const engineHeading = {
  margin: 0,
  color: '#ff3b00',
  fontSize: '1rem',
  textTransform: 'uppercase' as const,
  letterSpacing: '.06em'
}

const engineList = {
  display: 'grid',
  gap: '.85rem',
  marginTop: '1rem'
}

const engineCard = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  gap: '.8rem',
  alignItems: 'start'
}

const engineName = {
  color: '#fff',
  fontSize: '1rem',
  fontWeight: 600
}

const enginePurpose = {
  marginTop: '.2rem',
  color: '#999',
  fontSize: '.84rem',
  lineHeight: 1.4
}

const futureLabel = {
  marginTop: '.35rem',
  fontSize: '.7rem',
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: '.07em'
}

const buttonRow = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(2, minmax(0, 1fr))',
  gap: '.75rem'
}

const secondaryButton = {
  padding: '.85rem 1rem',
  background: 'transparent',
  color: '#ddd',
  border: '1px solid #444',
  borderRadius: '10px',
  cursor: 'pointer'
}

const primaryButton = {
  padding: '.85rem 1rem',
  background: 'transparent',
  border: '1px solid',
  borderRadius: '10px',
  cursor: 'pointer',
  fontWeight: 700
}

const dashboardFeature = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  gap: '.8rem',
  alignItems: 'start',
  marginTop: '1.25rem',
  paddingTop: '1.25rem',
  borderTop: '1px solid #333'
}

const dashboardName = {
  color: '#fff',
  fontSize: '1rem',
  fontWeight: 600
}

const dashboardDescription = {
  marginTop: '.25rem',
  color: '#999',
  fontSize: '.84rem',
  lineHeight: 1.45
}