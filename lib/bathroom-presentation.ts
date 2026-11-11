import {bathroomFactConstraint,bathroomConstraintLabel,bathroomValueLabel} from './bathroom-selection'
export function bathroomPresentation(listing:Record<string,any>,language:'en'|'es'):string{
 // An explicit canonical null means unknown, never a legacy fallback.
 const fact=listing.bathroom_evidence??listing.canonicalEvidence?.facts?.find((f:any)=>f.dimension==='bathrooms')
 if(fact){try{const c=bathroomFactConstraint(fact);return c?bathroomConstraintLabel(c,language):''}catch{return ''}}
 if(Object.hasOwn(listing,'bathroom_evidence')||listing.canonicalEvidence)return ''
 return bathroomValueLabel(listing.bathrooms,language)
}
