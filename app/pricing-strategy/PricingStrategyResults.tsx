export default function PricingStrategyResults({
  filters,
  strategy
}: {
  filters: any
  strategy: any
}) {

  const recommendedCRC =
    strategy.summary.recommendedPriceCRC

  const recommendedUSD =
    strategy.summary.recommendedPriceUSD


  return (
    <section style={workspace}>

      <section style={hero}>

        <div style={heroEyebrow}>
          Recommended Pricing Position
        </div>

        <div style={heroValue}>
          {recommendedCRC ||
            'No matching data'}
        </div>

        {recommendedUSD && (
          <div style={heroSecondary}>
            {recommendedUSD}
          </div>
        )}

        <div style={heroEvidence}>
          <EvidenceMetric
            label="Confidence"
            value={`${strategy.confidence.score}% · ${strategy.confidence.label}`}
          />

          <EvidenceMetric
            label="Sample"
            value={`${strategy.sampleSize} listings`}
          />

          <EvidenceMetric
            label="Position"
            value={
              strategy.summary.pricingPosition ||
              'Not available'
            }
          />
        </div>

      </section>


      <section style={section}>

        <div style={sectionHeader}>
          <div>
            <div style={eyebrow}>
              Pricing Decision
            </div>

            <h2 style={sectionTitle}>
              Choose Your Market Position
            </h2>
          </div>

          <p style={sectionDescription}>
            Each position reflects a different balance
            between competitiveness, time on market,
            and price ambition.
          </p>
        </div>


        <div style={pricingGrid}>

          <PricingPosition
            label="Conservative"
            crc={
              strategy.summary.conservativePriceCRC
            }
            usd={
              strategy.summary.conservativePriceUSD
            }
            description={
              strategy.strategy.conservative
            }
          />


          <PricingPosition
            label="Recommended"
            crc={
              strategy.summary.recommendedPriceCRC
            }
            usd={
              strategy.summary.recommendedPriceUSD
            }
            description={
              strategy.strategy.market
            }
            primary
          />


          <PricingPosition
            label="Premium"
            crc={
              strategy.summary.premiumPriceCRC
            }
            usd={
              strategy.summary.premiumPriceUSD
            }
            description={
              strategy.strategy.premium
            }
          />

        </div>

      </section>


      <section style={section}>

        <div style={sectionHeader}>
          <div>
            <div style={eyebrow}>
              Market Evidence
            </div>

            <h2 style={sectionTitle}>
              Market Signals
            </h2>
          </div>

          <p style={sectionDescription}>
            Current market evidence supporting the
            recommended pricing position.
          </p>
        </div>


        <div style={signalGrid}>

          <SignalCard
            label="Median Market Price"
            primary={
              strategy.marketSignals.medianPriceCRC
            }
            secondary={
              strategy.marketSignals.medianPriceUSD
            }
          />

          <SignalCard
            label="Average Market Price"
            primary={
              strategy.marketSignals.averagePriceCRC
            }
            secondary={
              strategy.marketSignals.averagePriceUSD
            }
          />

          <SignalCard
            label="Buyer Competition"
            primary={
              strategy.marketSignals.buyerCompetition
            }
          />

          <SignalCard
            label="Expected Time on Market"
            primary={
              strategy.marketSignals.expectedTimeOnMarket
            }
          />

        </div>

      </section>


      <section style={section}>

        <div style={sectionHeader}>
          <div>
            <div style={eyebrow}>
              Comparable Evidence
            </div>

            <h2 style={sectionTitle}>
              Comparable Listings
            </h2>
          </div>

          <p style={sectionDescription}>
            Current listings contributing market context
            to the pricing recommendation.
          </p>
        </div>


        {strategy.comparables?.length > 0 ? (
          <div style={listingGrid}>

            {strategy.comparables.map(
              (listing: any) => (

                <div
                  key={listing.id}
                  style={listingCard}
                >

                  {listing.images?.[0] && (
                    <img
                      src={listing.images[0]}
                      alt={
                        listing.title ||
                        'Listing image'
                      }
                      style={listingImage}
                    />
                  )}


                  <div style={listingContent}>

                    <div>
                      <h3 style={listingTitle}>
                        {listing.title ||
                          'Untitled Listing'}
                      </h3>

                      <p style={listingMeta}>
                        {[
                          listing.district,
                          listing.canton,
                          listing.province
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>


                    <div style={listingPrice}>
                      {listing.formattedPrice ||
                        'N/A'}
                    </div>


                    <div style={listingFacts}>
                      <ListingFact
                        label="Property Type"
                        value={
                          listing.property_type ||
                          'N/A'
                        }
                      />

                      <ListingFact
                        label="Bedrooms"
                        value={
                          listing.bedrooms ||
                          'N/A'
                        }
                      />

                      <ListingFact
                        label="Bathrooms"
                        value={
                          listing.bathrooms ||
                          'N/A'
                        }
                      />
                    </div>

                  </div>

                </div>
              )
            )}

          </div>
        ) : (
          <div style={emptyCard}>
            No comparable listings available yet.
          </div>
        )}

      </section>

    </section>
  )
}


function EvidenceMetric({
  label,
  value
}: {
  label: string
  value: any
}) {
  return (
    <div style={evidenceMetric}>
      <div style={evidenceLabel}>
        {label}
      </div>

      <div style={evidenceValue}>
        {value}
      </div>
    </div>
  )
}


function PricingPosition({
  label,
  crc,
  usd,
  description,
  primary = false
}: {
  label: string
  crc: any
  usd: any
  description: string
  primary?: boolean
}) {
  return (
    <div
      style={{
        ...pricingPosition,
        ...(primary
          ? pricingPositionPrimary
          : {})
      }}
    >

      <div style={positionHeader}>
        <div style={positionLabel}>
          {label}
        </div>

        {primary && (
          <div style={recommendedBadge}>
            Recommended
          </div>
        )}
      </div>


      <div style={positionValue}>
        {crc ||
          'No matching data'}
      </div>

      {usd && (
        <div style={positionSecondary}>
          {usd}
        </div>
      )}


      <div style={positionDivider} />


      <p style={positionDescription}>
        {description}
      </p>

    </div>
  )
}


function SignalCard({
  label,
  primary,
  secondary
}: {
  label: string
  primary: any
  secondary?: any
}) {
  return (
    <div style={signalCard}>

      <div style={signalLabel}>
        {label}
      </div>

      <div style={signalValue}>
        {primary ||
          'No matching data'}
      </div>

      {secondary && (
        <div style={signalSecondary}>
          {secondary}
        </div>
      )}

    </div>
  )
}


function ListingFact({
  label,
  value
}: {
  label: string
  value: any
}) {
  return (
    <div style={listingFact}>
      <div style={listingFactLabel}>
        {label}
      </div>

      <div style={listingFactValue}>
        {value}
      </div>
    </div>
  )
}


const workspace = {
  display: 'grid',
  gap: '1.5rem'
}


const hero = {
  padding:
    'clamp(1.5rem, 4vw, 3rem)',
  background:
    'linear-gradient(135deg, #16150f 0%, #101010 52%, #0b0b0b 100%)',
  border:
    '1px solid #3b3421',
  borderRadius: '22px'
}


const heroEyebrow = {
  marginBottom: '.75rem',
  color: '#C7A44B',
  fontSize: '.72rem',
  fontWeight: 700,
  letterSpacing: '.13em',
  textTransform:
    'uppercase' as const
}


const heroValue = {
  color: '#fff',
  fontSize:
    'clamp(2.5rem, 6vw, 4.8rem)',
  fontWeight: 650,
  lineHeight: 1,
  letterSpacing: '-.045em'
}


const heroSecondary = {
  marginTop: '.6rem',
  color: '#929292',
  fontSize: '1.15rem'
}


const heroEvidence = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(170px, 1fr))',
  gap: '1px',
  marginTop: '2rem',
  background: '#292929',
  border: '1px solid #292929'
}


const evidenceMetric = {
  padding: '1rem 1.1rem',
  background: '#101010'
}


const evidenceLabel = {
  color: '#666',
  fontSize: '.68rem',
  textTransform:
    'uppercase' as const,
  letterSpacing: '.08em'
}


const evidenceValue = {
  marginTop: '.35rem',
  color: '#eee',
  fontSize: '.95rem',
  fontWeight: 600
}


const section = {
  padding:
    'clamp(1.25rem, 3vw, 2rem)',
  background: '#111',
  border: '1px solid #222',
  borderRadius: '20px'
}


const sectionHeader = {
  display: 'flex',
  justifyContent:
    'space-between',
  alignItems: 'flex-end',
  flexWrap: 'wrap' as const,
  gap: '2rem',
  marginBottom: '1.5rem'
}


const eyebrow = {
  marginBottom: '.4rem',
  color: '#C7A44B',
  fontSize: '.7rem',
  fontWeight: 700,
  textTransform:
    'uppercase' as const,
  letterSpacing: '.12em'
}


const sectionTitle = {
  margin: 0,
  color: '#fff',
  fontSize:
    'clamp(1.35rem, 3vw, 1.8rem)',
  fontWeight: 600
}


const sectionDescription = {
  maxWidth: '430px',
  margin: 0,
  color: '#777',
  fontSize: '.9rem',
  lineHeight: 1.5
}


const pricingGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '.8rem'
}


const pricingPosition = {
  padding: '1.35rem',
  background: '#0c0c0c',
  border: '1px solid #252525',
  borderRadius: '16px'
}


const pricingPositionPrimary = {
  background:
    'linear-gradient(145deg, #17140c, #0d0d0d)',
  border: '1px solid #C7A44B'
}


const positionHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent:
    'space-between',
  gap: '.75rem'
}


const positionLabel = {
  color: '#888',
  fontSize: '.74rem',
  fontWeight: 700,
  letterSpacing: '.08em',
  textTransform:
    'uppercase' as const
}


const recommendedBadge = {
  padding: '.28rem .55rem',
  color: '#111',
  background: '#C7A44B',
  borderRadius: '999px',
  fontSize: '.6rem',
  fontWeight: 800,
  letterSpacing: '.06em',
  textTransform:
    'uppercase' as const
}


const positionValue = {
  marginTop: '.9rem',
  color: '#fff',
  fontSize:
    'clamp(1.45rem, 3vw, 2rem)',
  fontWeight: 650
}


const positionSecondary = {
  marginTop: '.3rem',
  color: '#777',
  fontSize: '.9rem'
}


const positionDivider = {
  height: '1px',
  margin: '1rem 0',
  background: '#242424'
}


const positionDescription = {
  margin: 0,
  color: '#aaa',
  fontSize: '.9rem',
  lineHeight: 1.6
}


const signalGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(190px, 1fr))',
  gap: '.75rem'
}


const signalCard = {
  padding: '1.2rem',
  background: '#0c0c0c',
  border: '1px solid #222',
  borderRadius: '14px'
}


const signalLabel = {
  color: '#777',
  fontSize: '.72rem',
  textTransform:
    'uppercase' as const,
  letterSpacing: '.07em'
}


const signalValue = {
  marginTop: '.65rem',
  color: '#fff',
  fontSize: '1.15rem',
  fontWeight: 600
}


const signalSecondary = {
  marginTop: '.25rem',
  color: '#777',
  fontSize: '.86rem'
}


const listingGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '1rem'
}


const listingCard = {
  overflow: 'hidden',
  background: '#0c0c0c',
  border: '1px solid #222',
  borderRadius: '16px'
}


const listingImage = {
  width: '100%',
  height: '190px',
  objectFit: 'cover' as const
}


const listingContent = {
  display: 'grid',
  gap: '1rem',
  padding: '1.1rem'
}


const listingTitle = {
  margin: 0,
  color: '#eee',
  fontSize: '1.05rem',
  lineHeight: 1.4
}


const listingMeta = {
  margin: '.35rem 0 0',
  color: '#777',
  fontSize: '.82rem'
}


const listingPrice = {
  color: '#D4AF37',
  fontSize: '1.2rem',
  fontWeight: 700
}


const listingFacts = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(3, minmax(0, 1fr))',
  gap: '.5rem'
}


const listingFact = {
  minWidth: 0
}


const listingFactLabel = {
  color: '#666',
  fontSize: '.65rem',
  textTransform:
    'uppercase' as const,
  letterSpacing: '.05em'
}


const listingFactValue = {
  marginTop: '.25rem',
  color: '#ccc',
  fontSize: '.85rem'
}


const emptyCard = {
  padding: '1.25rem',
  color: '#777',
  background: '#0c0c0c',
  border: '1px solid #222',
  borderRadius: '14px'
}