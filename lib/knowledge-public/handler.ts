import 'server-only'
import {readFileSync} from 'node:fs'
import path from 'node:path'
import {createPublicHandlers} from './http'
import {publicKnowledge,readPublicationPolicy} from './runtime'
import {PublicError} from './service'
function admission(){return JSON.parse(readFileSync(path.join(process.cwd(),'lib/knowledge-public/hosting-admission.json'),'utf8')) as {status:string;origins:string[]}}
export const publicHandler=createPublicHandlers({service:publicKnowledge,policy:readPublicationPolicy,origins:()=>admission().origins,admit:async request=>{
 // Private development verification only. This branch cannot enable a production build.
 if(process.env.NODE_ENV==='development'&&process.env.TWUANIS_PUBLIC_KNOWLEDGE_LOCAL_REVIEW==='isolated-loopback'&&['127.0.0.1','localhost','[::1]'].includes(new URL(request.url).hostname))return
 // Runtime receipt is closed until actual hosting coverage/limits and exact release
 // are qualified. A process-local counter is not a distributed admission proof.
 throw new PublicError('INGRESS_UNQUALIFIED',503)
},log:event=>console.info(JSON.stringify(event))})
