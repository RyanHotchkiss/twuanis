const axios = require('axios')
const cheerio = require('cheerio')
const puppeteer = require('puppeteer')
const fs = require('fs')
const crypto = require('crypto')

const SOURCE_NAME = 'encuentra24'
const TRANSACTION_TYPE = 'rent'
const MAX_LISTINGS = 100
const MAX_PAGES = 5

const { isObservationValid } = require('./quality/isObservationValid')
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

function clean(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function csvEscape(value) {
  return `"${String(value || '').replace(/"/g, '""')}"`
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function createSourceListingId(sourceUrl) {
  const match =
    sourceUrl.match(/\/(\d+)$/)

  return match
    ? match[1]
    : ''
}

function getNumber(value) {
  const number =
    Number(
      String(value || '')
        .replace(/,/g, '')
        .replace(/[^\d.]/g, '')
    )

  if (!number || Number.isNaN(number)) return ''

  return number
}

function buildSearchUrl(regionSlug) {

  if (regionSlug.startsWith('bienes-raices')) {
    return `https://www.encuentra24.com/costa-rica-es/${regionSlug}`
  }

  return `https://www.encuentra24.com/costa-rica-en/searchresult/real-estate?q=keyword.&regionslug=${regionSlug}`
}

function buildPageUrl(baseUrl, pageNumber) {
  if (pageNumber === 1) return baseUrl

  const separator =
    baseUrl.includes('?') ? '&' : '?'

  return `${baseUrl}${separator}page=${pageNumber}`
}

async function fetchHtml(url, referer = '') {
  const response =
    await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        ...(referer ? { Referer: referer } : {})
      }
    })

  return response.data
}

function getListingCards($) {
  return $('a.item-card-link[href*="/costa-rica-es/bienes-raices-"]')
    .filter((i, el) => {
      const href = $(el).attr('href') || ''
      return /\/\d{7,}$/.test(href)
    })
    .toArray()
}

function getListingCards($) {
  const cards = $('.d3-ad-tile').toArray()

  if (cards.length > 0) {
    return cards
  }

  return $('a[href*="/costa-rica-"][href*="/bienes-raices-"]')
    .filter((i, el) => {
      const href = $(el).attr('href') || ''
      return /\/\d{7,}$/.test(href)
    })
    .toArray()
}

function getListingUrl($, card) {
  const href = $(card).attr('href') || ''

  if (!href) return ''

  return href.startsWith('http')
    ? href
    : `https://www.encuentra24.com${href}`
}

function isRentListing(url) {
  return (
    url.includes('/real-estate-for-rent-') ||
    url.includes('/bienes-raices-alquiler-')
  )
}

function extractJsonLd($) {
  const jsonLd = []

  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const parsed =
        JSON.parse($(el).html())

      jsonLd.push(parsed)
    } catch (error) {}
  })

  return jsonLd
}

function findProductSchema(jsonLd) {
  return (
    jsonLd.find(item => item?.['@type'] === 'Product') ||
    null
  )
}

function extractOffer(schema) {
  if (!schema?.offers) return {}

  if (Array.isArray(schema.offers)) {
    return schema.offers[0] || {}
  }

  return schema.offers
}

function normalizeProvince(value) {
  return clean(value)
    .replace('San Jose', 'San José')
    .replace('Limon', 'Limón')
}

function normalizeCanton(value) {
  return clean(value)
    .replace('Escazu', 'Escazú')
    .replace('Central San José', 'San Jose')
}

function extractLocation($) {
  const breadcrumbParts =
    $('[class*="breadcrumb"]')
      .last()
      .find('a')
      .map((i, el) => clean($(el).text()))
      .get()

  return {
    raw_breadcrumbs:
      breadcrumbParts.join('|'),

    province:
      breadcrumbParts.length >= 5
        ? normalizeProvince(breadcrumbParts[4])
        : '',

    canton:
      breadcrumbParts.length >= 6
        ? normalizeCanton(breadcrumbParts[5])
        : '',

    district:
      breadcrumbParts.length >= 7
        ? clean(breadcrumbParts[6])
        : ''
  }
}

function extractTitle($, schema) {
  return clean(
    schema?.name ||
    $('h1').first().text() ||
    $('title').text()
  )
}

function extractDescription(schema) {
  return clean(schema?.description || '')
}

function extractInsightAttributes($) {
  const attributes = {}

  $('.d3-property-insight__attribute')
    .each((index, el) => {
      const title =
        clean(
          $(el)
            .find('.d3-property-insight__attribute-title')
            .text()
        )

      const value =
        clean(
          $(el)
            .find('.d3-property-insight__attribute-value')
            .text()
        )

      if (!title && !value) return

      attributes[title] = value
    })

  return attributes
}

function extractDetailAttributes($) {
  const details = {}

  $('.d3-property-details__detail-label')
    .each((index, el) => {
      const label =
        clean(
          $(el)
            .clone()
            .children()
            .remove()
            .end()
            .text()
        )

      const value =
        clean(
          $(el)
            .find('.d3-property-details__detail')
            .text()
        )

      if (!label && !value) return

      details[label] = value
    })

  return details
}

function findAttributeValue(attributes, possibleLabels) {
  const entries =
    Object.entries(attributes)

  const match =
    entries.find(([label]) => {
      const normalizedLabel =
        normalizeText(label)

      return possibleLabels.some(possibleLabel =>
        normalizedLabel.includes(
          normalizeText(possibleLabel)
        )
      )
    })

  return match ? match[1] : ''
}

function extractRawBedrooms(insightAttributes) {
  return findAttributeValue(
    insightAttributes,
    [
      'Bedrooms',
      'Recámaras',
      'Recamaras',
      'Habitaciones'
    ]
  )
}

function extractRawBathrooms(insightAttributes) {
  return findAttributeValue(
    insightAttributes,
    [
      'Bathrooms',
      'Baños',
      'Banos'
    ]
  )
}

function extractRawParking(insightAttributes) {
  return findAttributeValue(
    insightAttributes,
    [
      'Parking',
      'Parqueo',
      'Estacionamiento'
    ]
  )
}

function extractRawConstructionArea(insightAttributes) {
  return findAttributeValue(
    insightAttributes,
    [
      'M² of construction',
      'm² de construcción',
      'Construcción',
      'Construccion',
      'Construction'
    ]
  )
}

function extractRawPropertyArea(detailAttributes) {
  return findAttributeValue(
    detailAttributes,
    [
      'Lot Size',
      'Tamaño del lote',
      'Tamano del lote',
      'Terreno',
      'Property Area'
    ]
  )
}

function extractRawYearBuilt(detailAttributes) {
  return findAttributeValue(
    detailAttributes,
    [
      'Year of construction',
      'Año de construcción',
      'Ano de construccion',
      'Year Built'
    ]
  )
}

async function extractImages(page) {
  let images =
    await page.evaluate(() => {
      return Array.from(document.images)
        .map(img => img.currentSrc || img.src)
        .filter(Boolean)
    })

  images =
    images.filter(img =>
      img.includes('photos.encuentra24.com')
    )

  images =
    images.map(img =>
      img.replace('t_or_cvr_th', 't_or_fh_l')
    )

  return [...new Set(images)]
}

async function extractWhatsapp(page) {
  try {
    const whatsappLink =
      await page.evaluate(() => {
        const links =
          Array.from(document.querySelectorAll('a'))

        const whatsappAnchor =
          links.find(link =>
            link.href.includes('api.whatsapp.com') ||
            link.href.includes('wa.me')
          )

        return whatsappAnchor ? whatsappAnchor.href : ''
      })

    return whatsappLink.match(/\d+/)?.[0] || ''
  } catch (error) {
    return ''
  }
}

function parsePriceValue(value) {
  const text = String(value || '')

      const patterns = [
        /monthly rent[:\s]*([0-9][\d.,]*)/i,
        /alquiler mensual[:\s]*([0-9][\d.,]*)/i,
        /(?:USD|US\$|\$)\s*([0-9][\d.,]*)/i,
        /(?:CRC|₡|C\.?)\s*([0-9][\d.,]*)/i,
        /([0-9][\d.,]*)\s*(?:USD|CRC)/i
      ]

      let raw = ''

      for (const pattern of patterns) {
        const match = text.match(pattern)

        if (match?.[1]) {
          raw = match[1]
          break
        }
      }

      if (!raw) return ''

      let cleaned = raw.replace(/[^\d.,]/g, '')

      const dotCount =
        (cleaned.match(/\./g) || []).length

      const commaCount =
        (cleaned.match(/,/g) || []).length

      if (
        dotCount === 1 &&
        commaCount === 0 &&
        /^\d+\.\d{3}$/.test(cleaned)
      ) {
        cleaned = cleaned.replace('.', '')
      } else if (
        dotCount > 1 &&
        commaCount === 0
      ) {
        cleaned = cleaned.replace(/\./g, '')
      } else if (
        cleaned.includes('.') &&
        cleaned.endsWith('.00')
      ) {
        cleaned = cleaned.replace(/\.00$/, '')
      } else {
        cleaned = cleaned.replace(/,/g, '')
      }

      const price = Number(cleaned)

      return Number.isFinite(price) && price > 0
        ? price
        : ''
    }

function extractPrice(offer, insightAttributes = {}, detailAttributes = {}, title = '', description = '') {
                  const candidates = [
                    offer?.price,
                    offer?.listing_price,
                    offer?.priceValue,
                    offer?.price_value,
                    offer?.salePrice,
                    offer?.amount,
                    offer?.value,
                    offer?.price?.amount,
                    offer?.price?.value,
                    insightAttributes?.Price,
                    insightAttributes?.Precio,
                    detailAttributes?.Price,
                    detailAttributes?.Precio,
                    title,
                    description
                  ]
                  for (const candidate of candidates) {
                    if (candidate === undefined || candidate === null) {
                      continue
                    }
                    const price = parsePriceValue(candidate)
                    if (
                      Number.isFinite(price) &&
                      price > 0
                    ) {
                      return price
                    }
                  }
                  return ''
                }

function extractCurrency(
                offer,
                insightAttributes = {},
                detailAttributes = {},
                title = ''
              ) {
                const text = [
                  offer?.priceCurrency,
                  insightAttributes?.Price,
                  insightAttributes?.Precio,
                  detailAttributes?.Price,
                  detailAttributes?.Precio,
                  title
                ].join(' ').toUpperCase()

                if (
                  text.includes('USD') ||
                  text.includes('US$') ||
                  text.includes('$')
                ) {
                  return 'USD'
                }

                if (
                  text.includes('CRC') ||
                  text.includes('₡') ||
                  text.includes('C.')
                ) {
                  return 'CRC'
                }

                if (
                  text.includes('MONTHLY RENT:') &&
                  Number(extractPrice(offer, insightAttributes, detailAttributes, title)) < 10000
                ) {
                  return 'USD'
                }

                return clean(offer?.priceCurrency || '')
              }

async function scrapeListing({
  browser,
  listingUrl,
  baseUrl
})
{
  console.log('Scraping:', listingUrl)
  const html =
    await fetchHtml(
      listingUrl,
      baseUrl
    )
  const $ =
    cheerio.load(html)
  const jsonLd =
    extractJsonLd($)
  const schema =
    findProductSchema(jsonLd)

const offer =
  extractOffer(schema)
  const location =
    extractLocation($)
  const title =
    extractTitle($, schema)
  const description =
    extractDescription(schema)
  const insightAttributes =
    extractInsightAttributes($)
  const detailAttributes =
    extractDetailAttributes($)
  const rawBedrooms =
    extractRawBedrooms(insightAttributes)
  const rawBathrooms =
    extractRawBathrooms(insightAttributes)
  const rawParking =
    extractRawParking(insightAttributes)
  const rawConstructionArea =
    extractRawConstructionArea(insightAttributes)
  const rawPropertyArea =
    extractRawPropertyArea(detailAttributes)
  const rawYearBuilt =
    extractRawYearBuilt(detailAttributes)
  const page =
    await browser.newPage()
  await page.setUserAgent(USER_AGENT)

  await page.goto(
    listingUrl,
    {
      waitUntil: 'networkidle2'
    }
  )
  try {
    await page.waitForSelector(
      'img',
      {
        timeout: 10000
      }
    )
  } catch (error) {}
  const images =
    await extractImages(page)
  const whatsapp =
    await extractWhatsapp(page)
  await page.close()
  return {
  source_name:
    SOURCE_NAME,
  source_listing_id:
    createSourceListingId(listingUrl),
  source_url:
    listingUrl,
    transaction_type:
      TRANSACTION_TYPE,
    listing_status:
      'active',
    province:
      location.province,
    canton:
      location.canton,
    district:
      location.district,
    raw_breadcrumbs:
      location.raw_breadcrumbs,
    title,
    description,
    raw_property_type:
      title,
    raw_bedrooms:
      rawBedrooms,
    raw_bathrooms:
      rawBathrooms,
    raw_parking:
      rawParking,
    raw_year_built:
      rawYearBuilt,
    raw_property_area:
      rawPropertyArea,
    raw_construction_area:
      rawConstructionArea,
    current_price:
        '',
      monthly_price:
        extractPrice(
          offer,
          insightAttributes,
          detailAttributes,
          title,
          description
        ),
    currency:
      extractCurrency(
        offer,
        insightAttributes,
        detailAttributes,
        title,
        description
      ),
    
    whatsapp,
    images:
      images.join('|'),
    raw_insight_attributes:
      JSON.stringify(insightAttributes),
    raw_detail_attributes:
      JSON.stringify(detailAttributes),
    raw_jsonld:
      JSON.stringify(jsonLd)
  }
}
function getCsvHeaders() {
  return [
    'source_name',
    'source_listing_id',
    'source_url',
    'transaction_type',
    'listing_status',
    'province',
    'canton',
    'district',
    'raw_breadcrumbs',
    'title',
    'description',
    'raw_property_type',
    'raw_bedrooms',
    'raw_bathrooms',
    'raw_parking',
    'raw_year_built',
    'raw_property_area',
    'raw_construction_area',
    'current_price',
    'currency',
    'monthly_price',
    'whatsapp',
    'images',
    'raw_insight_attributes',
    'raw_detail_attributes',
    'raw_jsonld'
  ]
}
function writeCsv({
  rows,
  fileName
}) {
  const headers =
    getCsvHeaders()
  const csvRows = [
    headers.join(',')
  ]
  rows.forEach(row => {
    csvRows.push(
      headers
        .map(header =>
          csvEscape(row[header])
        )
        .join(',')
    )
  })
  fs.writeFileSync(
    fileName,
    csvRows.join('\n')
  )
}

async function scrapeEncuentra24Rent() {
  const regionSlug =
    process.argv[2]
  if (!regionSlug) {
    console.error('Missing region slug')
    process.exit(1)
  }
  const baseUrl =
    buildSearchUrl(regionSlug)

console.log(
  'BASE URL:',
  baseUrl
)

  const rows = []
  let browser
  try {
    const cards = []

for (let pageNumber = 1; pageNumber <= MAX_PAGES; pageNumber++) {
  const pageUrl =
    buildPageUrl(baseUrl, pageNumber)

  console.log(
    'SCRAPING SEARCH PAGE:',
    pageUrl
  )

  const pageHtml =
    await fetchHtml(pageUrl)

  const $page =
    cheerio.load(pageHtml)

  const pageCards =
    getListingCards($page)

    if (pageNumber === 1 && pageCards[0]) {
  console.log(
    'FIRST CARD HTML:',
    $page.html(pageCards[0]).slice(0, 3000)
  )
}

if (pageNumber === 1 && pageCards[0]) {
  console.log(
    'FIRST CARD HTML:',
    $page.html(pageCards[0]).slice(0, 3000)
  )
}

  console.log(
    'CARDS FOUND:',
    pageCards.length
  )

  if (pageCards.length === 0) {
    break
  }

  pageCards.forEach(card => {
    cards.push({
      card,
      $
    : $page,
      pageUrl
    })
  })

  if (cards.length >= MAX_LISTINGS) {
    break
  }
}
    browser =
      await puppeteer.launch({
        headless: true
      })
      const seenUrls = new Set()
      const listingItems = []

      for (const item of cards) {
        const listingUrl =
          getListingUrl(item.$, item.card)

        if (!listingUrl) continue
        if (seenUrls.has(listingUrl)) continue

        seenUrls.add(listingUrl)

        listingItems.push({
          ...item,
          listingUrl
        })
      }

      console.log(
        'UNIQUE LISTING URLS:',
        listingItems.length
      )
    for (const item of listingItems.slice(0, MAX_LISTINGS)) {
  const listingUrl =
    item.listingUrl
      if (!createSourceListingId(listingUrl)) continue
      if (!listingUrl) continue
      if (!isRentListing(listingUrl)) continue
      if (rows.length >= MAX_LISTINGS) break
      try {
        const row =
          await scrapeListing({
            browser,
            listingUrl,
            baseUrl: item.pageUrl
          })
        if (!isObservationValid(row)) {
console.log(
  'SKIPPED LOW QUALITY OBSERVATION:',
  row.source_url
)
          continue
        }

        rows.push(row)
      } catch (error) {
        console.error(
          'LISTING ERROR:',
          listingUrl,
          error.message
        )
      }
    }
    const fileName =
      `${regionSlug}-rent-raw.csv`
    writeCsv({
      rows,
      fileName
    })
    console.log(
      JSON.stringify(
        rows,
        null,
        2
      )
    )
    console.log(
      `RAW CSV CREATED: ${fileName}`
    )
  } catch (error) {
    console.error(
      'SCRAPER ERROR:',
      error.message
    )
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}
scrapeEncuentra24Rent()


