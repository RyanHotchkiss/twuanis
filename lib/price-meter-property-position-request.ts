// Browser intent only. Canonical identities are resolved on the server.
export type PositionGeography = 'district' | 'canton' | 'province'
export type PositionNormalization = 'land' | 'construction'
export type PositionRequest = { listingId: string; requestedGeographyLevel: PositionGeography; requestedNormalizationBasis: PositionNormalization }
export function parsePositionRequest(value: unknown, configuration = false): PositionRequest | { listingId: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid request.')
  const v = value as Record<string, unknown>
  const keys = configuration ? ['listingId'] : ['listingId','requestedGeographyLevel','requestedNormalizationBasis']
  if (Object.keys(v).length !== keys.length || Object.keys(v).some(k => !keys.includes(k)) ||
      typeof v.listingId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v.listingId)) throw new Error('Invalid request.')
  if (configuration) return { listingId: v.listingId }
  if (typeof v.requestedGeographyLevel !== 'string' || !['district','canton','province'].includes(v.requestedGeographyLevel) ||
      typeof v.requestedNormalizationBasis !== 'string' || !['land','construction'].includes(v.requestedNormalizationBasis)) throw new Error('Invalid request.')
  return { listingId: v.listingId, requestedGeographyLevel: v.requestedGeographyLevel as PositionGeography, requestedNormalizationBasis: v.requestedNormalizationBasis as PositionNormalization }
}
