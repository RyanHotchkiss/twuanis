 function LimitedData({
        sampleSize
        }: {
        sampleSize: number
        }) {
        return (
            <>
            <div>Limited data</div>
            <div style={secondaryValue}>
                Based on {sampleSize} listings
            </div>
            </>
        )
        }


export default function PriceMeterResults({
  filters,
  analysis
}: {
  filters: any
  analysis: any
}) {
  return (

            <section>
            
            <h2 style={sectionTitle}>
                Price per Square Meter Summary
            </h2>

            <div style={cardGrid}>
                <StatCard
                label="Average Price ÷ Land Area"
                value={
                    analysis.summary.averagePricePerLandM2 ? (
                    <>
                        <div>{analysis.summary.averagePricePerLandM2}</div>
                        <div style={secondaryValue}>
                        {analysis.summary.averagePricePerLandFt2}
                        </div>
                    </>
                    ) : (
                    <LimitedData sampleSize={analysis.sampleSize} />
                    )
                }
                />

                <StatCard
                label="Median Price ÷ Land Area"
                value={
                    analysis.summary.medianPricePerLandM2 ? (
                    <>
                        <div>{analysis.summary.medianPricePerLandM2}</div>
                        <div style={secondaryValue}>
                        {analysis.summary.medianPricePerLandFt2}
                        </div>
                    </>
                    ) : (
                    <LimitedData sampleSize={analysis.sampleSize} />
                    )
                }
                />

                <StatCard
                label="Average Price ÷ Construction Area"
                value={
                    analysis.summary.averagePricePerConstructionM2 ? (
                    <>
                        <div>{analysis.summary.averagePricePerConstructionM2}</div>
                        <div style={secondaryValue}>
                        {analysis.summary.averagePricePerConstructionFt2}
                        </div>
                    </>
                    ) : (
                    <LimitedData sampleSize={analysis.sampleSize} />
                    )
                }
                />

                <StatCard
                label="Median Price ÷ Construction Area"
                value={
                    analysis.summary.medianPricePerConstructionM2 ? (
                    <>
                        <div>{analysis.summary.medianPricePerConstructionM2}</div>
                        <div style={secondaryValue}>
                        {analysis.summary.medianPricePerConstructionFt2}
                        </div>
                    </>
                    ) : (
                    <LimitedData sampleSize={analysis.sampleSize} />
                    )
                }
                />

                <StatCard
                label="Sample Size"
                value={`${analysis.sampleSize} listings`}
                />

                <StatCard
                label="Confidence"
                value={`${analysis.confidence.score}% · ${analysis.confidence.label}`}
                />
            </div>

            <h2 style={sectionTitle}>
                Market Breakdown
            </h2>

            <div style={cardGrid}>
                <StatCard
                label="Lowest Price ÷ Land Area"
                value={
                    analysis.breakdown.lowestPricePerLandM2 ? (
                    <>
                        <div>{analysis.breakdown.lowestPricePerLandM2}</div>
                        <div style={secondaryValue}>
                        {analysis.breakdown.lowestPricePerLandFt2}
                        </div>
                    </>
                    ) : (
                    <LimitedData sampleSize={analysis.sampleSize} />
                    )
                }
                />

                <StatCard
                label="Highest Price ÷ Land Area"
                value={
                    analysis.breakdown.highestPricePerLandM2 ? (
                    <>
                        <div>{analysis.breakdown.highestPricePerLandM2}</div>
                        <div style={secondaryValue}>
                        {analysis.breakdown.highestPricePerLandFt2}
                        </div>
                    </>
                    ) : (
                    <LimitedData sampleSize={analysis.sampleSize} />
                    )
                }
                />

                <StatCard
                label="Lowest Price ÷ Construction Area"
                value={
                    analysis.breakdown.lowestPricePerConstructionM2 ? (
                    <>
                        <div>{analysis.breakdown.lowestPricePerConstructionM2}</div>
                        <div style={secondaryValue}>
                        {analysis.breakdown.lowestPricePerConstructionFt2}
                        </div>
                    </>
                    ) : (
                    <LimitedData sampleSize={analysis.sampleSize} />
                    )
                }
                />

                <StatCard
                label="Highest Price ÷ Construction Area"
                value={
                    analysis.breakdown.highestPricePerConstructionM2 ? (
                    <>
                        <div>{analysis.breakdown.highestPricePerConstructionM2}</div>
                        <div style={secondaryValue}>
                        {analysis.breakdown.highestPricePerConstructionFt2}
                        </div>
                    </>
                    ) : (
                    <LimitedData sampleSize={analysis.sampleSize} />
                    )
                }
                />
            </div>

            <h2 style={sectionTitle}>
                Matching Listings
            </h2>

            {analysis.listings?.length > 0 ? (
                <div style={listingGrid}>
                {analysis.listings.map((listing: any) => (
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
                            Price: <strong>{listing.formattedPrice || 'N/A'}</strong>
                        </p>

                        <p>
                            Land Area:{' '}
                            <strong>{listing.property_area || 'N/A'} m²</strong>
                        </p>

                        <p>
                            Construction Area:{' '}
                            <strong>{listing.construction_area || 'N/A'} m²</strong>
                        </p>

                        <p>
                            Price ÷ Land Area:{' '}
                            <strong>{listing.pricePerLandM2 || 'N/A'}</strong>
                        </p>

                        <p>
                            Price ÷ Construction Area:{' '}
                            <strong>{listing.pricePerConstructionM2 || 'N/A'}</strong>
                        </p>
                        </div>
                    </div>
                    </div>
                ))}
                </div>
            ) : (
                <div style={emptyCard}>
                No matching listings available yet.
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

const secondaryValue = {
  marginTop: '.35rem',
  color: '#888',
  fontSize: '1rem',
  fontWeight: 400
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