import 'server-only'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {createHash} from 'node:crypto'
import {createRequire} from 'node:module'

/** Protected, retained software release; callers supply an authorized report's release. */
export function loadHistoricalRelease(releaseId:string) {
 if(!/^[a-f0-9]{64}$/.test(releaseId))throw Error('Historical methodology release unavailable.')
 const root=join(process.cwd(),'server-archives')
 const record=JSON.parse(readFileSync(join(root,releaseId+'.json'),'utf8'))
 const hash=(v:string|Buffer)=>createHash('sha256').update(v).digest('hex')
 if(record.id!==releaseId||hash(JSON.stringify(record.manifest))!==releaseId||record.manifest.schema!=='twuanis-methodology-release-v1'||record.manifest.runtime!==process.version||!/^[a-f0-9]{64}$/.test(record.manifest.archiveSha256))throw Error('Historical methodology release unavailable.')
 const file=join(root,record.manifest.archiveSha256+'.cjs')
 if(hash(readFileSync(file))!==record.manifest.archiveSha256)throw Error('Historical methodology archive unavailable.')
 // No customer route exports this loader or the retained proprietary archive.
 return {manifest:record.manifest,software:createRequire(file)(file)}
}
