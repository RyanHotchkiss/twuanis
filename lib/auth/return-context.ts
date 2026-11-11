import {checkoutSelection,checkoutPath} from '../checkout-selection'
export type AuthLocale = 'en' | 'es'
export const hubPath = (locale: AuthLocale) => locale === 'es' ? '/es/centro-de-mercado' : '/en/market-hub'
export const authLocale = (path?: string | null): AuthLocale => path?.startsWith('/es/') || path === '/es' ? 'es' : 'en'
// Match existing caller destinations only. Query parameters are restricted, never nested redirects.
const destinations = new Set(['/en/support','/es/soporte','/en/market-hub','/es/centro-de-mercado','/en/favorites','/es/favoritos','/en/buy','/es/comprar','/en/rent-lease','/es/alquilar-arrendar','/en/sell','/es/vender','/en/rent-out-lease-out','/es/publicar-alquiler-arrendamiento','/en/market-intelligence','/es/inteligencia-de-mercado','/en/market-intelligence/packages','/es/inteligencia-de-mercado/paquetes'])
export function safeAuthNext(value: unknown, locale: AuthLocale = 'en'): string {
 if(typeof value !== 'string' || !value.startsWith('/') || /[\\%\s]/.test(value)) return hubPath(locale)
 try {const u=new URL(value,'https://twuanis.invalid'); if(u.origin!=='https://twuanis.invalid'||(u.pathname!=='/checkout'&&!destinations.has(u.pathname)&&!/^\/(?:en\/(?:buy|rent-lease)\/listing|es\/(?:comprar|alquilar-arrendar)\/anuncio)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(u.pathname)&&!/^\/publish-listing\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(u.pathname))||u.hash) return hubPath(locale)
 if(u.pathname==='/checkout'){const selection=checkoutSelection(u.searchParams);return selection?checkoutPath(selection):hubPath(locale)}
 const query=new URLSearchParams(); for(const [k,v] of u.searchParams){if(k==='workspace' && ['settings','claims'].includes(v) && [hubPath('en'),hubPath('es')].includes(u.pathname))query.set(k,v);if(k==='currency' && ['USD','CRC'].includes(v))query.set(k,v);if(k==='lang'&&['en','es'].includes(v))query.set(k,v)}
 return u.pathname+(query.size?'?'+query.toString():'')
 }catch{return hubPath(locale)}
}
export function authReturnContext(search: string) {
 const p=new URLSearchParams(search), locale: AuthLocale=p.get('lang')==='es'?'es':authLocale(p.get('next'))
 return {locale,next:safeAuthNext(p.get('next'),locale)}
}
export const settingsPath = (locale: AuthLocale) => hubPath(locale)+'?workspace=settings'
