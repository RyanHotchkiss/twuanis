'use client'

import PropertyCard
  from '@/app/components/marketplace/PropertyCard'

type MarketplaceListingGridProps = {

  theme:
  | 'dark'
  | 'light'

  listings: any[]

  transactionType:
    | 'buy'
    | 'rent'

  language?:
    | 'en'
    | 'es'

  favoriteIds:
    string[]

  isSelected:
    (listingId: string) => boolean

  maximumProperties:
    number

  selectedPropertyIds:
    string[]

  onToggleFavorite:
    (
      property: any
    ) => void | Promise<void>

  onToggleCompare:
    (
      listingId: string
    ) => void
}

export default function MarketplaceListingGrid({
  listings,
  theme,
  transactionType,
  language = 'en',
  favoriteIds,
  isSelected,
  maximumProperties,
  selectedPropertyIds,
  onToggleFavorite,
  onToggleCompare
}: MarketplaceListingGridProps) {

  if (listings.length === 0) {
    return (
      <div
        style={{
        background:
            theme === 'dark'
                ? '#181818'
                : '#ffffff',

            border:
            theme === 'dark'
                ? '1px solid #222'
                : '1px solid rgba(0,0,0,.12)',
          borderRadius: '22px',
          padding: '40px',
          textAlign: 'center',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <h2
        
          style={{
            color:
            theme === 'dark'
                ? '#ffffff'
                : '#111111',
            marginBottom: '10px'
          }}
        >
        
          {language === 'es'
            ? 'No se encontraron propiedades'
            : 'No properties found'}
        </h2>

        <p
          style={{
            color:
                theme === 'dark'
                    ? '#777'
                    : '#666'
          }}
        >
          {language === 'es'
            ? 'Intenta ajustar los filtros de propiedad.'
            : 'Try adjusting your property filters.'}
        </p>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'grid',

        gridTemplateColumns:
          'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',

        gap: '1.25rem',

        alignItems: 'stretch',

        alignContent: 'start',

        width: '100%'
      }}
    >
      {listings.map(property => {

        const selected =
          isSelected(
            property.id
          )

        const compareDisabled =
          !selected &&
          selectedPropertyIds.length >=
            maximumProperties

        return (
          <PropertyCard
            theme={theme}
            key={property.id}

            property={property}

            transactionType={
              transactionType
            }

            language={language}

            isFavorite={
              favoriteIds.includes(
                property.id
              )
            }

            isSelected={
              selected
            }

            compareDisabled={
              compareDisabled
            }

            onToggleFavorite={() =>
              onToggleFavorite(
                property
              )
            }

            onToggleCompare={() =>
              onToggleCompare(
                property.id
              )
            }
          />
        )
      })}
    </div>
  )
}