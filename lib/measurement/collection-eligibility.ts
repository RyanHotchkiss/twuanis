// Public tri-state only: Owner identities and source addresses stay on the server.
export function resolvedMeasurementEligibility(server:'eligible'|'excluded'|'unknown'){return server==='eligible'?'eligible':server==='excluded'?'excluded':'pending'}
