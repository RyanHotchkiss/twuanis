export default function MarketMatchingResults({
  filters,
  matches
}: {
  filters: any
  matches: any
}) {
  const listings =
    matches.listings || []

  return (
    <section style={workspace}>

      <section style={header}>
        <div>
          <div style={eyebrow}>
            Coincidencia de Propiedades
          </div>

          <h2 style={title}>
            Propiedades con Mayor Coincidencia
          </h2>

          <p style={description}>
            Propiedades clasificadas según qué tan
            bien coinciden con los criterios seleccionados.
          </p>
        </div>

        <div style={resultCount}>
          <span style={resultCountValue}>
            {listings.length}
          </span>

          <span style={resultCountLabel}>
            Coincidencias
          </span>
        </div>
      </section>


      {listings.length > 0 ? (
        <div style={results}>

          {listings.map(
            (
              listing: any,
              index: number
            ) => (
              <article
                key={listing.id}
                style={matchCard}
              >

                <div style={rankColumn}>
                  <div style={rankLabel}>
                    Posición
                  </div>

                  <div style={rankValue}>
                    #{index + 1}
                  </div>
                </div>


                <div style={propertyColumn}>

                  {listing.images?.[0] && (
                    <img
                      src={listing.images[0]}
                      alt={
                        listing.title ||
                        'Propiedad'
                      }
                      style={listingImage}
                    />
                  )}

                  <div style={propertyContent}>

                    <div style={propertyHeader}>
                      <div>
                        <h3 style={listingTitle}>
                          {listing.title ||
                            'Propiedad sin título'}
                        </h3>

                        <div style={listingMeta}>
                          {[
                            listing.canton,
                            listing.province
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                      </div>

                      <div style={scoreBlock}>
                        <div style={scoreValue}>
                          {listing.matchScore}%
                        </div>

                        <div style={scoreLabel}>
                          Coincidencia
                        </div>
                      </div>
                    </div>


                    <div style={facts}>
                      <Fact
                        label="Precio"
                        value={
                          listing.formattedPrice ||
                          'N/D'
                        }
                      />

                      <Fact
                        label="Tipo de Propiedad"
                        value={
                          listing.property_type ||
                          'N/D'
                        }
                      />

                      <Fact
                        label="Habitaciones"
                        value={
                          listing.bedrooms ||
                          'N/D'
                        }
                      />

                      <Fact
                        label="Baños"
                        value={
                          listing.bathrooms ||
                          'N/D'
                        }
                      />
                    </div>


                    <div style={reasoningGrid}>

                      <div style={reasoningPanel}>
                        <div style={reasoningHeading}>
                          Por Qué Coincide
                        </div>

                        {listing.matchReasons?.length >
                        0 ? (
                          <div style={reasonList}>
                            {listing.matchReasons.map(
                              (reason: string) => (
                                <div
                                  key={reason}
                                  style={positiveReason}
                                >
                                  <span style={positiveMark}>
                                    ✓
                                  </span>

                                  <span>
                                    {reason}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <div style={muted}>
                            No hay razones de coincidencia disponibles.
                          </div>
                        )}
                      </div>


                      <div style={reasoningPanel}>
                        <div style={reasoningHeading}>
                          Diferencias
                        </div>

                        {listing.missingFeatures
                          ?.length > 0 ? (
                          <div style={reasonList}>
                            {listing.missingFeatures.map(
                              (feature: string) => (
                                <div
                                  key={feature}
                                  style={tradeoffReason}
                                >
                                  <span style={tradeoffMark}>
                                    –
                                  </span>

                                  <span>
                                    {feature}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <div style={perfectMatch}>
                            <span style={positiveMark}>
                              ✓
                            </span>

                            Sin diferencias identificadas
                          </div>
                        )}
                      </div>

                    </div>

                  </div>
                </div>

              </article>
            )
          )}

        </div>
      ) : (
        <div style={emptyState}>
          <div style={emptyTitle}>
            No se encontraron propiedades similares.
          </div>

          <div style={emptyDescription}>
            Ajuste sus criterios para ampliar
            la búsqueda de propiedades.
          </div>
        </div>
      )}

    </section>
  )
}


function Fact({
  label,
  value
}: {
  label: string
  value: any
}) {
  return (
    <div style={fact}>
      <div style={factLabel}>
        {label}
      </div>

      <div style={factValue}>
        {value}
      </div>
    </div>
  )
}


const workspace = {
  display: 'grid',
  gap: '1.25rem'
}


const header = {
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  flexWrap: 'wrap' as const,
  gap: '1.5rem',
  padding:
    'clamp(1.25rem, 3vw, 2rem)',
  background:
    'linear-gradient(135deg, #151515, #0d0d0d)',
  border: '1px solid #252525',
  borderRadius: '20px'
}


const eyebrow = {
  marginBottom: '.45rem',
  color: '#C7A44B',
  fontSize: '.7rem',
  fontWeight: 700,
  letterSpacing: '.12em',
  textTransform:
    'uppercase' as const
}


const title = {
  margin: 0,
  color: '#fff',
  fontSize:
    'clamp(1.7rem, 4vw, 2.5rem)',
  fontWeight: 650,
  letterSpacing: '-.025em'
}


const description = {
  maxWidth: '560px',
  margin: '.65rem 0 0',
  color: '#858585',
  fontSize: '.92rem',
  lineHeight: 1.55
}


const resultCount = {
  display: 'grid',
  justifyItems: 'end'
}


const resultCountValue = {
  color: '#fff',
  fontSize: '2rem',
  fontWeight: 650,
  lineHeight: 1
}


const resultCountLabel = {
  marginTop: '.3rem',
  color: '#666',
  fontSize: '.68rem',
  fontWeight: 700,
  letterSpacing: '.09em',
  textTransform:
    'uppercase' as const
}


const results = {
  display: 'grid',
  gap: '.85rem'
}


const matchCard = {
  display: 'grid',
  gridTemplateColumns:
    '70px minmax(0, 1fr)',
  overflow: 'hidden',
  background: '#111',
  border: '1px solid #222',
  borderRadius: '18px'
}


const rankColumn = {
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  padding: '1.25rem .5rem',
  background: '#0c0c0c',
  borderRight: '1px solid #222'
}


const rankLabel = {
  color: '#555',
  fontSize: '.6rem',
  fontWeight: 700,
  letterSpacing: '.08em',
  textTransform:
    'uppercase' as const
}


const rankValue = {
  marginTop: '.4rem',
  color: '#C7A44B',
  fontSize: '1.35rem',
  fontWeight: 700
}


const propertyColumn = {
  display: 'grid',
  gridTemplateColumns:
    'minmax(180px, 260px) minmax(0, 1fr)'
}


const listingImage = {
  width: '100%',
  height: '100%',
  minHeight: '310px',
  objectFit: 'cover' as const
}


const propertyContent = {
  display: 'grid',
  alignContent: 'start',
  gap: '1.25rem',
  padding: '1.35rem'
}


const propertyHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '1.5rem'
}


const listingTitle = {
  margin: 0,
  color: '#eee',
  fontSize:
    'clamp(1.15rem, 2.5vw, 1.45rem)',
  fontWeight: 600,
  lineHeight: 1.35
}


const listingMeta = {
  marginTop: '.4rem',
  color: '#777',
  fontSize: '.85rem'
}


const scoreBlock = {
  display: 'grid',
  justifyItems: 'end',
  flexShrink: 0
}


const scoreValue = {
  color: '#D4AF37',
  fontSize: '1.8rem',
  fontWeight: 700,
  lineHeight: 1
}


const scoreLabel = {
  marginTop: '.25rem',
  color: '#666',
  fontSize: '.65rem',
  fontWeight: 700,
  letterSpacing: '.08em',
  textTransform:
    'uppercase' as const
}


const facts = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(120px, 1fr))',
  gap: '1px',
  overflow: 'hidden',
  background: '#292929',
  border: '1px solid #292929',
  borderRadius: '12px'
}


const fact = {
  minWidth: 0,
  padding: '.85rem',
  background: '#0c0c0c'
}


const factLabel = {
  color: '#5f5f5f',
  fontSize: '.62rem',
  fontWeight: 700,
  letterSpacing: '.07em',
  textTransform:
    'uppercase' as const
}


const factValue = {
  marginTop: '.3rem',
  overflow: 'hidden',
  color: '#ddd',
  fontSize: '.86rem',
  fontWeight: 600,
  textOverflow: 'ellipsis'
}


const reasoningGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '.75rem'
}


const reasoningPanel = {
  padding: '1rem',
  background: '#0c0c0c',
  border: '1px solid #222',
  borderRadius: '12px'
}


const reasoningHeading = {
  marginBottom: '.8rem',
  color: '#888',
  fontSize: '.68rem',
  fontWeight: 700,
  letterSpacing: '.08em',
  textTransform:
    'uppercase' as const
}


const reasonList = {
  display: 'grid',
  gap: '.5rem'
}


const positiveReason = {
  display: 'flex',
  gap: '.55rem',
  alignItems: 'flex-start',
  color: '#bbb',
  fontSize: '.86rem',
  lineHeight: 1.45
}


const positiveMark = {
  color: '#C7A44B',
  fontWeight: 800
}


const tradeoffReason = {
  display: 'flex',
  gap: '.55rem',
  alignItems: 'flex-start',
  color: '#929292',
  fontSize: '.86rem',
  lineHeight: 1.45
}


const tradeoffMark = {
  color: '#777',
  fontWeight: 800
}


const perfectMatch = {
  display: 'flex',
  gap: '.55rem',
  color: '#bbb',
  fontSize: '.86rem'
}


const muted = {
  color: '#666',
  fontSize: '.85rem'
}


const emptyState = {
  padding: '2rem',
  background: '#111',
  border: '1px solid #222',
  borderRadius: '18px'
}


const emptyTitle = {
  color: '#eee',
  fontSize: '1.05rem',
  fontWeight: 600
}


const emptyDescription = {
  marginTop: '.4rem',
  color: '#777',
  fontSize: '.88rem'
}