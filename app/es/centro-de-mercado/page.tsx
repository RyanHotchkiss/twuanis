import TopBarES from '@/app/components/TopBarES'
import MarketHubMyListings from '@/app/components/MarketHubMyListings'
import MarketHubFavorites from '@/app/components/MarketHubFavorites'
import MarketHubMarketIntelligence from '@/app/components/MarketHubMarketIntelligence'
import MarketHubPackages from '@/app/components/MarketHubPackages'
import MarketHubSettings from '@/app/components/MarketHubSettings'
import PermissionGate from '@/app/components/PermissionGate'
import MarketHubFirstTimeExperience from '@/app/components/MarketHubFirstTimeExperience'
import MarketHubActivityEngine from '@/app/components/MarketHubActivityEngine'

import {
  MARKET_HUB_EXPLORE_ACTIONS,
  MARKET_HUB_FIRST_ACTIONS,
  calculateMarketHubOnboardingProgress
} from '@/lib/onboarding'

const onboardingProgress =
  calculateMarketHubOnboardingProgress(
    MARKET_HUB_FIRST_ACTIONS
  )

export default function CentroDeMercadoPage() {
  return (
    <main style={main}>
      <TopBarES />

      <section style={hero}>
        <h1 style={heading}>
          MarketHub
        </h1>

        <p style={intro}>
          Su actividad inmobiliaria, publicaciones, favoritos e inteligencia del mercado inmobiliario de Costa Rica en un solo lugar.
        </p>
      </section>

      <div style={cardSpacing}>
        <MarketHubFirstTimeExperience
            language="es"
            userName="Ryan"
            progress={{
            savedFirstProperty:
                MARKET_HUB_FIRST_ACTIONS.find(
                action =>
                    action.id ===
                    'save-first-property'
                )?.completed ?? false,
            publishedFirstListing:
                MARKET_HUB_FIRST_ACTIONS.find(
                action =>
                    action.id ===
                    'publish-first-listing'
                )?.completed ?? false,
            createdFirstSavedSearch:
                MARKET_HUB_FIRST_ACTIONS.find(
                action =>
                    action.id ===
                    'create-first-saved-search'
                )?.completed ?? false
            }}
            exploreActions={
            MARKET_HUB_EXPLORE_ACTIONS
            }
            onboardingProgress={
            onboardingProgress
            }
        />
        </div>

        <div style={cardSpacing}>
            <MarketHubActivityEngine
                language="es"
                propertyEvents={[
                {
                    eventType:
                    'property_viewed',
                    count: 0
                },
                {
                    eventType:
                    'property_saved',
                    count: 0
                },
                {
                    eventType:
                    'property_shared',
                    count: 0
                }
                ]}
            />
            </div>

      <MarketHubMyListings
        language="es"
        listings={[]}
      />

    <div style={cardSpacing}>
        <MarketHubFavorites
            language="es"
            savedProperties={undefined}
            savedSearches={[
                {
                id: '1',
                title: 'Casas en San José',
                resultCount: 23,
                lastUpdated: 'Hoy',
                href: '/es/buy'
                },
                {
                id: '2',
                title: 'Condominios en Escazú',
                resultCount: 11,
                lastUpdated: 'Ayer',
                href: '/es/buy'
                }
            ]}


            recentlyViewedProperties={[
                {
                    id: 'recent-property-1',
                    title: 'Casa en Santa Ana',
                    location: 'Santa Ana, San José',
                    price: '$285,000',
                    viewedAt: 'Visto hoy',
                    href: '/es/property/recent-property-1'
                },
                {
                    id: 'recent-property-2',
                    title: 'Condo in Escazú',
                    location: 'Escazú, San José',
                    price: '$240,000',
                    viewedAt: 'Visto ayer',
                    href: '/es/property/recent-property-2'
                }
                ]}

                recentlyViewedMarkets={[
                {
                    id: 'recent-market-1',
                    title: 'Santa Ana',
                    marketType: 'Mercado Cantonal',
                    summary:
                    '23 propiedades entre el inventario de venta y alquiler.',
                    viewedAt: 'Visto hoy',
                    href:
                    '/es/market-intelligence?tab=explorer'
                }
                ]}


                favoriteCollections={[
                {
                    id: 'collection-1',
                    name: 'Mejores Casas de Santa Ana',
                    propertyCount: 8,
                    updatedAt: 'Actualizado hoy',
                    href: '/es/favorites'
                }
                ]}
                propertyNotes={[
                {
                    id: 'note-1',
                    propertyId: 'property-1',
                    propertyTitle: 'Casa en Santa Ana',
                    note:
                    'Buena ubicación y buen precio, pero confirme el área de construcción.',
                    updatedAt: 'Actualizado hoy',
                    href: '/es/property/property-1'
                }
                ]}
               
            />
        </div>


            <div style={cardSpacing}>
                <MarketHubMarketIntelligence
                    language="es"
                    marketsViewedCount={22}
                    lastUpdated="Today"
                    marketExplorerActivity={[
                    {
                        id: 'market-explorer-1',
                        title: 'Resumen del Mercado de San José',
                        market: 'Provincia de San José',
                        summary:
                        '15 propiedades, precio mediano de venta de $239,500 y alquiler mediano de $1,300.',
                        updatedAt: 'Actualizado hoy',
                        href:
                        '/es/market-intelligence?tab=explorer'
                    },
                    {
                        id: 'market-explorer-2',
                        title: 'Casas de Lujo en Escazú',
                        market: 'Escazú, San José',
                        summary:
                        'Casas de lujo filtradas por precio, área de construcción y número de habitaciones.',
                        updatedAt: 'Visto ayer',
                        href:
                        '/es/market-intelligence?tab=explorer'
                    }
                    ]}
                    valuationAndPricingEngines={[
                    {
                        id: 'valuation',
                        unlocked: true
                    },
                    {
                        id: 'pricing-strategy',
                        unlocked: false,
                        savedAnalysisCount: 0,
                        savedSearchCount: 0,
                        historyCount: 0
                    },
                    {
                        id: 'property-matching',
                        unlocked: false,
                        savedAnalysisCount: 0,
                        savedSearchCount: 0,
                        historyCount: 0
                    }
                    ]}
                    marketIntelligenceEngines={[
                    {
                        id: 'price-per-square-meter',
                        unlocked: false,
                        savedAnalysisCount: 0,
                        savedSearchCount: 0,
                        historyCount: 0
                    },
                        
                    {
                        id: 'market-comparison',
                        unlocked: true,
                        savedAnalysisCount: 5,
                        savedSearchCount: 2,
                        historyCount: 18,
                        lastUpdated: 'Today'
                    },
                    {
                        id: 'market-frequency',
                        unlocked: false,
                        savedAnalysisCount: 0,
                        savedSearchCount: 0,
                        historyCount: 0
                    }
                    ]}
                    />
                </div>

                <div
                    id="packages"
                    style={cardSpacing}
                    >
                    <MarketHubPackages
                        language="es"
                        currentPlan="Análisis de Mercado"
                        monthlyPriceUSD="$100"
                        monthlyPriceCRC="₡50,000"
                        renewalDate="18 de agosto de 2026"
                        billingCycle="monthly"
                        includedPackages={[
                            {
                                name: 'Descubrimiento de Mercado',
                                engineCount: 1,
                                active: true,
                                features: [
                                'Explorador de Mercado',
                                'Estadísticas del Mercado',
                                'Composición del Mercado',
                                'Acceso al Grafo de Conocimiento'   
                                ]
                            },
                            {
                                name: 'Valoración y Precios',
                                engineCount: 3,
                                active: true,
                                features: [
                                'Valoración',
                                'Estrategia de Precios',
                                'Coincidencia de Propiedades'
                                ]
                            },
                            {
                                name: 'Análisis de Mercado',
                                engineCount: 2,
                                active: true,
                                features: [
                                'Comparación de Mercados',
                                'Frecuencia del Mercado'
                                ]
                            },
                            ]}
                    usageSummary={{
                            enginesUsed: 47,
                            savedAnalyses: 16,
                            savedSearches: 28,
                            reportsGenerated: 9,
                            listingsAnalyzed: 142
                            }}
                    upgradePackages={[
                                {
                                    name: 'Descubrimiento de Mercado',
                                    priceUSD: '$0',
                                    priceCRC: '₡0',
                                    current: true,
                                    premium: false,
                                    features: [
                                    'Explorador de Mercado',
                                    'Grafo de Conocimiento',
                                    'Composición del Mercado',
                                    'Estadísticas del Mercado'
                                    ]
                                },
                                {
                                    name: 'Valoración y Precios',
                                    priceUSD: '$50',
                                    priceCRC: '₡25,000',
                                    current: false,
                                    premium: false,
                                    features: [
                                    'Descubrimiento de Mercado',
                                    '+',
                                    'Valoración',
                                    'Estrategia de Precios',
                                    'Coincidencia de Propiedades'
                                    ]
                                },
                                {
                                    name: 'Análisis de Mercado',
                                    priceUSD: '$100',
                                    priceCRC: '₡50,000',
                                    current: false,
                                    premium: false,
                                    features: [
                                    'Valoración y Precios',
                                    '+',
                                    'Comparación de Mercados',
                                    'Frecuencia del Mercado'
                                    ]
                                },
                                {
                                    name: 'Inteligencia de Mercado',
                                    priceUSD: '$200',
                                    priceCRC: '₡100,000',
                                    current: false,
                                    premium: true,
                                    features: [
                                    'Análisis de Mercado',
                                    '+',
                                    'Inteligencia de Precio por m²',
                                    'Comportamiento y Dinámica del Mercado'
                                    ]
                                },
                                {
                                    name: 'Comportamiento y Dinámica del Mercado',
                                    priceUSD: '$500',
                                    priceCRC: '₡250,000',
                                    current: false,
                                    premium: true,
                                    features: [
                                    'Inteligencia de Mercado',
                                    '+',
                                    'Demanda de Compradores',
                                    'Velocidad del Mercado',
                                    'Dinámica de Precios',
                                    'Ciclo de Vida de las Publicaciones',
                                    'Comportamiento de los Vendedores'
                                    ]
                                }
                                ]}

                                listingAddons={[
                                  {
                                    name: 'Destacado por Distrito',
                                    price: '₡2,500',
                                    duration: '30 días',
                                    description:
                                      'Aumente la visibilidad dentro de un distrito.'
                                  },
                                  {
                                    name: 'Destacado por Cantón',
                                    price: '₡5,000',
                                    duration: '30 días',
                                    description:
                                      'Destaque publicaciones en todo un cantón.'
                                  },
                                  {
                                    name: 'Destacado por Provincia',
                                    price: '₡10,000',
                                    duration: '30 días',
                                    description:
                                      'Aumente la visibilidad en toda una provincia.'
                                  },
                                  {
                                    name: 'Destacado Nacional',
                                    price: '₡25,000',
                                    duration: '30 días',
                                    description:
                                      'Promocione publicaciones en todo el país.'
                                  },
                                  {
                                    name: 'Destacado en la Página Principal',
                                    price: '₡50,000',
                                    duration: '30 días',
                                    description:
                                      'Aparezca en la página principal de MarketHub.'
                                  },
                                  {
                                    name: 'Destacado por Categoría',
                                    price: '₡2,500',
                                    duration: '30 días',
                                    description:
                                      'Destaque publicaciones dentro de una categoría de propiedades.'
                                  }
                                ]}

                        exposureOptions={[
                          {
                            name: 'Destacado de Fin de Semana',
                            price: '₡2,500'
                          },
                          {
                            name: 'Destacado de Nueva Publicación',
                            price: '₡4,000'
                          },
                          {
                            name: 'Boletín por Correo Electrónico',
                            price: '₡12,500'
                          },
                          {
                            name: 'Promoción de Casa Abierta',
                            price: '₡10,000'
                          },
                          {
                            name: 'Campaña en Redes Sociales',
                            price: '₡25,000'
                          }
                        ]}

                        presentationOptions={[
                          {
                            name: 'Galería Premium',
                            price: '₡2,500'
                          },
                          {
                            name: 'Plano de Planta',
                            price: '₡75,000'
                          },
                          {
                            name: 'Fotografía con Dron',
                            price: '₡87,500'
                          },
                          {
                            name: 'Video con Dron',
                            price: '₡137,500'
                          },
                          {
                            name: 'Recorrido 3D',
                            price: '₡175,000'
                          },
                          {
                            name: 'Video Cinematográfico',
                            price: '₡250,000'
                          }
                        ]}

                        trustOptions={[
                          {
                            name: 'Propiedad Verificada',
                            price: '₡7,500'
                          },
                          {
                            name: 'Precio Verificado',
                            price: '₡10,000'
                          },
                          {
                            name: 'Financiamiento Disponible',
                            price: '₡5,000'
                          },
                          {
                            name: 'Plano Catastrado Disponible',
                            price: 'Gratis'
                          },
                          {
                            name: 'Internet por Fibra Verificado',
                            price: '₡5,000'
                          }
                        ]}

                        paymentMethods={[
                          {
                            name: 'Tarjetas de Crédito'
                          },
                          {
                            name: 'ACH'
                          },
                          {
                            name: 'SINPE Móvil'
                          },
                          {
                            name: 'PayPal'
                          },
                          {
                            name: 'Transferencia Bancaria',
                            future: true
                          }
                        ]}

                    />
                </div>

                <div style={cardSpacing}>
                    <MarketHubSettings
                        language="es"
                        personalInformation={{
                            name: 'Ryan Hotchkiss',
                            profilePhoto: '',
                            bio:
                                'Costa Rica real estate professional using Inteligencia de Mercado to understand properties, pricing, and local markets.'
                        }}
                        contactInformation={{
                            email: 'ryan@twuanis.com',
                            phone: '+1 (555) 555-5555',
                            whatsapp: '+506 8888-8888',
                            office: 'Pejibaye, Jiménez, Cartago'
                        }}

                        professionalInformation={{
                        professionalType: 'Individual',
                        licenseNumber: 'CR-123456',
                        company: 'Twuanis',
                        website: 'https://twuanis.com'
                    }}

                    publicProfileInformation={{
                    publicProfileUrl: 'twuanis.com/agents/ryan-hotchkiss',
                    agentPage: 'Ryan Hotchkiss',
                    socialLinks: 'LinkedIn, Facebook, Instagram',
                    visibility: 'Public'
                    }}

                    languagePreferences={{
                    language: 'English'
                    }}

                    notificationPreferences={{
                    email: true,
                    sms: false,
                    push: true,
                    marketing: false
                    }}

                    appearancePreferences={{
                    appearance: 'System'
                    }}

                    regionalSettings={{
                    currency: 'USD ($)',
                    units: 'Imperial',
                    dateFormat: 'MM/DD/YYYY',
                    timeZone: 'America/Costa_Rica'
                    }}

                    privacySettings={{
                    publicProfile: true,
                    searchVisibility: true,
                    analyticsSharing: false
                    }}

                    securitySettings={{
                    recoveryEmail: 'ryan@twuanis.com',
                    twoFactorEnabled: false
                    }}

                    sessionSettings={{

                            loggedInDevices: 3,

                            activeSessions: 2

                        }}

                        connectedAccounts={[
                            {
                                provider: 'Google',
                                connected: true,
                                account: 'ryan@twuanis.com'
                            },
                            {
                                provider: 'Apple',
                                connected: false
                            },
                            {
                                provider: 'Facebook',
                                connected: true,
                                account: 'Ryan Hotchkiss'
                            },
                            {
                                provider: 'Microsoft',
                                connected: false
                            }
                        ]}

                        exportDataSettings={{
                        listings: true,
                        favorites: true,
                        savedSearches: true,
                        marketAnalyses: true
                        }}

                        billingRecordsSettings={{
                        invoices: 12,
                        paymentHistory: 37,
                        receipts: 12
                        }}

                        accountRecoverySettings={{
                        backupCodesRemaining: 8,
                        recoveryOptions: 3,
                        accountRestorable: true
                        }}

                        deleteAccountSettings={{
                        downloadDataAvailable: true,
                        listingsToDelete: 27
                        }}

                    />
                </div>

           </main>
            )
         }

const main = {
  minHeight: '100vh',
  padding: '2rem',
  background: '#0a0a0a',
  color: '#ededed'
}

const hero = {
  maxWidth: '900px',
  margin: '3rem auto',
  textAlign: 'center' as const
}

const heading = {
  margin: 0,
  color: '#fff',
  fontSize: 'clamp(2.5rem, 7vw, 4.5rem)'
}

const intro = {
  maxWidth: '700px',
  margin: '1rem auto 0',
  color: '#999',
  fontSize: '1.05rem',
  lineHeight: 1.6
}

const cardSpacing = {
  marginTop: '1.25rem'
}