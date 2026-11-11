const axios = require('axios')
const cheerio = require('cheerio')
const puppeteer = require('puppeteer')

const fs = require('fs')
const path = require('path')
const os = require('os')
const crypto = require('crypto')
const { extractSourcePropertyType } = require('./encuentra24-property-type')

const { isObservationValid } = require('./quality/isObservationValid')
const SOURCE_NAME = 'encuentra24'
const TRANSACTION_TYPE = 'rent'
const MAX_LISTINGS = 120
const MAX_PAGES = 20
const REQUEST_DELAY_MS = 1500
const REQUEST_TIMEOUT_MS = 25000
let lastRequestAt = 0
let evidenceDirectory = ''
const sourceEvidence = new Map()

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
  const target = new URL(url)
  if (target.hostname !== 'www.encuentra24.com' || target.protocol !== 'https:' || target.pathname.startsWith('/api.php/')) throw new Error('Unsupported public source destination')
  await new Promise(resolve => setTimeout(resolve, Math.max(0, REQUEST_DELAY_MS - (Date.now() - lastRequestAt))))
  lastRequestAt = Date.now()
  const response = await axios.get(url, { timeout: REQUEST_TIMEOUT_MS, maxContentLength: 5 * 1024 * 1024, maxRedirects: 3,
    beforeRedirect: options => {
      if (options.protocol !== 'https:' || options.hostname !== 'www.encuentra24.com' || !/^\/costa-rica-(?:es\/bienes-raices-alquiler|en\/(?:real-estate-for-rent-|searchresult\/real-estate))/.test(options.path)) throw new Error('Redirect destination rejected')
    },
    headers: { 'User-Agent': USER_AGENT, ...(referer ? { Referer: referer } : {}) } })
  if (typeof response.data !== 'string' || /captcha|access denied|verify you are human/i.test(cheerio.load(response.data)('title').text())) throw new Error('Source access challenge: stopped without bypass')
  const record = { url, status: response.status, observed_at: new Date().toISOString(), sha256: crypto.createHash('sha256').update(response.data).digest('hex') }
  sourceEvidence.set(url, record)
  if (evidenceDirectory) fs.writeFileSync(path.join(evidenceDirectory, record.sha256 + '.html'), response.data, {mode:0o600})
  return response.data
}

function getListingCards($) {
  const cards = $('.d3-ad-tile').toArray()

  if (cards.length > 0) {
    return cards
  }

  return $('a[href*="/costa-rica-"]')
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
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && parsed.hostname === 'www.encuentra24.com' && /^\/costa-rica-(?:es\/bienes-raices-alquiler-[^/]+|en\/real-estate-for-rent-[^/]+)\/[^/]+\/\d{7,}\/?$/.test(parsed.pathname)
  } catch { return false }
}

function extractFromBodyText(bodyText, patterns) {
  for (const pattern of patterns) {
    const match = bodyText.match(pattern)
    if (match?.[1]) return clean(match[1])
  }

  return ''
}

function extractLabeledValue($, label) {
  const value =
    $('p')
      .filter((_, el) =>
        clean($(el).text()) === label
      )
      .next('p')
      .first()
      .text()

  return clean(value)
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

function extractAreaFromDescription(description, patterns) {
      for (const pattern of patterns) {
        const match = String(description || '').match(pattern)

        if (match?.[1]) {
          return cleanExactAreaEvidence(match[1])
        }
      }

      return ''
    }

function extractRawConstructionArea(
      insightAttributes,
      detailAttributes
    ) {
      return (
        findAttributeValue(
          insightAttributes,
          [
            'M² of construction',
            'm² de construcción',
            'Construcción',
            'Construccion',
            'Construction',
            'Área construida',
            'Area construida'
          ]
        ) ||
        findAttributeValue(
          detailAttributes,
          [
            'Área construida',
            'Area construida',
            'Construcción',
            'Construccion'
          ]
        )
      )
    }

function extractRawPropertyArea(detailAttributes) {
  return findAttributeValue(
    detailAttributes,
    [
       'Área total',
        'Area total',
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
      'Año de contrucción',
      'Ano de construccion',
      'Ano de contruccion',
      'Ano de construccion',
      'Year Built'
    ]
  )
}

function extractYearFromDescription(description) {
    const patterns = [
      /Estrenada en\s*(\d{4})/i,
      /Construida en\s*(\d{4})/i,
      /Año de construcci[oó]n\s*(\d{4})/i,
      /Año de contrucci[oó]n\s*(\d{4})/i,
      /Ano de construccion\s*(\d{4})/i
    ]

    for (const pattern of patterns) {
      const match = String(description || '').match(pattern)

      if (match?.[1]) {
        const year = Number(match[1])

        if (
          year >= 1900 &&
          year <= new Date().getFullYear()
        ) {
          return String(year)
        }
      }
    }

    return ''
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


function parsePriceValue(value) {
      const text = String(value || '')
      const match =
        text.match(/(?:USD|\$|₡)?\s*[\d,.]+/i)
      if (!match) return ''
      let cleaned =
        match[0]
          .replace(/[^\d,.]/g, '')
      if (cleaned.includes('.') && cleaned.endsWith('.00')) {
        cleaned = cleaned.replace(/\.00$/, '')
      }
      cleaned = cleaned.replace(/,/g, '')
      const price = Number(cleaned)
      return Number.isFinite(price) && price > 0
        ? price
        : ''
    }

    function extractVisiblePrice($) {
      const bodyText =
        clean($('body').text())

      const desdeMatch =
        bodyText.match(/Desde\s*\$?\s*([\d,.]+)/i)

      if (desdeMatch?.[1]) {
        return parsePriceValue(desdeMatch[1])
      }

      const priceMatch =
        bodyText.match(/\$\s*([\d,.]+)/)

      if (priceMatch?.[1]) {
        return parsePriceValue(priceMatch[1])
      }

      return ''
    }

    function extractTablePrice($) {
      const cells =
        $('td')
          .map((_, el) => clean($(el).text()))
          .get()

      const price =
        cells.find(text =>
          /^(₡|\$)\s?[\d,.]+$/.test(text)
        )

      return parsePriceValue(price)
    }

    function extractVisiblePrice($) {
      const bodyText =
        clean($('body').text())

      const desdePrice =
        bodyText.match(/Desde\s*(₡|\$)\s*([\d,.]+)/i)

      if (desdePrice?.[2]) {
        return parsePriceValue(desdePrice[2])
      }

      return ''
    }

    function extractVisibleCurrency($) {
      const bodyText =
        clean($('body').text())

      const desdePrice =
        bodyText.match(/Desde\s*(₡|\$)\s*[\d,.]+/i)

      if (desdePrice?.[1] === '₡') return 'CRC'
      if (desdePrice?.[1] === '$') return 'USD'

      const tablePrice =
        $('td')
          .map((_, el) => clean($(el).text()))
          .get()
          .find(text => /^(₡|\$)\s?[\d,.]+$/.test(text))

      if (tablePrice?.startsWith('₡')) return 'CRC'
      if (tablePrice?.startsWith('$')) return 'USD'

      return ''
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

              if (text.includes('USD') || text.includes('$')) {
                return 'USD'
              }

              if (text.includes('CRC') || text.includes('₡')) {
                return 'CRC'
              }

              return clean(offer?.priceCurrency || '')
            }
function resolveRentPriceIdentity({offer, flightAd, title, description, $}) {
  const text = clean([title, flightAd?.description, description].join(' '))
  const monthly = /mensual|mensuales|por mes|al mes|monthly|per month/i.test(text)
  const shortTerm = /alquiler\s+(?:vacacional|diari[oa]|semanal|anual|por\s+(?:d[ií]a|noche|semana|año))|(?:daily|weekly|annual)\s+rent|rent(?:al)?\s+per\s+(?:day|night|week|year)/i.test(text)
  const specification = offer?.priceSpecification || {}
  if (/DAY|NIGHT|DAILY|WEEK|YEAR|ANNUAL|MTK|SQM/i.test(String(specification.unitText || specification.unitCode || '')) || (shortTerm && !monthly)) return {amount:'',currency:'',source:'unsupported_non_monthly_period'}
  const normalizeCurrency = value => ({'$':'USD','US$':'USD','₡':'CRC'}[clean(value).toUpperCase()] || clean(value).toUpperCase())
  const amount = value => /^[\d.,]+$/.test(clean(value)) ? cleanAreaNumber(value) : ''
  const nonMonthlyAmounts = [...text.matchAll(/(?:USD|US\$|\$|CRC|₡)\s*([\d.,]+)\s*(?:por|per|\/)\s*(?:d[ií]a|noche|semana|año|day|night|week|year)/gi)].map(x=>amount(x[1]))
  const perAreaAmounts = [...text.matchAll(/(?:precio\s*(?:por\s*)?m[²2]\s*[:=]?\s*(?:USD|US\$|\$|CRC|₡)?\s*([\d.,]+)|(?:USD|US\$|\$|CRC|₡)\s*([\d.,]+)\s*(?:por|\/)\s*m[²2])/gi)].map(x=>amount(x[1]||x[2]))
  const candidates = [
    {amount:amount(offer?.price),currency:normalizeCurrency(offer?.priceCurrency),source:'json_ld_offer'},
    {amount:amount(flightAd?.rent?.amount?.value),currency:normalizeCurrency(flightAd?.rent?.currency?.symbol),source:'flight_ad_explicit_rent'},
    {amount:amount(flightAd?.price?.amount?.value),currency:normalizeCurrency(flightAd?.price?.currency?.symbol || flightAd?.price?.currency?.code),source:'flight_ad'}
  ].filter(candidate=>candidate.amount && ['USD','CRC'].includes(candidate.currency) && !perAreaAmounts.includes(candidate.amount) && !nonMonthlyAmounts.includes(candidate.amount))
  const identities = new Map(candidates.map(candidate=>[candidate.currency+':'+candidate.amount,candidate]))
  if (identities.size===1) return candidates[0]
  if (identities.size>1) {
    // Resolve conflicting source fields only against the primary listing's visible header.
    if ($) {
      let header = $('h1').first()
      for (let depth=0;depth<6;depth++) {
        header=header.parent()
        const values=header.find('div,span,p').map((_,node)=>clean($(node).text())).get()
          .map(value=>value.match(/^(USD|US\$|\$|CRC|₡)\s*([\d.,]+)$/i)).filter(Boolean)
        if (!values.length) continue
        const visible=new Set(values.map(match=>normalizeCurrency(match[1])+':'+amount(match[2])))
        const matching=candidates.filter(candidate=>visible.has(candidate.currency+':'+candidate.amount))
        const distinct=new Set(matching.map(candidate=>candidate.currency+':'+candidate.amount))
        if(distinct.size===1) return {...matching[0],source:'primary_visible_header_conflict_resolution'}
        break
      }
    }
    return {amount:'',currency:'',source:'conflicting_monthly_price_evidence'}
  }
  // Only an explicitly labelled rental amount; never scan arbitrary numbers, deposits or fees.
  const pairs = [...text.matchAll(/(?:precio\s+(?:de\s+)?(?:alquiler|renta)|alquiler(?:\s+mensual)?|renta(?:\s+mensual)?|monthly\s+rent|rental\s+price)\s*[:=]?\s*(USD|US\$|\$|CRC|₡)\s*([\d.,]+)/gi)]
    .map(x=>({amount:amount(x[2]),currency:normalizeCurrency(x[1]),source:'explicit_rental_label'})).filter(x=>x.amount && !perAreaAmounts.includes(x.amount) && !nonMonthlyAmounts.includes(x.amount))
  const unique = new Map(pairs.map(x=>[x.currency+':'+x.amount,x]))
  return unique.size===1 ? [...unique.values()][0] : {amount:'',currency:'',source:'missing_or_ambiguous_monthly_rent'}
}

function extractFlightAd(html, sourceListingId) {
      const decoded =
        String(html || '')
          .replace(/\\"/g, '"')
          .replace(/\\u0026/g, '&')

      const marker =
        `"id":"${sourceListingId}"`

      const idIndex =
        decoded.indexOf(marker)

      if (idIndex === -1) {
        return null
      }

      /*
      * Find the target ad object containing this exact
      * source listing ID. Related ads may contain their
      * own square/lotSize values, so extraction MUST
      * remain bound to sourceListingId.
      */
      const adStart =
        decoded.lastIndexOf(
          '"ad":{',
          idIndex
        )

      if (adStart === -1) {
        return null
      }

      const objectStart =
        adStart + '"ad":'.length

      let depth = 0
      let inString = false
      let escaped = false

      for (
        let i = objectStart;
        i < decoded.length;
        i++
      ) {
        const char = decoded[i]

        if (escaped) {
          escaped = false
          continue
        }

        if (char === '\\') {
          escaped = true
          continue
        }

        if (char === '"') {
          inString = !inString
          continue
        }

        if (inString) {
          continue
        }

        if (char === '{') {
          depth++
          continue
        }

        if (char === '}') {
          depth--

          if (depth === 0) {
            try {
              const ad =
                JSON.parse(
                  decoded.slice(
                    objectStart,
                    i + 1
                  )
                )

              return String(ad?.id) ===
                String(sourceListingId)
                  ? ad
                  : null
            } catch {
              return null
            }
          }
        }
      }

      return null
    }

function extractProjectSquareFromHtml(html) {
      const matches = [
        html.match(/"projectModels":\{"square":\{"from":(\d+)/),
        html.match(/"square":\{"from":(\d+)/),
        html.match(/projectModels.*?"from":(\d+)/s)
      ]

      for (const match of matches) {
        if (match?.[1]) return `${match[1]} m²`
      }

      return ''
    }

function extractProjectLotSizeFromHtml(html) {
      const match =
        html.match(
          /"projectModels"\s*:\s*\{.*?"lotSize"\s*:\s*\{.*?"from"\s*:\s*([\d.]+)/s
        )
      return match?.[1]
        ? `${match[1]} m²`
        : ''
    }
           
function validRoomCount(value) {
    const number = Number(value)

    if (
      Number.isFinite(number) &&
      number > 0 &&
      number <= 20
    ) {
      return String(value)
    }

    return ''
  }

function usesConstructionAreaOnly(propertyType) {
  const normalized =
    normalizeText(propertyType)

  return (
    normalized === 'apartamento' ||
    normalized === 'apartamentos' ||
    normalized === 'condominio' ||
    normalized === 'condominios' ||
    normalized === 'locales comerciales y bodegas' ||
    normalized === 'alquiler de oficinas'
  )
}

function cleanAreaNumber(value) {
  let text =
    String(value || '')
      .replace(/\s*m²?/gi, '')
      .replace(/\s*m2/gi, '')
      .replace(/[^\d.,]/g, '')
      .trim()

  if (!text) {
    return ''
  }

  const lastDot =
    text.lastIndexOf('.')

  const lastComma =
    text.lastIndexOf(',')

  /*
   * Both separators:
   *
   * 1.611,40 -> 1611.40
   * 1,611.40 -> 1611.40
   */
  if (
    lastDot !== -1 &&
    lastComma !== -1
  ) {
    if (lastComma > lastDot) {
      text =
        text
          .replace(/\./g, '')
          .replace(',', '.')
    } else {
      text =
        text.replace(/,/g, '')
    }
  }

  /*
   * Comma only:
   *
   * 1611,40 -> 1611.40
   * 1,611    -> 1611
   */
  else if (lastComma !== -1) {
    const parts =
      text.split(',')

    if (
      parts.length === 2 &&
      parts[1].length <= 2
    ) {
      text =
        `${parts[0]}.${parts[1]}`
    } else {
      text =
        text.replace(/,/g, '')
    }
  }

  /*
   * Dot only:
   *
   * 990.72 -> 990.72
   * 1.611  -> 1611
   *
   * Three digits after the dot are treated
   * as a thousands grouping.
   */
  else if (lastDot !== -1) {
    const parts =
      text.split('.')

    if (
      parts.length === 2 &&
      parts[1].length === 3
    ) {
      text =
        `${parts[0]}${parts[1]}`
    } else if (parts.length > 2) {
      text =
        parts.join('')
    }
  }

  const parsed =
    Number(text)

  if (
    !Number.isFinite(parsed) ||
    parsed <= 0
  ) {
    return ''
  }

  return String(parsed)
}

function cleanExactAreaEvidence(value) {
  const number =
    cleanAreaNumber(value)

  if (!number) {
    return ''
  }

  return `${number} m²`
}

async function scrapeListing({
  browser,
  listingUrl,
  baseUrl
}) {
  console.log('Scraping:', listingUrl)

  const html =
    await fetchHtml(
      listingUrl,
      baseUrl
    )

// Capture the actual source-page observation, never a later CSV upload.
  const observation_id = crypto.randomUUID()
  const observed_at = sourceEvidence.get(listingUrl)?.observed_at || new Date().toISOString()

    const sourceListingId =
      createSourceListingId(listingUrl)

    const flightAd =
      extractFlightAd(
        html,
        sourceListingId
      )
const sourcePropertyType = extractSourcePropertyType(html, createSourceListingId(listingUrl))

  const $ =
    cheerio.load(html)

  const scripts = $('script')
        .map((_, el) => $(el).html() || '')
        .get()
        .filter(text => text.includes('self.__next_f.push'))

  const jsonLd =
    extractJsonLd($)

  const schema =
    findProductSchema(jsonLd)

  const offer =
    extractOffer(schema)

  const bodyText =
  clean($('body').text())
  const location =
    extractLocation($)
  const title =
    extractTitle($, schema)
  const description =
    extractDescription(schema)
  const evidenceDescription =
    clean(flightAd?.description || description)
  const insightAttributes =
    extractInsightAttributes($)
  const detailAttributes =
    extractDetailAttributes($)
  const rentPriceIdentity =
  resolveRentPriceIdentity({
    offer,
    flightAd,
    insightAttributes,
    detailAttributes,
    title,
    description,
    $
  })


  const rawBedrooms =
  extractRawBedrooms(insightAttributes) ||
  extractFromBodyText(bodyText, [
    /Desde\s*([\d.]+)\s*rec[áa]maras/i,
    /([\d.]+)\s*rec[áa]maras/i
  ])
  const rawBathrooms =
  extractRawBathrooms(insightAttributes) ||
  extractFromBodyText(bodyText, [
    /Desde\s*([\d.]+)\s*ba[ñn]os/i,
    /([\d.]+)\s*ba[ñn]os/i
  ])
  const rawParking =
  extractRawParking(insightAttributes) ||
  extractFromBodyText(bodyText, [
    /([\d.]+)\s*parking/i,
    /parking\s*([\d.]+)/i
  ])

const rawConstructionAreaResult =
  cleanExactAreaEvidence(flightAd?.square)
    ? {
        value:
          cleanExactAreaEvidence(
            flightAd.square
          ),
        source:
          'flightAd',
        field:
          'square'
      }
    : (() => {
        const detailValue =
          extractRawConstructionArea(
            {},
            detailAttributes
          )

        if (detailValue) {
          return {
            value:
              cleanExactAreaEvidence(
                detailValue
              ),
            source:
              'detail_attribute',
            field:
              'construction'
          }
        }

        const insightValue =
          extractRawConstructionArea(
            insightAttributes,
            {}
          )

        if (insightValue) {
          return {
            value:
              cleanExactAreaEvidence(
                insightValue
              ),
            source:
              'insight_attribute',
            field:
              'construction'
          }
        }

        const descriptionValue =
          extractAreaFromDescription(
            evidenceDescription,
            [
              /Construcción:\s*([\d,.]+)\s*m²?/i,
              /Construccion:\s*([\d,.]+)\s*m²?/i,
              /Construcci[oó]n:\s*([\d,.]+)\s*m2/i,
              /Área construida\s*([\d,.]+)\s*m²/i,
              /Area construida\s*([\d,.]+)\s*m²/i,
              /[ÁA]rea constructiva\s*([\d,.]+)\s*m2?/i,
              /([\d,.]+)\s*m²?\s+de\s+[áa]rea\s+de\s+oficina/i,
              /Area de Construcci[oó]n,\s*m2:\s*([\d,.]+)/i,
              /([\d.,]+)\s*m²?\s+de\s+construcci[oó]n/i,
              /([\d.,]+)\s*m2\s+de\s+construcci[oó]n/i,
              /([\d.,]+)\s*m²?\s+construidos/i,
              /([\d,.]+)\s*m²?\s+de\s+espacio\s+total/i,
              /construcci[oó]n\s+de\s+([\d,.]+)\s*m²?/i,
              /Construcci[oó]n\s+\d{4}\s*[–-]\s*([\d,.]+)\s*m²?/i
            ]
          )

        if (descriptionValue) {
          return {
            value:
              descriptionValue,
            source:
              'description',
            field:
              'explicit_construction'
          }
        }

        if (usesConstructionAreaOnly(sourcePropertyType)) {
          const genericArea =
            extractAreaFromDescription(
              evidenceDescription,
              [
                /(?:Área|Area)\s*:?\s*([\d,.]+)\s*m²?/i,
                /(?:Área|Area)\s*:?\s*([\d,.]+)\s*m2/i,
                /(?:Tamaño|Tamano)\s*:?\s*([\d,.]+)\s*m²?/i,
                /(?:Tamaño|Tamano)\s*:?\s*([\d,.]+)\s*m2/i,
                /(?:cuenta\s+con|ofrece)\s+([\d,.]+)\s*m²?/i
              ]
            )

          if (genericArea) {
              return {
                value:
                  genericArea,
                source:
                  'description',
                field:
                  'generic_area_construction_only_property_type'
              }
            }
          }

          const titleConstruction =
            extractAreaFromDescription(
              title,
              [
                /([\d,.]+)\s*m²?\s*construcci[oó]n/i,
                /([\d,.]+)\s*m2\s*construcci[oó]n/i
              ]
            )

          if (titleConstruction) {
            return {
              value:
                titleConstruction,
              source:
                'title',
              field:
                'explicit_construction'
            }
          }

        return {
          value:
            '',
          source:
            '',
          field:
            ''
        }
      })()

const rawConstructionArea =
  rawConstructionAreaResult.value

  const rawPropertyAreaResult =
  flightAd?.lotSize
    ? {
        value:
          cleanExactAreaEvidence(
            flightAd.lotSize
          ),
        source:
          'flightAd',
        field:
          'lotSize'
      }
    : (() => {
        const detailValue =
          extractRawPropertyArea(
            detailAttributes
          )

        if (detailValue) {
          return {
            value:
              cleanExactAreaEvidence(
                detailValue
              ),
            source:
              'detail_attribute',
            field:
              'explicit_land'
          }
        }

        const descriptionValue =
          extractAreaFromDescription(
            evidenceDescription,
            [
              /(?:Área|Area)\s+de\s+lote[:\s,]*([\d.,]+)\s*m²?/i,
              /(?:Área|Area)\s+del\s+lote[:\s,]*([\d.,]+)\s*m²?/i,
              /Lote[:\s]*([\d.,]+)\s*m²?/i,
              /(?:Informaci[oó]n\s+del\s+lote[\s\S]{0,120}?|Lote\s+#?\w+[\s\S]{0,80}?)[ÁA]rea:\s*([\d.,]+)\s*m²?/i,
              /Lote\s+de\s+([\d.,]+)\s*m²?/i,
              /Terreno[:\s]*([\d.,]+)\s*m²?/i,
              /Terreno\s+de\s+([\d.,]+)\s*m²?/i,
              /(?:Área|Area)\s+de\s+terreno[:\s,]*([\d.,]+)\s*m²?/i,
              /(?:Área|Area)\s+del\s+terreno[:\s,]*([\d.,]+)\s*m²?/i,
              /Parcela[:\s]*([\d.,]+)\s*m²?/i,
              /([\d.,]+)\s*m²?\s+de\s+terreno/i,
              /([\d.,]+)\s*m2\s+de\s+terreno/i,
              /([\d.,]+)\s*m²?\s+de\s+lote/i,
              /([\d.,]+)\s*m2\s+de\s+lote/i,
              /Parcela\s+de\s+([\d.,]+)\s*m²?/i
            ]
          )

        if (descriptionValue) {
          return {
            value:
              descriptionValue,
            source:
              'description',
            field:
              'explicit_land'
          }
        }

        return {
          value: '',
          source: '',
          field: ''
        }
      })()

const rawPropertyArea =
  rawPropertyAreaResult.value

  const rawYearBuilt =
      flightAd?.age ||
      extractRawYearBuilt(detailAttributes) ||
      extractYearFromDescription(description) ||
      extractYearFromDescription(bodyText)

  const page = await browser.newPage()
  let images
  try {
    await page.setRequestInterception(true)
    page.on('request', request => request.abort())
    await page.setJavaScriptEnabled(false)
    await page.setContent(html, {waitUntil:'domcontentloaded'})
    images = (await extractImages(page)).filter(url => {
      try { return new URL(url).pathname.split('/').some(part => part.startsWith(sourceListingId + '_')) } catch { return false }
    })
  } finally { await page.close() }


  return {
  observation_id,
  observed_at,
  source_name: SOURCE_NAME,
  source_listing_id: createSourceListingId(listingUrl),
  source_url: listingUrl,
  transaction_type: TRANSACTION_TYPE,
  listing_status: 'active',
  province: location.province,
  canton: location.canton,
  district: location.district,
  raw_breadcrumbs: location.raw_breadcrumbs,
  title,
  description: evidenceDescription,
  property_type: sourcePropertyType,
  raw_property_type: sourcePropertyType,

  raw_bedrooms:
    validRoomCount(flightAd?.rooms) ||
    extractFromBodyText(bodyText, [
      /rec[áa]maras\s*([\d.]+)/i,
      /([\d.]+)\s*rec[áa]maras/i
    ]) ||
    validRoomCount(rawBedrooms),

  raw_bathrooms:
    flightAd?.bathrooms || rawBathrooms,

  raw_parking:
    flightAd?.parking || rawParking,

  raw_year_built:
      rawYearBuilt,

  raw_property_area: rawPropertyArea,

  raw_construction_area: rawConstructionArea,


  raw_property_area_source:
    rawPropertyAreaResult.source,

  raw_property_area_field:
    rawPropertyAreaResult.field,

  raw_construction_area_source:
    rawConstructionAreaResult.source,

  raw_construction_area_field:
    rawConstructionAreaResult.field,

  current_price: '',

  monthly_price:
    rentPriceIdentity.amount,

  currency:
    rentPriceIdentity.currency,

    
  whatsapp:
  flightAd?.user?.contact?.whatsapp ||
  flightAd?.user?.contact?.phone1?.number ||
  flightAd?.user?.contact?.phone2?.number ||
  '',

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
    'observation_id',
    'observed_at',
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
    'property_type',
    'raw_property_type',
    'raw_bedrooms',
    'raw_bathrooms',
    'raw_parking',
    'raw_year_built',
    'raw_property_area',
    'raw_construction_area',
    'raw_property_area_source',
    'raw_property_area_field',
    'raw_construction_area_source',
    'raw_construction_area_field',
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

    

async function scrapeEncuentra24Rent({regionSlug = process.argv[2] || 'bienes-raices-alquiler', output = process.argv[3]} = {}) {
  const baseUrl = buildSearchUrl(regionSlug)
  if (/venta|for-sale/.test(baseUrl)) throw new Error('Sale-only search is not permitted for the rental scraper')
  const directory = output ? path.dirname(path.resolve(output)) : path.join(__dirname,'../../outputs/scrapers/encuentra24-rent',new Date().toISOString().replace(/[:.]/g,'-'))
  fs.mkdirSync(directory,{recursive:true});evidenceDirectory=path.join(directory,'source-evidence');fs.mkdirSync(evidenceDirectory,{recursive:true,mode:0o700})
  const fileName = output ? path.resolve(output) : path.join(directory,'encuentra24-rent-raw.csv')
  const stats = {started_at:new Date().toISOString(),source:SOURCE_NAME,transaction_type:TRANSACTION_TYPE,base_url:baseUrl,max_listings:MAX_LISTINGS,pages_inspected:0,pages_fetched:0,listing_occurrences:0,listings_discovered:0,listings_successfully_extracted:0,quality_rejected:0,duplicates_excluded:0,non_rental_excluded:0,extraction_failed:0,final_csv_rows:0,failures:[],rejections:[],csv:fileName}
  const rows=[],items=[],seen=new Set(),seenPages=new Set();let browser
  try {
    for(let pageNumber=1;pageNumber<=MAX_PAGES && items.length<MAX_LISTINGS;pageNumber++) {
      const pageUrl=buildPageUrl(baseUrl,pageNumber);stats.pages_inspected++
      const html=await fetchHtml(pageUrl);stats.pages_fetched++;const $=cheerio.load(html),cards=getListingCards($);const pageIds=[]
      for(const card of cards){const raw=getListingUrl($,card);if(!raw)continue;let url;try{const u=new URL(raw);u.search='';u.hash='';url=u.href}catch{continue}if(!isRentListing(url)){stats.non_rental_excluded++;continue}stats.listing_occurrences++;const id=createSourceListingId(url);pageIds.push(id);if(seen.has(id)){stats.duplicates_excluded++;continue}seen.add(id);if(items.length<MAX_LISTINGS)items.push({listingUrl:url,pageUrl})}
      const fingerprint=[...new Set(pageIds)].sort().join(',');if(!fingerprint)break;if(seenPages.has(fingerprint)){stats.failures.push({page:pageNumber,reason:'Repeated search population; pagination did not advance'});break}seenPages.add(fingerprint)
      console.log('PAGE',pageNumber,'unique rentals collected',items.length)
    }
    stats.listings_discovered=items.length
    if(items.length)browser=await puppeteer.launch({headless:true})
    for(const item of items){try{const row=await scrapeListing({browser,listingUrl:item.listingUrl,baseUrl:item.pageUrl});stats.listings_successfully_extracted++
      const valid=isObservationValid(row)&&isRentListing(row.source_url)&&row.transaction_type==='rent'&&['CRC','USD'].includes(row.currency)&&Number(row.monthly_price)>0&&!row.current_price
      if(!valid){stats.quality_rejected++;stats.rejections.push({url:item.listingUrl,reason:'Missing or unsupported unambiguous rental price/currency/evidence'});continue}rows.push(row)
    }catch(error){stats.extraction_failed++;stats.failures.push({url:item.listingUrl,status:error.response?.status||null,url:error.config?.url||null,reason:error.message});console.log('EXTRACTION FAILED',error.response?.status||error.code||error.message);if([401,403,429].includes(error.response?.status)||/challenge/i.test(error.message))break}}
  }catch(error){stats.failures.push({status:error.response?.status||null,url:error.config?.url||null,reason:error.message});console.error('SCRAPER STOPPED',error.response?.status||error.code||error.message)}finally{if(browser)await browser.close();stats.listings_discovered=items.length;stats.final_csv_rows=rows.length;stats.finished_at=new Date().toISOString();stats.status=stats.failures.length?'PARTIAL':rows.length?'WORKING':'BLOCKED';if(!rows.length&&stats.failures.length)stats.status='BLOCKED';writeCsv({rows,fileName});fs.writeFileSync(path.join(directory,'run-summary.json'),JSON.stringify(stats,null,2));fs.writeFileSync(path.join(directory,'source-evidence-manifest.json'),JSON.stringify([...sourceEvidence.values()],null,2));console.log(JSON.stringify(stats,null,2))}
  return {rows,stats}
}
if(require.main===module) scrapeEncuentra24Rent().catch(error=>{console.error(error.message);process.exitCode=1})
module.exports={isRentListing,resolveRentPriceIdentity,getCsvHeaders,buildPageUrl,scrapeEncuentra24Rent}
