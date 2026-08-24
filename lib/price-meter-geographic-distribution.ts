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

import type {
  CanonicalGeographyTerm
} from '@/lib/geography/canonical-geography'


export type PriceMeterGeographyLevel =
  | 'province'
  | 'canton'
  | 'district'


export type PriceMeterGeographicIdentity = {
  province:
    CanonicalGeographyTerm | null

  canton:
    CanonicalGeographyTerm | null

  district:
    CanonicalGeographyTerm | null
}


export type PriceMeterGeographicDistribution<
  T extends PriceMeterTransactionType
> = {
  level:
    PriceMeterGeographyLevel

  geography:
    PriceMeterGeographicIdentity

  distribution:
    PriceMeterDistribution<T>
}


/*
 * ---------------------------------------------------------
 * CANONICAL GEOGRAPHIC GROUPING KEY
 * ---------------------------------------------------------
 *
 * Geographic identity is based on canonical ontology IDs,
 * never geographic display names.
 *
 * This allows identically named geographic entities at
 * different hierarchy levels to remain distinct.
 *
 * Example:
 *
 * Canton Escazú
 * and
 * District Escazú
 *
 * may share a display name but cannot share canonical
 * geographic identity.
 */


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
      ? `province:${province.id}`
      : null
  }


  if (
    level === 'canton'
  ) {

    if (
      !province ||
      !canton
    ) {

      return null
    }


    return (
      `province:${province.id}` +
      `|canton:${canton.id}`
    )
  }


  if (
    !province ||
    !canton ||
    !district
  ) {

    return null
  }


  return (
    `province:${province.id}` +
    `|canton:${canton.id}` +
    `|district:${district.id}`
  )
}


/*
 * ---------------------------------------------------------
 * CANONICAL GEOGRAPHIC IDENTITY
 * ---------------------------------------------------------
 *
 * Every geographic distribution preserves the canonical
 * geographic entities required for that level.
 *
 * Province:
 *   Province
 *
 * Canton:
 *   Province → Canton
 *
 * District:
 *   Province → Canton → District
 */


function geographyIdentity({
  observation,
  level
}: {
  observation:
    PriceMeterObservation

  level:
    PriceMeterGeographyLevel
}): PriceMeterGeographicIdentity {

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
      canton:
        null,
      district:
        null
    }
  }


  if (
    level === 'canton'
  ) {

    return {
      province,
      canton,
      district:
        null
    }
  }


  return {
    province,
    canton,
    district
  }
}


/*
 * ---------------------------------------------------------
 * DISPLAY NAME
 * ---------------------------------------------------------
 *
 * Display names are presentation metadata.
 *
 * They are used here only to provide deterministic,
 * human-readable ordering.
 *
 * They are NEVER used as geographic identity.
 */


function geographyDisplayName(
  geography:
    PriceMeterGeographicIdentity
): string {

  const term =
    geography.district ??
    geography.canton ??
    geography.province


  return (
    term?.term_name_en ??
    term?.term_name ??
    term?.term_name_es ??
    ''
  )
}


/*
 * ---------------------------------------------------------
 * CANONICAL TERM ID
 * ---------------------------------------------------------
 *
 * Used only as a deterministic tie-breaker when two
 * geographic entities have the same display name.
 */


function geographyTermId(
  geography:
    PriceMeterGeographicIdentity
): number {

  const term =
    geography.district ??
    geography.canton ??
    geography.province


  return term?.id ?? 0
}


/*
 * ---------------------------------------------------------
 * GEOGRAPHIC DISTRIBUTIONS
 * ---------------------------------------------------------
 */


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

  /*
   * Sale and Rent must remain analytically isolated.
   */

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


      /*
       * Geographic analysis fails closed at the level
       * whose canonical identity cannot be established.
       *
       * This does NOT invalidate the observation for
       * unrelated Price / m² analysis.
       *
       * Example:
       *
       * Province resolved
       * Canton unresolved
       * District unresolved
       *
       * Province analysis:
       *   admissible
       *
       * Canton analysis:
       *   excluded
       *
       * District analysis:
       *   excluded
       */

      if (
        key === null
      ) {

        continue
      }


      const existing =
        groups.get(
          key
        )


      if (
        existing
      ) {

        existing.push(
          observation
        )

        continue
      }


      groups.set(
        key,
        [
          observation
        ]
      )
    }


    const distributions:
      PriceMeterGeographicDistribution<T>[] =
      []


    for (
      const groupObservations
      of groups.values()
    ) {

      const first =
        groupObservations[0]


      if (
        !first
      ) {

        continue
      }


      const distribution =
        buildPriceMeterDistribution({
          transactionType,

          observations:
            groupObservations
        })


      distributions.push({
        level,

        geography:
          geographyIdentity({
            observation:
              first,

            level
          }),

        distribution
      })
    }


    distributions.sort(
      (a, b) => {

        const aName =
          geographyDisplayName(
            a.geography
          )

        const bName =
          geographyDisplayName(
            b.geography
          )


        const nameComparison =
          aName.localeCompare(
            bName
          )


        if (
          nameComparison !==
            0
        ) {

          return nameComparison
        }


        return (
          geographyTermId(
            a.geography
          ) -
          geographyTermId(
            b.geography
          )
        )
      }
    )


    return distributions
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