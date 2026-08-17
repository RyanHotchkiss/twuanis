export const SQUARE_METERS_PER_HECTARE = 10_000

export type PropertyAreaInputUnit =
  | 'm2'
  | 'hectare'

export function squareMetersToHectares(
  squareMeters: number
): number {
  if (!Number.isFinite(squareMeters) || squareMeters < 0) {
    throw new Error(
      'Square meters must be a finite non-negative number.'
    )
  }

  return squareMeters / SQUARE_METERS_PER_HECTARE
}

export function hectaresToSquareMeters(
  hectares: number
): number {
  if (!Number.isFinite(hectares) || hectares < 0) {
    throw new Error(
      'Hectares must be a finite non-negative number.'
    )
  }

  return hectares * SQUARE_METERS_PER_HECTARE
}

export function propertyAreaToCanonicalSquareMeters(
  value: number,
  unit: PropertyAreaInputUnit
): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(
      'Property area must be a finite non-negative number.'
    )
  }

  if (unit === 'hectare') {
    return hectaresToSquareMeters(value)
  }

  return value
}

export function formatSquareMeters(
  squareMeters: number
): string {
  if (!Number.isFinite(squareMeters) || squareMeters < 0) {
    return ''
  }

  return `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2
  }).format(squareMeters)} m²`
}

export function formatHectares(
  hectares: number
): string {
  if (!Number.isFinite(hectares) || hectares < 0) {
    return ''
  }

  return `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 4
  }).format(hectares)} ha`
}