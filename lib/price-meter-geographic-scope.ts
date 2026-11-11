import type {
  PriceMeterGeographyLevel
} from '@/lib/price-meter-geographic-distribution'


export type PriceMeterGeographicScope = {
  selectedLevel:
    | 'national'
    | 'province'
    | 'canton'
    | 'district'

  comparisonLevel:
    PriceMeterGeographyLevel | null
}


export function resolvePriceMeterGeographicScope({
  province,
  canton,
  district
}: {
  province?:
    string

  canton?:
    string

  district?:
    string
}): PriceMeterGeographicScope {

  if (
    district
  ) {

    return {
      selectedLevel:
        'district',

      comparisonLevel:
        null
    }
  }


  if (
    canton
  ) {

    return {
      selectedLevel:
        'canton',

      comparisonLevel:
        'district'
    }
  }


  if (
    province
  ) {

    return {
      selectedLevel:
        'province',

      comparisonLevel:
        'canton'
    }
  }


  return {
    selectedLevel:
      'national',

    comparisonLevel:
      'province'
  }
}
