export default function MarketMatchingResults({
  filters,
  matches
}: {
  filters: any
  matches: any
}) {
  return (
    <section>

      <h2 style={sectionTitle}>
        Best Matching Properties
      </h2>

      {matches.listings?.length > 0 ? (
        <div style={listingGrid}>
          {matches.listings.map((listing: any) => (
            <div
              key={listing.id}
              style={listingCard}
            >

              {listing.images?.[0] && (
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  style={listingImage}
                />
              )}

              <div style={{ padding: '1rem' }}>

                <div style={scoreBadge}>
                  {listing.matchScore}% Match
                </div>

                <h3 style={listingTitle}>
                  {listing.title}
                </h3>

                <p style={listingMeta}>
                  {listing.province} · {listing.canton}
                </p>

                <div style={listingStats}>

                  <p>
                    Price:
                    <strong> {listing.formattedPrice}</strong>
                  </p>

                  <p>
                    Property Type:
                    <strong> {listing.property_type}</strong>
                  </p>

                  <p>
                    Bedrooms:
                    <strong> {listing.bedrooms || 'N/A'}</strong>
                  </p>

                  <p>
                    Bathrooms:
                    <strong> {listing.bathrooms || 'N/A'}</strong>
                  </p>

                </div>

                <h4 style={subHeading}>
                  Why this property?
                </h4>

                <ul style={bulletList}>
                  {listing.matchReasons?.map(
                    (reason: string) => (
                      <li key={reason}>{reason}</li>
                    )
                  )}
                </ul>

                <h4 style={subHeading}>
                  Missing Features
                </h4>

                {listing.missingFeatures?.length > 0 ? (
                  <ul style={bulletList}>
                    {listing.missingFeatures.map(
                      (feature: string) => (
                        <li key={feature}>
                          {feature}
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p style={perfectMatch}>
                    Perfect Match
                  </p>
                )}

              </div>

            </div>
          ))}
        </div>
      ) : (
        <div style={emptyCard}>
          No matching properties found.
        </div>
      )}

    </section>
  )
}

const sectionTitle = {
  color: '#ff3B00',
  fontSize: '2rem',
  marginBottom: '1rem'
}

const listingGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit,minmax(320px,1fr))',
  gap: '2rem'
}

const listingCard = {
  background: '#111',
  border: '1px solid #222',
  borderRadius: '1rem',
  overflow: 'hidden'
}

const listingImage = {
  width: '100%',
  height: '220px',
  objectFit: 'cover' as const
}

const listingTitle = {
  marginTop: '.75rem',
  marginBottom: '.25rem',
  fontSize: '1.35rem'
}

const listingMeta = {
  color: '#888',
  marginBottom: '1rem'
}

const listingStats = {
  color: '#ddd',
  lineHeight: 1.6
}

const scoreBadge = {
  display: 'inline-block',
  background: '#D4AF37',
  color: '#000',
  padding: '.35rem .8rem',
  borderRadius: '999px',
  fontWeight: 700,
  marginBottom: '.75rem'
}

const subHeading = {
  color: '#ff3B00',
  marginTop: '1.5rem',
  marginBottom: '.5rem'
}

const bulletList = {
  color: '#ddd',
  paddingLeft: '1.25rem',
  lineHeight: 1.6
}

const perfectMatch = {
  color: '#66ff99',
  fontWeight: 700
}

const emptyCard = {
  background: '#111',
  border: '1px solid #222',
  borderRadius: '1rem',
  padding: '1.5rem',
  color: '#888'
}