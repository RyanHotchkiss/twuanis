import {Knowledge} from '@/app/components/knowledge/Knowledge'
import {knowledgeMetadata,type KnowledgeInput} from '@/lib/knowledge-public/knowledge-page'
export const dynamic='force-dynamic'
export const revalidate=0
export async function generateMetadata({searchParams}:{searchParams:Promise<KnowledgeInput>}){return knowledgeMetadata('es',await searchParams)}
export default async function Page({searchParams}:{searchParams:Promise<KnowledgeInput>}){return <Knowledge l="es" input={await searchParams}/>}
