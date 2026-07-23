import TopBar from '@/app/components/TopBar'

import ComparisonShell from '@/app/components/comparisons/ComparisonShell'
import PropertyComparisonPanel from '@/app/components/comparisons/PropertyComparisonPanel'

export default function PropertyComparisonsPage() {
  return (
    <main style={main}>
      <TopBar />

      <ComparisonShell
        language="en"
        activeKind="property"
        title="Property Comparisons"
        description="Compare saved groups of individual Costa Rica property listings."
      >
        <PropertyComparisonPanel
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