import PackagesWorkspace from '@/app/components/PackagesWorkspace'
import {readAddOnDiscoverySections} from '@/app/components/AddOnDiscovery'
import IntelligencePackagesSurface from '@/app/components/IntelligencePackagesSurface'
import {getPublicListingCounts} from '@/lib/public-listings-server'
import TopBar from '@/app/components/TopBar'

import MarketIntelligencePackages from './MarketIntelligencePackages'

export default async function MarketIntelligencePackagesPage() {
  const [inventory,addOnSections]=await Promise.all([getPublicListingCounts(),readAddOnDiscoverySections({language:'en'})])
  return (
    <IntelligencePackagesSurface>
      <TopBar mobileFit />

      <PackagesWorkspace language="en" intelligence={<MarketIntelligencePackages inventory={inventory} />} addOns={addOnSections.addOns} founding={addOnSections.founding} />
    </IntelligencePackagesSurface>
  )
}
