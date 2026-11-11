function normalizeKey(value: string) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
}

function translateValue(value: string) {
  const key = normalizeKey(value)

  const labels: Record<string, string> = {
    property_type: 'Tipo de Propiedad',
    bedrooms: 'Habitaciones',
    bathrooms: 'Baños',
    parking: 'Estacionamiento',
    environment: 'Entorno',
    terrain: 'Terreno',
    utility: 'Servicios',
    accessibility: 'Accesibilidad',
    legal_status: 'Estado Legal',

    cabin: 'Cabaña',
    commercial_property: 'Propiedad Comercial',
    condo: 'Condominio',
    farm: 'Finca',
    house: 'Casa',
    land: 'Terreno',

    beachfront: 'Frente a la Playa',
    jungle: 'Selva',
    lakefront: 'Frente al Lago',
    mountain_view: 'Vista a la Montaña',
    riverfront: 'Frente al Río',
    rural: 'Rural',
    urban: 'Urbano',

    fiber_internet: 'Internet de Fibra',
    municipal_water: 'Agua Municipal',
    titled_property: 'Propiedad Titulada'
  }

  return labels[key] || value
}

export default function ResultadosDemandaComprador({
  filters,
  demand
}: {
  filters: any
  demand: any
}) {
  return (
    <section>
      <h2 style={sectionTitle}>
        Señales de Demanda del Mercado
      </h2>

      <div style={cardGrid}>
        <StatCard
          label="Muestra"
          value={`${demand.sampleSize} propiedades`}
        />

        <StatCard
          label="Precio Promedio"
          value={demand.marketAveragePriceCRC || 'Sin datos'}
        />

        <StatCard
          label="Precio Mediano"
          value={demand.marketMedianPriceCRC || 'Sin datos'}
        />

        <StatCard
          label="Señal Más Fuerte"
          value={demand.strongestSignal || 'Sin datos'}
        />
      </div>

      <h2 style={sectionTitle}>
        Características Asociadas con Precios Más Altos
      </h2>

      {demand.signals?.length > 0 ? (
        <div style={signalGrid}>
          {demand.signals.map((signal: any) => (
            <div
              key={`${translateValue(signal.category)}-${translateValue(signal.characteristic)}`}
              style={signalCard}
            >
              <div style={signalHeader}>
                <p style={signalCategory}>
                  {translateValue(signal.category)}
                </p>

                <div style={impactBadge}>
                  {signal.priceDifferencePercent}
                </div>
              </div>

              <h3 style={signalTitle}>
                {translateValue(signal.characteristic)}
              </h3>

              <div style={signalStats}>
                <p>
                  Con característica:{' '}
                  <strong>
                    {signal.withCharacteristicPriceCRC || 'Sin datos'}
                  </strong>
                </p>

                <p>
                  Sin característica:{' '}
                  <strong>
                    {signal.withoutCharacteristicPriceCRC || 'Sin datos'}
                  </strong>
                </p>

                <p>
                  Propiedades con la característica:{' '}
                  <strong>
                    {signal.withCount}
                  </strong>
                </p>

                <p>
                  Propiedades sin la característica:{' '}
                  <strong>
                    {signal.withoutCount}
                  </strong>
                </p>

                <p>
                  Confianza:{' '}
                  <strong>
                    {signal.confidence}
                  </strong>
                </p>
              </div>

              <p style={signalExplanation}>
                Las propiedades con{' '}
                <strong>{translateValue(signal.characteristic)}</strong>{' '}
                muestran una diferencia de precio promedio de{' '}
                <strong>{signal.priceDifferencePercent || 'sin datos suficientes'}</strong>{' '}
                frente a propiedades comparables sin esta característica.
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div style={emptyCard}>
          No existen suficientes datos para calcular señales de demanda.
        </div>
      )}

      {demand.pairSignals?.length > 0 && (
        <>
          <h2 style={sectionTitle}>
            Combinaciones de Características
          </h2>

          <div style={signalGrid}>
            {demand.pairSignals.map((signal: any) => (
              <div
                key={`pair-${translateValue(signal.characteristic)}`}
                style={signalCard}
              >
                <div style={signalHeader}>
                  <p style={signalCategory}>
                    {translateValue(signal.category)}
                  </p>

                  <div style={impactBadge}>
                    {signal.priceDifferencePercent}
                  </div>
                </div>

                <h3 style={signalTitle}>
                  {translateValue(signal.characteristic)}
                </h3>

                <p style={signalExplanation}>
                  Las propiedades con{' '}
                  <strong>{translateValue(signal.characteristic)}</strong>{' '}
                  muestran una diferencia de precio promedio de{' '}
                  <strong>{signal.priceDifferencePercent || 'sin datos suficientes'}</strong>{' '}
                  frente a propiedades comparables sin esta característica.
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {demand.segmentedSignals?.length > 0 && (
        <>
          <h2 style={sectionTitle}>
            Señales Segmentadas
          </h2>

          <div style={signalGrid}>
            {demand.segmentedSignals.map((signal: any) => (
              <div
                key={`segment-${translateValue(signal.characteristic)}`}
                style={signalCard}
              >
                <div style={signalHeader}>
                  <p style={signalCategory}>
                    {translateValue(signal.category)}
                  </p>

                  <div style={impactBadge}>
                    {signal.priceDifferencePercent}
                  </div>
                </div>

                <h3 style={signalTitle}>
                  {translateValue(signal.characteristic)}
                </h3>

                <p style={signalExplanation}>
                  Las propiedades con{' '}
                  <strong>{translateValue(signal.characteristic)}</strong>{' '}
                  muestran una diferencia de precio promedio de{' '}
                  <strong>{signal.priceDifferencePercent || 'sin datos suficientes'}</strong>{' '}
                  frente a propiedades comparables sin esta característica.
                </p>
              </div>
            ))}
          </div>
        </>
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

const signalGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '1.5rem',
  marginBottom: '3rem'
}

const signalCard = {
  background: '#111',
  border: '1px solid #222',
  borderRadius: '1rem',
  padding: '1.25rem'
}

const signalHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '1rem',
  alignItems: 'center'
}

const signalCategory = {
  color: '#888',
  margin: 0,
  fontSize: '.85rem',
  textTransform: 'uppercase' as const,
  letterSpacing: '.06rem'
}

const impactBadge = {
  background: '#D4AF37',
  color: '#000',
  borderRadius: '999px',
  padding: '.35rem .7rem',
  fontWeight: 700,
  whiteSpace: 'nowrap' as const
}

const signalTitle = {
  color: '#fff',
  fontSize: '1.4rem',
  marginBottom: '1rem'
}

const signalStats = {
  color: '#ccc',
  fontSize: '.95rem',
  lineHeight: 1.5
}

const signalExplanation = {
  color: '#aaa',
  marginTop: '1rem',
  lineHeight: 1.5
}

const emptyCard = {
  background: '#111',
  border: '1px solid #222',
  borderRadius: '1rem',
  padding: '1.5rem',
  color: '#888'
}