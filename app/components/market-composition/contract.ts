// Browser presentation types only; canonical acquisition and counting stay server-side.
export type CompositionResult={engine:'composition';n:number;dimensions:{dimension:string;denominatorN:number;representedN:number;unrepresentedN:number;terms:{termId:string;count:number;percentage:number|null;label:{en:string;es:string}}[]}[]}
export const compositionQuestion={en:'What characteristics compose the defined Costa Rica real estate market?',es:'¿Qué características componen el mercado inmobiliario definido de Costa Rica?'}
export const compositionLensQuestion={en:'How many listings have each characteristic, and what share of the defined Costa Rica real estate market do they represent?',es:'¿Cuántos anuncios tienen cada característica y qué porcentaje representan del mercado inmobiliario definido de Costa Rica?'}
export function dimensionLabel(key:string,language:'en'|'es'){
 const labels:Record<string,[string,string]>={province:['Province','Provincia'],canton:['Canton','Cantón'],district:['District','Distrito'],property_type:['Property type','Tipo de propiedad'],bedrooms:['Bedrooms','Dormitorios'],bathrooms:['Bathrooms','Baños'],parking:['Parking','Estacionamiento'],year_built:['Year built','Año de construcción'],utility:['Utilities','Servicios'],environment:['Environment','Entorno'],terrain:['Terrain','Terreno'],accessibility:['Accessibility','Accesibilidad'],legal_status:['Legal status','Estado legal']}
 return labels[key]?.[language==='es'?1:0]??key
}
