import TopBar from '@/app/components/TopBar'
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

export default function MarketHubPage() {
  return (
    <MarketHubAuthGate>
      <main style={main}>
      <TopBar />

      <section style={hero}>
        <h1 style={heading}>
          MarketHub
        </h1>

        <p style={intro}>
          Your Costa Rica real estate activity,
          listings, favorites, and market
          intelligence in one place.
        </p>
      </section>

      <div style={cardSpacing}>
        <MarketHubFirstTimeExperience
            language="en"
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
                language="en"
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
        language="en"
      />

    <div style={cardSpacing}>
        <MarketHubFavorites
            language="en"
            savedProperties={undefined}
            savedSearches={[
                {
                id: '1',
                title: 'San José Houses',
                resultCount: 23,
                lastUpdated: 'Today',
                href: '/en/buy'
                },
                {
                id: '2',
                title: 'Escazú Condos',
                resultCount: 11,
                lastUpdated: 'Yesterday',
                href: '/en/buy'
                }
            ]}


            recentlyViewedProperties={[
                {
                    id: 'recent-property-1',
                    title: 'Casa en Santa Ana',
                    location: 'Santa Ana, San José',
                    price: '$285,000',
                    viewedAt: 'Viewed today',
                    href: '/en/property/recent-property-1'
                },
                {
                    id: 'recent-property-2',
                    title: 'Condo in Escazú',
                    location: 'Escazú, San José',
                    price: '$240,000',
                    viewedAt: 'Viewed yesterday',
                    href: '/en/property/recent-property-2'
                }
                ]}

                recentlyViewedMarkets={[
                {
                    id: 'recent-market-1',
                    title: 'Santa Ana',
                    marketType: 'Canton Market',
                    summary:
                    '23 listings across sale and rental inventory.',
                    viewedAt: 'Viewed today',
                    href:
                    '/en/market-intelligence?tab=explorer'
                }
                ]}


                favoriteCollections={[
                {
                    id: 'collection-1',
                    name: 'Best Santa Ana Homes',
                    propertyCount: 8,
                    updatedAt: 'Updated today',
                    href: '/en/favorites'
                }
                ]}
                propertyNotes={[
                {
                    id: 'note-1',
                    propertyId: 'property-1',
                    propertyTitle: 'Casa en Santa Ana',
                    note:
                    'Good location and strong price, but confirm the construction area.',
                    updatedAt: 'Updated today',
                    href: '/en/property/property-1'
                }
                ]}
            
            />
        </div>

        <div style={cardSpacing}>
          <MarketHubComparisons
            language="en"
          />
        </div>

        <div style={cardSpacing}>
        <MarketHubSavedAnalyses
        language="en"
        />
        </div>

        <div style={cardSpacing}>
          <MarketHubMarketIntelligence
                    language="en"
                    marketsViewedCount={22}
                    lastUpdated="Today"
                    marketExplorerActivity={[
                    {
                        id: 'market-explorer-1',
                        title: 'San José Market Overview',
                        market: 'San José Province',
                        summary:
                        '15 listings, median sale price $239,500, and median rent $1,300.',
                        updatedAt: 'Updated today',
                        href:
                        '/en/market-intelligence?tab=explorer'
                    },
                    {
                        id: 'market-explorer-2',
                        title: 'Escazú Luxury Homes',
                        market: 'Escazú, San José',
                        summary:
                        'Luxury houses filtered by price, construction area, and bedrooms.',
                        updatedAt: 'Viewed yesterday',
                        href:
                        '/en/market-intelligence?tab=explorer'
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
                        language="en"
                        currentPlan="Market Analysis"
                        monthlyPriceUSD="$100"
                        monthlyPriceCRC="₡50,000"
                        renewalDate="August 18, 2026"
                        billingCycle="monthly"
                        includedPackages={[
                            {
                                name: 'Market Discovery',
                                engineCount: 1,
                                active: true,
                                features: [
                                'Market Explorer',
                                'Market statistics',
                                'Market composition',
                                'Knowledge graph access'   
                                ]
                            },
                            {
                                name: 'Valuation & Pricing',
                                engineCount: 3,
                                active: true,
                                features: [
                                'Valuation',
                                'Pricing Strategy',
                                'Property Matching'
                                ]
                            },
                            {
                                name: 'Market Analysis',
                                engineCount: 2,
                                active: true,
                                features: [
                                'Market Comparison',
                                'Market Frequency'
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
                                    name: 'Market Discovery',
                                    priceUSD: '$0',
                                    priceCRC: '₡0',
                                    current: true,
                                    premium: false,
                                    features: [
                                    'Market Explorer',
                                    'Knowledge Graph',
                                    'Market Composition',
                                    'Market Statistics'
                                    ]
                                },
                                {
                                    name: 'Valuation & Pricing',
                                    priceUSD: '$50',
                                    priceCRC: '₡25,000',
                                    current: false,
                                    premium: false,
                                    features: [
                                    'Market Discovery',
                                    '+',
                                    'Valuation',
                                    'Pricing Strategy',
                                    'Property Matching'
                                    ]
                                },
                                {
                                    name: 'Market Analysis',
                                    priceUSD: '$100',
                                    priceCRC: '₡50,000',
                                    current: false,
                                    premium: false,
                                    features: [
                                    'Valuation & Pricing',
                                    '+',
                                    'Market Comparison',
                                    'Market Frequency'
                                    ]
                                },
                                {
                                    name: 'Market Intelligence',
                                    priceUSD: '$200',
                                    priceCRC: '₡100,000',
                                    current: false,
                                    premium: true,
                                    features: [
                                    'Market Analysis',
                                    '+',
                                    'Price / m² Intelligence',
                                    'Market Behavior & Dynamics'
                                    ]
                                },
                                {
                                    name: 'Market Behavior & Dynamics',
                                    priceUSD: '$500',
                                    priceCRC: '₡250,000',
                                    current: false,
                                    premium: true,
                                    features: [
                                    'Market Intelligence',
                                    '+',
                                    'Buyer Demand',
                                    'Market Velocity',
                                    'Price Dynamics',
                                    'Listing Lifecycle',
                                    'Seller Behavior'
                                    ]
                                }
                                ]}

                        listingAddons={[
                                    {
                                        name: 'District Feature',
                                        price: '$5',
                                        duration: '30 Days',
                                        description: 'Boost visibility within a district.'
                                    },
                                    {
                                        name: 'Canton Feature',
                                        price: '$10',
                                        duration: '30 Days',
                                        description: 'Feature listings across an entire canton.'
                                    },
                                    {
                                        name: 'Province Feature',
                                        price: '$20',
                                        duration: '30 Days',
                                        description: 'Increase visibility throughout a province.'
                                    },
                                    {
                                        name: 'National Feature',
                                        price: '$50',
                                        duration: '30 Days',
                                        description: 'Promote listings nationwide.'
                                    },
                                    {
                                        name: 'Homepage Feature',
                                        price: '$100',
                                        duration: '30 Days',
                                        description: 'Appear on the Market Hub homepage.'
                                    },
                                    {
                                        name: 'Category Feature',
                                        price: '$5',
                                        duration: '30 Days',
                                        description: 'Highlight listings within a property category.'
                                    }
                                    ]}

                        exposureOptions={[
                                {
                                    name: 'Weekend Spotlight',
                                    price: '$5'
                                },
                                {
                                    name: 'New Listing Spotlight',
                                    price: '$8'
                                },
                                {
                                    name: 'Email Newsletter',
                                    price: '$25'
                                },
                                {
                                    name: 'Open House Promotion',
                                    price: '$20'
                                },
                                {
                                    name: 'Social Media Blast',
                                    price: '$50'
                                }
                                ]}

                                presentationOptions={[
                                {
                                    name: 'Premium Gallery',
                                    price: '$5'
                                },
                                {
                                    name: 'Floor Plan',
                                    price: '$150'
                                },
                                {
                                    name: 'Drone Photography',
                                    price: '$175'
                                },
                                {
                                    name: 'Drone Video',
                                    price: '$275'
                                },
                                {
                                    name: '3D Tour',
                                    price: '$350'
                                },
                                {
                                    name: 'Cinematic Video',
                                    price: '$500'
                                }
                                ]}

                                trustOptions={[
                                {
                                    name: 'Verified Ownership',
                                    price: '$15'
                                },
                                {
                                    name: 'Price Verified',
                                    price: '$20'
                                },
                                {
                                    name: 'Financing Available',
                                    price: '$10'
                                },
                                {
                                    name: 'Survey Available',
                                    price: 'Free'
                                },
                                {
                                    name: 'Fiber Internet Verified',
                                    price: '$10'
                                }
                                ]}

                                paymentMethods={[
                                {
                                    name: 'Credit Cards'
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
                                    name: 'Wire Transfer',
                                    future: true
                                }
                                ]}

                    />
                </div>

                <div style={cardSpacing}>
                    <MarketHubSettings
                        language="en"
                        personalInformation={{
                            name: 'Ryan Hotchkiss',
                            profilePhoto: '',
                            bio:
                                'Costa Rica real estate professional using market intelligence to understand properties, pricing, and local markets.'
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