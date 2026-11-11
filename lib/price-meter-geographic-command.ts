// Browser-safe input contract. Canonical resolution remains server-owned.
import {priceMeterFilterConfiguration} from './price-meter-apply-contract'
import {validateDistributionIdentity,type PriceMeterDistributionIdentity} from './price-meter-selected-contract'
export type GeographicCommand = Readonly<{definition:PriceMeterDistributionIdentity;comparisonLevel:'province'|'canton'|'district'}>
export function validateGeographicCommand(value:unknown):GeographicCommand {
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Select a geographic comparison.')
 const v=value as Record<string,unknown>
 if(Object.keys(v).some(k=>!['definition','comparisonLevel'].includes(k))||!['province','canton','district'].includes(v.comparisonLevel as string))throw Error('Invalid geographic comparison.')
 return Object.freeze({definition:validateDistributionIdentity(v.definition),comparisonLevel:v.comparisonLevel as GeographicCommand['comparisonLevel']})
}
export function validateGeographicApply(value:unknown,command:GeographicCommand){
 const c=validateGeographicCommand(command),f=priceMeterFilterConfiguration(value)
 if(!f.property_type?.trim()||!['sale','rent'].includes(f.transaction_type??''))throw Error('Transaction and Property Type are required.')
 if(f.district||c.comparisonLevel==='province'&&(f.province||f.canton)||c.comparisonLevel==='canton'&&(!f.province||f.canton)||c.comparisonLevel==='district'&&(!f.province||!f.canton))throw Error('Incompatible geographic boundary.')
 for(const key of ['province','canton'] as const)if(f[key]&&!/^(?:[0-9]+|[a-z0-9-]+)$/.test(f[key]!))throw Error('One canonical boundary is required.')
 return f
}
