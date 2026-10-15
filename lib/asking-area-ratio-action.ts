'use server';
import { authorizePriceMeterIntelligenceExecution, PriceMeterComparableAuthenticationError, PriceMeterComparableAuthorizationError } from './price-meter-authorization';
import { parseRatioQuestion, type RatioResponse } from './asking-area-ratio-contract';
import { acquireAreaRatio, acquireAreaRatioOptions } from './asking-area-ratio-data';
import { analyzeAreaRatio, RATIO_METHOD } from './asking-area-ratio-math';
export async function executeAskingAreaRatio(input: unknown): Promise<RatioResponse> {
    try {
        await authorizePriceMeterIntelligenceExecution('cap-asking-area-coefficient-ratio');
        let question;
        try {
            question = parseRatioQuestion(input);
        }
        catch {
            return { error: 'invalid_question' };
        }
        const population = await acquireAreaRatio(question), result = analyzeAreaRatio(population.observations);
        // Explicit projection. Never serialize the acquired population or solver state.
        return { question, evidence: result.state === 'established' ? { state: result.state, n: result.n, coefficients: result.coefficients, ratio: result.ratio, interval: result.interval, diagnostics: result.diagnostics } : { state: result.state, n: result.n, reasons: result.reasons, diagnostics: result.diagnostics }, methodology: RATIO_METHOD.version, analyticalDate: population.analyticalDate, fx: population.fx, excluded: population.excluded, marketLabel: population.marketLabel, propertyTypeLabel: population.propertyTypeLabel };
    }
    catch (e) {
        if (e instanceof PriceMeterComparableAuthenticationError)
            return { access: 'authentication_required' };
        if (e instanceof PriceMeterComparableAuthorizationError)
            return { access: 'entitlement_required' };
        return { error: 'execution_unavailable' };
    }
}
export async function loadAreaRatioOptions() {
    await authorizePriceMeterIntelligenceExecution('cap-asking-area-coefficient-ratio');
    return acquireAreaRatioOptions();
}
