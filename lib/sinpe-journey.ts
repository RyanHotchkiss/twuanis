// Presentation only: amounts and status remain supplied by canonical readers.
export function sinpeMoney(amount:string|number){
 const value=Number(amount)
 if(!Number.isFinite(value))return '—'
 return '₡'+new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value).replace(/,/g,' ').replace('.',',')
}
export function sinpeDestination(instructions:string){return instructions.match(/\+506[ -]?\d{4}[ -]?\d{4}/)?.[0]??null}
export function existingCoverage(rights:any[],legacy:any[],product:string,capabilities:string[]){
 const modern=rights.filter(r=>r.class==='PACKAGE'&&r.product===product&&['ACTIVE','SCHEDULED'].includes(r.state)&&['ADMIN_GRANT','PURCHASED'].includes(r.source)&&Number.isFinite(Date.parse(r.startsAt))&&Number.isFinite(Date.parse(r.endsAt)))
 const older=capabilities.length?legacy.filter(r=>Array.isArray(r.capabilities)&&capabilities.every(c=>r.capabilities.includes(c))&&Number.isFinite(Date.parse(r.endsAt))):[]
 return [...modern,...older]
}
