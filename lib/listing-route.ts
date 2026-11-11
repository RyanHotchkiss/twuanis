// Browser-safe internal listing navigation. No analytical or access authority.
export function listingHref(id: string, transaction: 'sale'|'rent', language: 'en'|'es') {
  return language==='es' ? `/es/${transaction==='sale'?'comprar':'alquilar-arrendar'}/anuncio/${encodeURIComponent(id)}` : `/en/${transaction==='sale'?'buy':'rent-lease'}/listing/${encodeURIComponent(id)}`
}
