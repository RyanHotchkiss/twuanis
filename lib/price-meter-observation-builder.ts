import type {
  PriceMeterAnalyticalIdentity,
  PriceMeterFxIdentity
} from '@/lib/price-meter-identity'

export type PriceMeterObservation = {
  listingId:
    string | null

  analyticalIdentity:
    PriceMeterAnalyticalIdentity

  geography: {
    province:
      string | null

    canton:
      string | null

    district:
      string | null
  }

  transactionType:
    'sale' | 'rent'

  propertyBasis:
    'land_only' | 'improved_property'

  normalizationBasis:
    'land' | 'construction'

  analyticalPrice:
    number

  fx:
    PriceMeterFxIdentity | null

  areaM2:
    number

  pricePerM2:
    number
}


export function buildPriceMeterObservations(
  listings: any[]
): PriceMeterObservation[] {

  const observations:
    PriceMeterObservation[] =
      []


  for (const listing of listings) {

    const identity =
      listing.analyticalIdentity


    if (
      !identity ||
      !identity.eligibility.eligible ||
      !identity.price.analyticallyUsable ||
      identity.price.analyticalAmount === null ||
      identity.transactionType === null ||
      identity.propertyBasis === 'unknown'
    ) {
      continue
    }


    const analyticalPrice =
      identity.price.analyticalAmount


    const listingId =
      typeof listing.id === 'string'
        ? listing.id
        : null


    if (
      identity
        .availableNormalizationBases
        .includes('land') &&
      identity.propertyArea.exactM2 !== null
    ) {

      const areaM2 =
        identity.propertyArea.exactM2


      observations.push({
        listingId,

        analyticalIdentity:
          identity,

        geography:
          identity.geography,

        transactionType:
          identity.transactionType,

        propertyBasis:
          identity.propertyBasis,

        normalizationBasis:
          'land',

        analyticalPrice,

        fx:
          identity.price.fx,

        areaM2,

        pricePerM2:
          analyticalPrice / areaM2
      })
    }


    if (
      identity
        .availableNormalizationBases
        .includes('construction') &&
      identity.constructionArea.exactM2 !== null
    ) {

      const areaM2 =
        identity.constructionArea.exactM2


      observations.push({
        listingId,

        analyticalIdentity:
          identity,

        geography:
          identity.geography,

        transactionType:
          identity.transactionType,

        propertyBasis:
          identity.propertyBasis,

        normalizationBasis:
          'construction',

        analyticalPrice,

        fx:
          identity.price.fx,

        areaM2,

        pricePerM2:
          analyticalPrice / areaM2
      })
    }
  }


  return observations
}