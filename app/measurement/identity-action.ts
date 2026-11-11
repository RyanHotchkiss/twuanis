'use server'
import {verifiedMeasurementEligibility} from '@/lib/measurement/verified-eligibility'
// Returns no account ID, token or customer profile. No persistence or session mutation.
export async function measurementEligibility(){return verifiedMeasurementEligibility()}
