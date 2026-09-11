'use client'

import {
  csvMetaPill
} from '@/app/styles/sell-styles'

import {
  resolveListingOriginalMonetaryValue
} from '@/lib/listing-monetary-value'

type CsvListingsGridProps = {
  csvListings: any[]
  setCsvListings: (value: any[]) => void
  isRentLease?: boolean
}

export default function CsvListingsGrid({
  csvListings,
  setCsvListings,
  isRentLease = false
}: CsvListingsGridProps) {

  function formatOriginalPrice(
    listing: any
  ): string {

        const monetaryValue =
      resolveListingOriginalMonetaryValue({
        transaction_type:
          isRentLease
            ? 'rent'
            : 'sale',

        currency:
          listing.currency,

        current_price:
          listing.current_price,

        price_millions:
          listing.price_millions,

        monthly_price:
          listing.monthly_price
      })

    if (!monetaryValue) {
      return 'Price unavailable'
    }

    const {
      amount,
      currency
    } = monetaryValue

    const formattedAmount =
      new Intl.NumberFormat(
        currency === 'USD'
          ? 'en-US'
          : 'es-CR',
        {
          maximumFractionDigits: 0
        }
      ).format(amount)

    return currency === 'USD'
      ? `$${formattedAmount}`
      : `₡${formattedAmount}`
  }

  return (

    <div style={grid}>

      {csvListings.map((listing, index) => (

        <div
          key={index}
          style={card}
        >

          {/* IMAGE AREA */}
          <div style={imageArea}>

            {listing.images.length > 0 ? (

              <img
                src={listing.images[0].preview}
                alt=""
                style={heroImage}
              />

            ) : (

              <div>
                No Images Uploaded
              </div>

            )}

          </div>

          {/* CONTENT */}
          <div style={content}>

            <h3 style={title}>
              {listing.title}
            </h3>

            <p style={description}>
              {listing.description}
            </p>

            {/* META */}
            <div style={metaWrap}>

              <div style={csvMetaPill}>
                {listing.province}
              </div>

              <div style={csvMetaPill}>
                {listing.canton}
              </div>

              <div style={csvMetaPill}>
                {formatOriginalPrice(listing)}
              </div>

            </div>

          </div>

        </div>

      ))}

    </div>

  )

}

const grid = {
  display:'grid',
  gridTemplateColumns:
    'repeat(auto-fill,minmax(420px,1fr))',
  gap:'2rem'
}

const card = {
  background:'#111',
  border:'1px solid #222',
  borderRadius:'1.5rem',
  overflow:'hidden'
}

const imageArea = {
  aspectRatio:'4 / 3',
  background:'#0a0a0a',
  borderBottom:'1px solid #222',
  display:'flex',
  alignItems:'center',
  justifyContent:'center',
  color:'#555',
  position:'relative' as const
}

const heroImage = {
  width:'100%',
  height:'100%',
  objectFit:'cover' as const
}

const content = {
  padding:'1.5rem'
}

const title = {
  fontSize:'1.4rem',
  marginBottom:'.75rem',
  lineHeight:'1.4'
}

const description = {
  color:'#888',
  lineHeight:'1.7',
  marginBottom:'1.5rem'
}

const metaWrap = {
  display:'flex',
  flexWrap:'wrap' as const,
  gap:'.5rem',
  marginBottom:'1.5rem'
}