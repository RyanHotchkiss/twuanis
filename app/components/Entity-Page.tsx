import Link from 'next/link'

import {
  getEntity,
  EntityType
} from '@/lib/entity-engine'

import {
  getCachedMarketStatistics
} from '@/lib/statistics-engine'

import {
  supabase
} from '@/lib/supabase'

import {
  supabaseAdmin
} from '@/lib/supabase-admin'

import {
  resolveMarketplacePlacement
} from '@/lib/promotion-placement'

import {
  rankListings
} from '@/lib/listing-ranking'

import MarketActivityTracker from '@/app/components/MarketActivityTracker'

type EntityPageProps = {
  entityType: EntityType
  slug: string
}

function entityPath(
  termType: string,
  slug: string
) {
  if (termType === 'province') {
    return `/province/${slug}`
  }

  if (termType === 'canton') {
    return `/canton/${slug}`
  }

  if (termType === 'district') {
    return `/district/${slug}`
  }

  if (termType === 'property_type') {
    return `/property-type/${slug}`
  }

  if (termType === 'environment') {
    return `/environment/${slug}`
  }

  if (termType === 'utility') {
    return `/utility/${slug}`
  }

  if (termType === 'terrain') {
    return `/terrain/${slug}`
  }

  if (termType === 'legal_status') {
    return `/legal-status/${slug}`
  }

  if (termType === 'accessibility') {
    return `/accessibility/${slug}`
  }

  return `/entity/${slug}`
}

export default async function EntityPage({
  entityType,
  slug
}: EntityPageProps) {
  const data = await getEntity(
    entityType,
    slug
  )

  if (!data) {
    return (
      <main style={{ padding: '2rem' }}>
        <h1>Entity not found</h1>
      </main>
    )
  }

  const marketData =
    await getCachedMarketStatistics(
      entityType,
      slug
    ).catch(() => null)

  const {
      entity,
      parentEntity,
      childEntities,
      relatedEntities,
      listings,
      listingCount
    } = data

    let placedListings =
    rankListings({
      listings
    })


  if (
    entityType ===
      'province'
  ) {

    const placement =
      await resolveMarketplacePlacement({
        supabase:
          supabaseAdmin,

        listings,

        surface:
          'province',

        province:
          entity.term_name_en ||
          entity.term_name
      })

    placedListings =
      placement.listings
  }


  if (
    entityType ===
      'property_type'
  ) {

    const placement =
      await resolveMarketplacePlacement({
        supabase:
          supabaseAdmin,

        listings,

        surface:
          'property-type',

        propertyType:
          entity.term_name_en ||
          entity.term_name
      })

    placedListings =
      placement.listings
  }

  return (
    <>
      <MarketActivityTracker
        id={entity.id}
        title={
          entity.term_name_en ||
          entity.term_name
        }
        type={entity.term_type}
        summary={entity.description}
      />

      <main style={{ padding: '2rem' }}>
        <p>{entity.term_type}</p>

        <h1>
          {entity.term_name_en ||
            entity.term_name}
        </h1>

        {entity.description && (
          <p>{entity.description}</p>
        )}

        <h2>Knowledge Graph Facts</h2>

        <ul>
          <li>
            Entity Type: {entity.term_type}
          </li>

          <li>
            Slug: {entity.slug}
          </li>

          <li>
            Listings Connected: {listingCount}
          </li>
        </ul>

        {marketData && (
          <>
            <h2>Market Intelligence</h2>

            <ul>
              <li>
                Total Listings:{' '}
                {
                  marketData.statistics
                    .total_listings
                }
              </li>

              <li>
                Sale Listings:{' '}
                {
                  marketData.statistics
                    .sale_listings
                }
              </li>

              <li>
                Rental Listings:{' '}
                {
                  marketData.statistics
                    .rental_listings
                }
              </li>

              <li>
                Average Rent CRC: ₡
                {
                  marketData.statistics
                    .average_rent_crc ??
                  'Not enough data'
                }
              </li>

              <li>
                Median Rent CRC: ₡
                {
                  marketData.statistics
                    .median_rent_crc ??
                  'Not enough data'
                }
              </li>

              <li>
                Average Rent USD: $
                {
                  marketData.statistics
                    .average_rent_usd ??
                  'Not enough data'
                }
              </li>

              <li>
                Median Rent USD: $
                {
                  marketData.statistics
                    .median_rent_usd ??
                  'Not enough data'
                }
              </li>

              <li>
                Recent Listings:{' '}
                {
                  marketData.statistics
                    .recent_listing_count
                }
              </li>
            </ul>

            <h2>Market Distributions</h2>

            {marketData.distributions.map(
              (row) => (
                <p key={row.id}>
                  {row.distribution_type}:{' '}
                  {row.value} —{' '}
                  {row.percentage}%
                </p>
              )
            )}
          </>
        )}

        {parentEntity && (
          <>
            <h2>Parent Entity</h2>

            <Link
              href={entityPath(
                parentEntity.term_type,
                parentEntity.slug
              )}
            >
              {parentEntity.term_name_en ||
                parentEntity.term_name}
            </Link>
          </>
        )}

        {childEntities.length > 0 && (
          <>
            <h2>Child Entities</h2>

            <div>
              {childEntities.map(
                (child) => (
                  <p key={child.id}>
                    <Link
                      href={entityPath(
                        child.term_type,
                        child.slug
                      )}
                    >
                      {child.term_name_en ||
                        child.term_name}
                    </Link>
                  </p>
                )
              )}
            </div>
          </>
        )}

        {relatedEntities.length > 0 && (
          <>
            <h2>Related Entities</h2>

            <div>
              {relatedEntities.map(
                (related) => (
                  <p key={related.id}>
                    <Link
                      href={entityPath(
                        related.term_type,
                        related.slug
                      )}
                    >
                      {related.term_name_en ||
                        related.term_name}
                    </Link>
                  </p>
                )
              )}
            </div>
          </>
        )}

        <h2>Listings</h2>

        {placedListings.length === 0 && (
          <p>
            No listings connected to this
            entity yet.
          </p>
        )}

        <div>
          {placedListings.map((listing) => (
            <Link
              key={listing.id}
              href={`/en/buy/listing/${listing.id}`}
              style={{
                display: 'block',
                marginBottom: '1rem',
                padding: '1rem',
                border: '1px solid #333',
                borderRadius: '1rem',
                textDecoration: 'none'
              }}
            >
              <h3>{listing.title}</h3>

              <p>
                {listing.province} →{' '}
                {listing.canton} →{' '}
                {listing.district}
              </p>

              <p>
                {listing.property_type} | ₡
                {listing.price_millions}M
              </p>
            </Link>
          ))}
        </div>
      </main>
    </>
  )
}