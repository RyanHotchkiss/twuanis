import type { Phase14BrowserObservation, Phase14BrowserSuccess, Phase14BrowserFilters } from './phase14-browser-contract'
import type { Phase14ApplicationRequest, Phase14ListingPresentation } from './comparative-discovery-contract'
export type Language = 'en' | 'es'
export type DisplayRow = { analysis: Phase14BrowserObservation; listing: Phase14ListingPresentation | null }
export const positions = ['below_p10','p10_to_p25','p25_to_median','at_median','median_to_p75','p75_to_p90','above_p90'] as const
export const positionLabels = {
  en: ['Below P10','P10 to P25','P25 to median','At median','Median to P75','P75 to P90','Above P90'],
  es: ['Por debajo de P10','P10 a P25','P25 a mediana','En la mediana','Mediana a P75','P75 a P90','Por encima de P90'],
}
export type Column = { id: string; en: string; es: string; value: (row: DisplayRow) => string | number | null; sortable: boolean; format?: 'percent' | 'position' | 'money' }
const analytical = (id: keyof Phase14BrowserObservation, en: string, es: string, format?: Column['format']): Column => ({ id, en, es, format, sortable: true, value: r => r.analysis[id] as number })
const ordinary = (id: keyof Phase14ListingPresentation, en: string, es: string): Column => ({ id, en, es, sortable: true, value: r => r.listing?.[id] ?? null })
// One registry drives table headers, sorting controls and column visibility.
export const columns: readonly Column[] = [
  ordinary('title','Property','Propiedad'),
  { ...ordinary('price','Listing price','Precio anunciado'), sortable: false, format: 'money' },
  analytical('pricePerM2','Price / m²','Precio / m²'),
  analytical('percentilePosition','Percentile','Percentil'),
  analytical('percentDifferenceFromMedian','Difference from median (%)','Diferencia de la mediana (%)','percent'),
  analytical('differenceFromMedian','Difference from median','Diferencia de la mediana'),
  { id:'interval', en:'Population position', es:'Posición en la población', sortable:true, format:'position', value:r=>positions.indexOf(r.analysis.interval) },
  analytical('belowCount','Below','Por debajo'), analytical('equalCount','Equal','Iguales'), analytical('aboveCount','Above','Por encima'),
  { id:'tailThreshold', en:'Tail threshold', es:'Umbral de cola', sortable:true, value:r=>r.analysis.strictTail?.thresholdPricePerM2 ?? null },
  { id:'tailPercent', en:'Difference from tail threshold (%)', es:'Diferencia del umbral de cola (%)', sortable:true, format:'percent', value:r=>r.analysis.strictTail?.percentDifferenceFromThreshold ?? null },
  { id:'tailDifference', en:'Difference from tail threshold', es:'Diferencia del umbral de cola', sortable:true, value:r=>r.analysis.strictTail?.differenceFromThreshold ?? null },
  ordinary('propertyArea','Land area (m²)','Área de terreno (m²)'), ordinary('constructionArea','Construction area (m²)','Área de construcción (m²)'),
  ordinary('bedrooms','Bedrooms','Dormitorios'), ordinary('bathrooms','Bathrooms','Baños'), ordinary('parking','Parking','Estacionamientos'), ordinary('yearBuilt','Year built','Año de construcción'),
  ordinary('district','District','Distrito'), ordinary('canton','Canton','Cantón'), ordinary('province','Province','Provincia'),
]
export type Sort = { column: string; direction: 'asc' | 'desc' }
export const initialSort: Sort = { column:'pricePerM2', direction:'asc' }
export function joinPresentation(analysis: Phase14BrowserSuccess, listings: readonly Phase14ListingPresentation[]): DisplayRow[] {
  const requested = new Set(analysis.results.map(r=>r.listingId)), map = new Map<string,Phase14ListingPresentation>(), duplicates = new Set<string>()
  for (const listing of listings) if (requested.has(listing.listingId)) {
    if (map.has(listing.listingId)) duplicates.add(listing.listingId)
    else map.set(listing.listingId,listing)
  }
  for (const id of duplicates) map.delete(id)
  return analysis.results.map(row=>({ analysis:row, listing:map.get(row.listingId) ?? null }))
}
export function sortRows(rows: readonly DisplayRow[], sort: Sort): DisplayRow[] {
  const column = columns.find(c=>c.id===sort.column && c.sortable)
  if (!column) return [...rows]
  const direction = sort.direction==='asc' ? 1 : -1
  return [...rows].sort((a,b)=>{
    const x=column.value(a), y=column.value(b)
    if (x===null && y!==null) return 1
    if (y===null && x!==null) return -1
    const order = x===null || y===null ? 0 : typeof x==='number' && typeof y==='number' ? x-y : String(x)<String(y)?-1:String(x)>String(y)?1:0
    if (order) return order*direction
    const secondary = (a.analysis.pricePerM2-b.analysis.pricePerM2)*direction
    return secondary || (a.analysis.listingId<b.analysis.listingId?-1:a.analysis.listingId>b.analysis.listingId?1:0)
  })
}
export function pageRows(rows: readonly DisplayRow[], page: number, size: number) { return rows.slice((page-1)*size,page*size) }
export { listingHref } from './listing-route'
// Request identity comparison only, not canonical validation or analytical authority.
const decimal = (s: string) => { const [w,f='']=s.split('.'); const suffix=f.replace(/0+$/,''); return w.replace(/^0+(?=\d)/,'')+(suffix?'.'+suffix:'') }
function filterIdentity(filters: Phase14BrowserFilters) {
  const semantics = Object.entries(filters.semantics ?? {}).filter(([,a])=>a?.length).map(([k,a])=>[k,[...new Set(a)].sort()]).sort()
  const facts = Object.entries(filters.facts ?? {}).filter(([,a])=>a?.length).map(([k,a])=>[k,[...new Set(a!.map(c=>JSON.stringify(c.kind==='exact'?{kind:c.kind,value:decimal(c.value)}:c.kind==='category'?{kind:c.kind,termId:c.termId}:{kind:c.kind,interval:{lower:c.interval.lower===null?null:decimal(c.interval.lower),upper:c.interval.upper===null?null:decimal(c.interval.upper),lowerInclusive:c.interval.lowerInclusive,upperInclusive:c.interval.upperInclusive}})))].sort()]).sort()
  return JSON.stringify({semantics,facts,propertyArea:filters.propertyArea,constructionArea:filters.constructionArea})
}
export function matchesSubmission(result: Phase14BrowserSuccess, input: Phase14ApplicationRequest, geographicTermId: string): boolean {
  const q=input.request.question, r=result.question
  return result.transaction===q.transaction && r.transaction===q.transaction && result.normalization===input.normalization &&
    r.geography.level===q.geography.level && r.geography.officialCode===q.geography.officialCode && r.geography.termId===geographicTermId &&
    r.propertyType.termId===q.propertyType.termId && filterIdentity(r.filters)===filterIdentity(q.filters ?? {})
}
export function formatValue(column: Column, row: DisplayRow, language: Language): string {
  const v=column.value(row)
  if (v===null) return '—'
  if (column.format==='position') return positionLabels[language][v as number]
  if (typeof v==='string') return v
  const formatted=new Intl.NumberFormat(language==='es'?'es-CR':'en-US',{maximumFractionDigits:6}).format(v)
  return column.format==='percent'?formatted+'%':column.format==='money'?`${row.listing?.currency ?? ''} ${formatted}`:formatted
}
