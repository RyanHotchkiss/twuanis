'use strict'
const { normalizeEncuentra24RowGeography } = require('../encuentra24-sale-geography.cjs')
function map(ad) {
  const location = ad.location || ad.address || {}
  const parts = String(location.locality || ad.regionName || '').split(',').map(value => value.trim()).filter(Boolean)
  const province = location.province || ad.province || parts.find(value => /provincia$/iu.test(value)) || ''
  const canton = location.canton || ad.canton || parts.find(value => value !== province) || ''
  return normalizeEncuentra24RowGeography({ raw_breadcrumbs: [province, canton, location.district || ad.district || ''].filter(Boolean).join('|'), province, canton, district: location.district || ad.district || '' })
}
module.exports = { map }
