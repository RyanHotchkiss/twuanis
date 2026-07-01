export default function BuyerDemandResults({
  filters,
  demand
}: {
  filters: any
  demand: any
}) {
  return (
    <section>
      <h2 style={sectionTitle}>
        Buyer Demand Signals
      </h2>

      <div style={cardGrid}>
        <StatCard
          label="Sample Size"
          value={`${demand.sampleSize} listings`}
        />

        <StatCard
          label="Market Average Price"
          value={demand.marketAveragePriceCRC || 'No data'}
        />

        <StatCard
          label="Market Median Price"
          value={demand.marketMedianPriceCRC || 'No data'}
        />

        <StatCard
          label="Strongest Price Signal"
          value={demand.strongestSignal || 'No signal yet'}
        />
      </div>

      <h2 style={sectionTitle}>
        Characteristics Associated with Higher Prices
      </h2>

      {demand.signals?.length > 0 ? (
        <div style={signalGrid}>
          {demand.signals.map((signal: any) => (
            <div
              key={`${signal.category}-${signal.characteristic}`}
              style={signalCard}
            >
              <div style={signalHeader}>
                <p style={signalCategory}>
                  {signal.category}
                </p>

                <div style={impactBadge}>
                  {signal.priceDifferencePercent}
                </div>
              </div>

              <h3 style={signalTitle}>
                {signal.characteristic}
              </h3>

              <div style={signalStats}>
                <p>
                  With characteristic:{' '}
                  <strong>{signal.withCharacteristicPriceCRC || 'No data'}</strong>
                </p>

                <p>
                  Without characteristic:{' '}
                  <strong>{signal.withoutCharacteristicPriceCRC || 'No data'}</strong>
                </p>

                <p>
                  Sample with characteristic:{' '}
                  <strong>{signal.withCount} listings</strong>
                </p>

                <p>
                  Sample without characteristic:{' '}
                  <strong>{signal.withoutCount} listings</strong>
                </p>
              </div>

              <p style={signalExplanation}>
                {signal.explanation}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div style={emptyCard}>
          Not enough buyer demand signals available yet.
        </div>
      )}
    </section>
  )
}

function StatCard({
  label,
  value
}: {
  label: string
  value: any
}) {
  return (
    <div style={statCard}>
      <p style={cardLabel}>{label}</p>
      <h3 style={cardValue}>{value}</h3>
    </div>
  )
}

const sectionTitle = {
  color: '#ff3B00',
  fontSize: '2rem',
  marginBottom: '1rem'
}

const cardGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1rem',
  marginBottom: '2rem'
}

const statCard = {
  background: '#111',
  border: '1px solid #222',
  borderRadius: '1rem',
  padding: '1.25rem'
}

const cardLabel = {
  color: '#888',
  margin: 0,
  fontSize: '.85rem'
}

const cardValue = {
  margin: '.5rem 0 0',
  fontSize: '1.8rem'
}

const signalGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '1.5rem',
  marginBottom: '3rem'
}

const signalCard = {
  background: '#111',
  border: '1px solid #222',
  borderRadius: '1rem',
  padding: '1.25rem'
}

const signalHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '1rem',
  alignItems: 'center'
}

const signalCategory = {
  color: '#888',
  margin: 0,
  fontSize: '.85rem',
  textTransform: 'uppercase' as const,
  letterSpacing: '.06rem'
}

const impactBadge = {
  background: '#D4AF37',
  color: '#000',
  borderRadius: '999px',
  padding: '.35rem .7rem',
  fontWeight: 700,
  whiteSpace: 'nowrap' as const
}

const signalTitle = {
  color: '#fff',
  fontSize: '1.4rem',
  marginBottom: '1rem'
}

const signalStats = {
  color: '#ccc',
  fontSize: '.95rem',
  lineHeight: 1.5
}

const signalExplanation = {
  color: '#aaa',
  marginTop: '1rem',
  lineHeight: 1.5
}

const emptyCard = {
  background: '#111',
  border: '1px solid #222',
  borderRadius: '1rem',
  padding: '1.5rem',
  color: '#888'
}