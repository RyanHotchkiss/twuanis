const fs = require('fs')
const Papa = require('papaparse')
const { chromium } = require('playwright')

const inputFile = process.argv[2]

if (!inputFile) {
  console.error('Usage: node scripts/scrapers/encuentra24-whatsapp-decoder.js raw.csv')
  process.exit(1)
}

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
        const digits = value.replace(/\D/g, '')

        // 00506XXXXXXXX
        if (digits.startsWith('00506') && digits.length === 13) {
            return '+506' + digits.slice(5)
        }

        // 506XXXXXXXX
        if (digits.startsWith('506') && digits.length === 11) {
            return '+' + digits
        }

        // XXXXXXXX
        if (digits.length === 8) {
            return '+506' + digits
        }

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

async function warmUpSession(page, firstUrl) {
  await page.goto(firstUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 15000
  })

  await page
    .locator('.ActionLeadButtons-whatsapp button, button:has-text("WhatsApp"), button:has-text("Whatsapp")')
    .first()
    .click({ timeout: 10000 })
    .catch(() => {})

  await page.waitForTimeout(1000)

  const inputs = page.locator('input')
  const count = await inputs.count().catch(() => 0)

  if (count >= 3) {
    await inputs.nth(0).fill('Carlos Mora').catch(() => {})
    await inputs.nth(1).fill('carlos.mora.test@gmail.com').catch(() => {})
    await inputs.nth(2).fill('87136969').catch(() => {})

    await page
      .locator('button')
      .filter({ hasText: /whatsapp|enviar|continuar/i })
      .last()
      .click()
      .catch(() => {})

    await page.waitForTimeout(1500)
  }
}

async function main() {
  const rows = Papa.parse(fs.readFileSync(inputFile, 'utf8'), {
    header: true,
    skipEmptyLines: true
  }).data

  const context = await chromium.launchPersistentContext(
    './playwright-encuentra24-session',
    { headless: false }
  )

  const page = await context.newPage()
  const results = []

page.on('popup', async popup => {
    await popup.close().catch(() => {})
    })

  await warmUpSession(page, rows[0].source_url)

  for (const row of rows) {
    let whatsapp = ''

    try {
      const response = await page.goto(row.source_url, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      })

      if (!response) {
        throw new Error('No response returned')
      }

      const html = await response.text()

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
      whatsapp
    })
  }

  await context.close()

  const outputFile = inputFile.replace('-raw.csv', '-whatsapp.csv')

  fs.writeFileSync(
    outputFile,
    Papa.unparse(results)
  )

  console.log(`Saved ${outputFile}`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})