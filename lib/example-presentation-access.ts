'use server'
import {exampleRelease} from '@/app/components/engine-examples/registry'
import {authorizePopulationCapability,type AnalyticalCapability} from './package-capability-authorization'

// Display projection only. Run actions retain their own canonical authorization.
export async function readExamplePresentationAccess(engine:string,population:'PRIVATE'|'BANK'){
 if(!['PRIVATE','BANK'].includes(population)||typeof engine!=='string'||engine.length>80)return null
 const release=exampleRelease(engine)
 if(!release)return null
 try{return {account:await authorizePopulationCapability(release.capability as AnalyticalCapability,population)}}catch{return null}
}
