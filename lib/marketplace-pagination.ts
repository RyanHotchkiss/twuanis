export const marketplacePageSizes = [25,50,100] as const
export function marketplacePageNumbers(page:number,total:number,size:number) {
 const last=Math.max(1,Math.ceil(total/size)),start=Math.max(1,Math.min(page-2,last-4))
 return Array.from({length:Math.min(5,last)},(_,i)=>start+i)
}
export function validateMarketplacePage(page:number,size:number,filters:unknown) {
 if(!Number.isInteger(page)||page<1||page>10000||!marketplacePageSizes.includes(size as 25|50|100)||!filters||typeof filters!=='object'||Array.isArray(filters)||JSON.stringify(filters).length>2000)throw new Error('Invalid marketplace page')
 const keys=new Set(['province','canton','district','price_range','monthly_price','property_type','bedrooms','bathrooms','parking','year_built','construction_area','use_type','property_area','utility','legal_status','environment','accessibility','distance_to_paved_road_range','terrain'])
 for(const [k,v] of Object.entries(filters))if(!keys.has(k)||!(typeof v==='string'&&v.length<=128||Array.isArray(v)&&v.length<=25&&v.every(x=>typeof x==='string'&&x.length<=128)))throw new Error('Invalid marketplace filter')
}
