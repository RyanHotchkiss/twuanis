import type {
  PriceMeterObservation
} from '@/lib/price-meter-observation-builder'

import type {
  PriceMeterTransactionType
} from '@/lib/price-meter-transaction-cohort'

import {
  buildPriceMeterDistribution,
  type PriceMeterDistribution
} from '@/lib/price-meter-distribution'


export type PriceMeterGeographyLevel =
  | 'province'
  | 'canton'
  | 'district'


export type PriceMeterGeographicDistribution<
  T extends PriceMeterTransactionType
> = {
  level:
    PriceMeterGeographyLevel

  geography: {
    province:
      string | null

    canton:
      string | null

    district:
      string | null
  }

  distribution:
    PriceMeterDistribution<T>
}


function geographyKey({
  observation,
  level
}: {
  observation:
    PriceMeterObservation

  level:
    PriceMeterGeographyLevel
}): string | null {

  const {
    province,
    canton,
    district
  } =
    observation.geography


  if (
    level === 'province'
  ) {

    return province
      ? `province:${province}`
      : null
  }


  if (
    level === 'canton'
  ) {

    return (
      province &&
      canton
    )
      ? `province:${province}|canton:${canton}`
      : null
  }


  return (
    province &&
    canton &&
    district
  )
    ? `province:${province}|canton:${canton}|district:${district}`
    : null
}


function geographyIdentity({
  observation,
  level
}: {
  observation:
    PriceMeterObservation

  level:
    PriceMeterGeographyLevel
}) {

  const {
    province,
    canton,
    district
  } =
    observation.geography


  if (
    level === 'province'
  ) {

    return {
      province,
      canton: null,
      district: null
    }
  }


  if (
    level === 'canton'
  ) {

    return {
      province,
      canton,
      district: null
    }
  }


  return {
    province,
    canton,
    district
  }
}


export function buildPriceMeterGeographicDistributions<
  T extends PriceMeterTransactionType
>({
  observations,
  transactionType
}: {
  observations:
    PriceMeterObservation[]

  transactionType:
    T
}): {
  province:
    PriceMeterGeographicDistribution<T>[]

  canton:
    PriceMeterGeographicDistribution<T>[]

  district:
    PriceMeterGeographicDistribution<T>[]
} {

  if (
    observations.some(
      observation =>
        observation.transactionType !==
          transactionType
    )
  ) {
    throw new Error(
      'Price / m² geographic distribution contains mixed Sale/Rent observations.'
    )
  }


  function buildLevel(
    level:
      PriceMeterGeographyLevel
  ):
    PriceMeterGeographicDistribution<T>[] {

    const groups =
      new Map<
        string,
        PriceMeterObservation[]
      >()


    for (
      const observation
      of observations
    ) {

      const key =
        geographyKey({
          observation,
          level
        })


      if (!key) {
        continue
      }


      const existing =
        groups.get(
          key
        ) ??
        []


      existing.push(
        observation
      )


      groups.set(
        key,
        existing
      )
    }


    return Array.from(
      groups.values()
    )
      .map(
        groupObservations => {

          const first =
            groupObservations[0]


          const distribution =
            buildPriceMeterDistribution({
              transactionType,
              observations:
                groupObservations
            })


          return {
            level,

            geography:
              geographyIdentity({
                observation:
                  first,

                level
              }),

            distribution
          }
        }
      )
      .sort(
        (a, b) => {

          const aName =
            a.geography.district ??
            a.geography.canton ??
            a.geography.province ??
            ''

          const bName =
            b.geography.district ??
            b.geography.canton ??
            b.geography.province ??
            ''

          return aName.localeCompare(
            bName
          )
        }
      )
  }


  return {
    province:
      buildLevel(
        'province'
      ),

    canton:
      buildLevel(
        'canton'
      ),

    district:
      buildLevel(
        'district'
      )
  }
}