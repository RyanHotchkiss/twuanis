export default function MarketScarcityResults({
  filters,
  scarcity
}: {
  filters: any
  scarcity: any
}) {
  return (
    <section>
      <h2 style={sectionTitle}>
        Market Scarcity Summary
      </h2>

      <div style={cardGrid}>
        <StatCard
          label="Selected Market Size"
          value={`${scarcity.marketSize} listings`}
        />

        <StatCard
          label="Matching Combination"
          value={`${scarcity.matchingCount} listings`}
        />

        <StatCard
          label="Scarcity Share"
          value={scarcity.scarcityShare || 'No data'}
        />

        <StatCard
          label="Scarcity Level"
          value={scarcity.scarcityLevel || 'No data'}
        />
      </div>

      <h2 style={sectionTitle}>
        Scarce Market Combinations
      </h2>

      {scarcity.combinations?.length > 0 ? (
        <div style={scarcityGrid}>
          {scarcity.combinations.map((item: any) => (
            <div
              key={item.combination}
              style={scarcityCard}
            >
              <div style={scarcityHeader}>
                <p style={scarcityCategory}>
                  {item.category}
                </p>

                <div style={scarcityBadge}>
                  {item.scarcityLevel}
                </div>
              </div>

              <h3 style={scarcityTitle}>
                {item.combination}
              </h3>

              <div style={scarcityStats}>
                <p>
                  Matching listings:{' '}
                  <strong>{item.matchingCount}</strong>
                </p>

                <p>
                  Market share:{' '}
                  <strong>{item.marketShare}</strong>
                </p>

                <p>
                  Total market size:{' '}
                  <strong>{item.marketSize}</strong>
                </p>
              </div>

              <p style={scarcityExplanation}>
                {item.explanation}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div style={emptyCard}>
          No scarcity combinations available yet.
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

const scarcityGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '1.5rem',
  marginBottom: '3rem'
}

const scarcityCard = {
  background: '#111',
  border: '1px solid #222',
  borderRadius: '1rem',
  padding: '1.25rem'
}

const scarcityHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '1rem',
  alignItems: 'center'
}

const scarcityCategory = {
  color: '#888',
  margin: 0,
  fontSize: '.85rem',
  textTransform: 'uppercase' as const,
  letterSpacing: '.06rem'
}

const scarcityBadge = {
  background: '#D4AF37',
  color: '#000',
  borderRadius: '999px',
  padding: '.35rem .7rem',
  fontWeight: 700,
  whiteSpace: 'nowrap' as const
}

const scarcityTitle = {
  color: '#fff',
  fontSize: '1.4rem',
  marginBottom: '1rem'
}

const scarcityStats = {
  color: '#ccc',
  fontSize: '.95rem',
  lineHeight: 1.5
}

const scarcityExplanation = {
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