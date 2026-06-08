const axios = require('axios')
const cheerio = require('cheerio')
const puppeteer = require('puppeteer')
const fs = require('fs')
const transaction_type = 'rent'


function clean(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function csvEscape(value) {
  return `"${String(value || '').replace(/"/g, '""')}"`
}

function normalizeBedrooms(value) {
  const n = parseInt(String(value).replace(/[^\d]/g, ''), 10)
  if (!n) return ''
  if (n >= 5) return '5+ Bedrooms'
  if (n === 1) return '1 Bedroom'
  return `${n} Bedrooms`
}

function normalizeBathrooms(value) {
  const n = Math.ceil(
    parseFloat(
      String(value).replace(',', '.').replace(/[^\d.]/g, '')
    )
  )
  if (!n) return ''
  if (n >= 5) return '5+ Bathrooms'
  if (n === 1) return '1 Bathroom'
  return `${n} Bathrooms`
}

function normalizeParking(value) {
  const n = parseInt(String(value).replace(/[^\d]/g, ''), 10)
  if (!n) return ''
  if (n >= 4) return '4+ Vehicles'
  if (n === 1) return '1 Vehicle'
  return `${n} Vehicles`
}

function normalizeYearBuilt(value) {
  const year = parseInt(String(value).replace(/[^\d]/g, ''), 10)
  if (!year) return ''
  if (year < 1980) return 'Pre-1980'
  if (year < 1990) return '1980s'
  if (year < 2000) return '1990s'
  if (year < 2010) return '2000s'
  if (year < 2020) return '2010s'
  return '2020+'
}

function normalizePropertyType(url, text) {
  const value = `${url} ${text}`.toLowerCase()

  if (value.includes('apartamento') || value.includes('apartment') || value.includes('condo')) return 'Condo'
  if (value.includes('casa') || value.includes('house')) return 'House'
  if (value.includes('lote') || value.includes('terreno') || value.includes('land')) return 'Land'
  if (value.includes('finca') || value.includes('farm')) return 'Farm'
  if (value.includes('cabaña') || value.includes('cabina') || value.includes('cabin')) return 'Cabin'
  if (value.includes('comercial') || value.includes('oficina') || value.includes('bodega') || value.includes('local')) return 'Commercial Property'

  return ''
}

function inferUtility(text) {
  const value = text.toLowerCase()
  const utilities = []

  if (value.includes('electricidad') || value.includes('luz')) utilities.push('Electricity')
  if (value.includes('agua')) utilities.push('Water')
  if (value.includes('internet') || value.includes('fibra óptica') || value.includes('fibra optica')) utilities.push('Internet')
  if (value.includes('cable')) utilities.push('Cable')
  if (value.includes('séptico') || value.includes('septico')) utilities.push('Septic')
  if (value.includes('alcantarillado')) utilities.push('Sewer')

  return utilities.join('|')
}

function inferEnvironment(text) {
  const value = text.toLowerCase()

  if (value.includes('playa') || value.includes('beach') || value.includes('frente al mar')) return 'Beachfront'
  if (value.includes('montaña') || value.includes('mountain') || value.includes('vista a las montañas')) return 'Mountain'
  if (value.includes('urbano') || value.includes('ciudad') || value.includes('centro')) return 'Urban'
  if (value.includes('rural') || value.includes('campo')) return 'Rural'
  if (value.includes('condominio')) return 'Gated Community'
  if (value.includes('bosque') || value.includes('forest')) return 'Forest'
  if (value.includes('río') || value.includes('rio')) return 'Riverfront'

  return ''
}

function inferAccessibility(text) {
  const value = text.toLowerCase()

  if (value.includes('calle asfaltada') || value.includes('carretera asfaltada') || value.includes('asfaltada')) return 'Paved Road'
  if (value.includes('4x4')) return '4x4 Required'
  if (value.includes('fácil acceso') || value.includes('facil acceso')) return '2WD Accessible'
  if (value.includes('caminable')) return 'Walkable'

  return ''
}

function inferTerrain(text) {
  const value = text.toLowerCase()

  if (value.includes('plano') || value.includes('flat')) return 'Flat'
  if (value.includes('montañoso') || value.includes('montañosa')) return 'Mountainous'
  if (value.includes('pendiente') || value.includes('inclinado')) return 'Steep Slope'
  if (value.includes('colinas')) return 'Rolling Hills'
  if (value.includes('bosque')) return 'Forested'
  if (value.includes('rocoso')) return 'Rocky'
  if (value.includes('agrícola') || value.includes('agricola')) return 'Agricultural Terrain'

  return ''
}

function inferLegalStatus(text) {
  const value = text.toLowerCase()

  if (value.includes('título') || value.includes('titulo') || value.includes('titulada') || value.includes('plano catastro')) {
    return 'Titled Property'
  }

  if (value.includes('concesión') || value.includes('concesion')) return 'Concession'
  if (value.includes('posesión') || value.includes('posesion')) return 'Possession Rights'

  return ''
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

async function scrapeEncuentra24Rent() {
  try {
    const regionSlug = process.argv[2]

        let province = ''

    if (!regionSlug) {
      console.error('Missing region slug')
      return
    }

    console.log('FINAL LOCATION:', province)

    const baseUrl =
  `https://www.encuentra24.com/costa-rica-es/bienes-raices-alquiler/${regionSlug}`

    const homepageResponse =
      await axios.get(baseUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
      })

    const $ = cheerio.load(homepageResponse.data)

    const listings = []

    const cards =
  $('.item-card-link')
    .toArray()
    .slice(0,20)

    const browser =
      await puppeteer.launch({
        headless: true
      })

      let canton = ''
let district = ''

    for (const el of cards) {
      let title = ''

      const relativeUrl =
            $(el).attr('href')

      const listingUrl =
        relativeUrl
          ? `https://www.encuentra24.com${relativeUrl}`
          : ''

      if (!listingUrl) continue

      if (
        !listingUrl.includes('/bienes-raices-alquiler')
        ) {
        continue
        }

      console.log('Scraping:', listingUrl)

      const detailResponse =
        await axios.get(listingUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            Referer: baseUrl
          }
        })

      const detail$ =
        cheerio.load(detailResponse.data)

        fs.writeFileSync(
            'detail-page.html',
            detailResponse.data
            )

            console.log(
                    'DETAIL PAGE IMAGE COUNT:',
                    detail$('img').length
                    )

                    detail$('img').each((i, el) => {

                    if (i < 20) {

                        console.log(
                        'IMG',
                        i,
                        detail$(el).attr('src')
                        )

                    }

                    })

        const breadcrumbParts =
            detail$('.breadcrumbs a')
                .map((i, el) => clean(detail$(el).text()))
                .get()

        province =
            normalizeProvince(
                breadcrumbParts[4]
                    ?.replace(' provincia', '') || ''
            )

        canton =
            normalizeCanton(
                breadcrumbParts[5] || ''
            )

        district =
            clean(
                breadcrumbParts[6] || ''
            )

        canton = canton.replace(' Capital', '')

console.log(
    'BREADCRUMB PARTS:',
    breadcrumbParts
)

        let schema = null

            detail$('script[type="application/ld+json"]').each((i, el) => {
            try {
                const parsed = JSON.parse(detail$(el).html())

                if (
                parsed &&
                parsed['@type'] === 'Product'
                ) {
                schema = parsed
                }
            } catch (e) {}
            })

            detail$('script[type="application/ld+json"]').each((i, el) => {

            try {

                const parsed =
                JSON.parse(detail$(el).html())

                console.log(
                'JSONLD',
                i,
                parsed?.['@type']
                )

            } catch (e) {}

            })

            title =
                clean(schema?.name || '')

      let construction_area = ''
      let property_area = ''
      let bedrooms = ''
      let bathrooms = ''
      let parking = ''
      let year_built_range = ''
      let description = ''
      let whatsapp = ''
      let images = []

      description =
        clean(schema?.description || '')

      detail$('.d3-property-insight__attribute')
        .each((index, detail) => {
          const attrTitle =
            clean(
              detail$(detail)
                .find('.d3-property-insight__attribute-title')
                .text()
            )

          const attrValue =
            clean(
              detail$(detail)
                .find('.d3-property-insight__attribute-value')
                .text()
            )

          if (attrTitle.includes('Bedrooms') || attrTitle.includes('Recámaras')) {
            bedrooms = normalizeBedrooms(attrValue)
          }

          if (attrTitle.includes('Bathrooms') || attrTitle.includes('Baños')) {
            bathrooms = normalizeBathrooms(attrValue)
          }

          if (attrTitle.includes('Parking') || attrTitle.includes('Parqueo')) {
            parking = normalizeParking(attrValue)
          }

          if (
            attrTitle.includes('M² of construction') ||
            attrTitle.includes('m² de construcción') ||
            attrTitle.includes('Construcción')
          ) {
            construction_area = attrValue ? `${attrValue} m²` : ''
          }
        })

      detail$('.d3-property-details__detail-label')
        .each((i, el) => {
          const label =
            clean(
              detail$(el)
                .clone()
                .children()
                .remove()
                .end()
                .text()
            )

          const value =
            clean(
              detail$(el)
                .find('.d3-property-details__detail')
                .text()
            )

          if (
            label.includes('Lot Size') ||
            label.includes('Tamaño del lote') ||
            label.includes('Terreno')
          ) {
            property_area = value
          }

          if (
            label.includes('Year of construction') ||
            label.includes('Año de construcción')
          ) {
            year_built_range = normalizeYearBuilt(value)
          }
        })

             images =
                detail$('img.card_image')
                  .map((i, el) =>
                    detail$(el).attr('src')
                  )
                  .get()
                  .filter(Boolean)

              images = images.map(
                (img) =>
                  img.replace(
                    't_or_cvr_th',
                    't_or_fh_l'
                  )
              )

              images = [...new Set(images)]

                console.log(
                'IMAGES FOUND:',
                images.length
                )

                console.log(
                images.slice(0, 5)
                )

      try {
        const page =
          await browser.newPage()

        await page.setUserAgent(
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        )

        await page.goto(listingUrl, {
          waitUntil: 'networkidle2'
        })

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

        whatsapp =
          whatsappLink.match(/\d+/)?.[0] || ''

        await page.close()
      } catch (err) {
        console.error('WHATSAPP ERROR:', err.message)
      }

      const raw_property_type =
         breadcrumbParts[3] || ''

      const fullText =
        `${title} ${description} ${raw_property_type}`

      const property_type =
        normalizePropertyType(listingUrl, fullText)

    const offer =
        Array.isArray(schema?.offers)
            ? schema.offers[0]
            : schema?.offers

    const priceNumber =
        Number(offer?.price || 0)
      
        console.log({
            province,
            canton,
            district,
            title,
            priceNumber,
            currency: offer?.priceCurrency
        })

      listings.push({
        province,
        canton,
        district,

        property_type,

        property_area,

        utility:
          inferUtility(fullText),

        environment:
          inferEnvironment(fullText),

        accessibility:
          inferAccessibility(fullText),

        terrain:
          inferTerrain(fullText),

        legal_status:
          inferLegalStatus(fullText),

          price_millions: '',

            monthly_price: priceNumber,

        whatsapp,

        images:
          images.join('|'),

        title,

        description,

        bedrooms,

        bathrooms,

        parking,

        year_built_range,

        construction_area,

        transaction_type: 'rent',

        listing_status: 'active',

        currency:
             offer?.priceCurrency || '',

        source_url:
          listingUrl
      })
    }

    await browser.close()

    const headers = [
      'province',
      'canton',
      'district',
      'property_type',
      'property_area',
      'utility',
      'environment',
      'accessibility',
      'terrain',
      'legal_status',
      'price_millions',
      'monthly_price',
      'whatsapp',
      'images',
      'title',
      'description',
      'bedrooms',
      'bathrooms',
      'parking',
      'year_built_range',
      'construction_area',
      'transaction_type',
      'listing_status',
      'currency',
      'source_url'
    ]

    const csvRows = [
      headers.join(',')
    ]

    for (const listing of listings) {
      csvRows.push(
        headers
          .map(header => csvEscape(listing[header]))
          .join(',')
      )
    }

    const fileName =
      `${regionSlug}-rent.csv`

    fs.writeFileSync(
      fileName,
      csvRows.join('\n')
    )

    console.log(JSON.stringify(listings, null, 2))
    console.log(`CSV CREATED: ${fileName}`)
  } catch (error) {
    console.error('SCRAPER ERROR:', error.message)
  }
}

scrapeEncuentra24Rent()