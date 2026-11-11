// Shared intake and marketplace generation. Omitted language preserves historical English output.
const spanishTerms: Record<string, string> = {
  house: 'casa', condo: 'condominio', condominium: 'condominio', land: 'terreno',
  farm: 'finca', cabin: 'cabaña', 'commercial property': 'propiedad comercial',
  apartment: 'apartamento', residential: 'residencial', urban: 'urbano', rural: 'rural',
  suburban: 'suburbano', coastal: 'costero', mountain: 'montañoso',
}
function spanishAttribute(value: unknown): string {
  const text = String(value ?? '')
  return spanishTerms[text.toLowerCase()] || text.replace(/(\d+) bedrooms?/gi, (_, count) => `${count} ${count === '1' ? 'habitación' : 'habitaciones'}`).replace(/(\d+) bathrooms?/gi, (_, count) => `${count} ${count === '1' ? 'baño' : 'baños'}`).replace(/parking spaces?/gi, 'espacios de estacionamiento')
}
 export function generateListingTitle(propertyData: any, language: 'en' | 'es' = 'en') {

                    if (language === 'es') {
                      const title = [propertyData.property_type && spanishAttribute(propertyData.property_type),
                        propertyData.environment && `en un entorno ${spanishAttribute(propertyData.environment).toLowerCase()}`,
                        propertyData.district && `en ${propertyData.district}`, propertyData.canton].filter(Boolean).join(' ')
                      return title.charAt(0).toUpperCase() + title.slice(1)
                    }
                    const titleParts = []

                    if (propertyData.environment) {
                        titleParts.push(propertyData.environment)
                    }

                    if (
                        propertyData.property_type &&
                        propertyData.property_type
                    ) {
                        titleParts.push(propertyData.property_type)
                    }

                    if (propertyData.district) {
                        titleParts.push(`in ${propertyData.district}`)
                    }

                    if (propertyData.canton) {
                        titleParts.push(propertyData.canton)
                    }

                    return titleParts.join(' ')
                    }

                    export function generateListingDescription(propertyData: any, language: 'en' | 'es' = 'en') {

                    if (language === 'es') {
                      const sentences: string[] = []
                      const location = propertyData.district || propertyData.canton || propertyData.province
                      if (propertyData.environment && propertyData.property_type && location)
                        sentences.push(`La propiedad de tipo ${spanishAttribute(propertyData.property_type).toLowerCase()}, en un entorno ${spanishAttribute(propertyData.environment).toLowerCase()}, se ubica en ${location}.`)
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

                    if (
                        propertyData.environment &&
                        propertyData.property_type
                    ) {

                        sentences.push(
                        `This ${propertyData.environment.toLowerCase()} ${propertyData.property_type.toLowerCase()} is located in ${propertyData.district || propertyData.canton || propertyData.province}.`
                        )

                    }

                    if (propertyData.property_area) {

                        sentences.push(
                        `The property area is ${propertyData.property_area} m².`
                        )

                    }

                    
                        if (propertyData.bedrooms) {

                        sentences.push(
                            `The property includes ${propertyData.bedrooms.toLowerCase()}.`
                        )

                        }

                        if (propertyData.bathrooms) {

                        sentences.push(
                            `The property includes ${propertyData.bathrooms.toLowerCase()}.`
                        )

                        }

                        if (propertyData.parking) {

                        sentences.push(
                            `Parking capacity supports ${propertyData.parking.toLowerCase()}.`
                        )

                        }

                        if (propertyData.year_built_range) {

                        sentences.push(
                            `The structure dates to the ${propertyData.year_built_range}.`
                        )

                        }

                        if (propertyData.construction_area) {

                            sentences.push(
                            `The construction area is ${propertyData.construction_area} m².`
                            )

                        }

                    if (
                        propertyData.utility &&
                        propertyData.utility.length > 0
                    ) {

                        sentences.push(
                        `Available utilities include ${propertyData.utility.join(', ')}.`
                        )

                    }

                    if (
                    propertyData.terrain &&
                    propertyData.terrain.length > 0
                    ) {

                    sentences.push(
                        `Terrain conditions are classified as ${propertyData.terrain.join(', ').toLowerCase()}.`
                    )

                    }
                    
                    if (propertyData.legal_status) {

                        sentences.push(
                        `Legal status is currently listed as ${propertyData.legal_status.toLowerCase()}.`
                        )

                    }

                    

               return sentences.join(' ')
                        }

                        export function formatColones(
                        amount: string | number
                        ) {

                        const numericValue = Number(
                            String(amount).replace(/[^\d]/g, '')
                        )

                        return new Intl.NumberFormat(
                            'es-CR',
                            {
                            style: 'currency',
                            currency: 'CRC',
                            maximumFractionDigits: 0
                            }
                        ).format(numericValue)

                        }

                        export function formatWhatsAppNumber(
                        number: string
                        ) {

                        if (number.length <= 4) {
                            return number
                        }

                        return `${number.slice(0, 4)}-${number.slice(4)}`

                        }