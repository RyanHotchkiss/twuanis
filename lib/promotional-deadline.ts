// Presentation only: the server's resolved Offer/configuration remains pricing authority.
export function promotionalDeadline(value:string,language:'en'|'es') {
 const boundary=new Date(value)
 if(!Number.isFinite(boundary.getTime()))return null
 const zone='America/Costa_Rica'
 const clock=new Intl.DateTimeFormat('en-GB',{timeZone:zone,hourCycle:'h23',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(boundary)
 // Advertising configuration cutoffs are exclusive midnight; Offers end inclusively.
 const last=clock==='00:00:00'?new Date(boundary.getTime()-1):boundary
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(last)
 const number=(type:string)=>Number(parts.find(p=>p.type===type)?.value)
 const next=new Date(Date.UTC(number('year'),number('month')-1,number('day')+1,6))
 const format=(d:Date)=>new Intl.DateTimeFormat(language==='es'?'es-CR':'en-US',{timeZone:zone,dateStyle:'long'}).format(d)
 return {standardStartDate:format(next),offerEnds:language==='es'?`La oferta termina el ${format(last)}`:`Offer ends: ${format(last)}`,standardStarts:language==='es'?`El precio estándar comienza el ${format(next)}`:`Standard pricing begins ${format(next)}`}
}
