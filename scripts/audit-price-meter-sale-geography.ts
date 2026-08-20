import dotenv from 'dotenv'

dotenv.config({
  path: '.env.local'
})

function printDistribution(
  label: string,
  item: any
) {

  const distribution =
    item.distribution

  console.log(
    `\n${label}`
  )

  console.log(
    '  geography:',
    item.geography
  )

  console.log(
    '  n:',
    distribution.sampleSize
  )

  console.log(
    '  min:',
    distribution.minimum
  )

  console.log(
    '  p25:',
    distribution.p25
  )

  console.log(
    '  median:',
    distribution.median
  )

  console.log(
    '  p75:',
    distribution.p75
  )

  console.log(
    '  max:',
    distribution.maximum
  )

  console.log(
    '  IQR:',
    distribution.iqr
  )
}


function printGeography(
  label: string,
  geography: any
) {

  console.log(
    `\n\n========================================`
  )

  console.log(
    label
  )

  console.log(
    `========================================`
  )


  console.log(
    '\nPROVINCES'
  )

  for (
    const item
    of geography.province
  ) {

    printDistribution(
      item.geography.province,
      item
    )
  }


  console.log(
    '\nCANTONS'
  )

  for (
    const item
    of geography.canton
  ) {

    printDistribution(
      `${item.geography.province} > ${item.geography.canton}`,
      item
    )
  }


  console.log(
    '\nDISTRICTS'
  )

  for (
    const item
    of geography.district
  ) {

    printDistribution(
      `${item.geography.province} > ${item.geography.canton} > ${item.geography.district}`,
      item
    )
  }
}


async function main() {

  const {
        getPriceMeterAnalysis
        } =
        await import(
            '../lib/price-meter-engine'
        )

  const analysis =
    await getPriceMeterAnalysis(
      {
        transaction_type:
          'sale'
      },
      'en'
    )


  const geography =
    analysis
      .saleIntelligence
      .geography


  printGeography(
    'SALE · VACANT LAND · LAND NORMALIZED',
    geography
      .vacantLandLandNormalized
  )


  printGeography(
    'SALE · IMPROVED PROPERTY · LAND NORMALIZED',
    geography
      .improvedLandNormalized
  )


  printGeography(
    'SALE · IMPROVED PROPERTY · CONSTRUCTION NORMALIZED',
    geography
      .improvedConstructionNormalized
  )
}


main()
  .catch(
    error => {

      console.error(
        error
      )

      process.exit(
        1
      )
    }
  )