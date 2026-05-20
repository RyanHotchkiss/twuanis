 export function generateListingTitle(propertyData: any) {

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

                    export function generateListingDescription(propertyData: any) {

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
                        `The property falls within the ${propertyData.property_area} size range.`
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
                            `Construction area falls within the ${propertyData.construction_area} range.`
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

                        export function convertToUSD(
                        amount: string | number
                        ) {

                        const crcValue = Number(
                            String(amount).replace(/[^\d]/g, '')
                        )

                        const exchangeRate = 500

                        return Math.round(crcValue / exchangeRate)

                        }

                        export function formatWhatsAppNumber(
                        number: string
                        ) {

                        if (number.length <= 4) {
                            return number
                        }

                        return `${number.slice(0, 4)}-${number.slice(4)}`

                        }