import type {
  ExplorerOption
} from '@/lib/explorer-options-engine'

import type {
  CanonicalGeographyTerm
} from '@/lib/geography/canonical-geography'

import type {
  PriceMeterCharacteristicIdentity,
  PriceMeterCharacteristicType
} from '@/lib/price-meter-characteristic-identity'

import {
  isPriceMeterCharacteristicType
} from '@/lib/price-meter-characteristic-identity'

import {
  validatePriceMeterComparisonRequest
} from '@/lib/price-meter-comparison-request'

import type {
  PriceMeterComparisonRequest
} from '@/lib/price-meter-comparison-request'


export type PriceMeterComparisonSearchParams =
  Record<
    string,
    string | undefined
  >


type ExplorerOptions = {
  province: ExplorerOption[]
  canton: ExplorerOption[]
  district: ExplorerOption[]
  property_type: ExplorerOption[]
  bedrooms: ExplorerOption[]
  bathrooms: ExplorerOption[]
  parking: ExplorerOption[]
  year_built: ExplorerOption[]
  property_area: ExplorerOption[]
  construction_area: ExplorerOption[]
  utility: ExplorerOption[]
  environment: ExplorerOption[]
  terrain: ExplorerOption[]
  accessibility: ExplorerOption[]
  legal_status: ExplorerOption[]
}


function requiredParam(
  params:
    PriceMeterComparisonSearchParams,

  key:
    string
): string {
  const value =
    params[key]?.trim()

  if (!value) {
    throw new Error(
      `Missing required Phase 10 parameter: ${key}`
    )
  }

  return value
}


function optionalParam(
  params:
    PriceMeterComparisonSearchParams,

  key:
    string
): string | null {
  const value =
    params[key]?.trim()

  return value || null
}


function matchesOptionSlug(
  option:
    ExplorerOption,

  value:
    string
): boolean {
  return [
    option.slug,
    option.slug_en,
    option.slug_es
  ]
    .filter(
      (
        slug
      ): slug is string =>
        Boolean(slug)
    )
    .includes(value)
}


function resolveOption({
  options,
  termType,
  slug
}: {
  options:
    ExplorerOptions

  termType:
    keyof ExplorerOptions

  slug:
    string
}): ExplorerOption {
  const matches =
    options[
      termType
    ].filter(
      option =>
        matchesOptionSlug(
          option,
          slug
        )
    )

  if (
    matches.length !==
      1
  ) {
    throw new Error(
      `Unable to resolve canonical ${termType}: ${slug}`
    )
  }

  return matches[0]
}


function toCanonicalGeographyTerm(
  option:
    ExplorerOption
): CanonicalGeographyTerm {
  if (
    option.term_type !==
      'province' &&
    option.term_type !==
      'canton' &&
    option.term_type !==
      'district'
  ) {
    throw new Error(
      `Explorer option is not canonical geography: ${option.slug}`
    )
  }

  return {
    id:
      option.id,

    parent_id:
      option.parent_id,

    term_name:
      option.term_name,

    term_name_en:
      option.term_name_en,

    term_name_es:
      option.term_name_es,

    slug:
      option.slug,

    slug_en:
      option.slug_en,

    slug_es:
      option.slug_es,

    official_code:
      option.official_code,

    term_type:
      option.term_type
  }
}


function toCharacteristicIdentity(
  option:
    ExplorerOption
): PriceMeterCharacteristicIdentity {
  if (
    !isPriceMeterCharacteristicType(
      option.term_type
    )
  ) {
    throw new Error(
      `Explorer option is not a Price / m² characteristic: ${option.slug}`
    )
  }

  return {
    ontologyTermId:
      option.id,

    termType:
      option.term_type,

    termName:
      option.term_name,

    termNameEn:
      option.term_name_en,

    termNameEs:
      option.term_name_es,

    slug:
      option.slug,

    slugEn:
      option.slug_en,

    slugEs:
      option.slug_es
  }
}


function resolveGeography({
  params,
  options,
  prefix
}: {
  params:
    PriceMeterComparisonSearchParams

  options:
    ExplorerOptions

  prefix:
    'a' | 'b'
}): CanonicalGeographyTerm {
  const provinceSlug =
    optionalParam(
      params,
      `${prefix}_province`
    )

  const cantonSlug =
    optionalParam(
      params,
      `${prefix}_canton`
    )

  const districtSlug =
    optionalParam(
      params,
      `${prefix}_district`
    )

  if (
    districtSlug
  ) {
    const district =
      resolveOption({
        options,
        termType:
          'district',
        slug:
          districtSlug
      })

    if (
      !cantonSlug ||
      !provinceSlug
    ) {
      throw new Error(
        `District geography requires Canton and Province for Cohort ${prefix.toUpperCase()}.`
      )
    }

    const canton =
      resolveOption({
        options,
        termType:
          'canton',
        slug:
          cantonSlug
      })

    const province =
      resolveOption({
        options,
        termType:
          'province',
        slug:
          provinceSlug
      })

    if (
      district.parent_id !==
        canton.id ||
      canton.parent_id !==
        province.id
    ) {
      throw new Error(
        `Invalid canonical geography hierarchy for Cohort ${prefix.toUpperCase()}.`
      )
    }

    return toCanonicalGeographyTerm(
      district
    )
  }

  if (
    cantonSlug
  ) {
    if (
      !provinceSlug
    ) {
      throw new Error(
        `Canton geography requires Province for Cohort ${prefix.toUpperCase()}.`
      )
    }

    const canton =
      resolveOption({
        options,
        termType:
          'canton',
        slug:
          cantonSlug
      })

    const province =
      resolveOption({
        options,
        termType:
          'province',
        slug:
          provinceSlug
      })

    if (
      canton.parent_id !==
        province.id
    ) {
      throw new Error(
        `Invalid canonical geography hierarchy for Cohort ${prefix.toUpperCase()}.`
      )
    }

    return toCanonicalGeographyTerm(
      canton
    )
  }

  if (
    provinceSlug
  ) {
    return toCanonicalGeographyTerm(
      resolveOption({
        options,
        termType:
          'province',
        slug:
          provinceSlug
      })
    )
  }

  throw new Error(
    `Missing geography for Cohort ${prefix.toUpperCase()}.`
  )
}


function resolveCharacteristic({
  params,
  options,
  prefix,
  number
}: {
  params:
    PriceMeterComparisonSearchParams

  options:
    ExplorerOptions

  prefix:
    'a' | 'b'

  number:
    1 | 2
}): PriceMeterCharacteristicIdentity {
  const type =
    requiredParam(
      params,
      `${prefix}_characteristic_${number}_type`
    )

  if (
    !isPriceMeterCharacteristicType(
      type
    ) ||
    type ===
      'property_type'
  ) {
    throw new Error(
      `Invalid qualifying characteristic type for Cohort ${prefix.toUpperCase()}: ${type}`
    )
  }

  const slug =
    requiredParam(
      params,
      `${prefix}_characteristic_${number}`
    )

  const option =
    resolveOption({
      options,
      termType:
        type as PriceMeterCharacteristicType,
      slug
    })

  return toCharacteristicIdentity(
    option
  )
}


function resolveCohort({
  params,
  options,
  prefix
}: {
  params:
    PriceMeterComparisonSearchParams

  options:
    ExplorerOptions

  prefix:
    'a' | 'b'
}) {
  const propertyType =
    toCharacteristicIdentity(
      resolveOption({
        options,
        termType:
          'property_type',
        slug:
          requiredParam(
            params,
            `${prefix}_property_type`
          )
      })
    )

  return {
    geography:
      resolveGeography({
        params,
        options,
        prefix
      }),

    propertyType,

    characteristics: [
      resolveCharacteristic({
        params,
        options,
        prefix,
        number:
          1
      }),

      resolveCharacteristic({
        params,
        options,
        prefix,
        number:
          2
      })
    ] as [
      PriceMeterCharacteristicIdentity,
      PriceMeterCharacteristicIdentity
    ],

    propertyAreaRange:
      optionalParam(
        params,
        `${prefix}_property_area`
      ),

    constructionAreaRange:
      optionalParam(
        params,
        `${prefix}_construction_area`
      ),

    constructionLandCohortKey:
      optionalParam(
        params,
        `${prefix}_construction_land_cohort`
      )
  }
}


export function parsePriceMeterComparisonRequest({
  params,
  options
}: {
  params:
    PriceMeterComparisonSearchParams

  options:
    ExplorerOptions
}): PriceMeterComparisonRequest {
  const transactionType =
    requiredParam(
      params,
      'transaction_type'
    )

  if (
    transactionType !==
      'sale' &&
    transactionType !==
      'rent'
  ) {
    throw new Error(
      `Invalid Phase 10 transaction type: ${transactionType}`
    )
  }

  const propertyBasis =
    requiredParam(
      params,
      'property_basis'
    )

  if (
    propertyBasis !==
      'land_only' &&
    propertyBasis !==
      'improved_property'
  ) {
    throw new Error(
      `Invalid Phase 10 Property Basis: ${propertyBasis}`
    )
  }

  const normalizationBasis =
    requiredParam(
      params,
      'normalization_basis'
    )

  if (
    normalizationBasis !==
      'land' &&
    normalizationBasis !==
      'construction'
  ) {
    throw new Error(
      `Invalid Phase 10 normalization basis: ${normalizationBasis}`
    )
  }

  const referenceCohort =
    requiredParam(
      params,
      'reference_cohort'
    )

  if (
    referenceCohort !==
      'A' &&
    referenceCohort !==
      'B'
  ) {
    throw new Error(
      `Invalid Phase 10 reference cohort: ${referenceCohort}`
    )
  }

  const request:
    PriceMeterComparisonRequest = {
      transactionType,
      propertyBasis,
      normalizationBasis,

      cohortA:
        resolveCohort({
          params,
          options,
          prefix:
            'a'
        }),

      cohortB:
        resolveCohort({
          params,
          options,
          prefix:
            'b'
        }),

      referenceCohort
    }

  validatePriceMeterComparisonRequest(
    request
  )

  return request
}