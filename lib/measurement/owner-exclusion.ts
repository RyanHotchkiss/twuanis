import 'server-only'
// Verified Owner UUID is an exclusion authority, never an exported analytics identifier.
export const MEASUREMENT_OWNER_ID='d81064bc-1b4a-478f-8f6a-b263c4779bc1'
export function measurementOwnerExcluded(account:string|null|undefined){return account?.toLowerCase()===MEASUREMENT_OWNER_ID}

