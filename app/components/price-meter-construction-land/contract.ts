export type Normalization='land'|'construction'
export const constructionLandQuestion={en:'How does Price / m² vary with the Construction-to-Land ratio in the defined Costa Rica real estate market?',es:'¿Cómo varía el precio por m² con la relación construcción/terreno en el mercado inmobiliario definido de Costa Rica?'}
export type Context={normalizationBasis:Normalization;propertyBasis:'improved_property';transactionType:'sale'|'rent';analyticalCurrency:'CRC';analyticalDate:string;marketListingCount:number;fx:{rate:number;source:string;effectiveDate:string;rateType:string;resolutionMode:string}|null}
export type ConstructionLandEvidence={
 context:Context;normalizationBasis:Normalization;
 cohorts:{definition:{key:string;minimumExclusive:number|null;minimumInclusive:number|null;maximumExclusive:number|null;label:string};n:number;medianExactRatio:number|null;medianPricePerM2:number|null}[];
 relationship:{normalizationBasis:Normalization;coordinates:{constructionToLandRatio:number;normalizedPricePerM2:number;observationCount:number}[];spearmanRho:number|null;evidence:{populatedCohortCount:number;representedObservationCount:number;hasSufficientEvidence:boolean;requiredPopulatedCohortCount:3;requiredObservationCount:12}}
}
