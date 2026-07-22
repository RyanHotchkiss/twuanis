import {
  Compass,
  BadgeDollarSign,
  Target,
  HeartHandshake,
  Scale,
  Ruler,
  ChartColumnIncreasing,
  Flame,
  Rocket,
  TrendingDown,
  RefreshCcw,
  Users
} from 'lucide-react'

import type { LucideIcon } from 'lucide-react'

export type SupportedLanguage = 'en' | 'es'

export type LocalizedText = {
  en: string
  es: string
}

export type Price = {
  usd: number
  crc: number
}

export type MarketIntelligenceEngine = {
  id:
    | 'explorer'
    | 'valuation'
    | 'pricing'
    | 'matching'
    | 'comparison'
    | 'frequency'
    | 'price-m2'
    | 'buyer-demand'
    | 'market-velocity'
    | 'price-dynamics'
    | 'listing-lifecycle'
    | 'seller-behavior'

  icon: LucideIcon
  name: LocalizedText
  purpose: LocalizedText
  future?: boolean
}

export type MarketIntelligencePackage = {
  id:
    | 'market-discovery'
    | 'valuation-pricing'
    | 'market-analysis'
    | 'pricing-intelligence'
    | 'market-behavior'

  color: string

  price:
    | {
        usd: number
        crc: number
      }
    | null

  name: LocalizedText
  description: LocalizedText
  dashboardDescription: LocalizedText
  engines: MarketIntelligenceEngine[]
}

export const marketIntelligencePackages:
  MarketIntelligencePackage[] = [
  {
    id: 'market-discovery',

    color: '#2ecc71',

    price: null,

    name: {
      en: 'Market Discovery Package',
      es: 'Paquete de Exploración del Mercado'
    },

    description: {
      en: 'Discover what exists in the Costa Rica real estate market.',
      es: 'Descubra qué existe en el mercado inmobiliario de Costa Rica.'
    },

    dashboardDescription: {
    en: 'Manage listings, save favorite properties, and access Market Explorer.',
    es: 'Administre publicaciones, guarde propiedades favoritas y acceda al Explorador de Mercado.'
    },

    engines: [
      {
        id: 'explorer',

        icon: Compass,

        name: {
          en: 'Market Explorer',
          es: 'Explorador de Mercado'
        },

        purpose: {
          en: 'Explore listings and market characteristics.',
          es: 'Explore propiedades y características del mercado.'
        }
      }
    ]
  },

  {
    id: 'valuation-pricing',

    color: '#0066cc',

    price: {
        usd: 50,
        crc: 25000
        },

    name: {
      en: 'Valuation & Pricing Package',
      es: 'Paquete de Valoración y Estrategia de Precios'
    },

    description: {
      en: 'Estimate value, compare alternatives, and choose competitive pricing strategies.',
      es: 'Estime el valor, compare alternativas y elija estrategias de precios competitivas.'
    },

    dashboardDescription: {
    en: 'Everything in Market Discovery, plus saved valuations, pricing strategies, and property matches.',
    es: 'Todo lo incluido en Exploración del Mercado, además de valoraciones, estrategias de precios y coincidencias de propiedades guardadas.'
    },

    engines: [
      {
        id: 'valuation',

        icon: BadgeDollarSign,

        name: {
          en: 'Valuation',
          es: 'Valoración'
        },

        purpose: {
          en: 'Estimate what a property is worth.',
          es: 'Estime el valor de una propiedad.'
        }
      },

      {
        id: 'pricing',

        icon: Target,

        name: {
          en: 'Pricing Strategy',
          es: 'Estrategia de Precios'
        },

        purpose: {
          en: 'Choose a competitive listing price.',
          es: 'Elija un precio de publicación competitivo.'
        }
      },

      {
        id: 'matching',

        icon: HeartHandshake,

        name: {
          en: 'Property Matching',
          es: 'Coincidencia de Propiedades'
        },

        purpose: {
          en: 'Find better matching properties.',
          es: 'Encuentre propiedades que se adapten mejor a sus necesidades.'
        }
      }
    ]
  },

  {
    id: 'market-analysis',

    color: '#ff3b00',

    price: {
        usd: 200,
        crc: 100000
        },

    name: {
      en: 'Market Analysis Package',
      es: 'Paquete de Análisis de Mercado'
    },

    description: {
      en: 'Understand market composition and compare real estate markets.',
      es: 'Comprenda la composición del mercado y compare mercados inmobiliarios.'
    },

        dashboardDescription: {
            en: 'Includes Market Explorer, Valuation, Pricing Strategy, Property Matching, Market Comparison, and Market Frequency, with saved valuations, pricing strategies, property matches, market comparisons, and frequency analyses.',
            es: 'Incluye Explorador de Mercado, Valoración, Estrategia de Precios, Coincidencia de Propiedades, Comparación de Mercados y Frecuencia del Mercado, con valoraciones, estrategias de precios, coincidencias de propiedades, comparaciones de mercados y análisis de frecuencia guardados.'
            },

    engines: [
      {
        id: 'comparison',

        icon: Scale,

        name: {
          en: 'Market Comparison',
          es: 'Comparación de Mercados'
        },

        purpose: {
          en: 'Compare two real estate markets.',
          es: 'Compare dos mercados inmobiliarios.'
        }
      },

      {
        id: 'frequency',

        icon: ChartColumnIncreasing,

        name: {
          en: 'Market Frequency',
          es: 'Frecuencia del Mercado'
        },

        purpose: {
          en: 'Measure how common or uncommon property characteristics are.',
          es: 'Mida qué tan comunes o poco comunes son las características de las propiedades.'
        }
      }
    ]
  },

  {
    id: 'pricing-intelligence',

    color: '#8e44ad',

    price: {
        usd: 1000,
        crc: 500000
        },

    name: {
      en: 'Pricing Intelligence Package',
      es: 'Paquete de Inteligencia de Precios'
    },

    description: {
      en: 'Analyze pricing efficiency across Costa Rica.',
      es: 'Analice la eficiencia de precios en Costa Rica.'
    },

        dashboardDescription: {
            en: 'Includes Market Explorer, Valuation, Pricing Strategy, Property Matching, Market Comparison, Market Frequency, and Price / m² Intelligence, with saved analyses, scanners, comparisons, heat maps, and pricing research.',
            es: 'Incluye Explorador de Mercado, Valoración, Estrategia de Precios, Coincidencia de Propiedades, Comparación de Mercados, Frecuencia del Mercado e Inteligencia de Precio / m², con análisis, buscadores, comparaciones, mapas de calor e investigaciones de precios guardados.'
            },

    engines: [
      {
        id: 'price-m2',

        icon: Ruler,

        name: {
          en: 'Price / m² Intelligence',
          es: 'Inteligencia de Precio / m²'
        },

        purpose: {
          en: 'Analyze pricing efficiency across markets.',
          es: 'Analice la eficiencia de precios entre mercados.'
        }
      }
    ]
  },

  {
    id: 'market-behavior',

    color: '#dc143c',

    price: {
        usd: 2000,
        crc: 1000000
        },

    name: {
      en: 'Market Behavior & Dynamics Package',
      es: 'Paquete de Comportamiento y Dinámica del Mercado'
    },

    description: {
      en: 'Measure how markets and participants behave over time.',
      es: 'Mida cómo evolucionan los mercados y el comportamiento de sus participantes.'
    },

        dashboardDescription: {
            en: 'Includes Market Explorer, Valuation, Pricing Strategy, Property Matching, Market Comparison, Market Frequency, Price / m² Intelligence, Buyer Demand, Market Velocity, Price Dynamics, Listing Lifecycle, and Seller Behavior.',
            es: 'Incluye Explorador de Mercado, Valoración, Estrategia de Precios, Coincidencia de Propiedades, Comparación de Mercados, Frecuencia del Mercado, Inteligencia de Precio / m², Demanda de Compradores, Velocidad del Mercado, Dinámica de Precios, Ciclo de Vida de las Publicaciones y Comportamiento de los Vendedores.'
            },

    engines: [
      {
        id: 'buyer-demand',
        icon: Flame,
        future: true,
        name: {
          en: 'Buyer Demand',
          es: 'Demanda de Compradores'
        },
        purpose: {
          en: 'Measure buyer demand.',
          es: 'Mida la demanda de compradores.'
        }
      },

      {
        id: 'market-velocity',
        icon: Rocket,
        future: true,
        name: {
          en: 'Market Velocity',
          es: 'Velocidad del Mercado'
        },
        purpose: {
          en: 'Measure how quickly inventory moves.',
          es: 'Mida la velocidad con la que se mueve el inventario.'
        }
      },

      {
        id: 'price-dynamics',
        icon: TrendingDown,
        future: true,
        name: {
          en: 'Price Dynamics',
          es: 'Dinámica de Precios'
        },
        purpose: {
          en: 'Measure price changes over time.',
          es: 'Mida los cambios de precios a lo largo del tiempo.'
        }
      },

      {
        id: 'listing-lifecycle',
        icon: RefreshCcw,
        future: true,
        name: {
          en: 'Listing Lifecycle',
          es: 'Ciclo de Vida de las Publicaciones'
        },
        purpose: {
          en: 'Measure listing outcomes over time.',
          es: 'Mida la evolución de las publicaciones a lo largo del tiempo.'
        }
      },

      {
        id: 'seller-behavior',
        icon: Users,
        future: true,
        name: {
          en: 'Seller Behavior',
          es: 'Comportamiento de los Vendedores'
        },
        purpose: {
          en: 'Measure seller responses to changing markets.',
          es: 'Mida cómo responden los vendedores a los cambios del mercado.'
        }
      }
    ]
  }
]