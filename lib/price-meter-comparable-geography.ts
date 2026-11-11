import 'server-only'

import type {
  CanonicalGeographyTerm
} from '@/lib/geography/canonical-geography'

import type {
  PriceMeterObservation
} from '@/lib/price-meter-observation-builder'


export type PriceMeterComparableGeographyLevel =
  | 'province'
  | 'canton'
  | 'district'


export type PriceMeterComparableGeographyOption = {
  level:
    PriceMeterComparableGeographyLevel

  geography:
    CanonicalGeographyTerm
}


export function getPriceMeterComparableGeographyOptions(
  observation:
    PriceMeterObservation
): PriceMeterComparableGeographyOption[] {

  const {
    province,
    canton,
    district
  } =
    observation.geography


  const options:
    PriceMeterComparableGeographyOption[] =
    []


  if (province) {
    options.push({
      level:
        'province',

      geography:
        province
    })
  }


  if (
    canton &&
    province &&
    canton.parent_id ===
      province.id
  ) {
    options.push({
      level:
        'canton',

      geography:
        canton
    })
  }


  if (
    district &&
    canton &&
    province &&
    district.parent_id ===
      canton.id &&
    canton.parent_id ===
      province.id
  ) {
    options.push({
      level:
        'district',

      geography:
        district
    })
  }


  return options
}


export function resolvePriceMeterComparableGeography({
  observation,
  level
}: {
  observation:
    PriceMeterObservation

  level:
    PriceMeterComparableGeographyLevel
}): CanonicalGeographyTerm {

  const match =
    getPriceMeterComparableGeographyOptions(
      observation
    ).find(
      option =>
        option.level === level
    )


  if (!match) {
    throw new Error(
      `Subject property does not support canonical ${level} comparable geography.`
    )
  }


  return match.geography
}


export function matchesPriceMeterComparableGeography({
  observation,
  geography
}: {
  observation:
    PriceMeterObservation

  geography:
    CanonicalGeographyTerm
}): boolean {

  if (
    geography.term_type ===
      'province'
  ) {
    return (
      observation
        .geography
        .province
        ?.id ===
      geography.id
    )
  }


  if (
    geography.term_type ===
      'canton'
  ) {
    return (
      observation
        .geography
        .canton
        ?.id ===
      geography.id
    )
  }


  if (
    geography.term_type ===
      'district'
  ) {
    return (
      observation
        .geography
        .district
        ?.id ===
      geography.id
    )
  }


  return false
}