'use client'

import Link from 'next/link'
import { listingHref } from '@/lib/listing-route'

type PropertyCardProps = {
  property: any

  theme:
    | 'dark'
    | 'light'

  transactionType:
    | 'buy'
    | 'rent'

  language?:
    | 'en'
    | 'es'

  isFavorite:
    boolean

  isSelected:
    boolean

  compareDisabled:
    boolean

  onToggleFavorite:
    () => void | Promise<void>

  onToggleCompare:
    () => void
}

export default function PropertyCard({
  property,
  transactionType,
  language = 'en',
  theme,
  isFavorite,
  isSelected,
  compareDisabled,
  onToggleFavorite,
  onToggleCompare
}: PropertyCardProps) {

  const noImageLabel =
    language === 'es'
      ? 'Sin Imagen'
      : 'No Image'

  const selectedLabel =
    language === 'es'
      ? 'Seleccionado'
      : 'Selected'

  const compareLabel =
    language === 'es'
      ? '+ Comparar'
      : '+ Compare'

  const bedsLabel =
    language === 'es'
      ? 'Hab.'
      : 'Beds'

  const bathsLabel =
    language === 'es'
      ? 'Baños'
      : 'Baths'

  const parkingLabel =
    language === 'es'
      ? 'Parqueo'
      : 'Parking'

  const constructionLabel =
    language === 'es'
      ? 'Construcción'
      : 'Construction'

  return (
    <Link
      href={listingHref(property.id, transactionType === 'rent' ? 'rent' : 'sale', language)}
      style={{
        textDecoration: 'none',
        color: 'inherit',
        minWidth: 0
      }}
    >
      <article
        style={{
          background:
          theme === 'dark'
              ? '#181818'
              : '#ffffff',

          border:
            theme === 'dark'
              ? '1px solid #222'
              : '1px solid rgba(0,0,0,.12)',

          color:
            theme === 'dark'
              ? '#ffffff'
              : '#111111',
          borderRadius: '22px',
          overflow: 'hidden',
          cursor: 'pointer',
          height: '100%'
        }}
      >
        {/* PROPERTY IMAGE */}
        <div
          style={{
            aspectRatio: '4 / 3',
            overflow: 'hidden',
            position: 'relative',
            background: '#111'
          }}
        >
          {Array.isArray(property.images) &&
          property.images[0] ? (
            <img
              referrerPolicy="no-referrer"
              src={property.images[0]}
              alt={property.title || ''}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
          ) : (
            <div
              style={{
                height: '100%',
                background:
                  'linear-gradient(135deg, #222 0%, #333 100%)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#555',
                fontSize: '20px'
              }}
            >
              {noImageLabel}
            </div>
          )}

          {/* FAVORITE */}
          <button
            type="button"
            aria-label={
              isFavorite
                ? 'Remove from favorites'
                : 'Add to favorites'
            }
            onClick={async event => {
              event.preventDefault()
              event.stopPropagation()

              await onToggleFavorite()
            }}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              width: '2.75rem',
              height: '2.75rem',
              borderRadius: '999px',
              border:
                '1px solid rgba(255,255,255,.15)',
              background:
                'rgba(0,0,0,.55)',
              backdropFilter:
                'blur(8px)',
              WebkitBackdropFilter:
                'blur(8px)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              zIndex: 20
            }}
          >
            <span
              style={{
                fontSize: '1.25rem',
                color:
                  isFavorite
                    ? '#D4AF37'
                    : '#fff',
                transition:
                  'all .2s ease'
              }}
            >
              ♥
            </span>
          </button>

          {/* COMPARE */}
          <button
            type="button"
            onClick={event => {
              event.preventDefault()
              event.stopPropagation()

              onToggleCompare()
            }}
            disabled={compareDisabled}
            style={{
              position: 'absolute',
              left: '1rem',
              bottom: '1rem',
              zIndex: 20,

              border:
                isSelected
                  ? '1px solid #fff'
                  : '1px solid rgba(255,255,255,.25)',

              borderRadius:
                '999px',

              padding:
                '.55rem .8rem',

              background:
                isSelected
                  ? '#fff'
                  : 'rgba(0,0,0,.65)',

              color:
                isSelected
                  ? '#000'
                  : '#fff',

              backdropFilter:
                'blur(8px)',

              WebkitBackdropFilter:
                'blur(8px)',

              cursor:
                compareDisabled
                  ? 'not-allowed'
                  : 'pointer',

              fontSize:
                '.75rem',

              fontWeight:
                700,

              opacity:
                compareDisabled
                  ? 0.45
                  : 1
            }}
          >
            {isSelected
              ? selectedLabel
              : compareLabel}
          </button>
        </div>

        {/* PROPERTY CONTENT */}
        <div
          style={{
            padding: '1.25rem'
          }}
        >
          <h2
            style={{
              fontSize: '1.25rem',
              marginBottom: '.75rem'
            }}
          >
            {property.title}
          </h2>

          <p
            style={{
            color:
              theme === 'dark'
                ? '#888'
                : '#555',
              marginBottom: '16px'
            }}
          >
            {[
              property.province,
              property.canton,
              property.district
            ]
              .filter(Boolean)
              .join(' → ')}
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            {property.property_type && (
              <span style={pill(theme)}>
                {property.property_type}
              </span>
            )}

            {property.marketplace_original_price && (
              <span style={pill(theme)}>
                {property.marketplace_original_currency ===
                'USD'
                  ? `$${Number(
                      property.marketplace_original_price
                    ).toLocaleString()}`
                  : `₡${Number(
                      property.marketplace_original_price
                    ).toLocaleString()}`}

                {transactionType === 'rent'
                  ? '/month'
                  : ''}
              </span>
            )}

            {property.property_area && (
              <span style={pill(theme)}>
                {property.property_area}
              </span>
            )}

            {transactionType === 'rent' &&
              property.construction_area && (
                <span style={pill(theme)}>
                  {property.construction_area}{' '}
                  {constructionLabel}
                </span>
              )}

            {property.bedrooms && (
              <span style={pill(theme)}>
                {property.bedrooms}{' '}
                {bedsLabel}
              </span>
            )}

            {property.bathrooms && (
              <span style={pill(theme)}>
                {property.bathrooms}{' '}
                {bathsLabel}
              </span>
            )}

            {property.parking && (
              <span style={pill(theme)}>
                {property.parking}{' '}
                {parkingLabel}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}

const pill = (
  theme: 'dark' | 'light'
) => ({
  background:
    theme === 'dark'
      ? '#181818'
      : '#f2f2ef',

  border:
    theme === 'dark'
      ? '1px solid #2a2a2a'
      : '1px solid rgba(0,0,0,.12)',

  color:
    theme === 'dark'
      ? '#bbb'
      : '#333',

  padding:
    '10px 14px',

  borderRadius:
    '999px',

  cursor:
    'pointer',

  transition:
    'all .2s ease'
})