export default function ResultadosEscasezMercado({
  filters,
  scarcity
}: {
  filters: any
  scarcity: any
}) {
  return (
    <section>
      <h2 style={sectionTitle}>
        Resumen de Escasez de Mercado
      </h2>

      <div style={cardGrid}>
        <StatCard
          label="Tamaño del Mercado Seleccionado"
          value={`${scarcity.marketSize} propiedades`}
        />

        <StatCard
          label="Combinación Coincidente"
          value={`${scarcity.matchingCount} propiedades`}
        />

        <StatCard
          label="Participación de Escasez"
          value={scarcity.scarcityShare || 'Sin datos'}
        />

        <StatCard
          label="Nivel de Escasez"
          value={scarcity.scarcityLevel || 'Sin datos'}
        />
      </div>

      <h2 style={sectionTitle}>
        Combinaciones Escasas del Mercado
      </h2>

      {scarcity.combinations?.length > 0 ? (
        <div style={scarcityGrid}>
          {scarcity.combinations.map((item: any) => (
            <div
              key={item.attributes
                ?.map((attribute: any) => `${attribute.category}:${attribute.value}`)
                .join('|')}
              style={scarcityCard}
            >
              <div style={scarcityHeader}>
                <p style={scarcityCategory}>
                  {renderCategory(item.attributes)}
                </p>

                <div style={scarcityBadge}>
                  {item.scarcityLevel}
                </div>
              </div>

              <h3 style={scarcityTitle}>
                {renderCombination(item.attributes)}
              </h3>

              <div style={scarcityStats}>
                <p>
                  Propiedades coincidentes:{' '}
                  <strong>{item.matchingCount}</strong>
                </p>

                <p>
                  Participación del mercado:{' '}
                  <strong>{item.marketShare}</strong>
                </p>

                <p>
                  Tamaño total del mercado:{' '}
                  <strong>{item.marketSize}</strong>
                </p>
              </div>

              <p style={scarcityExplanation}>
                {item.explanation}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div style={emptyCard}>
          Todavía no hay combinaciones de escasez disponibles.
        </div>
      )}
    </section>
  )
}

function translateCategory(category: string) {
  const labels: Record<string, string> = {
    property_type: 'Tipo de Propiedad',
    bedrooms: 'Habitaciones',
    bathrooms: 'Baños',
    parking: 'Estacionamiento',
    environment: 'Entorno',
    terrain: 'Terreno',
    utility: 'Servicios',
    accessibility: 'Accesibilidad',
    legal_status: 'Estado Legal'
  }

  return labels[category] || category
}

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
    cabin: 'Cabaña',
    commercial_property: 'Propiedad Comercial',
    condo: 'Condominio',
    farm: 'Finca',
    house: 'Casa',
    land: 'Terreno',
    beachfront: 'Frente a la Playa',
    riverfront: 'Frente al Río',
    mountain_view: 'Vista a la Montaña',
    fiber_internet: 'Internet de Fibra',
    municipal_water: 'Agua Municipal',
    titled_property: 'Propiedad Titulada'
  }

  return labels[key] || value
}

function renderCategory(attributes: any[]) {
  return attributes
    ?.map(attribute => translateCategory(attribute.category))
    .join(' + ')
}

function renderCombination(attributes: any[]) {
  return attributes
    ?.map(attribute => translateValue(attribute.value))
    .join(' + ')
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

const scarcityGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '1.5rem',
  marginBottom: '3rem'
}

const scarcityCard = {
  background: '#111',
  border: '1px solid #222',
  borderRadius: '1rem',
  padding: '1.25rem'
}

const scarcityHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '1rem',
  alignItems: 'center'
}

const scarcityCategory = {
  color: '#888',
  margin: 0,
  fontSize: '.85rem',
  textTransform: 'uppercase' as const,
  letterSpacing: '.06rem'
}

const scarcityBadge = {
  background: '#D4AF37',
  color: '#000',
  borderRadius: '999px',
  padding: '.35rem .7rem',
  fontWeight: 700,
  whiteSpace: 'nowrap' as const
}

const scarcityTitle = {
  color: '#fff',
  fontSize: '1.4rem',
  marginBottom: '1rem'
}

const scarcityStats = {
  color: '#ccc',
  fontSize: '.95rem',
  lineHeight: 1.5
}

const scarcityExplanation = {
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