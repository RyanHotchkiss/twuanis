import {hubUniverse} from '@/lib/hub-universe-contract'
import {context,emit,interactionKey} from './runtime'
import type {EventPayloads} from './types'
function interestKind(kind:string){return kind+'_'+(typeof location!=='undefined'?hubUniverse(new URLSearchParams(location.search))?.toLowerCase()??'unknown':'unknown')}
type Engine=EventPayloads['tw_config_commit']['engine_id']
const aliases:Record<string,Engine>={explorer:'summary',composition:'composition','asking-price':'market-asking-price-distribution',matching:'matching',comparison:'comparison',scarcity:'configuration','price-meter':'distribution',geography:'geography',size:'size','construction-land':'construction-land','cohort-comparison':'cohort-comparison','cross-dimensional':'cross-dimensional',discovery:'discovery',position:'position',comparables:'comparables','asking-area-ratio':'asking-area-ratio','weighted-price':'weighted-price'}
export function selectCapability(alias:string,locale:'en'|'es'){const engine=aliases[alias];if(engine)emit('tw_analytics_select',{...context(locale),engine_id:engine,selection_kind:interestKind('capability_navigation')},'capability:'+interactionKey())}
export function commitConfiguration(engine:Engine,locale:'en'|'es',version:string){emit('tw_config_commit',{...context(locale),engine_id:engine,configuration_kind:engine==='weighted-price'||engine==='asking-area-ratio'?'unknown':'canonical_market',configuration_version:version},'configuration:'+interactionKey())}

export function canonicalEngineAlias(alias:string){return aliases[alias]??(Object.values(aliases).includes(alias as Engine)?alias as Engine:undefined)}

export function algorithmInterest(alias:string,locale:'en'|'es',selection_kind:'example_open'|'view_package'|'locked_card_packages',package_id?:string){
 const engine=canonicalEngineAlias(alias);if(!engine)return false
 return emit('tw_analytics_select',{...context(locale),engine_id:engine,selection_kind:interestKind(selection_kind),...package_id?{package_id}:{}},'interest:'+interactionKey())
}
