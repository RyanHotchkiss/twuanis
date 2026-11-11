import {POPULATION_ENGINES} from '@/lib/population-engine-registry'
import {Methodology} from '@/app/components/methodology/Methodology'
import {metadataFor} from '@/lib/methodology-pages'
type Props={params:Promise<{engine:string}>}
export async function generateMetadata({params}:Props){return metadataFor((await params).engine,'es')}
export default async function Page({params}:Props){return <Methodology id={(await params).engine} l="es"/>}
export const dynamicParams=false
export function generateStaticParams(){return POPULATION_ENGINES.map(e=>({engine:e[0]}))}
