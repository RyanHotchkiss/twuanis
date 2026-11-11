/** Preserve previously accepted display-label inputs for the existing1155 identity.
 * Transport compatibility only: current labels and numerical eligibility remain canonical.
 */
type AreaOption = Readonly<{id?:unknown;term_type?:unknown;slug?:unknown;slug_en?:unknown;slug_es?:unknown}>
export function preservedAreaFilterAlias(value:string,options:readonly AreaOption[]):string|undefined {
 if(value!=='>5 Hectares'&&value!=='>5 Hectáreas')return undefined
 const term=options.find(option=>String(option.id)==='1155'&&option.term_type==='property_area'&&
  option.slug==='over-5-hectares'&&option.slug_en==='over-5-hectares'&&option.slug_es==='mas-de-5-hectareas')
 return term?'over-5-hectares':undefined
}
