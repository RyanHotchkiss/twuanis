'use strict'

// One shared, deterministic presentation generator.  Customer forms and
// source-managed ingestion both call this module; it intentionally accepts
// only already-verified canonical property attributes.
const spanishTerms = {
  house: 'casa', condo: 'condominio', condominium: 'condominio', land: 'terreno',
  farm: 'finca', cabin: 'cabaña', 'commercial property': 'propiedad comercial',
  apartment: 'apartamento', residential: 'residencial', urban: 'urbano', rural: 'rural',
  suburban: 'suburbano', coastal: 'costero', mountain: 'montañoso',
}

function spanishAttribute(value) {
  const text = String(value ?? '')
  return spanishTerms[text.toLowerCase()] || text
    .replace(/(\d+) bedrooms?/gi, (_, count) => `${count} ${count === '1' ? 'habitación' : 'habitaciones'}`)
    .replace(/(\d+) bathrooms?/gi, (_, count) => `${count} ${count === '1' ? 'baño' : 'baños'}`)
    .replace(/parking spaces?/gi, 'espacios de estacionamiento')
}

function generateListingTitle(propertyData, language = 'en') {
  const propertyType = String(propertyData.property_type ?? '').trim()
  const district = String(propertyData.district ?? '').trim()
  const canton = String(propertyData.canton ?? '').trim()
  const province = String(propertyData.province ?? '').trim()

  const location = [district, canton, province]
    .filter(Boolean)
    .filter((value, index, values) =>
      values.findIndex(item => item.toLowerCase() === value.toLowerCase()) === index
    )
    .join(', ')

  const type = language === 'es'
    ? spanishAttribute(propertyType)
    : propertyType

  if (language === 'es') {
    return [type, location ? `en ${location}` : '']
      .filter(Boolean)
      .join(' ')
      .replace(/^./, char => char.toUpperCase())
  }

  return [type, location ? `in ${location}` : '']
    .filter(Boolean)
    .join(' ')
    .replace(/^./, char => char.toUpperCase())
}

function generateListingDescription(propertyData, language = 'en') {
  if (language === 'es') {
    const sentences = []
    const location = propertyData.district || propertyData.canton || propertyData.province
    if (propertyData.environment && propertyData.property_type && location) sentences.push(`La propiedad de tipo ${spanishAttribute(propertyData.property_type).toLowerCase()}, en un entorno ${spanishAttribute(propertyData.environment).toLowerCase()}, se ubica en ${location}.`)
    if (propertyData.property_area) sentences.push(`El área del terreno es de ${propertyData.property_area} m².`)
    for (const key of ['bedrooms', 'bathrooms']) if (propertyData[key]) { const value = String(propertyData[key]); const count = /^\d+$/.test(value) ? `${value} ${key === 'bedrooms' ? (value === '1' ? 'habitación' : 'habitaciones') : (value === '1' ? 'baño' : 'baños')}` : spanishAttribute(value).toLowerCase(); sentences.push(`La propiedad incluye ${count}.`) }
    if (propertyData.parking) sentences.push(`Capacidad de estacionamiento: ${spanishAttribute(propertyData.parking).toLowerCase()}.`)
    if (propertyData.year_built_range) sentences.push(`La construcción data del período ${propertyData.year_built_range}.`)
    if (propertyData.construction_area) sentences.push(`El área de construcción es de ${propertyData.construction_area} m².`)
    if (propertyData.utility?.length) sentences.push(`Servicios disponibles: ${propertyData.utility.map(spanishAttribute).join(', ')}.`)
    if (propertyData.terrain?.length) sentences.push(`Características del terreno: ${propertyData.terrain.map(spanishAttribute).join(', ').toLowerCase()}.`)
    if (propertyData.legal_status) sentences.push(`La condición legal registrada es ${spanishAttribute(propertyData.legal_status).toLowerCase()}.`)
    return sentences.join(' ')
  }
  const sentences = []
  if (propertyData.environment && propertyData.property_type) sentences.push(`This ${propertyData.environment.toLowerCase()} ${propertyData.property_type.toLowerCase()} is located in ${propertyData.district || propertyData.canton || propertyData.province}.`)
  if (propertyData.property_area) sentences.push(`The property area is ${propertyData.property_area} m².`)
  if (propertyData.bedrooms) sentences.push(`The property includes ${String(propertyData.bedrooms).toLowerCase()}.`)
  if (propertyData.bathrooms) sentences.push(`The property includes ${String(propertyData.bathrooms).toLowerCase()}.`)
  if (propertyData.parking) sentences.push(`Parking capacity supports ${String(propertyData.parking).toLowerCase()}.`)
  if (propertyData.year_built_range) sentences.push(`The structure dates to the ${propertyData.year_built_range}.`)
  if (propertyData.construction_area) sentences.push(`The construction area is ${propertyData.construction_area} m².`)
  if (propertyData.utility?.length) sentences.push(`Available utilities include ${propertyData.utility.join(', ')}.`)
  if (propertyData.terrain?.length) sentences.push(`Terrain conditions are classified as ${propertyData.terrain.join(', ').toLowerCase()}.`)
  if (propertyData.legal_status) sentences.push(`Legal status is currently listed as ${propertyData.legal_status.toLowerCase()}.`)
  return sentences.join(' ')
}

module.exports = { generateListingTitle, generateListingDescription }
