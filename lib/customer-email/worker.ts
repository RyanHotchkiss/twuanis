import 'server-only'
import {supabaseAdmin} from '@/lib/supabase-admin'
import {sendCustomerTransactionalEmail} from '@/lib/email'
import {customerEmailConfiguration,deliverCustomerEmails} from './delivery'
export async function deliverCustomerTransactionalEmails(){
 return deliverCustomerEmails(async(operation,command)=>{const r=await supabaseAdmin.rpc('customer_transactional_email_service',{p_operation:operation,p_command:command});if(r.error)throw Error('CUSTOMER_EMAIL_UNAVAILABLE');return r.data},sendCustomerTransactionalEmail,customerEmailConfiguration(process.env))
}
