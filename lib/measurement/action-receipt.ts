// Browser-safe transport types only. Business results stay separate from telemetry.
import type {EventName} from './types'
export type ObservationSignal = {
 journey?:import('./journey-contract').JourneyProof; consent:'granted'; epoch:string; page:string; request:string; at:number
 locale:'en'|'es'; environment:'isolated_test'|'production'
}
export type Projection = {name:EventName;parameters:Record<string,unknown>}
export type MeasuredResult<T> = {value:T;measurement:{request:string;events:Projection[]}|null}
