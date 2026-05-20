const csv = require('csvtojson')
const fs = require('fs')

async function convert() {

  const json =
    await csv().fromFile(
      './data/encuentra24-sale-listings.csv'
    )

  fs.writeFileSync(
    './data/encuentra24-sale-listings.json',
    JSON.stringify(json, null, 2)
  )

  console.log('CSV converted to JSON')

}

convert()