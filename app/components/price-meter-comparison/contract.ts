import type {PriceMeterComparisonRequest} from '@/lib/price-meter-comparison-request'
import type {PriceMeterFxIdentity} from '@/lib/price-meter-identity'
export const cohortQuestion={en:'How does median Price / m² differ between two user-defined property cohorts?',es:'¿Cómo difiere la mediana del precio por m² entre dos cohortes de propiedades definidas por el usuario?'}
export const cohortTitle={en:'User-Defined Cohort Price / m² Comparison',es:'Comparación de precio por m² entre cohortes definidas por el usuario'}
export const characteristicTypes=['bedrooms','bathrooms','parking','year_built','environment','terrain','utility','accessibility','legal_status'] as const
export const cohortFields=['province','canton','district','property_type','characteristic_1_type','characteristic_1','characteristic_2_type','characteristic_2','property_area','construction_area','construction_land_cohort'] as const
export const comparisonKeys=['transaction_type','property_basis','normalization_basis','reference_cohort',...['a','b'].flatMap(p=>cohortFields.map(k=>`${p}_${k}`))]
export function comparisonSnapshot(input:Record<string,string|undefined>){return Object.fromEntries(comparisonKeys.flatMap(k=>input[k]?[[k,input[k]]]:[])) as Record<string,string|undefined>}
export type CohortResult={
 request:PriceMeterComparisonRequest;
 analyticalIdentity:{transactionType:'sale'|'rent';propertyBasis:'land_only'|'improved_property';normalizationBasis:'land'|'construction';analyticalCurrency:'CRC';analyticalDate:string};
 fx:PriceMeterFxIdentity|null;
 geography:{A:Label[];B:Label[]};
 evidence:{minimumSampleSize:number;cohortA:{sampleSize:number;sufficient:boolean};cohortB:{sampleSize:number;sufficient:boolean};comparisonSufficient:boolean};
 medianDifference:{cohortAMedian:number|null;cohortBMedian:number|null;absoluteDifference:number|null;percentageDifference:number|null;referenceCohort:'A'|'B'}
}
export type Label={id:number;term_name:string;term_name_en:string|null;term_name_es:string|null}
