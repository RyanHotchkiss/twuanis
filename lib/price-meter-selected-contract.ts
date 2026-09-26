// Browser-safe command identity only. No analytical methodology.
export const PRICE_METER_ENGINES=['distribution','geography','property-area','construction-area','construction-land'] as const
export type SelectedPriceMeterEngine=typeof PRICE_METER_ENGINES[number]
export function validateSelectedPriceMeterEngines(value:unknown):readonly SelectedPriceMeterEngine[]{
 if(!Array.isArray(value)||value.length<1||value.length>5||new Set(value).size!==value.length||value.some(v=>!PRICE_METER_ENGINES.includes(v)))throw Error('Select explicit bounded PPM2 engines.')
 return Object.freeze(PRICE_METER_ENGINES.filter(k=>value.includes(k)))
}
