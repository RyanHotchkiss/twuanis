import * as actions from '@/app/measurement/actions'
import {deliverAction} from './action-delivery'
import type {ObservationSignal} from './action-receipt'
export function measuredPurchase(...args:Parameters<typeof actions.measuredPurchase>){return deliverAction(args[1],()=>actions.measuredPurchase(...args))}
export function measuredMarketQuestion(...args:Parameters<typeof actions.measuredMarketQuestion>){return deliverAction(args[args.length-1] as ObservationSignal|undefined,()=>actions.measuredMarketQuestion(...args))}
export function measuredPriceMeterApply(...args:Parameters<typeof actions.measuredPriceMeterApply>){return deliverAction(args[args.length-1] as ObservationSignal|undefined,()=>actions.measuredPriceMeterApply(...args))}
export function measuredPosition(...args:Parameters<typeof actions.measuredPosition>){return deliverAction(args[args.length-1] as ObservationSignal|undefined,()=>actions.measuredPosition(...args))}
export function measuredComparables(...args:Parameters<typeof actions.measuredComparables>){return deliverAction(args[args.length-1] as ObservationSignal|undefined,()=>actions.measuredComparables(...args))}
export function measuredRatio(...args:Parameters<typeof actions.measuredRatio>){return deliverAction(args[args.length-1] as ObservationSignal|undefined,()=>actions.measuredRatio(...args))}
export function measuredWeighted(...args:Parameters<typeof actions.measuredWeighted>){return deliverAction(args[args.length-1] as ObservationSignal|undefined,()=>actions.measuredWeighted(...args))}
export function measuredAskingPrice(...args:Parameters<typeof actions.measuredAskingPrice>){return deliverAction(args[args.length-1] as ObservationSignal|undefined,()=>actions.measuredAskingPrice(...args))}
export function measuredCohort(...args:Parameters<typeof actions.measuredCohort>){return deliverAction(args[args.length-1] as ObservationSignal|undefined,()=>actions.measuredCohort(...args))}
export function measuredCross(...args:Parameters<typeof actions.measuredCross>){return deliverAction(args[args.length-1] as ObservationSignal|undefined,()=>actions.measuredCross(...args))}
export function measuredDiscovery(...args:Parameters<typeof actions.measuredDiscovery>){return deliverAction(args[args.length-1] as ObservationSignal|undefined,()=>actions.measuredDiscovery(...args))}
export function measuredReadReport(...args:Parameters<typeof actions.measuredReadReport>){return deliverAction(args[args.length-1] as ObservationSignal|undefined,()=>actions.measuredReadReport(...args))}
export function measuredBank(...args:Parameters<typeof actions.measuredBank>){return deliverAction(args[2],()=>actions.measuredBank(...args))}
export function measuredListingLens(...args:Parameters<typeof actions.measuredListingLens>){return deliverAction(args[1],()=>actions.measuredListingLens(...args))}
