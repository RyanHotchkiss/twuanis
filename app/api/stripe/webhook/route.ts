import {boundedStripeBody,stripeConfiguration} from '@/lib/providers/stripe'
import {StripeCommerce} from '@/lib/providers/stripe-commerce'
export const runtime='nodejs'
export async function POST(request:Request){
 try{const c=stripeConfiguration(),raw=await boundedStripeBody(request);await new StripeCommerce(c).webhook(raw,request.headers.get('stripe-signature'));return Response.json({received:true})}
 catch{return Response.json({received:false},{status:503})}
}
