import 'server-only'
import { supabase } from './supabase'
import type { Phase14Catalog, Phase14Option } from './comparative-discovery-contract'

const types = ['province','canton','district','property_type','environment','terrain','utility','accessibility','legal_status','bedrooms','bathrooms','parking','year_built']
// Public dictionary labels only. Lossless identities; bounded complete pages, no listing acquisition.
export async function readPhase14OptionCatalog(): Promise<Phase14Catalog> {
  const options: Phase14Option[] = [], seen = new Set<string>()
  let total: number | null = null, last = BigInt(0)
  try {
    for (let offset = 0; ; offset += 500) {
      const { data, error, count } = await supabase.from('ontology_terms')
        .select('id::text,term_type,term_name,term_name_en,term_name_es,official_code,parent_id::text,level', { count: 'exact' })
        .in('term_type', types).order('id', { ascending: true }).range(offset, offset + 499)
      if (error || !Array.isArray(data) || !Number.isSafeInteger(count) || count! < 0 || (total !== null && total !== count)) throw new Error()
      total = count!
      if (data.length !== Math.min(500, total - offset)) throw new Error()
      for (const row of data) {
        if (typeof row.id !== 'string' || !/^[1-9]\d*$/.test(row.id) || BigInt(row.id) <= last || seen.has(row.id) || !types.includes(row.term_type)) throw new Error()
        last = BigInt(row.id); seen.add(row.id)
        if (!['province','canton','district'].includes(row.term_type) && row.level !== 1) continue
        const fallback = typeof row.term_name === 'string' ? row.term_name.trim() : ''
        const en = typeof row.term_name_en === 'string' && row.term_name_en.trim() || fallback
        const es = typeof row.term_name_es === 'string' && row.term_name_es.trim() || fallback
        if (!en || !es || row.parent_id !== null && (typeof row.parent_id !== 'string' || !/^[1-9]\d*$/.test(row.parent_id))) throw new Error()
        if (['province','canton','district'].includes(row.term_type) && typeof row.official_code !== 'string') throw new Error()
        options.push({ id: row.id, type: row.term_type, en, es, code: row.official_code, parentId: row.parent_id })
      }
      if (offset + data.length === total) break
    }
    return { state: 'ready', options }
  } catch { return { state: 'unavailable' } }
}
