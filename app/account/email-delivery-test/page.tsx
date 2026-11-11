import {assertOwner} from '@/lib/administrative-control'
export const dynamic='force-dynamic'
export default async function Page(){
 try{await assertOwner()}catch{return <p>Forbidden</p>}
 return <main><h1>One authorized transactional delivery test</h1><p>Recipient: rynjnhtchkss@gmail.com. General customer delivery remains disabled. The server permanently consumes the single attempt before contacting Resend.</p><form method="post" action="/api/test-email"><button type="submit">Send the single authorized webhook acceptance test</button></form></main>
}
