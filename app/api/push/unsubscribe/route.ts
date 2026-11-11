import {pushRequest} from '@/lib/push-server'
export const runtime='nodejs'
export async function DELETE(request:Request){return pushRequest(request,'disable')}
