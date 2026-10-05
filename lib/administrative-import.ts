import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { AdministrativeAccessError } from '@/lib/administrative-control'

// The nonce is obtained using the verified human session, not supplied by the browser.
// It is used only for the two existing CSV mutation boundaries; no arbitrary RPC proxy.
export async function createAdministrativeImportTransport(
  human: SupabaseClient, service: SupabaseClient,
): Promise<Pick<SupabaseClient, 'rpc'>> {
  const auth = await human.auth.getUser()
  if (auth.error || !auth.data.user) throw new AdministrativeAccessError()
  const begun = await human.rpc('begin_administrative_import')
  if (begun.error || typeof begun.data !== 'string' || !/^[0-9a-f-]{36}$/i.test(begun.data)) throw new AdministrativeAccessError()
  const operation = begun.data
  const rpc: SupabaseClient['rpc'] = (name, args) => {
    if (name === 'retain_csv_source_evidence') {
      return service.rpc('retain_administrative_csv_evidence', {
        p_operation: operation, p_raw: args?.p_raw, p_review: args?.p_review,
      })
    }
    if (name === 'ingest_canonical_source_observation') {
      return service.rpc('apply_administrative_csv_observation', {
        p_operation: operation, p_evidence: args?.p_evidence, p_input: args?.p_input,
      })
    }
    throw new AdministrativeAccessError()
  }
  return Object.freeze({ rpc })
}
