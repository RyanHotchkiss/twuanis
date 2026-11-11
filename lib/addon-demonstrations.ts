// Presentation examples only. The input is the existing published, filtered marketplace population.
// This module neither acquires nor grants commercial rights and never writes reporting records.
export function selectAddonDemonstrations<T extends {id:string;canonical_domain_version?:number;title?:unknown;images?:unknown;marketplace_original_price?:unknown;marketplace_original_currency?:unknown}>(
 listings:T[],paidHomepageIds:string[],paidFeatured:T[],verifiedPlacement:boolean,homepage:boolean,bank:boolean
):{homepage:T|null;featured:T[]}{
 if(!homepage||bank||!verifiedPlacement)return {homepage:null,featured:[]}
 const seen=new Set<string>()
 const candidates=listings.filter(row=>{
  const valid=row.canonical_domain_version===1&&typeof row.title==='string'&&row.title.trim().length>0&&
   Array.isArray(row.images)&&typeof row.images[0]==='string'&&/^https?:\/\//i.test(row.images[0])&&
   ['USD','CRC'].includes(String(row.marketplace_original_currency))&&Number.isFinite(Number(row.marketplace_original_price))&&Number(row.marketplace_original_price)>0&&!seen.has(row.id)
  if(valid)seen.add(row.id)
  return valid
 })
 const homepageExample=paidHomepageIds.length?null:(candidates.find(row=>!paidFeatured.some(p=>p.id===row.id))??candidates[0]??null)
 const remaining=candidates.filter(row=>row.id!==homepageExample?.id&&!paidHomepageIds.includes(row.id))
 return {homepage:homepageExample,featured:paidFeatured.length?[]:(remaining.length?remaining:candidates).slice(0,3)}
}
