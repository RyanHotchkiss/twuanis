'use client'

import Link from 'next/link'

type BuyPropertyCardProps = {
  property: any
}

export default function BuyPropertyCard({
  property
}: BuyPropertyCardProps) {

  return (

    <Link
      href={`/en/buy/listing/${property.id}`}
      style={{
        textDecoration: 'none',
        color: 'inherit'
      }}
    >

      <div
        style={{
          background: '#181818',
          border: '1px solid #222',
          borderRadius: '22px',
          overflow: 'hidden',
          cursor: 'pointer'
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
              src={property.images[0]}
              alt={property.title}
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
              No Image
            </div>

          )}

        </div>

        {/* CONTENT */}
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
              color: '#888',
              marginBottom: '16px'
            }}
          >
            {property.province} → {property.canton} → {property.district}
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >

            <span style={pill}>
              {property.property_type}
            </span>

            <span style={pill}>
              {property.environment}
            </span>

            <span style={pill}>
              {Array.isArray(property.terrain)
                ? property.terrain.join(', ')
                : property.terrain}
            </span>

          </div>

        </div>

      </div>

    </Link>

  )

}

const pill = {
  background: '#181818',
  border: '1px solid #2a2a2a',
  color: '#bbb',
  padding: '10px 14px',
  borderRadius: '999px',
  cursor: 'pointer'
}