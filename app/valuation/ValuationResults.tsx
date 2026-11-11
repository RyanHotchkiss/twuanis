export default function ValuationResults({
  filters,
  valuation
}: {
  filters: any
  valuation: any
}) {
  const isRent =
    filters.transaction_type === 'rent'

  const primaryCRC =
    isRent
      ? valuation.summary.estimatedRentalValueCRC
      : valuation.summary.estimatedSalePriceCRC ||
        valuation.summary.estimatedMarketValueCRC

  const primaryUSD =
    isRent
      ? valuation.summary.estimatedRentalValueUSD
      : valuation.summary.estimatedSalePriceUSD ||
        valuation.summary.estimatedMarketValueUSD

  return (
    <section style={workspace}>

      <section style={hero}>
        <div style={heroEyebrow}>
          {isRent
            ? 'Estimated Rental Value'
            : 'Estimated Market Value'}
        </div>

        <div style={heroValue}>
          {primaryCRC ||
            'Not enough data'}
        </div>

        {primaryUSD && (
          <div style={heroSecondary}>
            {primaryUSD}
          </div>
        )}

        <div style={confidenceRow}>
          <span style={confidenceLabel}>
            Confidence
          </span>

          <span style={confidenceValue}>
            {valuation.summary.confidenceScore}
            {' · '}
            {valuation.summary.confidenceLabel}
          </span>
        </div>
      </section>


      <section style={section}>
        <div style={sectionHeader}>
          <div>
            <div style={eyebrow}>
              Valuation Range
            </div>

            <h2 style={sectionTitle}>
              Recommended Price Range
            </h2>
          </div>

          <p style={sectionDescription}>
            The range reflects the market evidence
            supporting this valuation.
          </p>
        </div>

        <div style={rangeGrid}>
          <RangePoint
            label="Low"
            crc={
              valuation.recommendedRange.lowCRC
            }
            usd={
              valuation.recommendedRange.lowUSD
            }
          />

          <RangePoint
            label="Likely"
            crc={
              valuation.recommendedRange.likelyCRC
            }
            usd={
              valuation.recommendedRange.likelyUSD
            }
            primary
          />

          <RangePoint
            label="High"
            crc={
              valuation.recommendedRange.highCRC
            }
            usd={
              valuation.recommendedRange.highUSD
            }
          />
        </div>
      </section>


      <section style={section}>
        <div style={sectionHeader}>
          <div>
            <div style={eyebrow}>
              Evidence
            </div>

            <h2 style={sectionTitle}>
              Comparable Properties
            </h2>
          </div>

          <p style={sectionDescription}>
            Listings contributing comparable
            market evidence to the valuation.
          </p>
        </div>

        {valuation.comparables?.length > 0 ? (
          <div style={comparables}>
            {valuation.comparables.map(
              (listing: any) => (
                <div
                  key={listing.id}
                  style={comparableRow}
                >
                  <div style={comparableIdentity}>
                    <div style={comparableTitle}>
                      {listing.title ||
                        'Untitled Listing'}
                    </div>

                    <div style={comparableLocation}>
                      {[
                        listing.district,
                        listing.canton,
                        listing.province
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </div>

                  <div style={scoreBlock}>
                    <span style={scoreLabel}>
                      Comparable Score
                    </span>

                    <strong style={scoreValue}>
                      {listing.comparableScore}
                    </strong>
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          <div style={emptyState}>
            No comparable listings available yet.
          </div>
        )}
      </section>


      <section style={section}>
        <div style={sectionHeader}>
          <div>
            <div style={eyebrow}>
              Reasoning
            </div>

            <h2 style={sectionTitle}>
              Why This Valuation
            </h2>
          </div>

          <p style={sectionDescription}>
            Market characteristics and methodology
            influencing the estimate.
          </p>
        </div>

        <div style={reasoningGrid}>
          <TextListCard
            title="Strengths"
            items={
              valuation.explanation.strengths
            }
          />

          <TextListCard
            title="Weaknesses"
            items={
              valuation.explanation.weaknesses
            }
          />

          <TextListCard
            title="Method"
            items={
              valuation.explanation.notes
            }
          />
        </div>
      </section>

    </section>
  )
}


function RangePoint({
  label,
  crc,
  usd,
  primary = false
}: {
  label: string
  crc: any
  usd: any
  primary?: boolean
}) {
  return (
    <div
      style={{
        ...rangePoint,
        ...(primary
          ? rangePointPrimary
          : {})
      }}
    >
      <div style={rangeLabel}>
        {label}
      </div>

      <div style={rangeValue}>
        {crc ||
          'Not enough data'}
      </div>

      {usd && (
        <div style={rangeSecondary}>
          {usd}
        </div>
      )}
    </div>
  )
}


function TextListCard({
  title,
  items
}: {
  title: string
  items: string[]
}) {
  return (
    <div style={reasoningCard}>
      <div style={reasoningTitle}>
        {title}
      </div>

      {items?.length > 0 ? (
        <ul style={reasoningList}>
          {items.map(
            (item, index) => (
              <li
                key={index}
                style={reasoningItem}
              >
                {item}
              </li>
            )
          )}
        </ul>
      ) : (
        <div style={muted}>
          No notes available.
        </div>
      )}
    </div>
  )
}


const workspace = {
  display: 'grid',
  gap: '1.5rem'
}


const hero = {
  background:
    'linear-gradient(135deg, #151515 0%, #0d0d0d 100%)',
  border:
    '1px solid #2a2a2a',
  borderRadius:
    '22px',
  padding:
    'clamp(1.5rem, 4vw, 3rem)'
}


const heroEyebrow = {
  color: '#9a9a9a',
  fontSize: '.78rem',
  fontWeight: 700,
  textTransform:
    'uppercase' as const,
  letterSpacing: '.12em',
  marginBottom: '.75rem'
}


const heroValue = {
  color: '#fff',
  fontSize:
    'clamp(2.4rem, 6vw, 4.75rem)',
  fontWeight: 650,
  lineHeight: 1,
  letterSpacing: '-.045em'
}


const heroSecondary = {
  color: '#999',
  fontSize: '1.15rem',
  marginTop: '.65rem'
}


const confidenceRow = {
  display: 'flex',
  flexWrap:
    'wrap' as const,
  alignItems: 'center',
  gap: '.65rem',
  marginTop: '2rem',
  paddingTop: '1.25rem',
  borderTop:
    '1px solid #262626'
}


const confidenceLabel = {
  color: '#777',
  fontSize: '.8rem',
  textTransform:
    'uppercase' as const,
  letterSpacing: '.08em'
}


const confidenceValue = {
  color: '#D4AF37',
  fontSize: '.95rem',
  fontWeight: 700
}


const section = {
  background: '#111',
  border:
    '1px solid #222',
  borderRadius: '20px',
  padding:
    'clamp(1.25rem, 3vw, 2rem)'
}


const sectionHeader = {
  display: 'flex',
  justifyContent:
    'space-between',
  alignItems:
    'flex-end',
  gap: '2rem',
  flexWrap:
    'wrap' as const,
  marginBottom: '1.5rem'
}


const eyebrow = {
  color: '#C7A44B',
  fontSize: '.72rem',
  fontWeight: 700,
  textTransform:
    'uppercase' as const,
  letterSpacing: '.12em',
  marginBottom: '.4rem'
}


const sectionTitle = {
  color: '#fff',
  fontSize:
    'clamp(1.35rem, 3vw, 1.8rem)',
  margin: 0,
  fontWeight: 600
}


const sectionDescription = {
  color: '#777',
  maxWidth: '430px',
  lineHeight: 1.5,
  fontSize: '.9rem',
  margin: 0
}


const rangeGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(190px, 1fr))',
  gap: '.75rem'
}


const rangePoint = {
  background: '#0c0c0c',
  border:
    '1px solid #242424',
  borderRadius: '14px',
  padding: '1.25rem'
}


const rangePointPrimary = {
  border:
    '1px solid #C7A44B',
  background: '#15130d'
}


const rangeLabel = {
  color: '#777',
  fontSize: '.75rem',
  textTransform:
    'uppercase' as const,
  letterSpacing: '.08em',
  marginBottom: '.65rem'
}


const rangeValue = {
  color: '#fff',
  fontSize:
    'clamp(1.3rem, 3vw, 1.8rem)',
  fontWeight: 600
}


const rangeSecondary = {
  color: '#777',
  marginTop: '.35rem',
  fontSize: '.9rem'
}


const comparables = {
  display: 'grid',
  gap: '.65rem'
}


const comparableRow = {
  display: 'flex',
  justifyContent:
    'space-between',
  alignItems: 'center',
  gap: '1rem',
  background: '#0c0c0c',
  border:
    '1px solid #222',
  borderRadius: '14px',
  padding:
    '1rem 1.15rem'
}


const comparableIdentity = {
  minWidth: 0
}


const comparableTitle = {
  color: '#eee',
  fontWeight: 600,
  lineHeight: 1.35
}


const comparableLocation = {
  color: '#777',
  fontSize: '.85rem',
  marginTop: '.3rem'
}


const scoreBlock = {
  display: 'grid',
  justifyItems: 'end',
  flexShrink: 0
}


const scoreLabel = {
  color: '#666',
  fontSize: '.7rem',
  textTransform:
    'uppercase' as const,
  letterSpacing: '.07em'
}


const scoreValue = {
  color: '#D4AF37',
  fontSize: '1.25rem',
  marginTop: '.2rem'
}


const reasoningGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(230px, 1fr))',
  gap: '.75rem'
}


const reasoningCard = {
  background: '#0c0c0c',
  border:
    '1px solid #222',
  borderRadius: '14px',
  padding: '1.25rem'
}


const reasoningTitle = {
  color: '#fff',
  fontWeight: 600,
  marginBottom: '.9rem'
}


const reasoningList = {
  margin: 0,
  paddingLeft: '1.15rem',
  color: '#aaa'
}


const reasoningItem = {
  marginBottom: '.55rem',
  lineHeight: 1.5
}


const muted = {
  color: '#666',
  fontSize: '.9rem'
}


const emptyState = {
  background: '#0c0c0c',
  border:
    '1px solid #222',
  borderRadius: '14px',
  padding: '1.25rem',
  color: '#777'
}