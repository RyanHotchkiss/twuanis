import TopBar from '@/app/components/TopBar'

import ComparisonShell from '@/app/components/comparisons/ComparisonShell'
import MarketComparisonPanel from '@/app/components/comparisons/MarketComparisonPanel'

export default function ComparacionesDeMercadosPage() {
  return (
    <main style={main}>
      <TopBar />

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