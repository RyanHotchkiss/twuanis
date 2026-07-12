import Link from 'next/link'

import { supabase } from '@/lib/supabase'

import JsonLd from '@/app/components/JsonLd'
import TopBar from '@/app/components/TopBar'

import { buildListingSchema } from '@/lib/schema-engine'
import { getValuation } from '@/lib/valuation-engine'
import {
  getGraphNeighbors,
  getOntologyTermsByIds
} from '@/lib/graph-engine'

export default async function ListingPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

function StatCard({
          label,
          value
        }: {
          label: string
          value: any
        }) {
          return (
            <div style={statCard}>
              <p style={statLabel}>{label}</p>
              <div style={statValue}>{value}</div>
            </div>
          )
        }

  function MoneyValue({
      usd,
      crc
    }: {
      usd: number | null
      crc: number | null
    }) {
      return (
        <>
          <div style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 'bold' }}>
            {usd ? `$${Math.round(usd).toLocaleString()}` : 'Not enough data'}
          </div>
          {crc && (
            <div style={{ color: '#888', fontSize: '1rem', marginTop: '.35rem' }}>
              ₡{Math.round(crc).toLocaleString()}
            </div>
          )}
        </>
      )
    }

const { data, error } = await supabase
  .from('listings')
  .select('*')
  .eq('id', id)
  .single()

if (error || !data) {
  return (
    <main style={{
      background: '#000',
      minHeight: '100vh',
      color: '#fff',
      padding: '2rem'
    }}>
      Property Not Found
    </main>
  )
}

const listing = {
      ...data,
      images:
        Array.isArray(data.images)
          ? data.images
          : typeof data.images === 'string'
          ? (() => {
              try {
                return JSON.parse(data.images)
              } catch {
                return data.images
                  .split('|')
                  .map((img: string) => img.trim())
                  .filter(Boolean)
              }
            })()
          : []
    }

    const listingPricePerM2 =
      listing.current_price && listing.property_area
        ? Number(listing.current_price) / Number(listing.property_area)
        : null

    const valuation = await getValuation(
      {
        transaction_type:
          listing.transaction_type === 'buy'
            ? 'sale'
            : listing.transaction_type,

        province: listing.province,
        canton: listing.canton,
        district: listing.district,
        property_type: listing.property_type,
      },
      'en'
    )

const { data: ontologyRows } = await supabase
  .from('listings_ontology_terms')
  .select(`
    ontology_terms (
      id,
      parent_id,
      term_name,
      term_type,
      slug,
      description,
      official_code,
      term_name_en,
      term_name_es,
      slug_en,
      slug_es
    )
  `)
  .eq('listing_id', data.id)

const ontologyTerms =
  (ontologyRows || [])
    .map((row: any) => row.ontology_terms)
    .filter(Boolean)

const termIds =
  ontologyTerms
    .map((term: any) => term.id)
    .filter(Boolean)

let graphRows: any[] = []
let neighborTerms: any[] = []

if (termIds.length > 0) {
  graphRows = await getGraphNeighbors(termIds)

  const neighborIds = [
            ...new Set([
            ...graphRows.map((row: any) => row.source_term_id),
            ...graphRows.map((row: any) => row.target_term_id)
            ])
        ]

  neighborTerms =
        (await getOntologyTermsByIds(neighborIds)) || []
        }

const schema = buildListingSchema({
        listing,
        ontologyTerms,
        neighborTerms,
        graphRows,
        lang: 'en',
        mode: 'buy'
        })
  
        const USD_TO_CRC = 500

          const listingPriceUSD =
            listing.currency === 'USD'
              ? Number(listing.current_price)
              : Number(listing.current_price) / USD_TO_CRC

          const listingPriceCRC =
            listing.currency === 'USD'
              ? Number(listing.current_price) * USD_TO_CRC
              : Number(listing.current_price)

          const listingPricePerM2USD =
            listing.current_price && listing.property_area
              ? listingPriceUSD / Number(listing.property_area)
              : null

          const listingPricePerM2CRC =
            listing.current_price && listing.property_area
              ? listingPriceCRC / Number(listing.property_area)
              : null

  return (

    <>

    {schema && <JsonLd data={schema} />}

    <main style={{
      background: '#000',
      minHeight: '100vh',
      color: '#fff',
      padding: '2rem'
    }}>

<TopBar />

        {/* MAIN LAYOUT */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr .8fr',
            gap: '2rem'
          }}>

        {/* LEFT */}
        <div>

          {/* MAIN IMAGE */}
          <div style={{
            borderRadius: '1.5rem',
            overflow: 'hidden',
            marginBottom: '1rem',
            background: '#111'
          }}>

            {listing.images?.[0] ? (

              <img
                  referrerPolicy="no-referrer"
                  src={listing.images[0]}
                  alt={listing.title}
                  style={{
                  width: '100%',
                  aspectRatio: '4 / 3',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />

            ) : (

              <div style={{
                height: '34rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#555'
              }}>
                No Image
              </div>

            )}

          </div>
                    
        

          {/* IMAGE GRID */}
          {listing.images?.length > 1 && (

            <div style={{
              display:'grid',
              gridTemplateColumns:'repeat(4, 1fr)',
              gap:'1rem'
            }}>

              {listing.images.slice(1).map(
                (image:string, index:number) => (

                  <img
                    key={index}
                    referrerPolicy="no-referrer"
                    src={image}
                    alt=""
                    style={{
                      width:'100%',
                      height:'8rem',
                      objectFit:'cover',
                      borderRadius:'1rem',
                      border:'1px solid #222'
                    }}
                  />

                )
              )}

            </div>

          )}

        </div>

        {/* RIGHT */}
        <div>

          <div style={{
            background: '#111',
            border: '1px solid #222',
            borderRadius: '1.5rem',
            padding: '2rem',
            position: 'sticky',
            top: '2rem'
          }}>

            <h1 style={{
              fontSize: '2rem',
              marginBottom: '1rem'
            }}>
              {listing.title}
            </h1>

            <p style={{
              color: '#999',
              marginBottom: '2rem',
              lineHeight: 1.6
            }}>
              {listing.description}
            </p>

            <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
            }}>

            {/* LOCATION */}
            <div>

            <span style={label}>
                Location
            </span>

            <div style={entityCard}>
                {listing.province}
                {listing.canton && ` → ${listing.canton}`}
                {listing.district && ` → ${listing.district}`}
            </div>

            </div>

            {/* PROPERTY TYPE */}
            <div>

            <span style={label}>
                Property Type
            </span>

            <div style={entityCard}>
                {listing.property_type}
            </div>

            </div>

            {/* BEDROOMS */}
            {listing.bedrooms && (

            <div>

            <span style={label}>
                Bedrooms
            </span>

            <div style={entityCard}>
                {listing.bedrooms}
            </div>

            </div>

            )}

            {/* BATHROOMS */}
            {listing.bathrooms && (

            <div>

            <span style={label}>
                Bathrooms
            </span>

            <div style={entityCard}>
                {listing.bathrooms}
            </div>

            </div>

            )}

            {/* PARKING */}
            {listing.parking && (

            <div>

            <span style={label}>
                Parking
            </span>

            <div style={entityCard}>
                {listing.parking}
            </div>

            </div>

            )}

            {/* YEAR BUILT */}
            {listing.year_built_range && (

            <div>

            <span style={label}>
                Year Constructed
            </span>

            <div style={entityCard}>
                {listing.year_built_range}
            </div>

            </div>

            )}

            {/* CONSTRUCTION AREA */}
            {listing.construction_area && (

            <div>

            <span style={label}>
                Construction Area
            </span>

            <div style={entityCard}>
                {listing.construction_area
                ? `${Number(listing.construction_area).toLocaleString()} m²`
                : ''}
            </div>

            </div>

            )}

            {/* PROPERTY AREA */}
            <div>

            <span style={label}>
                Property Area
            </span>

            <div style={entityCard}>
                {listing.property_area
                ? `${Number(listing.property_area).toLocaleString()} m²`
                : ''}
            </div>

            </div>

            {/* ENVIRONMENT */}
            <div>

            <span style={label}>
                Environment
            </span>

            <div style={pillContainer}>

                <span style={pillEntity}>
                {listing.environment}
                </span>

            </div>

            </div>

            {/* ACCSIBILITY */}
            <div>

            <span style={label}>
                Accessibility
            </span>

            <div style={pillContainer}>

                {(Array.isArray(listing.accessibility)
                ? listing.accessibility
                : Array.isArray(listing.accessibility)
                ? listing.accessibility
                : typeof listing.accessibility === 'string'
                ? [listing.accessibility]
                : []
                ).map((item: string) => (

                <span
                    key={item}
                    style={pillEntity}
                >
                    {item}
                </span>

                ))}

            </div>

            </div>

            {/* TERRAIN */}
            <div>

            <span style={label}>
                Terrain
            </span>

            <div style={pillContainer}>

                {(Array.isArray(listing.terrain)
                ? listing.terrain
                : typeof listing.terrain === 'string'
                ? JSON.parse(listing.terrain)
                : []
                ).map((item: string) => (

                <span
                    key={item}
                    style={pillEntity}
                >
                    {item}
                </span>

                ))}

            </div>

            </div>

            {/* UTILITI */}
            <div>

            <span style={label}>
                Utilities
            </span>

            <div style={pillContainer}>

                {(Array.isArray(listing.utility)
                ? listing.utility
                : typeof listing.utility === 'string'
                ? JSON.parse(listing.utility)
                : []
                ).map((item: string) => (

                <span
                    key={item}
                    style={pillEntity}
                >
                    {item}
                </span>

                ))}

            </div>

            </div>

            {/* LEGAL STATUS */}
            <div>

            <span style={label}>
                Legal Status
            </span>

            <div style={pillContainer}>

                <span style={pillEntity}>
                {listing.legal_status}
                </span>

            </div>

            </div>

            {/* PRICE */}
            <div>

            <span style={label}>
                Price
            </span>

            <div style={priceCard}>

                {listing.current_price
                  ? listing.currency === 'USD' ||
                    listing.title?.toUpperCase().includes('USD')
                    ? `$${Number(listing.current_price).toLocaleString()}`
                    : `₡${Number(listing.current_price).toLocaleString()}`
                  : listing.price_millions
                  ? `₡${Number(listing.price_millions).toLocaleString()}M`
                  : 'Precio No Disponible'}

            </div>

            </div>

            {/* WHATSAPP */}
            <div>

            <span style={label}>
                WhatsApp
            </span>

            <div style={entityCard}>
               {listing.whatsapp}
            </div>

            </div>

            </div>

            {/* CONTACT BUTTON */}
            <a
              href={`https://wa.me/${listing.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginTop: '2rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#FFFFFF',
                color: '#000',
                textDecoration: 'none',
                padding: '1rem',
                borderRadius: '999px',
                fontWeight: 'bold'
              }}
            >
              Contact Seller on WhatsApp
            </a>

          </div>

        </div>

      </div>

      <h2
            style={{
              color: '#ff3B00',
              fontSize: '2rem',
              marginTop: '3rem',
              marginBottom: '1rem'
            }}
          >
            Twuanis Listing Intelligence
          </h2>

          <div style={cardGrid}>
            <StatCard
                  label="Estimated Market Value"
                  value={
                    valuation.summary.estimatedMarketValueUSD ? (
                      <>
                        <div>
                          {valuation.summary.estimatedMarketValueUSD}
                        </div>

                        <div style={secondaryValue}>
                          {valuation.summary.estimatedMarketValueCRC}
                        </div>
                      </>
                    ) : (
                      'Not enough data'
                    )
                  }
                />

            <StatCard
              label="Listing Price"
              value={
                listing.current_price ? (
                  <>
                    <div>
                      ${Math.round(listingPriceUSD).toLocaleString()}
                    </div>

                    <div style={secondaryValue}>
                      ₡{Math.round(listingPriceCRC).toLocaleString()}
                    </div>
                  </>
                ) : (
                  'Not available'
                )
              }
            />

            <StatCard
              label="Price Position"
              value={
                valuation.pricingSignals.pricePosition ||
                'Not enough data'
              }
            />

            <StatCard
                label="Price per m²"
                value={
                  listingPricePerM2USD && listingPricePerM2CRC ? (
                    <>
                      <div>
                        ${Math.round(listingPricePerM2USD).toLocaleString()}/m²
                      </div>

                      <div style={secondaryValue}>
                        ₡{Math.round(listingPricePerM2CRC).toLocaleString()}/m²
                      </div>
                    </>
                  ) : (
                    'Not enough data'
                  )
                }
              />

            <StatCard
              label="Confidence"
              value={`${valuation.summary.confidenceScore} · ${valuation.summary.confidenceLabel}`}
            />
          </div>

    </main>
</>
  )

}

const label = {
  color: '#777',
  fontSize: '.8rem',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  display: 'block',
  marginBottom: '.35rem'
}

const entityCard = {
  background: '#0d0d0d',
  border: '1px solid #222',
  borderRadius: '1rem',
  padding: '1rem 1.25rem',
  color: '#fff',
  fontSize: '1rem',
  lineHeight: 1.6
}

const pillContainer = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '.75rem'
}

const pillEntity = {
  background: '#181818',
  border: '1px solid #2a2a2a',
  borderRadius: '999px',
  padding: '.75rem 1rem',
  color: '#ddd',
  fontSize: '.95rem'
}

const priceCard = {
  background: '#FFFFFF',
  color: '#000',
  borderRadius: '1rem',
  padding: '1.25rem',
  fontSize: '1.5rem',
  fontWeight: 'bold',
  textAlign: 'center' as const
}

const cardGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px,1fr))',
  gap: '1rem',
  marginTop: '1rem'
}

const statCard = {
  background: '#111',
  border: '1px solid #222',
  borderRadius: '1rem',
  padding: '1.5rem'
}

const statLabel = {
  color: '#888',
  fontSize: '.9rem',
  marginBottom: '.5rem'
}

const statValue = {
  fontSize: '1.6rem',
  fontWeight: 'bold'
}

const secondaryValue = {
  marginTop: '.35rem',
  color: '#888',
  fontSize: '1rem',
  fontWeight: 400
}