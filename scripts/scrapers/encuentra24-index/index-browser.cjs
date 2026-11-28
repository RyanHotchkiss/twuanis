'use strict'
const axios = require('axios')
async function fetchIndex(url) { return (await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TwuanisIndexSource/1.0)' }, timeout: 30000 })).data }
function pageUrl(base, page) { return page === 1 ? base : `${base}?page=${page}` }
async function dismissMarketplacePromotion(page) {
  const promotion = page.getByRole('dialog').filter({ hasText: /Marketplace Encuentra24 Costa Rica/i }).first()
  if (!await promotion.isVisible().catch(() => false)) return false
  // Captured source markup: the dialog's own normal close control is
  // <button aria-label="Cerrar">. Do not force-click through the overlay.
  await promotion.getByRole('button', { name: /^Cerrar$/i }).click({ timeout: 5000 })
  await promotion.waitFor({ state: 'hidden', timeout: 5000 })
  return true
}
module.exports = { fetchIndex, pageUrl, dismissMarketplacePromotion }
