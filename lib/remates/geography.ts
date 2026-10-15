// Lossless transport of existing canonical reference IDs; no name matching or shadow dictionary.
export const canonicalId=(v:unknown):v is string=>typeof v==='string'&&/^[1-9][0-9]{0,18}$/.test(v)&&BigInt(v)<=BigInt('9223372036854775807')
export type ReferenceDimension='province'|'canton'|'district'|'property_type'|'utility'|'environment'|'terrain'|'accessibility'|'legal_status'|'property_area'|'construction_area'|'bedrooms'|'bathrooms'|'parking'|'year_built'
export const referenceDimensions:ReferenceDimension[]=['province','canton','district','property_type','utility','environment','terrain','accessibility','legal_status','property_area','construction_area','bedrooms','bathrooms','parking','year_built']
