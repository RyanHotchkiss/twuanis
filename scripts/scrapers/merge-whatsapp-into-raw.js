const fs = require('fs')
const Papa = require('papaparse')

const rawFile = process.argv[2]
const whatsappFile = process.argv[3]
if (!rawFile || !whatsappFile) {
  console.error(
    'Usage: node scripts/scrapers/merge-whatsapp-into-raw.js raw.csv overlay-whatsapp.csv'
  )
  process.exit(1)
}

const rawRows = Papa.parse(
  fs.readFileSync(rawFile, 'utf8'),
  {
    header: true,
    skipEmptyLines: true
  }
).data

const whatsappRows = Papa.parse(
  fs.readFileSync(whatsappFile, 'utf8'),
  {
    header: true,
    skipEmptyLines: true
  }
).data

function normalizeCRPhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.startsWith('00506') && digits.length === 13) return `+506${digits.slice(5)}`
  if (digits.startsWith('506') && digits.length === 11) return `+${digits}`
  if (digits.length === 8) return `+506${digits}`
  return ''
}

const whatsappMap = new Map()

for (const row of whatsappRows) {
  const number = normalizeCRPhone(row.whatsapp)
  if (number && row.evidence_origin === 'encuentra24_contactate_modal') {
    whatsappMap.set(row.source_listing_id, number)
  }
}

for (const row of rawRows) {
  const interactive = whatsappMap.get(row.source_listing_id) || ''
  // Encuentra24's contact overlay is the sole authority. Embedded/decoded
  // values are neither substitutes nor corroboration requirements.
  row.whatsapp = interactive
  row.whatsapp_interactive = interactive
  row.whatsapp_evidence_origin = interactive ? 'encuentra24_contactate_modal' : ''
  row.whatsapp_verification_status = interactive ? 'overlay_authoritative' : 'missing_overlay'
}

const outputFile = rawFile.endsWith('-raw.csv')
  ? rawFile.replace('-raw.csv', '-raw-with-whatsapp.csv')
  : rawFile.replace(/\.csv$/i, '-with-whatsapp.csv')

fs.writeFileSync(
  outputFile,
  Papa.unparse(rawRows)
)

console.log(`Merged ${rawRows.length} listings`)
console.log(`Output: ${outputFile}`)
