'use strict'
const { dismissMarketplacePromotion } = require('./index-browser.cjs')

function normalize(value) {
  const digits = String(value || '').replace(/\D/g, '').replace(/^00506/, '506')
  return /^506\d{8}$/.test(digits) ? `+${digits}` : ''
}

async function contactDialog(page) {
  const dialogs = page.getByRole('dialog')
  for (let i = 0; i < await dialogs.count(); i += 1) {
    const dialog = dialogs.nth(i)
    if (!await dialog.isVisible().catch(() => false)) continue
    const text = await dialog.innerText().catch(() => '')
    if (text && !/Marketplace Encuentra24 Costa Rica/i.test(text)) return dialog
  }
  return null
}

async function acquire(page, sourceListingId, cardIndex) {
  await dismissMarketplacePromotion(page)
  // The index's cards are rendered in the same order as initialResults.data;
  // their CTA containers are siblings of the card links, not descendants.
  const button = page.locator('.ActionLeadButtons-whatsapp button:visible').nth(cardIndex)
  if (!await button.count()) return { whatsapp: '', error: 'index WhatsApp button not found' }

  // Keep this context isolated: only Encuentra24's same-site popup request may proceed.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await button.click({ timeout: 5000, noWaitAfter: true })
    await page.waitForTimeout(300)
    if (!await dismissMarketplacePromotion(page)) break
  }
  await page.waitForTimeout(1200)
  const dialog = await contactDialog(page)
  // Encuentra24 can mount the overlay outside the card and without a dialog
  // role. Read the visible popup layers before falling back to visible body text.
  const text = dialog
    ? await dialog.innerText().catch(() => '')
    : await page.locator('[data-radix-popper-content-wrapper]:visible, [role="alertdialog"]:visible, .fixed:visible').allInnerTexts().then(values => values.join('\n')).catch(() => '')
  const match = text.match(/(?:\+?506|00506)[\s()-]*\d[\d\s()-]{6,12}\d|\b\d{4}[\s-]?\d{4}\b/)
  const whatsapp = normalize(match?.[0])
  if (dialog) await dialog.getByRole('button', { name: /cerrar|close|×/i }).click({ force: true }).catch(() => page.keyboard.press('Escape').catch(() => {}))
  else await page.keyboard.press('Escape').catch(() => {})
  return whatsapp ? { whatsapp } : { whatsapp: '', error: dialog ? 'popup contained no Costa Rican WhatsApp number' : 'contact popup did not appear' }
}

module.exports = { acquire }
