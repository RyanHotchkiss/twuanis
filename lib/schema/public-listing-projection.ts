import type {ListingConceptProjection} from './buildListingConcepts'
import type {CanonicalEvidence} from '@/lib/canonical-listing-reader'
import {resolveListingOriginalMonetaryValue} from '@/lib/listing-monetary-value'
import {resolveListingImages} from '@/app/utils/resolveListingImages'
import {validateCanonicalEvidence} from '@/lib/canonical-listing-reader'
import {buildCountryNode} from './buildPlaceNode'
import {buildGeographicHierarchy} from './buildGeographicHierarchy'
export type PublicListingInput={id:string;listing_status?:string|null;canonical_domain_version?:number|null;canonicalEvidence?:CanonicalEvidence;title?:string|null;description?:string|null;transaction_type?:string|null;currency?:string|null;current_price?:number|string|null;monthly_price?:number|string|null;price_millions?:number|string|null;images?:string|string[]|null;construction_area?:number|null;property_area?:number|null}
export const listingRepresentationPath=(id:string,l:'en'|'es',mode:'buy'|'rent')=>l==='en'?`/en/${mode==='buy'?'buy':'rent-lease'}/listing/${id}`:`/es/${mode==='buy'?'comprar':'alquilar-arrendar'}/anuncio/${id}`
export function projectPublicListing(listing:PublicListingInput,lang:'en'|'es',mode:'buy'|'rent',concepts?:ListingConceptProjection){
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(listing.id)||listing.listing_status!=='active'||listing.canonical_domain_version!==1||listing.transaction_type!==(mode==='buy'?'sale':'rent'))return null
 const evidence=listing.canonicalEvidence
 if(!evidence||evidence.listing_id!==listing.id)return null
 try{validateCanonicalEvidence(evidence)}catch{return null}
 // Match the existing canonical reader: incomplete property classification cannot publish.
 if(evidence.selections.filter(t=>t.dimension==='property_type').length!==1)return null
 const money=resolveListingOriginalMonetaryValue(listing)
 // No fabricated currency, zero asking amount, cross-transaction offer or property class.
 if(!money||!Number.isFinite(money.amount)||money.amount<=0)return null
 const url='https://twuanis.com'+listingRepresentationPath(listing.id,lang,mode)
 const loc=evidence.geography.map(t=>({...t,id:String(t.id),parent_id:t.parent_id===null?null:String(t.parent_id)}))
 const places=buildGeographicHierarchy(loc,lang)
 const deepest=loc.find(t=>t.term_type==='district')||loc.find(t=>t.term_type==='canton')!
 const physicalPlace=places.get(deepest.id)
 if(!physicalPlace)return null
 const measures=[['property_area',listing.property_area,lang==='es'?'Área de terreno':'Land area'],['construction_area',listing.construction_area,lang==='es'?'Área de construcción':'Construction area']].flatMap(([key,value,label])=>value!==null&&value!==undefined&&String(value).trim()!==''&&Number.isFinite(Number(value))&&Number(value)>0?[{'@type':'PropertyValue',propertyID:key,name:label,value:String(value),unitCode:'MTK',unitText:'m²'}]:[])
 const exactFacts=evidence.facts.filter(f=>['bedrooms','bathrooms','parking'].includes(f.dimension)&&f.kind==='exact'&&f.exact_value!==null).map(f=>({'@type':'PropertyValue',propertyID:f.dimension,name:({bedrooms:lang==='es'?'Habitaciones':'Bedrooms',bathrooms:lang==='es'?'Baños':'Bathrooms',parking:lang==='es'?'Estacionamiento':'Parking'} as Record<string,string>)[f.dimension],value:f.exact_value}))
 const classification=evidence.selections.filter(t=>t.dimension==='property_type').map(t=>({'@type':'PropertyValue',propertyID:'property_type',name:lang==='es'?'Tipo de propiedad':'Property type',value:t.slug||t.term_name}))
 const listingId=`https://twuanis.com/id/listing/${listing.id.toLowerCase()}`,propertyId=listingId+'#property',offerId=listingId+'#offer'
 const property={'@id':propertyId,'@type':['Place','Product'],additionalProperty:[...measures,...exactFacts,...classification,...(concepts?.properties??[])],...(concepts?.classification?{category:concepts.classification}:{}),name:listing.title||undefined,description:listing.description||undefined,containedInPlace:{'@id':physicalPlace['@id']},address:{'@type':'PostalAddress',addressCountry:'CR',addressRegion:loc.find(t=>t.term_type==='province')?.term_name,addressLocality:loc.find(t=>t.term_type==='canton')?.term_name}}
 const offer={'@id':offerId,'@type':'Offer',url,price:money.amount,priceCurrency:money.currency,businessFunction:`http://purl.org/goodrelations/v1#${mode==='buy'?'Sell':'LeaseOut'}`,itemOffered:{'@id':propertyId},...(mode==='rent'?{priceSpecification:{'@type':'UnitPriceSpecification',price:money.amount,priceCurrency:money.currency,referenceQuantity:{'@type':'QuantitativeValue',value:1,unitText:lang==='es'?'mes':'month'}}}:{})}
 // Preserve listing identity; property and offer identities are scoped to this advertisement.
 return {'@context':'https://schema.org','@graph':[{'@type':'RealEstateListing','@id':listingId,url,inLanguage:lang,name:listing.title||undefined,description:listing.description||undefined,image:resolveListingImages(listing.images).filter(u=>/^https?:\/\//.test(u)),...(concepts?.references.length?{about:concepts.references}:{}),mainEntity:{'@id':propertyId},offers:{'@id':offerId}},property,offer,...places.values(),buildCountryNode(),...(concepts?.nodes??[])]}
}
