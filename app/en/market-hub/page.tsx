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
            savedSearches={[]}
            recentlyViewedProperties={[]}
            recentlyViewedMarkets={[]}
            favoriteCollections={[]}
            propertyNotes={[]}
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
            />
                </div>

                <div
                    id="packages"
                    style={cardSpacing}
                    >
                    <MarketHubPackages
                        language="en"
                        currentPlan="Market Discovery"
                        monthlyPriceUSD="$0"
                        monthlyPriceCRC="₡0"
                        renewalDate="—"
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
                        enginesUsed: 0,
                        savedAnalyses: 0,
                        savedSearches: 0,
                        reportsGenerated: 0,
                        listingsAnalyzed: 0
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