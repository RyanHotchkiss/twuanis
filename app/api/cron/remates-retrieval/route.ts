import {NextResponse} from 'next/server'
import {retrievalActivated,workerRequestAuthorized,runRetrievalWorker} from '@/lib/remates/retrieval-worker'
export const runtime='nodejs'
export const maxDuration=180
export async function GET(request:Request){
 if(!retrievalActivated())return NextResponse.json({error:'Retrieval disabled'},{status:404})
 if(!workerRequestAuthorized(request.headers.get('authorization')))return NextResponse.json({error:'Unauthorized'},{status:401})
 try{return NextResponse.json(await runRetrievalWorker(),{headers:{'Cache-Control':'no-store'}})}
 catch{return NextResponse.json({error:'Retrieval unavailable'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
