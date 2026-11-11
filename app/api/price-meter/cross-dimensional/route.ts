import {NextRequest,NextResponse} from 'next/server'
import {executeCrossDimensionalRequest} from '@/lib/price-meter-cross-dimensional-execution'

export async function POST(request:NextRequest){
 const result=await executeCrossDimensionalRequest(request)
 return NextResponse.json(result.body,{status:result.status})
}
