// Browser-safe numerical input vocabulary; never an ontology or analytical executor.
export type BathroomConstraint = {kind:'exact';value:string}|{kind:'category';termId:string}|{kind:'interval';lower:string|null;upper:string|null;lowerInclusive:boolean;upperInclusive:boolean}
export type BathroomInput = BathroomConstraint|{kind:'clear'}|{kind:'missing'}
export const BATHROOM_CATEGORY_IDS=['1127','1128','1129','1130','1131'] as const
export const BATHROOM_EXACT_PRESETS=['1','1.5','2','2.5','3','3.5','4','4.5'] as const
export function bathroomDecimal(v:unknown):string{
 if(typeof v!=='string'||v.length>128||!/^\d+(?:\.\d+)?$/.test(v))throw Error('Invalid exact Bathroom count')
 const [w,f='']=v.split('.'),whole=w.replace(/^0+(?=\d)/,''),fraction=f.replace(/0+$/,'');return whole+(fraction?'.'+fraction:'')
}
export function compareBathroomDecimals(a:string,b:string):number{
 const [aw,af='']=bathroomDecimal(a).split('.'),[bw,bf='']=bathroomDecimal(b).split('.')
 if(aw.length!==bw.length)return aw.length<bw.length?-1:1
 const n=Math.max(af.length,bf.length),x=af.padEnd(n,'0'),y=bf.padEnd(n,'0');return aw<bw?-1:aw>bw?1:x<y?-1:x>y?1:0
}
function keys(x:Record<string,unknown>,allowed:string[]){if(Object.keys(x).some(k=>!allowed.includes(k)))throw Error('Unexpected Bathroom input field')}
export function validateBathroomConstraint(input:unknown):BathroomConstraint{
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Typed Bathroom constraint required')
 const x=input as Record<string,unknown>
 if(x.kind==='exact'){keys(x,['kind','value']);const value=bathroomDecimal(x.value);if(value==='0')throw Error('Canonical exact Bathrooms must be greater than zero');return {kind:'exact',value}}
 if(x.kind==='category'){keys(x,['kind','termId']);if(typeof x.termId!=='string'||!BATHROOM_CATEGORY_IDS.some(id=>id===x.termId))throw Error('Unknown Bathroom category');return {kind:'category',termId:x.termId}}
 if(x.kind!=='interval')throw Error('Unknown Bathroom constraint kind')
 keys(x,['kind','lower','upper','lowerInclusive','upperInclusive'])
 const lower=x.lower===null?null:bathroomDecimal(x.lower),upper=x.upper===null?null:bathroomDecimal(x.upper)
 if(typeof x.lowerInclusive!=='boolean'||typeof x.upperInclusive!=='boolean'||lower===null&&x.lowerInclusive||upper===null&&x.upperInclusive||lower===null&&upper===null||lower!==null&&upper!==null&&(compareBathroomDecimals(lower,upper)>0||compareBathroomDecimals(lower,upper)===0&&!(x.lowerInclusive&&x.upperInclusive)))throw Error('Invalid explicit Bathroom interval')
 return {kind:'interval',lower,upper,lowerInclusive:x.lowerInclusive,upperInclusive:x.upperInclusive}
}
export function encodeBathroomSelection(alternatives:readonly BathroomConstraint[]):string{
 if(alternatives.length===0)return ''
 if(alternatives.length>25)throw Error('Too many Bathroom alternatives')
 const values=alternatives.map(validateBathroomConstraint);if(new Set(values.map(v=>JSON.stringify(v))).size!==values.length)throw Error('Duplicate Bathroom alternative')
 const encoded='bn1:'+encodeURIComponent(JSON.stringify({version:1,alternatives:values}));if(encoded.length>4096)throw Error('Bathroom selection is too large');return encoded
}
export function isTypedBathroomSelection(value:unknown):boolean{return typeof value==='string'&&/^bn\d*:/.test(value)}
export function decodeBathroomSelection(value:string):BathroomConstraint[]{
 if(!value.startsWith('bn1:')||value.length>4096)throw Error('Unsupported Bathroom selection version')
 const body=JSON.parse(decodeURIComponent(value.slice(4)));if(!body||body.version!==1||!Array.isArray(body.alternatives)||body.alternatives.length===0)throw Error('Invalid Bathroom selection')
 keys(body,['version','alternatives']);const values=body.alternatives.map(validateBathroomConstraint);encodeBathroomSelection(values);return values
}
export function bathroomConstraintLabel(c:BathroomConstraint,language:'en'|'es'):string{
 const number=(v:string)=>language==='es'?v.replace('.',','):v,unit=language==='es'?'Baños':'Bathrooms'
 if(c.kind==='exact')return `${number(c.value)} ${unit}`
 if(c.kind==='category')return `${c.termId==='1131'?'5+':({'1127':'1','1128':'2','1129':'3','1130':'4'} as Record<string,string>)[c.termId]} ${unit} (${language==='es'?'categoría':'category'})`
 return `${c.lowerInclusive?'[':'('}${c.lower===null?'−∞':number(c.lower)}; ${c.upper===null?'+∞':number(c.upper)}${c.upperInclusive?']':')'} ${unit}`
}
export function bathroomSelectionLabel(value:string,language:'en'|'es'):string{return decodeBathroomSelection(value).map(c=>bathroomConstraintLabel(c,language)).join(' / ')}
// Retained explicit label compatibility; this lookup is not numerical inference.
export function legacyBathroomCategory(value:string):string|undefined{
 const labels=[['1 Bathroom','1 Baño','1-bathroom'],['2 Bathrooms','2 Baños','2-bathrooms'],['3 Bathrooms','3 Baños','3-bathrooms'],['4 Bathrooms','4 Baños','4-bathrooms'],['5+ Bathrooms','5+ Baños','5-plus-bathrooms']]
 return labels.findIndex((xs,i)=>xs.includes(value)||BATHROOM_CATEGORY_IDS[i]===value)<0?undefined:BATHROOM_CATEGORY_IDS[labels.findIndex((xs,i)=>xs.includes(value)||BATHROOM_CATEGORY_IDS[i]===value)]
}
export function bathroomInput(value:unknown):BathroomInput{
 if(value===null||value==='')return {kind:'clear'}
 if(value===undefined)return {kind:'missing'}
 if(isTypedBathroomSelection(value)){const cs=decodeBathroomSelection(String(value));if(cs.length!==1)throw Error('Publication requires one Bathroom fact');return cs[0]}
 if(typeof value==='object'){const x=value as Record<string,unknown>;if(x?.kind==='clear'||x?.kind==='missing'){keys(x,['kind']);return {kind:x.kind}}return validateBathroomConstraint(value)}
 if(typeof value==='number'&&Number.isFinite(value)||typeof value==='string'&&/^\d+(\.\d+)?$/.test(value))return validateBathroomConstraint({kind:'exact',value:bathroomDecimal(String(value))})
 if(typeof value==='string'){const id=legacyBathroomCategory(value);if(id)return {kind:'category',termId:id}}
 throw Error('Unresolved Bathroom input')
}
export function bathroomFactConstraint(f:unknown):BathroomConstraint|undefined{
 if(!f||typeof f!=='object')return undefined
 const x=f as Record<string,unknown>;if(x.kind==='exact')return validateBathroomConstraint({kind:'exact',value:x.exact_value})
 if(x.kind==='category')return validateBathroomConstraint({kind:'category',termId:x.category_term_id})
 if(x.kind==='range')return validateBathroomConstraint({kind:'interval',lower:x.range_lower,upper:x.range_upper,lowerInclusive:x.lower_inclusive,upperInclusive:x.upper_inclusive})
 throw Error('Invalid canonical Bathroom evidence')
}
export function bathroomEditValue(listing:Record<string,unknown>):string{
 const c=bathroomFactConstraint(listing.canonicalBathroom);if(c)return encodeBathroomSelection([c]);if(listing.canonical_domain_version===1&&Object.hasOwn(listing,'canonicalBathroom'))return ''
 try{const input=bathroomInput(listing.bathrooms);return input.kind==='clear'||input.kind==='missing'?'':encodeBathroomSelection([input])}catch{if(listing.canonical_domain_version!==1&&typeof listing.bathrooms==='string')return listing.bathrooms;throw Error('Invalid Bathroom edit evidence')}
}
export const BATHROOM_MINIMUM_OPTIONS=['1','1.5','2','2.5','3','3.5','4','4.5','5'] as const

export function assertBathroomSelection(value:unknown):void{if(typeof value==='string'&&value.startsWith('bn'))decodeBathroomSelection(value)}
export function bathroomValueLabel(value:unknown,language:'en'|'es'):string{if(value===0||typeof value==='string'&&/^0+(?:\.0+)?$/.test(value))return language==='es'?'0 Baños':'0 Bathrooms';if(value===undefined||value===null||value==='')return '';try{const c=bathroomInput(value);return c.kind==='clear'||c.kind==='missing'?'':bathroomConstraintLabel(c,language)}catch{return ''}}

export function bathroomInputDisplay(value:string,language:'en'|'es'):string{if(isTypedBathroomSelection(value))return bathroomSelectionLabel(value,language);const minimum=/^(\d+(?:\.\d+)?)\+ Bathrooms$/.exec(value);return minimum&&language==='es'?`${minimum[1].replace('.',',')}+ Baños`:value}

// Compatibility for the existing legacy editor only; never stores a typed codec as a legacy label.
// A legacy row has no canonical interval authority. Do not manufacture one or migrate it implicitly.
export function legacyBathroomWriteValue(value:string):string|null{
 if(!isTypedBathroomSelection(value))return value||null
 const c=bathroomInput(value)
 if(c.kind==='exact')return c.value
 if(c.kind==='category')return ({'1127':'1 Bathroom','1128':'2 Bathrooms','1129':'3 Bathrooms','1130':'4 Bathrooms','1131':'5+ Bathrooms'} as Record<string,string>)[c.termId]
 throw Error('An explicit Bathroom interval requires an existing canonical listing; legacy listings are not migrated by this edit.')
}
