import TopBar
  from '@/app/components/TopBar'

import MarketHubAuthGate
  from '@/app/components/MarketHubAuthGate'

import MarketHubShell
  from '@/app/components/MarketHubShell'

import MarketHubMyListingsLoader
  from '@/app/components/MarketHubMyListingsLoader'

import MarketHubFavorites
  from '@/app/components/MarketHubFavorites'

import MarketHubIntelligence
  from '@/app/components/MarketHubIntelligence'

import MarketHubPackagesLoader
  from '@/app/components/MarketHubPackagesLoader'

import MarketHubSettings
  from '@/app/components/MarketHubSettings'

import MarketHubFirstTimeExperience
  from '@/app/components/MarketHubFirstTimeExperience'

import MarketHubActivityEngine
  from '@/app/components/MarketHubActivityEngine'

import MarketHubComparisons
  from '@/app/components/MarketHubComparisons'

import MarketHubSavedAnalyses
  from '@/app/components/MarketHubSavedAnalyses'

import MarketHubPaymentReview
  from '@/app/components/MarketHubPaymentReview'

import MarketHubPropertyNotes
  from '@/app/components/MarketHubPropertyNotes'

import MarketIntelligenceTabs
  from '@/app/en/market-intelligence/MarketIntelligenceTabs'

import {
  resolveMarketIntelligenceWorkspace,
  type MarketIntelligenceSearchParams
} from '@/lib/market-intelligence-workspace'

import {
  MARKET_HUB_EXPLORE_ACTIONS,
  MARKET_HUB_FIRST_ACTIONS,
  calculateMarketHubOnboardingProgress
} from '@/lib/onboarding'

import MarketHubCompare
  from '@/app/components/MarketHubCompare'

const onboardingProgress =
  calculateMarketHubOnboardingProgress(
    MARKET_HUB_FIRST_ACTIONS
  )

type PageProps = {
  searchParams:
    Promise<
      MarketIntelligenceSearchParams & {
        intelligence?: string
      }
    >
}

export default async function MarketHubPage({
  searchParams
}: PageProps) {

  const params =
    await searchParams


  const intelligenceWorkspace =
  params.intelligence


const intelligenceTabMap:
  Record<
    string,
    string
  > = {
    explore:
      'explorer',

    valuation:
      'valuation',

    pricing:
      'pricing',

    matching:
      'matching',

    comparison:
      'comparison',

    scarcity:
      'scarcity',

    'price-meter':
      'price-meter'
  }


const resolvedIntelligenceTab =
  intelligenceWorkspace
    ? intelligenceTabMap[
        intelligenceWorkspace
      ]
    : undefined


const resolvedIntelligence =
  resolvedIntelligenceTab
    ? await resolveMarketIntelligenceWorkspace({
        params: {
          ...params,
          tab:
            resolvedIntelligenceTab
        },
        language:
          'en'
      })
    : null


  const intelligenceContent =
    resolvedIntelligence
      ? (
          <MarketIntelligenceTabs
            activeTab={
              resolvedIntelligence.activeTab
            }
            options={
              resolvedIntelligence.options
            }
            filters={
              resolvedIntelligence.filters
            }
            explorerResult={
              resolvedIntelligence.explorerResult
            }
            priceMeterAnalysis={
              resolvedIntelligence.priceMeterAnalysis
            }
            pricingStrategy={
              resolvedIntelligence.pricingStrategy
            }
            marketScarcity={
              resolvedIntelligence.marketScarcity
            }
            buyerDemand={
              resolvedIntelligence.buyerDemand
            }
            marketMatches={
              resolvedIntelligence.marketMatches
            }
            valuation={
              resolvedIntelligence.valuation
            }
            comparison={
              resolvedIntelligence.comparison
            }
            embedded
          />
        )
      : undefined

  const compareContent =
  resolvedIntelligence &&
  intelligenceWorkspace ===
    'comparison'
    ? (
        <MarketHubCompare
          language="en"
          marketOptions={
            resolvedIntelligence.options
          }
          marketFilters={
            resolvedIntelligence.comparisonFilters
          }
          marketComparison={
            resolvedIntelligence.comparison
          }
        />
      )
    : undefined

  return (
    <MarketHubAuthGate>

      <div style={page}>
        <TopBar />


        <MarketHubShell
          language="en"

          overview={
            <div style={workspaceStack}>

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


              <MarketHubActivityEngine
                language="en"
                propertyEvents={[
                  {
                    eventType:
                      'property_viewed',

                    count:
                      0
                  },

                  {
                    eventType:
                      'property_saved',

                    count:
                      0
                  },

                  {
                    eventType:
                      'property_shared',

                    count:
                      0
                  }
                ]}
              />

            </div>
          }


          listings={
            <MarketHubMyListingsLoader
              language="en"
            />
          }


          knowledge={
            <div style={workspaceStack}>

              <MarketHubFavorites
                language="en"
                savedProperties={
                  undefined
                }
                savedSearches={[]}
                recentlyViewedProperties={[]}
                recentlyViewedMarkets={[]}
                favoriteCollections={[]}
              />


              <MarketHubPropertyNotes
                language="en"
              />

              <MarketHubComparisons
                language="en"
              />


              <MarketHubSavedAnalyses
                language="en"
              />

            </div>
          }


          intelligence={
            <MarketHubIntelligence
              language="en"
              engineContent={
                intelligenceContent
              }
              compareContent={
                compareContent
              }
            />
          }


          commercial={
            <div style={workspaceStack}>

              <MarketHubPackagesLoader
                language="en"
              />


              <MarketHubPaymentReview
                language="en"
              />

            </div>
          }


          settings={
            <MarketHubSettings
              language="en"

              personalInformation={{
                name:
                  '',

                profilePhoto:
                  '',

                bio:
                  ''
              }}

              contactInformation={{
                email:
                  '',

                phone:
                  '',

                whatsapp:
                  '',

                office:
                  ''
              }}

              professionalInformation={{
                professionalType:
                  '',

                licenseNumber:
                  '',

                company:
                  '',

                website:
                  ''
              }}

              publicProfileInformation={{
                publicProfileUrl:
                  '',

                agentPage:
                  '',

                socialLinks:
                  '',

                visibility:
                  ''
              }}

              languagePreferences={{
                language:
                  'English'
              }}

              notificationPreferences={{
                email:
                  false,

                sms:
                  false,

                push:
                  false,

                marketing:
                  false
              }}

              appearancePreferences={{
                appearance:
                  'System'
              }}

              regionalSettings={{
                currency:
                  'USD ($)',

                units:
                  'Metric',

                dateFormat:
                  'MM/DD/YYYY',

                timeZone:
                  'America/Costa_Rica'
              }}

              privacySettings={{
                publicProfile:
                  false,

                searchVisibility:
                  false,

                analyticsSharing:
                  false
              }}

              securitySettings={{
                recoveryEmail:
                  '',

                twoFactorEnabled:
                  false
              }}

              sessionSettings={{
                loggedInDevices:
                  0,

                activeSessions:
                  0
              }}

              connectedAccounts={[]}

              exportDataSettings={{
                listings:
                  false,

                favorites:
                  false,

                savedSearches:
                  false,

                marketAnalyses:
                  false
              }}

              billingRecordsSettings={{
                invoices:
                  0,

                paymentHistory:
                  0,

                receipts:
                  0
              }}

              accountRecoverySettings={{
                backupCodesRemaining:
                  0,

                recoveryOptions:
                  0,

                accountRestorable:
                  false
              }}

              deleteAccountSettings={{
                downloadDataAvailable:
                  false,

                listingsToDelete:
                  0
              }}
            />
          }
        />
      </div>

    </MarketHubAuthGate>
  )
}


const page = {
  minHeight:
    '100vh',

  background:
    '#0a0a0a'
}


const workspaceStack = {
  display:
    'grid',

  gap:
    '1.25rem'
}