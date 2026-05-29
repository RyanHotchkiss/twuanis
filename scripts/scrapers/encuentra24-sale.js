const axios = require('axios')

const cheerio = require('cheerio')

const puppeteer = require('puppeteer')

const fs = require('fs')




async function scrapeEncuentra24Sale() {

            try {

              const regionSlug =

                process.argv[2]

              const slugParts =

                regionSlug.split('-')

              let province = ''

              let canton = ''

              let district = ''

      const sanJoseCapitalDistrictMap = {

                      'carmen': 'Carmen',
                      'merced': 'Merced',
                      'hospital': 'Hospital',
                      'catedral': 'Catedral',
                      'zapote': 'Zapote',
                      'san-francisco-de-dos-rios':
                        'San Francisco de Dos Ríos',
                      'uruca': 'Uruca',
                      'mata-redonda': 'Mata Redonda',
                      'pavas': 'Pavas',
                      'hatillo': 'Hatillo',
                      'san-sebastian':
                        'San Sebastián'

                    }

                    if (slugParts.length === 2) {

                      province =
                        slugParts[0]
                          .replace(/\b\w/g, c => c.toUpperCase())

                      canton =
                        slugParts[1]
                          .replace(/\b\w/g, c => c.toUpperCase())

                      district = ''

                    }

                    else if (
                      regionSlug.startsWith(
                        'san-jose-san-jose-capital-'
                      )
                    ) {

                      province = 'San Jose'

                      canton = 'Central San José'

                      const districtSlug =
                        regionSlug.replace(
                          'san-jose-san-jose-capital-',
                          ''
                        )

                      district =
                        sanJoseCapitalDistrictMap[
                          districtSlug
                        ] || districtSlug

                    }

                    else if (
                      regionSlug ===
                      'san-jose-escazu'
                    ) {

                      province = 'San Jose'

                      canton = 'Escazú'

                      district = ''

                    }

                    else if (
                      regionSlug.startsWith(
                        'san-jose-escazu-'
                      )
                    ) {

                      province = 'San Jose'

                      canton = 'Escazú'

                      district =
                        regionSlug
                          .replace(
                            'san-jose-escazu-',
                            ''
                          )
                          .replace(/-/g, ' ')
                          .replace(/\b\w/g,
                            c => c.toUpperCase()
                          )

                    }

                    else {

                      console.log(
                        'UNKNOWN SLUG:',
                        regionSlug
                      )

                    }



console.log(
  'FINAL LOCATION:',
  province,
  canton,
  district
)

const baseUrl =
  `https://www.encuentra24.com/costa-rica-en/searchresult/real-estate?q=keyword.&regionslug=${regionSlug}`
  
    const homepageResponse =
      await axios.get(baseUrl, {

        headers: {

          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

        }

      })

    const $ =
      cheerio.load(homepageResponse.data)

    const listings = []

    const cards =
      $('.d3-ad-tile')
        .toArray()
        .slice(0, 20)

    for (const el of cards) {

      const title =
        $(el)
          .find('.d3-ad-tile__title')
          .text()
          .replace(/\s+/g, ' ')
          .trim()

      const price =
        $(el)
          .find('.d3-ad-tile__price')
          .text()
          .replace(/\s+/g, ' ')
          .trim()

      const location =
        $(el)
          .find('.d3-ad-tile__location')
          .text()
          .replace(/\s+/g, ' ')
          .trim()

      const image =
        $(el)
          .find('.d3-ad-tile__photo')
          .attr('data-original')

      const relativeUrl =
        $(el)
          .find('a.d3-ad-tile__description')
          .attr('href')

      const listingUrl =
        relativeUrl
          ? `https://www.encuentra24.com${relativeUrl}`
          : null

      if (!listingUrl) {

        continue

      }

      if (
        !listingUrl.includes(
          '/real-estate-for-sale-'
        )
      ) {

        continue

      }

      let transaction_type = 'sale'

      let property_type = ''

      let raw_property_type = ''

      if (
        listingUrl.includes(
          'houses-homes'
        )
      ) {

        property_type = 'house'

      }

      if (
        listingUrl.includes(
          'apartments-condos'
        )
      ) {

        property_type = 'condo'

      }

      if (
        listingUrl.includes(
          'buildings'
        )
      ) {

        property_type = 'building'

      }

      if (
        listingUrl.includes(
          'comercial'
        )
      ) {

        property_type = 'commercial'

      }

      if (
        listingUrl.includes(
          'offices'
        )
      ) {

        property_type = 'office'

      }

      console.log(
        `Transaction: ${transaction_type}`
      )

      console.log(
        `Property Type: ${property_type}`
      )

      console.log(
        `Scraping: ${listingUrl}`
      )

      const detailResponse =
        await axios.get(listingUrl, {

          headers: {

            'User-Agent':
              'Mozilla/5.0',

            Referer:
              baseUrl

          }

        })

      const detail$ =
        cheerio.load(detailResponse.data)



      let construction_area = ''

      let property_area = ''

      let bedrooms = ''

      let bathrooms = ''

      let parking = ''

      let year_built = ''

      let description = ''

      let whatsapp = ''

      let images = []

console.log(detailResponse.data)

      description =
        detail$('.d3-property-about__text')
          .text()
          .replace(/\s+/g, ' ')
          .trim()

      raw_property_type =
        detail$('.breadcrumb li')
          .last()
          .text()
          .replace(/\s+/g, ' ')
          .trim()

      detail$('.d3-property-insight__attribute')
        .each((index, detail) => {

          const attrTitle =
            detail$(detail)
              .find('.d3-property-insight__attribute-title')
              .text()
              .replace(/\s+/g, ' ')
              .trim()

          const attrValue =
            detail$(detail)
              .find('.d3-property-insight__attribute-value')
              .text()
              .replace(/\s+/g, ' ')
              .trim()

          if (
            attrTitle.includes('Bedrooms')
          ) {

            bedrooms = attrValue

          }

          if (
            attrTitle.includes('Bathrooms')
          ) {

            bathrooms = attrValue

          }

          if (
            attrTitle.includes('Parking')
          ) {

            parking = attrValue

          }

          if (
            attrTitle.includes('M² of construction')
          ) {

            construction_area = attrValue

          }

        })

      detail$('.d3-property-details__detail-label')
        .each((i, el) => {

          const label =
            detail$(el)
              .clone()
              .children()
              .remove()
              .end()
              .text()
              .replace(/\s+/g, ' ')
              .trim()

          const value =
            detail$(el)
              .find('.d3-property-details__detail')
              .text()
              .replace(/\s+/g, ' ')
              .trim()

          if (
            label.includes('Lot Size')
          ) {

            property_area = value

          }

          if (
            label.includes('Year of construction')
          ) {

            year_built = value

          }

        })

      detail$('.d3-gallery__preview-photo')
        .each((i, img) => {

          const src =
            detail$(img)
              .attr('data-src')

          if (
            src &&
            !images.includes(src)
          ) {

            images.push(src)

          }

        })

      detail$('.slick-slide img')
        .each((i, img) => {

          const src =
            detail$(img)
              .attr('src')

          if (
            src &&
            !images.includes(src)
          ) {

            images.push(src)

          }

        })

      try {

        const browser =
          await puppeteer.launch({

            headless: true

          })

        const page =
          await browser.newPage()

        await page.setUserAgent(
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        )

        await page.goto(
          listingUrl,
          {
            waitUntil: 'networkidle2'
          }
        )

        const whatsappLink =
          await page.evaluate(() => {

            const links =
              Array.from(
                document.querySelectorAll('a')
              )

            const whatsappAnchor =
              links.find(link =>
                link.href.includes(
                  'api.whatsapp.com'
                )
              )

            return whatsappAnchor
              ? whatsappAnchor.href
              : ''

          })

        const whatsappNumber =
          whatsappLink.match(/\d+/)?.[0] || ''

        whatsapp =
          whatsappNumber

        await browser.close()

      } catch (err) {

        console.error(
          'WHATSAPP ERROR:',
          err.message
        )

      }

      listings.push({

              province,

              canton,

              district,

              property_type,

              property_area,

              utility: '',

              environment: '',

              accessibility: '',

              terrain: '',

              legal_status: '',

              price_millions:
                Math.round(
                  (
                    parseInt(
                      price.replace(/[^\d]/g, '')
                    ) || 0
                  ) / 1000000
                ),

              whatsapp,

              images: images.join('|'),

              title,

              description,

              bedrooms,

              bathrooms,

              parking,

              year_built_range:
                year_built,

              construction_area

            })

    }

    console.log(
      JSON.stringify(listings, null, 2)
    )

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

          'whatsapp',
          'images',

          'title',
          'description',

          'bedrooms',
          'bathrooms',
          'parking',

          'year_built_range',

          'construction_area'

        ]

    const csvRows = []

    csvRows.push(
      headers.join(',')
    )

    for (const listing of listings) {

      const values =
        headers.map(header => {

          const escaped =
            String(
              listing[header] || ''
            )
              .replace(/"/g, '""')

          return `"${escaped}"`

        })

      csvRows.push(
        values.join(',')
      )

    }

    const csv =
      csvRows.join('\n')

        const fileName =
          `${regionSlug}.csv`

        fs.writeFileSync(
          fileName,
          csv
        )

        console.log(
          `CSV CREATED: ${fileName}`
        )

  } catch (error) {

    console.error(
      'SCRAPER ERROR:',
      error.message
    )

  }

}

scrapeEncuentra24Sale()

/*

npm run build
cd scripts/scrapers
node encuentra24-sale.js "slug"

*/