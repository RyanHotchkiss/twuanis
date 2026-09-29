// Browser-safe command identity only. No analytical methodology.
export const PRICE_METER_ENGINES=['distribution','geography','property-area','construction-area','construction-land'] as const
export type SelectedPriceMeterEngine=typeof PRICE_METER_ENGINES[number]
export function validateSelectedPriceMeterEngines(value:unknown):readonly SelectedPriceMeterEngine[]{
 if(!Array.isArray(value)||value.length<1||value.length>5||new Set(value).size!==value.length||value.some(v=>!PRICE_METER_ENGINES.includes(v)))throw Error('Select explicit bounded PPM2 engines.')
 return Object.freeze(PRICE_METER_ENGINES.filter(k=>value.includes(k)))
}

// Explicit command identity, safe for input controls. Server dispatch owns its meaning.
export type PriceMeterDistributionIdentity =
 | {propertyBasis:'land_only';normalizationBasis:'land'}
 | {propertyBasis:'improved_property';normalizationBasis:'land'|'construction'}
export function validateDistributionIdentity(value:unknown):PriceMeterDistributionIdentity {
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Select a Price / m² definition.')
 const v=value as Record<string,unknown>
 if(Object.keys(v).some(k=>!['propertyBasis','normalizationBasis'].includes(k))||
 !((v.propertyBasis==='land_only'&&v.normalizationBasis==='land')||
 (v.propertyBasis==='improved_property'&&(v.normalizationBasis==='land'||v.normalizationBasis==='construction'))))throw Error('Invalid Price / m² definition.')
 return Object.freeze({propertyBasis:v.propertyBasis,normalizationBasis:v.normalizationBasis}) as PriceMeterDistributionIdentity
}
