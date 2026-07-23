'use client'

import { supabase } from '@/lib/supabase'

import {
  getCurrentUser
} from '@/lib/auth/current-user'

import type {
  ComparisonFilters,
  ComparisonLanguage,
  ComparisonSummary,
  MarketComparison
} from '@/lib/comparisons/types'

export type MarketComparisonFilters =
  ComparisonFilters

export type MarketComparisonRow = {
  id: string
  user_id: string
  name: string
  left_filters: ComparisonFilters
  right_filters: ComparisonFilters
  comparison_result: unknown
  created_at: string
  updated_at: string
}

export type MarketHubMarketComparison =
  ComparisonSummary & {
    kind: 'market'
    marketCount: number
  }

type ComparisonFilterValue =
  | string
  | number
  | boolean
  | null
  | undefined

export type ComparisonFilterInput =
  Record<string, ComparisonFilterValue>

function toMarketComparison(
  row: MarketComparisonRow
): MarketComparison {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    leftFilters: row.left_filters,
    rightFilters: row.right_filters,
    comparisonResult:
      row.comparison_result,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function extractSideFilters(
  filters: ComparisonFilterInput,
  side: 'a' | 'b'
): ComparisonFilters {
  const prefix = `${side}_`

  return Object.entries(filters).reduce(
    (result, [key, value]) => {
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
        normalizedKey as keyof ComparisonFilters
      ] = String(value)

      return result
    },
    {} as ComparisonFilters
  )
}

function getMarketName(
  filters: ComparisonFilters,
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

function createComparisonParams(
  comparison: MarketComparisonRow
): URLSearchParams {
  const params = new URLSearchParams()

  Object.entries(
    comparison.left_filters
  ).forEach(([key, value]) => {
    if (value) {
      params.set(
        `a_${key}`,
        String(value)
      )
    }
  })

  Object.entries(
    comparison.right_filters
  ).forEach(([key, value]) => {
    if (value) {
      params.set(
        `b_${key}`,
        String(value)
      )
    }
  })

  return params
}

export function createMarketComparisonName({
  filters,
  language
}: {
  filters: ComparisonFilterInput
  language: ComparisonLanguage
}): string {
  const leftFilters =
    extractSideFilters(filters, 'a')

  const rightFilters =
    extractSideFilters(filters, 'b')

  const leftName = getMarketName(
    leftFilters,
    language === 'es'
      ? 'Mercado A'
      : 'Market A'
  )

  const rightName = getMarketName(
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
  result,
  language = 'en'
}: {
  name: string
  filters: ComparisonFilterInput
  result: unknown
  language?: ComparisonLanguage
}): Promise<MarketComparison> {
  const user =
  await getCurrentUser()

if (!user) {
    throw new Error(
      language === 'es'
        ? 'Debes iniciar sesión para guardar una comparación.'
        : 'You must sign in to save a comparison.'
    )
  }

  const leftFilters =
    extractSideFilters(filters, 'a')

  const rightFilters =
    extractSideFilters(filters, 'b')

  if (
    Object.keys(leftFilters).length === 0 ||
    Object.keys(rightFilters).length === 0
  ) {
    throw new Error(
      language === 'es'
        ? 'Ambos mercados deben contener filtros.'
        : 'Both markets must contain filters.'
    )
  }

  const defaultName =
    language === 'es'
      ? 'Comparación de mercados'
      : 'Market Comparison'

  const { data, error } = await supabase
    .from('market_comparisons')
    .insert({
      user_id: user.id,
      name: name.trim() || defaultName,
      left_filters: leftFilters,
      right_filters: rightFilters,
      comparison_result: result
    })
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
    .single()

  if (error) {
    throw error
  }

  return toMarketComparison(
    data as MarketComparisonRow
  )
}

export async function getMarketComparison(
  comparisonId: string
): Promise<MarketComparison | null> {
  const user =
  await getCurrentUser()

if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('market_comparisons')
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
    .eq('id', comparisonId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  return toMarketComparison(
    data as MarketComparisonRow
  )
}

export async function getMarketComparisons({
  language
}: {
  language: ComparisonLanguage
}): Promise<MarketHubMarketComparison[]> {
  const user =
    await getCurrentUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('market_comparisons')
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
    .eq('user_id', user.id)
    .order('updated_at', {
      ascending: false
    })

  if (error) {
    throw error
  }

  return (
    (data || []) as MarketComparisonRow[]
  ).map(comparison => {
    const params =
      createComparisonParams(comparison)

    const basePath =
      language === 'es'
        ? '/es/comparar/mercados'
        : '/en/compare/markets'

    return {
      id: comparison.id,
      kind: 'market',
      title: comparison.name,
      marketCount: 2,

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
        `${basePath}?${params.toString()}`
    }
  })
}

export async function updateMarketComparisonName({
  comparisonId,
  name,
  language = 'en'
}: {
  comparisonId: string
  name: string
  language?: ComparisonLanguage
}): Promise<MarketComparison> {
  const trimmedName = name.trim()

  if (!trimmedName) {
    throw new Error(
      language === 'es'
        ? 'El nombre es obligatorio.'
        : 'The name is required.'
    )
  }

  const user =
    await getCurrentUser()

  if (!user) {
    throw new Error(
      language === 'es'
        ? 'Debes iniciar sesión.'
        : 'Authentication required.'
    )
  }

  const { data, error } = await supabase
    .from('market_comparisons')
    .update({
      name: trimmedName
    })
    .eq('id', comparisonId)
    .eq('user_id', user.id)
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
    .single()

  if (error) {
    throw error
  }

  return toMarketComparison(
    data as MarketComparisonRow
  )
}

export async function deleteMarketComparison(
  comparisonId: string
): Promise<void> {
  const user =
    await getCurrentUser()

  if (!user) {
    throw new Error(
      'Authentication required.'
    )
  }

  const { error } = await supabase
    .from('market_comparisons')
    .delete()
    .eq('id', comparisonId)
    .eq('user_id', user.id)

  if (error) {
    throw error
  }
}