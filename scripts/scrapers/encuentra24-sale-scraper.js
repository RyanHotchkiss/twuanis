const axios = require('axios')
const cheerio = require('cheerio')
const puppeteer = require('puppeteer')

const fs = require('fs')
const path = require('path')
const os = require('os')
const crypto = require('crypto')
const { extractSourcePropertyType } = require('./encuentra24-property-type')
const { createRunArchive } = require('./scraper-run-archive.cjs')
const { extractEncuentra24SaleGeography } = require('./encuentra24-sale-geography.cjs')

const { isObservationValid } = require('./quality/isObservationValid')
const SOURCE_NAME = 'encuentra24'
const TRANSACTION_TYPE = 'sale'
let collectionStopRequested = false
process.once('SIGTERM', () => { collectionStopRequested = true })

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

function isSaleListing(url) {
  return (
    url.includes('/real-estate-for-sale-') ||
    url.includes('/bienes-raices-venta-') ||
    url.includes('/bienes-raices-proyectos-nuevos/')
  )
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

function extractLocation($) {
  const breadcrumbParts =
    $('[class*="breadcrumb"]')
      .last()
      .find('a')
      .map((i, el) => clean($(el).text()))
      .get()

  return extractEncuentra24SaleGeography(breadcrumbParts)
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
      'Ano de construccion',
      'Año de contrucción',
      'Ano de contruccion',
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

function resolveSalePriceIdentity({
  offer,
  flightAd,
  insightAttributes,
  detailAttributes,
  title,
  description,
  $
}) {
  const offerPrice =
    parsePriceValue(
      offer?.price
    )

  const offerCurrency =
    clean(
      offer?.priceCurrency
    ).toUpperCase()

  if (
    offerPrice &&
    (
      offerCurrency === 'USD' ||
      offerCurrency === 'CRC'
    )
  ) {
    return {
      amount: offerPrice,
      currency: offerCurrency,
      source: 'json_ld_offer'
    }
  }

  const flightPrice =
    parsePriceValue(
      flightAd?.price?.amount?.value
    )

  const flightCurrencyRaw =
    clean(
      flightAd?.price?.currency?.countryISO ||
      flightAd?.price?.currency?.symbol
    ).toUpperCase()

  const flightCurrency =
    flightCurrencyRaw === '$'
      ? 'USD'
      : flightCurrencyRaw === '₡'
        ? 'CRC'
        : flightCurrencyRaw

  if (
    flightPrice &&
    (
      flightCurrency === 'USD' ||
      flightCurrency === 'CRC'
    )
  ) {
    return {
      amount: flightPrice,
      currency: flightCurrency,
      source: 'flight_ad'
    }
  }

  const fallbackAmount =
    extractPrice(
      offer,
      insightAttributes,
      detailAttributes,
      title,
      description
    )

  const fallbackCurrency =
    extractVisibleCurrency($) ||
    extractCurrency(
      offer,
      insightAttributes,
      detailAttributes,
      title
    )

  return {
    amount: fallbackAmount,
    currency: fallbackCurrency,
    source: 'legacy_fallback'
  }
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
      normalized === 'condominios'
    )
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



function extractLegacyMeasurements({ flightAd, detailAttributes, insightAttributes, evidenceDescription, sourcePropertyType, title }) {
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
                  /(?:Área|Area)\s*:?\s*([\d,.]+)\s*m2/i
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

        if (
            normalizeText(sourcePropertyType) === 'lotes y terrenos'
          ) {
            const titleArea =
              extractAreaFromDescription(
                title,
                [
                  /([\d.,]+)\s*m²/i,
                  /([\d.,]+)\s*m2/i
                ]
              )

            if (titleArea) {
              return {
                value: titleArea,
                source: 'title',
                field: 'explicit_land'
              }
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

const rawPropertyArea =
  rawPropertyAreaResult.value


return { rawConstructionAreaResult, rawPropertyAreaResult }
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
  const observed_at = new Date().toISOString()

    const sourceListingId =
      createSourceListingId(listingUrl)

    const flightAd =
      extractFlightAd(
        html,
        sourceListingId
      )
const sourcePropertyType = extractSourcePropertyType(html, createSourceListingId(listingUrl))

  fs.writeFileSync('debug-listing.html', html)

  const $ =
    cheerio.load(html)

  const scripts = $('script')
        .map((_, el) => $(el).html() || '')
        .get()
        .filter(text => text.includes('self.__next_f.push'))

      fs.writeFileSync(
        'flight.txt',
        scripts.join('\n\n')
      )

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

  const salePriceIdentity =
    resolveSalePriceIdentity({
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

  const { rawConstructionAreaResult, rawPropertyAreaResult } = extractLegacyMeasurements({ flightAd, detailAttributes, insightAttributes, evidenceDescription, sourcePropertyType, title })
const rawConstructionArea = rawConstructionAreaResult.value
const rawPropertyArea = rawPropertyAreaResult.value

  const rawYearBuilt =
      flightAd?.age ||
      extractRawYearBuilt(detailAttributes) ||
      extractYearFromDescription(description) ||
      extractYearFromDescription(bodyText)

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
    await page.close()


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
    extractFromBodyText(description, [
      /(\d+(?:\.\d+)?)\s*habitaciones/i,
      /(\d+(?:\.\d+)?)\s*dormitorios/i,
      /(\d+(?:\.\d+)?)\s*bedrooms/i,
      /(\d+(?:\.\d+)?)\s*rec[áa]maras/i
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

  current_price:
    salePriceIdentity.amount,

  currency:
    salePriceIdentity.currency,

  monthly_price: '',

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
function startCsv(fileName) {
  fs.writeFileSync(fileName, `${getCsvHeaders().join(',')}\n`, { mode: 0o600 })
}

function appendCsvRow(fileName, row) {
  fs.appendFileSync(fileName, `${getCsvHeaders().map(header => csvEscape(row[header])).join(',')}\n`, { mode: 0o600, flag: 'a' })
}

function readNdjson(fileName) {
  if (!fileName || !fs.existsSync(fileName)) return []
  return fs.readFileSync(fileName, 'utf8').split(/\r?\n/).filter(Boolean).flatMap(line => {
    try { return [JSON.parse(line)] } catch { return [] }
  })
}

function completedSourceIds(checkpointFile) {
  return new Set(readNdjson(checkpointFile).map(entry => String(entry?.observation?.source_listing_id || '')).filter(Boolean))
}

function readListingIndex(indexFile) {
  const seen = new Set()
  return readNdjson(indexFile).flatMap(entry => {
    const listingUrl = String(entry?.listingUrl || '').trim()
    if (!listingUrl || seen.has(listingUrl)) return []
    seen.add(listingUrl)
    return [{ listingUrl, pageUrl: String(entry?.pageUrl || '').trim() }]
  })
}

function appendIndex(indexFile, items) {
  const existing = new Set(readListingIndex(indexFile).map(item => item.listingUrl))
  for (const item of items) {
    if (!item.listingUrl || existing.has(item.listingUrl)) continue
    existing.add(item.listingUrl)
    fs.appendFileSync(indexFile, `${JSON.stringify(item)}\n`, { mode: 0o600, flag: 'a' })
  }
}

async function processListingBatch({ batch, browser, archive, fileName, accepted, detailOutcomesFile }) {
  for (const item of batch) {
    if (collectionStopRequested) return
    const { listingUrl, pageUrl } = item
    if (!createSourceListingId(listingUrl) || !isSaleListing(listingUrl)) continue
    try {
      console.log('START LISTING:', listingUrl)
      const row = await scrapeListing({ browser, listingUrl, baseUrl: pageUrl })
      archive.append(row)
      if (!isObservationValid(row)) {
        console.log('SKIPPED LOW QUALITY OBSERVATION:', row.source_url)
        continue
      }
      appendCsvRow(fileName, row)
      accepted.count += 1
      fs.appendFileSync(detailOutcomesFile, `${JSON.stringify({ recorded_at: new Date().toISOString(), source_listing_id: row.source_listing_id, source_url: listingUrl, outcome: 'extracted' })}\n`, { mode: 0o600, flag: 'a' })
      console.log('FINISHED LISTING:', listingUrl)
    } catch (error) {
      fs.appendFileSync(detailOutcomesFile, `${JSON.stringify({ recorded_at: new Date().toISOString(), source_listing_id: createSourceListingId(listingUrl), source_url: listingUrl, outcome: 'failed', reason: error.message })}\n`, { mode: 0o600, flag: 'a' })
      console.error('LISTING ERROR:', listingUrl, error.message)
    }
  }
}

    

async function scrapeEncuentra24Sale({ regionSlug = process.argv[2] || 'bienes-raices-venta-de-propiedades', output = process.argv[3] } = {}) {
  if (!regionSlug) {
    console.error('Missing region slug')
    process.exit(1)
  }
  const baseUrl =
    buildSearchUrl(regionSlug)
  const archiveDirectory = path.join(path.dirname(path.resolve(output || path.join(os.homedir(), 'Desktop', `${regionSlug}-sale-raw.csv`))), 'source-observation-archive')
  const archive = createRunArchive(archiveDirectory, { commandId: process.env.TWUANIS_SCRAPER_COMMAND_ID || null, sourceName: SOURCE_NAME, transaction: TRANSACTION_TYPE, extractedAt: new Date().toISOString() })

console.log(
  'BASE URL:',
  baseUrl
)

  const fileName = output ? path.resolve(output) : path.join(os.homedir(), 'Desktop', `${regionSlug}-sale-raw.csv`)
  const indexFile = path.join(archive.directory, 'listing-index.ndjson')
  const detailOutcomesFile = path.join(archive.directory, 'detail-outcomes.ndjson')
  const recoveryIndex = process.env.ENCUENTRA24_SALE_RECOVERY_INDEX
  const recoveryCheckpoint = process.env.ENCUENTRA24_SALE_RECOVERY_CHECKPOINT
  const accepted = { count: 0 }
  let browser
  let inventoryComplete = false
  let collectionFailure = null
  try {
    const completed = new Set([
      ...completedSourceIds(archive.checkpoint),
      ...completedSourceIds(recoveryCheckpoint)
    ])
    // A supplied durable checkpoint is evidence-only input.  Mirror it into
    // this run's archive but never alter the original checkpoint.
    if (recoveryIndex && fs.existsSync(recoveryIndex)) appendIndex(indexFile, readListingIndex(recoveryIndex))
    const queued = readListingIndex(indexFile).filter(item => !completed.has(createSourceListingId(item.listingUrl)))
    // Open the run CSV before discovery so a bounded collection preserves
    // every valid detail observation already captured when collection stops.
    startCsv(fileName)
    browser = await puppeteer.launch({ headless: true })
    if (queued.length) {
      for (let offset = 0; offset < queued.length && !collectionStopRequested; offset += 25) {
        await processListingBatch({ batch: queued.slice(offset, offset + 25), browser, archive, fileName, accepted, detailOutcomesFile })
      }
    }
    // A retained index is only a recovery starting point. Continue at page 1
    // afterwards so a prior interruption cannot turn a partial index into an
    // authoritative inventory boundary.
    const seenUrls = new Set(readListingIndex(indexFile).map(item => item.listingUrl))
    const seenPageFingerprints = new Set()
    let batch = []
    for (let pageNumber = 1; !collectionStopRequested; pageNumber++) {
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
    inventoryComplete = true
    break
  }

      // Persist only lightweight discovery evidence.  The Cheerio page and
      // card objects become collectible before the next inventory page.
      let newlyDiscovered = 0
      const pageIds = []
      for (const card of pageCards) {
        const listingUrl = getListingUrl($page, card)
        const sourceListingId = createSourceListingId(listingUrl)
        if (sourceListingId) pageIds.push(sourceListingId)
        if (!listingUrl || seenUrls.has(listingUrl)) continue
        seenUrls.add(listingUrl)
        newlyDiscovered += 1
        fs.appendFileSync(indexFile, `${JSON.stringify({ listingUrl, pageUrl })}\n`, { mode: 0o600, flag: 'a' })
        batch.push({ listingUrl, pageUrl })
        if (batch.length === 25) {
          await processListingBatch({ batch, browser, archive, fileName, accepted, detailOutcomesFile })
          batch = []
          if (collectionStopRequested) break
        }
      }
      const fingerprint = [...new Set(pageIds)].sort().join(',')
      if (!fingerprint || seenPageFingerprints.has(fingerprint)) {
        collectionFailure = new Error('Repeated or unresolvable search population; inventory completeness cannot be verified')
        break
      }
      seenPageFingerprints.add(fingerprint)
      // A recovered index can already contain every URL from an early page.
      // Continue pagination: a non-empty page with no new URLs is neither
      // completion nor failure by itself. A repeated page fingerprint above
      // remains fail-closed evidence that completion cannot be verified.
      if (!collectionStopRequested && newlyDiscovered === 0) {
        console.log('SEARCH PAGE ADDED NO NEW URLS; CONTINUING UNTIL VERIFIED TERMINATION')
      }
    }
    if (batch.length && !collectionStopRequested) await processListingBatch({ batch, browser, archive, fileName, accepted, detailOutcomesFile })

console.log('ROWS COLLECTED:', accepted.count)
    await archive.finalize({ materialize: false })
    fs.writeFileSync(path.join(archive.directory, 'run-summary.json'), JSON.stringify({
      source: SOURCE_NAME, transaction_type: TRANSACTION_TYPE,
      inventory_complete: inventoryComplete && !collectionStopRequested && !collectionFailure,
      status: inventoryComplete && !collectionStopRequested && !collectionFailure ? 'COMPLETE' : collectionStopRequested ? 'INTERRUPTED' : 'PARTIAL',
      ...(collectionFailure ? { failure: collectionFailure.message } : {}),
      listings_successfully_extracted: accepted.count, finished_at: new Date().toISOString()
    }, null, 2))
    
console.log(
  'WRITECSV COMPLETE:',
  fileName
)

    console.log(
      `RAW CSV CREATED: ${fileName}`
    )
  } catch (error) {
    collectionFailure = error
    console.error(
      'SCRAPER ERROR:',
      error.message
    )
  } finally {
    if (browser) {
      await browser.close()
    }
    if (collectionFailure || collectionStopRequested || !inventoryComplete) process.exitCode = 1
  }
}
if (require.main === module) scrapeEncuentra24Sale().catch(error => { console.error(error.message); process.exitCode = 1 })
module.exports = { scrapeEncuentra24Sale, createSourceListingId, completedSourceIds, readListingIndex, appendIndex, extractFlightAd, extractJsonLd, extractLocation, extractInsightAttributes, extractDetailAttributes, resolveSalePriceIdentity , extractLegacyMeasurements }


