import IntelligencePackagesSurface from '@/app/components/IntelligencePackagesSurface'
import {getPublicListingCounts} from '@/lib/public-listings-server'
import TopBar from '@/app/components/TopBar'

import PaquetesInteligenciaMercado from './PaquetesInteligenciaMercado'

export default async function PaquetesInteligenciaMercadoPage() {
  const inventory = await getPublicListingCounts()
  return (
    <IntelligencePackagesSurface>
      <TopBar intelligence />
      <PaquetesInteligenciaMercado inventory={inventory} />
    </IntelligencePackagesSurface>
  )
}
