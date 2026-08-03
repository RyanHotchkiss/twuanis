import TopBarES from '@/app/components/TopBarES'
import MarketHubAuthGate from '@/app/components/MarketHubAuthGate'
import MarketHubMyListingsLoader from '@/app/components/MarketHubMyListingsLoader'
import MarketHubFavorites from '@/app/components/MarketHubFavorites'
import MarketHubMarketIntelligence from '@/app/components/MarketHubMarketIntelligence'
import MarketHubPackagesLoader from '@/app/components/MarketHubPackagesLoader'
import MarketHubSettings from '@/app/components/MarketHubSettings'
import PermissionGate from '@/app/components/PermissionGate'
import MarketHubFirstTimeExperience from '@/app/components/MarketHubFirstTimeExperience'
import MarketHubActivityEngine from '@/app/components/MarketHubActivityEngine'
import MarketHubComparisons from '@/app/components/MarketHubComparisons'
import MarketHubSavedAnalyses from '@/app/components/MarketHubSavedAnalyses'
import MarketHubPaymentReview
  from '@/app/components/MarketHubPaymentReview'


import {
  MARKET_HUB_EXPLORE_ACTIONS,
  MARKET_HUB_FIRST_ACTIONS,
  calculateMarketHubOnboardingProgress
} from '@/lib/onboarding'

const onboardingProgress =
  calculateMarketHubOnboardingProgress(
    MARKET_HUB_FIRST_ACTIONS
  )

import MarketHubPropertyNotes
  from '@/app/components/MarketHubPropertyNotes'

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
          
        />
    </div>

    <div style={cardSpacing}>
      <MarketHubPropertyNotes
        language="es"
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
                    <MarketHubPackagesLoader
                      language="es"
                    />
                </div>

                <div style={cardSpacing}>
                  <MarketHubPaymentReview
                    language="es"
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