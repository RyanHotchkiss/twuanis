import {state,interactionKey} from './runtime'
type Pending={epoch:string;page:string;at:number;id:string;key:Promise<string>}
let pending:Pending|undefined
export function clearKnowledgeCommit(){pending=undefined}
export function commitKnowledgeSearch(locale:'en'|'es',data:FormData){
 const s=state();pending=undefined;if(s.mode==='off'||s.consent!=='granted')return
 const q=String(data.get('q')||''),category=String(data.get('category')||''),view=String(data.get('view')||'index');if(q.length>120||category.length>40||!['index','glossary'].includes(view))return
 try{const bytes=new TextEncoder().encode(JSON.stringify([locale,view,q,category,1]));const key=crypto.subtle.digest('SHA-256',bytes).then(v=>Array.from(new Uint8Array(v),x=>x.toString(16).padStart(2,'0')).join(''));pending={epoch:s.epoch,page:s.page,at:Date.now(),id:interactionKey(),key}}catch{}
}
export async function takeKnowledgeCommit(key:string){const p=pending;if(!p)return;try{if(await p.key!==key||pending!==p)return;pending=undefined;const s=state();if(s.consent!=='granted'||s.mode==='off'||s.epoch!==p.epoch||s.page!==p.page||Date.now()-p.at>30000)return;return p.id}catch{pending=undefined}}
