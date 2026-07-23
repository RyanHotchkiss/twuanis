import TopBar from '@/app/components/TopBar'

import ComparisonShell from '@/app/components/comparisons/ComparisonShell'
import EntityComparisonPanel from '@/app/components/comparisons/EntityComparisonPanel'

export default function EntityComparisonsPage() {
  return (
    <main style={main}>
      <TopBar />

      <ComparisonShell
        language="en"
        activeKind="entity"
        title="Entity Comparisons"
        description="Compare ontology entities using calculated market statistics and knowledge graph relationships."
      >
        <EntityComparisonPanel
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