export type DuplicateAdmission = 'REVIEW_REQUIRED' | 'AUTOMATIC_REJECTION'
export function heldAdmission(value: unknown): DuplicateAdmission | null {
 const a=(value&&typeof value==='object'?(value as Record<string,unknown>).admission:null)
 return a==='REVIEW_REQUIRED'||a==='AUTOMATIC_REJECTION'?a:null
}
export function listingReviewMessage(admission:DuplicateAdmission,language:'en'|'es') {
 if(admission==='AUTOMATIC_REJECTION')return language==='es'?'Este anuncio no se publicó porque coincide con un anuncio existente. Puedes consultar su estado en Mis anuncios.':'This submission was not published because it matches an existing listing. You can view its status in My Listings.'
 return language==='es'?'Recibimos tu anuncio y está pendiente de revisión. Puedes consultar su estado en Mis anuncios.':'Your listing was received and is awaiting review. You can view its status in My Listings.'
}
