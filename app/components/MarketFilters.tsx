'use client'

import {
  useEffect,
  useState
} from 'react'

import {
  useRouter
} from 'next/navigation'

import FilterColumn from './market-filters/FilterColumn'

import {
  getIntelligenceWorkspaceFilterDefinition,
  type IntelligenceWorkspaceId
} from './market-filters/filter-registry'

import {
  getUi
} from './market-filters/translations'

import {
  applyFilterChange,
  serializeFiltersUrl
} from './market-filters/utils'

import {
  comparisonGrid,
  resetLink,
  resetWrap
} from './market-filters/styles'

type Props = {
  options: any
  filters: Record<string, string | undefined>
  workspace: IntelligenceWorkspaceId
  basePath?: string
  language?: 'en' | 'es'
}

export default function MarketFilters({
  options,
  filters,
  workspace,
  basePath = '/explore',
  language = 'en'
}: Props) {
  const router = useRouter()

  const text =
    getUi(language)

  const workspaceDefinition =
    getIntelligenceWorkspaceFilterDefinition(
      workspace
    )

  const mode =
    workspaceDefinition.mode

  const [
    draftFilters,
    setDraftFilters
  ] = useState(filters)

  useEffect(() => {
    setDraftFilters(filters)
  }, [filters])

  function handleFilterChange(
    key: string,
    value: string
  ) {
    setDraftFilters(current =>
      applyFilterChange(
        current,
        key,
        value
      )
    )
  }

  function handleApplyFilters() {
    router.push(
      serializeFiltersUrl(
        draftFilters,
        basePath
      )
    )
  }

  return (
    <>
      <div style={resetWrap}>
        <a
          href={basePath}
          style={resetLink}
        >
          {mode === 'comparison'
            ? text.resetComparison
            : text.resetExplorer}
        </a>
      </div>

      {mode === 'comparison' ? (
        <div style={comparisonGrid}>
          <FilterColumn
            title={text.marketA}
            prefix="a_"
            options={options}
            filters={draftFilters}
            language={language}
            text={text}
            filterKeys={
                workspaceDefinition.filters
              }
            onFilterChange={
              handleFilterChange
            }
          />

          <FilterColumn
            title={text.marketB}
            prefix="b_"
            options={options}
            filters={draftFilters}
            language={language}
            text={text}
            filterKeys={
                workspaceDefinition.filters
              }
            onFilterChange={
              handleFilterChange
            }
          />
        </div>
      ) : (
        <FilterColumn
            prefix=""
            options={options}
            filters={draftFilters}
            language={language}
            text={text}
            filterKeys={
                workspaceDefinition.filters
              }
            onFilterChange={
              handleFilterChange
            }
          />
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: '1.5rem'
        }}
      >
        <button
          type="button"
          onClick={
            handleApplyFilters
          }
          style={{
            background: '#fff',
            border: '1px solid #fff',
            color: '#000',
            padding: '12px 20px',
            borderRadius: '999px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {language === 'es'
            ? 'Aplicar filtros'
            : 'Apply Filters'}
        </button>
      </div>
    </>
  )
}