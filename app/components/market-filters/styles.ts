export const resetWrap = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginBottom: '1rem'
}

export const resetLink = {
  color: '#ff3b00',
  textDecoration: 'none',
  fontWeight: 600
}

export const wrapper = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '1rem',
  marginBottom: '2rem'
}

export const assetSection = {
  background: '#0d0d0d',
  border: '1px solid #222',
  borderRadius: '1rem',
  padding: '1.25rem',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '.6rem'
}

export const assetHeading = {
  color: '#FFD700',
  fontSize: '.9rem',
  textTransform: 'uppercase' as const,
  letterSpacing: '.08rem',
  margin: '0 0 .25rem'
}

export const select = {
  background: '#111',
  color: '#fff',
  border: '1px solid #333',
  borderRadius: '.5rem',
  padding: '.75rem',
  fontSize: '1rem',
  width: '100%'
}

export const locationSection = {
  background: '#0d0d0d',
  border: '1px solid #222',
  borderRadius: '1rem',
  padding: '1.25rem',
  marginBottom: '1rem'
}

export const locationGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1rem'
}

export const comparisonGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(2, minmax(0, 1fr))',
  gap: '2rem',
  alignItems: 'start'
}

export const marketHeading = {
  color: '#D4AF37',
  fontSize: '1.5rem',
  margin: '0 0 1rem'
}