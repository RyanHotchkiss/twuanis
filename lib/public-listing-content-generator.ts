type Language = 'en' | 'es'

type PropertyData = {
  property_type?: string
  transaction_type?: string | null
  province?: string
  canton?: string
  district?: string
  property_area?: string | number
  construction_area?: string | number
  bedrooms?: string
  bathrooms?: string
  parking?: string
  year_built?: string
  utility?: string[]
  environment?: string[]
  terrain?: string[]
  accessibility?: string[]
  legal_status?: string[]
  asking_price?: number
  currency?: 'USD' | 'CRC'
}

const propertyTypes: Record<string, [string, string]> = {
  house: ['House', 'Casa'],
  casa: ['House', 'Casa'],
  condo: ['Condo', 'Condominio'],
  condominium: ['Condo', 'Condominio'],
  condominio: ['Condo', 'Condominio'],
  apartment: ['Apartment', 'Apartamento'],
  apartamento: ['Apartment', 'Apartamento'],
  land: ['Land', 'Terreno'],
  terreno: ['Land', 'Terreno'],
  farm: ['Farm', 'Finca'],
  finca: ['Farm', 'Finca'],
  cabin: ['Cabin', 'Cabaña'],
  cabaña: ['Cabin', 'Cabaña'],
  'commercial property': [
    'Commercial Property',
    'Propiedad comercial'
  ],
  'propiedad comercial': [
    'Commercial Property',
    'Propiedad comercial'
  ]
}

function positiveNumber(value: unknown): number | null {
  if (
    typeof value !== 'number' &&
    typeof value !== 'string'
  ) return null

  if (String(value).trim() === '') return null

  const number = Number(value)

  return Number.isFinite(number) && number > 0
    ? number
    : null
}

function formatNumber(
  value: number,
  language: Language
): string {
  return new Intl.NumberFormat(
    'en-US',
    {
      maximumFractionDigits: 20
    }
  ).format(value)
}

function locationOf(data: PropertyData): string {
  const locations = [
    data.district,
    data.canton,
    data.province
  ]
    .map(value => String(value ?? '').trim())
    .filter(Boolean)

  return locations
    .filter((value, index, all) =>
      all.findIndex(item =>
        item.toLowerCase() === value.toLowerCase()
      ) === index
    )
    .join(', ')
}

function typeOf(
  data: PropertyData,
  language: Language
): string {
  const raw = String(data.property_type ?? '').trim()

  const translated = propertyTypes[raw.toLowerCase()]

  return translated
    ? translated[language === 'es' ? 1 : 0]
    : raw || (language === 'es' ? 'Propiedad' : 'Property')
}

function transactionOf(
  data: PropertyData,
  language: Language
): string {
  if (data.transaction_type === 'sale') {
    return language === 'es' ? 'en venta' : 'for Sale'
  }

  if (data.transaction_type === 'rent') {
    return language === 'es' ? 'en alquiler' : 'for Rent'
  }

  return ''
}

function priceOf(
  data: PropertyData,
  language: Language
): string | null {
  const amount = positiveNumber(data.asking_price)

  if (
    amount === null ||
    (data.currency !== 'USD' && data.currency !== 'CRC')
  ) return null

  const symbol = data.currency === 'USD' ? '$' : '₡'

  return `${symbol}${formatNumber(amount, language)}`
}

export function generatePublicListingTitle(
  data: PropertyData,
  language: Language
): string {
  const type = typeOf(data, language)
  const location = locationOf(data)
  const transaction = transactionOf(data, language)

  const normalizedType = typeOf(data, 'en').toLowerCase()

  const landOnly = normalizedType === 'land'
  const farm = normalizedType === 'farm'

  const residential = [
    'house',
    'condo',
    'apartment',
    'cabin'
  ].includes(normalizedType)

  const bedrooms = positiveNumber(data.bedrooms)

  const area = positiveNumber(
    landOnly || farm
      ? data.property_area
      : data.construction_area
  )

  const areaText = area === null
    ? ''
    : `${formatNumber(area, language)} m²`

  if (language === 'es') {
    return [
      type,
      residential && bedrooms !== null
        ? `de ${formatNumber(bedrooms, language)} ${
            bedrooms === 1 ? 'habitación' : 'habitaciones'
          }`
        : '',
      areaText
        ? residential && bedrooms !== null
          ? `con ${areaText} de construcción`
          : `de ${areaText}`
        : '',
      transaction,
      location ? `en ${location}` : ''
    ].filter(Boolean).join(' ')
  }

  return [
    residential && bedrooms !== null
      ? `${formatNumber(bedrooms, language)}-Bedroom`
      : '',
    areaText,
    type,
    transaction,
    location ? `in ${location}` : ''
  ].filter(Boolean).join(' ')
}

export function generatePublicListingDescription(
  data: PropertyData,
  language: Language
): string {
  const sentences: string[] = []

  const type = typeOf(data, language)
  const location = locationOf(data)
  const transaction = transactionOf(data, language)
  const propertyArea = positiveNumber(data.property_area)
  const constructionArea = positiveNumber(
    data.construction_area
  )

  const bedrooms = positiveNumber(data.bedrooms)
  const bathrooms = positiveNumber(data.bathrooms)
  const parking = positiveNumber(data.parking)

  const price = priceOf(data, language)

  const number = (value: number) =>
    formatNumber(value, language)

  const spanish = language === 'es'

  const introduction = [
    type,
    spanish ? transaction : transaction.toLowerCase(),
    location
      ? `${spanish ? 'en' : 'in'} ${location}, Costa Rica`
      : ''
  ].filter(Boolean).join(' ')

  sentences.push(`${introduction}.`)

  if (
    propertyArea !== null &&
    constructionArea !== null
  ) {
    sentences.push(
      spanish
        ? `La propiedad cuenta con ${number(propertyArea)} m² de terreno y ${number(constructionArea)} m² de construcción.`
        : `The property includes ${number(propertyArea)} m² of land and ${number(constructionArea)} m² of construction.`
    )
  } else {
    if (propertyArea !== null) {
      sentences.push(
        spanish
          ? `La superficie del terreno es de ${number(propertyArea)} m².`
          : `The property has a land area of ${number(propertyArea)} m².`
      )
    }

    if (constructionArea !== null) {
      sentences.push(
        spanish
          ? `El área de construcción es de ${number(constructionArea)} m².`
          : `The construction area is ${number(constructionArea)} m².`
      )
    }
  }

  const features: string[] = []

  if (bedrooms !== null) {
    features.push(
      `${number(bedrooms)} ${
        spanish
          ? bedrooms === 1 ? 'habitación' : 'habitaciones'
          : bedrooms === 1 ? 'bedroom' : 'bedrooms'
      }`
    )
  }

  if (bathrooms !== null) {
    features.push(
      `${number(bathrooms)} ${
        spanish
          ? bathrooms === 1 ? 'baño' : 'baños'
          : bathrooms === 1 ? 'bathroom' : 'bathrooms'
      }`
    )
  }

  if (parking !== null) {
    features.push(
      `${number(parking)} ${
        spanish
          ? parking === 1
            ? 'espacio de estacionamiento'
            : 'espacios de estacionamiento'
          : parking === 1
            ? 'parking space'
            : 'parking spaces'
      }`
    )
  }

  if (features.length) {
    const featureText = new Intl.ListFormat(
      spanish ? 'es' : 'en',
      { style: 'long', type: 'conjunction' }
    ).format(features)

    sentences.push(
      spanish
        ? `La propiedad dispone de ${featureText}.`
        : `The property features ${featureText}.`
    )
  }

  const year = positiveNumber(data.year_built)

  if (year !== null && Number.isInteger(year)) {
    sentences.push(
      spanish
        ? `Año de construcción registrado: ${year}.`
        : `Recorded construction year: ${year}.`
    )
  }

  const sections: [
    string[] | undefined,
    string,
    string
  ][] = [
    [data.environment, 'Environment', 'Entorno'],
    [data.utility, 'Available utilities', 'Servicios disponibles'],
    [data.terrain, 'Terrain characteristics', 'Características del terreno'],
    [data.accessibility, 'Accessibility', 'Accesibilidad'],
    [data.legal_status, 'Recorded legal status', 'Condición legal registrada']
  ]

  for (const [values, english, spanishLabel] of sections) {
    const items = (values ?? [])
      .map(value => value.trim())
      .filter(Boolean)

    if (items.length) {
      sentences.push(
        `${spanish ? spanishLabel : english}: ${items.join(', ')}.`
      )
    }
  }

  if (price && data.transaction_type === 'sale') {
    sentences.push(
      spanish
        ? `El precio de venta anunciado es de ${price}.`
        : `The advertised asking price is ${price}.`
    )
  }

  if (price && data.transaction_type === 'rent') {
    sentences.push(
      spanish
        ? `El alquiler mensual anunciado es de ${price}.`
        : `The advertised monthly rent is ${price}.`
    )
  }

  return sentences.join(' ')
}