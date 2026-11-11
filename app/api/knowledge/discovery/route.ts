import {publicHandler} from '@/lib/knowledge-public/handler'
export const runtime='nodejs'
export const dynamic='force-dynamic'
export const maxDuration=5
export function GET(request:Request){return publicHandler(request,'discovery')}
