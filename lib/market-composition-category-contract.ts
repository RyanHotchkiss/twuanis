// Client-safe identities and presentation metadata only. Numerical predicates stay server-only.
export type CompositionNumericalDimension = 'bedrooms' | 'bathrooms' | 'parking' | 'year_built'
export type CompositionNumericalCategory = Readonly<{
  termId: string
  dimension: CompositionNumericalDimension
  descriptor: string
  label: Readonly<{en: string; es: string}>
}>
export const COMPOSITION_NUMERICAL_CATEGORIES: readonly CompositionNumericalCategory[] = Object.freeze([
  Object.freeze({termId:"1121",dimension:"bedrooms",descriptor:"studio",label:Object.freeze({en:"Studio",es:"Estudio"})}),
  Object.freeze({termId:"1122",dimension:"bedrooms",descriptor:"1-bedroom",label:Object.freeze({en:"1 Bedroom",es:"1 Habitación"})}),
  Object.freeze({termId:"1123",dimension:"bedrooms",descriptor:"2-bedrooms",label:Object.freeze({en:"2 Bedrooms",es:"2 Habitaciones"})}),
  Object.freeze({termId:"1124",dimension:"bedrooms",descriptor:"3-bedrooms",label:Object.freeze({en:"3 Bedrooms",es:"3 Habitaciones"})}),
  Object.freeze({termId:"1125",dimension:"bedrooms",descriptor:"4-bedrooms",label:Object.freeze({en:"4 Bedrooms",es:"4 Habitaciones"})}),
  Object.freeze({termId:"1126",dimension:"bedrooms",descriptor:"5-plus-bedrooms",label:Object.freeze({en:"5+ Bedrooms",es:"5+ Habitaciones"})}),
  Object.freeze({termId:"1127",dimension:"bathrooms",descriptor:"1-bathroom",label:Object.freeze({en:"1 Bathroom",es:"1 Baño"})}),
  Object.freeze({termId:"1128",dimension:"bathrooms",descriptor:"2-bathrooms",label:Object.freeze({en:"2 Bathrooms",es:"2 Baños"})}),
  Object.freeze({termId:"1129",dimension:"bathrooms",descriptor:"3-bathrooms",label:Object.freeze({en:"3 Bathrooms",es:"3 Baños"})}),
  Object.freeze({termId:"1130",dimension:"bathrooms",descriptor:"4-bathrooms",label:Object.freeze({en:"4 Bathrooms",es:"4 Baños"})}),
  Object.freeze({termId:"1131",dimension:"bathrooms",descriptor:"5-plus-bathrooms",label:Object.freeze({en:"5+ Bathrooms",es:"5+ Baños"})}),
  Object.freeze({termId:"1132",dimension:"parking",descriptor:"no-parking",label:Object.freeze({en:"No Parking",es:"Sin Estacionamiento"})}),
  Object.freeze({termId:"1133",dimension:"parking",descriptor:"1-vehicle",label:Object.freeze({en:"1 Vehicle",es:"1 Vehículo"})}),
  Object.freeze({termId:"1134",dimension:"parking",descriptor:"2-vehicles",label:Object.freeze({en:"2 Vehicles",es:"2 Vehículos"})}),
  Object.freeze({termId:"1135",dimension:"parking",descriptor:"3-vehicles",label:Object.freeze({en:"3 Vehicles",es:"3 Vehículos"})}),
  Object.freeze({termId:"1136",dimension:"parking",descriptor:"4-plus-vehicles",label:Object.freeze({en:"4+ Vehicles",es:"4+ Vehículos"})}),
  Object.freeze({termId:"1137",dimension:"year_built",descriptor:"pre-1980",label:Object.freeze({en:"Pre-1980",es:"Antes de 1980"})}),
  Object.freeze({termId:"1138",dimension:"year_built",descriptor:"1980s",label:Object.freeze({en:"1980s",es:"Década de 1980"})}),
  Object.freeze({termId:"1139",dimension:"year_built",descriptor:"1990s",label:Object.freeze({en:"1990s",es:"Década de 1990"})}),
  Object.freeze({termId:"1140",dimension:"year_built",descriptor:"2000s",label:Object.freeze({en:"2000s",es:"Década de 2000"})}),
  Object.freeze({termId:"1141",dimension:"year_built",descriptor:"2010s",label:Object.freeze({en:"2010s",es:"Década de 2010"})}),
  Object.freeze({termId:"1142",dimension:"year_built",descriptor:"2020-plus",label:Object.freeze({en:"2020+",es:"2020+"})}),
])
