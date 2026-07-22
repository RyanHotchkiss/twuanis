'use client'

import {
  supabase
} from '@/lib/supabase'

export type MarketComparisonFilters = {
  transaction_type?: string
  province?: string
  canton?: string
  district?: string
  property_type?: string
  bedrooms?: string
  bathrooms?: string
  parking?: string
  price_range?: string
  year_built?: string
  property_area?: string
  construction_area?: string
  utility?: string
  environment?: string
  terrain?: string
  accessibility?: string
  legal_status?: string
}

export type MarketComparisonRow = {
  id: string
  user_id: string
  name: string
  left_filters:
    MarketComparisonFilters
  right_filters:
    MarketComparisonFilters
  comparison_result:
    unknown
  created_at: string
  updated_at: string
}

export type MarketHubMarketComparison = {
  id: string
  title: string
  marketCount: number
  summary: string
  updatedAt: string
  href: string
}

type ComparisonFilterInput =
  Record<
    string,
    string |
    number |
    boolean |
    null |
    undefined
  >

function extractSideFilters(
  filters:
    ComparisonFilterInput,
  side: 'a' | 'b'
): MarketComparisonFilters {
  const prefix =
    `${side}_`

  return Object.entries(filters)
    .reduce(
      (
        result,
        [key, value]
      ) => {
        if (
          !key.startsWith(prefix) ||
          value === undefined ||
          value === null ||
          value === ''
        ) {
          return result
        }

        const normalizedKey =
          key.slice(prefix.length)

        result[
          normalizedKey as
            keyof MarketComparisonFilters
        ] = String(value)

        return result
      },
      {} as MarketComparisonFilters
    )
}

function getMarketName(
  filters:
    MarketComparisonFilters,
  fallback: string
): string {
  const location = [
    filters.district,
    filters.canton,
    filters.province
  ]
    .filter(Boolean)
    .join(', ')

  const characteristics = [
    filters.property_type,
    filters.transaction_type
  ]
    .filter(Boolean)
    .join(' · ')

  return [
    location || fallback,
    characteristics
  ]
    .filter(Boolean)
    .join(' · ')
}

export function createMarketComparisonName({
  filters,
  language
}: {
  filters:
    ComparisonFilterInput
  language:
    'en' | 'es'
}): string {
  const leftFilters =
    extractSideFilters(
      filters,
      'a'
    )

  const rightFilters =
    extractSideFilters(
      filters,
      'b'
    )

  const leftName =
    getMarketName(
      leftFilters,
      language === 'es'
        ? 'Mercado A'
        : 'Market A'
    )

  const rightName =
    getMarketName(
      rightFilters,
      language === 'es'
        ? 'Mercado B'
        : 'Market B'
    )

  return `${leftName} vs ${rightName}`
}

export async function saveMarketComparison({
  name,
  filters,
  result
}: {
  name: string
  filters:
    ComparisonFilterInput
  result: unknown
}): Promise<MarketComparisonRow> {
  const {
    data: {
      user
    }
  } =
    await supabase.auth.getUser()

  if (!user) {
    throw new Error(
      'Authentication required.'
    )
  }

  const leftFilters =
    extractSideFilters(
      filters,
      'a'
    )

  const rightFilters =
    extractSideFilters(
      filters,
      'b'
    )

  if (
    Object.keys(leftFilters)
      .length === 0 ||
    Object.keys(rightFilters)
      .length === 0
  ) {
    throw new Error(
      'Both markets must contain filters.'
    )
  }

  const {
    data,
    error
  } =
    await supabase
      .from(
        'market_comparisons'
      )
      .insert({
        user_id:
          user.id,

        name:
          name.trim() ||
          'Market Comparison',

        left_filters:
          leftFilters,

        right_filters:
          rightFilters,

        comparison_result:
          result
      })
      .select()
      .single()

  if (error) {
    throw error
  }

  return data as
    MarketComparisonRow
}

export async function getMarketComparisons({
  language
}: {
  language:
    'en' | 'es'
}): Promise<
  MarketHubMarketComparison[]
> {
  const {
    data: {
      user
    }
  } =
    await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const {
    data,
    error
  } =
    await supabase
      .from(
        'market_comparisons'
      )
      .select(`
        id,
        user_id,
        name,
        left_filters,
        right_filters,
        comparison_result,
        created_at,
        updated_at
      `)
      .eq(
        'user_id',
        user.id
      )
      .order(
        'updated_at',
        {
          ascending: false
        }
      )

  if (error) {
    console.error(
      'GET MARKET COMPARISONS ERROR:',
      error
    )

    return []
  }

  return (
    data as
      MarketComparisonRow[]
  ).map(
    comparison => {
      const params =
        new URLSearchParams()

      params.set(
        'tab',
        'comparison'
      )

      Object.entries(
        comparison.left_filters
      ).forEach(
        ([key, value]) => {
          if (value) {
            params.set(
              `a_${key}`,
              String(value)
            )
          }
        }
      )

      Object.entries(
        comparison.right_filters
      ).forEach(
        ([key, value]) => {
          if (value) {
            params.set(
              `b_${key}`,
              String(value)
            )
          }
        }
      )

      return {
        id:
          comparison.id,

        title:
          comparison.name,

        marketCount:
          2,

        summary:
          language === 'es'
            ? 'Comparación guardada de dos mercados inmobiliarios.'
            : 'Saved comparison of two real estate markets.',

        updatedAt:
          new Date(
            comparison.updated_at
          ).toLocaleDateString(
            language === 'es'
              ? 'es-CR'
              : 'en-US'
          ),

        href:
          `${
            language === 'es'
              ? '/es/inteligencia-de-mercado'
              : '/en/market-intelligence'
          }?${params.toString()}`
      }
    }
  )
}

export async function deleteMarketComparison(
  comparisonId: string
): Promise<void> {
  const {
    data: {
      user
    }
  } =
    await supabase.auth.getUser()

  if (!user) {
    throw new Error(
      'Authentication required.'
    )
  }

  const {
    error
  } =
    await supabase
      .from(
        'market_comparisons'
      )
      .delete()
      .eq(
        'id',
        comparisonId
      )
      .eq(
        'user_id',
        user.id
      )

  if (error) {
    throw error
  }
}