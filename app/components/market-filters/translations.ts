import type { Language } from './types'

export const ui = {
  en: {
    resetExplorer: 'Reset Explorer',
    resetComparison: 'Reset Comparison',
    marketA: 'Market A',
    marketB: 'Market B',
    location: 'Location',
    province: 'Province',
    canton: 'Canton',
    district: 'District',
    transaction: 'Transaction',
    propertyType: 'Property Type',
    bedrooms: 'Bedrooms',
    bathrooms: 'Bathrooms',
    parking: 'Parking',
    priceRange: 'Price Range',
    propertyArea: 'Property Area',
    constructionArea: 'Construction Area',
    yearBuilt: 'Year Built',
    environment: 'Environment',
    terrain: 'Terrain',
    utilities: 'Utilities',
    accessibility: 'Accessibility',
    legalStatus: 'Legal Status'
  },

  es: {
    resetExplorer: 'Restablecer Explorador',
    resetComparison: 'Restablecer Comparación',
    marketA: 'Mercado A',
    marketB: 'Mercado B',
    location: 'Ubicación',
    province: 'Provincia',
    canton: 'Cantón',
    district: 'Distrito',
    transaction: 'Transacción',
    propertyType: 'Tipo de Propiedad',
    bedrooms: 'Habitaciones',
    bathrooms: 'Baños',
    parking: 'Estacionamiento',
    priceRange: 'Rango de Precio',
    propertyArea: 'Área de la Propiedad',
    constructionArea: 'Área de Construcción',
    yearBuilt: 'Año de Construcción',
    environment: 'Entorno',
    terrain: 'Terreno',
    utilities: 'Servicios',
    accessibility: 'Accesibilidad',
    legalStatus: 'Estado Legal'
  }
}

export type UiText =
  typeof ui.en

export function getUi(
  language: Language
): UiText {
  return ui[language]
}