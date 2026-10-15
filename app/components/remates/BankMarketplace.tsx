'use client'

import BuyEN from '../marketplace/BuyMarketplaceEN'
import BuyES from '../marketplace/BuyMarketplaceES'

export default function BankMarketplace({language = 'en'}: {language?: 'en' | 'es'}) {
  return language === 'es' ? <BuyES bankOnly /> : <BuyEN bankOnly />
}
