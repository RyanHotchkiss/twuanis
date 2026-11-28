'use strict'
const origin = 'https://www.encuentra24.com'
module.exports = {
  origin,
  sale: { transaction: 'sale', indexUrl: `${origin}/costa-rica-es/bienes-raices-venta-de-propiedades`, priceField: 'current_price' },
  rent: { transaction: 'rent', indexUrl: `${origin}/costa-rica-es/bienes-raices-alquiler`, priceField: 'monthly_price' },
  maxRuntimeMs: 69 * 60 * 1000
}
