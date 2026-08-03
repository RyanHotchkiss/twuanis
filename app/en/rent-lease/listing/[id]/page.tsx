import Link from 'next/link'

import { supabase } from '@/lib/supabase'

import JsonLd from '@/app/components/JsonLd'
import TopBar from '@/app/components/TopBar'
import ListingActivityTracker from '@/app/components/ListingActivityTracker'
import ListingActions from '@/app/components/ListingActions'
import { buildListingSchema } from '@/lib/schema-engine'
import { getValuation } from '@/lib/valuation-engine'

import {
  getGraphNeighbors,
  getOntologyTermsByIds
} from '@/lib/graph-engine'

import ListingCompareButton
  from '@/app/components/comparisons/ListingCompareButton'

import PropertyNotes
  from '@/app/components/PropertyNotes'

import {
  resolveListingImages
} from '@/app/utils/resolveListingImages'

export default async function ListingPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  

const { data, error } = await supabase
  .from('listings')
  .select('*')
  .eq('id', id)
  .single()

if (error || !data) {
  return (
    <main
      style={{
        background: '#000',
        minHeight: '100vh',
        color: '#fff',
        padding: '2rem'
      }}
    >
      No Listings Found.
      
    </main>
  )
}

const listing = {
    ...data,
    images:
      resolveListingImages(
        data.images
      )
    }

   const valuation = await getValuation(
      {
        transaction_type: 'rent',
        province: listing.province,
        canton: listing.canton,
        district: listing.district,
        property_type: listing.property_type,
        monthly_price: String(listing.monthly_price),
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
  ontologyRows
    ?.map((row: any) => row.ontology_terms)
    .filter(Boolean) || []

const termIds =
  ontologyTerms
    .map((term: any) => term.id)
    .filter(Boolean)

let graphRows: any[] = []
let neighborTerms: any[] = []

                    if (termIds.length > 0) {

                    graphRows =
                        await getGraphNeighbors(termIds)

                    const neighborIds = [

                        ...new Set([

                        ...graphRows.map(
                            (row: any) =>
                            row.source_term_id
                        ),

                        ...graphRows.map(
                            (row: any) =>
                            row.target_term_id
                        )

                        ])

                    ]

                    neighborTerms =
                        await getOntologyTermsByIds(
                        neighborIds
                        ) || []

                    }

  const schema = buildListingSchema({
                  listing,
                  ontologyTerms,
                  neighborTerms,
                  graphRows,
                  lang: 'en',
                  mode: 'rent'
                  })

  const USD_TO_CRC = 500

  const monthlyPriceUSD =
    listing.currency === 'USD'
      ? Number(listing.monthly_price)
      : Number(listing.monthly_price) / USD_TO_CRC

  const monthlyPriceCRC =
    listing.currency === 'USD'
      ? Number(listing.monthly_price) * USD_TO_CRC
      : Number(listing.monthly_price)

  const monthlyPricePerM2USD =
    listing.monthly_price && listing.property_area
      ? monthlyPriceUSD / Number(listing.property_area)
      : null

  const monthlyPricePerM2CRC =
    listing.monthly_price && listing.property_area
      ? monthlyPriceCRC / Number(listing.property_area)
      : null

return (

  <>

        {schema && (
            <JsonLd data={schema} />
          )}

          <ListingActivityTracker
            listingId={listing.id}
            title={listing.title}
            province={listing.province}
            canton={listing.canton}
            district={listing.district}
            propertyType={
              listing.property_type
            }
            transactionType="rent"
          />

    <main style={{
      background: '#000',
      minHeight: '100vh',
      color: '#fff',
      padding: '2rem'
    }}>

      {/* TOP BAR */}
      <div style={{
        marginBottom: '2rem'
      }}>

        <Link
          href="/en/rent-lease"
          style={{
            color: '#FFFFFF',
            textDecoration: 'none',
            fontWeight: 'bold'
          }}
        >
          ← Return to Marketplace
        </Link>

      </div>

      {/* MAIN GRID */}
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
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1rem'
            }}>

              {listing.images.slice(1).map((image: string, index: number) => (

                <img
                  key={index}
                  referrerPolicy="no-referrer"
                  src={image}
                  alt=""
                  style={{
                    width: '100%',
                    height: '8rem',
                    objectFit: 'cover',
                    borderRadius: '1rem',
                    border: '1px solid #222'
                  }}
                />

              ))}

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

            <ListingActions
              listingId={listing.id}
              title={listing.title}
              province={listing.province}
              canton={listing.canton}
              district={listing.district}
              propertyType={listing.property_type}
              transactionType="rent"
              language="en"
            />

            <ListingCompareButton
              listingId={listing.id}
              language="en"
            />

            <PropertyNotes
              listingId={listing.id}
              language="en"
            />

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

            {/* Ubicación */}
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

            {/* Tipo de Propiedad */}
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

            {/* ACCESSIBILITY */}
            <div>

            <span style={label}>
                Accessibility
            </span>

            <div style={pillContainer}>

                  {(Array.isArray(listing.accessibility)
                    ? listing.accessibility
                    : typeof listing.accessibility === 'string'
                    ? (() => {
                        try {
                          return JSON.parse(listing.accessibility)
                        } catch {
                          return [listing.accessibility]
                        }
                      })()
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
                    ? (() => {
                        try {
                          return JSON.parse(listing.terrain)
                        } catch {
                          return [listing.terrain]
                        }
                      })()
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

            {/* UTILITIES */}
            <div>

            <span style={label}>
                Utilities
            </span>

            <div style={pillContainer}>

                  {(Array.isArray(listing.utility)
                    ? listing.utility
                    : typeof listing.utility === 'string'
                    ? (() => {
                        try {
                          return JSON.parse(listing.utility)
                        } catch {
                          return [listing.utility]
                        }
                      })()
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

                {listing.monthly_price
                ? `${listing.currency || 'CRC'} ${Number(
                    listing.monthly_price
                  ).toLocaleString()} / month`
                : 'Price Not Available'}

            </div>

            </div>

            {/* WHATSAPP */}
            <div>

            <span style={label}>
                WhatsApp
            </span>

            <div style={entityCard}>
                + {listing.whatsapp}
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
              Contact Seller
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
                  label="Estimated Market Rent"
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
              label="Monthly Asking Rent"
              value={listing.monthly_price ? (
                      <>
                        <div>${Math.round(monthlyPriceUSD).toLocaleString()} / month</div>
                        <div style={secondaryValue}>
                          ₡{Math.round(monthlyPriceCRC).toLocaleString()} / month
                        </div>
                      </>
                    ) : (
                      'Price Not Available'
                    )}
            />

            <StatCard
              label="Rent Position"
              value={
                valuation.pricingSignals.pricePosition ||
                'Not enough data'
              }
            />

            <StatCard
                label="Monthly Rent per m²"
                value={
                  monthlyPricePerM2USD && monthlyPricePerM2CRC ? (
                    <>
                      <div>
                        ${Math.round(monthlyPricePerM2USD).toLocaleString()}/m²
                      </div>

                      <div style={secondaryValue}>
                        ₡{Math.round(monthlyPricePerM2CRC).toLocaleString()}/m²
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

function StatCard({
      label,
      value
    }: {
      label: string
      value: React.ReactNode
    }) {
      return (
        <div style={statCard}>
          <div style={statLabel}>
            {label}
          </div>

          <div style={statValue}>
            {value}
          </div>
        </div>
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
