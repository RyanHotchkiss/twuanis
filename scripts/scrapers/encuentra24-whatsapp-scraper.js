const fs = require('fs')
const Papa = require('papaparse')
const { chromium } = require('playwright')

const inputFile = process.argv[2]

if (!inputFile) {
  console.error('Usage: node scripts/scrapers/encuentra24-whatsapp-scraper.js raw.csv')
  process.exit(1)
}

const LEAD_NAME = 'Carlos Mora'
const LEAD_EMAIL = 'carlos.mora.test@gmail.com'
const LEAD_PHONE = '87136969'

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function clickWhatsapp(page) {
  const button = page.locator(
    '.ActionLeadButtons-whatsapp button, button:has-text("WhatsApp"), button:has-text("Whatsapp")'
  ).first()

  await button.click({ timeout: 10000 })
}

async function submitLeadFormIfVisible(page) {
  const inputs = page.locator('input')
  const count = await inputs.count().catch(() => 0)

  if (count < 3) return

  await inputs.nth(0).fill(LEAD_NAME).catch(() => {})
  await inputs.nth(1).fill(LEAD_EMAIL).catch(() => {})
  await inputs.nth(2).fill(LEAD_PHONE).catch(() => {})

  await page.locator('button').filter({ hasText: /whatsapp|enviar|continuar/i }).last().click().catch(() => {})
  await sleep(1500)
}

async function extractWhatsapp(page) {
  const text = await page.evaluate(() => {
    const candidates = Array.from(document.querySelectorAll('[role="dialog"], .modal, .fixed, body'))
    return candidates.map(el => el.innerText || '').join('\n')
  })

  const match =
    text.match(/\+506\s?\d{4}\s?\d{4}/) ||
    text.match(/\+506\d{8}/)

  return match ? match[0].replace(/\s+/g, '') : ''
}

async function main() {
  const csv = fs.readFileSync(inputFile, 'utf8')
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true })
  const rows = parsed.data

  const context = await chromium.launchPersistentContext(
    './playwright-encuentra24-session',
    {
      headless: false
    }
  )

  const page = await context.newPage()

  page.on('popup', async popup => {
    await popup.close().catch(() => {})
  })

  const results = []

  for (const row of rows) {
    const sourceListingId = row.source_listing_id
    const url = row.source_url

    if (!sourceListingId || !url) continue

    console.log('Checking WhatsApp:', sourceListingId)

    let whatsapp = ''

    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      })

      await clickWhatsapp(page)
      await sleep(1000)

      await submitLeadFormIfVisible(page)

      await clickWhatsapp(page).catch(() => {})
      await sleep(1000)

      whatsapp = await extractWhatsapp(page)

      console.log('Found:', whatsapp || 'NONE')
    } catch (error) {
      console.log('Failed:', sourceListingId, error.message)
    }

    results.push({
      source_listing_id: sourceListingId,
      whatsapp
    })

    await sleep(300)
  }

  await context.close()

  const outputFile = inputFile.replace('-raw.csv', '-whatsapp.csv')
  fs.writeFileSync(outputFile, Papa.unparse(results))

  console.log(`Saved WhatsApp CSV: ${outputFile}`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})