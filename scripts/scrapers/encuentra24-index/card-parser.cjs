'use strict'
function decode(html) { return String(html || '').replace(/\\"/g, '"').replace(/\\u0026/g, '&') }
function objectAt(text, start) { let depth = 0, quoted = false, escaped = false; for (let i = start; i < text.length; i++) { const c = text[i]; if (escaped) { escaped = false; continue } if (c === '\\') { escaped = true; continue } if (c === '"') { quoted = !quoted; continue } if (quoted) continue; if (c === '{') depth++; if (c === '}' && --depth === 0) { try { return JSON.parse(text.slice(start, i + 1)) } catch { return null } } } return null }
function cardIds(html) { return [...new Set([...String(html || '').matchAll(/\/(\d{7,})(?:["'?]|$)/g)].map(m => m[1]))] }
function initialResults(html) {
  const text = decode(html)
  const at = text.indexOf('"initialResults":{')
  if (at < 0) return null
  const result = objectAt(text, at + '"initialResults":'.length)
  return result && Array.isArray(result.data) ? result : null
}

// Bind extraction to the rendered card ID.  The page contains unrelated JSON blobs,
// so a global `"ad":{` scan can associate the wrong record with a card.
function adForId(html, id) {
  const text = decode(html)
  const marker = `"id":"${id}"`
  const at = text.indexOf(marker)
  if (at === -1) return null
  const adAt = text.lastIndexOf('"ad":{', at)
  if (adAt === -1) return null
  const ad = objectAt(text, adAt + '"ad":'.length)
  return String(ad?.id || '') === String(id) ? ad : null
}

function embeddedAds(html, ids = cardIds(html)) {
  const initial = initialResults(html)
  if (initial) {
    const wanted = new Set(ids.map(String))
    return new Map(initial.data.filter(ad => wanted.has(String(ad.id))).map(ad => [String(ad.id), ad]))
  }
  const ads = new Map()
  for (const id of ids) {
    const ad = adForId(html, id)
    if (ad) ads.set(String(id), ad)
  }
  return ads
}
module.exports = { embeddedAds, cardIds, adForId, initialResults }
