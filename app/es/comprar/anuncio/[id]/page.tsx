import {publishedListingSnapshot} from '@/lib/lpi-published-snapshot'
import ListingIntelligencePanel from '@/app/components/ListingIntelligencePanel'
import PropertyDetailGallery from '@/app/components/property-detail/PropertyDetailGallery'
import PropertyAttributes from '@/app/components/property-detail/PropertyAttributes'
import {descriptionText} from '@/lib/property-presentation'
import detailStyles from '@/app/components/property-detail/PropertyDetailLayout.module.css'
import {Suspense} from 'react'
import ListingDetailLoading from '@/app/components/ListingDetailLoading'
import {publicListingMetadata} from '@/lib/schema/listing-metadata'
export async function generateMetadata({params}:{params:Promise<{id:string}>}){return publicListingMetadata((await params).id,'es','buy')}
export const dynamic='force-dynamic'
export const revalidate=0
import Link from 'next/link'
import {
  getPublicListingById
} from '@/lib/public-listings-server'
import JsonLd from '@/app/components/JsonLd'
import TopBar from '@/app/components/TopBar'
import ListingActivityTracker from '@/app/components/ListingActivityTracker'
import ListingActions from '@/app/components/ListingActions'
import ListingAttribution from '@/app/components/property-detail/ListingAttribution'
import { buildListingSchema } from '@/lib/schema-engine'
import RecordRecentlyViewedProperty
  from '@/app/components/RecordRecentlyViewedProperty'

import ListingCompareButton
  from '@/app/components/comparisons/ListingCompareButton'

function StatCard({ label, value }: { label: string; value: any }) {
  return (
    <div style={statCard}>
      <p style={statLabel}>{label}</p>
      <div style={statValue}>{value}</div>
    </div>
  )
}

import PropertyNotes
  from '@/app/components/PropertyNotes'

import {
  resolveListingImages
} from '@/app/utils/resolveListingImages'

import {
  resolveMarketAnalyticalContext
} from '@/lib/market-analytical-context'

import {
  resolveListingOriginalMonetaryValue,
  resolveListingAmountCrc,
  resolveListingAmountUsd
} from '@/lib/listing-monetary-value'
export default async function ListingPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

const data =
  await getPublicListingById(
    id
  )

if (!data) {
  return (
    <main
      style={{
        background: 'var(--background)',
        minHeight: '100vh',
        color: 'var(--foreground)',
        padding: '2rem'
      }}
    >
      Propiedad No Encontrada
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

                    const canonicalEvidence =
                      data.canonical_domain_version === 1
                        ? (data as typeof data & {
                            canonicalEvidence: import(
                              '@/lib/canonical-listing-reader'
                            ).CanonicalEvidence
                          }).canonicalEvidence
                        : null

                  

                  

                  const originalMonetaryValue =
                    resolveListingOriginalMonetaryValue(
                      listing
                    )

                    const recentlyViewedPrice =
                      originalMonetaryValue
                        ? originalMonetaryValue.currency ===
                            'USD'
                          ? `$${Math.round(
                              originalMonetaryValue.amount
                            ).toLocaleString()}`
                          : `₡${Math.round(
                              originalMonetaryValue.amount
                            ).toLocaleString()}`
                        : null

                  

const navButton = {
            background:'var(--foreground)',
            border:'.0625rem solid var(--foreground)',
            color:'var(--background)',
            borderRadius:'999rem',
            padding:'.85rem 1.25rem',
            fontWeight:'bold',
            cursor:'pointer',
            transition:'all .2s ease',
            backdropFilter:'blur(10px)'
          }



async function ListingSchema() {
 const schema = await buildListingSchema({listing, ontologyTerms:[], neighborTerms:[], graphRows:[], lang:'es', mode:'buy'})
 return schema ? <JsonLd data={schema} /> : null
}



return (

  <>
    <Suspense fallback={null}><ListingSchema /></Suspense>

    <ListingActivityTracker
      listingId={listing.id}
      title={listing.title}
      province={listing.province}
      canton={listing.canton}
      district={listing.district}
      propertyType={
        listing.property_type
      }
      transactionType="buy"
    />

    <RecordRecentlyViewedProperty
      listing={{id:listing.id,title:listing.title,images:listing.images,province:listing.province,canton:listing.canton,district:listing.district}}
      price={recentlyViewedPrice}
      href={`/es/comprar/anuncio/${listing.id}`}
    />

    <main className={detailStyles.page}
      style={{
        background: 'var(--background)',
        minHeight: '100vh',
        color: 'var(--foreground)',
        padding: '2rem'
      }}
    >

<TopBar />

        {/* MAIN LAYOUT */}
          <div className={detailStyles.layout} style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr .8fr',
            gap: '2rem'
          }}>

        {/* Existing image identities/order; selected index is mobile presentation only. */}
        <PropertyDetailGallery key={listing.id} images={listing.images ?? []} title={listing.title} language="es" />

        {/* RIGHT */}
        <div>

          <div className={detailStyles.information} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
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
              transactionType="buy"
              language="es"
            />

            <ListingAttribution language="es" agencyLogoUrl={listing.agency_logo_url} agencyName={listing.agency_name} listingAgentPhotoUrl={listing.listing_agent_photo_url} listingAgentName={listing.listing_agent_name} />

            <ListingCompareButton
              listingId={listing.id}
              language="es"
            />

            <PropertyNotes
              listingId={listing.id}
              language="es"
            />

            <p style={{
              color: 'var(--muted)',
              marginBottom: '2rem',
              whiteSpace: 'pre-line',
              lineHeight: 1.6
            }}>
              {descriptionText(listing.description)}
            </p>

            <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
            }}>

            <PropertyAttributes listing={listing} language="es" styles={{label,entityCard,pillContainer,pillEntity}} />

            {/* PRICE */}
            <div>

            <span style={label}>
                Precio
            </span>

            <div style={priceCard}>

                {originalMonetaryValue ? (
                  originalMonetaryValue.currency === 'USD' ? (
                    `$${Math.round(originalMonetaryValue.amount).toLocaleString()}`
                  ) : (
                    `₡${Math.round(originalMonetaryValue.amount).toLocaleString()}`
                  )
                ) : (
                  'Precio No Disponible'
                )}

            </div>

            </div>

            </div>

            {/* CONTACT BUTTON */}
            
          </div>

        </div>

      </div>

              <ListingIntelligencePanel context={{kind:"published",id:listing.id,snapshot:publishedListingSnapshot(data),transaction:"sale"}} language="es" />

    </main>

  </>

  )

}



const label = {
  color: 'var(--muted)',
  fontSize: '.8rem',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  display: 'block',
  marginBottom: '.35rem'
}

const entityCard = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '1rem',
  padding: '1rem 1.25rem',
  color: 'var(--foreground)',
  fontSize: '1rem',
  lineHeight: 1.6
}

const pillContainer = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '.75rem'
}

const pillEntity = {
  background: 'var(--surface-raised)',
  border: '1px solid var(--border)',
  borderRadius: '999px',
  padding: '.75rem 1rem',
  color: 'var(--foreground)',
  fontSize: '.95rem'
}

const priceCard = {
  background: 'var(--foreground)',
  color: 'var(--background)',
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
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '1rem',
  padding: '1.5rem'
}

const statLabel = {
  color: 'var(--muted)',
  fontSize: '.9rem',
  marginBottom: '.5rem'
}

const statValue = {
  fontSize: '1.6rem',
  fontWeight: 'bold'
}

const secondaryValue = {
  marginTop: '.35rem',
  color: 'var(--muted)',
  fontSize: '1rem',
  fontWeight: 400
}
