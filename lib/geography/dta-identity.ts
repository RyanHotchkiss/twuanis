import {
  DtaResolutionError, GEO_TYPES, validateOfficialCode,
  type GeoType, type OfficialCode, type NonEmpty, type ValidatedGeographicRequest,
} from './dta-request';

declare const idBrand: unique symbol;
export type OntologyTermId = string & { readonly [idBrand]: 'ontology-term-id' };
export type GeographicEntity<T extends GeoType, L extends 1 | 2 | 3> = Readonly<{
  officialCode: OfficialCode<T>;
  ontologyTermId: OntologyTermId;
  termType: T;
  level: L;
  parentOntologyTermId: T extends 'province' ? OntologyTermId | null : OntologyTermId;
}>;
export type ProvinceEntity = GeographicEntity<'province', 1>;
export type CantonEntity = GeographicEntity<'canton', 2>;
export type DistrictEntity = GeographicEntity<'district', 3>;
export type CanonicalGeographicEntity = ProvinceEntity | CantonEntity | DistrictEntity;
export type ResolvedGeographicRequest = Readonly<{
  province?: NonEmpty<ProvinceEntity>;
  canton?: NonEmpty<CantonEntity>;
  district?: NonEmpty<DistrictEntity>;
}>;

export function validateOntologyTermId(value: unknown): OntologyTermId {
  if (typeof value !== 'string' || value.length > 20 ||
      !/^(0|[1-9][0-9]*|-[1-9][0-9]*)$/.test(value) || /\s/.test(value)) {
    throw new DtaResolutionError('INVALID_ONTOLOGY_ID');
  }
  const integer = BigInt(value);
  if (integer < BigInt('-9223372036854775808') || integer > BigInt('9223372036854775807')) {
    throw new DtaResolutionError('INVALID_ONTOLOGY_ID');
  }
  return value as OntologyTermId;
}

export function validateGeographicRow(raw: unknown, expectedType: GeoType): CanonicalGeographicEntity {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new DtaResolutionError('INCOMPLETE_RESOLUTION');
  }
  const row = raw as Record<string, unknown>;
  if (row.term_type !== expectedType) throw new DtaResolutionError('WRONG_TYPE');
  const level = { province: 1, canton: 2, district: 3 }[expectedType];
  if (row.level !== level) throw new DtaResolutionError('WRONG_LEVEL');
  const ontologyTermId = validateOntologyTermId(row.id);
  const parentOntologyTermId = row.parent_id === null && expectedType === 'province'
    ? null : validateOntologyTermId(row.parent_id);
  return Object.freeze({
    officialCode: validateOfficialCode(expectedType, row.official_code),
    ontologyTermId, termType: expectedType, level, parentOntologyTermId,
  }) as CanonicalGeographicEntity;
}

// These exact codes are dictionary verification inputs, never implicit selected filters.
export function geographicLookupCodes(request: ValidatedGeographicRequest): readonly string[] {
  const codes = new Set<string>();
  for (const type of GEO_TYPES) {
    for (const code of request[type] ?? []) {
      codes.add(code);
      if (type !== 'province') codes.add(code.slice(0, 1));
      if (type === 'district') codes.add(code.slice(0, 3));
    }
  }
  return Object.freeze([...codes].sort());
}

export function resolveGeographicRows(
  request: ValidatedGeographicRequest, lookupCodes: readonly string[], rows: unknown, count: number | null,
): ResolvedGeographicRequest {
  if (!Array.isArray(rows) || !Number.isSafeInteger(count) || count !== rows.length) {
    throw new DtaResolutionError('INCOMPLETE_RESOLUTION');
  }
  const expected = new Set(lookupCodes);
  const entities = new Map<string, CanonicalGeographicEntity>();
  const ids = new Set<OntologyTermId>();
  for (const raw of rows) {
    const code: unknown = raw && typeof raw === 'object' ? raw.official_code : undefined;
    if (typeof code !== 'string' || !expected.has(code)) throw new DtaResolutionError('INCOMPLETE_RESOLUTION');
    const type: GeoType = code.length === 1 ? 'province' : code.length === 3 ? 'canton' : 'district';
    const entity = validateGeographicRow(raw, type);
    if (entities.has(code) || ids.has(entity.ontologyTermId)) throw new DtaResolutionError('DUPLICATE_ENTITY');
    entities.set(code, entity);
    ids.add(entity.ontologyTermId);
  }
  if (entities.size !== expected.size) throw new DtaResolutionError('UNKNOWN_CODE');
  for (const entity of entities.values()) {
    if (entity.termType === 'province') continue;
    const parentCode = entity.officialCode.slice(0, entity.termType === 'canton' ? 1 : 3);
    const parent = entities.get(parentCode);
    if (!parent || entity.parentOntologyTermId !== parent.ontologyTermId) {
      throw new DtaResolutionError('HIERARCHY_CONFLICT');
    }
  }
  const provinces = new Set<string>(request.province);
  const cantons = new Set<string>(request.canton);
  for (const code of request.canton ?? []) {
    if (request.province && !provinces.has(code.slice(0, 1))) throw new DtaResolutionError('HIERARCHY_CONFLICT');
  }
  for (const code of request.district ?? []) {
    if ((request.canton && !cantons.has(code.slice(0, 3))) ||
        (request.province && !provinces.has(code.slice(0, 1)))) throw new DtaResolutionError('HIERARCHY_CONFLICT');
  }
  const result: Partial<Record<GeoType, readonly CanonicalGeographicEntity[]>> = {};
  for (const type of GEO_TYPES) {
    if (request[type]) result[type] = Object.freeze(request[type].map(code => entities.get(code)!));
  }
  return Object.freeze(result) as ResolvedGeographicRequest;
}
