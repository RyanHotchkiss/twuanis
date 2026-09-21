import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { validateGeographicRequest } from './dta-request';
import { DtaResolutionError } from './dta-request';
import { geographicLookupCodes, resolveGeographicRows, type ResolvedGeographicRequest } from './dta-identity';

// Inject a server-owned client for offline tests. Never accept this dependency from a request.
type ClientFactory = () => Promise<SupabaseClient>;
async function defaultClient(): Promise<SupabaseClient> {
  const { createServerSupabaseClient } = await import('../supabase-server');
  return createServerSupabaseClient();
}

export async function resolveDtaGeography(
  input: unknown, createClient: ClientFactory = defaultClient,
): Promise<ResolvedGeographicRequest> {
  const request = validateGeographicRequest(input);
  const codes = geographicLookupCodes(request);
  if (!codes.length) return Object.freeze({});
  let response;
  try {
    const client = await createClient();
    response = await client
      .from('ontology_terms')
      .select('id::text,parent_id::text,official_code,term_type,level', { count: 'exact' })
      .in('term_type', ['province', 'canton', 'district'])
      .in('official_code', codes)
      .order('official_code', { ascending: true })
      .limit(codes.length + 1)
      .retry(false);
  } catch {
    throw new DtaResolutionError('RESOLUTION_UNAVAILABLE');
  }
  if (response.error) throw new DtaResolutionError('RESOLUTION_UNAVAILABLE');
  return resolveGeographicRows(request, codes, response.data, response.count);
}
