import type {MeasuredResult,ObservationSignal} from './action-receipt'
import {emitActionReceipt,state} from './runtime'

// Relay only an existing Server Action response. No extra endpoint, query or queue.
// A late result still reaches the customer after consent/account/navigation changes.
export async function deliverAction<T>(signal:ObservationSignal|undefined,work:()=>Promise<MeasuredResult<T>>):Promise<T>{
 const response=await work()
 try{
  const now=state(), receipt=response.measurement
  if(signal&&receipt?.request===signal.request&&Array.isArray(receipt.events)&&receipt.events.length<=3&&
    now.mode!=='off'&&now.consent==='granted'&&now.epoch===signal.epoch&&now.page===signal.page&&
    Date.now()>=signal.at&&Date.now()-signal.at<=600000){
   for(const event of receipt.events)emitActionReceipt(event,signal)
  }
 }catch{/* Optional measurement never changes the original result. */}
 return response.value
}
