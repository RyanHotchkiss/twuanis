import {checkoutSelection,checkoutPath} from '../checkout-selection'
export type AuthLocale = 'en' | 'es'
export const hubPath = (locale: AuthLocale) => locale === 'es' ? '/es/centro-de-mercado' : '/en/market-hub'
export const authLocale = (path?: string | null): AuthLocale => path?.startsWith('/es/') || path === '/es' ? 'es' : 'en'
// Match existing caller destinations only. Query parameters are restricted, never nested redirects.
const destinations = new Set(['/en/support','/es/soporte','/en/market-hub','/es/centro-de-mercado','/en/favorites','/es/favoritos','/en/buy','/es/comprar','/en/rent-lease','/es/alquilar-arrendar','/en/sell','/es/vender','/en/rent-out-lease-out','/es/publicar-alquiler-arrendamiento','/en/market-intelligence','/es/inteligencia-de-mercado','/en/market-intelligence/packages','/es/inteligencia-de-mercado/paquetes'])
export function safeAuthNext(
  value: unknown,
  locale: AuthLocale = 'en'
): string {
  const fallback = hubPath(locale)

  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    /[\\\u0000-\u0020\u007f]/.test(value)
  ) {
    return fallback
  }

  try {
    const u = new URL(value, 'https://twuanis.invalid')

    if (u.origin !== 'https://twuanis.invalid') {
      return fallback
    }

    if (/%(?:2f|5c|25|00)/i.test(u.pathname)) {
      return fallback
    }

    if (u.pathname === '/checkout') {
      const selection = checkoutSelection(u.searchParams)

      return selection
        ? checkoutPath(selection)
        : fallback
    }

    const localizedPage =
      /^\/(?:en|es)(?:\/|$)/.test(u.pathname)

    const publicationPage =
      /^\/publish-listing\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        u.pathname
      )

    if (
      !localizedPage &&
      !publicationPage &&
      !destinations.has(u.pathname)
    ) {
      return fallback
    }

    return u.pathname + u.search + u.hash
  } catch {
    return fallback
  }
}
export function authReturnContext(search: string) {
 const p=new URLSearchParams(search), locale: AuthLocale=p.get('lang')==='es'?'es':authLocale(p.get('next'))
 return {locale,next:safeAuthNext(p.get('next'),locale)}
}
export const settingsPath = (locale: AuthLocale) => hubPath(locale)+'?workspace=settings'
