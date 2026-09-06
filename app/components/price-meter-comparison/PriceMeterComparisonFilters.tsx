'use client'

import FilterSelect from '@/app/components/market-filters/FilterSelect'

import type {
  ExplorerOption
} from '@/lib/explorer-options-engine'

import PriceMeterComparisonCohortColumn from './PriceMeterComparisonCohortColumn'

type Language =
  | 'en'
  | 'es'


type Filters =
  Record<
    string,
    string | undefined
  >


type ExplorerOptions = {
  province: ExplorerOption[]
  canton: ExplorerOption[]
  district: ExplorerOption[]
  property_type: ExplorerOption[]
  bedrooms: ExplorerOption[]
  bathrooms: ExplorerOption[]
  parking: ExplorerOption[]
  year_built: ExplorerOption[]
  property_area: ExplorerOption[]
  construction_area: ExplorerOption[]
  utility: ExplorerOption[]
  environment: ExplorerOption[]
  terrain: ExplorerOption[]
  accessibility: ExplorerOption[]
  legal_status: ExplorerOption[]
}


type Props = {
  options: ExplorerOptions
  filters: Filters
  basePath: string
  language: Language
}


export default function PriceMeterComparisonFilters({
  options,
  filters,
  basePath,
  language
}: Props) {
  const text =
    language === 'es'
      ? {
          analyticalIdentity:
            'Identidad analítica',
          transactionType:
            'Tipo de transacción',
          propertyBasis:
            'Base de propiedad',
          normalizationBasis:
            'Base de normalización',
          referenceCohort:
            'Cohorte de referencia',
          cohortA:
            'Cohorte A',
          cohortB:
            'Cohorte B'
        }
      : {
          analyticalIdentity:
            'Analytical Identity',
          transactionType:
            'Transaction Type',
          propertyBasis:
            'Property Basis',
          normalizationBasis:
            'Normalization Basis',
          referenceCohort:
            'Reference Cohort',
          cohortA:
            'Cohort A',
          cohortB:
            'Cohort B'
        }


  const transactionOptions =
    language === 'es'
      ? [
          {
            slug:
              'sale',
            term_name:
              'Venta'
          },
          {
            slug:
              'rent',
            term_name:
              'Alquiler'
          }
        ]
      : [
          {
            slug:
              'sale',
            term_name:
              'Sale'
          },
          {
            slug:
              'rent',
            term_name:
              'Rent'
          }
        ]

    const propertyBasisOptions =
        language === 'es'
        ? [
            {
                slug:
                'land_only',
                term_name:
                'Terreno vacío'
            },
            {
                slug:
                'improved_property',
                term_name:
                'Propiedad mejorada'
            }
            ]
        : [
            {
                slug:
                'land_only',
                term_name:
                'Vacant Land'
            },
            {
                slug:
                'improved_property',
                term_name:
                'Improved Property'
            }
            ]

        const normalizationBasisOptions =
            language === 'es'
            ? [
                {
                    slug:
                    'land',
                    term_name:
                    'Terreno'
                },
                {
                    slug:
                    'construction',
                    term_name:
                    'Construcción'
                }
                ]
            : [
                {
                    slug:
                    'land',
                    term_name:
                    'Land'
                },
                {
                    slug:
                    'construction',
                    term_name:
                    'Construction'
                }
                ]

        const referenceCohortOptions =
            language === 'es'
            ? [
                {
                    slug:
                    'A',
                    term_name:
                    'Cohorte A'
                },
                {
                    slug:
                    'B',
                    term_name:
                    'Cohorte B'
                }
                ]
            : [
          {
            slug:
              'A',
            term_name:
              'Cohort A'
          },
          {
            slug:
              'B',
            term_name:
              'Cohort B'
          }
        ]

  return (
    <section>
      <h2>
        {text.analyticalIdentity}
      </h2>

      <FilterSelect
        label={text.transactionType}
        filterKey="transaction_type"
        options={transactionOptions}
        filters={filters}
        basePath={basePath}
        language={language}
      />

      <FilterSelect
        label={text.propertyBasis}
        filterKey="property_basis"
        options={propertyBasisOptions}
        filters={filters}
        basePath={basePath}
        language={language}
      />

      <FilterSelect
        label={text.normalizationBasis}
        filterKey="normalization_basis"
        options={normalizationBasisOptions}
        filters={filters}
        basePath={basePath}
        language={language}
      />

    <FilterSelect
        label={text.referenceCohort}
        filterKey="reference_cohort"
        options={referenceCohortOptions}
        filters={filters}
        basePath={basePath}
        language={language}
      />

            <PriceMeterComparisonCohortColumn
        title={text.cohortA}
        prefix="a_"
        options={options}
        filters={filters}
        basePath={basePath}
        language={language}
      />

      <PriceMeterComparisonCohortColumn
        title={text.cohortB}
        prefix="b_"
        options={options}
        filters={filters}
        basePath={basePath}
        language={language}
      />

    </section>
  )
}