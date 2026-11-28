const fs = require('fs')
const Papa = require('papaparse')
const axios = require('axios')

const inputFile = process.argv[2]

function decodeJsonString(value) {
  try {
    return JSON.parse(`"${value}"`)
  } catch {
    return value
  }
}

function decodeEncuentraPhone(value) {
  value = decodeJsonString(value)

  if (!value || value.length < 3) return ''

  const t = value.charCodeAt(0)
  if (t < 35 || t > 45) return ''

  const a = value.charCodeAt(1) - 40
  if (a < 1 || a > 10) return ''

  const r = value.substring(2)
  let decoded = ''

  for (let i = 0; i < r.length; i++) {
    decoded += String.fromCharCode(r.charCodeAt(i) + 28 - t - i - 1 + a)
  }

  return decoded.replace(/\D/g, '')
}

function normalizeCRPhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.startsWith('00506') && digits.length === 13) return `+506${digits.slice(5)}`
  if (digits.startsWith('506') && digits.length === 11) return `+${digits}`
  if (digits.length === 8) return `+506${digits}`
  return ''
}

function extractEncodedPhones(html) {
  const patterns = [
    /"whatsapp":"((?:\\.|[^"\\])*)"/g,
    /\\"whatsapp\\":\\"([^\\"]*)\\"/g,

    /"phone1":\{"isMobile":true,"number":"((?:\\.|[^"\\])*)"/g,
    /\\"phone1\\":\{\\"isMobile\\":true,\\"number\\":\\"((?:\\.|[^"\\])*)\\"/g,

    /"phone2":\{"isMobile":true,"number":"((?:\\.|[^"\\])*)"/g,
    /\\"phone2\\":\{\\"isMobile\\":true,\\"number\\":\\"((?:\\.|[^"\\])*)\\"/g
  ]

  return patterns
    .flatMap(pattern =>
      [...html.matchAll(pattern)]
        .map(match => match[1])
        .filter(Boolean)
    )
    .filter(value => value.length >= 8 && value.length <= 30)
}

async function fetchListingHtml(url) {
  const response = await axios.get(url, {
    timeout: 15000,
    responseType: 'text',
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TwuanisSourceEvidence/1.0)' }
  })
  return String(response.data || '')
}

async function main() {
  if (!inputFile) throw new Error('Usage: node scripts/scrapers/encuentra24-whatsapp-decoder.js raw.csv')
  const rows = Papa.parse(fs.readFileSync(inputFile, 'utf8'), {
    header: true,
    skipEmptyLines: true
  }).data

  const results = []

  for (const row of rows) {
    let whatsapp = ''

    try {
      // Decoder acquisition is response-only. It never opens a contact
      // control, submits a lead, or launches WhatsApp.
      const html = await fetchListingHtml(row.source_url)

      const encodedPhones = extractEncodedPhones(html)

      for (const encoded of encodedPhones) {

        const raw = decodeEncuentraPhone(encoded)
        const decoded = normalizeCRPhone(raw)

        if (decoded) {
            whatsapp = decoded
            break
        }
        }

    } catch (error) {
      console.log(row.source_listing_id, 'FAILED:', error.message)
    }

    results.push({
      source_listing_id: row.source_listing_id,
      source_url: row.source_url,
      whatsapp,
      evidence_origin: whatsapp ? 'encuentra24_embedded_phone_encoding' : '',
      acquisition_status: whatsapp ? 'decoded' : 'not_decoded'
    })
  }

  const outputFile = inputFile.replace('-raw.csv', '-decoder-whatsapp.csv')

  fs.writeFileSync(
    outputFile,
    Papa.unparse(results)
  )

  console.log(`Saved ${outputFile}`)
}

if (require.main === module) main().catch(error => {
  console.error(error.message || error)
  process.exit(1)
})

module.exports = { decodeEncuentraPhone, normalizeCRPhone, extractEncodedPhones }
