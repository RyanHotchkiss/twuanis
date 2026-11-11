import 'server-only'
import {createHmac,timingSafeEqual} from 'node:crypto'
export type CaseKind='access'|'correction'|'measurement_erasure'
export type CaseProof={v:1;caseId:string;accountId:string;kind:CaseKind;issuedAt:number;expiresAt:number}
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
export function privacyRightsEnabled(){
 try{const local=process.env.TWUANIS_PRIVACY_RIGHTS_LOCAL==='1'&&['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL||'').hostname)
 return local||process.env.TWUANIS_PRIVACY_RIGHTS_ENABLED==='1'&&process.env.TWUANIS_MEASUREMENT_PRIVACY_APPROVED==='1'&&process.env.NEXT_PUBLIC_SUPABASE_URL==='https://szhpqemhjyvvqgjgsmsw.supabase.co'}catch{return false}
}
function key(){const k=process.env.TWUANIS_PRIVACY_CASE_SECRET;if(!k||!/^[a-f0-9]{64}$/.test(k))throw Error('privacy_unconfigured');return Buffer.from(k,'hex')}
export function validCaseInput(x:unknown):x is{caseId:string;expectedAccount:string;kind:CaseKind;cursor?:string}{
 if(!x||typeof x!=='object'||Array.isArray(x))return false;const v=x as Record<string,unknown>
 return Object.keys(v).every(k=>['caseId','expectedAccount','kind','cursor'].includes(k))&&typeof v.caseId==='string'&&uuid.test(v.caseId)&&typeof v.expectedAccount==='string'&&uuid.test(v.expectedAccount)&&['access','correction','measurement_erasure'].includes(String(v.kind))&&(v.cursor===undefined||typeof v.cursor==='string'&&/^[a-f0-9]{64}$/.test(v.cursor))
}
// This is a statement of verified account identity at issuance, NOT a credential,
// deletion command or new identity authority. Only canonical Auth can issue it.
export function issueCaseProof(accountId:string,caseId:string,kind:CaseKind,now=Date.now()){
 if(!uuid.test(accountId)||!uuid.test(caseId)||!['access','correction','measurement_erasure'].includes(kind)||!Number.isSafeInteger(now))throw Error('privacy_invalid')
 const proof:CaseProof={v:1,caseId,accountId,kind,issuedAt:now,expiresAt:now+7*86400000};const payload=Buffer.from(JSON.stringify(proof)).toString('base64url')
 return payload+'.'+createHmac('sha256',key()).update('twuanis-privacy-case-v1:'+payload).digest('base64url')
}
export function verifyCaseProof(raw:unknown,now=Date.now()):CaseProof|null{
 try{if(typeof raw!=='string'||raw.length>1400||!Number.isSafeInteger(now))return null;const pieces=raw.split('.');if(pieces.length!==2||!pieces.every(p=>/^[A-Za-z0-9_-]+$/.test(p)))return null
 const expected=createHmac('sha256',key()).update('twuanis-privacy-case-v1:'+pieces[0]).digest(),actual=Buffer.from(pieces[1],'base64url');if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return null
 const p=JSON.parse(Buffer.from(pieces[0],'base64url').toString('utf8')) as CaseProof
 if(Object.keys(p).sort().join(',')!=='accountId,caseId,expiresAt,issuedAt,kind,v'||p.v!==1||!uuid.test(p.accountId)||!uuid.test(p.caseId)||!['access','correction','measurement_erasure'].includes(p.kind)||!Number.isSafeInteger(p.issuedAt)||!Number.isSafeInteger(p.expiresAt)||p.issuedAt>now||p.expiresAt!==p.issuedAt+7*86400000||now>=p.expiresAt)return null
 return p}catch{return null}
}
