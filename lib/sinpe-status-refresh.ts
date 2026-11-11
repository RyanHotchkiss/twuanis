// UI readback policy only. Never initiates or confirms a provider payment.
export const SINPE_STATUS_INTERVAL_MS=15000
export const SINPE_STATUS_MAX_AUTOMATIC_READS=20
export function sinpeStatusDelay(failures:number){return Math.min(60000,SINPE_STATUS_INTERVAL_MS*2**Math.min(Math.max(failures,0),2))}
export function sinpeStatusSettled(state:any,deadline:string,now:number){
 if(!state)return false
 const paid=state.canonicalPaid===true
 if(paid)return state.fulfillment==='COMPLETE'||state.fulfillment==='NEEDS_RESOLUTION'
 return !Number.isFinite(Date.parse(deadline))||now>Date.parse(deadline)||['failed','canceled'].includes(state.providerStatus)||['READY','EXPIRED','NEEDS_RESOLUTION','PAID_AWAITING_TIMING'].includes(state.initiation)
}

// Presentation deadline only: does not cancel or retry a financial operation.
export const SINPE_STATUS_TIMEOUT_MS=10000
export function boundedSinpeRead<T>(read:()=>Promise<T>,timeoutMs=SINPE_STATUS_TIMEOUT_MS):Promise<T>{
 return new Promise((resolve,reject)=>{
  let settled=false
  const timer=setTimeout(()=>{settled=true;reject(new Error('SINPE_STATUS_UNAVAILABLE'))},timeoutMs)
  Promise.resolve().then(read).then(value=>{if(!settled){settled=true;clearTimeout(timer);resolve(value)}},error=>{if(!settled){settled=true;clearTimeout(timer);reject(error)}})
 })
}
