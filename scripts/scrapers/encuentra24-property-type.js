// Read only the primary listing's explicit source type; never infer from text.
function extractSourcePropertyType(html, listingId) {
  if (!/^\d+$/.test(String(listingId || ''))) return ''
  const values = new Set()
  let invalid = false
  function visit(value) {
    if (!value || typeof value !== 'object') return
    if (Object.prototype.hasOwnProperty.call(value, 'ad')) {
      const ad = value.ad
      if (ad && String(ad.id) === String(listingId)) {
        const linkId = typeof ad.link === 'string' && ad.link.match(/\/(\d+)$/)?.[1]
        if (linkId !== String(listingId) || typeof ad.subCategoryType !== 'string' || !ad.subCategoryType.trim()) invalid = true
        else values.add(ad.subCategoryType)
      }
    }
    for (const child of Object.values(value)) visit(child)
  }
  for (const match of html.matchAll(/self\.__next_f\.push\((\[[\s\S]*?\])\)<\/script>/g)) {
    try {
      const [, payload] = JSON.parse(match[1])
      if (typeof payload !== 'string') continue
      for (const line of payload.split('\n')) {
        const colon = line.indexOf(':')
        if (colon < 0) continue
        let record
        try { record = JSON.parse(line.slice(colon + 1)) } catch { continue }
        visit(record)
      }
    } catch { /* Unreadable source evidence remains unresolved. */ }
  }
  return !invalid && values.size === 1 ? [...values][0] : ''
}
module.exports = { extractSourcePropertyType }
