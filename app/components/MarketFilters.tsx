'use client'

import FilterColumn from './market-filters/FilterColumn'

import {
  getUi
} from './market-filters/translations'

import {
  comparisonGrid,
  resetLink,
  resetWrap
} from './market-filters/styles'

type Props = {
  options: any
  filters: Record<string, string | undefined>
  basePath?: string
  mode?: 'single' | 'comparison'
  language?: 'en' | 'es'
}

export default function MarketFilters({
  options,
  filters,
  basePath = '/explore',
  mode = 'single',
  language = 'en'
}: Props) {

  const text = getUi(language)

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
            filters={filters}
            basePath={basePath}
            language={language}
            text={text}
          />

          <FilterColumn
            title={text.marketB}
            prefix="b_"
            options={options}
            filters={filters}
            basePath={basePath}
            language={language}
            text={text}
          />
        </div>
      ) : (
        <FilterColumn
          prefix=""
          options={options}
          filters={filters}
          basePath={basePath}
          language={language}
          text={text}
        />
      )}
    </>
  )
}