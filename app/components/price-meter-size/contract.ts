// Browser projection types and copy only; analytical identities are server-owned.
export type SizeMode = 'property-area' | 'construction-area'
export const sizeQuestion = {
 en:'How does Price / m² vary with size in the defined Costa Rica real estate market?',
 es:'¿Cómo varía el precio por m² con el tamaño en el mercado inmobiliario definido de Costa Rica?'
}
export type SizeContext = {mode:SizeMode;propertyBasis:'improved_property';normalizationBasis:'land'|'construction';transactionType:'sale'|'rent';analyticalCurrency:'CRC';analyticalDate:string;marketListingCount:number;fx:{rate:number;source:string;effectiveDate:string;rateType:string;resolutionMode:string}|null}
export type SizeEvidence = {
 population:{bands:{range:string;label:string;observationCount:number;medianExactArea:number|null;medianNormalizedRatio:number|null}[]};
 result:{evidence:{populatedBandCount:number;representedObservationCount:number;hasSufficientBandEvidence:boolean};spearmanRho:number|null;regression:{alpha:number;beta:number;rSquared:number|null}|null}
}
