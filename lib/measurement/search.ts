import bindings from './bindings.json'
const fields=['province','canton','district','price','property_type','bedrooms','bathrooms','parking','year_built','construction_area','use_type','property_area','utility','legal_status','environment','accessibility','distance_to_paved_road_range','terrain'] as const
const hidden=new Set(['bedrooms','bathrooms','parking','year_built','use_type'])
const hash=async(v:unknown)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v)))),x=>x.toString(16).padStart(2,'0')).join('')
export async function encodeSearch(filters:Record<string,unknown>,profile:string){
 const all=bindings.profiles as Record<string,Record<string,Record<string,string[]>>>,legend=all[profile];if(!legend)return null
 const priceField=profile.startsWith('RentLease')?'monthly_price':'price_range'
 // Native callers provide all eighteen dimensions. Missing is not a cleared filter.
 if(!filters||typeof filters!=='object'||fields.some(f=>{const k=f==='price'?priceField:f;return !Object.hasOwn(filters,k)||filters[k]==null}))return null
 const output:Record<string,string>={};let complete=true,canonical=true
 for(let i=0;i<fields.length;i++){
 const field=fields[i],value=filters[field==='price'?priceField:field];const values=Array.isArray(value)?value:value===''||value==null?[]:[value]
 const parentReady=i===1?!!filters.province:i===2?!!filters.province&&!!filters.canton:true
 const available=parentReady&&!hidden.has(field)&&(field!=='distance_to_paved_road_range'||filters.accessibility==='Unpaved Road to Property'),effective=field!=='distance_to_paved_road_range'||filters.accessibility==='Unpaved Road to Property'
 if(!values.length){output['f'+String(i).padStart(2,'0')]='u'+(available?'a':'h')+(effective&&available?'e':'i')+'.n';continue}
 if(Array.isArray(value)&&values.length>Object.keys(legend[field]||{}).length){complete=false;output['f'+String(i).padStart(2,'0')]='s'+(available?'a':'h')+'x.n';continue}
 let tokens:string[]=[],operator='e'
 for(const v of values){
 if(typeof v!=='string'||v.length>100){complete=false;tokens=[];break}
 let token=''
 if(i<3){const parent=i===0?null:i===1?String(filters.province):String(filters.province)+'/'+String(filters.canton);const geo=bindings.geography.find(x=>x.facet===field&&x.value===v&&x.parent===parent)
 if(!geo){complete=false;tokens=[];break}if(geo.matches.length===1)token='o'+geo.matches[0];else{canonical=false;token=(geo.tokens as Record<string,string>)[profile]||''}
 }else{const entry=legend[field]?.[v];if(!entry){complete=false;tokens=[];break}token=entry[0];operator=entry[1]==='ANY_OF'?'a':entry[1]==='HALF_OPEN_AREA'?'h':entry[1]==='INCLUSIVE_PRICE'?'p':'e';if(!token.startsWith('o'))canonical=false}

 if(!token){complete=false;tokens=[];break}tokens.push(token)}
 output['f'+String(i).padStart(2,'0')]=tokens.length?'s'+(available?'a':'h')+(effective?'e':'i')+'.'+operator+'.'+[...new Set(tokens)].sort().join('.'):'s'+(available?'a':'h')+'x.n'
 if(output['f'+String(i).padStart(2,'0')].length>100)return null
 }
 const cfg='c'+await hash({revision:'KA09-native-2',profile,legend,geography:bindings.geography});const digest=await hash(output)
 return {facets:output,cfg,digest,coverage:!complete?'incomplete':canonical?'source_complete_canonical_complete':'source_complete_canonical_partial'} as const
}
