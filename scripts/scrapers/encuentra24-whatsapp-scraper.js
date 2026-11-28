const fs = require('fs')
const Papa = require('papaparse')
const { chromium } = require('playwright')

const inputFile = process.argv[2]

if (!inputFile) {
  console.error('Usage: node scripts/scrapers/encuentra24-whatsapp-scraper.js raw.csv')
  process.exit(1)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function closeMarketplacePromotion(page) {
  // The promotion can mount more than once while Encuentra24 hydrates. Dismiss
  // only that site overlay before reaching the listing controls.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await page.waitForTimeout(500)
    const promotion = page.getByRole('dialog').filter({ hasText: /Marketplace Encuentra24 Costa Rica/i }).first()
    if (!await promotion.isVisible().catch(() => false)) continue
    await promotion.getByRole('button', { name: /cerrar|close/i }).click({ force: true, timeout: 3000 })
    await promotion.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {})
  }

  if (await page.getByRole('dialog').filter({ hasText: /Marketplace Encuentra24 Costa Rica/i }).first().isVisible().catch(() => false)) {
    throw new Error('Unable to dismiss the Encuentra24 marketplace promotion')
  }
}

async function contactOverlay(page) {
  const dialogs = page.getByRole('dialog')
  for (let index = 0; index < await dialogs.count(); index += 1) {
    const dialog = dialogs.nth(index)
    if (!await dialog.isVisible().catch(() => false)) continue
    const text = await dialog.innerText().catch(() => '')
    if (!/Marketplace Encuentra24 Costa Rica/i.test(text)) return dialog
  }
  return null
}

async function contactFormScope(page) {
  return (await contactOverlay(page)) || page
}

async function clickWhatsapp(scope) {
  const sourceButton = scope.locator('.ActionLeadButtons-whatsapp button:visible').first()
  const fallbackButton = scope.getByRole('button', { name: /^WhatsApp$/i }).filter({ hasNotText: /Enviar consulta/i }).first()
  const button = await sourceButton.count() ? sourceButton : fallbackButton
  if (!await button.count()) throw new Error('Unable to identify the Encuentra24 WhatsApp reveal button')
  await button.click({ timeout: 5000 })
}

async function populateRequiredContactFields(scope) {
  const name = process.env.ENCUENTRA24_WHATSAPP_TEST_NAME
  const email = process.env.ENCUENTRA24_WHATSAPP_TEST_EMAIL
  const phone = process.env.ENCUENTRA24_WHATSAPP_TEST_PHONE
  if (!name || !email || !phone) throw new Error('WhatsApp reveal requires Owner-authorized contact test values')
  const nameInput = scope.locator('input[name*="name" i]:visible, input[autocomplete="name"]:visible').first()
  const emailInput = scope.locator('input[type="email"]:visible, input[name*="email" i]:visible').first()
  const phoneInput = scope.locator('input[type="tel"]:visible, input[name*="phone" i]:visible, input[name*="telephone" i]:visible').first()
  if (!await nameInput.count() || !await emailInput.count() || !await phoneInput.count()) {
    throw new Error('Unable to identify the required Encuentra24 WhatsApp contact fields')
  }
  await nameInput.fill(name)
  await emailInput.fill(email)
  await phoneInput.fill(phone)
  return true
}

async function extractWhatsapp(page) {
      const overlay = await contactOverlay(page)
      if (!overlay) return ''
      const text = await overlay.innerText().catch(() => '')
      const match = text.match(/\+\d[\d\s()-]{7,18}\d/)

      if (!match) {
        return ''
      }

      return match[0]
        .replace(/[^\d+]/g, '')
    }

async function isWhatsappDisabled(page) {
  const text =
    await page.locator('body')
      .innerText()
      .catch(() => '')

  return (
    /WhatsApp\s+Deshabilitado/i.test(text) ||
    /contacto\s+por\s+WhatsApp\s+deshabilitado/i.test(text)
  )
}

async function main() {
  const csv = fs.readFileSync(inputFile, 'utf8')
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true })
  const rows = parsed.data

  const limit = Number(process.env.ENCUENTRA24_WHATSAPP_TEST_LIMIT || 0)
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  let contactInteractionActive = false
  let contactSubmissionBlocked = false
  let blockedContactRequest = ''
  let activeListingPath = ''
  await context.route('**/*', route => {
    const request = route.request()
    const url = request.url()
    if (/^(?:whatsapp:|intent:)/i.test(url) || /(?:wa\.me|web\.whatsapp\.com|api\.whatsapp\.com)/i.test(url)) return route.abort()
    // Encuentra24 uses this same-site request to reveal its Contactate overlay.
    // The owner explicitly authorized this one request; no inquiry button is used.
    if (
      contactInteractionActive &&
      request.method() === 'POST' &&
      ['/collect', '/collect/', '/wa', '/wa/', '/cdn-cgi/rum'].includes(new URL(url).pathname)
    ) {
      return route.continue()
    }
    const destination = new URL(url)
    if (
      contactInteractionActive &&
      request.method() === 'POST' &&
      destination.hostname.endsWith('encuentra24.com') &&
      (['/collect', '/collect/', '/wa', '/wa/'].includes(destination.pathname) || destination.pathname === activeListingPath)
    ) {
      return route.continue()
    }
    // Analytics does not participate in contact revelation and must neither
    // leave the isolated context nor be mistaken for an advertiser lead.
    if (contactInteractionActive && !destination.hostname.endsWith('encuentra24.com')) return route.abort()
    if (contactInteractionActive && request.method() === 'POST') {
      contactSubmissionBlocked = true
      blockedContactRequest = `POST ${destination.pathname}`
      console.log(`Blocked non-authorized WhatsApp interaction request: ${blockedContactRequest}`)
      return route.abort()
    }
    if (contactInteractionActive && /[?&](?:name|email|phone|telephone)=/i.test(url)) {
      contactSubmissionBlocked = true
      blockedContactRequest = `GET ${new URL(url).pathname}`
      return route.abort()
    }
    return route.continue()
  })

  const page = await context.newPage()

  page.on('popup', async popup => {
    await popup.close().catch(() => {})
  })

  const results = []

  for (const row of limit > 0 ? rows.slice(0, limit) : rows) {
    const sourceListingId = row.source_listing_id
    const url = row.source_url

    if (!sourceListingId || !url) continue

    console.log('Checking WhatsApp:', sourceListingId)

    let whatsapp = ''
    let failure = ''
    contactSubmissionBlocked = false
    blockedContactRequest = ''
    activeListingPath = new URL(url).pathname

    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      })

      // Inspect and close only Encuentra24's site-promotion overlay before using
      // the listing's own contact controls. It is never an advertiser interaction.
      await closeMarketplacePromotion(page)
      const scope = await contactFormScope(page)

      // Populate only required fields. The guard permits only Encuentra24's
      // owner-authorized /collect overlay request and blocks all other contact
      // submissions, navigation, and WhatsApp application launches.
      await populateRequiredContactFields(scope)
      contactInteractionActive = true
      await clickWhatsapp(scope)

      if (contactSubmissionBlocked) throw new Error('WhatsApp reveal attempted a blocked contact submission')

          for (let attempt = 0; attempt < 10; attempt++) {
            whatsapp =
              await extractWhatsapp(page)

            if (whatsapp) {
              break
            }

            if (await isWhatsappDisabled(page)) {
              break
            }

            await sleep(200)
          }

      if (contactSubmissionBlocked) throw new Error('WhatsApp reveal attempted a blocked contact submission')
      console.log('Found:', whatsapp || 'NONE')
    } catch (error) {
      failure = error.message
      console.log('Failed:', sourceListingId, error.message)
    } finally {
      contactInteractionActive = false
    }

    results.push({
      source_listing_id: sourceListingId,
      source_url: url,
      whatsapp,
      evidence_origin: whatsapp ? 'encuentra24_contactate_modal' : '',
      acquisition_status: whatsapp ? 'revealed_without_lead' : (failure || 'not_revealed_without_lead'),
      blocked_contact_request: blockedContactRequest
    })

    await page.locator('[role="dialog"] button, .modal button').filter({ hasText: /cerrar|close|×/i }).first().click().catch(() => {})

    await sleep(300)
  }

  await context.close()
  await browser.close()

  const outputFile = inputFile.replace(/\.csv$/i, '-whatsapp.csv')
  fs.writeFileSync(outputFile, Papa.unparse(results))

  console.log(`Saved WhatsApp CSV: ${outputFile}`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
