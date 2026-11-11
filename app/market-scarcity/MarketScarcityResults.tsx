export default function MarketScarcityResults({
  filters,
  scarcity
}: {
  filters: any
  scarcity: any
}) {
  const selected = scarcity.selectedCombination

  return (
    <section style={resultsSection}>

      {/* ---------- SELECTED MARKET SCARCITY ---------- */}

      <div style={hero}>
        <p style={eyebrow}>
          {scarcity.language === 'es' ? 'FRECUENCIA DE LA CONFIGURACIÓN' : 'PROPERTY CONFIGURATION FREQUENCY'}
        </p>

        {selected ? (
          <>
            <div style={heroScore}>
              {scarcity.scarcityShare ?? '—'}
              
            </div>

            <div style={heroLevel}>
              {scarcity.state==='EMPTY_BASE_MARKET'?(scarcity.language==='es'?'Mercado base vacío':'Empty base market'):(scarcity.language === 'es' ? 'Evidencia establecida' : 'Established evidence')}
            </div>

            <p style={heroExplanation}>
              {selected.explanation}
            </p>

            <div style={evidenceRow}>
              <div style={evidenceItem}>
                <span style={evidenceValue}>
                  {scarcity.matchingCount}
                </span>
                <span style={evidenceLabel}>
                  {scarcity.language === 'es' ? 'Propiedades que cumplen' : 'Matching Listings'}
                </span>
              </div>

              <div style={evidenceDivider} />

              <div style={evidenceItem}>
                <span style={evidenceValue}>
                  {scarcity.marketSize}
                </span>
                <span style={evidenceLabel}>
                  {scarcity.language === 'es' ? 'Propiedades del mercado' : 'Market Listings'}
                </span>
              </div>

              <div style={evidenceDivider} />

              <div style={evidenceItem}>
                <span style={evidenceValue}>
                  {scarcity.scarcityShare || '—'}
                </span>
                <span style={evidenceLabel}>
                  {scarcity.language === 'es' ? 'Proporción del mercado' : 'Market Share'}
                </span>
              </div>
            </div>

            <div style={configuration}>
              <p style={configurationLabel}>
                {scarcity.language === 'es' ? 'TU CONFIGURACIÓN' : 'YOUR CONFIGURATION'}
              </p>

              <div style={attributeRow}>
                {selected.attributes?.map(
                  (attribute: any, index: number) => (
                    <span
                      key={`${attribute.category}-${attribute.value}-${index}`}
                      style={attributeStyle}
                    >
                      {formatValue(attribute.value)}
                    </span>
                  )
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={heroLevel}>
              {scarcity.language === 'es' ? 'Mercado completo' : 'Entire Market'}
            </div>

            <p style={heroExplanation}>
              {scarcity.language === 'es' ? 'Selecciona características para medir su frecuencia establecida en este mercado.' : 'Select property characteristics to measure their established frequency within this base market.'}
            </p>

            <div style={evidenceRow}>
              <div style={evidenceItem}>
                <span style={evidenceValue}>
                  {scarcity.marketSize}
                </span>
                <span style={evidenceLabel}>
                  {scarcity.language === 'es' ? 'Propiedades del mercado' : 'Market Listings'}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

    </section>
  )
}

function formatValue(value: string) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase())
}

function formatCategory(category: string) {
  const labels: Record<string, string> = {
    property_type: 'Property Type',
    bedrooms: 'Bedrooms',
    bathrooms: 'Bathrooms',
    parking: 'Parking',
    environment: 'Environment',
    terrain: 'Terrain',
    utility: 'Utilities',
    accessibility: 'Accessibility',
    legal_status: 'Legal Status'
  }

  return labels[category] || formatValue(category)
}

function renderCategories(attributes: any[]) {
  return attributes
    ?.map(attribute => formatCategory(attribute.category))
    .join(' + ')
}

function renderCombination(attributes: any[]) {
  return attributes
    ?.map(attribute => formatValue(attribute.value))
    .join(' · ')
}

const resultsSection = {
  marginTop: '2rem'
}

const hero = {
  background:
    'linear-gradient(145deg, rgba(212,175,55,.08), rgba(17,17,17,.96) 38%)',
  border: '1px solid #2a2a2a',
  borderRadius: '1.25rem',
  padding: 'clamp(1.5rem, 4vw, 3rem)',
  marginBottom: '3rem'
}

const eyebrow = {
  color: '#D4AF37',
  fontSize: '.72rem',
  fontWeight: 700,
  letterSpacing: '.14rem',
  margin: '0 0 1rem',
  textTransform: 'uppercase' as const
}

const heroScore = {
  color: '#fff',
  fontSize: 'clamp(4rem, 9vw, 7rem)',
  fontWeight: 700,
  letterSpacing: '-.35rem',
  lineHeight: 1
}

const scoreScale = {
  color: '#666',
  fontSize: '1.5rem',
  fontWeight: 500,
  letterSpacing: 0
}

const heroLevel = {
  color: '#D4AF37',
  fontSize: '1.4rem',
  fontWeight: 700,
  marginTop: '.75rem'
}

const heroExplanation = {
  color: '#aaa',
  fontSize: '1rem',
  lineHeight: 1.65,
  maxWidth: '720px',
  margin: '1rem 0 0'
}

const evidenceRow = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  alignItems: 'stretch',
  gap: '1.5rem',
  marginTop: '2.5rem',
  paddingTop: '2rem',
  borderTop: '1px solid #282828'
}

const evidenceItem = {
  display: 'flex',
  flexDirection: 'column' as const,
  minWidth: '130px'
}

const evidenceValue = {
  color: '#fff',
  fontSize: '1.6rem',
  fontWeight: 650
}

const evidenceLabel = {
  color: '#777',
  fontSize: '.75rem',
  textTransform: 'uppercase' as const,
  letterSpacing: '.06rem',
  marginTop: '.3rem'
}

const evidenceDivider = {
  width: '1px',
  background: '#282828'
}

const configuration = {
  marginTop: '2rem',
  paddingTop: '2rem',
  borderTop: '1px solid #282828'
}

const configurationLabel = {
  color: '#777',
  fontSize: '.72rem',
  letterSpacing: '.1rem',
  margin: '0 0 .8rem',
  fontWeight: 700
}

const attributeRow = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '.6rem'
}

const attributeStyle = {
  border: '1px solid #333',
  borderRadius: '999px',
  padding: '.45rem .8rem',
  color: '#ccc',
  fontSize: '.85rem',
  background: '#151515'
}

const discoverySection = {
  marginBottom: '3rem'
}

const discoveryHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  flexWrap: 'wrap' as const,
  gap: '1rem',
  marginBottom: '1.5rem'
}

const sectionTitle = {
  color: '#fff',
  fontSize: '2rem',
  margin: 0
}

const sectionDescription = {
  color: '#777',
  maxWidth: '420px',
  lineHeight: 1.5,
  margin: 0,
  fontSize: '.9rem'
}

const rankingList = {
  borderTop: '1px solid #282828'
}

const rankingRow = {
  display: 'grid',
  gridTemplateColumns: '60px minmax(0, 1fr) auto',
  gap: '1.5rem',
  alignItems: 'center',
  padding: '1.5rem 0',
  borderBottom: '1px solid #282828'
}

const rank = {
  color: '#555',
  fontSize: '.9rem',
  fontWeight: 700
}

const combinationBody = {
  minWidth: 0
}

const combinationCategory = {
  color: '#777',
  fontSize: '.7rem',
  textTransform: 'uppercase' as const,
  letterSpacing: '.08rem',
  margin: '0 0 .4rem'
}

const combinationTitle = {
  color: '#fff',
  fontSize: '1.15rem',
  margin: 0,
  fontWeight: 600
}

const combinationExplanation = {
  color: '#777',
  fontSize: '.85rem',
  lineHeight: 1.5,
  margin: '.55rem 0 0',
  maxWidth: '700px'
}

const combinationEvidence = {
  textAlign: 'right' as const,
  minWidth: '130px'
}

const combinationScore = {
  color: '#D4AF37',
  fontSize: '1.6rem',
  fontWeight: 700
}

const smallScale = {
  color: '#666',
  fontSize: '.75rem',
  fontWeight: 500
}

const combinationLevel = {
  color: '#bbb',
  fontSize: '.78rem',
  fontWeight: 600,
  marginTop: '.15rem'
}

const combinationStats = {
  color: '#666',
  fontSize: '.75rem',
  marginTop: '.35rem'
}

const emptyState = {
  border: '1px solid #282828',
  borderRadius: '1rem',
  padding: '2rem',
  color: '#777'
}