import type { CSSProperties } from 'react'

// Existing sectionHeading authority in BedroomFilterS and ResidentialAttributesS.
export const bathroomHeadingStyle: CSSProperties = {
  fontSize: '1rem',
  marginBottom: '1rem',
  color: '#D4AF37',
  background: 'transparent',
}

export const bathroomHeadingToggleStyle: CSSProperties = {
  ...bathroomHeadingStyle,
  minHeight: 44,
  border: 0,
  boxShadow: 'none',
  padding: 0,
  fontFamily: 'inherit',
  fontWeight: 'inherit',
  textAlign: 'start',
  cursor: 'pointer',
}
