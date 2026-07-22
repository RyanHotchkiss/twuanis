import TopBar from '@/app/components/TopBar'

import MarketIntelligencePackages from './MarketIntelligencePackages'

export default function MarketIntelligencePackagesPage() {
  return (
    <main style={main}>
      <TopBar />

      <MarketIntelligencePackages />
    </main>
  )
}

const main = {
  minHeight: '100vh',
  padding: '2rem',
  background: '#0a0a0a',
  color: '#ededed'
}