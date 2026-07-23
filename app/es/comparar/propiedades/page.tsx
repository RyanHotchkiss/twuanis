import TopBarES from '@/app/components/TopBarES'

import ComparisonShell from '@/app/components/comparisons/ComparisonShell'
import PropertyComparisonPanel from '@/app/components/comparisons/PropertyComparisonPanel'

export default function ComparacionesDePropiedadesPage() {
  return (
    <main style={main}>
      <TopBarES />

      <ComparisonShell
        language="es"
        activeKind="property"
        title="Comparaciones de Propiedades"
        description="Compare grupos guardados de propiedades inmobiliarias individuales en Costa Rica."
      >
        <PropertyComparisonPanel
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