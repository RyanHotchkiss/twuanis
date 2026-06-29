export default function PricingStrategyResults({
  filters,
  strategy
}: {
  filters: any
  strategy: any
}) {
  return (
    <section>
      <h2 style={sectionTitle}>
        Pricing Strategy Summary
      </h2>

      <div style={cardGrid}>
        <StatCard
          label="Conservative Price"
          value={
            strategy.summary.conservativePriceCRC ? (
              <>
                <div>{strategy.summary.conservativePriceCRC}</div>
                <div style={secondaryValue}>
                  {strategy.summary.conservativePriceUSD}
                </div>
              </>
            ) : (
              'No matching data'
            )
          }
        />

        <StatCard
          label="Recommended Price"
          value={
            strategy.summary.recommendedPriceCRC ? (
              <>
                <div>{strategy.summary.recommendedPriceCRC}</div>
                <div style={secondaryValue}>
                  {strategy.summary.recommendedPriceUSD}
                </div>
              </>
            ) : (
              'No matching data'
            )
          }
        />

        <StatCard
          label="Premium Price"
          value={
            strategy.summary.premiumPriceCRC ? (
              <>
                <div>{strategy.summary.premiumPriceCRC}</div>
                <div style={secondaryValue}>
                  {strategy.summary.premiumPriceUSD}
                </div>
              </>
            ) : (
              'No matching data'
            )
          }
        />

        <StatCard
          label="Confidence"
          value={`${strategy.confidence.score}% · ${strategy.confidence.label}`}
        />

        <StatCard
          label="Sample Size"
          value={`${strategy.sampleSize} listings`}
        />

        <StatCard
          label="Pricing Position"
          value={strategy.summary.pricingPosition}
        />
      </div>

      <h2 style={sectionTitle}>
        Strategy Options
      </h2>

      <div style={cardGrid}>
        <TextCard
          title="Conservative Strategy"
          value={strategy.strategy.conservative}
        />

        <TextCard
          title="Market Strategy"
          value={strategy.strategy.market}
        />

        <TextCard
          title="Premium Strategy"
          value={strategy.strategy.premium}
        />
      </div>

      <h2 style={sectionTitle}>
        Market Signals
      </h2>

      <div style={cardGrid}>
        <StatCard
          label="Median Market Price"
          value={
            strategy.marketSignals.medianPriceCRC ? (
              <>
                <div>{strategy.marketSignals.medianPriceCRC}</div>
                <div style={secondaryValue}>
                  {strategy.marketSignals.medianPriceUSD}
                </div>
              </>
            ) : (
              'No matching data'
            )
          }
        />

        <StatCard
          label="Average Market Price"
          value={
            strategy.marketSignals.averagePriceCRC ? (
              <>
                <div>{strategy.marketSignals.averagePriceCRC}</div>
                <div style={secondaryValue}>
                  {strategy.marketSignals.averagePriceUSD}
                </div>
              </>
            ) : (
              'No matching data'
            )
          }
        />

        <StatCard
          label="Estimated Buyer Competition"
          value={strategy.marketSignals.buyerCompetition}
        />

        <StatCard
          label="Expected Time on Market"
          value={strategy.marketSignals.expectedTimeOnMarket}
        />
      </div>

      <h2 style={sectionTitle}>
        Comparable Listings
      </h2>

      {strategy.comparables?.length > 0 ? (
        <div style={listingGrid}>
          {strategy.comparables.map((listing: any) => (
            <div key={listing.id} style={listingCard}>
              {listing.images?.[0] && (
                <img
                  src={listing.images[0]}
                  alt={listing.title || 'Listing image'}
                  style={listingImage}
                />
              )}

              <div style={{ padding: '1rem' }}>
                <h3 style={listingTitle}>
                  {listing.title || 'Untitled Listing'}
                </h3>

                <p style={listingMeta}>
                  {listing.province} · {listing.canton}
                </p>

                <div style={listingStats}>
                  <p>
                    Price:{' '}
                    <strong>{listing.formattedPrice || 'N/A'}</strong>
                  </p>

                  <p>
                    Property Type:{' '}
                    <strong>{listing.property_type || 'N/A'}</strong>
                  </p>

                  <p>
                    Bedrooms:{' '}
                    <strong>{listing.bedrooms || 'N/A'}</strong>
                  </p>

                  <p>
                    Bathrooms:{' '}
                    <strong>{listing.bathrooms || 'N/A'}</strong>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={emptyCard}>
          No comparable listings available yet.
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

function TextCard({
  title,
  value
}: {
  title: string
  value: string
}) {
  return (
    <div style={statCard}>
      <p style={cardLabel}>{title}</p>
      <p style={textValue}>{value}</p>
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

const secondaryValue = {
  marginTop: '.35rem',
  color: '#888',
  fontSize: '1rem',
  fontWeight: 400
}

const textValue = {
  margin: '.75rem 0 0',
  color: '#ddd',
  fontSize: '1rem',
  lineHeight: 1.5
}

const listingGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '2rem',
  marginBottom: '2rem'
}

const listingCard = {
  background: '#111',
  border: '1px solid #222',
  borderRadius: '1rem',
  overflow: 'hidden'
}

const listingImage = {
  width: '100%',
  height: '180px',
  objectFit: 'cover' as const
}

const listingTitle = {
  marginTop: 0,
  marginBottom: '.5rem',
  fontSize: '1.25rem'
}

const listingMeta = {
  color: '#888',
  marginTop: 0
}

const listingStats = {
  color: '#ccc',
  fontSize: '.95rem',
  lineHeight: 1.5
}

const emptyCard = {
  background: '#111',
  border: '1px solid #222',
  borderRadius: '1rem',
  padding: '1.25rem',
  color: '#888',
  marginBottom: '2rem'
}