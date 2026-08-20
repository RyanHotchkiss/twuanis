import type {
  PriceMeterObservation
} from '@/lib/price-meter-observation-builder'


export type PriceMeterTransactionType =
  | 'sale'
  | 'rent'


export type PriceMeterTransactionCohort<
  T extends PriceMeterTransactionType
> = {
  transactionType:
    T

  observations:
    PriceMeterObservation[]
}


export type PriceMeterTransactionCohorts = {
  sale:
    PriceMeterTransactionCohort<'sale'>

  rent:
    PriceMeterTransactionCohort<'rent'>
}


/*
 * ---------------------------------------------------------
 * TRANSACTION COHORT PARTITION
 * ---------------------------------------------------------
 *
 * Sale and Rent are analytically different universes.
 *
 * Sale observations represent asset price.
 * Rent observations represent monthly occupancy price.
 *
 * No percentile, premium, value signal, or other
 * Price / m² intelligence calculation may operate on
 * an unpartitioned Sale + Rent observation population.
 */

export function buildPriceMeterTransactionCohorts(
  observations:
    PriceMeterObservation[]
): PriceMeterTransactionCohorts {

  return {
    sale: {
      transactionType:
        'sale',

      observations:
        observations.filter(
          observation =>
            observation.transactionType ===
              'sale'
        )
    },

    rent: {
      transactionType:
        'rent',

      observations:
        observations.filter(
          observation =>
            observation.transactionType ===
              'rent'
        )
    }
  }
}


export function resolvePriceMeterTransactionCohort(
  cohorts:
    PriceMeterTransactionCohorts,

  transactionType:
    unknown
):
  | PriceMeterTransactionCohort<'sale'>
  | PriceMeterTransactionCohort<'rent'> {

  if (
    transactionType ===
      'sale'
  ) {
    return cohorts.sale
  }


  if (
    transactionType ===
      'rent'
  ) {
    return cohorts.rent
  }


  throw new Error(
    'Price / m² intelligence requires an explicit Sale or Rent transaction cohort.'
  )
}