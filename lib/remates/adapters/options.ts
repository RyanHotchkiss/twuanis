/** Public review-control identifiers only; extraction profiles remain server-side. */
export const adapterIds=['bn','bcr','bp-inventory','bp-catalog','bp-auctions','bac'] as const
export function adapterVersion(id:typeof adapterIds[number]){return `remates-${id}-fixture-v1`}
