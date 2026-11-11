// Browser-safe presentation/request contract. Analytical implementation is server-only.
export const VALUATION_ENGINE = 'property-price-valuation' as const
export type Dimension = 'bedrooms'|'bathrooms'|'parking'|'year_built'|'construction_land'|'environment'|'terrain'|'utility'|'accessibility'|'legal_status'
export type Level = 'province'|'canton'|'district'
export type Label = {en:string;es:string}
export type Option = Label & {id:number;type:string;parentId:number|null;slug:string}
export type HypotheticalSubject = {
  kind:'hypothetical'; transaction:'sale'|'rent'
  province:number; canton:number; district:number|null
  propertyType:number; propertyArea:number; constructionArea:number|null
  characteristics:Partial<Record<Exclude<Dimension,'construction_land'>,number>>
  askingPrice:{amount:number;currency:'CRC'|'USD'}|null
}
export type Question = {
  subject:{kind:'listing';listingId:string}|HypotheticalSubject
  geographyLevel:Level; normalization:'land'|'construction'; activeDimensions:Dimension[]
}
export type Peer = {id:string;title:string;transaction:'sale'|'rent';propertyArea:number;constructionArea:number|null;priceCrc:number|null;originalPrice:number|null;currency:'CRC'|'USD'|null}
export type Statistics = {minimum:number|null;p10:number|null;p25:number|null;median:number|null;average:number|null;p75:number|null;p90:number|null;maximum:number|null;iqr:number|null}
export type Result = {
  engine:typeof VALUATION_ENGINE; schemaVersion:1; questionIdentity:string
  subject:{kind:'listing'|'hypothetical';listingId:string|null;title:string;propertyArea:number;constructionArea:number|null;askingPriceCrc:number|null;originalPrice:number|null;currency:'CRC'|'USD'|null}
  population:{transaction:'sale'|'rent';propertyBasis:'land_only'|'improved_property';normalization:'land'|'construction';geography:Label;geographyLevel:Level;propertyType:Label;propertyAreaRange:string;constructionAreaRange:string|null;constraints:Array<{dimension:Dimension;label:Label}>;subjectExcluded:true}
  structuralComparablePopulationN:number;totalPricePopulationN:number
  exclusions:{missingAmount:number;invalidAmount:number;unsupportedCurrency:number}
  trail:Array<{dimension:Dimension;beforeCount:number;afterCount:number}>
  outcome:'complete'|'distribution_only'|'no_structural_peers'|'no_eligible_prices'
  statistics:Statistics
  position:null|{belowCount:number;equalCount:number;aboveCount:number;percentilePosition:number;difference:number;percentDifference:number;interval:string;tail:null|{thresholdPercentile:10|90;thresholdPrice:number;differenceFromThreshold:number;percentDifferenceFromThreshold:number}}
  peers:Peer[];currency:'CRC';unit:'total_asking_price'|'monthly_asking_price';analyticalDate:string
  fx:null|{rate:number;effectiveDate:string;analyticalDate:string;source:'BCCR';rateType:'reference_sale';resolutionMode:'exact'|'latest_applicable_prior_observation'}
  methodology:'linear_interpolation_n_minus_1_p';completeness:{complete:true;snapshotGuaranteed:false}
}
export type Response = {ok:true;result:Result}|{ok:false;code:'authentication_required'|'entitlement_required'|'invalid_question'|'subject_unavailable'|'insufficient_evidence'|'incomplete_evidence'|'execution_failed'}
export type CatalogResponse = {ok:true;options:Option[]}|{ok:false}
