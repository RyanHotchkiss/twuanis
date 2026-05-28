const axios = require('axios')

const cheerio = require('cheerio')

const puppeteer = require('puppeteer')

const fs = require('fs')

async function scrapeEncuentra24Sale() {

  try {

    const regionSlug =
  process.argv[2]

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

      let province = 'San José'

      let construction_area = ''

      let property_area = ''

      let bedrooms = ''

      let bathrooms = ''

      let parking = ''

      let year_built = ''

      let description = ''

      let whatsapp = ''

      let images = []

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

        title,

        transaction_type,

        province,

        property_type,

        raw_property_type,

        price,

        bedrooms,

        bathrooms,

        construction_area,

        parking,

        property_area,

        year_built,

        whatsapp,

        listing_url: listingUrl,

        images: images.join('|'),

        description

      })

    }

    console.log(
      JSON.stringify(listings, null, 2)
    )

    const headers = [

      'title',

      'transaction_type',

      'province',

      'property_type',

      'raw_property_type',

      'price',

      'bedrooms',

      'bathrooms',

      'construction_area',

      'parking',

      'property_area',

      'year_built',

      'whatsapp',

      'listing_url',

      'images',

      'description'

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

    fs.writeFileSync(
      'encuentra24-sale-listings.csv',
      csv
    )

    console.log(
      'CSV CREATED: encuentra24-sale-listings.csv'
    )

  } catch (error) {

    console.error(
      'SCRAPER ERROR:',
      error.message
    )

  }

}

scrapeEncuentra24Sale()