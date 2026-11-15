export type ScraperSource = {
  id: 'encuentra24' | 'helcor' | 'remax-central' | 'inmobiliaria-cdj' | 'montero-realty-group' | 'devop'
  label: { en: string; es: string }
  selections: Array<{ id: string; label: { en: string; es: string } }>
  operational: boolean
  agency?: { label: string; sourceName: string }
  unavailableReason?: { en: string; es: string }
}

// This is the single extension point for source controls.  WASI sites share
// one runner and one canonical-admission bridge; adding a site is configuration
// plus a registry entry, never a separate execution architecture.
export const scraperSources: ScraperSource[] = [
  {
    id: 'encuentra24',
    label: { en: 'Encuentra24', es: 'Encuentra24' },
    selections: [
      { id: 'encuentra24-sale', label: { en: 'Sale', es: 'Venta' } },
      { id: 'encuentra24-rent', label: { en: 'Rent', es: 'Alquiler' } }
    ],
    operational: true
  },
  {
    id: 'helcor',
    label: { en: 'HELCOR', es: 'HELCOR' },
    agency: { label: 'HELCOR Inmobiliaria', sourceName: 'HELCOR' },
    selections: [
      { id: 'helcor-sale', label: { en: 'Sale', es: 'Venta' } },
      { id: 'helcor-rent', label: { en: 'Rent', es: 'Alquiler' } }
    ],
    operational: true
  },
  {
    id: 'remax-central', label: { en: 'RE/MAX Central', es: 'RE/MAX Central' },
    agency: { label: 'RE/MAX Central', sourceName: 'RE/MAX Central' },
    selections: [{ id: 'remax-central-sale', label: { en: 'Sale', es: 'Venta' } }, { id: 'remax-central-rent', label: { en: 'Rent', es: 'Alquiler' } }], operational: true
  },
  {
    id: 'inmobiliaria-cdj', label: { en: 'Inmobiliaria CDJ', es: 'Inmobiliaria CDJ' },
    agency: { label: 'Inmobiliaria CDJ', sourceName: 'Inmobiliaria CDJ' },
    selections: [{ id: 'inmobiliaria-cdj-sale', label: { en: 'Sale', es: 'Venta' } }, { id: 'inmobiliaria-cdj-rent', label: { en: 'Rent', es: 'Alquiler' } }], operational: true
  },
  {
    id: 'montero-realty-group', label: { en: 'Montero Realty Group', es: 'Montero Realty Group' },
    agency: { label: 'Montero Realty Group', sourceName: 'Montero Realty Group' },
    selections: [{ id: 'montero-realty-group-sale', label: { en: 'Sale', es: 'Venta' } }, { id: 'montero-realty-group-rent', label: { en: 'Rent', es: 'Alquiler' } }], operational: true
  },
  { id: 'devop', label: { en: 'Devop', es: 'Devop' }, agency: { label: 'Devop', sourceName: 'Devop' }, selections: [{ id: 'devop-sale', label: { en: 'Sale', es: 'Venta' } }], operational: true }
]

export const operationalScraperIds = scraperSources.filter(source => source.operational).flatMap(source => source.selections.map(selection => selection.id))
