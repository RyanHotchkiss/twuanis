// Browser-safe identity validation. No database or analytical imports.
declare const codeBrand: unique symbol;
export type GeoType = 'province' | 'canton' | 'district';
export type NonEmpty<T> = readonly [T, ...T[]];
export type OfficialCode<T extends GeoType> = string & { readonly [codeBrand]: T };
export type ProvinceOfficialCode = OfficialCode<'province'>;
export type CantonOfficialCode = OfficialCode<'canton'>;
export type DistrictOfficialCode = OfficialCode<'district'>;
export type RawGeographicRequest = Readonly<{ province?: unknown; canton?: unknown; district?: unknown }>;
export type ValidatedGeographicRequest = Readonly<{
  [T in GeoType]?: NonEmpty<OfficialCode<T>>;
}>;

// Execution safety only; not a permanent product limit on geographic selections.
export const MAX_DTA_REQUEST_SELECTIONS = 25;
export const GEO_TYPES = ['province', 'canton', 'district'] as const;
export type DtaFailureCode =
  | 'INVALID_REQUEST' | 'MALFORMED_CODE' | 'REQUEST_TOO_LARGE'
  | 'UNKNOWN_CODE' | 'WRONG_TYPE' | 'WRONG_LEVEL' | 'HIERARCHY_CONFLICT'
  | 'DUPLICATE_ENTITY' | 'INVALID_ONTOLOGY_ID' | 'RESOLUTION_UNAVAILABLE'
  | 'INCOMPLETE_RESOLUTION' | 'EMPTY_SELECTION';
export class DtaResolutionError extends Error {
  constructor(public readonly code: DtaFailureCode) {
    super(code);
    this.name = 'DtaResolutionError';
  }
}

export function validateOfficialCode<T extends GeoType>(type: T, value: unknown): OfficialCode<T> {
  const length = { province: 1, canton: 3, district: 5 }[type];
  if (typeof value !== 'string' || value.length !== length || !/^[0-9]+$/.test(value)) {
    throw new DtaResolutionError('MALFORMED_CODE');
  }
  return value as OfficialCode<T>;
}

export function validateGeographicRequest(input: unknown): ValidatedGeographicRequest {
  if (!input || typeof input !== 'object' ||
      (Object.getPrototypeOf(input) !== Object.prototype && Object.getPrototypeOf(input) !== null)) {
    throw new DtaResolutionError('INVALID_REQUEST');
  }
  const keys = Reflect.ownKeys(input);
  if (keys.some(key => typeof key !== 'string' || !GEO_TYPES.includes(key as GeoType))) {
    throw new DtaResolutionError('INVALID_REQUEST');
  }
  const values: Partial<Record<GeoType, readonly unknown[]>> = {};
  let supplied = 0;
  for (const type of GEO_TYPES) {
    const descriptor = Object.getOwnPropertyDescriptor(input, type);
    // Do not execute accessors at the untrusted boundary.
    if (descriptor && !('value' in descriptor)) throw new DtaResolutionError('INVALID_REQUEST');
    const value: unknown = descriptor?.value;
    if (value === undefined) continue;
    const items: readonly unknown[] = Array.isArray(value) ? value : [value];
    if (!items.length) throw new DtaResolutionError('EMPTY_SELECTION');
    supplied += items.length;
    if (supplied > MAX_DTA_REQUEST_SELECTIONS) throw new DtaResolutionError('REQUEST_TOO_LARGE');
    values[type] = items;
  }
  const result: Partial<Record<GeoType, readonly string[]>> = {};
  for (const type of GEO_TYPES) {
    const items = values[type];
    if (items) {
      // Array.from visits sparse entries too: holes must not become omitted restrictions.
      const codes = Array.from(items, value => validateOfficialCode(type, value));
      result[type] = Object.freeze([...new Set(codes)].sort());
    }
  }
  return Object.freeze(result) as ValidatedGeographicRequest;
}
