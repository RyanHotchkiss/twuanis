import TopBar from '@/app/components/TopBar'

import ComparisonShell from '@/app/components/comparisons/ComparisonShell'
import MarketComparisonPanel from '@/app/components/comparisons/MarketComparisonPanel'

export default function MarketComparisonsPage() {
  return (
    <main style={main}>
      <TopBar />

      <ComparisonShell
        language="en"
        activeKind="market"
        title="Market Comparisons"
        description="Compare saved real estate markets using geography, property characteristics, pricing, and inventory filters."
      >
        <MarketComparisonPanel
          language="en"
        />
      </ComparisonShell>
    </main>
  )
}

const main = {
  minHeight: '100vh',
  background: '#0a0a0a',
  color: '#ededed'
}