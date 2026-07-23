import TopBarES from '@/app/components/TopBarES'

import ComparisonShell from '@/app/components/comparisons/ComparisonShell'
import MarketComparisonPanel from '@/app/components/comparisons/MarketComparisonPanel'

export default function ComparacionesDeMercadosPage() {
  return (
    <main style={main}>
      <TopBarES />

      <ComparisonShell
        language="es"
        activeKind="market"
        title="Comparaciones de Mercados"
        description="Compare mercados inmobiliarios guardados mediante ubicación, características, precios e inventario."
      >
        <MarketComparisonPanel
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