import { supabase } from '@/lib/supabase'

import type {
  ComparisonLanguage,
  ComparisonSummary,
  EntityComparison
} from '@/lib/comparisons/types'

export type EntityComparisonRow = {
  id: number
  left_term_id: number
  right_term_id: number
  metric_name: string
  left_value: number | null
  right_value: number | null
  difference: number | null
  calculated_at: string
}

export type EntityTermSummary = {
  id: number
  termName: string
  termNameEn: string | null
  termNameEs: string | null
  termType: string
  slug: string
  slugEn: string | null
  slugEs: string | null
}

export type EntityComparisonGroup = {
  leftTerm: EntityTermSummary
  rightTerm: EntityTermSummary
  metrics: EntityComparison[]
  calculatedAt: string
}

export type MarketHubEntityComparison =
  ComparisonSummary & {
    kind: 'entity'
    metricCount: number
    leftTermId: number
    rightTermId: number
  }

type OntologyTermRow = {
  id: number
  term_name: string
  term_name_en: string | null
  term_name_es: string | null
  term_type: string
  slug: string
  slug_en: string | null
  slug_es: string | null
}

function toEntityComparison(
  row: EntityComparisonRow
): EntityComparison {
  return {
    id: String(row.id),
    leftTermId: row.left_term_id,
    rightTermId: row.right_term_id,
    metricName: row.metric_name,
    leftValue: row.left_value,
    rightValue: row.right_value,
    difference: row.difference,
    calculatedAt: row.calculated_at
  }
}

function toEntityTermSummary(
  row: OntologyTermRow
): EntityTermSummary {
  return {
    id: row.id,
    termName: row.term_name,
    termNameEn: row.term_name_en,
    termNameEs: row.term_name_es,
    termType: row.term_type,
    slug: row.slug,
    slugEn: row.slug_en,
    slugEs: row.slug_es
  }
}

function getLocalizedTermName(
  term: EntityTermSummary,
  language: ComparisonLanguage
): string {
  if (language === 'es') {
    return (
      term.termNameEs ||
      term.termName ||
      term.slugEs ||
      term.slug
    )
  }

  return (
    term.termNameEn ||
    term.termName ||
    term.slugEn ||
    term.slug
  )
}

function getLocalizedSlug(
  term: EntityTermSummary,
  language: ComparisonLanguage
): string {
  if (language === 'es') {
    return (
      term.slugEs ||
      term.slug ||
      term.slugEn ||
      String(term.id)
    )
  }

  return (
    term.slugEn ||
    term.slug ||
    term.slugEs ||
    String(term.id)
  )
}

async function getTermsByIds(
  termIds: number[]
): Promise<Map<number, EntityTermSummary>> {
  const uniqueIds = Array.from(
    new Set(termIds)
  )

  if (!uniqueIds.length) {
    return new Map()
  }

  const { data, error } = await supabase
    .from('ontology_terms')
    .select(`
      id,
      term_name,
      term_name_en,
      term_name_es,
      term_type,
      slug,
      slug_en,
      slug_es
    `)
    .in('id', uniqueIds)

  if (error) {
    throw error
  }

  return new Map(
    (
      (data || []) as OntologyTermRow[]
    ).map(row => {
      const term =
        toEntityTermSummary(row)

      return [term.id, term]
    })
  )
}

export async function getEntityComparison({
  leftTermId,
  rightTermId
}: {
  leftTermId: number
  rightTermId: number
}): Promise<EntityComparisonGroup | null> {
  const { data, error } = await supabase
    .from('entity_comparison_statistics')
    .select(`
      id,
      left_term_id,
      right_term_id,
      metric_name,
      left_value,
      right_value,
      difference,
      calculated_at
    `)
    .eq('left_term_id', leftTermId)
    .eq('right_term_id', rightTermId)
    .order('metric_name', {
      ascending: true
    })

  if (error) {
    throw error
  }

  let rows =
    (data || []) as EntityComparisonRow[]

  let reversed = false

  if (!rows.length) {
    const {
      data: reverseData,
      error: reverseError
    } = await supabase
      .from('entity_comparison_statistics')
      .select(`
        id,
        left_term_id,
        right_term_id,
        metric_name,
        left_value,
        right_value,
        difference,
        calculated_at
      `)
      .eq('left_term_id', rightTermId)
      .eq('right_term_id', leftTermId)
      .order('metric_name', {
        ascending: true
      })

    if (reverseError) {
      throw reverseError
    }

    rows =
      (reverseData || []) as EntityComparisonRow[]

    reversed = rows.length > 0
  }

  if (!rows.length) {
    return null
  }

  const termMap = await getTermsByIds([
    leftTermId,
    rightTermId
  ])

  const requestedLeftTerm =
    termMap.get(leftTermId)

  const requestedRightTerm =
    termMap.get(rightTermId)

  if (
    !requestedLeftTerm ||
    !requestedRightTerm
  ) {
    throw new Error(
      'One or both ontology terms were not found.'
    )
  }

  const metrics = rows.map(row => {
    if (!reversed) {
      return toEntityComparison(row)
    }

    return {
      id: String(row.id),
      leftTermId,
      rightTermId,
      metricName: row.metric_name,
      leftValue: row.right_value,
      rightValue: row.left_value,

      difference:
        row.difference === null
          ? null
          : row.difference * -1,

      calculatedAt: row.calculated_at
    }
  })

  const calculatedAt =
    metrics.reduce(
      (latest, metric) => {
        if (!latest) {
          return metric.calculatedAt
        }

        return (
          new Date(metric.calculatedAt) >
          new Date(latest)
        )
          ? metric.calculatedAt
          : latest
      },
      ''
    )

  return {
    leftTerm: requestedLeftTerm,
    rightTerm: requestedRightTerm,
    metrics,
    calculatedAt
  }
}

export async function getEntityComparisonGroups(): Promise<
  EntityComparisonGroup[]
> {
  const { data, error } = await supabase
    .from('entity_comparison_statistics')
    .select(`
      id,
      left_term_id,
      right_term_id,
      metric_name,
      left_value,
      right_value,
      difference,
      calculated_at
    `)
    .order('calculated_at', {
      ascending: false
    })

  if (error) {
    throw error
  }

  const rows =
    (data || []) as EntityComparisonRow[]

  if (!rows.length) {
    return []
  }

  const termIds = rows.flatMap(row => [
    row.left_term_id,
    row.right_term_id
  ])

  const termMap =
    await getTermsByIds(termIds)

  const grouped = new Map<
    string,
    EntityComparisonRow[]
  >()

  for (const row of rows) {
    const key =
      `${row.left_term_id}:${row.right_term_id}`

    const existing =
      grouped.get(key) || []

    existing.push(row)
    grouped.set(key, existing)
  }

  const groups: EntityComparisonGroup[] = []

  for (const comparisonRows of grouped.values()) {
    const first = comparisonRows[0]

    const leftTerm =
      termMap.get(first.left_term_id)

    const rightTerm =
      termMap.get(first.right_term_id)

    if (!leftTerm || !rightTerm) {
      continue
    }

    groups.push({
      leftTerm,
      rightTerm,

      metrics:
        comparisonRows.map(
          toEntityComparison
        ),

      calculatedAt:
        comparisonRows.reduce(
          (latest, row) => {
            if (!latest) {
              return row.calculated_at
            }

            return (
              new Date(row.calculated_at) >
              new Date(latest)
            )
              ? row.calculated_at
              : latest
          },
          ''
        )
    })
  }

  return groups.sort(
    (a, b) =>
      new Date(b.calculatedAt).getTime() -
      new Date(a.calculatedAt).getTime()
  )
}

export async function getMarketHubEntityComparisons({
  language
}: {
  language: ComparisonLanguage
}): Promise<MarketHubEntityComparison[]> {
  const groups =
    await getEntityComparisonGroups()

  return groups.map(group => {
    const leftName =
      getLocalizedTermName(
        group.leftTerm,
        language
      )

    const rightName =
      getLocalizedTermName(
        group.rightTerm,
        language
      )

    const leftSlug =
      getLocalizedSlug(
        group.leftTerm,
        language
      )

    const rightSlug =
      getLocalizedSlug(
        group.rightTerm,
        language
      )

    const basePath =
      language === 'es'
        ? '/es/comparar/entidades'
        : '/en/compare/entities'

    const params = new URLSearchParams({
      left: leftSlug,
      right: rightSlug
    })

    return {
      id:
        `${group.leftTerm.id}:${group.rightTerm.id}`,

      kind: 'entity',
      title:
        `${leftName} vs ${rightName}`,

      summary:
        language === 'es'
          ? `${group.metrics.length} métricas de mercado comparadas.`
          : `${group.metrics.length} market metrics compared.`,

      updatedAt:
        new Date(
          group.calculatedAt
        ).toLocaleDateString(
          language === 'es'
            ? 'es-CR'
            : 'en-US'
        ),

      href:
        `${basePath}?${params.toString()}`,

      metricCount:
        group.metrics.length,

      leftTermId:
        group.leftTerm.id,

      rightTermId:
        group.rightTerm.id
    }
  })
}