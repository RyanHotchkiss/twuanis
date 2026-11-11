import 'server-only'
import {headers} from 'next/headers'
export async function privacyDraftVisible(){
 const host=(await headers()).get('host')||''
 if(process.env.VERCEL_ENV==='production'&&/^(twuanis\.com|www\.twuanis\.com)(:443)?$/.test(host))return true
 if(process.env.TWUANIS_PRIVACY_LOCAL_PREVIEW!=='1'||process.env.VERCEL)return false
 return /^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host)
}
