import type { PositionDTO } from './price-meter-property-position-browser-contract'
import type { PositionRequest } from './price-meter-property-position-request'
import type { ContextSelection,ContextKey } from './price-meter-property-difference-context-request'
export type ContextState='established'|'not_established'|'not_applicable'|'withheld'|'execution_unavailable'|'invalid_request'
export type ContextDistribution={minimum:number|null;p10:number|null;p25:number|null;median:number|null;p75:number|null;p90:number|null;maximum:number|null;iqr:number|null}
export type ContextPopulation={key:string;geography:{id:string;level:string;label:string};propertyType:{id:string;label:string};propertyArea:string;constructionArea:string;constructionLand:string|null;characteristics:{id:string;type:string;label:string}[];n:number|null;representedN:number|null;subjectIncluded:boolean|null}
export type ContextMetric={key:string;value:number|null;state:ContextState;reason:string|null;unit:string}
export type ContextGroup={key:string;label:string;n:number;subjectIncluded:boolean;coordinate:number|null;rank:number|null;distribution:ContextDistribution;difference:number|null;percentDifference:number|null;percentageReference:string|null}
export type ContextItemDTO={questionKey:ContextKey;index:number;phase:7|8|9|10;state:ContextState;reason:string|null;populations:ContextPopulation[];
 universe:null|{transactionType:'sale'|'rent';propertyBasis:'land_only'|'improved_property';normalizationBasis:'land'|'construction';unit:string;analyticalDate:string;monetaryMethod:'native_crc'|'bccr_reference_sale'};
 metrics:ContextMetric[];groups:ContextGroup[]}
export type DifferenceDTO={contractVersion:1;committedPositionRequest:PositionRequest;position:PositionDTO;selections:ContextSelection[];items:ContextItemDTO[];boundary:'independent_non_causal'}
export type ContextOption={id:number;parentId:number|null;value:string;label:string;labelEn:string|null;labelEs:string|null}
export type ContextOptions={terms:Record<string,ContextOption[]>;propertyAreas:{value:string;label:string}[];constructionAreas:{value:string;label:string}[];ratios:{value:string;label:string}[]}
