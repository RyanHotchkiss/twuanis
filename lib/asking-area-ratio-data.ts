import 'server-only';
import { supabaseAdmin } from './supabase-admin';
import { readCanonicalListingEvidence } from './canonical-listing-reader';
import { resolvePriceMeterAreaIdentity, resolvePriceMeterPropertyBasis } from './price-meter-identity';
import { resolveListingOriginalMonetaryValue } from './listing-monetary-value';
import { getHistoricalUsdToCrcRate } from './fx/fx-service';
import { getCurrentAnalyticalDate } from './analysis-date';
import { validateGeographicRow, validateOntologyTermId } from './geography/dta-identity';
import type { RatioQuestion } from './asking-area-ratio-contract';
import type { Observation } from './asking-area-ratio-math';
// Compare PostgreSQL decimal text before binary conversion; never round membership bounds.
function decimalCompare(a: string, b: string) { const parts = (s: string) => { if (!/^\d+(\.\d+)?$/.test(s))
    throw Error('Invalid numeric evidence'); const [w, f = ''] = s.split('.'); return [w.replace(/^0+(?=\d)/, ''), f.replace(/0+$/, '')]; }; const [x, xf] = parts(a), [y, yf] = parts(b); if (x.length !== y.length)
    return x.length - y.length; if (x !== y)
    return x < y ? -1 : 1; const n = Math.max(xf.length, yf.length), u = xf.padEnd(n, '0'), v = yf.padEnd(n, '0'); return u === v ? 0 : u < v ? -1 : 1; }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
async function pages(query: (start: number, end: number) => any, key: (row: any) => string) { let offset = 0, total: number | null = null, last = ''; const all: any[] = []; do {
    const { data, error, count } = await query(offset, offset + 499);
    if (error || !Array.isArray(data) || !Number.isSafeInteger(count) || count < 0 || total !== null && count !== total || data.length > 500 || offset + data.length > count || !data.length && offset < count)
        throw Error('Incomplete population');
    total = count;
    for (const row of data) {
        const id = key(row);
        if (!UUID.test(id) || id <= last)
            throw Error('Population ordering/identity');
        last = id;
        all.push(row);
    }
    offset += data.length;
} while (offset < total!); return all; }
// Server-owned participation/FX requirements. The default Engine 16 question is unchanged.
export async function acquireAreaRatio(q: RatioQuestion, context: { excludedListingId?: string; subjectNeedsUsd?: boolean } = {}) {
    if (context.excludedListingId !== undefined && !UUID.test(context.excludedListingId)) throw Error('Invalid excluded identity');
    const lookup = async (id: string, type: string) => { const { data, error } = await supabaseAdmin.from('ontology_terms').select('id::text,parent_id::text,official_code,term_type,level,slug,term_name,term_name_en,term_name_es').eq('id', id).single(); if (error || !data || data.id !== id || data.term_type !== type)
        throw Error('Invalid canonical term'); return data; };
    const geo = await lookup(q.geography.termId, q.geography.level), pt = await lookup(q.propertyType, 'property_type');
    validateGeographicRow(geo, q.geography.level);
    if (pt.level !== 1)
        throw Error('Invalid property type');
    if (resolvePriceMeterPropertyBasis({ propertyType: pt.slug, constructionArea: resolvePriceMeterAreaIdentity(1) }) !== 'improved_property')
        throw Error('Improved Property required');
    const bound = (query: any, prefix = '') => query.gte(prefix + 'property_area', q.propertyArea.min).lte(prefix + 'property_area', q.propertyArea.max).gte(prefix + 'construction_area', q.constructionArea.min).lte(prefix + 'construction_area', q.constructionArea.max);
    const geographic = await pages((a, b) => bound(supabaseAdmin.from('listings_ontology_terms').select('listing_id,ontology_term_id::text,listings!inner(canonical_domain_version,listing_status,transaction_type)', { count: 'exact' }).eq('ontology_term_id', q.geography.termId).eq('listings.canonical_domain_version', 1).eq('listings.listing_status', 'active').eq('listings.transaction_type', q.transaction), 'listings.').order('listing_id').range(a, b), row => { if (row.ontology_term_id !== q.geography.termId || row.listings?.canonical_domain_version !== 1 || row.listings?.listing_status !== 'active' || row.listings?.transaction_type !== q.transaction)
        throw Error('Population mismatch'); return row.listing_id; });
    // Exclude an existing subject unconditionally, before type/scalar acquisition or fitting.
    const initial = context.excludedListingId ? geographic.filter(row => row.listing_id !== context.excludedListingId) : geographic;
    const observations: Observation[] = [], pending: {
        id: string;
        L: number;
        C: number;
        money: NonNullable<ReturnType<typeof resolveListingOriginalMonetaryValue>>;
    }[] = [];
    let excluded = 0;
    for (let start = 0; start < initial.length; start += 25) {
        const ids = initial.slice(start, start + 25).map(r => r.listing_id);
        const typed = await pages((a, b) => supabaseAdmin.from('listings_ontology_terms').select('listing_id,ontology_term_id::text', { count: 'exact' }).in('listing_id', ids).eq('ontology_term_id', q.propertyType).order('listing_id').range(a, b), r => { if (!ids.includes(r.listing_id) || r.ontology_term_id !== q.propertyType)
            throw Error('Type mismatch'); return r.listing_id; });
        const selected = typed.map(r => r.listing_id);
        if (!selected.length)
            continue;
        const rows = await pages((a, b) => bound(supabaseAdmin.from('listings').select('id,canonical_domain_version,listing_status,transaction_type,property_area::text,construction_area::text,current_price::text,monthly_price::text,currency', { count: 'exact' }).in('id', selected).eq('canonical_domain_version', 1).eq('listing_status', 'active').eq('transaction_type', q.transaction)).order('id').range(a, b), r => { if (!selected.includes(r.id) || r.canonical_domain_version !== 1 || r.listing_status !== 'active' || r.transaction_type !== q.transaction)
            throw Error('Scalar mismatch'); return r.id; });
        if (rows.length !== selected.length)
            throw Error('Missing scalar rows');
        const evidence = await readCanonicalListingEvidence(selected, { facts: [], semantics: ['property_type'] });
        for (const row of rows) {
            const e = evidence.get(row.id);
            if (!e || !e.geography.some(g => g.id === q.geography.termId && g.term_type === q.geography.level) || e.selections.length !== 1 || e.selections[0].ontology_term_id !== q.propertyType)
                throw Error('Canonical mismatch');
            for (const [key, range] of [['property_area', q.propertyArea], ['construction_area', q.constructionArea]] as const) {
                if (typeof row[key] !== 'string' || decimalCompare(row[key], range.min) < 0 || decimalCompare(row[key], range.max) > 0)
                    throw Error('Area boundary mismatch');
            }
            const L = Number(row.property_area), C = Number(row.construction_area);
            if (row.property_area === null || row.construction_area === null || ![L, C].every(x => Number.isFinite(x) && x > 0))
                throw Error('Invalid exact area');
            if (resolvePriceMeterPropertyBasis({ propertyType: e.selections[0].slug, constructionArea: resolvePriceMeterAreaIdentity(C) }) !== 'improved_property')
                throw Error('Basis mismatch');
            const money = resolveListingOriginalMonetaryValue(row);
            if (!money) {
                excluded++;
                continue;
            }
            pending.push({ id: row.id, L, C, money });
        }
    }
    const analyticalDate = getCurrentAnalyticalDate();
    let fx: Awaited<ReturnType<typeof getHistoricalUsdToCrcRate>> | null = null;
    if (context.subjectNeedsUsd || pending.some(p => p.money.currency === 'USD')) {
        fx = await getHistoricalUsdToCrcRate(analyticalDate);
        if (fx.analyticalDate !== analyticalDate || fx.source !== 'BCCR' || fx.rateType !== 'reference_sale' || fx.baseCurrency !== 'USD' || fx.quoteCurrency !== 'CRC' || !Number.isFinite(fx.rate) || fx.rate <= 0 || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(fx.effectiveDate) || fx.effectiveDate > analyticalDate || !['exact', 'latest_applicable_prior_observation'].includes(fx.resolutionMode) || fx.resolutionMode === 'exact' && fx.effectiveDate !== analyticalDate || fx.resolutionMode === 'latest_applicable_prior_observation' && fx.effectiveDate >= analyticalDate)
            throw Error('Invalid FX');
    }
    for (const { id, L, C, money } of pending) {
        const P = money.amount * (money.currency === 'USD' ? fx!.rate : 1);
        if (!Number.isFinite(P) || P <= 0)
            throw Error('Invalid normalized amount');
        observations.push({ id, P, L, C });
    }
    const label = (t: any) => ({ en: t.term_name_en || t.term_name, es: t.term_name_es || t.term_name });
    return { observations, excluded, analyticalDate, fx: fx ? { rate: fx.rate, effectiveDate: fx.effectiveDate, source: fx.source, resolutionMode: fx.resolutionMode } : null, marketLabel: label(geo), propertyTypeLabel: label(pt) };
}
// Metadata only: no population query, acquisition, FX, or analytical execution.
export async function acquireAreaRatioOptions() {
    const options: {
        id: string;
        type: string;
        en: string;
        es: string;
        code: string | null;
    }[] = [];
    let offset = 0, total: number | null = null, last: bigint | null = null;
    try {
        for (;;) {
            const { data, error, count } = await supabaseAdmin.from('ontology_terms').select('id::text,parent_id::text,official_code,term_type,level,slug,term_name,term_name_en,term_name_es', { count: 'exact' }).in('term_type', ['province', 'canton', 'district', 'property_type']).order('id').range(offset, offset + 499);
            if (error || !Array.isArray(data) || !Number.isSafeInteger(count) || count! < 0 || total !== null && count !== total || data.length > 500 || offset + data.length > count! || !data.length && offset < count!)
                throw Error('Incomplete catalog');
            total = count!;
            for (const row of data) {
                const id = validateOntologyTermId(row.id), numeric = BigInt(id);
                if (last !== null && numeric <= last)
                    throw Error('Catalog order');
                last = numeric;
                if (row.term_type === 'property_type') {
                    if (row.level !== 1)
                        continue;
                    // This only tests the type's compatibility with an exact-positive construction question.
                    // Every listing must separately establish its own actual exact construction evidence.
                    if (resolvePriceMeterPropertyBasis({ propertyType: row.slug, constructionArea: resolvePriceMeterAreaIdentity(1) }) !== 'improved_property')
                        continue;
                }
                else if (['province', 'canton', 'district'].includes(row.term_type))
                    validateGeographicRow(row, row.term_type);
                else
                    throw Error('Catalog type');
                const en = row.term_name_en || row.term_name, es = row.term_name_es || row.term_name;
                if (typeof en !== 'string' || !en.trim() || typeof es !== 'string' || !es.trim())
                    throw Error('Catalog label');
                options.push({ id, type: row.term_type, en, es, code: row.official_code });
            }
            offset += data.length;
            if (offset === total)
                break;
        }
        return { state: 'ready' as const, options };
    }
    catch {
        return { state: 'unavailable' as const };
    }
}
