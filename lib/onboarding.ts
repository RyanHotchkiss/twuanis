export type OnboardingStep = {
  id: string
  title: {
    en: string
    es: string
  }
  description: {
    en: string
    es: string
  }
  completed: boolean
}

export const MARKET_HUB_WELCOME_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: {
      en: 'Welcome to MarketHub',
      es: 'Bienvenido a MarketHub'
    },
    description: {
      en: 'Learn how MarketHub helps you manage every part of your real estate journey.',
      es: 'Descubre cómo MarketHub te ayuda a administrar cada parte de tu experiencia inmobiliaria.'
    },
    completed: false
  },

  {
    id: 'overview',
    title: {
      en: 'Quick Overview',
      es: 'Resumen Rápido'
    },
    description: {
      en: 'Take a quick tour of your dashboard and available tools.',
      es: 'Realiza un recorrido rápido por tu espacio de trabajo y sus herramientas.'
    },
    completed: false
  },

  {
    id: 'get-started',
    title: {
      en: 'Get Started',
      es: 'Comenzar'
    },
    description: {
      en: 'Complete your first action to personalize MarketHub.',
      es: 'Completa tu primera acción para personalizar MarketHub.'
    },
    completed: false
  }
]

export type MarketHubFirstAction = {
  id:
    | 'save-first-property'
    | 'publish-first-listing'
    | 'create-first-saved-search'
  completed: boolean
}

export const MARKET_HUB_FIRST_ACTIONS: MarketHubFirstAction[] = [
  {
    id: 'save-first-property',
    completed: false
  },
  {
    id: 'publish-first-listing',
    completed: false
  },
  {
    id: 'create-first-saved-search',
    completed: false
  }
]

export type MarketHubExploreActionId =
  | 'market-explorer'
  | 'market-intelligence'
  | 'packages'

export type MarketHubExploreAction = {
  id: MarketHubExploreActionId
  title: {
    en: string
    es: string
  }
  description: {
    en: string
    es: string
  }
  href: {
    en: string
    es: string
  }
}

export const MARKET_HUB_EXPLORE_ACTIONS: MarketHubExploreAction[] = [
  {
    id: 'market-explorer',
    title: {
      en: 'Market Explorer',
      es: 'Explorador de Mercado'
    },
    description: {
      en: 'Explore Costa Rica real estate markets, locations, inventory, and pricing.',
      es: 'Explore mercados inmobiliarios, ubicaciones, inventario y precios de Costa Rica.'
    },
    href: {
      en: '/en/market-intelligence?tab=explorer',
      es: '/es/inteligencia-de-mercado?tab=explorer'
    }
  },
  {
    id: 'market-intelligence',
    title: {
      en: 'Market Intelligence',
      es: 'Inteligencia de Mercado'
    },
    description: {
      en: 'Discover valuation, pricing, comparison, and market behavior engines.',
      es: 'Descubra motores de valoración, precios, comparación y comportamiento del mercado.'
    },
    href: {
      en: '/en/market-intelligence',
      es: '/es/inteligencia-de-mercado'
    }
  },
  {
    id: 'packages',
    title: {
      en: 'Packages',
      es: 'Paquetes'
    },
    description: {
      en: 'Review your current package and discover additional intelligence tools.',
      es: 'Revise su paquete actual y descubra herramientas adicionales de inteligencia.'
    },
    href: {
      en: '/en/market-hub#packages',
      es: '/es/centro-de-mercado#packages'
    }
  }
]

export type MarketHubOnboardingProgress = {
  completed: number
  remaining: number
  total: number
  percentage: number
}

export function calculateMarketHubOnboardingProgress(
  firstActions: MarketHubFirstAction[]
): MarketHubOnboardingProgress {
  const total = firstActions.length

  const completed = firstActions.filter(
    action => action.completed
  ).length

  const remaining = Math.max(
    total - completed,
    0
  )

  const percentage =
    total === 0
      ? 0
      : Math.round(
          (completed / total) * 100
        )

  return {
    completed,
    remaining,
    total,
    percentage
  }
}

export const MARKET_HUB_WELCOME_DISMISSED_KEY =
  'twuanis:market-hub:first-time-experience:hidden'