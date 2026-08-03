'use client'

import Link from 'next/link'

import {
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  useSearchParams
} from 'next/navigation'

import type {
  ComparisonLanguage
} from '@/lib/comparisons/types'

import {
  supabase
} from '@/lib/supabase'

import {
  getUserPropertyNotes
} from '@/lib/property-notes'

import {
  resolveFirstListingImage
} from '@/app/utils/resolveListingImages'

import DOMPurify
  from 'dompurify'

type PropertyComparisonListing = {
  id: string
  title: string | null      
  images: unknown
  province: string | null
  canton: string | null
  district: string | null
  transaction_type: string | null
  currency: string | null
  price_millions:
    | number
    | string
    | null
  monthly_price:
    | number
    | string
    | null
  property_type: string | null
  bedrooms: string | null
  bathrooms: string | null
  parking: string | null
  year_built_range: string | null
  construction_area:
    | number
    | string
    | null
  property_area:
    | number
    | string
    | null
  utility: string[] | null
  environment: string[] | string | null
  accessibility:
    | string[]
    | string
    | null
  terrain: string[] | null
  legal_status:
    | string[]
    | string
    | null
  source_url: string | null
}

type ComparisonRow = {
  label: string
  render: (
    listing: PropertyComparisonListing
  ) => React.ReactNode
}

type PropertyComparisonEngineProps = {
  language: ComparisonLanguage
}

export default function PropertyComparisonEngine({
  language
}: PropertyComparisonEngineProps) {
  const spanish =
    language === 'es'
  const searchParams =
    useSearchParams()

  const [
    listings,
    setListings
  ] = useState<
    PropertyComparisonListing[]
  >([])

  const [
    propertyNotes,
    setPropertyNotes
  ] = useState<
    Record<string, string>
  >({})

  const [
    loading,
    setLoading
  ] = useState(true)

  const [
    error,
    setError
  ] = useState<string | null>(null)

  const propertyIds =
    useMemo(
      () =>
        Array.from(
          new Set(
            searchParams
              .getAll('property')
              .map(id => id.trim())
              .filter(Boolean)
          )
        ).slice(0, 4),
      [searchParams]
    )

  useEffect(() => {
    let active = true

    async function loadListings() {
      if (
        propertyIds.length < 2
      ) {
        setListings([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const {
          data,
          error: listingsError
        } = await supabase
          .from('listings')
          .select(`
            id,
            title,
            images,
            province,
            canton,
            district,
            transaction_type,
            currency,
            price_millions,
            monthly_price,
            property_type,
            bedrooms,
            bathrooms,
            parking,
            year_built_range,
            construction_area,
            property_area,
            utility,
            environment,
            accessibility,
            terrain,
            legal_status,
            source_url
          `)
          .in(
            'id',
            propertyIds
          )

        if (listingsError) {
          throw listingsError
        }

        const listingMap =
          new Map(
            (
              data || []
            ).map(
              listing => [
                listing.id,
                listing as
                  PropertyComparisonListing
              ]
            )
          )

        const orderedListings =
          propertyIds
            .map(propertyId =>
              listingMap.get(
                propertyId
              )
            )
            .filter(
              (
                listing
              ): listing is
                PropertyComparisonListing =>
                Boolean(listing)
            )

        if (active) {
          setListings(
            orderedListings
          )

          const notes =
            await getUserPropertyNotes()

          const notesByListing =
            Object.fromEntries(
              notes.map(note => [
                note.listingId,
                propertyNoteToPlainText(
                  note.content
                )
              ])
            )

          setPropertyNotes(
            notesByListing
          )

        }
      } catch (loadError) {
        console.error(
          'PROPERTY COMPARISON LOAD ERROR:',
          loadError
        )

        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
            : (spanish
                ? 'No se pudieron cargar las propiedades.'
                : 'The properties could not be loaded.')
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadListings()

    return () => {
      active = false
    }
  }, [propertyIds,
      spanish
  ])

  if (loading) {
    return (
      <div style={message}>
        {spanish
            ? 'Cargando comparación de propiedades...'
            : 'Loading property comparison...'}
      </div>
    )
  }

  if (error) {
    return (
      <div style={message}>
        {error}
      </div>
    )
  }

  if (
    propertyIds.length < 2
  ) {
    return (
      <div style={empty}>
        <h2 style={emptyTitle}>
          {spanish
            ? 'Selecciona al menos dos propiedades'
            : 'Select at least two properties'}
        </h2>

        <p style={emptyDescription}>
          {spanish
            ? 'Selecciona propiedades del mercado para compararlas lado a lado.'
            : 'Choose properties from the marketplace to compare them side by side.'}
        </p>

        <Link
          href={
            spanish
                ? '/es/comprar'
                : '/en/buy'
            }
          style={browseButton}
        >
          {spanish
            ? 'Explorar propiedades'
            : 'Browse properties'}
        </Link>
      </div>
    )
  }

  if (
    listings.length < 2
  ) {
    return (
      <div style={message}>
        {spanish
            ? 'No se pudieron cargar al menos dos de las propiedades seleccionadas.'
            : 'Fewer than two selected properties could be loaded.'}
      </div>
    )
  }

  const rows:
        ComparisonRow[] = [
            {
            label:
                spanish
                ? 'Precio'
                : 'Price',

            render:
                listing =>
                formatPrice(
                    listing,
                    language
                )
            },
            {
            label:
                spanish
                ? 'Precio / m² de terreno'
                : 'Price / Land m²',

            render:
                listing =>
                formatPricePerM2(
                    listing,
                    listing.property_area,
                    language
                )
            },
            {
            label:
                spanish
                ? 'Precio / m² de construcción'
                : 'Price / Construction m²',

            render:
                listing =>
                formatPricePerM2(
                    listing,
                    listing.construction_area,
                    language
                )
            },
            {
            label:
                spanish
                ? 'Tipo de Propiedad'
                : 'Property Type',

            render:
                listing =>
                displayValue(
                    listing.property_type
                )
            },
            {
            label:
                spanish
                ? 'Ubicación'
                : 'Location',

            render:
                listing =>
                [
                    listing.district,
                    listing.canton,
                    listing.province
                ]
                    .filter(Boolean)
                    .join(', ') ||
                '—'
            },
            {
            label:
                spanish
                ? 'Habitaciones'
                : 'Bedrooms',

            render:
                listing =>
                displayValue(
                    listing.bedrooms
                )
            },
            {
            label:
                spanish
                ? 'Baños'
                : 'Bathrooms',

            render:
                listing =>
                displayValue(
                    listing.bathrooms
                )
            },
            {
            label:
                spanish
                ? 'Estacionamiento'
                : 'Parking',

            render:
                listing =>
                displayValue(
                    listing.parking
                )
            },
            {
            label:
                spanish
                ? 'Área de Construcción'
                : 'Construction Area',

            render:
                listing =>
                formatArea(
                    listing.construction_area,
                    language
                )
            },
            {
            label:
                spanish
                ? 'Área de Propiedad'
                : 'Property Area',

            render:
                listing =>
                formatArea(
                    listing.property_area,
                    language
                )
            },
            {
            label:
                spanish
                ? 'Año de Construcción'
                : 'Year Built',

            render:
                listing =>
                displayValue(
                    listing.year_built_range
                )
            },
            {
            label:
                spanish
                ? 'Servicios'
                : 'Utilities',

            render:
                listing =>
                formatList(
                    listing.utility
                )
            },
            {
            label:
                spanish
                ? 'Entorno'
                : 'Environment',

            render:
                listing =>
                formatList(
                    listing.environment
                )
            },
            {
            label:
                spanish
                ? 'Terreno'
                : 'Terrain',

            render:
                listing =>
                formatList(
                    listing.terrain
                )
            },
            {
            label:
                spanish
                ? 'Accesibilidad'
                : 'Accessibility',

            render:
                listing =>
                formatList(
                    listing.accessibility
                )
            },
            {
            label:
                spanish
                ? 'Estado Legal'
                : 'Legal Status',

            render:
                listing =>
                formatList(
                    listing.legal_status
                )
            }
        ]

        return (
            <section style={wrapper}>
            <div style={tableScroll}>
                <div
                style={{
                    ...comparisonGrid,
                    gridTemplateColumns:
                    `190px repeat(${listings.length}, minmax(240px, 1fr))`
                }}
                >
                <div style={cornerCell}>
                    {spanish
                        ? 'Comparación'
                        : 'Comparison'}
                </div>

                {listings.map(
                    listing => (
                    <PropertyHeader
                        key={listing.id}
                        listing={listing}
                        language={language}
                        note={
                          propertyNotes[
                            listing.id
                          ]
                        }
                      />
                    )
                )}

                {rows.map(row => (
                    <ComparisonRowView
                    key={row.label}
                    row={row}
                    listings={listings}
                    />
                ))}
                </div>
            </div>
            </section>
        )
        }

        function PropertyHeader({
          listing,
          language,
          note
        }: {
        note?: string
        listing:
            PropertyComparisonListing
        language:
            ComparisonLanguage
        }) {
        const spanish =
            language === 'es'
  
const image =
  resolveFirstListingImage(
    listing.images
  )

  return (
    <article style={propertyHeader}>
      <div style={imageWrap}>
        {image ? (
          <img
            src={image}
            alt={
                listing.title ||
                (spanish
                    ? 'Propiedad'
                    : 'Property')
                }
            style={imageStyle}
          />
        ) : (
          <div style={imageFallback}>
            {spanish
                ? 'Sin imagen'
                : 'No image'}
          </div>
        )}
      </div>

      <div style={propertyHeaderContent}>
        <span style={propertyType}>
          {listing.property_type ||
            (spanish
                ? 'Propiedad'
                : 'Property')}
        </span>

        <h2 style={propertyTitle}>
          {listing.title ||
            (spanish
                ? 'Propiedad'
                : 'Property Listing')}
        </h2>

        <strong style={propertyPrice}>
          {formatPrice(
            listing,
            language
            )}
        </strong>

        {note && (
          <div style={noteBox}>
            <strong style={noteHeading}>
              {spanish
                ? 'Mis notas'
                : 'My Notes'}
            </strong>

            <p style={noteText}>
              {note}
            </p>
          </div>
        )}

        {listing.source_url && (
          <a
            href={listing.source_url}
            target="_blank"
            rel="noreferrer"
            style={sourceLink}
          >
            {spanish
                ? 'Ver propiedad'
                : 'View listing'}
          </a>
        )}
      </div>
    </article>
  )
}

function ComparisonRowView({
  row,
  listings
}: {
  row: ComparisonRow
  listings:
    PropertyComparisonListing[]
}) {
  return (
    <>
      <div style={rowLabel}>
        {row.label}
      </div>

      {listings.map(
        listing => (
          <div
            key={`${row.label}-${listing.id}`}
            style={valueCell}
          >
            {row.render(
              listing
            )}
          </div>
        )
      )}
    </>
  )
}

function propertyNoteToPlainText(
  content: string
): string {
  const sanitized =
    DOMPurify.sanitize(content)

  const container =
    document.createElement('div')

  container.innerHTML =
    sanitized

  return (
    container.textContent ||
    container.innerText ||
    ''
  ).trim()
}

function getNumericValue(
  value:
    | number
    | string
    | null
): number | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null
  }

  const numeric =
    Number(
      String(value)
        .replace(/,/g, '')
        .replace(/[^\d.-]/g, '')
    )

  return Number.isFinite(numeric)
    ? numeric
    : null
}

function getListingPrice(
  listing:
    PropertyComparisonListing
): number | null {
  const transactionType =
    listing.transaction_type
      ?.toLowerCase()

  if (
    transactionType === 'rent' ||
    transactionType === 'lease'
  ) {
    return getNumericValue(
      listing.monthly_price
    )
  }

  const priceMillions =
    getNumericValue(
      listing.price_millions
    )

  if (
    priceMillions === null
  ) {
    return null
  }

  return priceMillions * 1_000_000
}

function formatPrice(
        listing:
            PropertyComparisonListing,
        language:
            ComparisonLanguage
        ): string {
        const price =
            getListingPrice(listing)

        if (
            price === null
        ) {
            return '—'
        }

        const currency =
            listing.currency === 'USD'
            ? 'USD'
            : 'CRC'

        const formatted =
            new Intl.NumberFormat(
            language === 'es'
                ? 'es-CR'
                : 'en-US',
            {
                style: 'currency',
                currency,
                maximumFractionDigits: 0
            }
            ).format(price)

        const transactionType =
            listing.transaction_type
            ?.toLowerCase()

        return (
            transactionType === 'rent' ||
            transactionType === 'lease'
        )
            ? language === 'es'
            ? `${formatted} / mes`
            : `${formatted} / month`
            : formatted
        }

function formatPricePerM2(
        listing:
            PropertyComparisonListing,
        areaValue:
            | number
            | string
            | null,
        language:
            ComparisonLanguage
        ): string {
        const price =
            getListingPrice(listing)

        const area =
            getNumericValue(areaValue)

        if (
            price === null ||
            area === null ||
            area <= 0
        ) {
            return '—'
        }

        const currency =
            listing.currency === 'USD'
            ? 'USD'
            : 'CRC'

        return `${
            new Intl.NumberFormat(
            language === 'es'
                ? 'es-CR'
                : 'en-US',
            {
                style: 'currency',
                currency,
                maximumFractionDigits: 0
            }
            ).format(
            price / area
            )
        } / m²`
        }

function formatArea(
        value:
            | number
            | string
            | null,
        language:
            ComparisonLanguage
        ): string {
        const numeric =
            getNumericValue(value)

        if (
            numeric === null
        ) {
            return '—'
        }

        return `${
            new Intl.NumberFormat(
            language === 'es'
                ? 'es-CR'
                : 'en-US',
            {
                maximumFractionDigits: 2
            }
            ).format(numeric)
        } m²`
        }

function formatList(
  value:
    | string[]
    | string
    | null
): React.ReactNode {
  const items =
    Array.isArray(value)
      ? value
      : typeof value === 'string'
      ? value
          .split(',')
          .map(item =>
            item.trim()
          )
          .filter(Boolean)
      : []

  if (!items.length) {
    return '—'
  }

  return (
    <div style={tagList}>
      {items.map(item => (
        <span
          key={item}
          style={tag}
        >
          {item}
        </span>
      ))}
    </div>
  )
}

function displayValue(
  value:
    | string
    | null
): string {
  return value?.trim() || '—'
}

const wrapper = {
  width: '100%'
}

const tableScroll = {
  overflowX: 'auto' as const,
  paddingBottom: '.5rem'
}

const comparisonGrid = {
  display: 'grid',
  minWidth: '760px',
  borderTop: '1px solid #292929',
  borderLeft: '1px solid #292929'
}

const cornerCell = {
  display: 'flex',
  alignItems: 'center',
  padding: '1rem',
  borderRight:
    '1px solid #292929',
  borderBottom:
    '1px solid #292929',
  background: '#111',
  color: '#777',
  fontSize: '.8rem',
  fontWeight: 700,
  textTransform:
    'uppercase' as const
}

const propertyHeader = {
  minWidth: 0,
  borderRight:
    '1px solid #292929',
  borderBottom:
    '1px solid #292929',
  background: '#111'
}

const imageWrap = {
  width: '100%',
  aspectRatio: '16 / 10',
  background: '#191919',
  overflow: 'hidden'
}

const imageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover' as const
}

const imageFallback = {
  display: 'flex',
  width: '100%',
  height: '100%',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#666'
}

const propertyHeaderContent = {
  display: 'flex',
  minHeight: '210px',
  padding: '1rem',
  flexDirection: 'column' as const
}

const propertyType = {
  color: '#777',
  fontSize: '.72rem',
  fontWeight: 700,
  letterSpacing: '.08em',
  textTransform:
    'uppercase' as const
}

const propertyTitle = {
  margin: '.6rem 0 0',
  color: '#fff',
  fontSize: '1rem',
  lineHeight: 1.4
}

const propertyPrice = {
  marginTop: 'auto',
  paddingTop: '1rem',
  color: '#fff',
  fontSize: '1.05rem'
}

const sourceLink = {
  marginTop: '.75rem',
  color: '#bbb',
  fontSize: '.8rem',
  textDecoration: 'none'
}

const rowLabel = {
  padding: '1rem',
  borderRight:
    '1px solid #292929',
  borderBottom:
    '1px solid #292929',
  background: '#111',
  color: '#aaa',
  fontSize: '.85rem',
  fontWeight: 700
}

const valueCell = {
  minWidth: 0,
  padding: '1rem',
  borderRight:
    '1px solid #292929',
  borderBottom:
    '1px solid #292929',
  background: '#0c0c0c',
  color: '#ddd',
  fontSize: '.88rem',
  lineHeight: 1.5
}

const tagList = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '.4rem'
}

const tag = {
  padding: '.3rem .5rem',
  border: '1px solid #303030',
  borderRadius: '999px',
  background: '#171717',
  color: '#bbb',
  fontSize: '.72rem'
}

const message = {
  padding: '3rem 2rem',
  border: '1px solid #262626',
  borderRadius: '16px',
  background: '#111',
  color: '#aaa',
  textAlign: 'center' as const
}

const empty = {
  padding: '3rem 2rem',
  border: '1px dashed #333',
  borderRadius: '16px',
  textAlign: 'center' as const
}

const emptyTitle = {
  margin: 0,
  color: '#fff'
}

const emptyDescription = {
  maxWidth: '520px',
  margin: '.75rem auto 1.25rem',
  color: '#888',
  lineHeight: 1.6
}

const browseButton = {
  display: 'inline-block',
  padding: '.75rem 1rem',
  borderRadius: '999px',
  background: '#ededed',
  color: '#111',
  fontWeight: 700,
  textDecoration: 'none'
}

const noteBox = {
  marginTop: '1rem',
  padding: '.75rem',
  border: '1px solid #2b2b2b',
  borderRadius: '.75rem',
  background: '#181818'
}

const noteHeading = {
  display: 'block',
  marginBottom: '.4rem',
  color: '#D4AF37',
  fontSize: '.75rem',
  fontWeight: 700
}

const noteText = {
  margin: 0,
  color: '#ccc',
  fontSize: '.82rem',
  lineHeight: 1.45,
  whiteSpace: 'pre-wrap' as const
}