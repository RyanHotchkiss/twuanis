export default function MarketComparisonResults({
  comparison
}: {
  comparison: any
}) {
  const spanish = comparison?.language === 'es'
  if (!comparison?.left || !comparison?.right) {
    return (
      <section>
        <div style={emptyCard}>
          {spanish?'Define dos mercados y aplica la comparación.':'Define two markets above, then click Compare Markets.'}
        </div>
      </section>
    )
  }

  return (
    <section>
      <h2 style={sectionTitle}>
        {spanish?'Comparación de mercados':'Market Comparison Results'}
      </h2>

      <div style={comparisonGrid}>
        <MarketColumn
          title={spanish?"Mercado A":"Market A"} spanish={spanish}
          market={comparison.left}
        />

        <MarketColumn
          title={spanish?"Mercado B":"Market B"} spanish={spanish}
          market={comparison.right}
        />
      </div>
    </section>
  )
}

function MarketColumn({
  title,
  market, spanish
}: {
  title: string
  market: any
  spanish: boolean
}) {
  return (
    <div style={marketCard}>
      <h3 style={marketTitle}>{title}</h3>

      <Stat label={spanish?"Propiedades":"Listings"} empty={spanish?"Sin evidencia":"No data"} value={market.sampleSize} />
      <Stat label={spanish?"Precio de venta promedio":"Average Sale Price"} empty={spanish?"Sin evidencia":"No data"} value={market.averageSalePriceCRC} />
      <Stat label={spanish?"Precio de venta mediano":"Median Sale Price"} empty={spanish?"Sin evidencia":"No data"} value={market.medianSalePriceCRC} />
      <Stat label={spanish?"Alquiler promedio":"Average Rent"} empty={spanish?"Sin evidencia":"No data"} value={market.averageRentCRC} />
      <Stat label={spanish?"Alquiler mediano":"Median Rent"} empty={spanish?"Sin evidencia":"No data"} value={market.medianRentCRC} />
      <Stat label={spanish?"Área de terreno promedio":"Average Land Area"} empty={spanish?"Sin evidencia":"No data"} value={market.averagePropertyArea} />
      <Stat label={spanish?"Área de construcción promedio":"Average Construction Area"} empty={spanish?"Sin evidencia":"No data"} value={market.averageConstructionArea} />
      <Stat label={spanish?"Tipo de propiedad más frecuente":"Most Common Property Type"} empty={spanish?"Sin evidencia":"No data"} value={market.topPropertyType} />
      <Stat label={spanish?"Entorno más frecuente":"Most Common Environment"} empty={spanish?"Sin evidencia":"No data"} value={market.topEnvironment} />
      <Stat label={spanish?"Terreno más frecuente":"Most Common Terrain"} empty={spanish?"Sin evidencia":"No data"} value={market.topTerrain} />
      <Stat label={spanish?"Servicio más frecuente":"Most Common Utility"} empty={spanish?"Sin evidencia":"No data"} value={market.topUtility} />
      <Stat label={spanish?"Accesibilidad más frecuente":"Most Common Accessibility"} empty={spanish?"Sin evidencia":"No data"} value={market.topAccessibility} />
      <Stat label={spanish?"Estado legal más frecuente":"Most Common Legal Status"} empty={spanish?"Sin evidencia":"No data"} value={market.topLegalStatus} />
    </div>
  )
}

function Stat({
  label,
  value, empty
}: {
  label: string
  value: any
  empty: string
}) {
  return (
    <div style={statRow}>
      <span style={statLabel}>{label}</span>
      <strong style={statValue}>{value ?? empty}</strong>
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