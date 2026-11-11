import type {Lens} from './lpi-contract'
export const LPI_PACKAGE_IDS=['pkg-geographic-distribution-price-range','pkg-matching-market-comparison','pkg-pricing-position-relationships'] as const
export function createPurchaseIntent(){
 let value:{lens:Lens;key:string;account:string|null;consumed:boolean}|null=null
 return {
  hold(lens:Lens,key:string,account:string|null){value={lens,key,account,consumed:false}},
  bind(account:string){if(!value||value.consumed)return false;if(value.account&&value.account!==account){value=null;return false}value.account=account;return true},
  discard(){value=null},
  async consume(key:string,account:string,verify:()=>Promise<boolean>){const intent=value;if(!intent||intent.consumed||intent.key!==key||intent.account!==account)return null;intent.consumed=true;if(!await verify()||value!==intent)return null;return intent.lens}
 }
}
