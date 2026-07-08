const fs = require('fs')
const Papa = require('papaparse')

const rawFile = process.argv[2]
const whatsappFile = process.argv[3]

if (!rawFile || !whatsappFile) {
  console.error(
    'Usage: node scripts/scrapers/merge-whatsapp-into-raw.js raw.csv whatsapp.csv'
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

const whatsappMap = new Map()

for (const row of whatsappRows) {
  whatsappMap.set(
    row.source_listing_id,
    row.whatsapp || ''
  )
}

for (const row of rawRows) {
  row.whatsapp =
    whatsappMap.get(row.source_listing_id) ||
    row.whatsapp ||
    ''
}

const outputFile =
  rawFile.replace(
    '-raw.csv',
    '-raw-with-whatsapp.csv'
  )

fs.writeFileSync(
  outputFile,
  Papa.unparse(rawRows)
)

console.log(`Merged ${rawRows.length} listings`)
console.log(`Output: ${outputFile}`)