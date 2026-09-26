// These are input codes, not translated labels or inferred ontology slugs.
// The intervals are the approved numerical meaning of the older MI selector.
export const MARKET_YEAR_BUILT_OPTIONS = [
  { key: 'Pre-1980', lower: null, upper: 1980, en: 'Pre-1980', es: 'Antes de 1980' },
  { key: '1980s', lower: 1980, upper: 1990, en: '1980s', es: 'Década de 1980' },
  { key: '1990s', lower: 1990, upper: 2000, en: '1990s', es: 'Década de 1990' },
  { key: '2000s', lower: 2000, upper: 2010, en: '2000s', es: 'Década de 2000' },
  { key: '2010s', lower: 2010, upper: 2020, en: '2010s', es: 'Década de 2010' },
  { key: '2020+', lower: 2020, upper: null, en: '2020+', es: '2020+' },
] as const
