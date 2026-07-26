import TopBarES from '@/app/components/TopBarES'
import MarketHubAuthGate from '@/app/components/MarketHubAuthGate'
import MarketHubMyListingsLoader from '@/app/components/MarketHubMyListingsLoader'
import MarketHubFavorites from '@/app/components/MarketHubFavorites'
import MarketHubMarketIntelligence from '@/app/components/MarketHubMarketIntelligence'
import MarketHubPackages from '@/app/components/MarketHubPackages'
import MarketHubSettings from '@/app/components/MarketHubSettings'
import PermissionGate from '@/app/components/PermissionGate'
import MarketHubFirstTimeExperience from '@/app/components/MarketHubFirstTimeExperience'
import MarketHubActivityEngine from '@/app/components/MarketHubActivityEngine'
import MarketHubComparisons from '@/app/components/MarketHubComparisons'
import MarketHubSavedAnalyses from '@/app/components/MarketHubSavedAnalyses'

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
    <MarketHubAuthGate>
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
            userName=""
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

      <MarketHubMyListingsLoader
        language="es"
      />

    <div style={cardSpacing}>
        <MarketHubFavorites
          language="es"
          savedProperties={undefined}
          savedSearches={[]}
          recentlyViewedProperties={[]}
          recentlyViewedMarkets={[]}
          favoriteCollections={[]}
          propertyNotes={[]}
        />
        </div>

        <div style={cardSpacing}>
          <MarketHubComparisons
            language="es"
          />
        </div>

        <div style={cardSpacing}>
          <MarketHubSavedAnalyses
              language="es"
            />
        </div>

        <div style={cardSpacing}>
          <MarketHubMarketIntelligence
            language="es"
          />
                </div>

                <div
                    id="packages"
                    style={cardSpacing}
                    >
                    <MarketHubPackages
                        language="es"
                        currentPlan="Descubrimiento de Mercado"
                        monthlyPriceUSD="$0"
                        monthlyPriceCRC="₡0"
                        renewalDate="—"
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
                        enginesUsed: 0,
                        savedAnalyses: 0,
                        savedSearches: 0,
                        reportsGenerated: 0,
                        listingsAnalyzed: 0
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
                        name: '',
                        profilePhoto: '',
                        bio: ''
                      }}
                      contactInformation={{
                        email: '',
                        phone: '',
                        whatsapp: '',
                        office: ''
                      }}
                      professionalInformation={{
                        professionalType: '',
                        licenseNumber: '',
                        company: '',
                        website: ''
                      }}
                      publicProfileInformation={{
                        publicProfileUrl: '',
                        agentPage: '',
                        socialLinks: '',
                        visibility: ''
                      }}
                      languagePreferences={{
                        language: 'Español'
                      }}
                      notificationPreferences={{
                        email: false,
                        sms: false,
                        push: false,
                        marketing: false
                      }}
                      appearancePreferences={{
                        appearance: 'System'
                      }}
                      regionalSettings={{
                        currency: 'CRC (₡)',
                        units: 'Métrico',
                        dateFormat: 'DD/MM/YYYY',
                        timeZone: 'America/Costa_Rica'
                      }}
                      privacySettings={{
                        publicProfile: false,
                        searchVisibility: false,
                        analyticsSharing: false
                      }}
                      securitySettings={{
                        recoveryEmail: '',
                        twoFactorEnabled: false
                      }}
                      sessionSettings={{
                        loggedInDevices: 0,
                        activeSessions: 0
                      }}
                      connectedAccounts={[]}
                      exportDataSettings={{
                        listings: false,
                        favorites: false,
                        savedSearches: false,
                        marketAnalyses: false
                      }}
                      billingRecordsSettings={{
                        invoices: 0,
                        paymentHistory: 0,
                        receipts: 0
                      }}
                      accountRecoverySettings={{
                        backupCodesRemaining: 0,
                        recoveryOptions: 0,
                        accountRestorable: false
                      }}
                      deleteAccountSettings={{
                        downloadDataAvailable: false,
                        listingsToDelete: 0
                      }}
                    />
                </div>

                 </main>
    </MarketHubAuthGate>
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