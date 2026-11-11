import type {PriceMeterComparableDimension} from './price-meter-comparable-dimensions'
import type {PriceMeterComparablePresentation} from './price-meter-comparable-presentation'
export class ComparableInputEvidenceError extends Error{
 readonly classification='unsupported_subject_dimensions'
 constructor(readonly unsupportedDimensions:PriceMeterComparableDimension[]){
  super('Selected dimensions lack unambiguous canonical subject evidence.');this.name='ComparableInputEvidenceError'
 }
}
export function validateComparableInputEvidence(selected:readonly PriceMeterComparableDimension[],configuration:Pick<PriceMeterComparablePresentation,'optionalDimensions'>):void{
 const supported=new Set(configuration.optionalDimensions.map(d=>d.dimension))
 const unsupported=selected.filter(d=>!supported.has(d))
 if(unsupported.length)throw new ComparableInputEvidenceError(unsupported)
}
