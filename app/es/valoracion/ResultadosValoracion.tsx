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
            ? 'Valor Estimado de Alquiler'
            : 'Valor Estimado de Mercado'}
        </div>

        <div style={heroValue}>
          {primaryCRC ||
            'No hay suficientes datos'}
        </div>

        {primaryUSD && (
          <div style={heroSecondary}>
            {primaryUSD}
          </div>
        )}

        <div style={confidenceRow}>
          <span style={confidenceLabel}>
            Confianza
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
              Rango de Valoración
            </div>

            <h2 style={sectionTitle}>
              Rango de Precio Recomendado
            </h2>
          </div>

          <p style={sectionDescription}>
            El rango refleja la evidencia del mercado
            que respalda esta valoración.
          </p>
        </div>

        <div style={rangeGrid}>
          <RangePoint
            label="Bajo"
            crc={
              valuation.recommendedRange.lowCRC
            }
            usd={
              valuation.recommendedRange.lowUSD
            }
          />

          <RangePoint
            label="Probable"
            crc={
              valuation.recommendedRange.likelyCRC
            }
            usd={
              valuation.recommendedRange.likelyUSD
            }
            primary
          />

          <RangePoint
            label="Alto"
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
              Evidencia
            </div>

            <h2 style={sectionTitle}>
              Propiedades Comparables
            </h2>
          </div>

          <p style={sectionDescription}>
            Propiedades que aportan evidencia comparable
            del mercado a la valoración.
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
                        'Propiedad sin título'}
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
                      Puntaje Comparable
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
             No hay propiedades comparables disponibles todavía.
          </div>
        )}
      </section>


      <section style={section}>
        <div style={sectionHeader}>
          <div>
            <div style={eyebrow}>
              Razonamiento
            </div>

            <h2 style={sectionTitle}>
              Por Qué Esta Valoración
            </h2>
          </div>

          <p style={sectionDescription}>
            Características del mercado y metodología
            que influyen en la estimación.
          </p>
        </div>

        <div style={reasoningGrid}>
          <TextListCard
            title="Fortalezas"
            items={
              valuation.explanation.strengths
            }
          />

          <TextListCard
            title="Debilidades"
            items={
              valuation.explanation.weaknesses
            }
          />

          <TextListCard
            title="Método"
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
          'No hay suficientes datos'}
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
          No hay notas disponibles.
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