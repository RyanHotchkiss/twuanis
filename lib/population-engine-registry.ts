import 'server-only'
import type {AnalyticalCapability} from './package-capability-authorization'
// Existing execution identities, including the homepage's historical aliases.
export const POPULATION_ENGINES = [
 ['summary','explorer','Market Summary','cap-market-summary','getMarketSummary','inventory'],
 ['composition','composition','Market Composition','cap-market-composition','getMarketComposition','inventory'],
 ['market-asking-price-distribution','asking-price','Market Asking Price Distribution','cap-market-asking-price-distribution','executeAskingPrice','asking_price'],
 ['matching','matching','Property Matching','cap-property-matching','getMarketMatches','inventory'],
 ['comparison','comparison','Market Comparison','cap-market-comparison','getMarketComparison','inventory'],
 ['configuration','scarcity','Property Configuration Frequency','cap-property-configuration-frequency','getMarketScarcity','inventory'],
 ['distribution','price-meter','Price / m² Distribution','cap-price-m2-distribution','buildPriceMeterDistribution','ppm2'],
 ['geography','geography','Geographic Price / m² Comparison','cap-geographic-price-m2-comparison','buildPriceMeterGeographicStatistics','ppm2'],
 ['size','size','Size → Price / m²','cap-size-price-m2','buildPriceMeterDescriptiveSizeRelationshipResult','ppm2'],
 ['construction-land','construction-land','Construction-to-Land → Price / m²','cap-construction-land-price-m2','buildSelectedConstructionLand','ppm2'],
 ['cohort-comparison','cohort-comparison','User-Defined Cohort Price / m² Comparison','cap-user-defined-cohort-price-m2-comparison','buildPriceMeterComparisonAnalysis','ppm2'],
 ['cross-dimensional','cross-dimensional','Cross-Dimensional Analysis','cap-cross-dimensional-analysis','analyzePriceMeterCrossDimensionalRelationship','ppm2'],
 ['discovery','discovery','Comparative Price / m² Discovery','cap-comparative-price-m2-discovery','analyzePhase14Population','ppm2'],
 ['position','position','Property Price / m² Position','cap-property-price-m2-position','executePropertyPositionWithWorkingEvidence','ppm2'],
 ['comparables','comparables','User-Defined Comparable Cohort','cap-user-defined-comparable-cohort','runPriceMeterComparableEngine','ppm2'],
 ['asking-area-ratio','asking-area-ratio','Construction Area-to-Property Area Asking-Price Relationship Ratio','cap-asking-area-coefficient-ratio','analyzeAreaRatio','ppm2'],
 ['weighted-price','weighted-price','Weighted Price / m²','cap-weighted-price-m2','analyzeWeightedPrice','ppm2'],
] as const satisfies readonly (readonly [string,string,string,AnalyticalCapability,string,'inventory'|'asking_price'|'ppm2'])[]
export type PopulationEngineId=typeof POPULATION_ENGINES[number][0]
export function populationEngine(id:PopulationEngineId){const engine=POPULATION_ENGINES.find(e=>e[0]===id);if(!engine)throw Error('Unknown analytical engine.');return engine}
