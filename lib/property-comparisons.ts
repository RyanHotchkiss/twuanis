'use client'

import { supabase } from '@/lib/supabase'

import {
  getCurrentUser
} from '@/lib/auth/current-user'

import type {
  ComparisonLanguage,
  ComparisonSummary,
  PropertyComparison
} from '@/lib/comparisons/types'

import {
  trackComparisonCreated,
  trackComparisonDeleted
} from '@/lib/activity/comparisons'

export type PropertyComparisonRow = {
  id: string
  user_id: string
  name: string
  property_ids: string[]
  created_at: string
  updated_at: string
}

export type MarketHubPropertyComparison =
  ComparisonSummary & {
    kind: 'property'
    propertyCount: number
    timestamp: string
  }

function toPropertyComparison(
  row: PropertyComparisonRow
): PropertyComparison {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    propertyIds: row.property_ids,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function getPropertyComparisonPath(
  language: ComparisonLanguage
): string {
  return language === 'es'
    ? '/es/comparar/propiedades'
    : '/en/compare/properties'
}

function createPropertyComparisonParams(
  propertyIds: string[]
): URLSearchParams {
  const params = new URLSearchParams()

  propertyIds.forEach(propertyId => {
    params.append(
      'property',
      propertyId
    )
  })

  return params
}

export async function savePropertyComparison({
  name,
  propertyIds,
  language = 'en'
}: {
  name: string
  propertyIds: string[]
  language?: ComparisonLanguage
}): Promise<PropertyComparison> {
  const user =
    await getCurrentUser()

  if (!user) {
    throw new Error(
      language === 'es'
        ? 'Debes iniciar sesión para guardar una comparación.'
        : 'You must sign in to save a comparison.'
    )
  }

  const normalizedPropertyIds =
    Array.from(
      new Set(
        propertyIds
          .map(propertyId =>
            propertyId.trim()
          )
          .filter(Boolean)
      )
    )

  if (
    normalizedPropertyIds.length < 2
  ) {
    throw new Error(
      language === 'es'
        ? 'Selecciona al menos dos propiedades.'
        : 'Select at least two properties.'
    )
  }

  const defaultName =
    language === 'es'
      ? 'Comparación de propiedades'
      : 'Property Comparison'

  const {
    data,
    error
  } = await supabase
    .from('property_comparisons')
    .insert({
      user_id: user.id,
      name:
        name.trim() ||
        defaultName,
      property_ids:
        normalizedPropertyIds
    })
    .select(`
      id,
      user_id,
      name,
      property_ids,
      created_at,
      updated_at
    `)
    .single()

  if (error) {
    throw error
  }

  const comparison =
      toPropertyComparison(
        data as PropertyComparisonRow
      )

    await trackComparisonCreated({
      comparisonId: comparison.id,
      metadata: {
        propertyCount:
          comparison.propertyIds.length
      }
    })

    return comparison
}

export async function getPropertyComparison(
  comparisonId: string
): Promise<PropertyComparison | null> {
  const user =
  await getCurrentUser()

  if (!user) {
    return null
  }

  const {
    data,
    error
  } = await supabase
    .from('property_comparisons')
    .select(`
      id,
      user_id,
      name,
      property_ids,
      created_at,
      updated_at
    `)
    .eq(
      'id',
      comparisonId
    )
    .eq(
      'user_id',
      user.id
    )
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  return toPropertyComparison(
    data as PropertyComparisonRow
  )
}

export async function getPropertyComparisonRows():
    Promise<PropertyComparison[]> {
      const user =
      await getCurrentUser()

    if (!user) {
        return []
      }

      const {
        data,
        error
      } = await supabase
        .from('property_comparisons')
        .select(`
          id,
          user_id,
          name,
          property_ids,
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
        throw error
      }

      return (
        (data || []) as
          PropertyComparisonRow[]
      ).map(
        toPropertyComparison
      )
    }

export async function getPropertyComparisons({
      language
    }: {
      language: ComparisonLanguage
    }): Promise<
      MarketHubPropertyComparison[]
    > {
      const comparisons =
        await getPropertyComparisonRows()

      const basePath =
        getPropertyComparisonPath(
          language
        )

      return comparisons.map(
        comparison => {
          const params =
            createPropertyComparisonParams(
              comparison.propertyIds
            )

          return {
            id:
              comparison.id,

            kind:
              'property',

            title:
              comparison.name,

            summary:
              language === 'es'
                ? `${comparison.propertyIds.length} propiedades guardadas en esta comparación.`
                : `${comparison.propertyIds.length} properties saved in this comparison.`,

            updatedAt:
              new Date(
                comparison.updatedAt
              ).toLocaleDateString(
                language === 'es'
                  ? 'es-CR'
                  : 'en-US'
              ),

            timestamp:
              comparison.updatedAt,

            href:
              `${basePath}?${params.toString()}`,

            propertyCount:
              comparison.propertyIds.length
          }
        }
      )
    }

export async function updatePropertyComparison({
      comparisonId,
      name,
      propertyIds,
      language = 'en'
    }: {
      comparisonId: string
      name?: string
      propertyIds?: string[]
      language?: ComparisonLanguage
    }): Promise<PropertyComparison> {
      const user =
      await getCurrentUser()

    if (!user) {
        throw new Error(
          language === 'es'
            ? 'Debes iniciar sesión.'
            : 'Authentication required.'
        )
      }

      const updates: {
        name?: string
        property_ids?: string[]
      } = {}

      if (name !== undefined) {
        const trimmedName =
          name.trim()

        if (!trimmedName) {
          throw new Error(
            language === 'es'
              ? 'El nombre es obligatorio.'
              : 'The name is required.'
          )
        }

        updates.name =
          trimmedName
      }

      if (propertyIds !== undefined) {
        const normalizedPropertyIds =
          Array.from(
            new Set(
              propertyIds
                .map(propertyId =>
                  propertyId.trim()
                )
                .filter(Boolean)
            )
          )

        if (
          normalizedPropertyIds.length < 2
        ) {
          throw new Error(
            language === 'es'
              ? 'Selecciona al menos dos propiedades.'
              : 'Select at least two properties.'
          )
        }

        updates.property_ids =
          normalizedPropertyIds
      }

      if (
        Object.keys(updates).length === 0
      ) {
        const existing =
          await getPropertyComparison(
            comparisonId
          )

        if (!existing) {
          throw new Error(
            language === 'es'
              ? 'No se encontró la comparación.'
              : 'Comparison not found.'
          )
        }

        return existing
      }

      
      const {
        data,
        error
      } = await supabase
        .from('property_comparisons')
        .update(updates)
        .eq(
          'id',
          comparisonId
        )
        .eq(
          'user_id',
          user.id
        )
        .select(`
          id,
          user_id,
          name,
          property_ids,
          created_at,
          updated_at
        `)
        .single()

      if (error) {
        throw error
      }

      return toPropertyComparison(
        data as PropertyComparisonRow
      )
    }

    export async function duplicatePropertyComparison({
      comparisonId,
      language = 'en'
    }: {
      comparisonId: string
      language?: ComparisonLanguage
    }): Promise<PropertyComparison> {
      const comparison =
        await getPropertyComparison(
          comparisonId
        )

      if (!comparison) {
        throw new Error(
          language === 'es'
            ? 'No se encontró la comparación.'
            : 'Comparison not found.'
        )
      }

      return savePropertyComparison({
        name:
          language === 'es'
            ? `${comparison.name} (Copia)`
            : `${comparison.name} (Copy)`,
        propertyIds:
          comparison.propertyIds,
        language
      })
    }

export async function deletePropertyComparison(
  comparisonId: string
): Promise<void> {
  const user =
    await getCurrentUser()

  if (!user) {
    throw new Error(
      'Authentication required.'
    )
  }

  const {
    error
  } = await supabase
    .from('property_comparisons')
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

    await trackComparisonDeleted({
      comparisonId
    })
}

