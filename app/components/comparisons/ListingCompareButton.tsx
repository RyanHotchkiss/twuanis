'use client'

import {
  usePropertyComparisonSelection
} from '@/lib/property-comparison-selection'

type Props = {
  listingId: string
  language: 'en' | 'es'
}

export default function ListingCompareButton({
  listingId,
  language
}: Props) {
  const {
    isSelected,
    toggleProperty
  } =
    usePropertyComparisonSelection()

  const selected =
    isSelected(listingId)

  return (
    <button
      type="button"
      onClick={() =>
        toggleProperty(listingId)
      }
      style={{
        width: '100%',
        marginTop: '1rem',
        padding: '1rem',
        borderRadius: '999px',
        border: '1px solid #444',
        background: selected
          ? '#D4AF37'
          : '#181818',
        color: selected
          ? '#000'
          : '#fff',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all .2s ease'
      }}
    >
      {selected
        ? language === 'es'
          ? '✓ Seleccionada para comparar'
          : '✓ Selected for comparison'
        : language === 'es'
          ? '+ Comparar propiedad'
          : '+ Compare property'}
    </button>
  )
}