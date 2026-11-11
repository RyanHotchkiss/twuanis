import {deliverListingDuplicateNotification} from '@/lib/listing-duplicate-notifications'
import {deliverCustomerTransactionalEmails} from '@/lib/customer-email/worker'
import {after} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase-admin'
import {maintainMeasurement,dispatchPendingMeasurement} from '@/lib/measurement/operations'
import { createHash,timingSafeEqual } from 'node:crypto'
import { deliverRegistrationNotification } from '@/lib/auth/registration-notifications'
export const runtime='nodejs'
export const maxDuration=60
export async function GET(request:Request){
 const started=Date.now()
 const secret=process.env.CRON_SECRET,header=request.headers.get('authorization')
 if(!secret||secret.length<32||!header||header.length>1024||!timingSafeEqual(createHash('sha256').update(header).digest(),createHash('sha256').update('Bearer '+secret).digest()))return Response.json({error:'unauthorized'},{status:401})
 try{after(async()=>{try{const cleanup=await maintainMeasurement(supabaseAdmin);const delivery=await dispatchPendingMeasurement(supabaseAdmin);if(cleanup.state!=='DISABLED'||delivery.state!=='DISABLED')(cleanup.state==='PARTIAL'||(delivery.state==='UNAVAILABLE'||delivery.state==='PARTIAL')?console.warn:console.info)('measurement_maintenance',JSON.stringify({cleanup,delivery}))}catch{console.info('measurement_maintenance_unavailable')}})}catch{}
 try{const states=[];for(let i=0;i<5;i++){const result=await deliverRegistrationNotification();states.push(result.state);if(['EMPTY','UNCONFIGURED'].includes(result.state))break}let customerEmail;try{customerEmail=await deliverCustomerTransactionalEmails()}catch{customerEmail={state:'UNAVAILABLE'}}let duplicateReview={state:'DEFERRED'};if(Date.now()-started<40000){try{duplicateReview=await deliverListingDuplicateNotification()}catch{duplicateReview={state:'UNAVAILABLE'}}}return Response.json({states,customerEmail,duplicateReview},{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'notification_unavailable'},{status:503})}
}
