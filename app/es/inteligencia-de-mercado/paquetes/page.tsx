import PackagesWorkspace from '@/app/components/PackagesWorkspace'
import {readAddOnDiscoverySections} from '@/app/components/AddOnDiscovery'
import IntelligencePackagesSurface from '@/app/components/IntelligencePackagesSurface'
import {getPublicListingCounts} from '@/lib/public-listings-server'
import TopBar from '@/app/components/TopBar'

import PaquetesInteligenciaMercado from './PaquetesInteligenciaMercado'

export default async function PaquetesInteligenciaMercadoPage() {
  const [inventory,addOnSections]=await Promise.all([getPublicListingCounts(),readAddOnDiscoverySections({language:'es'})])
  return (
    <IntelligencePackagesSurface>
      <TopBar mobileFit />
      <PackagesWorkspace language="es" intelligence={<PaquetesInteligenciaMercado inventory={inventory} />} addOns={addOnSections.addOns} founding={addOnSections.founding} />
    </IntelligencePackagesSurface>
  )
}
