export default function ResultadosComparacionMercado({
  comparison
}: {
  comparison: any
}) {
  if (!comparison?.left || !comparison?.right) {
    return (
      <section>
        <div style={emptyCard}>
          Defina dos mercados arriba y luego haga clic en Comparar Mercados.
        </div>
      </section>
    )
  }

  return (
    <section>
      <h2 style={sectionTitle}>
        Resultados de la Comparación de Mercados
      </h2>

      <div style={comparisonGrid}>
        <MarketColumn
          title="Mercado A"
          market={comparison.left}
        />

        <MarketColumn
          title="Mercado B"
          market={comparison.right}
        />
      </div>
    </section>
  )
}

function MarketColumn({
  title,
  market
}: {
  title: string
  market: any
}) {
  return (
    <div style={marketCard}>
      <h3 style={marketTitle}>
        {title}
      </h3>

      <Stat
        label="Propiedades"
        value={market.sampleSize}
      />

      <Stat
        label="Precio Promedio de Venta"
        value={market.averageSalePriceCRC}
      />

      <Stat
        label="Precio Mediano de Venta"
        value={market.medianSalePriceCRC}
      />

      <Stat
        label="Alquiler Promedio"
        value={market.averageRentCRC}
      />

      <Stat
        label="Alquiler Mediano"
        value={market.medianRentCRC}
      />

      <Stat
        label="Área Promedio del Terreno"
        value={market.averagePropertyArea}
      />

      <Stat
        label="Área Promedio de Construcción"
        value={market.averageConstructionArea}
      />

      <Stat
        label="Tipo de Propiedad Más Común"
        value={market.topPropertyType}
      />

      <Stat
        label="Entorno Más Común"
        value={market.topEnvironment}
      />

      <Stat
        label="Terreno Más Común"
        value={market.topTerrain}
      />

      <Stat
        label="Servicio Más Común"
        value={market.topUtility}
      />

      <Stat
        label="Accesibilidad Más Común"
        value={market.topAccessibility}
      />

      <Stat
        label="Estado Legal Más Común"
        value={market.topLegalStatus}
      />
    </div>
  )
}

function Stat({
  label,
  value
}: {
  label: string
  value: any
}) {
  return (
    <div style={statRow}>
      <span style={statLabel}>
        {label}
      </span>

      <strong style={statValue}>
        {value || 'Sin datos'}
      </strong>
    </div>
  )
}

const sectionTitle = {
  color: '#ff3B00',
  fontSize: '2rem',
  marginBottom: '1rem'
}

const comparisonGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '2rem',
  marginBottom: '3rem'
}

const marketCard = {
  background: '#111',
  border: '1px solid #222',
  borderRadius: '1rem',
  padding: '1.5rem'
}

const marketTitle = {
  color: '#D4AF37',
  fontSize: '1.5rem',
  marginTop: 0,
  marginBottom: '1.5rem'
}

const statRow = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '1rem',
  borderBottom: '1px solid #222',
  padding: '.75rem 0'
}

const statLabel = {
  color: '#888'
}

const statValue = {
  color: '#fff',
  textAlign: 'right' as const
}

const emptyCard = {
  background: '#111',
  border: '1px solid #222',
  borderRadius: '1rem',
  padding: '1.5rem',
  color: '#888'
}