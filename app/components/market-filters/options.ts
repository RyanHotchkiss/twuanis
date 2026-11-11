import type {
  FilterOption,
  Language
} from './types'

export const transactionOptions: Record<
  Language,
  FilterOption[]
> = {
  en: [
    {
      slug: 'sale',
      term_name_en: 'For Sale'
    },
    {
      slug: 'rent',
      term_name_en: 'For Rent'
    }
  ],

  es: [
    {
      slug: 'sale',
      term_name_es: 'En Venta'
    },
    {
      slug: 'rent',
      term_name_es: 'En Alquiler'
    }
  ]
}

export const priceRangeOptions: FilterOption[] = [
  {
    slug: '0-25000000',
    term_name: '₡0 – ₡25M'
  },
  {
    slug: '25000000-50000000',
    term_name: '₡25M – ₡50M'
  },
  {
    slug: '50000000-100000000',
    term_name: '₡50M – ₡100M'
  },
  {
    slug: '100000000-250000000',
    term_name: '₡100M – ₡250M'
  },
  {
    slug: '250000000+',
    term_name: '₡250M+'
  }
]