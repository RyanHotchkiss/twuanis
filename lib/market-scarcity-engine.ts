import { getMarketStatistics } from '@/lib/statistics-engine'

type ScarcityLanguage = 'en' | 'es'

type MarketFilters = {
  transaction_type?: string
  province?: string
  canton?: string
  district?: string
  property_type?: string
  bedrooms?: string
  bathrooms?: string
  parking?: string
  year_built?: string
  property_area?: string
  construction_area?: string
  utility?: string
  environment?: string
  terrain?: string
  accessibility?: string
  legal_status?: string
}

type ScarcityCombination = {
  attributes: {
    category: string
    value: string
  }[]
  matchingCount: number
  marketSize: number
  marketShare: string
  scarcityLevel: string
  explanation: string
}

const scarcityCategories = [
  'property_type',
  'bedrooms',
  'bathrooms',
  'parking',
  'environment',
  'terrain',
  'utility',
  'accessibility',
  'legal_status'
]

function normalizeText(value: any) {
  return String(value || '')
    .toLowerCase()
    .trim()
}

function labelize(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase())
}

function formatShare(count: number, total: number) {
  if (!total) return null

  const share =
    (count / total) * 100

  if (share < 0.01 && share > 0) {
    return '<0.01%'
  }

  return `${share.toFixed(2)}%`
}

function getScarcityLevel(
  count: number,
  total: number,
  language: ScarcityLanguage
) {
  if (!total || count === 0) {
    return language === 'es'
      ? 'Sin Inventario'
      : 'No Inventory'
  }

  const share =
    count / total

  if (share < 0.01) {
    return language === 'es'
      ? 'Ultra Escaso'
      : 'Ultra Scarce'
  }

  if (share < 0.03) {
    return language === 'es'
      ? 'Muy Escaso'
      : 'Very Scarce'
  }

  if (share < 0.07) {
    return language === 'es'
      ? 'Escaso'
      : 'Scarce'
  }

  if (share < 0.15) {
    return language === 'es'
      ? 'Limitado'
      : 'Limited'
  }

  return language === 'es'
    ? 'Disponible'
    : 'Available'
}

function listingMatchesValue(
  listing: any,
  category: string,
  value: string
) {
  const listingValue =
    listing[category]

  if (!listingValue) return false

  if (Array.isArray(listingValue)) {
    return listingValue
      .map(normalizeText)
      .includes(normalizeText(value))
  }

  return normalizeText(listingValue) === normalizeText(value)
}

function getUniqueValues(
  listings: any[],
  category: string
) {
  const values =
    new Set<string>()

  listings.forEach((listing: any) => {
    const value =
      listing[category]

    if (!value) return

    if (Array.isArray(value)) {
      value.forEach(item => {
        if (item) values.add(String(item))
      })
    } else {
      values.add(String(value))
    }
  })

  return Array.from(values)
}

function getSelectedAttributes(filters: MarketFilters) {
  return scarcityCategories
    .map(category => {
      const value =
        filters[category as keyof MarketFilters]

      if (!value) return null

      return {
        category,
        value
      }
    })
    .filter(Boolean) as {
      category: string
      value: string
    }[]
}

function countMatchingListings(
  listings: any[],
  attributes: {
    category: string
    value: string
  }[]
) {
  return listings.filter((listing: any) =>
    attributes.every(attribute =>
      listingMatchesValue(
        listing,
        attribute.category,
        attribute.value
      )
    )
  ).length
}

function buildScarcityCombination({
  attributes,
  matchingCount,
  marketSize,
  language
}: {
  attributes: {
    category: string
    value: string
  }[]
  matchingCount: number
  marketSize: number
  language: ScarcityLanguage
}): ScarcityCombination {

  const marketShare =
    formatShare(matchingCount, marketSize)

  const scarcityLevel =
    getScarcityLevel(
      matchingCount,
      marketSize,
      language
    )

  return {
    attributes,
    matchingCount,
    marketSize,
    marketShare:
      marketShare || 'No data',

    scarcityLevel,

    explanation:
  language === 'es'
    ? `Esta combinación representa ${marketShare || '0%'} del inventario seleccionado.`
    : `This combination represents ${marketShare || '0%'} of the selected inventory.`
  }
}
function generateSelectedCombination(
  listings: any[],
  filters: MarketFilters,
  language: ScarcityLanguage
) {
  const attributes =
    getSelectedAttributes(filters)

  const marketSize =
    listings.length

  if (!attributes.length) {
    return {
      matchingCount: marketSize,
      marketSize,
      scarcityShare: '100%',
      scarcityLevel:
        language === 'es'
          ? 'Mercado Completo'
          : 'Entire Market',
      selectedCombination: null
    }
  }

  const matchingCount =
    countMatchingListings(
      listings,
      attributes
    )

  return {
    matchingCount,
    marketSize,

    scarcityShare:
      formatShare(
        matchingCount,
        marketSize
      ),

    scarcityLevel:
      getScarcityLevel(
        matchingCount,
        marketSize,
        language
      ),

    selectedCombination:
      buildScarcityCombination({
        attributes,
        matchingCount,
        marketSize,
        language
      })
  }
}

function discoverCombinations(
  listings: any[],
  language: ScarcityLanguage
) {
  const discovered: ScarcityCombination[] = []

  /* ---------- Single Characteristics ---------- */

  scarcityCategories.forEach(category => {

    const values =
      getUniqueValues(
        listings,
        category
      )

    values.forEach(value => {

      const attributes = [
        {
          category,
          value
        }
      ]

      discovered.push(
        buildScarcityCombination({
          attributes,
          matchingCount:
            countMatchingListings(
              listings,
              attributes
            ),
          marketSize:
            listings.length,
          language
        })
      )

    })

  })

  /* ---------- Two Characteristic Combinations ---------- */

  scarcityCategories.forEach(
    (
      firstCategory,
      firstIndex
    ) => {

      scarcityCategories
        .slice(firstIndex + 1)
        .forEach(secondCategory => {

          const firstValues =
            getUniqueValues(
              listings,
              firstCategory
            )

          const secondValues =
            getUniqueValues(
              listings,
              secondCategory
            )

          firstValues.forEach(firstValue => {

            secondValues.forEach(secondValue => {

              const attributes = [

                {
                  category:
                    firstCategory,

                  value:
                    firstValue
                },

                {
                  category:
                    secondCategory,

                  value:
                    secondValue
                }

              ]

              discovered.push(

                buildScarcityCombination({

                  attributes,

                  matchingCount:
                    countMatchingListings(
                      listings,
                      attributes
                    ),

                  marketSize:
                    listings.length,

                  language

                })

              )

            })

          })

        })

    })

  /* ---------- Three Characteristic Combinations ---------- */

  const propertyTypes =
    getUniqueValues(
      listings,
      'property_type'
    )

  propertyTypes.forEach(propertyType => {

    const environments =
      getUniqueValues(
        listings,
        'environment'
      )

    const utilities =
      getUniqueValues(
        listings,
        'utility'
      )

    environments.forEach(environment => {

      utilities.forEach(utility => {

        const attributes = [

          {
            category:
              'property_type',

            value:
              propertyType
          },

          {
            category:
              'environment',

            value:
              environment
          },

          {
            category:
              'utility',

            value:
              utility
          }

        ]

        discovered.push(

          buildScarcityCombination({

            attributes,

            matchingCount:
              countMatchingListings(
                listings,
                attributes
              ),

            marketSize:
              listings.length,

            language

          })

        )

      })

    })

  })

  return discovered
    .filter(item => item.matchingCount > 0)
    .sort(
      (a, b) =>
        a.matchingCount -
        b.matchingCount
    )
}

export async function getMarketScarcity(
  filters: MarketFilters,
  language: ScarcityLanguage = 'en'
) {

  const market =
    await getMarketStatistics(
      filters
    )

  const listings =
    market.listings || []

  const selected =
    generateSelectedCombination(
      listings,
      filters,
      language
    )

  const combinations =
    discoverCombinations(
      listings,
      language
    )

  return {

    filters,

    marketSize:
      selected.marketSize,

    matchingCount:
      selected.matchingCount,

    scarcityShare:
      selected.scarcityShare,

    scarcityLevel:
      selected.scarcityLevel,

    selectedCombination:
      selected.selectedCombination,

    combinations:
      combinations.slice(0, 50)

  }

}