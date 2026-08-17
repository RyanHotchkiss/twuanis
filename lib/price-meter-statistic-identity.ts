export type PriceMeterStatisticTransactionType =
  | 'sale'
  | 'rent'


export type PriceMeterStatisticPropertyBasis =
  | 'land_only'
  | 'improved_property'


export type PriceMeterStatisticNormalizationBasis =
  | 'land'
  | 'construction'


export type PriceMeterStatisticKind =
  | 'average'
  | 'median'
  | 'lowest'
  | 'highest'


export type PriceMeterStatisticGeography = {
  province:
    string | null

  canton:
    string | null

  district:
    string | null
}


export type PriceMeterStatisticConfidence = {
  score:
    number

  label:
    string

  sampleSize:
    number
}

export type PriceMeterStatisticFxObservation = {
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
}


export type PriceMeterStatisticMonetaryIdentity = {
  analyticalDate:
    string

  analyticalCurrency:
    'CRC'

  fxObservations:
    PriceMeterStatisticFxObservation[]
}

export type PriceMeterStatisticIdentity = {
  transactionType:
    PriceMeterStatisticTransactionType

  propertyBasis:
    PriceMeterStatisticPropertyBasis

  normalizationBasis:
    PriceMeterStatisticNormalizationBasis

  geography:
    PriceMeterStatisticGeography

  monetary:
    PriceMeterStatisticMonetaryIdentity

  denominatorUnit:
    'land_m2' | 'construction_m2'

  priceUnit:
    'CRC_per_land_m2'
    | 'CRC_per_construction_m2'
    | 'CRC_per_land_m2_per_month'
    | 'CRC_per_construction_m2_per_month'

  sampleSize:
    number

  confidence:
    PriceMeterStatisticConfidence
}


export type PriceMeterStatistic = {
  statistic:
    PriceMeterStatisticKind

  value:
    number | null

  identity:
    PriceMeterStatisticIdentity
}


function resolvePriceUnit({
  transactionType,
  normalizationBasis
}: {
  transactionType:
    PriceMeterStatisticTransactionType

  normalizationBasis:
    PriceMeterStatisticNormalizationBasis
}): PriceMeterStatisticIdentity['priceUnit'] {

  if (
    transactionType === 'rent' &&
    normalizationBasis === 'land'
  ) {
    return 'CRC_per_land_m2_per_month'
  }


  if (
    transactionType === 'rent' &&
    normalizationBasis === 'construction'
  ) {
    return 'CRC_per_construction_m2_per_month'
  }


  if (
    normalizationBasis === 'land'
  ) {
    return 'CRC_per_land_m2'
  }


  return 'CRC_per_construction_m2'
}


export function createPriceMeterStatistic({
  statistic,
  value,
  transactionType,
  propertyBasis,
  normalizationBasis,
  geography,
  monetary,
  sampleSize,
  confidence
}: {
  statistic:
    PriceMeterStatisticKind

  value:
    number | null

  transactionType:
    PriceMeterStatisticTransactionType

  propertyBasis:
    PriceMeterStatisticPropertyBasis

  normalizationBasis:
    PriceMeterStatisticNormalizationBasis

  geography:
    PriceMeterStatisticGeography

  monetary:
  PriceMeterStatisticMonetaryIdentity

  sampleSize:
    number

  confidence:
    Omit<
      PriceMeterStatisticConfidence,
      'sampleSize'
    >
}): PriceMeterStatistic {

  const denominatorUnit =
    normalizationBasis === 'land'
      ? 'land_m2'
      : 'construction_m2'


  return {
    statistic,

    value,

    identity: {
      transactionType,

      propertyBasis,

      normalizationBasis,

      geography,

      monetary,

      denominatorUnit,

      priceUnit:
        resolvePriceUnit({
          transactionType,
          normalizationBasis
        }),

      sampleSize,

      confidence: {
        ...confidence,

        sampleSize
      }
    }
  }
}