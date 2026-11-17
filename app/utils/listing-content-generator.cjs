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
      const values = value =>
        (Array.isArray(value) ? value : value ? [value] : [])
          .map(item => String(item).trim())
          .filter(Boolean)

      const location = [
        propertyData.district,
        propertyData.canton,
        propertyData.province
      ]
        .filter(Boolean)
        .filter((value, index, all) =>
          all.findIndex(item =>
            item.toLowerCase() === value.toLowerCase()
          ) === index
        )
        .join(', ')

      const type = spanishAttribute(propertyData.property_type || 'propiedad')
      if (location) {
        sentences.push(
          `${type.charAt(0).toUpperCase() + type.slice(1)} ubicada en ${location}.`
        )
      }

      const propertyArea = propertyData.property_area
      const constructionArea = propertyData.construction_area

      if (propertyArea && constructionArea) {
        sentences.push(
          `El terreno tiene una superficie de ${propertyArea} m² y la construcción de ${constructionArea} m².`
        )
      } else {
        if (propertyArea) sentences.push(`La superficie del terreno es de ${propertyArea} m².`)
        if (constructionArea) sentences.push(`El área de construcción es de ${constructionArea} m².`)
      }

      const features = []
      if (propertyData.bedrooms) features.push(`${propertyData.bedrooms} habitaciones`)
      if (propertyData.bathrooms) features.push(`${propertyData.bathrooms} baños`)
      if (propertyData.parking) features.push(`${propertyData.parking} espacios de estacionamiento`)
      if (features.length) sentences.push(`La propiedad cuenta con ${features.join(', ')}.`)

      const sections = [
        ['environment', 'Entorno'],
        ['utility', 'Servicios disponibles'],
        ['terrain', 'Características del terreno'],
        ['accessibility', 'Accesibilidad'],
        ['legal_status', 'Condición legal registrada']
      ]

      for (const [key, heading] of sections) {
        const items = values(propertyData[key])
        if (items.length) sentences.push(`${heading}: ${items.join(', ')}.`)
      }

      if (propertyData.year_built_range) {
        sentences.push(`Período de construcción registrado: ${propertyData.year_built_range}.`)
      }

      if (propertyData.year_built) {
        sentences.push(`Año de construcción registrado: ${propertyData.year_built}.`)
      }

      return sentences.join(' ')
    }
    const sentences = []

  const values = value =>
    (Array.isArray(value) ? value : value ? [value] : [])
      .map(item => String(item).trim())
      .filter(Boolean)

  const location = [
    propertyData.district,
    propertyData.canton,
    propertyData.province
  ]
    .filter(Boolean)
    .filter((value, index, all) =>
      all.findIndex(item =>
        item.toLowerCase() === value.toLowerCase()
      ) === index
    )
    .join(', ')

  const type = String(propertyData.property_type || 'property').trim()

  if (location) {
    sentences.push(
      `${type.charAt(0).toUpperCase() + type.slice(1)} located in ${location}.`
    )
  }

  const propertyArea = propertyData.property_area
  const constructionArea = propertyData.construction_area

  if (propertyArea && constructionArea) {
    sentences.push(
      `The property has ${propertyArea} m² of land and ${constructionArea} m² of construction.`
    )
  } else {
    if (propertyArea) sentences.push(`The land area is ${propertyArea} m².`)
    if (constructionArea) sentences.push(`The construction area is ${constructionArea} m².`)
  }

  const features = []

  if (propertyData.bedrooms) features.push(`${propertyData.bedrooms} bedrooms`)
  if (propertyData.bathrooms) features.push(`${propertyData.bathrooms} bathrooms`)
  if (propertyData.parking) features.push(`${propertyData.parking} parking spaces`)

  if (features.length) {
    sentences.push(`The property includes ${features.join(', ')}.`)
  }

  const sections = [
        ['environment', 'Environment'],
        ['utility', 'Available utilities'],
        ['terrain', 'Terrain characteristics'],
        ['accessibility', 'Accessibility'],
        ['legal_status', 'Recorded legal status']
      ]

      for (const [key, heading] of sections) {
        const items = values(propertyData[key])
        if (items.length) sentences.push(`${heading}: ${items.join(', ')}.`)
      }

      if (propertyData.year_built_range) {
        sentences.push(`Recorded construction period: ${propertyData.year_built_range}.`)
      }

      if (propertyData.year_built) {
        sentences.push(`Recorded construction year: ${propertyData.year_built}.`)
      }

      return sentences.join(' ')
}

module.exports = { generateListingTitle, generateListingDescription }
