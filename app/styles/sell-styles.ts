import { type CSSProperties } from 'react'

export const sectionHeading = {
  fontSize: '1.1rem',
  marginBottom: '1rem'
}

export const buttonWrap = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '.75rem'
}

export const pill = {
  background: '#181818',
  border: '.0625rem solid #2a2a2a',
  color: '#bbb',
  padding: '.85rem 1rem',
  borderRadius: '999rem',
  cursor: 'pointer'
}

export const activePill = {
  background: '#FFFFFF',
  border: '.0625rem solid #FFFFFF',
  color: '#000',
  padding: '.85rem 1rem',
  borderRadius: '999rem',
  cursor: 'pointer',
  fontWeight: 'bold'
}
export const definitionCard = {
  background: '#111',
  border: '.0625rem solid #1d1d1d',
  borderRadius: '1rem',
  padding: '1.25rem'
}

export const definitionLabel = {
  color: '#666',
  fontSize: '.75rem',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  letterSpacing: '.08rem',
  marginBottom: '.5rem'
}

export const definitionValue = {
  fontSize: '1.1rem',
  color: '#fff',
  lineHeight: '1.5'
}

export const pillWrap: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '10px'
}

export const collapseButton = {
  background: '#181818',
  border: '.0625rem solid #2a2a2a',
  color: '#FFFFFF',
  width: '2rem',
  height: '2rem',
  borderRadius: '999rem',
  cursor: 'pointer',
  fontSize: '1rem'
}

export const summaryCard = {
  background: '#111',
  border: '.0625rem solid #1d1d1d',
  borderRadius: '1rem',
  padding: '1rem 1.25rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  color: '#fff'
}

export const resetButton = {
  background: 'transparent',
  border: 'none',
  color: '#ff6666',
  cursor: 'pointer',
  fontSize: '1rem'
}

export const priceWheelContainer = {
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  gap: '1rem',
  marginBottom: '1rem'
}

export const priceDisplay = {
  fontSize: '4rem',
  fontWeight: 'bold',
  color: '#FFFFFF',
  background: '#0f0f0f',
  border: '.0625rem solid #222',
  borderRadius: '1.5rem',
  padding: '1rem 2rem',
  minWidth: '16rem',
  textAlign: 'center'
}

export const priceArrow = {
  background: '#181818',
  border: '.0625rem solid #2a2a2a',
  color: '#FFFFFF',
  width: '4rem',
  height: '4rem',
  borderRadius: '999rem',
  cursor: 'pointer',
  fontSize: '2rem'
}

export const priceConversion = {
  textAlign: 'center' as const,
  color: '#888',
  fontSize: '1.1rem'
}

export const generatedTitleCard = {
  background: '#0f0f0f',
  border: '.0625rem solid #222',
  borderRadius: '1.25rem',
  padding: '1.5rem',
  marginBottom: '2rem'
}

export const generatedTitleLabel = {
  color: '#666',
  fontSize: '.75rem',
  textTransform: 'uppercase' as const,
  letterSpacing: '.08rem',
  marginBottom: '.75rem'
}

export const generatedTitleValue = {
  color: '#fff',
  fontSize: '2rem',
  lineHeight: '1.3',
  fontWeight: 'bold'
}

export const generatedDescriptionCard = {
  background: '#0f0f0f',
  border: '.0625rem solid #222',
  borderRadius: '1.25rem',
  padding: '1.5rem',
  marginBottom: '2rem'
}

export const generatedDescriptionValue = {
  color: '#aaa',
  fontSize: '1rem',
  lineHeight: '1.8'
}

export const uploadBox = {
  border: '.125rem dashed #333',
  borderRadius: '1rem',
  padding: '3rem 2rem',
  textAlign: 'center' as const,
  color: '#888',
  cursor: 'pointer',
  background: '#0f0f0f'
}

export const imageGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))',
  gap: '1rem',
  marginTop: '1.5rem'
}

export const imageCard = {
  position: 'relative' as const
}

export const previewImage = {
  width: '100%',
  aspectRatio: '4 / 3',
  objectFit: 'cover' as const,
  borderRadius: '.75rem',
  border: '.0625rem solid #222'
}

export const removeImageButton = {
  position: 'absolute' as const,
  top: '.5rem',
  right: '.5rem',
  background: '#000',
  color: '#ff6666',
  border: 'none',
  borderRadius: '999rem',
  width: '2rem',
  height: '2rem',
  cursor: 'pointer',
  fontWeight: 'bold'
}

export const phoneDisplay = {
  background:'#111',
  border:'.0625rem solid #222',
  borderRadius:'1rem',
  padding:'1.5rem',
  fontSize:'2rem',
  fontWeight:'bold',
  letterSpacing:'.15rem',
  textAlign:'center' as const,
  marginBottom:'1.5rem',
  color:'#FFFFFF'
}

export const phoneKeypad = {
  display:'grid',
  gridTemplateColumns:'repeat(3, 1fr)',
  gap:'1rem',
  maxWidth:'20rem',
  margin:'0 auto'
}

export const phoneKey = {
  background:'#181818',
  border:'.0625rem solid #2a2a2a',
  color:'#fff',
  borderRadius:'1rem',
  height:'4.5rem',
  fontSize:'1.75rem',
  fontWeight:'bold',
  cursor:'pointer'
}

export const phoneDeleteKey = {
  background:'#330000',
  border:'.0625rem solid #662222',
  color:'#ff6666',
  borderRadius:'1rem',
  height:'4.5rem',
  fontSize:'1.5rem',
  fontWeight:'bold',
  cursor:'pointer'
}
export const createListingButton = {
  width:'100%',
  background:'#FFFFFF',
  color:'#000',
  border:'none',
  borderRadius:'1.25rem',
  padding:'1.5rem',
  fontSize:'1.4rem',
  fontWeight:'bold',
  cursor:'pointer',
  marginTop:'4rem',
  transition:'all .2s ease'
}

export const csvMetaPill = {
  background: '#181818',
  border: '1px solid #2a2a2a',
  borderRadius: '999px',
  padding: '.5rem .85rem',
  color: '#aaa',
  fontSize: '.85rem'

}