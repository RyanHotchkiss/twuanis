import type {Peer} from './property-price-valuation-contract'
export type PeerSort='title'|'priceCrc'|'propertyArea'|'constructionArea'
export function sortValuationPeers(rows:Peer[],key:PeerSort,direction:'asc'|'desc'):Peer[]{
 return [...rows].sort((a,b)=>{const x=a[key],y=b[key];if(x===null&&y!==null)return 1;if(y===null&&x!==null)return -1;const c=typeof x==='string'&&typeof y==='string'?(x<y?-1:x>y?1:0):typeof x==='number'&&typeof y==='number'?x-y:0;return c*(direction==='asc'?1:-1)||(a.id<b.id?-1:a.id>b.id?1:0)})
}
