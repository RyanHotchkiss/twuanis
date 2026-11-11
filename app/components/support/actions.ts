'use server'
import {readSupportIdentity} from '@/lib/support/identity'
// No client-supplied identity or message; revalidate the current session at handoff.
export async function verifySupportCustomer(){return readSupportIdentity()}
