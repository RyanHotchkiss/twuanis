import type {
  CommercialProvider
} from '@/lib/commercial-provider'

export class CommercialProviderRegistryError
  extends Error {

  code:
    | 'PROVIDER_ALREADY_REGISTERED'
    | 'PROVIDER_NOT_REGISTERED'

  providerId:
    string

  constructor({
    code,
    providerId,
    message
  }: {
    code:
      CommercialProviderRegistryError['code']

    providerId:
      string

    message:
      string
  }) {

    super(
      message
    )

    this.name =
      'CommercialProviderRegistryError'

    this.code =
      code

    this.providerId =
      providerId
  }
}


const registry =
  new Map<
    string,
    CommercialProvider
  >()


function normalizeProviderId(
  providerId:
    string
): string {

  return providerId
    .trim()
    .toLowerCase()
}


export function registerProvider(
  provider:
    CommercialProvider
): void {

  const providerId =
    normalizeProviderId(
      provider.id
    )

  if (
    registry.has(
      providerId
    )
  ) {

    throw new CommercialProviderRegistryError({
      code:
        'PROVIDER_ALREADY_REGISTERED',

      providerId,

      message:
        `Commercial provider "${providerId}" is already registered.`
    })
  }

  registry.set(
    providerId,
    provider
  )
}


export function unregisterProvider(
  providerId:
    string
): void {

  registry.delete(
    normalizeProviderId(
      providerId
    )
  )
}


export function getProvider(
  providerId:
    string
): CommercialProvider {

  const normalizedId =
    normalizeProviderId(
      providerId
    )

  const provider =
    registry.get(
      normalizedId
    )

  if (
    !provider
  ) {

    throw new CommercialProviderRegistryError({
      code:
        'PROVIDER_NOT_REGISTERED',

      providerId:
        normalizedId,

      message:
        `Commercial provider "${normalizedId}" is not registered.`
    })
  }

  return provider
}


export function hasProvider(
  providerId:
    string
): boolean {

  return registry.has(
    normalizeProviderId(
      providerId
    )
  )
}


export function getRegisteredProviders():
  readonly CommercialProvider[] {

  return Array.from(
    registry.values()
  )
}


export function getRegisteredProviderIds():
  readonly string[] {

  return Array.from(
    registry.keys()
  )
}


export function clearProviderRegistry():
  void {

  registry.clear()
}