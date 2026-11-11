import {checkoutSelection,type CheckoutSelection} from './checkout-selection'
import {packagePurchaseStorageKey} from './package-payment-price'

export type RecoveryOrder={id:string;kind?:string;product:string;currency:string;amount:string;deadline?:string;state?:string;paid?:boolean;fulfilled?:boolean;receiptActivated?:boolean;paymentMethod?:string;termUnit?:string;bankUpgradeSelected?:boolean}
export type PackageRecovery={kind:'new'}|{kind:'pending'|'expired'|'completed'|'incompatible'|'review';order?:RecoveryOrder}
type PurchaseStorage=Pick<Storage,'getItem'|'setItem'|'removeItem'|'key'|'length'>
export function methodPurchaseKey(account:string,selection:Pick<CheckoutSelection,'product'|'duration'|'bank'|'provider'>){return packagePurchaseStorageKey(account,selection.product,selection.duration,selection.bank)+':'+selection.provider}
export function classifyPackageOrder(order:RecoveryOrder,selection:CheckoutSelection,now=Date.now()):PackageRecovery{
 if(order.product!==selection.product||order.kind&&order.kind!=='package'||order.termUnit&&order.termUnit!==selection.duration||typeof order.bankUpgradeSelected==='boolean'&&order.bankUpgradeSelected!==selection.bank)return{kind:'review',order}
 if(order.paid||order.fulfilled||order.receiptActivated)return{kind:'completed',order}
 const deadline=Date.parse(order.deadline??'')
 if(!Number.isFinite(deadline))return{kind:'review',order}
 if(deadline<=now||order.state==='EXPIRED')return{kind:'expired',order}
 if(order.currency!==selection.currency||selection.provider==='sinpe'&&order.paymentMethod!=='direct_sinpe')return{kind:'incompatible',order}
 return{kind:'pending',order}
}
export async function recoverPackagePurchase(storage:PurchaseStorage,account:string,selection:CheckoutSelection,read:(id:string)=>Promise<RecoveryOrder|null>):Promise<PackageRecovery>{
 const key=methodPurchaseKey(account,selection),scoped=storage.getItem(key+':order')
 if(scoped){const order=await read(scoped);return order?classifyPackageOrder(order,selection):{kind:'review'}}
 if(storage.getItem(key))return{kind:'new'}
 const base=packagePurchaseStorageKey(account,selection.product,selection.duration,selection.bank),other=base+':'+(selection.provider==='stripe'?'sinpe':'stripe'),candidates=new Map<string,string>()
 for(const k of [base,other]){const id=storage.getItem(k+':order');if(id)candidates.set(id,k)}
 for(let i=0,n=storage.length;i<n;i++){
  const k=storage.key(i);if(!k?.startsWith('tw-checkout:/checkout?')||!k.endsWith(':order'))continue
  const old=checkoutSelection(new URLSearchParams(k.slice('tw-checkout:/checkout?'.length,-':order'.length)))
  if(old?.kind==='package'&&old.product===selection.product&&old.duration===selection.duration&&old.bank===selection.bank){const id=storage.getItem(k);if(id)candidates.set(id,k.slice(0,-6))}
  if(candidates.size>25)return{kind:'review'}
 }
 const found:{order:RecoveryOrder;source:string;state:PackageRecovery}[]=[]
 for(const[id,source]of candidates){const order=await read(id);if(!order)return{kind:'review'};found.push({order,source,state:classifyPackageOrder(order,selection)})}
 const compatible=found.filter(x=>x.state.kind==='pending')
 if(compatible.length>1)return{kind:'review'}
 if(compatible.length===1){const x=compatible[0];storage.setItem(key+':order',x.order.id);const request=storage.getItem(x.source);if(request)storage.setItem(key,request);return x.state}
 if(found.some(x=>x.state.kind==='review'))return{kind:'review',order:found.find(x=>x.state.kind==='review')?.order}
 if(found.length)return found.find(x=>x.state.kind==='incompatible')?.state??found[0].state
 return{kind:'new'}
}
export function beginNewPackageAttempt(storage:PurchaseStorage,key:string,request:string){storage.setItem(key,request);storage.removeItem(key+':order')}
