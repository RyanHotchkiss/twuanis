'use strict'
const fs = require('fs')
function append(file, value) { fs.mkdirSync(require('path').dirname(file), { recursive: true }); fs.appendFileSync(file, `${JSON.stringify(value)}\n`, { mode: 0o600 }) }
function recoveredIds(file) {
  if (!file || !fs.existsSync(file)) return new Set()
  return new Set(fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).flatMap(line => {
    try { return [String(JSON.parse(line).source_listing_id || '')] } catch { return [] }
  }).filter(Boolean))
}
module.exports = { append, recoveredIds }
