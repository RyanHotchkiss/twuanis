import { createHash,timingSafeEqual } from 'node:crypto'
import { deliverRegistrationNotification } from '@/lib/auth/registration-notifications'
export const runtime='nodejs'
export const maxDuration=60
export async function GET(request:Request){
 const secret=process.env.CRON_SECRET,header=request.headers.get('authorization')
 if(!secret||secret.length<32||!header||header.length>1024||!timingSafeEqual(createHash('sha256').update(header).digest(),createHash('sha256').update('Bearer '+secret).digest()))return Response.json({error:'unauthorized'},{status:401})
 try{const states=[];for(let i=0;i<5;i++){const result=await deliverRegistrationNotification();states.push(result.state);if(['EMPTY','UNCONFIGURED'].includes(result.state))break}return Response.json({states},{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'notification_unavailable'},{status:503})}
}
