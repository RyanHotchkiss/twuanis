import TopBar from '@/app/components/TopBar'

import ComparisonShell from '@/app/components/comparisons/ComparisonShell'
import EntityComparisonPanel from '@/app/components/comparisons/EntityComparisonPanel'

export default function ComparacionesDeEntidadesPage() {
  return (
    <main style={main}>
      <TopBar />

      <ComparisonShell
        language="es"
        activeKind="entity"
        title="Comparaciones de Entidades"
        description="Compare entidades de la ontología mediante estadísticas calculadas y relaciones del grafo de conocimiento."
      >
        <EntityComparisonPanel
          language="es"
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