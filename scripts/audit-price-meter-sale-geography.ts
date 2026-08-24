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

  const relationships =
    analysis
      .saleIntelligence
      .characteristicRelationships

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

    printCharacteristicRelationships(
    'SALE · VACANT LAND · LAND NORMALIZED · CHARACTERISTIC RELATIONSHIPS',
    relationships
      .vacantLandLandNormalized
  )


  printCharacteristicRelationships(
    'SALE · IMPROVED PROPERTY · LAND NORMALIZED · CHARACTERISTIC RELATIONSHIPS',
    relationships
      .improvedLandNormalized
  )


  printCharacteristicRelationships(
    'SALE · IMPROVED PROPERTY · CONSTRUCTION NORMALIZED · CHARACTERISTIC RELATIONSHIPS',
    relationships
      .improvedConstructionNormalized
  )

}

function printCharacteristicRelationships(
  label: string,
  relationships: any[]
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


  if (!relationships.length) {
    console.log(
      '\nNo characteristic relationships.'
    )

    return
  }


  for (
    const relationship
    of relationships
  ) {

    const characteristic =
      relationship.characteristic

    console.log(
      `\n${characteristic.termType} · ${characteristic.termNameEn || characteristic.termName}`
    )

    console.log(
      '  characteristic n:',
      relationship.sampleSize
    )

    console.log(
      '  parent n:',
      relationship.parentSampleSize
    )

    console.log(
      '  characteristic median:',
      relationship.characteristicMedian
    )

    console.log(
      '  parent median:',
      relationship.parentMedian
    )

    console.log(
      '  absolute difference:',
      relationship.absoluteDifference
    )

    console.log(
      '  relative difference %:',
      relationship.relativeDifferencePct
    )

    console.log(
      '  direction:',
      relationship.direction
    )
  }
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