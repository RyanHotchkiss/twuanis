import {
  getMatchingListings
} from '@/lib/statistics-engine'


/*
 * ---------------------------------------------------------
 * COMPARABLE COHORT ENGINE
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Resolve a defensible behavioral comparison cohort for
 * Market Behavior / Promotion Intelligence.
 *
 * This is NOT the Valuation Comparables Engine.
 *
 * Hard eligibility establishes market relevance.
 * Soft similarity ranks otherwise eligible peers.
 *
 * Promotion Intelligence can consume this cohort without
 * inventing its own listing-comparison rules.
 */


export type ComparableCohortQuality =
  | 'insufficient'
  | 'limited'
  | 'usable'
  | 'strong'


export type ComparableCohortDimension =
  | 'canton'
  | 'district'
  | 'bedrooms'
  | 'bathrooms'
  | 'propertyArea'
  | 'constructionArea'
  | 'price'


export type ComparableCohortListing = {
  id:
    string

  transactionType:
    string | null

  propertyType:
    string | null

  province:
    string | null

  canton:
    string | null

  district:
    string | null

  bedrooms:
    string | null

  bathrooms:
    string | null

  propertyArea:
  number | null

  constructionArea:
    number | null

  currency:
    string | null

  currentPrice:
    number | null

  monthlyPrice:
    number | null

  similarityScore:
    number

  matchedWeight:
    number

  availableWeight:
    number

  matchedDimensions:
    ComparableCohortDimension[]

  comparedDimensions:
    ComparableCohortDimension[]
}


export type ComparableCohortResult = {
  listingId:
    string

  resolvedAt:
    string

  target: {
    transactionType:
      string

    propertyType:
      string

    province:
      string
  }

  hardRequirements: {
    sameTransactionType:
      true

    samePropertyType:
      true

    sameProvince:
      true

    targetListingExcluded:
      true
  }

  eligibleCount:
    number

  selectedCount:
    number

  quality:
    ComparableCohortQuality

  minimumRecommendedSize:
    number

  listings:
    ComparableCohortListing[]

  notes:
    string[]
}


export type ComparableCohortFailure = {
  listingId:
    string

  resolvedAt:
    string

  status:
    'insufficient_cohort'

  reason:
    string
}


export type ComparableCohortResolution =
  | ComparableCohortResult
  | ComparableCohortFailure


type MarketListing = {
  id:
    string

  title?:
    string | null

  transaction_type?:
    string | null

  currency?:
    string | null

  price_millions?:
    number | string | null

  current_price?:
    number | string | null

  monthly_price?:
    number | string | null

  property_area?:
    number | null

  construction_area?:
    number | null

  province?:
    string | null

  canton?:
    string | null

  district?:
    string | null

  property_type?:
    string | null

  bedrooms?:
    string | null

  bathrooms?:
    string | null

  parking?:
    string | null

  created_at?:
    string | null
}


type SimilarityEvaluation = {
  matchedWeight:
    number

  availableWeight:
    number

  matchedDimensions:
    ComparableCohortDimension[]

  comparedDimensions:
    ComparableCohortDimension[]
}


/*
 * Soft-comparison weights.
 *
 * Hard requirements are intentionally excluded from this
 * score because a listing cannot enter the cohort without
 * satisfying them first.
 */

const DIMENSION_WEIGHTS = {
  canton:
    18,

  district:
    22,

  bedrooms:
    10,

  bathrooms:
    10,

  propertyArea:
    12,

  constructionArea:
    12,

  price:
    16
} as const


const MINIMUM_RECOMMENDED_COHORT_SIZE =
  5


const DEFAULT_COHORT_LIMIT =
  25


function normalizeText(
  value:
    unknown
): string {

  return String(
    value ??
    ''
  )
    .normalize(
      'NFD'
    )
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .toLowerCase()
    .trim()
    .replace(
      /\+/g,
      'plus'
    )
    .replace(
      /[^a-z0-9]+/g,
      '-'
    )
    .replace(
      /^-|-$/g,
      ''
    )
}


function sameText(
  first:
    unknown,

  second:
    unknown
): boolean {

  const normalizedFirst =
    normalizeText(
      first
    )


  const normalizedSecond =
    normalizeText(
      second
    )


  if (
    !normalizedFirst ||
    !normalizedSecond
  ) {

    return false
  }


  return (
    normalizedFirst ===
      normalizedSecond
  )
}


function normalizeTransactionType(
  value:
    unknown
):
  | 'sale'
  | 'rent'
  | null {

  const normalized =
    normalizeText(
      value
    )


  if (
    normalized ===
      'sale' ||
    normalized ===
      'buy'
  ) {

    return 'sale'
  }


  if (
    normalized ===
      'rent' ||
    normalized ===
      'lease'
  ) {

    return 'rent'
  }


  return null
}


function parseNumericValue(
  value:
    unknown
): number | null {

  if (
    value ===
      null ||
    value ===
      undefined
  ) {

    return null
  }


  if (
    typeof value ===
      'number'
  ) {

    return Number.isFinite(
      value
    )
      ? value
      : null
  }


  const cleaned =
    String(
      value
    )
      .replace(
        /,/g,
        ''
      )
      .match(
        /\d+(?:\.\d+)?/
      )


  if (
    !cleaned
  ) {

    return null
  }


  const parsed =
    Number(
      cleaned[0]
    )


  return Number.isFinite(
    parsed
  )
    ? parsed
    : null
}


function relativeDifference(
  first:
    number,

  second:
    number
): number {

  const denominator =
    Math.max(
      Math.abs(
        first
      ),

      Math.abs(
        second
      )
    )


  if (
    denominator ===
      0
  ) {

    return 0
  }


  return (
    Math.abs(
      first -
      second
    ) /
    denominator
  )
}


function valuesAreSimilar({
  first,
  second,
  maximumRelativeDifference
}: {
  first:
    number | null

  second:
    number | null

  maximumRelativeDifference:
    number
}): boolean {

  if (
    first ===
      null ||
    second ===
      null
  ) {

    return false
  }


  return (
    relativeDifference(
      first,
      second
    ) <=
      maximumRelativeDifference
  )
}


function resolveComparablePrice(
  listing:
    MarketListing
): {
  value:
    number | null

  currency:
    string | null
} {

  const transaction =
    normalizeTransactionType(
      listing.transaction_type
    )


  if (
    transaction ===
      'rent'
  ) {

    return {
      value:
        parseNumericValue(
          listing.monthly_price
        ),

      currency:
        listing.currency ??
        'CRC'
    }
  }


  /*
   * Prefer canonical current_price.
   *
   * price_millions is only used as a fallback because
   * historical listing inventory may still expose it.
   */

  const currentPrice =
    parseNumericValue(
      listing.current_price
    )


  if (
    currentPrice !==
      null &&
    currentPrice >
      1
  ) {

    return {
      value:
        currentPrice,

      currency:
        listing.currency ??
        null
    }
  }


  const priceMillions =
    parseNumericValue(
      listing.price_millions
    )


  if (
    priceMillions ===
      null
  ) {

    return {
      value:
        null,

      currency:
        listing.currency ??
        null
    }
  }


  return {
    value:
      priceMillions *
      1_000_000,

    currency:
      listing.currency ??
      null
  }
}


function canComparePrice(
  target:
    MarketListing,

  candidate:
    MarketListing
): boolean {

  const targetPrice =
    resolveComparablePrice(
      target
    )


  const candidatePrice =
    resolveComparablePrice(
      candidate
    )


  if (
    targetPrice.value ===
      null ||
    candidatePrice.value ===
      null
  ) {

    return false
  }


  /*
   * Do not invent exchange-rate normalization here.
   *
   * Different currencies mean the price dimension is
   * unavailable unless a canonical currency resolver is
   * introduced elsewhere.
   */

  if (
    targetPrice.currency &&
    candidatePrice.currency &&
    normalizeText(
      targetPrice.currency
    ) !==
      normalizeText(
        candidatePrice.currency
      )
  ) {

    return false
  }


  return true
}


function evaluateSimilarity({
  target,
  candidate
}: {
  target:
    MarketListing

  candidate:
    MarketListing
}): SimilarityEvaluation {

  let matchedWeight =
    0


  let availableWeight =
    0


  const matchedDimensions:
    ComparableCohortDimension[] =
      []


  const comparedDimensions:
    ComparableCohortDimension[] =
      []


  function evaluateTextDimension({
    dimension,
    targetValue,
    candidateValue,
    weight
  }: {
    dimension:
      ComparableCohortDimension

    targetValue:
      unknown

    candidateValue:
      unknown

    weight:
      number
  }) {

    if (
      !normalizeText(
        targetValue
      ) ||
      !normalizeText(
        candidateValue
      )
    ) {

      return
    }


    availableWeight +=
      weight


    comparedDimensions.push(
      dimension
    )


    if (
      sameText(
        targetValue,
        candidateValue
      )
    ) {

      matchedWeight +=
        weight


      matchedDimensions.push(
        dimension
      )
    }
  }


  function evaluateNumericDimension({
    dimension,
    targetValue,
    candidateValue,
    weight,
    maximumRelativeDifference
  }: {
    dimension:
      ComparableCohortDimension

    targetValue:
      number | null

    candidateValue:
      number | null

    weight:
      number

    maximumRelativeDifference:
      number
  }) {

    if (
      targetValue ===
        null ||
      candidateValue ===
        null
    ) {

      return
    }


    availableWeight +=
      weight


    comparedDimensions.push(
      dimension
    )


    if (
      valuesAreSimilar({
        first:
          targetValue,

        second:
          candidateValue,

        maximumRelativeDifference
      })
    ) {

      matchedWeight +=
        weight


      matchedDimensions.push(
        dimension
      )
    }
  }


  evaluateTextDimension({
    dimension:
      'canton',

    targetValue:
      target.canton,

    candidateValue:
      candidate.canton,

    weight:
      DIMENSION_WEIGHTS
        .canton
  })


  evaluateTextDimension({
    dimension:
      'district',

    targetValue:
      target.district,

    candidateValue:
      candidate.district,

    weight:
      DIMENSION_WEIGHTS
        .district
  })


  evaluateNumericDimension({
    dimension:
      'bedrooms',

    targetValue:
      parseNumericValue(
        target.bedrooms
      ),

    candidateValue:
      parseNumericValue(
        candidate.bedrooms
      ),

    weight:
      DIMENSION_WEIGHTS
        .bedrooms,

    /*
     * Bedroom counts are effectively discrete.
     *
     * 25% allows nearby configurations while preserving
     * meaningful similarity.
     */
    maximumRelativeDifference:
      0.25
  })


  evaluateNumericDimension({
    dimension:
      'bathrooms',

    targetValue:
      parseNumericValue(
        target.bathrooms
      ),

    candidateValue:
      parseNumericValue(
        candidate.bathrooms
      ),

    weight:
      DIMENSION_WEIGHTS
        .bathrooms,

    maximumRelativeDifference:
      0.25
  })


  evaluateNumericDimension({
    dimension:
      'propertyArea',

    targetValue:
      target.property_area ??
      null,

    candidateValue:
      candidate.property_area ??
      null,

    weight:
      DIMENSION_WEIGHTS
        .propertyArea,

    maximumRelativeDifference:
      0.30
  })


  evaluateNumericDimension({
    dimension:
      'constructionArea',

    targetValue:
      target.construction_area ??
      null,

    candidateValue:
      candidate.construction_area ??
      null,

    weight:
      DIMENSION_WEIGHTS
        .constructionArea,

    maximumRelativeDifference:
      0.30
  })


  if (
    canComparePrice(
      target,
      candidate
    )
  ) {

    const targetPrice =
      resolveComparablePrice(
        target
      )


    const candidatePrice =
      resolveComparablePrice(
        candidate
      )


    evaluateNumericDimension({
      dimension:
        'price',

      targetValue:
        targetPrice.value,

      candidateValue:
        candidatePrice.value,

      weight:
        DIMENSION_WEIGHTS
          .price,

      /*
       * Behavioral cohorts should tolerate reasonable
       * market-price dispersion without comparing listings
       * from completely different price strata.
       */
      maximumRelativeDifference:
        0.30
    })
  }


  return {
    matchedWeight,

    availableWeight,

    matchedDimensions,

    comparedDimensions
  }
}


function resolveSimilarityScore({
  matchedWeight,
  availableWeight
}: {
  matchedWeight:
    number

  availableWeight:
    number
}): number {

  if (
    availableWeight <=
      0
  ) {

    return 0
  }


  return Math.round(
    (
      matchedWeight /
      availableWeight
    ) *
    100
  )
}


function resolveCohortQuality(
  size:
    number
): ComparableCohortQuality {

  if (
    size <
      3
  ) {

    return 'insufficient'
  }


  if (
    size <
      5
  ) {

    return 'limited'
  }


  if (
    size <
      10
  ) {

    return 'usable'
  }


  return 'strong'
}


function satisfiesHardRequirements({
  target,
  candidate
}: {
  target:
    MarketListing

  candidate:
    MarketListing
}): boolean {

  if (
    candidate.id ===
      target.id
  ) {

    return false
  }


  const targetTransaction =
    normalizeTransactionType(
      target.transaction_type
    )


  const candidateTransaction =
    normalizeTransactionType(
      candidate.transaction_type
    )


  if (
    !targetTransaction ||
    !candidateTransaction ||
    targetTransaction !==
      candidateTransaction
  ) {

    return false
  }


  if (
    !sameText(
      target.property_type,
      candidate.property_type
    )
  ) {

    return false
  }


  if (
    !sameText(
      target.province,
      candidate.province
    )
  ) {

    return false
  }


  return true
}


function normalizeCohortListing({
  listing,
  similarity
}: {
  listing:
    MarketListing

  similarity:
    SimilarityEvaluation
}): ComparableCohortListing {

  const price =
    resolveComparablePrice(
      listing
    )


  return {
    id:
      listing.id,

    transactionType:
      normalizeTransactionType(
        listing.transaction_type
      ),

    propertyType:
      listing.property_type ??
      null,

    province:
      listing.province ??
      null,

    canton:
      listing.canton ??
      null,

    district:
      listing.district ??
      null,

    bedrooms:
      listing.bedrooms ??
      null,

    bathrooms:
      listing.bathrooms ??
      null,

    propertyArea:
      listing.property_area ??
      null,

    constructionArea:
      listing.construction_area ??
      null,

    currency:
      price.currency,

    currentPrice:
      price.value,

    monthlyPrice:
      parseNumericValue(
        listing.monthly_price
      ),

    similarityScore:
      resolveSimilarityScore(
        similarity
      ),

    matchedWeight:
      similarity
        .matchedWeight,

    availableWeight:
      similarity
        .availableWeight,

    matchedDimensions:
      similarity
        .matchedDimensions,

    comparedDimensions:
      similarity
        .comparedDimensions
  }
}


export class ComparableCohortError
  extends Error {

  code:
    | 'LISTING_ID_REQUIRED'
    | 'MARKET_INVENTORY_LOAD_FAILED'
    | 'TARGET_LISTING_NOT_FOUND'
    | 'TARGET_LISTING_INVALID'

  constructor(
    code:
      ComparableCohortError['code'],

    message:
      string
  ) {

    super(
      message
    )


    this.name =
      'ComparableCohortError'


    this.code =
      code
  }
}


export async function resolveComparableCohort({
  listingId,
  limit =
    DEFAULT_COHORT_LIMIT
}: {
  listingId:
    string

  limit?:
    number
}): Promise<
  ComparableCohortResolution
> {

  if (
    !listingId ||
    !listingId.trim()
  ) {

    throw new ComparableCohortError(
      'LISTING_ID_REQUIRED',
      'A listing ID is required to resolve a comparable cohort.'
    )
  }


  let inventory:
    MarketListing[]


  try {

    /*
     * Canonical active marketplace inventory.
     *
     * getMatchingListings() already owns listing-status
     * eligibility and transaction normalization.
     */

    inventory =
      (
        await getMatchingListings(
          {}
        )
      ) as MarketListing[]

  } catch (
    error
  ) {

    throw new ComparableCohortError(
      'MARKET_INVENTORY_LOAD_FAILED',

      error instanceof Error
        ? error.message
        : 'Canonical market inventory could not be loaded.'
    )
  }


  const target =
    inventory.find(
      listing =>
        listing.id ===
          listingId
    )


  if (
    !target
  ) {

    throw new ComparableCohortError(
      'TARGET_LISTING_NOT_FOUND',
      'The selected listing is not present in canonical active marketplace inventory.'
    )
  }


  const targetTransaction =
    normalizeTransactionType(
      target.transaction_type
    )


  const targetPropertyType =
    normalizeText(
      target.property_type
    )


  const targetProvince =
    normalizeText(
      target.province
    )


  if (
    !targetTransaction ||
    !targetPropertyType ||
    !targetProvince
  ) {

    throw new ComparableCohortError(
      'TARGET_LISTING_INVALID',
      'The selected listing does not contain the transaction type, property type, and province required for behavioral cohort resolution.'
    )
  }


  const eligible =
    inventory.filter(
      candidate =>
        satisfiesHardRequirements({
          target,
          candidate
        })
    )


  if (
    eligible.length ===
      0
  ) {

    return {
      listingId,

      resolvedAt:
        new Date()
          .toISOString(),

      status:
        'insufficient_cohort',

      reason:
        'No other active listings satisfy the canonical transaction-type, property-type, and province cohort requirements.'
    }
  }


  const scored =
    eligible
      .map(
        candidate => {

          const similarity =
            evaluateSimilarity({
              target,
              candidate
            })


          return normalizeCohortListing({
            listing:
              candidate,

            similarity
          })
        }
      )
      .sort(
        (
          first,
          second
        ) => {

          /*
           * Deterministic ranking:
           *
           * 1. similarity
           * 2. number of dimensions actually comparable
           * 3. stable listing ID
           */

          if (
            second.similarityScore !==
              first.similarityScore
          ) {

            return (
              second.similarityScore -
              first.similarityScore
            )
          }


          if (
            second.availableWeight !==
              first.availableWeight
          ) {

            return (
              second.availableWeight -
              first.availableWeight
            )
          }


          return first.id.localeCompare(
            second.id
          )
        }
      )


  const safeLimit =
    Number.isFinite(
      limit
    )
      ? Math.max(
          1,
          Math.floor(
            limit
          )
        )
      : DEFAULT_COHORT_LIMIT


  const listings =
    scored.slice(
      0,
      safeLimit
    )


  const quality =
    resolveCohortQuality(
      listings.length
    )


  const notes = [
    'Behavioral cohort eligibility requires the same transaction family, property type, and province as the target listing.',
    'The promoted listing itself is always excluded from its comparable cohort.',
    'Canton, district, rooms, areas, and price strengthen similarity when comparable evidence exists.',
    'Missing optional dimensions do not fabricate mismatches; they are excluded from that listing pair’s similarity denominator.',
    'Price similarity is evaluated only when comparable price evidence exists in the same currency.',
    'This engine resolves market peers only. It does not claim that cohort behavior explains or causes the promoted listing’s behavior.'
  ]


  if (
    quality ===
      'insufficient'
  ) {

    notes.push(
      'The structural cohort contains fewer than three listings and should not support market-behavior conclusions.'
    )
  }


  if (
    quality ===
      'limited'
  ) {

    notes.push(
      'The structural cohort is small. Promotion Intelligence should preserve reduced confidence.'
    )
  }


  return {
    listingId,

    resolvedAt:
      new Date()
        .toISOString(),

    target: {
      transactionType:
        targetTransaction,

      propertyType:
        target.property_type as string,

      province:
        target.province as string
    },

    hardRequirements: {
      sameTransactionType:
        true,

      samePropertyType:
        true,

      sameProvince:
        true,

      targetListingExcluded:
        true
    },

    eligibleCount:
      eligible.length,

    selectedCount:
      listings.length,

    quality,

    minimumRecommendedSize:
      MINIMUM_RECOMMENDED_COHORT_SIZE,

    listings,

    notes
  }
}