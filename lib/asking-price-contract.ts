// Browser-safe engine vocabulary. No acquisition or analytical imports.
export const ENGINE = 'market-asking-price-distribution' as const
export const SEMANTICS = ['environment','terrain','utility','accessibility','legal_status'] as const
export const FACTS = ['bedrooms','bathrooms','parking','year_built'] as const
export type Semantic = typeof SEMANTICS[number]
export type Fact = typeof FACTS[number]
export type Interval = {lower:string|null;upper:string|null;lowerInclusive:boolean;upperInclusive:boolean}
export type Constraint = {kind:'exact';value:string}|{kind:'category';termId:string}|{kind:'interval';interval:Interval}
export type Question = {version:1;transaction:'sale'|'rent';geography:{level:'province'|'canton'|'district';officialCode:string};propertyType?:string;
  filters:{semantics:Partial<Record<Semantic,string[]>>;facts:Partial<Record<Fact,Constraint[]>>;propertyArea?:string;constructionArea?:string}}
export type Label = {en:string;es:string}
export type Option = Label & {id:string;type:string;code:string|null;parentId:string|null}
export type Catalog = {state:'ready';options:Option[]}|{state:'unavailable'}
export type Statistics = {minimum:number|null;p10:number|null;p25:number|null;median:number|null;average:number|null;p75:number|null;p90:number|null;maximum:number|null;iqr:number|null}
export type Fx = {baseCurrency:'USD';quoteCurrency:'CRC';rate:number;rateType:'reference_sale';source:'BCCR';analyticalDate:string;effectiveDate:string;resolutionMode:'exact'|'latest_applicable_prior_observation'}
export type Result = {schemaVersion:1;engine:typeof ENGINE;question:Question;questionIdentity:string;labels:Record<string,Label>;
  outcome:'complete'|'empty_market'|'no_eligible_prices';marketPopulation:number;askingPricePopulation:number;
  exclusions:{missingAmount:number;invalidAmount:number;unsupportedCurrency:number};currency:'CRC';unit:'total_asking_price'|'monthly_asking_price';
  analyticalDate:string;fx:Fx|null;methodology:'linear_interpolation_n_minus_1_p';statistics:Statistics;
  completeness:{complete:true;snapshotGuaranteed:false}}
export type Response = {ok:true;result:Result}|{ok:false;code:'invalid_question'|'execution_failed'}
