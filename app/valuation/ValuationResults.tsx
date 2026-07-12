export default function ValuationResults({
  filters,
  valuation
}: {
  filters: any
  valuation: any
}) {
  const isRent =
    filters.transaction_type === 'rent'

  return (
    <section>
      <h2 style={sectionTitle}>
        Valuation Summary
      </h2>

      <div style={cardGrid}>
        <StatCard
          label="Estimated Market Value"
          value={
            valuation.summary.estimatedMarketValueCRC ? (
              <>
                <div>{valuation.summary.estimatedMarketValueCRC}</div>
                <div style={secondaryValue}>
                  {valuation.summary.estimatedMarketValueUSD}
                </div>
              </>
            ) : (
              'Not enough data'
            )
          }
        />

        <StatCard
          label="Confidence Score"
          value={`${valuation.summary.confidenceScore} · ${valuation.summary.confidenceLabel}`}
        />

        {!isRent && (
        <StatCard
          label="Estimated Sale Price"
          value={
            valuation.summary.estimatedSalePriceCRC ? (
              <>
                <div>{valuation.summary.estimatedSalePriceCRC}</div>
                <div style={secondaryValue}>
                  {valuation.summary.estimatedSalePriceUSD}
                </div>
              </>
            ) : (
              'Not enough data'
            )
          }
        />
      )}

        {isRent && (
          <StatCard
            label="Estimated Rental Value"
            value={
              valuation.summary.estimatedRentalValueCRC ? (
                <>
                  <div>{valuation.summary.estimatedRentalValueCRC}</div>
                  <div style={secondaryValue}>
                    {valuation.summary.estimatedRentalValueUSD}
                  </div>
                </>
              ) : (
                'Not enough data'
              )
            }
          />
        )}
      </div>

      <h2 style={sectionTitle}>
        Comparable Properties
      </h2>

      <div style={cardGrid}>
        {valuation.comparables?.length > 0 ? (
          valuation.comparables.map((listing: any) => (
            <div key={listing.id} style={statCard}>
              <p style={cardLabel}>
                Comparable Score: {listing.comparableScore}
              </p>

              <h3 style={cardValue}>
                {listing.title || 'Untitled Listing'}
              </h3>

              <p style={{ color: '#888', marginBottom: 0 }}>
                {listing.province} · {listing.canton}
              </p>
            </div>
          ))
        ) : (
          <div style={emptyCard}>
            No comparable listings available yet.
          </div>
        )}
      </div>

      

      <h2 style={sectionTitle}>
        Recommended Price Range
      </h2>

      <div style={cardGrid}>
        <StatCard
          label="Low Estimate"
          value={
            valuation.recommendedRange.lowCRC ? (
              <>
                <div>{valuation.recommendedRange.lowCRC}</div>
                <div style={secondaryValue}>
                  {valuation.recommendedRange.lowUSD}
                </div>
              </>
            ) : (
              'Not enough data'
            )
          }
        />

        <StatCard
          label="Likely Estimate"
          value={
            valuation.recommendedRange.likelyCRC ? (
              <>
                <div>{valuation.recommendedRange.likelyCRC}</div>
                <div style={secondaryValue}>
                  {valuation.recommendedRange.likelyUSD}
                </div>
              </>
            ) : (
              'Not enough data'
            )
          }
        />

        <StatCard
          label="High Estimate"
          value={
            valuation.recommendedRange.highCRC ? (
              <>
                <div>{valuation.recommendedRange.highCRC}</div>
                <div style={secondaryValue}>
                  {valuation.recommendedRange.highUSD}
                </div>
              </>
            ) : (
              'Not enough data'
            )
          }
        />
      </div>

      <h2 style={sectionTitle}>
        Valuation Explanation
      </h2>

      <div style={cardGrid}>
        <TextListCard
          title="Strengths"
          items={valuation.explanation.strengths}
        />

        <TextListCard
          title="Weaknesses"
          items={valuation.explanation.weaknesses}
        />

        <TextListCard
          title="Method Notes"
          items={valuation.explanation.notes}
        />
      </div>
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

function TextListCard({
  title,
  items
}: {
  title: string
  items: string[]
}) {
  return (
    <div style={statCard}>
      <p style={cardLabel}>{title}</p>

      {items?.length > 0 ? (
        <ul style={{ marginBottom: 0, paddingLeft: '1.25rem' }}>
          {items.map((item, index) => (
            <li key={index} style={{ marginBottom: '.5rem' }}>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: '#888', marginBottom: 0 }}>
          No notes available.
        </p>
      )}
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

const secondaryValue = {
  marginTop: '.35rem',
  color: '#888',
  fontSize: '1rem',
  fontWeight: 400
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

const emptyCard = {
  background: '#111',
  border: '1px solid #222',
  borderRadius: '1rem',
  padding: '1.25rem',
  color: '#888',
  marginBottom: '2rem'
}