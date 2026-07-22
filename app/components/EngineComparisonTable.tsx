'use client'

import {
  Check,
  Construction,
  Minus,
  LayoutDashboard
} from 'lucide-react'

import type {
  MarketIntelligencePackage,
  SupportedLanguage
} from '@/lib/marketIntelligencePackages'

type EngineComparisonTableProps = {
  packages: MarketIntelligencePackage[]
  language: SupportedLanguage
}

export default function EngineComparisonTable({
  packages,
  language
}: EngineComparisonTableProps) {
  const labels =
    language === 'es'
      ? {
          heading: 'Características del paquete',
          intro:
            'Compare los motores incluidos en cada paquete de inteligencia de mercado.',
          engine: 'Motor',
          included: 'Incluido',
          notIncluded: 'No incluido',
          future: 'Motor futuro',
          free: 'Gratis',
          monthly: 'por mes',
          dashboard: 'Panel Inmobiliario',
            dashboardPurpose:
            'Panel personalizado para administrar publicaciones, favoritos y herramientas de inteligencia disponibles.'
        }
      : {
          heading: 'Package Features',
          intro:
            'Compare the engines included in each market intelligence package.',
          engine: 'Engine',
          included: 'Included',
          notIncluded: 'Not included',
          future: 'Future engine',
          free: 'Free',
          monthly: 'per month',
          dashboard: 'Real Estate Dashboard',
            dashboardPurpose:
            'Personalized workspace for managing listings, favorites, and available intelligence tools.'
        }

  const allEngines =
    packages.flatMap(pkg =>
      pkg.engines.map(engine => ({
        ...engine,
        packageId: pkg.id
      }))
    )

  const uniqueEngines =
    allEngines.filter(
      (engine, index, engines) =>
        engines.findIndex(
          candidate =>
            candidate.id === engine.id
        ) === index
    )

  return (
    <section style={section}>
      <div style={headingWrap}>
        <h2 style={heading}>
          {labels.heading}
        </h2>

        <p style={intro}>
          {labels.intro}
        </p>
      </div>

      <div style={scrollWrap}>
        <table style={table}>
          <thead>
            <tr>
              <th
                style={{
                  ...headerCell,
                  ...stickyEngineHeader
                }}
              >
                {labels.engine}
              </th>

              {packages.map(pkg => (
                <th
                  key={pkg.id}
                  style={{
                    ...headerCell,
                    borderTopColor:
                      pkg.color
                  }}
                >
                  <div style={packageName}>
                    {pkg.name[language]}
                  </div>

                  <div
                    style={{
                      ...packagePrice,
                      color: pkg.color
                    }}
                  >
                    {pkg.price
                      ? `$${pkg.price.usd.toLocaleString()} / ₡${pkg.price.crc.toLocaleString()}`
                      : labels.free}
                  </div>

                  {pkg.price && (
                    <div style={monthly}>
                      {labels.monthly}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            <tr>
                <th
                    scope="row"
                    style={{
                    ...engineCell,
                    ...stickyEngineCell
                    }}
                >
                    <div style={engineWrap}>
                    <LayoutDashboard
                        size={25}
                        strokeWidth={1}
                        color="#C7A44B"
                    />

                    <div>
                        <div style={engineName}>
                        {labels.dashboard}
                        </div>

                        <div style={enginePurpose}>
                        {labels.dashboardPurpose}
                        </div>
                    </div>
                    </div>
                </th>

                {packages.map(pkg => (
                    <td
                    key={pkg.id}
                    style={bodyCell}
                    aria-label={labels.included}
                    >
                    <Check
                        size={24}
                        strokeWidth={1.5}
                        color={pkg.color}
                        aria-hidden="true"
                    />
                    </td>
                ))}
                </tr>
            {uniqueEngines.map(
              engine => {
                const Icon =
                  engine.icon

                return (
                  <tr key={engine.id}>
                    <th
                      scope="row"
                      style={{
                        ...engineCell,
                        ...stickyEngineCell
                      }}
                    >
                      <div style={engineWrap}>
                        <Icon
                          size={25}
                          strokeWidth={1}
                          color="#C7A44B"
                        />

                        <div>
                          <div style={engineName}>
                            {
                              engine.name[
                                language
                              ]
                            }
                          </div>

                          <div
                            style={
                              enginePurpose
                            }
                          >
                            {
                              engine.purpose[
                                language
                              ]
                            }
                          </div>

                          {engine.future && (
                            <div
                              style={futureLabel}
                            >
                              <Construction
                                size={14}
                                strokeWidth={1.2}
                              />

                              {labels.future}
                            </div>
                          )}
                        </div>
                      </div>
                    </th>

                    {packages.map(pkg => {
                        const currentPackageIndex =
                            packages.findIndex(
                                p => p.id === pkg.id
                            )
                            const enginePackageIndex =
                            packages.findIndex(
                                p =>
                                p.engines.some(
                                    packageEngine =>
                                    packageEngine.id ===
                                    engine.id
                                )
                            )
                            const included =
                            currentPackageIndex >=
                            enginePackageIndex
                        
                      return (
                        <td
                          key={pkg.id}
                          style={bodyCell}
                          aria-label={
                            included
                              ? labels.included
                              : labels.notIncluded
                          }
                        >
                          {included ? (
                            <Check
                              size={24}
                              strokeWidth={1.5}
                              color={pkg.color}
                              aria-hidden="true"
                            />
                          ) : (
                            <Minus
                              size={20}
                              strokeWidth={1}
                              color="#555"
                              aria-hidden="true"
                            />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              }
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

const section = {
  marginTop: '4rem'
}

const headingWrap = {
  marginBottom: '1.5rem'
}

const heading = {
  margin: 0,
  color: '#fff',
  fontSize:
    'clamp(1.8rem, 4vw, 2.6rem)'
}

const intro = {
  maxWidth: '760px',
  margin: '.75rem 0 0',
  color: '#aaa',
  fontSize: '1rem',
  lineHeight: 1.6
}

const scrollWrap = {
  width: '100%',
  overflowX: 'auto' as const,
  border: '1px solid #2f2f2f',
  borderRadius: '16px',
  background: '#151515',
  WebkitOverflowScrolling:
    'touch' as const
}

const table = {
  width: '100%',
  minWidth: '1100px',
  borderCollapse:
    'separate' as const,
  borderSpacing: 0
}

const headerCell = {
  minWidth: '175px',
  padding: '1rem',
  color: '#fff',
  background: '#1a1a1a',
  borderTop: '3px solid transparent',
  borderRight:
    '1px solid #303030',
  borderBottom:
    '1px solid #303030',
  textAlign: 'center' as const,
  verticalAlign: 'top' as const
}

const stickyEngineHeader = {
  position: 'sticky' as const,
  left: 0,
  zIndex: 4,
  minWidth: '300px',
  textAlign: 'left' as const
}

const packageName = {
  fontSize: '.9rem',
  fontWeight: 700,
  lineHeight: 1.35
}

const packagePrice = {
  marginTop: '.55rem',
  fontSize: '.85rem',
  fontWeight: 700
}

const monthly = {
  marginTop: '.25rem',
  color: '#777',
  fontSize: '.72rem',
  fontWeight: 400
}

const engineCell = {
  minWidth: '300px',
  padding: '1rem',
  color: '#fff',
  background: '#181818',
  borderRight:
    '1px solid #303030',
  borderBottom:
    '1px solid #303030',
  textAlign: 'left' as const,
  verticalAlign: 'middle' as const
}

const stickyEngineCell = {
  position: 'sticky' as const,
  left: 0,
  zIndex: 3
}

const engineWrap = {
  display: 'grid',
  gridTemplateColumns:
    'auto minmax(0, 1fr)',
  gap: '.8rem',
  alignItems: 'start'
}

const engineName = {
  fontSize: '.95rem',
  fontWeight: 650,
  lineHeight: 1.35
}

const enginePurpose = {
  marginTop: '.25rem',
  color: '#929292',
  fontSize: '.78rem',
  fontWeight: 400,
  lineHeight: 1.45
}

const futureLabel = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '.3rem',
  marginTop: '.45rem',
  color: '#777',
  fontSize: '.68rem',
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: '.06em'
}

const bodyCell = {
  minWidth: '175px',
  padding: '1rem',
  background: '#151515',
  borderRight:
    '1px solid #303030',
  borderBottom:
    '1px solid #303030',
  textAlign: 'center' as const,
  verticalAlign: 'middle' as const
}