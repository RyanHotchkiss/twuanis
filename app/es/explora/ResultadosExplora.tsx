import Link from 'next/link'
import { getRelatedMarkets }
from '@/lib/related-markets-engine'

function valueOrFallback(value: any) {
  return value ?? 'No hay suficientes datos confiables'
}

function getStat(
  statistics: any,
  snake: string,
  camel: string
) {
  return statistics?.[snake] ?? statistics?.[camel] ?? null
}

function groupByType(rows: any) {
  if (!Array.isArray(rows)) {
    return {}
  }

  return rows.reduce((groups, row) => {
    const key =
      row.distribution_type ||
      row.term_type ||
      'other'

    if (!groups[key]) groups[key] = []

    groups[key].push(row)

    return groups
  }, {} as Record<string, any[]>)
}

function formatLabel(value: string) {
  const labels: Record<string, string> = {
    province: 'Provincia',
    canton: 'Cantón',
    district: 'Distrito',
    property_type: 'Tipo de Propiedad',
    bedrooms: 'Habitaciones',
    bathrooms: 'Baños',
    parking: 'Estacionamiento',
    year_built: 'Año de Construcción',
    environment: 'Entorno',
    terrain: 'Terreno',
    utility: 'Servicios',
    accessibility: 'Accesibilidad',
    legal_status: 'Estado Legal'
  }

  return labels[value] || value
}

const CRC_PER_USD = 500

function formatFullCRC(value: any) {
  if (value === null || value === undefined) return null
  return `₡${Number(value).toLocaleString()}`
}

function formatFullUSD(value: any) {
  if (value === null || value === undefined) return null
  return `$${Number(value).toLocaleString()}`
}

function saleMillionsToCRC(value: any) {
  if (value === null || value === undefined) return null
  return Number(value) * 1000000
}

function crcToUSD(value: any) {
  if (value === null || value === undefined) return null
  return Math.round(Number(value) / CRC_PER_USD)
}

function usdToCRC(value: any) {
  if (value === null || value === undefined) return null
  return Math.round(Number(value) * CRC_PER_USD)
}

function formatCRC(value: any) {
  if (value === null || value === undefined) return null
  return `₡${Number(value).toLocaleString()}`
}

function formatUSD(value: any) {
  if (value === null || value === undefined) return null
  return `$${Number(value).toLocaleString()}`
}

function StatCard({
  label,
  value
}: {
  label: string
  value: any
}) {
  return (
    <div style={{
      background: '#111',
      border: '1px solid #222',
      borderRadius: '1rem',
      padding: '1.25rem'
    }}>
      <p style={{
        color: '#888',
        margin: 0,
        fontSize: '.85rem'
      }}>
        {label}
      </p>

      <h3 style={{
        margin: '.5rem 0 0',
        fontSize: '1.8rem'
      }}>
        {valueOrFallback(value)}
      </h3>
    </div>
  )
}

function getFirstImage(images: any) {
  if (!images) return null

  if (Array.isArray(images)) {
    return images[0]
  }

  try {
    const parsed = JSON.parse(images)

    if (Array.isArray(parsed)) {
      return parsed[0]
    }

    return null
  } catch {
    return null
  }
}

function buildRefinementUrl(
  filters: Record<string, any>,
  filterType: string,
  neighbor: any
) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, String(value))
    }
  })

  const value =
    neighbor.slug ||
    neighbor.term_slug ||
    neighbor.term_name_es ||
    neighbor.term_name_en ||
    neighbor.term_name

  params.set(
    filterType,
    String(value)
      .toLowerCase()
      .replace(/\s+/g, '-')
  )

  return `/es/explora?${params.toString()}`
}

export default function ExploreResults({
  result
}: {
  result: any
}) {
  const statistics = result.statistics || {}

  const transactionType =
    result.filters?.transaction_type

  const isSale =
    transactionType === 'sale'

  const isRent =
    transactionType === 'rent'

  const isAll =
    !transactionType

  const distributionGroups =
    result.distributions && !Array.isArray(result.distributions)
      ? result.distributions
      : groupByType(result.distributions || [])

  const suggestionGroups =
    groupByType(result.graphNeighbors || [])

  delete suggestionGroups.canton
  delete suggestionGroups.district
  delete suggestionGroups.province
  delete suggestionGroups.property_type

  const relatedMarkets =
    getRelatedMarkets(
      result.filters,
      distributionGroups
    )

  return (
    <section style={{
      marginTop: '2rem'
    }}>
      <div style={{
        background: '#0d0d0d',
        border: '1px solid #222',
        borderRadius: '1.5rem',
        padding: '2rem',
        marginBottom: '2rem'
      }}>
        <p style={{
          color: '#888',
          marginBottom: '.5rem'
        }}>
          Inteligencia de Mercado
        </p>

        <h2 style={{
          fontSize: '2.5rem',
          margin: 0
        }}>
          {result.title}
        </h2>

        <p style={{
          color: '#777'
        }}>
          {result.mode} · Caché: {result.cacheHit ? 'Sí' : 'No'}
        </p>
      </div>

      <h2 style={{
        color: '#ff3B00',
        fontSize: '2rem',
        marginBottom: '1rem'
      }}>
        Resumen del Mercado
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {isAll && (
          <>
            <StatCard
              label="Total de Propiedades"
              value={getStat(statistics, 'total_listings', 'totalListings') ?? 0}
            />

            <StatCard
              label="Propiedades en Venta"
              value={getStat(statistics, 'sale_listings', 'saleListings') ?? 0}
            />

            <StatCard
              label="Propiedades en Alquiler"
              value={getStat(statistics, 'rental_listings', 'rentalListings') ?? 0}
            />

            <StatCard
              label="Propiedades Recientes"
              value={getStat(statistics, 'recent_listing_count', 'recentListingCount') ?? 0}
            />
          </>
        )}

        {isSale && (
          <>
            <StatCard
              label="Propiedades en Venta"
              value={getStat(statistics, 'sale_listings', 'saleListings') ?? 0}
            />

            <StatCard
              label="Ventas Recientes"
              value={getStat(statistics, 'recent_listing_count', 'recentListingCount') ?? 0}
            />
          </>
        )}

        {isRent && (
          <>
            <StatCard
              label="Propiedades en Alquiler"
              value={getStat(statistics, 'rental_listings', 'rentalListings') ?? 0}
            />

            <StatCard
              label="Alquileres Recientes"
              value={getStat(statistics, 'recent_listing_count', 'recentListingCount') ?? 0}
            />
          </>
        )}
      </div>

            <h2 style={{
        color: '#ff3B00',
        fontSize: '2rem',
        marginBottom: '1rem'
      }}>
        Indicadores de Precios
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {(isSale || isAll) && (
          <>
            <StatCard label="Precio Promedio de Venta CRC" value={getStat(statistics, 'average_sale_price', 'averageSalePrice') ? <><div>{formatFullCRC(saleMillionsToCRC(getStat(statistics, 'average_sale_price', 'averageSalePrice')))}</div><div style={{ color: '#888', fontSize: '1rem' }}>{formatFullUSD(crcToUSD(saleMillionsToCRC(getStat(statistics, 'average_sale_price', 'averageSalePrice'))))}</div></> : null} />

            <StatCard label="Precio Promedio de Venta USD" value={getStat(statistics, 'average_sale_price', 'averageSalePrice') ? <><div>{formatFullUSD(crcToUSD(saleMillionsToCRC(getStat(statistics, 'average_sale_price', 'averageSalePrice'))))}</div><div style={{ color: '#888', fontSize: '1rem' }}>{formatFullCRC(saleMillionsToCRC(getStat(statistics, 'average_sale_price', 'averageSalePrice')))}</div></> : null} />

            <StatCard label="Precio Mediano de Venta CRC" value={getStat(statistics, 'median_sale_price', 'medianSalePrice') ? <><div>{formatFullCRC(saleMillionsToCRC(getStat(statistics, 'median_sale_price', 'medianSalePrice')))}</div><div style={{ color: '#888', fontSize: '1rem' }}>{formatFullUSD(crcToUSD(saleMillionsToCRC(getStat(statistics, 'median_sale_price', 'medianSalePrice'))))}</div></> : null} />

            <StatCard label="Precio Mediano de Venta USD" value={getStat(statistics, 'median_sale_price', 'medianSalePrice') ? <><div>{formatFullUSD(crcToUSD(saleMillionsToCRC(getStat(statistics, 'median_sale_price', 'medianSalePrice'))))}</div><div style={{ color: '#888', fontSize: '1rem' }}>{formatFullCRC(saleMillionsToCRC(getStat(statistics, 'median_sale_price', 'medianSalePrice')))}</div></> : null} />
          </>
        )}

        {(isRent || isAll) && (
          <>
            <StatCard label="Alquiler Mensual Promedio CRC" value={getStat(statistics, 'average_rent_crc', 'averageRentCRC') ? <><div>{formatFullCRC(getStat(statistics, 'average_rent_crc', 'averageRentCRC'))}</div><div style={{ color: '#888', fontSize: '1rem' }}>{formatFullUSD(crcToUSD(getStat(statistics, 'average_rent_crc', 'averageRentCRC')))}</div></> : null} />

            <StatCard label="Alquiler Mensual Promedio USD" value={getStat(statistics, 'average_rent_usd', 'averageRentUSD') ? <><div>{formatFullUSD(getStat(statistics, 'average_rent_usd', 'averageRentUSD'))}</div><div style={{ color: '#888', fontSize: '1rem' }}>{formatFullCRC(usdToCRC(getStat(statistics, 'average_rent_usd', 'averageRentUSD')))}</div></> : null} />

            <StatCard label="Alquiler Mensual Mediano CRC" value={getStat(statistics, 'median_rent_crc', 'medianRentCRC') ? <><div>{formatFullCRC(getStat(statistics, 'median_rent_crc', 'medianRentCRC'))}</div><div style={{ color: '#888', fontSize: '1rem' }}>{formatFullUSD(crcToUSD(getStat(statistics, 'median_rent_crc', 'medianRentCRC')))}</div></> : null} />

            <StatCard label="Alquiler Mensual Mediano USD" value={getStat(statistics, 'median_rent_usd', 'medianRentUSD') ? <><div>{formatFullUSD(getStat(statistics, 'median_rent_usd', 'medianRentUSD'))}</div><div style={{ color: '#888', fontSize: '1rem' }}>{formatFullCRC(usdToCRC(getStat(statistics, 'median_rent_usd', 'medianRentUSD')))}</div></> : null} />
          </>
        )}
      </div>

            {Object.keys(distributionGroups).length > 0 && (
        <>
          <h2 style={{
            color: '#ff3B00',
            fontSize: '2rem',
            marginBottom: '1rem'
          }}>
            Composición del Mercado
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            {[
              'province',
              'canton',
              'district',
              'property_type',
              'bedrooms',
              'bathrooms',
              'parking',
              'year_built',
              'environment',
              'terrain',
              'utility',
              'accessibility',
              'legal_status'
            ]
              .filter(type => distributionGroups[type])
              .map((type) => {
                const typedRows = distributionGroups[type] as any[]

                return (
                  <div
                    key={type}
                    style={{
                      background: '#111',
                      border: '1px solid #222',
                      borderRadius: '1rem',
                      padding: '1.25rem'
                    }}
                  >
                    <h3 style={{
                      marginTop: 0,
                      marginBottom: '1rem',
                      color: '#888',
                      fontSize: '1.35rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '.05rem'
                    }}>
                      {formatLabel(type)}
                    </h3>

                    {typedRows.length > 0 ? (
                      typedRows.map((row: any) => {
                        const listingCount =
                          row.count ??
                          row.listing_count ??
                          0

                        return (
                          <div
                            key={`${type}-${row.value}`}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: '1rem',
                              borderBottom: '1px solid #222',
                              padding: '.5rem 0'
                            }}
                          >
                            <span>{row.value}</span>

                            <strong style={{ color: '#ff3B00' }}>
                              {row.percentage}% ({listingCount})
                            </strong>
                          </div>
                        )
                      })
                    ) : (
                      <p style={{
                        color: '#777',
                        margin: 0
                      }}>
                        Sin datos
                      </p>
                    )}
                  </div>
                )
              })}
          </div>
        </>
      )}

      {relatedMarkets.length > 0 && (
        <>
          <h2 style={{
            color: '#ff3B00',
            fontSize: '2rem',
            marginBottom: '1rem'
          }}>
            Mercados Relacionados
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            {relatedMarkets.map((market: any) => (
              <Link
                key={market.url}
                href={market.url.replace('/explore', '/es/explora')}
                style={{
                  display: 'block',
                  background: '#111',
                  border: '1px solid #222',
                  borderRadius: '1rem',
                  padding: '1.25rem',
                  color: '#fff',
                  textDecoration: 'none'
                }}
              >
                <h3 style={{
                  margin: 0,
                  color: '#888',
                  fontSize: '1.1rem'
                }}>
                  {market.title}
                </h3>

                <p style={{
                  margin: '.5rem 0 0',
                  color: '#ff3B00',
                  fontWeight: 700
                }}>
                  {market.count} propiedades
                </p>
              </Link>
            ))}
          </div>
        </>
      )}

      {Object.keys(suggestionGroups).length > 0 && (
        <>
          <h2 style={{
            color: '#ff3B00',
            fontSize: '2rem',
            marginBottom: '1rem'
          }}>
            Refinamientos Rápidos
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            {Object.entries(suggestionGroups).map(([type, rows]) => {
              const typedRows = rows as any[]

              return (
                <div key={type}>
                  <h3 style={{
                    marginTop: 0,
                    marginBottom: '1rem',
                    color: '#888',
                    fontSize: '1.35rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '.05rem'
                  }}>
                    {formatLabel(type)}
                  </h3>

                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '.5rem'
                  }}>
                    {typedRows.map((neighbor: any) => (
                      <Link
                        key={neighbor.id}
                        href={buildRefinementUrl(
                          result.filters,
                          type,
                          neighbor
                        )}
                        style={{
                          background: '#181818',
                          border: '.25px solid #D4AF3750',
                          color: '#fff',
                          padding: '.85rem 1rem',
                          borderRadius: '999rem',
                          textDecoration: 'none',
                          display: 'inline-block',
                          transition: 'all .2s ease'
                        }}
                      >
                        {neighbor.term_name_es || neighbor.term_name_en || neighbor.term_name}
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {result.listings?.length > 0 && (
        <>
          <h2 style={{
            color: '#ff3B00',
            fontSize: '2rem',
            marginBottom: '1rem'
          }}>
            Propiedades Coincidentes
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem'
          }}>
            {result.listings.map((listing: any) => (
              <Link
                key={listing.id}
                href={`/es/comprar/listing/${listing.id}`}
                style={{
                  display: 'block',
                  background: '#111',
                  color: '#fff',
                  padding: '1rem',
                  border: '1px solid #222',
                  borderRadius: '1rem',
                  textDecoration: 'none'
                }}
              >

              {getFirstImage(listing.images) && (
                <img
                  src={getFirstImage(listing.images) || ''}
                  alt={listing.title || 'Imagen de la propiedad'}
                  style={{
                    width: '100%',
                    height: '180px',
                    objectFit: 'cover'
                  }}
                />
              )}

                <h3>{listing.title || 'Propiedad sin título'}</h3>

                <p style={{ color: '#888' }}>
                  {listing.transaction_type}
                </p>
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  )
}