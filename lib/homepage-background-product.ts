// Presentation draft only. No order, entitlement, or placement authority.
export const homepageBackgroundDraft = {
  proposedProductId:'addon-homepage-background',
  name:{en:'Homepage Background',es:'Fondo de la página de inicio'},
  status:'awaiting_owner_configuration',
  purchasesEnabled:false,
  price:{status:'approved',currency:'USD',promotionalMonthly:100,standardMonthly:250,promotionalEndsExclusive:'2026-12-01T00:00:00-06:00',standardStartsAt:'2026-12-01T00:00:00-06:00',timeZone:'America/Costa_Rica',crcConversion:'existing authoritative BCCR mechanism'},
  duration:{quantity:1,unit:'calendar_month'},
  renewal:false,
  capacity:null,
} as const

// UI projection only; must come from the canonical server placement authority.
// Never construct from query parameters, client preferences, or Spotlight placements.
// Production supplies null while this independent product remains inactive.
export type HomepageBackgroundPlacement = Readonly<{
  source:'paid'; listingId:string; transaction:'sale'|'rent'; image:string;
  listingStatus:'active'; eligible:true;
}>
export function presentHomepageBackground(placement:HomepageBackgroundPlacement|null|undefined):HomepageBackgroundPlacement|null {
  return placement?.source==='paid'&&placement.listingStatus==='active'&&placement.eligible===true&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(placement.listingId)&&['sale','rent'].includes(placement.transaction)&&typeof placement.image==='string'&&placement.image.trim()?placement:null
}
