import type {
  CommercialProvider
} from '@/lib/commercial-provider'

import {
  getRegisteredProviders
} from '@/lib/commercial-provider-registry'


export class CommercialProviderResolverError
  extends Error {

  code:
    | 'NO_PROVIDER_AVAILABLE'
    | 'NO_PROVIDER_FOR_COUNTRY'
    | 'NO_PROVIDER_FOR_CURRENCY'
    | 'NO_PROVIDER_FOR_PRODUCT'

  constructor({
    code,
    message
  }: {
    code:
      CommercialProviderResolverError['code']

    message:
      string
  }) {

    super(
      message
    )

    this.name =
      'CommercialProviderResolverError'

    this.code =
      code
  }
}


export type CommercialProductType =
  | 'package'
  | 'subscription'
  | 'promotion'
  | 'csv'
  | 'storage'
  | 'listing'
  | 'add_on'


export type ResolveCommercialProviderInput = {

  country:
    string

  currency:
    string

  productType:
    CommercialProductType

  providerPreference?:
    string | null
}


function normalize(
  value:
    string
): string {

  return value
    .trim()
    .toUpperCase()
}


function supportsCountry(
  provider:
    CommercialProvider,

  country:
    string
): boolean {

  return provider
    .supportedCountries
    .map(
      normalize
    )
    .includes(
      normalize(
        country
      )
    )
}


function supportsCurrency(
  provider:
    CommercialProvider,

  currency:
    string
): boolean {

  return provider
    .supportedCurrencies
    .map(
      normalize
    )
    .includes(
      normalize(
        currency
      )
    )
}


function supportsProduct(

  provider:
    CommercialProvider,

  productType:
    CommercialProductType

): boolean {

  /*
   * Future:
   *
   * Providers may expose:
   *
   * supportedProducts
   *
   * Until then every registered
   * provider supports every
   * commercial product.
   */

  void provider
  void productType

  return true
}


function providerAvailable(
  provider:
    CommercialProvider
): boolean {

  /*
   * Future:
   *
   * maintenance mode
   * outage
   * disabled
   * health score
   */

  void provider

  return true
}


export function resolveCommercialProvider({

  country,

  currency,

  productType,

  providerPreference

}: ResolveCommercialProviderInput):

CommercialProvider {

  const providers =
    getRegisteredProviders()


  if (
    providers.length ===
    0
  ) {

    throw new CommercialProviderResolverError({

      code:
        'NO_PROVIDER_AVAILABLE',

      message:
        'No commercial providers have been registered.'
    })
  }


  /*
   * Explicit preference.
   *
   * Used later for:
   *
   * "Pay with SINPE"
   *
   * "Pay with Stripe"
   */

  if (
    providerPreference
  ) {

    const preferred =
      providers.find(
        provider =>

          provider.id.toLowerCase() ===
          providerPreference
            .trim()
            .toLowerCase()
      )

    if (
      preferred
    ) {

      return preferred
    }
  }


  const countryProviders =
    providers.filter(
      provider =>

        supportsCountry(
          provider,
          country
        )
    )


  if (
    countryProviders.length ===
    0
  ) {

    throw new CommercialProviderResolverError({

      code:
        'NO_PROVIDER_FOR_COUNTRY',

      message:
        `No provider supports country "${country}".`
    })
  }


  const currencyProviders =
    countryProviders.filter(
      provider =>

        supportsCurrency(
          provider,
          currency
        )
    )


  if (
    currencyProviders.length ===
    0
  ) {

    throw new CommercialProviderResolverError({

      code:
        'NO_PROVIDER_FOR_CURRENCY',

      message:
        `No provider supports currency "${currency}".`
    })
  }


  const productProviders =
    currencyProviders.filter(
      provider =>

        supportsProduct(
          provider,
          productType
        )
    )


  if (
    productProviders.length ===
    0
  ) {

    throw new CommercialProviderResolverError({

      code:
        'NO_PROVIDER_FOR_PRODUCT',

      message:
        `No provider supports "${productType}".`
    })
  }


  const availableProviders =
    productProviders.filter(
      providerAvailable
    )


  if (
    availableProviders.length ===
    0
  ) {

    throw new CommercialProviderResolverError({

      code:
        'NO_PROVIDER_AVAILABLE',

      message:
        'No commercial provider is currently available.'
    })
  }


  /*
   * Canonical fallback.
   *
   * Today:
   *
   * first available
   *
   * Future:
   *
   * priority
   * latency
   * health score
   * success rate
   * traffic balancing
   */

  return availableProviders[0]
}