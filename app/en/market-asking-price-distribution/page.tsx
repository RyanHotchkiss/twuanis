import AskingPriceDistribution from '@/app/components/AskingPriceDistribution'
import { readAskingPriceCatalog } from '@/lib/asking-price-data'
export const dynamic = 'force-dynamic'
export default async function Page(){return <AskingPriceDistribution lang="en" catalog={await readAskingPriceCatalog()}/>}
