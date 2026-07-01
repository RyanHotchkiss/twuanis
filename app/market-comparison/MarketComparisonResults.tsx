export default function MarketComparisonResults({
  comparison
}: {
  comparison: any
}) {
  if (!comparison?.left || !comparison?.right) {
    return (
      <section>
        <div style={emptyCard}>
          Define two markets above, then click Compare Markets.
        </div>
      </section>
    )
  }

  return (
    <section>
      <h2 style={sectionTitle}>
        Market Comparison Results
      </h2>

      <div style={comparisonGrid}>
        <MarketColumn
          title="Market A"
          market={comparison.left}
        />

        <MarketColumn
          title="Market B"
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
      <h3 style={marketTitle}>{title}</h3>

      <Stat label="Listings" value={market.sampleSize} />
      <Stat label="Average Sale Price" value={market.averageSalePriceCRC} />
      <Stat label="Median Sale Price" value={market.medianSalePriceCRC} />
      <Stat label="Average Rent" value={market.averageRentCRC} />
      <Stat label="Median Rent" value={market.medianRentCRC} />
      <Stat label="Average Land Area" value={market.averagePropertyArea} />
      <Stat label="Average Construction Area" value={market.averageConstructionArea} />
      <Stat label="Most Common Property Type" value={market.topPropertyType} />
      <Stat label="Most Common Environment" value={market.topEnvironment} />
      <Stat label="Most Common Terrain" value={market.topTerrain} />
      <Stat label="Most Common Utility" value={market.topUtility} />
      <Stat label="Most Common Accessibility" value={market.topAccessibility} />
      <Stat label="Most Common Legal Status" value={market.topLegalStatus} />
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
      <span style={statLabel}>{label}</span>
      <strong style={statValue}>{value || 'No data'}</strong>
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