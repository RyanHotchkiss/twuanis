import IntelligencePackagesSurface from '@/app/components/IntelligencePackagesSurface'
import {getPublicListingCounts} from '@/lib/public-listings-server'
import TopBar from '@/app/components/TopBar'

import MarketIntelligencePackages from './MarketIntelligencePackages'

export default async function MarketIntelligencePackagesPage() {
  const inventory = await getPublicListingCounts()
  return (
    <IntelligencePackagesSurface>
      <TopBar mobileFit intelligence />

      <MarketIntelligencePackages inventory={inventory} />
    </IntelligencePackagesSurface>
  )
}
