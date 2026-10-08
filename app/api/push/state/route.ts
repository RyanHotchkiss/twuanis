import {pushRequest} from '@/lib/push-server'
export const runtime='nodejs'
export async function POST(request:Request){return pushRequest(request,'state')}
