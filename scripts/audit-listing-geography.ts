import dotenv from 'dotenv'
import WebSocket from 'ws'

import {
  resolveCanonicalGeography,
  type CanonicalGeographyTerm
} from '../lib/geography/canonical-geography'

;(globalThis as any).WebSocket =
WebSocket

dotenv.config({
  path: '.env.local'
})

type AuditStatus =
  | 'UNCHANGED'
  | 'CANONICALIZABLE'
  | 'INCOMPLETE'
  | 'UNRECOGNIZED'
  | 'HIERARCHY_CONFLICT'
  | 'AMBIGUOUS'


function resolveAuditStatus({
  current,
  canonical,
  reasons
}: {
  current: {
    province:
      string | null

    canton:
      string | null

    district:
      string | null
  }

  canonical: {
    province:
      string | null

    canton:
      string | null

    district:
      string | null
  }

  reasons: {
    province:
      string

    canton:
      string

    district:
      string
  }
}): AuditStatus {

  const reasonValues =
    Object.values(
      reasons
    )


  if (
    reasonValues.includes(
      'hierarchy_conflict'
    )
  ) {
    return 'HIERARCHY_CONFLICT'
  }


  if (
    reasonValues.includes(
      'ambiguous'
    )
  ) {
    return 'AMBIGUOUS'
  }


  if (
    reasonValues.includes(
      'unrecognized'
    )
  ) {
    return 'UNRECOGNIZED'
  }


  const hasMissing =
    reasonValues.includes(
      'missing'
    )


  const changed =
    current.province !==
      canonical.province ||
    current.canton !==
      canonical.canton ||
    current.district !==
      canonical.district


  if (
    !changed &&
    !hasMissing
  ) {
    return 'UNCHANGED'
  }


  if (
    changed
  ) {
    return 'CANONICALIZABLE'
  }


  return 'INCOMPLETE'
}


async function main() {

  const {
    supabase
    } =
    await import(
        '../lib/supabase'
    )

  const {
    data:
      geographyTerms,

    error:
      geographyError
  } =
    await supabase
      .from(
        'ontology_terms'
      )
      .select(`
        id,
        parent_id,
        term_type,
        term_name,
        term_name_en,
        term_name_es,
        slug,
        slug_en,
        slug_es,
        official_code
      `)
      .in(
        'term_type',
        [
          'province',
          'canton',
          'district'
        ]
      )


  if (geographyError) {
    throw geographyError
  }


  const terms =
    (
      geographyTerms ??
      []
    ) as CanonicalGeographyTerm[]


  const {
    data:
      listings,

    error:
      listingError
  } =
    await supabase
      .from(
        'listings'
      )
      .select(`
        id,
        title,
        listing_origin,
        listing_source_type,
        transaction_type,
        listing_status,
        source_url,
        province,
        canton,
        district
      `)
      .order(
        'created_at',
        {
          ascending:
            true
        }
      )


  if (listingError) {
    throw listingError
  }


  const counts =
    new Map<
      AuditStatus,
      number
    >()

  let keepCount = 0
  let deleteCount = 0

  for (
    const listing
    of listings ?? []
  ) {

    const resolution =
      resolveCanonicalGeography({
        province:
          listing.province,

        canton:
          listing.canton,

        district:
          listing.district,

        terms
      })


    const canonical = {
      province:
        resolution
          .province
          ?.term_name ??
        null,

      canton:
        resolution
          .canton
          ?.term_name ??
        null,

      district:
        resolution
          .district
          ?.term_name ??
        null
    }


    const current = {
      province:
        listing.province,

      canton:
        listing.canton,

      district:
        listing.district
    }


    const status =
      resolveAuditStatus({
        current,
        canonical,
        reasons:
          resolution.reasons
      })

      const disposition =
        resolution.complete
          ? 'KEEP'
          : 'DELETE'

      if (
        disposition === 'KEEP'
      ) {
        keepCount += 1
      } else {
        deleteCount += 1
      }

    counts.set(
      status,
      (
        counts.get(
          status
        ) ??
        0
      ) + 1
    )


    console.log(
      '\n----------------------------------------'
    )

    console.log(
      status,
      listing.id
    )

    console.log(
      listing.title
    )

    console.log(
      'DISPOSITION:',
      disposition
    )

    console.log(
      'ORIGIN:',
      listing.listing_origin
    )

    console.log(
      'SOURCE TYPE:',
      listing.listing_source_type
    )

    console.log(
      'TRANSACTION:',
      listing.transaction_type
    )

    console.log(
      'LISTING STATUS:',
      listing.listing_status
    )

    console.log(
      'SOURCE URL:',
      listing.source_url
    )


    console.log(
      'CURRENT:',
      current
    )


    console.log(
      'CANONICAL:',
      canonical
    )


    console.log(
      'REASONS:',
      resolution.reasons
    )

    console.log(
      'COMPLETE:',
      resolution.complete
    )

  }

  console.log(
    '\n========================================'
  )

  console.log(
    'GEOGRAPHY AUDIT SUMMARY'
  )

  console.log(
    '========================================'
  )


  for (
    const status
    of [
      'UNCHANGED',
      'CANONICALIZABLE',
      'INCOMPLETE',
      'UNRECOGNIZED',
      'HIERARCHY_CONFLICT',
      'AMBIGUOUS'
    ] as AuditStatus[]
  ) {

    console.log(
      `${status}: ${
        counts.get(
          status
        ) ??
        0
      }`
    )
  }

  console.log(
      `KEEP: ${keepCount}`
    )

    console.log(
      `DELETE: ${deleteCount}`
    )

  console.log(
    `TOTAL: ${
      listings?.length ??
      0
    }`
  )
}


main().catch(
  error => {

    console.error(
      error
    )

    process.exit(1)
  }
)