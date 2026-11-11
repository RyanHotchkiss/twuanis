import 'server-only'
import type {Metadata} from 'next'
import {getPublicListingById} from '@/lib/public-listings-server'
import {listingRepresentationPath} from './public-listing-projection'
export async function publicListingMetadata(id:string,locale:'en'|'es',mode:'buy'|'rent'):Promise<Metadata>{
 try{
  const row=await getPublicListingById(id)
  if(!row||row.transaction_type!==(mode==='buy'?'sale':'rent'))return {robots:{index:false,follow:false}}
  return {title:row.title||'Twuanis',description:row.description||undefined,alternates:{canonical:'https://twuanis.com'+listingRepresentationPath(id,locale,mode),languages:{en:'https://twuanis.com'+listingRepresentationPath(id,'en',mode),es:'https://twuanis.com'+listingRepresentationPath(id,'es',mode)}}}
 }catch{return {robots:{index:false,follow:false}}}
}
