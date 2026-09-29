import 'server-only';
// Approved initial product tolerances, not universal statistical constants.
export const RATIO_METHOD = Object.freeze({ version: 'asking-area-ratio-ols-hc3-fieller-v1', coverage: .95, precision: .25, influence: .25, numericalBudget: 1e-8 });
export type Observation = Readonly<{
    id: string;
    P: number;
    L: number;
    C: number;
}>;
type V = [
    number,
    number,
    number
];
type M = [
    V,
    V,
    V
];
const dot = (a: readonly number[], b: readonly number[]) => a.reduce((s, x, i) => s + x * b[i], 0);
const zeros = (): M => [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
function sum(a: number[]) { let s = 0, c = 0; for (const x of a) {
    const t = s + x;
    c += Math.abs(s) >= Math.abs(x) ? (s - t) + x : (x - t) + s;
    s = t;
} return s + c; }
const norm = (a: number[]) => Math.sqrt(sum(a.map(x => x * x)));
// Lanczos log-gamma and continued-fraction incomplete beta; no normal approximation
// at small residual degrees of freedom. Convergence failure is technical failure.
function lg(z: number): number { const p = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]; if (z < .5)
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - lg(1 - z); z--; let x = .99999999999980993; for (let i = 0; i < p.length; i++)
    x += p[i] / (z + i + 1); const t = z + 7.5; return .5 * Math.log(2 * Math.PI) + (z + .5) * Math.log(t) - t + Math.log(x); }
function betaFraction(a: number, b: number, x: number) { const tiny = 1e-300; let c = 1, d = 1 - (a + b) * x / (a + 1); if (Math.abs(d) < tiny)
    d = tiny; d = 1 / d; let h = d; for (let m = 1; m <= 1000; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((a + m2 - 1) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < tiny)
        d = tiny;
    c = 1 + aa / c;
    if (Math.abs(c) < tiny)
        c = tiny;
    d = 1 / d;
    h *= d * c;
    aa = -(a + m) * (a + b + m) * x / ((a + m2) * (a + m2 + 1));
    d = 1 + aa * d;
    if (Math.abs(d) < tiny)
        d = tiny;
    c = 1 + aa / c;
    if (Math.abs(c) < tiny)
        c = tiny;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < 2e-14)
        return h;
} throw Error('Incomplete beta convergence'); }
function ibeta(x: number, a: number, b: number): number { if (x <= 0)
    return 0; if (x >= 1)
    return 1; const f = Math.exp(lg(a + b) - lg(a) - lg(b) + a * Math.log(x) + b * Math.log1p(-x)); return x < (a + 1) / (a + b + 2) ? f * betaFraction(a, b, x) / a : 1 - f * betaFraction(b, a, 1 - x) / b; }
export function tCritical(df: number) { if (!Number.isSafeInteger(df) || df < 1)
    throw Error('Invalid degrees of freedom'); let lo = 0, hi = 1; const tail = (t: number) => .5 * ibeta(df / (df + t * t), df / 2, .5); while (tail(hi) > .025) {
    hi *= 2;
    if (!Number.isFinite(hi))
        throw Error('t quantile overflow');
} for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (tail(mid) > .025)
        lo = mid;
    else
        hi = mid;
} return (lo + hi) / 2; }
export type RatioSet = {
    kind: 'bounded';
    lower: number;
    upper: number;
} | {
    kind: 'disconnected' | 'all_real' | 'empty' | 'half_line' | 'unresolved';
};
export function fieller(a: number, b: number, ll: number, cc: number, lc: number, q: number): RatioSet {
    if (![a, b, ll, cc, lc, q].every(Number.isFinite) || ll < 0 || cc < 0 || q <= 0)
        return { kind: 'unresolved' };
    const scale = Math.max(Math.abs(a), Math.abs(b), q * Math.sqrt(ll), q * Math.sqrt(cc));
    if (scale === 0)
        return { kind: 'all_real' };
    a /= scale;
    b /= scale;
    ll = (ll / scale) / scale;
    cc = (cc / scale) / scale;
    lc = (lc / scale) / scale;
    if (lc * lc > ll * cc + 64 * Number.EPSILON * Math.max(ll * cc, lc * lc))
        return { kind: 'unresolved' };
    const A = a * a - q * q * ll, B = -2 * a * b + 2 * q * q * lc, D = b * b - q * q * cc;
    if (A === 0) {
        if (B === 0)
            return { kind: D <= 0 ? 'all_real' : 'empty' };
        return { kind: 'half_line' };
    }
    const disc = B * B - 4 * A * D;
    if (!Number.isFinite(disc))
        return { kind: 'unresolved' };
    if (disc < 0)
        return { kind: A < 0 ? 'all_real' : 'empty' };
    if (A < 0)
        return { kind: disc === 0 ? 'all_real' : 'disconnected' };
    const root = Math.sqrt(disc), v = -.5 * (B + (B >= 0 ? root : -root));
    const r1 = v / A, r2 = v === 0 ? -B / (2 * A) : D / v;
    if (![r1, r2].every(Number.isFinite))
        return { kind: 'unresolved' };
    return { kind: 'bounded', lower: Math.min(r1, r2), upper: Math.max(r1, r2) };
}
export type Fit = {
    coefficients: V;
    scaledCoefficients: V;
    rows: V[];
    residuals: number[];
    G: M;
    transform: M;
    responseScale: number;
    rank: number;
    condition: number;
    rho: number;
    n: number;
    variation: {
        L: {
            min: number;
            max: number;
            sd: number;
        };
        C: {
            min: number;
            max: number;
            sd: number;
        };
    };
};
// Modified Gram-Schmidt with pivoting and reorthogonalization. Three columns only.
// Rank/condition are additionally resolved from the centered two-predictor design.
export function fitAreaRatio(input: readonly Observation[]): Fit {
    const data = [...input].sort((a, b) => a.id.localeCompare(b.id, 'en'));
    if (data.some((o, i) => !o.id || i > 0 && o.id === data[i - 1].id || ![o.P, o.L, o.C].every(v => Number.isFinite(v) && v > 0)))
        throw Error('Invalid observation population');
    const n = data.length;
    if (n < 4)
        throw Error('insufficient_observations');
    const maxL = data.reduce((m, o) => Math.max(m, o.L), 0), maxC = data.reduce((m, o) => Math.max(m, o.C), 0), ps = data.reduce((m, o) => Math.max(m, o.P), 0);
    const l = data.map(o => o.L / maxL), c = data.map(o => o.C / maxC), ml = sum(l) / n, mc = sum(c) / n, sl = Math.sqrt(sum(l.map(x => (x - ml) ** 2)) / n), sc = Math.sqrt(sum(c.map(x => (x - mc) ** 2)) / n);
    if (!(sl > 0 && sc > 0))
        throw Error('insufficient_variation');
    const rows: V[] = l.map((x, i) => [1, (x - ml) / sl, (c[i] - mc) / sc]), y = data.map(o => o.P / ps);
    const rho = dot(rows.map(x => x[1]), rows.map(x => x[2])) / n;
    const ar = Math.abs(rho);
    if (ar >= 1)
        throw Error('rank_deficiency');
    const condition = Math.sqrt((1 + ar) / (1 - ar)), eps = Number.EPSILON, gamma = n * eps / (1 - n * eps);
    if (!Number.isFinite(condition) || !(gamma > 0) || condition * gamma > RATIO_METHOD.numericalBudget)
        throw Error('numerical_instability');
    if (Math.sqrt(n * (1 - ar)) <= Math.max(n, 3) * eps * Math.sqrt(n * (1 + ar)))
        throw Error('rank_deficiency');
    const columns = [rows.map(x => x[0]), rows.map(x => x[1]), rows.map(x => x[2])], permutation = [0, 1, 2], R = zeros(), Q: number[][] = [];
    for (let k = 0; k < 3; k++) {
        let p = k;
        for (let j = k + 1; j < 3; j++)
            if (norm(columns[j]) > norm(columns[p]))
                p = j;
        [columns[k], columns[p]] = [columns[p], columns[k]];
        [permutation[k], permutation[p]] = [permutation[p], permutation[k]];
        for (let i = 0; i < k; i++)
            [R[i][k], R[i][p]] = [R[i][p], R[i][k]];
        R[k][k] = norm(columns[k]);
        if (!(R[k][k] > 0))
            throw Error('rank_deficiency');
        Q[k] = columns[k].map(v => v / R[k][k]);
        for (let j = k + 1; j < 3; j++) {
            R[k][j] = dot(Q[k], columns[j]);
            for (let i = 0; i < n; i++)
                columns[j][i] -= R[k][j] * Q[k][i];
            const correction = dot(Q[k], columns[j]);
            R[k][j] += correction;
            for (let i = 0; i < n; i++)
                columns[j][i] -= correction * Q[k][i];
        }
    }
    const solve = (v: V): V => { const out: V = [0, 0, 0]; for (let i = 2; i >= 0; i--) {
        let a = v[i];
        for (let j = i + 1; j < 3; j++)
            a -= R[i][j] * out[j];
        out[i] = a / R[i][i];
    } return out; };
    const bp = solve(Q.map(q => dot(q, y)) as V), bs: V = [0, 0, 0];
    permutation.forEach((p, i) => bs[p] = bp[i]);
    const inv = zeros();
    for (let j = 0; j < 3; j++) {
        const e: V = [0, 0, 0];
        e[j] = 1;
        const col = solve(e);
        for (let i = 0; i < 3; i++)
            inv[i][j] = col[i];
    }
    const G = zeros();
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++)
            G[permutation[i]][permutation[j]] = dot(inv[i], inv[j]);
    const T: M = [[ps, -ps * ml / sl, -ps * mc / sc], [0, ps / maxL / sl, 0], [0, 0, ps / maxC / sc]];
    const coefficients = T.map(row => dot(row, bs)) as V;
    if (!coefficients.every(Number.isFinite))
        throw Error('numerical_instability');
    return { coefficients, scaledCoefficients: bs, rows, residuals: rows.map((row, i) => y[i] - dot(row, bs)), G, transform: T, responseScale: ps, rank: 3, condition, rho, n, variation: { L: { min: l.reduce((m, x) => Math.min(m, x), Infinity) * maxL, max: maxL, sd: sl * maxL * Math.sqrt(n / (n - 1)) }, C: { min: c.reduce((m, x) => Math.min(m, x), Infinity) * maxC, max: maxC, sd: sc * maxC * Math.sqrt(n / (n - 1)) } } };
}
const topTwo = (values: number[]) => { let a = 0, b = 0; for (const v of values) {
    if (v > a) {
        b = a;
        a = v;
    }
    else if (v > b)
        b = v;
} return a + b; };
export function diagnoseAreaRatio(f: Fit, includeInfluence = true) {
    const { rows, residuals: e, G, transform: T } = f, sse = dot(e, e), meanFit = sum(rows.map(x => dot(x, f.scaledCoefficients))) / f.n;
    const sst = sum(rows.map((x, i) => (dot(x, f.scaledCoefficients) + e[i] - meanFit) ** 2));
    const h: number[] = [], gx: V[] = [], covScaled = zeros();
    rows.forEach((x, i) => { const g = G.map(row => dot(row, x)) as V; gx.push(g); const leverage = dot(x, g); h.push(leverage); if (!(leverage >= 0 && leverage < 1))
        throw Error('covariance_unavailable'); const w = (e[i] / (1 - leverage)) ** 2; for (let j = 0; j < 3; j++)
        for (let k = 0; k < 3; k++)
            covScaled[j][k] += g[j] * g[k] * w; });
    const covariance = zeros();
    for (let j = 0; j < 3; j++)
        for (let k = 0; k < 3; k++)
            for (let a = 0; a < 3; a++)
                for (let b = 0; b < 3; b++)
                    covariance[j][k] += T[j][a] * covScaled[a][b] * T[k][b];
    if (covariance.flat().some(x => !Number.isFinite(x)))
        throw Error('covariance_unavailable');
    const hmax = h.reduce((m, x) => Math.max(m, x), 0);
    const influence = includeInfluence ? certifyInfluence(f, h, gx) : { BL: null, BC: null, bound: null, deleted: [], relativeInfluence: null };
    return { covariance, sse, rSquared: sst > 0 ? 1 - sse / sst : null, adjustedRSquared: sst > 0 ? 1 - (sse / (f.n - 3)) / (sst / (f.n - 1)) : null, residualScale: Math.sqrt(sse / (f.n - 3)) * f.responseScale, hmax, ...influence,
        // Exact arithmetic fixtures still have floating residuals: recognize backward-error scale.
        degenerate: sse <= f.n * (64 * Number.EPSILON) ** 2, h, gx };
}
export function certifyInfluence(f: Fit, h: number[], gx: V[]) {
    const e = f.residuals, T = f.transform;
    const a = f.coefficients[1], b = f.coefficients[2], r = b / a, hmax = h.reduce((m, x) => Math.max(m, x), 0), originalGx = gx.map(g => T.map(row => dot(row, g)) as V);
    const E = topTwo(e.map(x => x * x)), BL = Math.sqrt(topTwo(originalGx.map(x => x[1] ** 2)) * E) / (1 - 2 * hmax), BC = Math.sqrt(topTwo(originalGx.map(x => x[2] ** 2)) * E) / (1 - 2 * hmax);
    const certified = 2 * hmax < 1 && Number.isFinite(BL) && Number.isFinite(BC) && BL < Math.abs(a);
    const bound = certified ? (BC + Math.abs(r) * BL) / (Math.abs(a) - BL) : null;
    const deleted = originalGx.map((g, i) => f.coefficients.map((v, j) => v - g[j] * e[i] / (1 - h[i])) as V);
    return { BL, BC, bound, deleted, relativeInfluence: bound !== null && r !== 0 ? bound / Math.abs(r) : null };
}
export function analyzeAreaRatio(data: readonly Observation[]) {
    let fit: Fit;
    try {
        fit = fitAreaRatio(data);
    }
    catch (e) {
        if (e instanceof Error && ['insufficient_observations', 'insufficient_variation', 'rank_deficiency', 'numerical_instability'].includes(e.message))
            return { state: 'not_established' as const, n: data.length, reasons: [e.message] };
        throw e;
    }
    let d: ReturnType<typeof diagnoseAreaRatio>;
    try {
        d = diagnoseAreaRatio(fit, false);
    }
    catch (e) {
        if (e instanceof Error && e.message === 'covariance_unavailable')
            return { state: 'not_established' as const, n: data.length, reasons: ['covariance_unavailable'] };
        throw e;
    }
    const [intercept, a, b] = fit.coefficients, r = b / a;
    const diagnostics = { df: fit.n - 3, variation: fit.variation, condition: fit.condition, rho: fit.rho, vif: 1 / (1 - fit.rho ** 2), rSquared: d.rSquared, adjustedRSquared: d.adjustedRSquared, residualScale: d.residualScale, maxLeverage: d.hmax, relativeInfluence: null as number | null };
    if (d.degenerate)
        return { state: 'not_established' as const, n: data.length, reasons: ['degenerate_uncertainty'], diagnostics };
    const set = fieller(a, b, d.covariance[1][1], d.covariance[2][2], d.covariance[1][2], tCritical(fit.n - 3));
    if (set.kind === 'bounded' && !(set.upper > set.lower))
        return {state:'not_established' as const,n:data.length,reasons:['degenerate_uncertainty'],diagnostics};
    const reasons: string[] = [];
    let deviation: number | null = null;
    if (set.kind !== 'bounded' || !Number.isFinite(r))
        reasons.push('ratio_not_finitely_identified');
    else {
        deviation = r === 0 ? null : Math.max(Math.abs(r - set.lower), Math.abs(set.upper - r)) / Math.abs(r);
        if (deviation === null || deviation > RATIO_METHOD.precision)
            reasons.push('ratio_uncertainty_exceeds_policy');
    }
    // Do not execute influence work when uncertainty has already withheld the ratio.
    if (!reasons.length) {
        const influence = certifyInfluence(fit, d.h, d.gx);
        diagnostics.relativeInfluence = influence.relativeInfluence;
        if (influence.relativeInfluence === null || !Number.isFinite(influence.relativeInfluence) || influence.relativeInfluence > RATIO_METHOD.influence)
            reasons.push('influence_stability_not_certified');
    }
    if (reasons.length || set.kind !== 'bounded')
        return { state: 'not_established' as const, n: data.length, reasons, diagnostics: { ...diagnostics, relativeIntervalDeviation: deviation } };
    return { state: 'established' as const, n: data.length, coefficients: { intercept, propertyArea: a, constructionArea: b }, ratio: r, interval: { lower: set.lower, upper: set.upper }, diagnostics: { ...diagnostics, relativeIntervalDeviation: deviation } };
}
