export type TwuanisLanguage =
  | 'en'
  | 'es'

type RoutePair = {
  en: string
  es: string
}

const exactRoutePairs: RoutePair[] = [
  {
    en: '/en',
    es: '/es'
  },
  {
    en: '/en/buy',
    es: '/es/comprar'
  },
  {
    en: '/en/rent-lease',
    es: '/es/alquilar-arrendar'
  },
  {
    en: '/en/sell',
    es: '/es/vender'
  },
  {
    en: '/en/rent-out-lease-out',
    es: '/es/publicar-alquiler-arrendamiento'
  },
  {
    en: '/en/favorites',
    es: '/es/favoritos'
  },
  {
    en: '/en/market-hub',
    es: '/es/centro-de-mercado'
  },
  {
    en: '/en/market-intelligence',
    es: '/es/inteligencia-de-mercado'
  },
  {
    en: '/en/market-intelligence/packages',
    es: '/es/inteligencia-de-mercado/paquetes'
  },
  {
    en: '/en/compare/entities',
    es: '/es/comparar/entidades'
  },
  {
    en: '/en/compare/markets',
    es: '/es/comparar/mercados'
  },
  {
    en: '/en/compare/properties',
    es: '/es/comparar/propiedades'
  },
  {
    en: '/en/swipe',
    es: '/es/deslizar'
  },
  {
    en: '/en/swipe/buy',
    es: '/es/deslizar/comprar'
  },
  {
    en: '/en/swipe/rent-lease',
    es: '/es/deslizar/alquilar'
  }
]

type DynamicRoutePair = {
  en: RegExp
  es: RegExp

  toEnglish:
    (match: RegExpMatchArray) => string

  toSpanish:
    (match: RegExpMatchArray) => string
}

const dynamicRoutePairs: DynamicRoutePair[] = [
  {
    en: /^\/en\/buy\/listing\/([^/]+)$/,
    es: /^\/es\/comprar\/anuncio\/([^/]+)$/,

    toEnglish: (match) =>
      `/en/buy/listing/${match[1]}`,

    toSpanish: (match) =>
      `/es/comprar/anuncio/${match[1]}`
  },

  {
    en: /^\/en\/rent-lease\/listing\/([^/]+)$/,
    es: /^\/es\/alquilar-arrendar\/anuncio\/([^/]+)$/,

    toEnglish: (match) =>
      `/en/rent-lease/listing/${match[1]}`,

    toSpanish: (match) =>
      `/es/alquilar-arrendar/anuncio/${match[1]}`
  },

  {
    en: /^\/en\/sell\/edit\/([^/]+)$/,
    es: /^\/es\/vender\/editar\/([^/]+)$/,

    toEnglish: (match) =>
      `/en/sell/edit/${match[1]}`,

    toSpanish: (match) =>
      `/es/vender/editar/${match[1]}`
  },

  {
    en: /^\/en\/rent-out-lease-out\/edit\/([^/]+)$/,
    es: /^\/es\/publicar-alquiler-arrendamiento\/editar\/([^/]+)$/,

    toEnglish: (match) =>
      `/en/rent-out-lease-out/edit/${match[1]}`,

    toSpanish: (match) =>
      `/es/publicar-alquiler-arrendamiento/editar/${match[1]}`
  },

  {
    en: /^\/en\/saved-analysis\/([^/]+)$/,
    es: /^\/es\/analisis-guardado\/([^/]+)$/,

    toEnglish: (match) =>
      `/en/saved-analysis/${match[1]}`,

    toSpanish: (match) =>
      `/es/analisis-guardado/${match[1]}`
  }
]

function preserveSearchParams(
  pathname: string,
  searchParams?: URLSearchParams | null
): string {

  if (!searchParams) {
    return pathname
  }

  const query =
    searchParams.toString()

  if (!query) {
    return pathname
  }

  return `${pathname}?${query}`
}

export function getAlternateLanguageUrl({
  pathname,
  searchParams,
  targetLanguage
}: {
  pathname: string
  searchParams?: URLSearchParams | null
  targetLanguage: TwuanisLanguage
}): string {

  /*
   * Exact routes
   */

  for (const pair of exactRoutePairs) {

    if (
      targetLanguage === 'es' &&
      pathname === pair.en
    ) {
      return preserveSearchParams(
        pair.es,
        searchParams
      )
    }

    if (
      targetLanguage === 'en' &&
      pathname === pair.es
    ) {
      return preserveSearchParams(
        pair.en,
        searchParams
      )
    }

  }

  /*
   * Dynamic routes
   */

  for (const pair of dynamicRoutePairs) {

    if (targetLanguage === 'es') {

      const match =
        pathname.match(pair.en)

      if (match) {
        return preserveSearchParams(
          pair.toSpanish(match),
          searchParams
        )
      }

    }

    if (targetLanguage === 'en') {

      const match =
        pathname.match(pair.es)

      if (match) {
        return preserveSearchParams(
          pair.toEnglish(match),
          searchParams
        )
      }

    }

  }

  /*
   * Fail semantically closed.
   *
   * Every canonical Twuanis page must have
   * an explicit bilingual counterpart.
   *
   * If one is missing, expose the problem
   * instead of silently dumping the user
   * onto a language homepage.
   */

  console.error(
    `[language-route] No ${targetLanguage.toUpperCase()} counterpart for "${pathname}"`
  )

  return preserveSearchParams(
    pathname,
    searchParams
  )
}
