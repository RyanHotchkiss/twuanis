import {
  NextRequest,
  NextResponse
} from 'next/server'

import {
  resolveMarketAnalyticalContext
} from '@/lib/market-analytical-context'

import {
  projectPublicListingMonetaryValues
} from '@/lib/public-listing-monetary-projection'

import {validateMarketplacePage} from '@/lib/marketplace-pagination'
import {
  getPublicListingPage,
  getPublicListings,
  type PublicListingTransaction
} from '@/lib/public-listings-server'

const ALLOWED_TRANSACTIONS =
  new Set<PublicListingTransaction>([
    'sale',
    'rent'
  ])

export async function GET(
  request: NextRequest
) {
  const transaction =
    request.nextUrl.searchParams.get(
      'transaction'
    )

  if (
    transaction &&
    !ALLOWED_TRANSACTIONS.has(
      transaction as PublicListingTransaction
    )
  ) {
    return NextResponse.json(
      {
        error:
          'Invalid transaction type'
      },
      {
        status: 400
      }
    )
  }

  try {
    const analyticalContext =
  await resolveMarketAnalyticalContext()

const paginated=request.nextUrl.searchParams.has('page')
let pageResult: {count:number;listings:any[]}|undefined
if(paginated){
 const page=Number(request.nextUrl.searchParams.get('page')),size=Number(request.nextUrl.searchParams.get('size'))
 let filters
 try{filters=JSON.parse(request.nextUrl.searchParams.get('filters')||'{}');validateMarketplacePage(page,size,filters)}catch{return NextResponse.json({error:'Invalid marketplace page'},{status:400})}
 if(!transaction)return NextResponse.json({error:'Transaction required'},{status:400})
 pageResult=await getPublicListingPage(transaction as PublicListingTransaction,filters,page,size,analyticalContext.fx.rate)
}
const listings=pageResult?.listings??await getPublicListings(transaction?transaction as PublicListingTransaction:undefined)

const projectedListings =
  projectPublicListingMonetaryValues(
    listings,
    analyticalContext
  )

    return NextResponse.json(
      {
        listings: projectedListings, ...(pageResult?{count:pageResult.count}:{})
      },
      {
        headers: {
          'Cache-Control':
            'no-store'
        }
      }
    )
  } catch (error) {
    console.error(
      'Public listings request failed',
      error
    )

    return NextResponse.json(
      {
        error:
          'Unable to load listings'
      },
      {
        status: 500
      }
    )
  }
}