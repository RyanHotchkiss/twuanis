export type ScraperSource = {
  id: 'encuentra24' | 'helcor'
  label: { en: string; es: string }
  selections: Array<{ id: string; label: { en: string; es: string } }>
  operational: boolean
  unavailableReason?: { en: string; es: string }
}

// This is the single extension point for source controls. A source is not
// executable until its local command-listener adapter is installed.
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
    selections: [
      { id: 'helcor-sale', label: { en: 'Sale', es: 'Venta' } },
      { id: 'helcor-rent', label: { en: 'Rent', es: 'Alquiler' } }
    ],
    operational: false,
    unavailableReason: {
      en: 'The local HELCOR command adapter is not installed yet.',
      es: 'El adaptador local de comandos de HELCOR aún no está instalado.'
    }
  }
]

export const operationalScraperIds = scraperSources.filter(source => source.operational).flatMap(source => source.selections.map(selection => selection.id))
