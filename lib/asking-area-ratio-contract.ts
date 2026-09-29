// Browser-safe question/transport identity. No analytical computation.
export const ratioTitle = { en: 'Construction Area-to-Property Area Asking-Price Relationship Ratio', es: 'Relación entre los coeficientes del precio de oferta por m² de área de construcción y de área del terreno' };
export const ratioQuestion = { en: 'What is the modeled asking-price relationship per square meter of Construction Area divided by the modeled asking-price relationship per square meter of Property Area?', es: '¿Cuál es la relación modelada del precio de oferta por metro cuadrado de área de construcción dividida por la relación modelada por metro cuadrado de área del terreno?' };
export type RatioQuestion = {
    transaction: 'sale' | 'rent';
    geography: {
        level: 'province' | 'canton' | 'district';
        termId: string;
    };
    propertyType: string;
    propertyArea: {
        min: string;
        max: string;
    };
    constructionArea: {
        min: string;
        max: string;
    };
};
export function canonicalDecimal(value: unknown): string {
    if (typeof value !== 'string' || value.length > 350 || !/^\d+(\.\d+)?$/.test(value))
        throw Error('Invalid decimal');
    const clean = (s: string) => { const [a, b = ''] = s.split('.'); const w = a.replace(/^0+(?=\d)/, ''), f = b.replace(/0+$/, ''); return w + (f ? '.' + f : ''); };
    const s = clean(value), n = Number(s);
    if (!Number.isFinite(n) || n <= 0)
        throw Error('Invalid decimal');
    const expand = (v: string) => { if (!v.includes('e'))
        return v; const [m, e] = v.split('e'), [a, b = ''] = m.split('.'), digits = a + b, pos = a.length + Number(e); return pos <= 0 ? '0.' + '0'.repeat(-pos) + digits : pos >= digits.length ? digits + '0'.repeat(pos - digits.length) : digits.slice(0, pos) + '.' + digits.slice(pos); };
    if (clean(expand(String(n))) !== s)
        throw Error('Boundary loses numerical identity');
    return s;
}
export function parseRatioQuestion(value: unknown): RatioQuestion {
    const object = (v: unknown, keys: string[]) => { if (!v || typeof v !== 'object' || Array.isArray(v) || Object.keys(v).length !== keys.length || keys.some(k => !Object.hasOwn(v, k)))
        throw Error('Invalid question'); return v as Record<string, unknown>; };
    const q = object(value, ['transaction', 'geography', 'propertyType', 'propertyArea', 'constructionArea']), g = object(q.geography, ['level', 'termId']);
    const id = (v: unknown) => { if (typeof v !== 'string' || !/^(0|[1-9][0-9]*|-[1-9][0-9]*)$/.test(v) || v.length > 20 || BigInt(v) < BigInt('-9223372036854775808') || BigInt(v) > BigInt('9223372036854775807'))
        throw Error('Invalid identity'); return BigInt(v).toString(); };
    const range = (v: unknown) => { const r = object(v, ['min', 'max']), min = canonicalDecimal(r.min), max = canonicalDecimal(r.max); if (Number(min) > Number(max))
        throw Error('Reversed bounds'); return { min, max }; };
    if (q.transaction !== 'sale' && q.transaction !== 'rent' || !['province', 'canton', 'district'].includes(g.level as string))
        throw Error('Invalid market');
    return { transaction: q.transaction as 'sale' | 'rent', geography: { level: g.level as RatioQuestion['geography']['level'], termId: id(g.termId) }, propertyType: id(q.propertyType), propertyArea: range(q.propertyArea), constructionArea: range(q.constructionArea) };
}
export type RatioDiagnostics = {
    df: number;
    variation: {L:{min:number;max:number;sd:number};C:{min:number;max:number;sd:number}};
    condition: number;
    rho: number;
    vif: number;
    rSquared: number|null;
    adjustedRSquared: number|null;
    residualScale: number;
    maxLeverage: number;
    relativeInfluence: number|null;
    relativeIntervalDeviation?: number|null;
};
export type RatioEvidence = {n:number;diagnostics?:RatioDiagnostics} & (
    {state:'established';coefficients:{intercept:number;propertyArea:number;constructionArea:number};ratio:number;interval:{lower:number;upper:number}}
    | {state:'not_established';reasons:string[]}
);
export type RatioResponse = {
    access: 'authentication_required' | 'entitlement_required';
} | {
    error: 'invalid_question' | 'execution_unavailable';
} | {
    question: RatioQuestion;
    evidence: RatioEvidence;
    methodology: string;
    analyticalDate: string;
    fx: {
        rate: number;
        effectiveDate: string;
        source: string;
        resolutionMode: string;
    } | null;
    excluded: number;
    marketLabel: {
        en: string;
        es: string;
    };
    propertyTypeLabel: {
        en: string;
        es: string;
    };
};
