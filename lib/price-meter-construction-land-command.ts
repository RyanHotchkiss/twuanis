import 'server-only'
export function validateConstructionLandNormalization(value:unknown):'land'|'construction' {
  if(value!=='land'&&value!=='construction')throw Error('Select one Construction-to-Land Price / m² normalization.')
  return value
}
