// Client-safe Hub visibility/state rule; no analytical evaluation or execution.
type PropertyOption=string|Readonly<{id?:string|number;official_code?:string|null;slug?:string;slug_en?:string|null;slug_es?:string|null}>
type HubFilters=Record<string,string|undefined>
const eligiblePropertyTypes=new Set(['1115','1116','1120','1119'])
export function hasRoomEligiblePropertyType(ids:readonly string[]):boolean {
 return ids.some(id=>eligiblePropertyTypes.has(id))
}
export function hubRoomFiltersVisible(selection:string|undefined,options:readonly PropertyOption[]=[]):boolean {
 if(!selection)return false
 const ids=selection.split(',').flatMap(value=>{
  if(eligiblePropertyTypes.has(value))return [value]
  const matches=options.filter((o):o is Exclude<PropertyOption,string>=>typeof o==='object'&&[o.official_code,o.slug,o.slug_en,o.slug_es].some(v=>typeof v==='string'&&v===value))
  if(matches.length!==1)return []
  const id=matches[0].id
  return typeof id==='string'||typeof id==='number'&&Number.isSafeInteger(id)?[String(id)]:[]
 })
 return hasRoomEligiblePropertyType(ids)
}
export function normalizeHubRoomFilters(filters:HubFilters,options:readonly PropertyOption[]=[],prefixes:readonly string[]=['']):HubFilters {
 let next:HubFilters|undefined
 for(const prefix of prefixes)if(!hubRoomFiltersVisible(filters[`${prefix}property_type`],options)){
  for(const key of ['bedrooms','bathrooms'])if(`${prefix}${key}` in filters){next??={...filters};delete next[`${prefix}${key}`]}
 }
 return next??filters
}
