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
        Resumen de Estrategia de Precios
      </h2>

      <div style={cardGrid}>
        <StatCard
          label="Precio Conservador"
          value={
            strategy.summary.conservativePriceCRC ? (
              <>
                <div>{strategy.summary.conservativePriceCRC}</div>
                <div style={secondaryValue}>
                  {strategy.summary.conservativePriceUSD}
                </div>
              </>
            ) : (
              'No hay datos coincidentes'
            )
          }
        />

        <StatCard
          label="Precio Recomendado"
          value={
            strategy.summary.recommendedPriceCRC ? (
              <>
                <div>{strategy.summary.recommendedPriceCRC}</div>
                <div style={secondaryValue}>
                  {strategy.summary.recommendedPriceUSD}
                </div>
              </>
            ) : (
              'No hay datos coincidentes'
            )
          }
        />

        <StatCard
          label="Precio Premium"
          value={
            strategy.summary.premiumPriceCRC ? (
              <>
                <div>{strategy.summary.premiumPriceCRC}</div>
                <div style={secondaryValue}>
                  {strategy.summary.premiumPriceUSD}
                </div>
              </>
            ) : (
              'No hay datos coincidentes'
            )
          }
        />

        <StatCard
          label="Confianza"
          value={`${strategy.confidence.score}% · ${strategy.confidence.label}`}
        />

        <StatCard
          label="Tamaño de Muestra"
          value={`${strategy.sampleSize} propiedades`}
        />

        <StatCard
          label="Posición de Precio"
          value={strategy.summary.pricingPosition}
        />
      </div>

      <h2 style={sectionTitle}>
        Opciones de Estrategia
      </h2>

      <div style={cardGrid}>
        <TextCard
          title="Estrategia Conservadora"
          value={strategy.strategy.conservative}
        />

        <TextCard
          title="Estrategia de Mercado"
          value={strategy.strategy.market}
        />

        <TextCard
          title="Estrategia Premium"
          value={strategy.strategy.premium}
        />
      </div>

      <h2 style={sectionTitle}>
        Señales del Mercado
      </h2>

      <div style={cardGrid}>
        <StatCard
          label="Precio Mediano del Mercado"
          value={
            strategy.marketSignals.medianPriceCRC ? (
              <>
                <div>{strategy.marketSignals.medianPriceCRC}</div>
                <div style={secondaryValue}>
                  {strategy.marketSignals.medianPriceUSD}
                </div>
              </>
            ) : (
              'No hay datos coincidentes'
            )
          }
        />

        <StatCard
          label="Precio Promedio del Mercado"
          value={
            strategy.marketSignals.averagePriceCRC ? (
              <>
                <div>{strategy.marketSignals.averagePriceCRC}</div>
                <div style={secondaryValue}>
                  {strategy.marketSignals.averagePriceUSD}
                </div>
              </>
            ) : (
              'No hay datos coincidentes'
            )
          }
        />

        <StatCard
          label="Competencia Estimada de Compradores"
          value={strategy.marketSignals.buyerCompetition}
        />

        <StatCard
          label="Tiempo Esperado en el Mercado"
          value={strategy.marketSignals.expectedTimeOnMarket}
        />
      </div>

      <h2 style={sectionTitle}>
        Propiedades Comparables
      </h2>

      {strategy.comparables?.length > 0 ? (
        <div style={listingGrid}>
          {strategy.comparables.map((listing: any) => (
            <div key={listing.id} style={listingCard}>
              {listing.images?.[0] && (
                <img
                  src={listing.images[0]}
                  alt={listing.title || 'Imagen de la propiedad'}
                  style={listingImage}
                />
              )}

              <div style={{ padding: '1rem' }}>
                <h3 style={listingTitle}>
                  {listing.title || 'Propiedad sin título'}
                </h3>

                <p style={listingMeta}>
                  {listing.province} · {listing.canton}
                </p>

                <div style={listingStats}>
                  <p>
                    Precio:{' '}
                    <strong>{listing.formattedPrice || 'N/D'}</strong>
                  </p>

                  <p>
                    Tipo de Propiedad:{' '}
                    <strong>{listing.property_type || 'N/D'}</strong>
                  </p>

                  <p>
                    Habitaciones:{' '}
                    <strong>{listing.bedrooms || 'N/D'}</strong>
                  </p>

                  <p>
                    Baños:{' '}
                    <strong>{listing.bathrooms || 'N/D'}</strong>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={emptyCard}>
          No hay propiedades comparables disponibles todavía.
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