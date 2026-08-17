/*
 * ---------------------------------------------------------
 * PRICE / M² ANALYTICAL IDENTITY
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Establish the canonical analytical identity of a listing
 * before Price / m² calculations occur.
 *
 * This layer answers:
 *
 * - Is this Sale or Rent?
 * - Is this Vacant Land or Improved Property?
 * - Which normalization bases are analytically valid?
 * - What exact land and construction areas are known?
 * - What is the site's construction coverage?
 * - What geography does the listing belong to?
 * - What currency was the listing originally expressed in?
 *
 * This layer DOES NOT:
 *
 * - calculate Price / m²
 * - normalize prices between currencies
 * - calculate market statistics
 * - resolve comparable cohorts
 * - calculate confidence
 */


export type PriceMeterTransactionType =
  | 'sale'
  | 'rent'


export type PriceMeterPropertyBasis =
  | 'land_only'
  | 'improved_property'
  | 'unknown'


export type PriceMeterNormalizationBasis =
  | 'land'
  | 'construction'


export type PriceMeterOriginalCurrency =
  | 'CRC'
  | 'USD'


export type PriceMeterAnalyticalCurrency =
  'CRC'


export type PriceMeterAreaKind =
  | 'exact'
  | 'missing'
  | 'invalid'


export type PriceMeterAreaIdentity = {
  raw:
    number | null

  kind:
    PriceMeterAreaKind

  exactM2:
    number | null

  minimumM2:
    number | null

  maximumM2:
    number | null

  unit:
    'm2'

  analyticallyUsable:
    boolean
}

export type PriceMeterPriceIdentity = {
  originalAmount:
    number | null

  originalCurrency:
    PriceMeterOriginalCurrency | null

  analyticalAmount:
    number | null

  analyticalCurrency:
    PriceMeterAnalyticalCurrency

  conversionRate:
    number | null

  fx:
  PriceMeterFxIdentity | null

  analyticallyUsable:
    boolean
}

export type PriceMeterPriceIntegrityStatus =
  | 'valid'
  | 'invalid'


export type PriceMeterPriceIntegrityReason =
  | 'transaction_type_unresolved'
  | 'transaction_price_missing_or_invalid'
  | 'currency_unresolved'
  | 'analytical_price_unusable'


export type PriceMeterPriceIntegrity = {
  status:
    PriceMeterPriceIntegrityStatus

  analyticallyAdmissible:
    boolean

  reasons:
    PriceMeterPriceIntegrityReason[]
}

export type PriceMeterIdentityListing = {
  transaction_type?:
    string | null

  property_type?:
    string | null

  province?:
    string | null

  canton?:
    string | null

  district?:
    string | null

  property_area?:
  number | null

  construction_area?:
    number | null

    currency?:
    string | null

  current_price?:
    number | string | null

  monthly_price?:
    number | string | null
}


export type PriceMeterAnalyticalIdentity = {
  transactionType:
    PriceMeterTransactionType | null

  propertyBasis:
    PriceMeterPropertyBasis

  availableNormalizationBases:
    PriceMeterNormalizationBasis[]

  geography: {
    province:
      string | null

    canton:
      string | null

    district:
      string | null
      
  }

    propertyArea:
    PriceMeterAreaIdentity

    constructionArea:
        PriceMeterAreaIdentity

    propertyAreaM2:
        number | null

    constructionAreaM2:
        number | null

    siteCoverage:
        number | null

  originalCurrency:
    PriceMeterOriginalCurrency | null

  analyticalCurrency:
    PriceMeterAnalyticalCurrency

  price:
  PriceMeterPriceIdentity

  priceIntegrity:
    PriceMeterPriceIntegrity

  eligibility: {
    eligible:
      boolean

    exclusionReason:
      string | null
  }
}

export type PriceMeterFxResolutionMode =
  | 'exact'
  | 'latest_applicable_prior_observation'


export type PriceMeterFxIdentity =
  | {
      conversionApplied:
        false

      analyticalDate:
        string

      baseCurrency:
        'CRC'

      quoteCurrency:
        'CRC'

      rate:
        1

      rateType:
        'native'

      effectiveDate:
        string

      source:
        'native_crc'

      resolutionMode:
        'exact'
    }

  | {
      conversionApplied:
        true

      analyticalDate:
        string

      baseCurrency:
        'USD'

      quoteCurrency:
        'CRC'

      rate:
        number

      rateType:
        'reference_sale'

      effectiveDate:
        string

      source:
        'BCCR'

      resolutionMode:
        PriceMeterFxResolutionMode
    }

/*
 * ---------------------------------------------------------
 * NORMALIZATION
 * ---------------------------------------------------------
 */


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


export function normalizePriceMeterTransactionType(
  value:
    unknown
):
  PriceMeterTransactionType | null {

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


export function normalizePriceMeterCurrency(
  value:
    unknown
):
  PriceMeterOriginalCurrency | null {

  const normalized =
    normalizeText(
      value
    )


  if (
    normalized ===
      'crc'
  ) {

    return 'CRC'
  }


  if (
    normalized ===
      'usd'
  ) {

    return 'USD'
  }


  return null
}

/*
 * ---------------------------------------------------------
 * PRICE IDENTITY
 * ---------------------------------------------------------
 *
 * Original price preserves source/listing truth.
 *
 * Analytical price is the normalized value used for
 * mathematical comparison.
 *
 * These identities MUST remain separate.
 */

function parsePriceMeterPrice(
  value:
    unknown
): number | null {

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {

    return null
  }


  const parsed =
    typeof value === 'number'
      ? value
      : Number(
          String(value)
            .replace(/,/g, '')
            .trim()
        )


  if (
    !Number.isFinite(parsed) ||
    parsed <= 0
  ) {

    return null
  }


  return parsed
}


export function resolvePriceMeterPriceIdentity({
  transactionType,
  currency,
  currentPrice,
  monthlyPrice,
  analyticalDate,
  fxIdentity
}: {
  transactionType:
    PriceMeterTransactionType | null

  currency:
    PriceMeterOriginalCurrency | null

  currentPrice:
    unknown

  monthlyPrice:
    unknown

  analyticalDate:
    string

  fxIdentity:
    PriceMeterFxIdentity | null
}): PriceMeterPriceIdentity {

  const originalAmount =
    transactionType === 'rent'
      ? parsePriceMeterPrice(
          monthlyPrice
        )
      : transactionType === 'sale'
        ? parsePriceMeterPrice(
            currentPrice
          )
        : null


  if (
    originalAmount === null ||
    currency === null
  ) {

    return {
      originalAmount,

      originalCurrency:
        currency,

      analyticalAmount:
        null,

      analyticalCurrency:
        'CRC',

      conversionRate:
        null,

      fx:
        null,

      analyticallyUsable:
        false
    }
  }


  if (
    currency === 'CRC'
  ) {

    const nativeFxIdentity:
      PriceMeterFxIdentity = {
        conversionApplied:
          false,

        analyticalDate,

        baseCurrency:
          'CRC',

        quoteCurrency:
          'CRC',

        rate:
          1,

        rateType:
          'native',

        effectiveDate:
          analyticalDate,

        source:
          'native_crc',

        resolutionMode:
          'exact'
      }


    return {
      originalAmount,

      originalCurrency:
        'CRC',

      analyticalAmount:
        originalAmount,

      analyticalCurrency:
        'CRC',

      conversionRate:
        1,

      fx:
        nativeFxIdentity,

      analyticallyUsable:
        true
    }
  }


  if (
    !fxIdentity ||
    fxIdentity.conversionApplied !==
      true ||
    fxIdentity.baseCurrency !==
      'USD' ||
    fxIdentity.quoteCurrency !==
      'CRC' ||
    fxIdentity.source !==
      'BCCR' ||
    fxIdentity.rateType !==
      'reference_sale' ||
    !Number.isFinite(
      fxIdentity.rate
    ) ||
    fxIdentity.rate <=
      0
  ) {

    return {
      originalAmount,

      originalCurrency:
        'USD',

      analyticalAmount:
        null,

      analyticalCurrency:
        'CRC',

      conversionRate:
        null,

      fx:
        null,

      analyticallyUsable:
        false
    }
  }


  return {
    originalAmount,

    originalCurrency:
      'USD',

    analyticalAmount:
      originalAmount *
        fxIdentity.rate,

    analyticalCurrency:
      'CRC',

    conversionRate:
      fxIdentity.rate,

    fx:
      fxIdentity,

    analyticallyUsable:
      true
  }
}

/*
 * ---------------------------------------------------------
 * PRICE INTEGRITY
 * ---------------------------------------------------------
 *
 * Price Integrity determines whether the resolved price
 * identity is internally coherent enough to participate
 * in Price / m² analysis.
 *
 * This layer does NOT determine whether a price is unusual.
 * Statistical anomaly detection belongs downstream.
 *
 * Price Integrity fails closed.
 */


export function resolvePriceMeterPriceIntegrity({
  transactionType,
  price
}: {
  transactionType:
    PriceMeterTransactionType | null

  price:
    PriceMeterPriceIdentity
}): PriceMeterPriceIntegrity {

  const reasons:
    PriceMeterPriceIntegrityReason[] =
      []


  if (
    transactionType ===
      null
  ) {

    reasons.push(
      'transaction_type_unresolved'
    )
  }


  if (
    price.originalAmount ===
      null
  ) {

    reasons.push(
      'transaction_price_missing_or_invalid'
    )
  }


  if (
    price.originalCurrency ===
      null
  ) {

    reasons.push(
      'currency_unresolved'
    )
  }


  if (
    !price.analyticallyUsable ||
    price.analyticalAmount ===
      null
  ) {

    reasons.push(
      'analytical_price_unusable'
    )
  }


  return {
    status:
      reasons.length === 0
        ? 'valid'
        : 'invalid',

    analyticallyAdmissible:
      reasons.length === 0,

    reasons
  }
}

/*
 * ---------------------------------------------------------
 * AREA IDENTITY
 * ---------------------------------------------------------
 *
 * Canonical listing measurements are stored as exact
 * numeric square-meter observations.
 *
 * Price / m² NEVER derives an exact denominator from:
 *
 * - ranges
 * - thresholds
 * - formatted measurement strings
 * - estimated midpoint values
 *
 * Ranges belong downstream as derived classifications
 * for filtering, cohorts, presentation, and analysis.
 */


function emptyAreaIdentity({
  raw,
  kind
}: {
  raw:
    number | null

  kind:
    'missing' | 'invalid'
}): PriceMeterAreaIdentity {

  return {
    raw,

    kind,

    exactM2:
      null,

    minimumM2:
      null,

    maximumM2:
      null,

    unit:
      'm2',

    analyticallyUsable:
      false
  }
}


export function resolvePriceMeterAreaIdentity(
  value:
    number | null | undefined
): PriceMeterAreaIdentity {

  if (
    value === null ||
    value === undefined
  ) {

    return emptyAreaIdentity({
      raw:
        null,

      kind:
        'missing'
    })
  }


  if (
    !Number.isFinite(
      value
    ) ||
    value <= 0
  ) {

    return emptyAreaIdentity({
      raw:
        value,

      kind:
        'invalid'
    })
  }


  return {
    raw:
      value,

    kind:
      'exact',

    exactM2:
      value,

    minimumM2:
      value,

    maximumM2:
      value,

    unit:
      'm2',

    analyticallyUsable:
      true
  }
}


export function parsePriceMeterArea(
  value:
    number | null | undefined
): number | null {

  return resolvePriceMeterAreaIdentity(
    value
  ).exactM2
}

/*
 * ---------------------------------------------------------
 * PROPERTY BASIS
 * ---------------------------------------------------------
 *
 * Important:
 *
 * Missing construction area NEVER means Land Only.
 *
 * Land Only requires affirmative semantic evidence from
 * the property's canonical type.
 *
 * Improved Property requires both:
 *
 * 1. a property type that represents an improved property
 * 2. positive construction-area evidence
 *
 * Anything ambiguous fails to "unknown".
 */


const LAND_ONLY_PROPERTY_TYPES =
  new Set<string>([
    'land'
  ])


const IMPROVED_PROPERTY_TYPES =
  new Set<string>([
    'condo',
    'house',
    'commercial-property',
    'farm'
  ])


export function resolvePriceMeterPropertyBasis({
  propertyType,
  constructionArea
}: {
  propertyType:
    unknown

  constructionArea:
    PriceMeterAreaIdentity
}): PriceMeterPropertyBasis {

  const normalizedPropertyType =
    normalizeText(
      propertyType
    )


  const hasConstructionEvidence =
  constructionArea.kind ===
    'exact'


  /*
   * Land Only requires affirmative Land semantics
   * and no affirmative construction evidence.
   *
   * A construction range or threshold still proves
   * that construction exists, even though it cannot
   * supply an exact normalization denominator.
   */

  if (
    LAND_ONLY_PROPERTY_TYPES.has(
      normalizedPropertyType
    )
  ) {

    return hasConstructionEvidence
      ? 'unknown'
      : 'land_only'
  }


  /*
   * Improved Property requires affirmative
   * improved-property semantics plus affirmative
   * construction evidence.
   *
   * Exact construction area is NOT required merely
   * to classify Property Basis.
   */

  if (
    IMPROVED_PROPERTY_TYPES.has(
      normalizedPropertyType
    ) &&
    hasConstructionEvidence
  ) {

    return 'improved_property'
  }


  return 'unknown'
}

/*
 * ---------------------------------------------------------
 * NORMALIZATION ELIGIBILITY
 * ---------------------------------------------------------
 */


function resolveAvailableNormalizationBases({
  propertyBasis,
  propertyAreaM2,
  constructionAreaM2
}: {
  propertyBasis:
    PriceMeterPropertyBasis

  propertyAreaM2:
    number | null

  constructionAreaM2:
    number | null
}): PriceMeterNormalizationBasis[] {

  const bases:
    PriceMeterNormalizationBasis[] =
      []


  if (
    propertyAreaM2 !==
      null
  ) {

    bases.push(
      'land'
    )
  }


  if (
    propertyBasis ===
      'improved_property' &&
    constructionAreaM2 !==
      null
  ) {

    bases.push(
      'construction'
    )
  }


  return bases
}


/*
 * ---------------------------------------------------------
 * SITE COVERAGE
 * ---------------------------------------------------------
 */


export function calculatePriceMeterSiteCoverage({
  propertyAreaM2,
  constructionAreaM2
}: {
  propertyAreaM2:
    number | null

  constructionAreaM2:
    number | null
}): number | null {

  /*
   * IMPORTANT:
   *
   * construction_area currently represents total built
   * floor area, not confirmed building-footprint area.
   *
   * property_area is also not yet guaranteed to represent
   * parcel/site area for every property type.
   *
   * Therefore:
   *
   * construction_area / property_area
   *
   * MUST NOT be labeled Site Coverage.
   *
   * Site Coverage requires actual building-footprint area
   * divided by actual parcel/site area.
   *
   * Until those canonical facts exist, fail closed.
   */

  void propertyAreaM2
  void constructionAreaM2

  return null
}


/*
 * ---------------------------------------------------------
 * ELIGIBILITY
 * ---------------------------------------------------------
 */

function resolveEligibility({
  transactionType,
  propertyBasis,
  availableNormalizationBases,
  priceIntegrity
}: {
  transactionType:
    PriceMeterTransactionType | null

  propertyBasis:
    PriceMeterPropertyBasis

  availableNormalizationBases:
    PriceMeterNormalizationBasis[]

  priceIntegrity:
    PriceMeterPriceIntegrity
}): PriceMeterAnalyticalIdentity['eligibility'] {

  if (
    transactionType ===
      null
  ) {

    return {
      eligible:
        false,

      exclusionReason:
        'Transaction type could not be resolved as Sale or Rent.'
    }
  }


  if (
    propertyBasis ===
      'unknown'
  ) {

    return {
      eligible:
        false,

      exclusionReason:
        'Property basis could not be safely classified as Land Only or Improved Property.'
    }
  }


  if (
    availableNormalizationBases.length ===
      0
  ) {

    return {
      eligible:
        false,

      exclusionReason:
        'No valid area is available for Price / m² normalization.'
    }
  }

  if (
  !priceIntegrity
    .analyticallyAdmissible
) {

  return {
    eligible:
      false,

    exclusionReason:
      `Price integrity failed: ${
        priceIntegrity.reasons.join(
          ', '
        )
      }.`
  }
}

  return {
    eligible:
      true,

    exclusionReason:
      null
  }
}


/*
 * ---------------------------------------------------------
 * CANONICAL IDENTITY RESOLVER
 * ---------------------------------------------------------
 */


export function resolvePriceMeterAnalyticalIdentity(
  listing:
    PriceMeterIdentityListing,

  context: {
    analyticalDate:
      string

    fxIdentity:
      PriceMeterFxIdentity | null
  }
): PriceMeterAnalyticalIdentity {

  const transactionType =
    normalizePriceMeterTransactionType(
      listing.transaction_type
    )


    const propertyArea =
    resolvePriceMeterAreaIdentity(
      listing.property_area
    )


  const constructionArea =
    resolvePriceMeterAreaIdentity(
      listing.construction_area
    )


  const propertyAreaM2 =
    propertyArea.exactM2


  const constructionAreaM2 =
    constructionArea.exactM2


  const propertyBasis =
  resolvePriceMeterPropertyBasis({
    propertyType:
      listing.property_type,

    constructionArea
  })


  const availableNormalizationBases =
    resolveAvailableNormalizationBases({
      propertyBasis,
      propertyAreaM2,
      constructionAreaM2
    })


  const siteCoverage =
    propertyBasis ===
      'improved_property'
      ? calculatePriceMeterSiteCoverage({
          propertyAreaM2,
          constructionAreaM2
        })
      : null


    const originalCurrency =
    normalizePriceMeterCurrency(
      listing.currency
    )


  const analyticalCurrency:
    PriceMeterAnalyticalCurrency =
      'CRC'


  const price =
  resolvePriceMeterPriceIdentity({
    transactionType,

    currency:
      originalCurrency,

    currentPrice:
      listing.current_price,

    monthlyPrice:
      listing.monthly_price,

    analyticalDate:
      context.analyticalDate,

    fxIdentity:
      context.fxIdentity
  })

  const priceIntegrity =
  resolvePriceMeterPriceIntegrity({
    transactionType,
    price
  })

  const eligibility =
  resolveEligibility({
    transactionType,
    propertyBasis,
    availableNormalizationBases,
    priceIntegrity
  })


  return {
    transactionType,

    propertyBasis,

    availableNormalizationBases,

        geography: {
      province:
        listing.province ??
        null,

      canton:
        listing.canton ??
        null,

      district:
        listing.district ??
        null
    },

    propertyArea,

    constructionArea,

    propertyAreaM2,

    constructionAreaM2,

    siteCoverage,

    originalCurrency,

    analyticalCurrency,

    price,

    priceIntegrity,

    eligibility
  }
}

