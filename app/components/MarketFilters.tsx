'use client'

import {
  useEffect,
  useRef,
  useState
} from 'react'

import {
  useRouter
} from 'next/navigation'

import { validatePriceMeterApply, priceMeterConfigurationKey } from '@/lib/price-meter-apply-contract'

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
  onApply?: (filters: Record<string, string | undefined>) => Promise<void>
  appliedFilters?: Record<string, string | undefined>
}

export default function MarketFilters({
  options,
  filters,
  workspace,
  basePath = '/explore',
  language = 'en',
  onApply,
  appliedFilters
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

  const isPpm2 = workspace === 'price-meter'
  const inFlight = useRef(false)
  const [submitting, setSubmitting] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)
  const alreadyApplied = isPpm2 && appliedFilters !== undefined &&
    priceMeterConfigurationKey(draftFilters) === priceMeterConfigurationKey(appliedFilters)

  const incomingConfiguration = isPpm2
    ? priceMeterConfigurationKey(filters)
    : JSON.stringify(filters)
  const previousConfiguration = useRef({ workspace, key: incomingConfiguration })
  useEffect(() => {
    // A server-action rerender with identical URL configuration must not reset
    // an ordinary PPM2 draft or its relationship to the retained result.
    if ((!isPpm2 && !onApply) || previousConfiguration.current.workspace !== workspace ||
        previousConfiguration.current.key !== incomingConfiguration) {
      setDraftFilters(filters)
    }
    previousConfiguration.current = { workspace, key: incomingConfiguration }
  }, [filters, workspace, incomingConfiguration, isPpm2, onApply])

  function handleFilterChange(
    key: string,
    value: string
  ) {
    setApplyError(null)
    setDraftFilters(current =>
      applyFilterChange(
        current,
        key,
        value
      )
    )
  }

  async function handleApplyFilters() {
    if (isPpm2 || onApply) {
      if (inFlight.current || alreadyApplied) return
      try {
        if(isPpm2) validatePriceMeterApply(draftFilters)
      } catch {
        setApplyError(language === 'es'
          ? 'Selecciona Provincia, Cantón, Tipo de Transacción y Tipo de Propiedad.'
          : 'Select Province, Canton, Transaction Type and Property Type.')
        return
      }
      inFlight.current = true
      setSubmitting(true)
      setApplyError(null)
      try {
        if (!onApply) throw new Error('Missing PPM2 Apply boundary.')
        await onApply({ ...draftFilters })
      } catch {
        setApplyError(language === 'es'
          ? 'No se pudo generar el análisis. El resultado anterior se conserva. Inténtalo de nuevo.'
          : 'Unable to generate the analysis. The previous result is retained. Try again.')
      } finally {
        inFlight.current = false
        setSubmitting(false)
      }
      return
    }

              // TEMP PPM2 TRACE BEGIN
              const traceId = crypto.randomUUID()

              const destination = new URL(
                serializeFiltersUrl(draftFilters, basePath),
                window.location.origin
              )

              destination.searchParams.set('__ppm2trace', traceId)

              console.info(
                '[PPM2 TRACE]',
                JSON.stringify({
                  stage: 'apply',
                  traceId,
                  eventId: crypto.randomUUID(),
                  destination: destination.pathname + destination.search,
                })
              )

              router.push(
                destination.pathname + destination.search + destination.hash
              )
  // TEMP PPM2 TRACE END
}

  return (
    <>
      <div style={resetWrap}>
        {isPpm2 ? <button type="button" style={{ ...resetLink, background: 'none', border: 0, cursor: 'pointer' }}
          onClick={() => { setDraftFilters({}); setApplyError(null) }}>
          {text.resetExplorer}
        </button> : (        <a
          href={basePath}
          style={resetLink}
        >
          {mode === 'comparison'
            ? text.resetComparison
            : text.resetExplorer}
        </a>)}

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
          onClick={handleApplyFilters}
          disabled={!!(isPpm2 || onApply) && (submitting || alreadyApplied)}
          aria-busy={isPpm2 && submitting}
          style={{
            background: isPpm2 && (alreadyApplied || submitting) ? '#666' : '#fff',
            border: '1px solid #fff',
            color: '#000',
            padding: '12px 20px',
            borderRadius: '999px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {submitting ? (language === 'es' ? 'Analizando…' : 'Analyzing…')
            : language === 'es' ? 'Aplicar filtros' : 'Apply Filters'}
        </button>
      </div>
      {applyError && <p role="alert" style={{ color: '#ffb3b3' }}>{applyError}</p>}
    </>
  )
}