import 'server-only'
import {readFileSync} from 'node:fs'
import path from 'node:path'
import {readTermKnowledge,verifyTermKnowledgeRevision,readApprovedCanonicalEdges} from '@/lib/knowledge-repository/terms'
import {createPublicKnowledge,type PublicDependencies} from './service'
import {publicCanonicalClient} from './source'
import type {PublicationManifest} from './publication'
export function readPublicationPolicy():PublicationManifest{return JSON.parse(readFileSync(path.join(process.cwd(),'lib/knowledge-repository/machine-publication.json'),'utf8'))}
export const dependencies:PublicDependencies={policy:readPublicationPolicy,read:signal=>readTermKnowledge(signal,publicCanonicalClient()),verify:(revision,signal)=>verifyTermKnowledgeRevision(revision,signal,publicCanonicalClient()),edges:(id,allowed,signal)=>readApprovedCanonicalEdges(id,allowed,signal,publicCanonicalClient())}
export const publicKnowledge=createPublicKnowledge(dependencies)
