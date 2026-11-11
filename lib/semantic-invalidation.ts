import 'server-only'
import {revalidatePath} from 'next/cache'
export function semanticListingPaths(id:string){
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))throw Error('Invalid public listing identity')
 return [`/en/buy/listing/${id}`,`/en/rent-lease/listing/${id}`,`/es/comprar/anuncio/${id}`,`/es/alquilar-arrendar/anuncio/${id}`,'/en','/es','/en/buy','/en/rent-lease','/es/comprar','/es/alquilar-arrendar','/sitemap.xml']
}
// Called only after a successful authoritative commit receipt, never from speculative edits.
// Failure does not turn an already committed publication into a claimed rolled-back operation.
export function invalidatePublicListingRepresentations(id:string){
 try{for(const p of semanticListingPaths(id))revalidatePath(p)}catch{console.error('Public semantic invalidation requires retry; no current-cache success is asserted.')}
}
