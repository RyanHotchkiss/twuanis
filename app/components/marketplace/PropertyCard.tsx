'use client'

import Link from 'next/link'
import { bankPath, exactMoney } from '@/lib/remates/public-types'
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

  const bank = property.market === 'remates'
  compareDisabled = compareDisabled || bank
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
      href={bank ? `${bankPath(language)}/${property.id}` : listingHref(property.id, transactionType === 'rent' ? 'rent' : 'sale', language)}
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

          {property.market === 'remates' && <>
            {property.images?.[0] && <div aria-hidden="true" data-bank-image-overlay style={{position:'absolute',inset:0,background:'rgba(240,242,243,0.22)',pointerEvents:'none'}} />}
            <span data-bank-ribbon style={{position:'absolute',top:12,left:12,padding:'6px 12px',borderRadius:6,background:'#f0f2f3',color:'#111',fontSize:13,fontWeight:700,pointerEvents:'none'}}>{language === 'es' ? 'Remate' : 'Bank Property'}</span>
          </>}

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
                {bank ? property.marketplace_property_type_label : property.property_type}
              </span>
            )}

            {bank && <span style={pill(theme)}>
              {property.bank_evidence.financial_kind === 'AUCTION_BASE'
                ? (language === 'es' ? 'Base del remate' : 'Auction base')
                : property.bank_evidence.financial_kind === 'SELLING_PRICE'
                  ? (language === 'es' ? 'Precio de venta' : 'Selling price')
                  : (language === 'es' ? 'Precio no publicado' : 'Price not published')}
              {property.bank_evidence.auction_round ? ` (${property.bank_evidence.auction_round})` : ''}
              {property.marketplace_original_price && property.marketplace_original_currency
                ? `: ${property.marketplace_original_currency} ${exactMoney(property.marketplace_original_price, language)}` : ''}
            </span>}
            {!bank && property.marketplace_original_price && (
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
                  {bank ? `${language === 'es' ? 'Área de terreno' : 'Land Area'}: ${exactMoney(String(property.property_area),language)} m²` : property.property_area}
                </span>
              )}

            {bank && property.construction_area && <span style={pill(theme)}>{language === 'es' ? 'Área de construcción' : 'Construction Area'}: {exactMoney(String(property.construction_area),language)} m²</span>}

            {!bank && transactionType === 'rent' &&
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