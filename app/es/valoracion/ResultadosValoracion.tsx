export default function ResultadosValoracion({
  filters,
  valuation
}: {
  filters: any
  valuation: any
}) {
  return (
    <section>
      <h2 style={sectionTitle}>
        Resumen de Valoración
      </h2>

      <div style={cardGrid}>
          <StatCard
            label="Valor Estimado de Mercado"
            value={
              valuation.summary.estimatedMarketValueCRC ? (
                <>
                  <div>{valuation.summary.estimatedMarketValueCRC}</div>
                  <div style={secondaryValue}>
                    {valuation.summary.estimatedMarketValueUSD}
                  </div>
                </>
              ) : (
                'No hay suficientes datos'
              )
            }
          />

          <StatCard
            label="Nivel de Confianza"
            value={`${valuation.summary.confidenceScore} · ${valuation.summary.confidenceLabel}`}
          />

          <StatCard
            label="Precio Estimado de Venta"
            value={
              valuation.summary.estimatedSalePriceCRC ? (
                <>
                  <div>{valuation.summary.estimatedSalePriceCRC}</div>
                  <div style={secondaryValue}>
                    {valuation.summary.estimatedSalePriceUSD}
                  </div>
                </>
              ) : (
                'No hay suficientes datos'
              )
            }
          />

          <StatCard
            label="Valor Estimado de Alquiler"
            value={
              valuation.summary.estimatedRentalValueCRC ? (
                <>
                  <div>{valuation.summary.estimatedRentalValueCRC}</div>
                  <div style={secondaryValue}>
                    {valuation.summary.estimatedRentalValueUSD}
                  </div>
                </>
              ) : (
                'No hay suficientes datos'
              )
            }
          />
        </div>

      <h2 style={sectionTitle}>
        Propiedades Comparables
      </h2>

      <div style={cardGrid}>
        {valuation.comparables?.length > 0 ? (
          valuation.comparables.map((listing: any) => (
            <div key={listing.id} style={statCard}>
              <p style={cardLabel}>
                Puntaje Comparable: {listing.comparableScore}
              </p>

              <h3 style={cardValue}>
                {listing.title || 'Propiedad sin título'}
              </h3>

              <p style={{ color: '#888', marginBottom: 0 }}>
                {listing.province} · {listing.canton}
              </p>
            </div>
          ))
        ) : (
          <div style={emptyCard}>
            No hay propiedades comparables disponibles todavía.
          </div>
        )}
      </div>

      <h2 style={sectionTitle}>
        Indicadores del Mercado
      </h2>

      <div style={cardGrid}>
          <StatCard
            label="Precio por m²"
            value={valuation.pricingSignals.pricePerM2 || 'Próximamente'}
          />

          <StatCard
            label="Percentil del Mercado"
            value={valuation.pricingSignals.marketPercentile || 'Próximamente'}
          />

          <StatCard
            label="Días Estimados en el Mercado"
            value={valuation.pricingSignals.daysOnMarketEstimate || 'Próximamente'}
          />

          <StatCard
            label="Sobrevalorada / Subvalorada"
            value={valuation.pricingSignals.pricePosition || 'Próximamente'}
          />
        </div>

        <h2 style={sectionTitle}>
          Rango de Precio Recomendado
        </h2>

        <div style={cardGrid}>
          <StatCard
            label="Estimación Baja"
            value={
              valuation.recommendedRange.lowCRC ? (
                <>
                  <div>{valuation.recommendedRange.lowCRC}</div>
                  <div style={secondaryValue}>
                    {valuation.recommendedRange.lowUSD}
                  </div>
                </>
              ) : (
                'No hay suficientes datos'
              )
            }
          />

          <StatCard
            label="Estimación Probable"
            value={
              valuation.recommendedRange.likelyCRC ? (
                <>
                  <div>{valuation.recommendedRange.likelyCRC}</div>
                  <div style={secondaryValue}>
                    {valuation.recommendedRange.likelyUSD}
                  </div>
                </>
              ) : (
                'No hay suficientes datos'
              )
            }
          />

          <StatCard
            label="Estimación Alta"
            value={
              valuation.recommendedRange.highCRC ? (
                <>
                  <div>{valuation.recommendedRange.highCRC}</div>
                  <div style={secondaryValue}>
                    {valuation.recommendedRange.highUSD}
                  </div>
                </>
              ) : (
                'No hay suficientes datos'
              )
            }
          />
        </div>

      <h2 style={sectionTitle}>
        Explicación de la Valoración
      </h2>

      <div style={cardGrid}>
        <TextListCard
          title="Fortalezas"
          items={valuation.explanation.strengths}
        />

        <TextListCard
          title="Debilidades"
          items={valuation.explanation.weaknesses}
        />

        <TextListCard
          title="Notas del Método"
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
          No hay notas disponibles.
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

const emptyCard = {
  background: '#111',
  border: '1px solid #222',
  borderRadius: '1rem',
  padding: '1.25rem',
  color: '#888',
  marginBottom: '2rem'
}