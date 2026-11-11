// Presentation-only values. These are not analytical result DTOs or execution inputs.
export type SynthesisReference=Readonly<{path:string;value:number|string;scale?:number}>
export type SynthesisSegment=Readonly<{kind:'narrative';text:string}|{kind:'evidence';text:string;references:readonly SynthesisReference[];derivation?:'cohortSubtotal'}>
export type Synthesis=readonly SynthesisSegment[]
export const synthesisText=(segments:Synthesis)=>segments.map(s=>s.text).join('')
export function isSynthesis(value:unknown):value is Synthesis{return Array.isArray(value)&&value.every(s=>s&&typeof s.text==='string'&&(s.kind==='narrative'||s.kind==='evidence'&&Array.isArray(s.references)))}
