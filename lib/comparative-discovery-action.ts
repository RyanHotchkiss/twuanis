'use server'
import { executePhase14Application } from './phase14-application'
import { readPhase14OptionCatalog } from './phase14-option-catalog'

export async function analyzePhase14Market(input: unknown) { return executePhase14Application(input) }
export async function loadPhase14Options() { return readPhase14OptionCatalog() }
