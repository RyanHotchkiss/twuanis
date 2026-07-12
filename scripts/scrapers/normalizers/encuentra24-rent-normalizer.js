const fs = require('fs')
const path = require('path')
const Papa = require('papaparse')

function clean(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function csvEscape(value) {
  return `"${String(value || '').replace(/"/g, '""')}"`
}

function splitImages(value) {
  return String(value || '')
    .split('|')
    .map(clean)
    .filter(Boolean)
}

function joinMulti(values) {
  return [...new Set(values.filter(Boolean))].join('|')
}

function parseNumber(value) {
  const number =
    Number(
      String(value || '')
        .replace(/,/g, '')
        .replace(/[^\d.]/g, '')
    )

  if (!number || Number.isNaN(number)) return null

  return number
}

function parsePriceMillions(value) {
  const price =
    parseNumber(value)

  if (!price) return ''

  return Math.round(price / 1000000)
}

function normalizeAreaValue(value) {
  const text = normalizeText(value)

  let number = parseNumber(value)

  if (!number) return ''

  if (
    text.includes('hectarea') ||
    text.includes('ha')
  ) {
    number = number * 10000
  }

  return number
}

function areaBucket(value, type) {
  const text =
    normalizeText(value)

  let number =
    parseNumber(value)

  if (!number) return ''

  if (
    text.includes('hectarea') ||
    text.includes('ha')
  ) {
    number = number * 10000
  }

  if (type === 'construction') {
    if (number < 50) return '<50m²'
    if (number < 100) return '50–100m²'
    if (number < 200) return '100–200m²'
    if (number < 400) return '200–400m²'
    if (number < 800) return '400–800m²'
    return '800m²+'
  }

  if (number < 100) return '<100m²'
  if (number < 500) return '100–500m²'
  if (number < 1000) return '500–1,000m²'
  if (number < 5000) return '1,000–5,000m²'
  if (number < 10000) return '5,000m²–1 Hectare'
  if (number < 50000) return '1–5 Hectares'
  return '>5 Hectares'
}

function normalizeBedrooms(value) {
  const text =
    normalizeText(value)

  if (
    text.includes('studio') ||
    text.includes('estudio')
  ) {
    return 'Studio'
  }

  const n =
    parseInt(
      String(value || '').replace(/[^\d]/g, ''),
      10
    )

  if (!n) return ''
  if (n >= 5) return '5+ Bedrooms'
  if (n === 1) return '1 Bedroom'
  return `${n} Bedrooms`
}

function normalizeBathrooms(value) {
  const n =
    Math.ceil(
      parseFloat(
        String(value || '')
          .replace(',', '.')
          .replace(/[^\d.]/g, '')
      )
    )

  if (!n) return ''
  if (n >= 5) return '5+ Bathrooms'
  if (n === 1) return '1 Bathroom'
  return `${n} Bathrooms`
}

function normalizeParking(value) {
  const text =
    normalizeText(value)

  if (
    text.includes('no parking') ||
    text.includes('sin parqueo') ||
    text.includes('sin estacionamiento')
  ) {
    return 'No Parking'
  }

  const n =
    parseInt(
      String(value || '').replace(/[^\d]/g, ''),
      10
    )

  if (!n) return ''
  if (n >= 4) return '4+ Vehicles'
  if (n === 1) return '1 Vehicle'
  return `${n} Vehicles`
}

function normalizeYearBuilt(value) {
  const year =
    parseInt(
      String(value || '').replace(/[^\d]/g, ''),
      10
    )

  if (!year) return ''
  if (year < 1980) return 'Pre-1980'
  if (year < 1990) return '1980s'
  if (year < 2000) return '1990s'
  if (year < 2010) return '2000s'
  if (year < 2020) return '2010s'
  return '2020+'
}

function inferPropertyType(row) {
  const text =
    normalizeText(
      [
        row.raw_property_type,
        row.title,
        row.description,
        row.source_url
      ].join(' ')
    )

  if (
    text.includes('apartamento') ||
    text.includes('apartment') ||
    text.includes('condo') ||
    text.includes('condominio')
  ) {
    return 'Condo'
  }

  if (
    text.includes('casa') ||
    text.includes('house') ||
    text.includes('home')
  ) {
    return 'House'
  }

  if (
    text.includes('lote') ||
    text.includes('terreno') ||
    text.includes('land')
  ) {
    return 'Land'
  }

  if (
    text.includes('finca') ||
    text.includes('farm') ||
    text.includes('quinta')
  ) {
    return 'Farm'
  }

  if (
    text.includes('cabana') ||
    text.includes('cabina') ||
    text.includes('cabin')
  ) {
    return 'Cabin'
  }

  if (
    text.includes('comercial') ||
    text.includes('commercial') ||
    text.includes('oficina') ||
    text.includes('office') ||
    text.includes('bodega') ||
    text.includes('warehouse') ||
    text.includes('local')
  ) {
    return 'Commercial Property'
  }

  return ''
}

function inferUtilities(row) {
  const text =
    normalizeText(
      [
        row.title,
        row.description,
        row.raw_insight_attributes,
        row.raw_detail_attributes
      ].join(' ')
    )

  const utilities = []

  if (
    text.includes('agua municipal') ||
    text.includes('municipal water') ||
    text.includes('aya')
  ) {
    utilities.push('Municipal Water')
  }

  if (
    text.includes('pozo') ||
    text.includes('well water') ||
    text.includes('well')
  ) {
    utilities.push('Well Water')
  }

  if (
    text.includes('agua') ||
    text.includes('water')
  ) {
    utilities.push('Water')
  }

  if (
    text.includes('electricidad') ||
    text.includes('luz') ||
    text.includes('electricity')
  ) {
    utilities.push('Electricity')
  }

  if (
    text.includes('fibra optica') ||
    text.includes('fibra') ||
    text.includes('fiber internet') ||
    text.includes('fiber optic')
  ) {
    utilities.push('Fiber Internet')
  }

  if (
    text.includes('senal celular') ||
    text.includes('señal celular') ||
    text.includes('cell signal') ||
    text.includes('celular')
  ) {
    utilities.push('Cell Signal')
  }

  if (
    text.includes('septico') ||
    text.includes('septic')
  ) {
    utilities.push('Septic')
  }

  if (
    text.includes('alcantarillado') ||
    text.includes('sewer')
  ) {
    utilities.push('Sewer')
  }

  if (
    text.includes('solar') ||
    text.includes('paneles solares') ||
    text.includes('solar power')
  ) {
    utilities.push('Solar Power')
  }

  return joinMulti(utilities)
}

function inferEnvironment(row) {
  const text =
    normalizeText(
      [
        row.title,
        row.description,
        row.raw_insight_attributes,
        row.raw_detail_attributes,
        row.source_url
      ].join(' ')
    )

  const environments = []

  if (
    text.includes('frente al mar') ||
    text.includes('frente a la playa') ||
    text.includes('beachfront') ||
    text.includes('playa')
  ) {
    environments.push('Beachfront')
  }

  if (
    text.includes('frente al rio') ||
    text.includes('riverfront') ||
    text.includes('rio ')
  ) {
    environments.push('Riverfront')
  }

  if (
    text.includes('frente al lago') ||
    text.includes('lakefront') ||
    text.includes('lago')
  ) {
    environments.push('Lakefront')
  }

  if (
    text.includes('vista a la montana') ||
    text.includes('vista a las montanas') ||
    text.includes('mountain view') ||
    text.includes('mountain views')
  ) {
    environments.push('Mountain View')
  }

  if (
    text.includes('selva') ||
    text.includes('jungle')
  ) {
    environments.push('Jungle')
  }

  if (
    text.includes('rural') ||
    text.includes('campo')
  ) {
    environments.push('Rural')
  }

  if (
    text.includes('urbano') ||
    text.includes('ciudad') ||
    text.includes('centro') ||
    text.includes('downtown')
  ) {
    environments.push('Urban')
  }

  return joinMulti(environments)
}

function inferTerrain(row) {
  const text = normalizeText(
    [
      row.title,
      row.description,
      row.raw_insight_attributes,
      row.raw_detail_attributes
    ].join(' ')
  )

  const terrain = []

  if (text.includes('plano')) terrain.push('Flat')
  if (text.includes('mayormente plano')) terrain.push('Mostly Flat')
  if (text.includes('ondulado')) terrain.push('Rolling Hills')
  if (text.includes('pendiente')) terrain.push('Steep Slope')
  if (text.includes('montaños')) terrain.push('Mountainous')
  if (text.includes('rocos')) terrain.push('Rocky')
  if (text.includes('bosque')) terrain.push('Forested')
  if (text.includes('valle')) terrain.push('River Valley')
  if (text.includes('desmontado')) terrain.push('Cleared Land')
  if (text.includes('selva')) terrain.push('Jungle Terrain')
  if (text.includes('listo para construir')) terrain.push('Build Ready')
  if (text.includes('agric')) terrain.push('Agricultural Terrain')

  return joinMulti(terrain)
}

function inferAccessibility(row) {
  const text = normalizeText(
    [
      row.title,
      row.description,
      row.raw_insight_attributes,
      row.raw_detail_attributes
    ].join(' ')
  )

  const access = []

  if (
    text.includes('calle asfaltada') ||
    text.includes('paved road')
  ) {
    access.push('Paved Road')
  }

  if (
    text.includes('4x4') ||
    text.includes('todo terreno')
  ) {
    access.push('4x4 Required')
  }

  if (
    text.includes('2wd') ||
    text.includes('automovil')
  ) {
    access.push('2WD Accessible')
  }

  if (
    text.includes('caminando') ||
    text.includes('walk')
  ) {
    access.push('Walkable')
  }

  if (
    text.includes('solo bote') ||
    text.includes('boat')
  ) {
    access.push('Boat Access Only')
  }

  return joinMulti(access)
}

function inferLegalStatus(row) {
  const text = normalizeText(
    [
      row.title,
      row.description,
      row.raw_insight_attributes,
      row.raw_detail_attributes
    ].join(' ')
  )

  const legal = []

  if (
    text.includes('titulado') ||
    text.includes('titled')
  ) {
    legal.push('Titled Property')
  }

  if (
    text.includes('plano catastrado') ||
    text.includes('survey')
  ) {
    legal.push('Survey Available')
  }

  if (
    text.includes('concesion') ||
    text.includes('concession')
  ) {
    legal.push('Concession Property')
  }

  if (
    text.includes('financiamiento') ||
    text.includes('financing')
  ) {
    legal.push('Financing Available')
  }

  return joinMulti(legal)
}

function toPostgresArray(value) {
  const items = String(value || '')
    .split('|')
    .map(clean)
    .filter(Boolean)

  if (!items.length) return '{}'

  return `{${items.map(item => `"${item.replace(/"/g, '\\"')}"`).join(',')}}`
}

function cleanDescription(value) {
  return clean(
    String(value || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '')
  )
}

function normalizeRow(row) {
  return {
    source_name: row.source_name,
    source_listing_id: row.source_listing_id,
    source_url: row.source_url,

    transaction_type: row.transaction_type,
    listing_status: row.listing_status,

    province: clean(row.province),
    canton: clean(row.canton),
    district: clean(row.district),

    title: clean(row.title),
    description: cleanDescription(row.description),

    property_type: inferPropertyType(row),

    bedrooms: normalizeBedrooms(row.raw_bedrooms),
    bathrooms: normalizeBathrooms(row.raw_bathrooms),
    parking: normalizeParking(row.raw_parking),

    year_built_range: normalizeYearBuilt(row.raw_year_built),

    construction_area:
      normalizeAreaValue(row.raw_construction_area),

    property_area:
      normalizeAreaValue(
        row.raw_property_area ||
        row.raw_construction_area
      ),

    utility: toPostgresArray(inferUtilities(row)),
    environment: inferEnvironment(row),
    terrain: toPostgresArray(inferTerrain(row)),
    accessibility: inferAccessibility(row),
    legal_status: inferLegalStatus(row),

    current_price: '',
        monthly_price: row.monthly_price
        ? Math.round(Number(row.monthly_price))
        : '',
        currency: row.currency,

    whatsapp: row.whatsapp,

    images: splitImages(row.images).join('|')
  }
}

const inputFile = process.argv[2]

if (!inputFile) {
  console.error(
    'Usage: node encuentra24-rent-normalizer.js raw.csv'
  )
  process.exit(1)
}

const csv =
  fs.readFileSync(
    inputFile,
    'utf8'
  )

const parsed =
  Papa.parse(csv, {
    header: true,
    skipEmptyLines: true
  })

const normalized =
  parsed.data.map(normalizeRow)

const output =
  Papa.unparse(normalized)

const outputFile =
  inputFile.replace(
    '-raw.csv',
    '-normalized.csv'
  )

fs.writeFileSync(
  outputFile,
  output
)

console.log(
  `Normalized ${normalized.length} listings`
)

console.log(
  `Output: ${outputFile}`
)